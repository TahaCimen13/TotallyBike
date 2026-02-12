import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { apiFetch } from '../lib/api';

interface BikeInfo {
  id: string;
  qrCode: string;
  batteryLevel: number;
  status: string;
  station: { id: string; name: string } | null;
}

export default function ScanScreen() {
  const [qrCode, setQrCode] = useState('');
  const [bike, setBike] = useState<BikeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const searchBike = async (code?: string) => {
    const searchCode = (code || qrCode).trim();
    if (!searchCode) return;
    setLoading(true);
    setBike(null);

    const res = await apiFetch<BikeInfo>(`/api/bikes/${searchCode}`);
    if (res.success && res.data) {
      setBike(res.data);
    } else {
      Alert.alert('Hata', res.error || 'Bisiklet bulunamadı');
    }
    setLoading(false);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    const code = data.toUpperCase();
    setQrCode(code);
    searchBike(code);
    // Allow re-scan after 3 seconds
    setTimeout(() => setScanned(false), 3000);
  };

  const unlockBike = async () => {
    if (!bike) return;
    setLoading(true);

    const res = await apiFetch(`/api/bikes/${bike.id}/unlock`, { method: 'POST' });
    if (res.success) {
      Alert.alert('Başarılı', 'Bisiklet kilidi açıldı! İyi sürüşler!', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Hata', res.error || 'Kilit açılamadı');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Manual input section */}
      <Text style={styles.info}>Bisiklet kodunu girin veya QR kodu tarayın</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="QR Kod (ör: KUZEY-BIKE-001)"
          placeholderTextColor="#666"
          value={qrCode}
          onChangeText={(text) => setQrCode(text.toUpperCase())}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => searchBike()} disabled={loading}>
          <Text style={styles.searchBtnText}>Ara</Text>
        </TouchableOpacity>
      </View>

      {/* Bike result card */}
      {bike && (
        <View style={styles.bikeCard}>
          <Text style={styles.bikeCode}>{bike.qrCode}</Text>
          <View style={styles.bikeDetails}>
            <Text style={styles.bikeDetail}>Batarya: {bike.batteryLevel}%</Text>
            <Text style={styles.bikeDetail}>
              {bike.status === 'available' ? 'Müsait' : bike.status === 'in_use' ? 'Kullanımda' : 'Bakımda'}
            </Text>
          </View>
          {bike.station && <Text style={styles.bikeStation}>{bike.station.name}</Text>}

          {bike.status === 'available' ? (
            <TouchableOpacity style={styles.unlockBtn} onPress={unlockBike} disabled={loading}>
              <Text style={styles.unlockBtnText}>
                {loading ? 'Açılıyor...' : 'Kilidi Aç — 5.00 TL'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.unavailable}>Bu bisiklet şu anda müsait değil.</Text>
          )}
        </View>
      )}

      {/* QR Camera scanner */}
      {!bike && (
        <View style={styles.cameraSection}>
          <Text style={styles.cameraLabel}>QR Kodu Tara</Text>
          <View style={styles.cameraWrapper}>
            {permission?.granted ? (
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
            ) : (
              <View style={styles.cameraPlaceholder}>
                <Text style={styles.cameraPlaceholderText}>Kamera izni gerekli</Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                  <Text style={styles.permissionBtnText}>İzin Ver</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Scan overlay */}
            <View style={styles.scanOverlay}>
              <View style={styles.scanCornerTL} />
              <View style={styles.scanCornerTR} />
              <View style={styles.scanCornerBL} />
              <View style={styles.scanCornerBR} />
            </View>
          </View>
          {scanned && (
            <Text style={styles.scannedHint}>Tarandı! Tekrar taramak için bekleyin...</Text>
          )}
        </View>
      )}
    </View>
  );
}

const CORNER = { position: 'absolute' as const, width: 24, height: 24, borderColor: '#10b981' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
  info: { fontSize: 14, color: '#888', marginBottom: 16, textAlign: 'center' },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#222', borderRadius: 10, padding: 16, fontSize: 16, color: '#fff' },
  searchBtn: { backgroundColor: '#10b981', borderRadius: 10, paddingHorizontal: 22, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  bikeCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 16 },
  bikeCode: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 10 },
  bikeDetails: { flexDirection: 'row', gap: 16, marginBottom: 6 },
  bikeDetail: { fontSize: 14, color: '#aaa' },
  bikeStation: { fontSize: 14, color: '#888', marginBottom: 16 },
  unlockBtn: { backgroundColor: '#10b981', borderRadius: 12, padding: 18, alignItems: 'center' },
  unlockBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  unavailable: { color: '#666', marginTop: 12, textAlign: 'center', fontSize: 14 },
  // Camera section
  cameraSection: { flex: 1 },
  cameraLabel: { fontSize: 14, fontWeight: '600', color: '#888', textAlign: 'center', marginBottom: 12 },
  cameraWrapper: { flex: 1, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  camera: { flex: 1 },
  cameraPlaceholder: { flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  cameraPlaceholderText: { color: '#666', fontSize: 15, marginBottom: 12 },
  permissionBtn: { backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  permissionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scannedHint: { color: '#10b981', fontSize: 13, textAlign: 'center', marginTop: 10 },
  // Scan overlay corners
  scanOverlay: { position: 'absolute', top: '20%', left: '15%', right: '15%', bottom: '20%' },
  scanCornerTL: { ...CORNER, top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  scanCornerTR: { ...CORNER, top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  scanCornerBL: { ...CORNER, bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  scanCornerBR: { ...CORNER, bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
});
