import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const { user, setUser } = useStore();
  const [name, setName] = useState(user?.name || '');
  const [fakultas, setFakultas] = useState(user?.fakultas || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Nama tidak boleh kosong!');
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: name.trim(), fakultas: fakultas.trim() })
        .eq('id', user!.id);
      if (error) throw error;
      setUser({ ...user!, name: name.trim(), fakultas: fakultas.trim() });
      Alert.alert('Berhasil!', 'Profil kamu sudah diupdate.', [
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
          <Text style={s.title}>Edit Profil</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.avatarSection}>
            <View style={s.avatar}>
              <Text style={{ fontSize: 40, fontWeight: '900', color: '#000' }}>
                {name.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          </View>

          <View style={s.labelRow}>
            <Ionicons name="person-outline" size={14} color={colors.muted} />
            <Text style={s.label}>NAMA LENGKAP *</Text>
          </View>
          <TextInput
            style={s.input}
            placeholder="Nama lengkap kamu"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />

          <View style={s.labelRow}>
            <Ionicons name="card-outline" size={14} color={colors.muted} />
            <Text style={s.label}>NIM</Text>
          </View>
          <TextInput
            style={[s.input, s.inputDisabled]}
            value={user?.nim || ''}
            editable={false}
          />
          <Text style={s.hint}>NIM tidak bisa diubah</Text>

          <View style={s.labelRow}>
            <Ionicons name="mail-outline" size={14} color={colors.muted} />
            <Text style={s.label}>EMAIL</Text>
          </View>
          <TextInput
            style={[s.input, s.inputDisabled]}
            value={user?.email || ''}
            editable={false}
          />
          <Text style={s.hint}>Email tidak bisa diubah</Text>

          <View style={s.labelRow}>
            <Ionicons name="school-outline" size={14} color={colors.muted} />
            <Text style={s.label}>FAKULTAS / PRODI</Text>
          </View>
          <TextInput
            style={s.input}
            placeholder="contoh: Teknik Informatika"
            placeholderTextColor={colors.muted}
            value={fakultas}
            onChangeText={setFakultas}
          />

          <TouchableOpacity
            style={[s.saveBtn, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name={loading ? 'time' : 'save-outline'} size={18} color="#000" />
              <Text style={s.saveBtnText}>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  scroll: { padding: 20, paddingBottom: 60 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.border },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: { fontFamily: 'Michroma', fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14, marginBottom: 6 },
  inputDisabled: { opacity: 0.5 },
  hint: { fontSize: 11, color: colors.muted, marginBottom: 16 },
  saveBtn: { marginTop: 20, padding: 16, backgroundColor: colors.accent, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
