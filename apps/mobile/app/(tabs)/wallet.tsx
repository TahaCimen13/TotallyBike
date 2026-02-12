import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const QUICK_AMOUNTS = [20, 50, 100];

export default function WalletScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    apiFetch<{ balance: number }>('/api/wallet/balance').then((res) => {
      if (res.success && res.data) setBalance(res.data.balance);
      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#888', fontSize: 16, marginBottom: 16 }}>Cüzdanı kullanmak için giriş yapın</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBtnText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleTopup = async (amount: number) => {
    const res = await apiFetch<{ balance: number }>('/api/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    if (res.success && res.data) {
      setBalance(res.data.balance);
      refreshUser();
      Alert.alert('Başarılı', `${amount.toFixed(2)} TL yüklendi!`);
      setCustomAmount('');
    } else {
      Alert.alert('Hata', res.error || 'Yükleme başarısız');
    }
  };

  return (
    <View style={styles.container}>
      {/* Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Güncel Bakiye</Text>
        <Text style={styles.balanceAmount}>
          {loading ? '...' : `${balance.toFixed(2)} TL`}
        </Text>
      </View>

      {/* Quick Topup */}
      <Text style={styles.sectionTitle}>Hızlı Yükleme</Text>
      <View style={styles.quickButtons}>
        {QUICK_AMOUNTS.map((amount) => (
          <TouchableOpacity key={amount} style={styles.quickButton} onPress={() => handleTopup(amount)} activeOpacity={0.7}>
            <Text style={styles.quickButtonText}>{amount} TL</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom */}
      <Text style={styles.sectionTitle}>Özel Tutar</Text>
      <View style={styles.customRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Tutar (TL)"
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={customAmount}
          onChangeText={setCustomAmount}
        />
        <TouchableOpacity
          style={[styles.topupBtn, (!customAmount || Number(customAmount) <= 0) && { opacity: 0.4 }]}
          onPress={() => handleTopup(Number(customAmount))}
          disabled={!customAmount || Number(customAmount) <= 0}
        >
          <Text style={styles.topupBtnText}>Yükle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
  balanceCard: { backgroundColor: '#10b981', borderRadius: 18, padding: 28, alignItems: 'center', marginBottom: 28 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  balanceAmount: { color: '#fff', fontSize: 40, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  quickButtons: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickButton: { flex: 1, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#10b981', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  quickButtonText: { color: '#10b981', fontWeight: '800', fontSize: 17 },
  customRow: { flexDirection: 'row', gap: 12 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 16, fontSize: 16, color: '#fff', borderWidth: 1, borderColor: '#222' },
  topupBtn: { backgroundColor: '#10b981', borderRadius: 10, paddingHorizontal: 24, justifyContent: 'center' },
  topupBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  loginBtn: { backgroundColor: '#10b981', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
