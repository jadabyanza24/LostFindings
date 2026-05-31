import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [nim, setNim] = useState('');
  const [fakultas, setFakultas] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !nim || !email || !password)
      return Alert.alert('Lengkapi semua field!');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      await supabase.from('users').insert({
        id: data.user!.id, name, nim, email, fakultas,
      });
      Alert.alert('Berhasil!', 'Akun kamu sudah dibuat!', [
        { text: 'Login', onPress: () => router.replace('/auth/login') }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Daftar Akun</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 28 }}>
          <Ionicons name="school-outline" size={16} color={colors.muted} />
          <Text style={s.subtitle}>Bergabung dengan LostFindings</Text>
        </View>

        {[
          [name, setName, 'Nama Lengkap', 'Budi Santoso', false],
          [nim, setNim, 'NIM', '21523456', false],
          [fakultas, setFakultas, 'Fakultas / Prodi', 'Teknik Informatika', false],
          [email, setEmail, 'Email Kampus', 'budi@student.univ.ac.id', false],
          [password, setPassword, 'Password', 'Minimal 6 karakter', true],
        ].map(([val, setter, label, placeholder, secure]) => (
          <View key={label as string} style={{ marginBottom: 12 }}>
            <Text style={s.label}>{label as string}</Text>
            <TextInput
              style={s.input}
              placeholder={placeholder as string}
              placeholderTextColor={colors.muted}
              value={val as string}
              onChangeText={setter as any}
              secureTextEntry={secure as boolean}
              autoCapitalize={secure || label === 'Email Kampus' ? 'none' : 'words'}
              keyboardType={label === 'Email Kampus' ? 'email-address' : 'default'}
            />
          </View>
        ))}

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={handleRegister} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Mendaftar...' : 'Daftar Sekarang'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 28, paddingTop: 60 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 30, fontWeight: '900', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.muted },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14 },
  btn: { padding: 16, backgroundColor: colors.accent, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
