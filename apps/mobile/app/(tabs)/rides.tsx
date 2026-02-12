import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
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

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    apiFetch<RideData[]>('/api/rides').then((res) => {
      if (res.success && res.data) setRides(res.data);
      setLoading(false);
    });
  }, [user]);

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
    return `${mins} dk`;
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
                <View style={[styles.badge, item.status === 'active' ? styles.badgeActive : styles.badgeComplete]}>
                  <Text style={[styles.badgeText, { color: item.status === 'active' ? '#60a5fa' : '#10b981' }]}>
                    {item.status === 'active' ? 'Aktif' : 'Tamamlandı'}
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
  badgeText: { fontSize: 12, fontWeight: '700' },
  route: { fontSize: 14, color: '#aaa', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: '#666' },
  cost: { fontSize: 15, fontWeight: '800', color: '#10b981' },
  loginBtn: { backgroundColor: '#10b981', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
