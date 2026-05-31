import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/theme';
import { SkeletonDetail, SkeletonList, SkeletonRows } from '../../components/Skeleton';
import { Ionicons } from '@expo/vector-icons';

export default function AdminItemsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('items')
      .select('*, users(name, nim)')
      .order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const handleDelete = (item: any) => {
  Alert.alert('Hapus Barang?', `Hapus "${item.name}" secara permanen?`, [
    { text: 'Batal', style: 'cancel' },
    { text: 'Hapus', style: 'destructive', onPress: async () => {
      console.log('Menghapus item:', item.id);
      const { error } = await supabase.from('items').delete().eq('id', item.id);
      console.log('Delete result:', error);
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      await supabase.from('notifications').insert({
        user_id: item.user_id, type: 'system',
        title: 'Laporan Dihapus Admin',
        body: `Laporan "${item.name}" dihapus oleh admin.`, read: false });
      fetchItems();
      Alert.alert('Berhasil!', 'Barang berhasil dihapus.');
    }}
  ]);
};

  const handleToggleStatus = async (item: any) => {
    const newStatus = item.status === 'active' ? 'claimed' : 'active';
    await supabase.from('items').update({ status: newStatus }).eq('id', item.id);
    fetchItems();
  };

  const filtered = items.filter(i => {
    const matchSearch = i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.location?.toLowerCase().includes(search.toLowerCase()) ||
      i.users?.name?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchSearch;
    if (filter === 'found') return i.type === 'found' && matchSearch;
    if (filter === 'lost') return i.type === 'lost' && matchSearch;
    if (filter === 'claimed') return i.status === 'claimed' && matchSearch;
    return matchSearch;
  });

  if (loading) return <SkeletonList count={6} />;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Kelola Barang</Text>
        <Text style={{ fontSize: 13, color: colors.muted }}>{items.length} total</Text>
      </View>

      <View style={s.searchBar}>
        <Ionicons name="search" size={16} color={colors.muted} style={{ marginRight: 8 }} />
        <TextInput style={{ flex: 1, color: colors.text, fontSize: 14 }}
          placeholder="Cari nama, lokasi, pelapor..."
          placeholderTextColor={colors.muted}
          value={search} onChangeText={setSearch} />
      </View>

      <View style={s.filterRow}>
        {[
          ['all', 'Semua'],
          ['found', 'Temuan'],
          ['lost', 'Hilang'],
          ['claimed', 'Kembali'],
        ].map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setFilter(key)}
            style={[s.filterBtn, filter === key && s.filterBtnActive]}>
            <Text style={[s.filterText, filter === key && { color: colors.accent }]}>
              {label}
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
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="cube" size={48} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 12 }}>Tidak ada barang</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              {/* Foto */}
              <View style={s.thumb}>
                {item.image_url
                  ? <Image source={{ uri: item.image_url }}
                      style={{ width: 60, height: 60 }} resizeMode="cover" />
                  : <Ionicons name="cube" size={28} color={colors.muted} />
                }
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                  <View style={[s.badge,
                    item.status === 'claimed' ? s.badgeClaimed :
                    item.type === 'found' ? s.badgeFound : s.badgeLost]}>
                    <Text style={{ fontSize: 9, fontWeight: '700',
                      color: item.status === 'claimed' ? colors.blue :
                      item.type === 'found' ? colors.green : colors.red }}>
                      {item.status === 'claimed' ? 'Kembali' :
                       item.type === 'found' ? 'Temuan' : 'Hilang'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <Ionicons name="location" size={11} color={colors.muted} />
                  <Text style={s.itemSub} numberOfLines={1}>{item.location}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="person" size={11} color={colors.muted} />
                  <Text style={s.itemSub}>{item.users?.name || 'Anonim'}</Text>
                  <Text style={s.itemSub}>· {item.created_at?.slice(0, 10)}</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={s.actions}>
              <TouchableOpacity style={s.actionBtn}
                onPress={() => router.push(`/items/${item.id}`)}>
                <Ionicons name="eye" size={14} color={colors.blue} />
                <Text style={{ fontSize: 12, color: colors.blue, fontWeight: '600' }}>Lihat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn}
                onPress={() => handleToggleStatus(item)}>
                <Ionicons
                  name={item.status === 'active' ? 'checkmark-circle' : 'refresh-circle'}
                  size={14}
                  color={item.status === 'active' ? colors.green : colors.accent}
                />
                <Text style={{ fontSize: 12, fontWeight: '600',
                  color: item.status === 'active' ? colors.green : colors.accent }}>
                  {item.status === 'active' ? 'Tandai Kembali' : 'Aktifkan Lagi'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash" size={14} color={colors.red} />
                <Text style={{ fontSize: 12, color: colors.red, fontWeight: '600' }}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 10, margin: 16, marginBottom: 8 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterBtn: { flex: 1, padding: 7, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  filterBtnActive: { borderColor: colors.accent, backgroundColor: 'rgba(240,165,0,0.1)' },
  filterText: { fontSize: 11, fontWeight: '600', color: colors.muted },
  empty: { alignItems: 'center', paddingTop: 60 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, marginBottom: 10 },
  thumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  itemSub: { fontSize: 11, color: colors.muted },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 50 },
  badgeFound: { backgroundColor: 'rgba(46,204,138,0.15)' },
  badgeLost: { backgroundColor: 'rgba(224,92,92,0.15)' },
  badgeClaimed: { backgroundColor: 'rgba(74,158,255,0.15)' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8, backgroundColor: colors.surface2, borderRadius: 8 } });





