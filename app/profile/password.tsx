import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePasswordScreen() {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!current || !newPass || !confirm)
      return Alert.alert('Lengkapi semua field!');
    if (newPass !== confirm)
      return Alert.alert('Password baru tidak cocok!');
    if (newPass.length < 6)
      return Alert.alert('Password minimal 6 karakter!');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      Alert.alert('Password berhasil diubah!', '', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.title}>Ubah Password</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={s.body}>
          <View style={s.iconBox}>
            <Ionicons name="lock-closed-outline" size={60} color={colors.accent} />
          </View>
          <Text style={s.desc}>Password baru minimal 6 karakter</Text>

          <View style={s.labelRow}>
            <Ionicons name="lock-open-outline" size={14} color={colors.muted} />
            <Text style={s.label}>PASSWORD SAAT INI</Text>
          </View>
          <TextInput style={s.input} placeholder="Password lama"
            placeholderTextColor={colors.muted} value={current}
            onChangeText={setCurrent} secureTextEntry />

          <View style={s.labelRow}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.muted} />
            <Text style={s.label}>PASSWORD BARU</Text>
          </View>
          <TextInput style={s.input} placeholder="Password baru"
            placeholderTextColor={colors.muted} value={newPass}
            onChangeText={setNewPass} secureTextEntry />

          <View style={s.labelRow}>
            <Ionicons name="checkmark-circle-outline" size={14} color={colors.muted} />
            <Text style={s.label}>KONFIRMASI PASSWORD BARU</Text>
          </View>
          <TextInput style={s.input} placeholder="Ulangi password baru"
            placeholderTextColor={colors.muted} value={confirm}
            onChangeText={setConfirm} secureTextEntry />

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.6 }]}
            onPress={handleChange} disabled={loading}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {!loading && <Ionicons name="key-outline" size={18} color="#000" />}
              <Text style={s.btnText}>{loading ? 'Menyimpan...' : 'Ubah Password'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { flex: 1, padding: 24 },
  iconBox: { alignItems: 'center', marginBottom: 8, marginTop: 12 },
  desc: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 28 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: { fontFamily: 'Michroma', fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14, marginBottom: 16 },
  btn: { marginTop: 8, padding: 16, backgroundColor: colors.accent, borderRadius: 16, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
