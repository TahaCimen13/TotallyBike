import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { apiFetch } from '../../lib/api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [rideCount, setRideCount] = useState(0);

  useEffect(() => {
    if (user) {
      apiFetch<any[]>('/api/rides').then((res) => {
        if (res.success && res.data) setRideCount(res.data.length);
      });
    }
  }, [user]);

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.guestTitle}>Hesabınıza giriş yapın</Text>
        <Text style={styles.guestSub}>Sürüş başlatmak ve bakiye yönetmek için giriş yapmanız gerekiyor.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginBtnText}>Giriş Yap</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerBtnText}>Hesap Oluştur</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user.balance.toFixed(2)} TL</Text>
          <Text style={styles.statLabel}>Bakiye</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{rideCount}</Text>
          <Text style={styles.statLabel}>Toplam Sürüş</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={() => { logout(); router.replace('/(auth)/login'); }}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 20 },
  guestTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' },
  guestSub: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  loginBtn: { backgroundColor: '#10b981', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, marginBottom: 12 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerBtn: { paddingVertical: 12 },
  registerBtnText: { color: '#10b981', fontSize: 15 },
  profileHeader: { alignItems: 'center', paddingTop: 32, marginBottom: 28 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: '#888' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 14, padding: 20, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#10b981', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#888' },
  logoutButton: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
