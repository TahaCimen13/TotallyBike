import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) return;
    setLoading(true);
    const result = await register(email, password, name);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Hata', result.error || 'Kayıt başarısız');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TotallyBike</Text>
      <Text style={styles.subtitle}>Yeni hesap oluşturun</Text>

      <TextInput style={styles.input} placeholder="Ad Soyad" placeholderTextColor="#666" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="E-posta" placeholderTextColor="#666" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Şifre (en az 6 karakter)" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkText}>Zaten hesabınız var mı? Giriş Yap</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#111' },
  title: { fontSize: 32, fontWeight: '800', color: '#10b981', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#222', borderRadius: 10, padding: 16, fontSize: 16, color: '#fff', marginBottom: 12 },
  button: { backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#10b981', fontSize: 14 },
});
