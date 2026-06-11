import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function CompleteProfileScreen() {
  const { colors } = useTheme();
  const s = getStyles(colors);
  const setUser = useStore(s => s.setUser);
  
  const [name, setName] = useState('');
  const [nim, setNim] = useState('');
  const [fakultas, setFakultas] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch user's email from active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email || '');
      } else {
        // If no active session, redirect to login
        router.replace('/auth/login');
      }
    });
  }, []);

  const handleCompleteProfile = async () => {
    if (!name || !nim) {
      return Alert.alert('Lengkapi Nama dan NIM kamu!');
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Sesi tidak ditemukan. Silakan login kembali.');
      }

      const { error: dbError } = await supabase.from('users').insert({
        id: session.user.id,
        name: name.trim(),
        nim: nim.trim(),
        email: session.user.email || email,
        fakultas: fakultas.trim(),
      });
      if (dbError) throw dbError;

      // Fetch newly created profile
      const { data: userData, error: fetchError } = await supabase
        .from('users').select('*').eq('id', session.user.id).single();
      if (fetchError || !userData) throw new Error('Gagal memuat profil baru.');

      setUser(userData);
      Alert.alert('Berhasil!', 'Profil kamu telah dibuat.', [
        { text: 'Masuk Aplikasi', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (e: any) {
      Alert.alert('Gagal Melengkapi Profil', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.replace('/auth/login');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Lengkapi Profil</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 28 }}>
          <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
          <Text style={s.subtitle}>Silakan lengkapi data profil untuk melanjutkan</Text>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={s.label}>EMAIL</Text>
          <TextInput
            style={[s.input, s.inputDisabled]}
            value={email}
            editable={false}
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={s.label}>NAMA LENGKAP *</Text>
          <TextInput
            style={s.input}
            placeholder="Nama lengkap kamu"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={s.label}>NIM *</Text>
          <TextInput
            style={s.input}
            placeholder="NIM kamu"
            placeholderTextColor={colors.muted}
            value={nim}
            onChangeText={setNim}
            keyboardType="default"
            autoCapitalize="none"
          />
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={s.label}>FAKULTAS / PRODI</Text>
          <TextInput
            style={s.input}
            placeholder="contoh: Teknik Informatika"
            placeholderTextColor={colors.muted}
            value={fakultas}
            onChangeText={setFakultas}
            autoCapitalize="words"
          />
        </View>

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={handleCompleteProfile} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Menyimpan...' : 'Simpan Profil'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Kembali / Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  scroll: { padding: 28, paddingTop: 60 },
  title: { fontSize: 30, fontWeight: '900', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.muted },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14 },
  inputDisabled: { opacity: 0.5 },
  btn: { padding: 16, backgroundColor: colors.accent, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: '800', color: colors.accentText },
  logoutBtn: { padding: 16, alignItems: 'center', marginTop: 12 },
  logoutText: { fontSize: 14, fontWeight: '600', color: colors.red },
});
