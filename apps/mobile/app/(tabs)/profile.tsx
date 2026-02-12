import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAuth } from '../../lib/auth';
import { apiFetch } from '../../lib/api';

export default function ProfileScreen() {
  const { user, login, register, logout, refreshUser } = useAuth();
  const [rideCount, setRideCount] = useState(0);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      apiFetch<any[]>('/api/rides').then((res) => {
        if (res.success && res.data) setRideCount(res.data.length);
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    const result = mode === 'login'
      ? await login(email, password)
      : await register(email, password, name);
    if (!result.success) {
      Alert.alert('Hata', result.error || 'İşlem başarısız');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
  };

  // Not logged in — show auth form
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>
            {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </Text>
          <Text style={styles.authSubtitle}>
            {mode === 'login' ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun'}
          </Text>

          {mode === 'register' && (
            <TextInput
              style={styles.input}
              placeholder="Ad Soyad"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.submitButtonText}>
              {loading ? 'Yükleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ marginTop: 16 }}>
            <Text style={styles.switchText}>
              {mode === 'login' ? 'Hesabınız yok mu? Kayıt Ol' : 'Zaten hesabınız var mı? Giriş Yap'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Logged in — show profile
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

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 20 },
  // Auth
  authCard: { flex: 1, justifyContent: 'center' },
  authTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6 },
  authSubtitle: { fontSize: 15, color: '#888', marginBottom: 28 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 16, fontSize: 16, color: '#fff', marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  submitButton: { backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  submitButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  switchText: { color: '#10b981', fontSize: 14, textAlign: 'center' },
  // Profile
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
