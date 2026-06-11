import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { SkeletonDetail, SkeletonList, SkeletonRows } from '../../components/Skeleton';
import { Ionicons } from '@expo/vector-icons';

export default function AdminReportsScreen() {
  const { colors } = useTheme();
  const s = getStyles(colors);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    const { data } = await supabase.from('reports')
      .select('*, reporter:users!reports_reporter_id_fkey(name, nim), items(id, name, type, location, user_id)')
      .order('created_at', { ascending: false });
    if (data) setReports(data);
    setLoading(false);
  };

  const handleDismiss = async (report: any) => {
    await supabase.from('reports').update({ status: 'dismissed' }).eq('id', report.id);
    fetchReports();
  };

  const handleRemoveItem = async (report: any) => {
    Alert.alert('Hapus Barang?', `Hapus "${report.items?.name}" dan tutup laporan ini?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        await supabase.from('items').delete().eq('id', report.item_id);
        await supabase.from('reports').update({ status: 'reviewed' }).eq('id', report.id);
        await supabase.from('notifications').insert({
          user_id: report.items?.user_id, type: 'system',
          title: 'Laporan Dihapus',
          body: `Barang "${report.items?.name}" dihapus oleh admin karena melanggar aturan.`,
          read: false });
        fetchReports();
        Alert.alert('Barang dihapus!');
      }}
    ]);
  };

  const filtered = reports.filter(r => r.status === filter);

  if (loading) return <SkeletonRows count={6} />;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Laporan Konten</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.filterRow}>
        {['pending', 'reviewed', 'dismissed'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[s.filterBtn, filter === f && s.filterBtnActive]}>
            <Text style={[s.filterText, filter === f && { color: colors.accent }]}>
              {f === 'pending' ? 'Menunggu' : f === 'reviewed' ? 'Ditinjau' : 'Diabaikan'}
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
        keyExtractor={r => r.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="flag" size={48} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 12, fontSize: 14 }}>
              Tidak ada laporan {filter === 'pending' ? 'menunggu' : filter}
            </Text>
          </View>
        }
        renderItem={({ item: r }) => (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{r.items?.name || 'Barang dihapus'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Ionicons name="location" size={11} color={colors.muted} />
                  <Text style={s.itemLoc}>{r.items?.location || '-'}</Text>
                </View>
              </View>
              <View style={[s.typeBadge,
                r.items?.type === 'found' ? s.badgeFound : s.badgeLost]}>
                <Text style={{ fontSize: 10, fontWeight: '700',
                  color: r.items?.type === 'found' ? colors.green : colors.red }}>
                  {r.items?.type === 'found' ? 'Temuan' : 'Hilang'}
                </Text>
              </View>
            </View>

            <View style={s.reasonBox}>
              <Ionicons name="flag" size={12} color={colors.red} />
              <Text style={s.reasonText}>{r.reason}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="person" size={11} color={colors.muted} />
                <Text style={s.reporter}>Dilaporkan oleh: {r.reporter?.name || 'Anonim'}</Text>
              </View>
              <Text style={s.date}>{r.created_at?.slice(0, 10)}</Text>
            </View>

            {r.status === 'pending' && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={s.dismissBtn} onPress={() => handleDismiss(r)}>
                  <Ionicons name="close" size={14} color={colors.muted} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>Abaikan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.removeBtn} onPress={() => handleRemoveItem(r)}>
                  <Ionicons name="trash" size={14} color="#fff" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Hapus Barang</Text>
                </TouchableOpacity>
              </View>
            )}
            {r.status !== 'pending' && (
              <View style={[s.statusBox, r.status === 'reviewed' ? s.statusReviewed : s.statusDismissed]}>
                <Ionicons
                  name={r.status === 'reviewed' ? 'checkmark-circle' : 'close-circle'}
                  size={14}
                  color={r.status === 'reviewed' ? colors.green : colors.muted}
                />
                <Text style={{ fontSize: 12, fontWeight: '600',
                  color: r.status === 'reviewed' ? colors.green : colors.muted }}>
                  {r.status === 'reviewed' ? 'Sudah ditinjau' : 'Diabaikan'}
                </Text>
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
  itemName: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemLoc: { fontSize: 12, color: colors.muted },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  badgeFound: { backgroundColor: 'rgba(46,204,138,0.15)' },
  badgeLost: { backgroundColor: 'rgba(224,92,92,0.15)' },
  reasonBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 10, backgroundColor: 'rgba(224,92,92,0.08)', borderRadius: 8, marginBottom: 10 },
  reasonText: { fontSize: 13, color: colors.text, flex: 1 },
  reporter: { fontSize: 11, color: colors.muted },
  date: { fontSize: 11, color: colors.muted },
  dismissBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 10 },
  removeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, backgroundColor: colors.red, borderRadius: 10 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8 },
  statusReviewed: { backgroundColor: 'rgba(46,204,138,0.1)' },
  statusDismissed: { backgroundColor: colors.surface2 } });





