import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../lib/auth';
import type { Station } from '@totallybike/shared';
import { SOCKET_EVENTS } from '@totallybike/shared';

interface ActiveRide {
  id: string;
  startTime: string;
  bike: { id: string; qrCode: string; batteryLevel: number };
  startStation: { id: string; name: string };
}

export default function MapScreen() {
  const [stations, setStations] = useState<Station[]>([]);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  // Request location permission on first launch
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        mapRef.current?.animateToRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    })();
  }, []);

  const fetchStations = useCallback(async () => {
    const res = await apiFetch<Station[]>('/api/stations');
    if (res.success && res.data) setStations(res.data);
  }, []);

  const fetchActiveRide = useCallback(async () => {
    if (!user) return;
    const res = await apiFetch<ActiveRide>('/api/rides/active');
    if (res.success) setActiveRide(res.data || null);
  }, [user]);

  useEffect(() => {
    fetchStations();
    fetchActiveRide();

    const socket = getSocket();
    socket.on(SOCKET_EVENTS.STATION_UPDATE, fetchStations);
    socket.on(SOCKET_EVENTS.RIDE_STARTED, fetchActiveRide);
    socket.on(SOCKET_EVENTS.RIDE_ENDED, fetchActiveRide);

    return () => {
      socket.off(SOCKET_EVENTS.STATION_UPDATE);
      socket.off(SOCKET_EVENTS.RIDE_STARTED);
      socket.off(SOCKET_EVENTS.RIDE_ENDED);
    };
  }, [fetchStations, fetchActiveRide]);

  // Active ride timer
  useEffect(() => {
    if (!activeRide) { setElapsed(0); return; }
    const start = new Date(activeRide.startTime).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRide]);

  const getMarkerColor = (station: Station) => {
    const ratio = station.totalSlots > 0 ? station.availableBikes / station.totalSlots : 0;
    if (ratio > 0.5) return '#10b981';
    if (ratio > 0) return '#f59e0b';
    return '#ef4444';
  };

  const handleScan = () => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Bisiklet kiralamak için giriş yapmalısınız.', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Giriş Yap', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    router.push('/scan');
  };

  const endRide = async (stationId: string) => {
    if (!activeRide) return;
    const res = await apiFetch<{ cost: number }>(`/api/rides/${activeRide.id}/end`, {
      method: 'POST',
      body: JSON.stringify({ stationId }),
    });
    if (res.success) {
      setActiveRide(null);
      fetchStations();
      const cost = res.data?.cost ?? 0;
      Alert.alert('Sürüş Tamamlandı', `Toplam ücret: ${cost.toFixed(2)} TL\nTeşekkürler, iyi günler!`);
    } else {
      Alert.alert('Hata', res.error || 'Sürüş bitirilemedi');
    }
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsMyLocationButton
        initialRegion={{
          latitude: 41.0840,
          longitude: 29.0510,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        customMapStyle={mapStyle}
      >
        {stations.map((station) => (
          <Marker
            key={station.id}
            coordinate={{ latitude: station.latitude, longitude: station.longitude }}
            pinColor={getMarkerColor(station)}
            onPress={() => {
              if (activeRide && station.availableDocks > 0) {
                Alert.alert(
                  station.name,
                  `Bisikleti bu istasyona bırakmak istiyor musunuz?\n\nMüsait dock: ${station.availableDocks}`,
                  [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Buraya Bırak', style: 'destructive', onPress: () => endRide(station.id) },
                  ],
                );
              }
            }}
          >
            <Callout>
              <View style={{ minWidth: 160, padding: 4 }}>
                <Text style={{ fontWeight: '700', marginBottom: 4 }}>{station.name}</Text>
                <Text style={{ fontSize: 13 }}>Bisiklet: {station.availableBikes} | Dock: {station.availableDocks}</Text>
                {activeRide && station.availableDocks > 0 && (
                  <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600', marginTop: 6 }}>Bırakmak için istasyona dokunun</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Top status bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>TotallyBike</Text>
        {user ? (
          <View style={styles.balancePill}>
            <Text style={styles.balanceText}>{user.balance.toFixed(0)} TL</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.loginPill} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginPillText}>Giriş Yap</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active Ride Card */}
      {activeRide && (
        <View style={styles.rideCard}>
          <View style={styles.rideCardTop}>
            <View>
              <Text style={styles.rideCardTitle}>Sürüş Aktif</Text>
              <Text style={styles.rideCardBike}>{activeRide.bike.qrCode}</Text>
            </View>
            <View style={styles.timerBox}>
              <Text style={styles.timerText}>{minutes}:{String(seconds).padStart(2, '0')}</Text>
            </View>
          </View>
          <View style={styles.rideCardBottom}>
            <Text style={styles.rideCardInfo}>Batarya: {activeRide.bike.batteryLevel}%</Text>
            <Text style={styles.rideCardInfo}>
              Tahmini: {(5 + Math.max(0, Math.floor(elapsed / 60) - 15) * 0.5).toFixed(2)} TL
            </Text>
          </View>
          <TouchableOpacity
            style={styles.endRideBtn}
            onPress={() => {
              Alert.alert(
                'Sürüşü Bitir',
                'Hangi istasyona bırakıyorsunuz?',
                [
                  { text: 'İptal', style: 'cancel' },
                  ...stations
                    .filter(s => s.availableDocks > 0)
                    .map(s => ({
                      text: `${s.name} (${s.availableDocks} dock)`,
                      onPress: () => endRide(s.id),
                    })),
                ]
              );
            }}
          >
            <Text style={styles.endRideBtnText}>Bisikleti Bırak</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom action */}
      {!activeRide && (
        <TouchableOpacity style={styles.scanButton} onPress={handleScan} activeOpacity={0.8}>
          <Text style={styles.scanButtonText}>Bisiklet Kirala</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  map: { flex: 1 },
  topBar: {
    position: 'absolute', top: 50, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(17,17,17,0.85)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16,
  },
  logo: { fontSize: 20, fontWeight: '800', color: '#fff' },
  balancePill: { backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  balanceText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  loginPill: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  loginPillText: { color: '#111', fontWeight: '700', fontSize: 14 },
  rideCard: {
    position: 'absolute', bottom: 32, left: 16, right: 16,
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  rideCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rideCardTitle: { color: '#10b981', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  rideCardBike: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  timerBox: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  timerText: { color: '#fff', fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  rideCardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  rideCardInfo: { color: '#888', fontSize: 13 },
  endRideBtn: {
    marginTop: 12,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  endRideBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  scanButton: {
    position: 'absolute', bottom: 32, left: 16, right: 16,
    backgroundColor: '#10b981', paddingVertical: 18, borderRadius: 14,
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  scanButtonText: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 },
});
