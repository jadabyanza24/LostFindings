import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { colors } from '../../constants/theme';

export default function LoginScreen() {
  const setUser = useStore(s => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Isi email dan password dulu!');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Login Gagal', error.message);
    } else {
      const { data: userData } = await supabase
        .from('users').select('*').eq('id', data.user.id).single();
      if (userData) setUser(userData);
      router.replace('/(tabs)');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.inner}>
        <Text style={s.logo}>Lost<Text style={{ color: colors.text }}>Findings</Text></Text>
        <Text style={s.subtitle}>Lost & Found Kampus</Text>

        <TextInput style={s.input} placeholder="Email kampus"
          placeholderTextColor={colors.muted} value={email}
          onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <TextInput style={s.input} placeholder="Password"
          placeholderTextColor={colors.muted} value={password}
          onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={handleLogin} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Masuk...' : 'Masuk'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={s.link}>Belum punya akun?{' '}
            <Text style={{ color: colors.accent }}>Daftar di sini</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: { fontSize: 36, fontWeight: '900', color: colors.accent, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 40 },
  input: { width: '100%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14, marginBottom: 12 },
  btn: { width: '100%', padding: 16, backgroundColor: colors.accent, borderRadius: 14, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  btnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  link: { fontSize: 14, color: colors.muted },
});