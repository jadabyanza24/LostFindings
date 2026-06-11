import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { SkeletonDetail, SkeletonList, SkeletonRows } from '../../components/Skeleton';
import { Ionicons } from '@expo/vector-icons';

export default function AdminVerificationsScreen() {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors);
  const [verifs, setVerifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => { fetchVerifs(); }, []);

  const fetchVerifs = async () => {
    const { data } = await supabase.from('verifications')
      .select('*, users(id, name, nim, email, fakultas)')
      .order('created_at', { ascending: false });
    if (data) setVerifs(data);
    setLoading(false);
  };

  const handleApprove = async (verif: any) => {
    await supabase.from('verifications').update({ status: 'approved' }).eq('id', verif.id);
    await supabase.from('users').update({ is_verified: true }).eq('id', verif.user_id);
    await supabase.from('notifications').insert({
      user_id: verif.user_id, type: 'system',
      title: 'Verifikasi Disetujui!',
      body: 'Akun kamu sudah terverifikasi sebagai mahasiswa.', read: false });
    fetchVerifs();
    Alert.alert('Disetujui!', `${verif.users?.name} sudah terverifikasi.`);
  };

  const handleReject = async (verif: any) => {
    Alert.alert('Tolak Verifikasi?', 'Foto KTM tidak valid?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Tolak', style: 'destructive', onPress: async () => {
        await supabase.from('verifications').update({ status: 'rejected' }).eq('id', verif.id);
        await supabase.from('notifications').insert({
          user_id: verif.user_id, type: 'system',
          title: 'Verifikasi Ditolak',
          body: 'Foto KTM tidak valid. Coba upload ulang dengan foto yang lebih jelas.', read: false });
        fetchVerifs();
      }}
    ]);
  };

  const filtered = verifs.filter(v => v.status === filter);

  if (loading) return <SkeletonRows count={6} />;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Verifikasi Mahasiswa</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.filterRow}>
        {['pending', 'approved', 'rejected'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[s.filterBtn, filter === f && s.filterBtnActive]}>
            <Text style={[s.filterText, filter === f && { color: colors.accent }]}>
              {f === 'pending' ? 'Menunggu' : f === 'approved' ? 'Disetujui' : 'Ditolak'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        data={filtered}
        keyExtractor={v => v.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="school" size={48} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 12, fontSize: 14 }}>
              Tidak ada verifikasi {filter === 'pending' ? 'menunggu' : filter}
            </Text>
          </View>
        }
        renderItem={({ item: v }) => (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={s.avatar}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>
                  {v.users?.name?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{v.users?.name}</Text>
                <Text style={s.nim}>{v.users?.nim} · {v.users?.fakultas}</Text>
              </View>
              <Text style={s.date}>{v.created_at?.slice(0, 10)}</Text>
            </View>

            {/* Foto KTM */}
            {v.ktm_url && (
              <Image source={{ uri: v.ktm_url }}
                style={{ width: '100%', height: 180, borderRadius: 10, marginBottom: 12 }}
                resizeMode="contain" />
            )}

            {v.status === 'pending' && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={s.approveBtn} onPress={() => handleApprove(v)}>
                  <Ionicons name="checkmark" size={16} color={colors.accentText} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.accentText }}>Setujui</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.rejectBtn} onPress={() => handleReject(v)}>
                  <Ionicons name="close" size={16} color={colors.red} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.red }}>Tolak</Text>
                </TouchableOpacity>
              </View>
            )}
            {v.status === 'approved' && (
              <View style={s.statusApproved}>
                <Ionicons name="checkmark-circle" size={14} color={colors.green} />
                <Text style={{ fontSize: 13, color: colors.green, fontWeight: '600' }}>Disetujui</Text>
              </View>
            )}
            {v.status === 'rejected' && (
              <View style={s.statusRejected}>
                <Ionicons name="close-circle" size={14} color={colors.red} />
                <Text style={{ fontSize: 13, color: colors.red, fontWeight: '600' }}>Ditolak</Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  filterRow: { flexDirection: 'row', padding: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterBtn: { flex: 1, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  filterBtnActive: { borderColor: colors.accent, backgroundColor: 'rgba(240,165,0,0.1)' },
  filterText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  empty: { alignItems: 'center', paddingTop: 60 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  nim: { fontSize: 12, color: colors.muted, marginTop: 2 },
  date: { fontSize: 11, color: colors.muted },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, backgroundColor: colors.accent, borderRadius: 10 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.red, borderRadius: 10 },
  statusApproved: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, backgroundColor: 'rgba(46,204,138,0.1)', borderRadius: 8 },
  statusRejected: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, backgroundColor: 'rgba(224,92,92,0.1)', borderRadius: 8 } });





