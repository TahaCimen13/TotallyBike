import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/auth';

interface RideData {
  id: string;
  startTime: string;
  endTime: string | null;
  cost: number;
  status: string;
  bike: { qrCode: string };
  startStation: { name: string };
  endStation: { name: string } | null;
}

export default function RidesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [rides, setRides] = useState<RideData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRides = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const res = await apiFetch<RideData[]>('/api/rides');
    if (res.success && res.data) setRides(res.data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  const cancelRide = async (rideId: string) => {
    Alert.alert(
      'Sürüşü İptal Et',
      'Sürüşünüzü iptal etmek istiyor musunuz? Kilit açma ücreti iade edilecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            const res = await apiFetch(`/api/rides/${rideId}/cancel`, { method: 'POST' });
            if (res.success) {
              Alert.alert('İptal Edildi', `${(res.data as any)?.refunded?.toFixed(2) ?? '5.00'} TL iade edildi.`);
              fetchRides();
            } else {
              Alert.alert('Hata', (res as any).error || 'İptal edilemedi');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#888', fontSize: 16, marginBottom: 16 }}>Sürüş geçmişini görmek için giriş yapın</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBtnText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'Devam ediyor';
    const mins = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    return mins < 60 ? `${mins} dk` : `${Math.floor(mins / 60)} sa ${mins % 60} dk`;
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.empty}>Yükleniyor...</Text>
      ) : rides.length === 0 ? (
        <Text style={styles.empty}>Henüz sürüş yapmadınız.</Text>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.bikeCode}>{item.bike.qrCode}</Text>
                <View style={[
                  styles.badge,
                  item.status === 'active' ? styles.badgeActive :
                  item.status === 'cancelled' ? styles.badgeCancelled : styles.badgeComplete,
                ]}>
                  <Text style={[styles.badgeText, {
                    color: item.status === 'active' ? '#60a5fa' :
                           item.status === 'cancelled' ? '#f59e0b' : '#10b981',
                  }]}>
                    {item.status === 'active' ? 'Aktif' : item.status === 'cancelled' ? 'İptal' : 'Tamamlandı'}
                  </Text>
                </View>
              </View>
              <Text style={styles.route}>
                {item.startStation.name} → {item.endStation?.name || '...'}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.meta}>{formatDate(item.startTime)}</Text>
                <Text style={styles.meta}>{formatDuration(item.startTime, item.endTime)}</Text>
                <Text style={styles.cost}>{item.cost.toFixed(2)} TL</Text>
              </View>
              {item.status === 'active' && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelRide(item.id)}>
                  <Text style={styles.cancelBtnText}>Sürüşü İptal Et</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  empty: { textAlign: 'center', marginTop: 48, color: '#666', fontSize: 16 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 14, padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bikeCode: { fontWeight: '800', fontSize: 16, color: '#fff' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  badgeActive: { backgroundColor: 'rgba(96,165,250,0.15)' },
  badgeComplete: { backgroundColor: 'rgba(16,185,129,0.15)' },
  badgeCancelled: { backgroundColor: 'rgba(245,158,11,0.15)' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  route: { fontSize: 14, color: '#aaa', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: '#666' },
  cost: { fontSize: 15, fontWeight: '800', color: '#10b981' },
  cancelBtn: { marginTop: 10, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 8, padding: 10, alignItems: 'center' },
  cancelBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },
  loginBtn: { backgroundColor: '#10b981', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
