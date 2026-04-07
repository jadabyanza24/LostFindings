import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useVerification } from '../../lib/useVerification';

const KATEGORI = ['Semua', 'Elektronik', 'Dompet', 'Kunci', 'Kartu', 'Tas', 'Lainnya'];


export default function HomeScreen() {
  const user = useStore(s => s.user);
  const setUser = useStore(s => s.setUser);
  const { isVerified } = useVerification();

  const [dataBarang, setDataBarang] = useState<any[]>([]);
  const [sedangRefresh, setSedangRefresh] = useState(false); // Dipisah khusus untuk pull-to-refresh
  const [kataKunci, setKataKunci] = useState('');
  const [kategoriAktif, setKategoriAktif] = useState('Semua');

  useFocusEffect(useCallback(() => {
    if (!user) return;
    supabase.from('users').select('*')
      .eq('id', user.id).single()
      .then(({ data }) => { 
        if (data) setUser(data); 
      });
  }, [user?.id]));

  // Efek ini jalan saat ngetik atau ganti kategori (TIDAK memicu spinner FlatList)
  useEffect(() => {
    ambilDataBarang();
  }, [kategoriAktif, kataKunci]);

  const ambilDataBarang = async () => {
    let q = supabase
      .from('items')
      .select('*, users(name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (kategoriAktif !== 'Semua') {
      q = q.eq('category', kategoriAktif.toLowerCase());
    }
    if (kataKunci) {
      q = q.ilike('name', `%${kataKunci}%`);
    }

    const { data } = await q;
    if (data) setDataBarang(data);
  };

  // Fungsi khusus saat layar ditarik ke bawah (Pull to Refresh)
  const handleRefresh = async () => {
    setSedangRefresh(true);
    await ambilDataBarang();
    setSedangRefresh(false);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      
      <View style={s.topSection}>
        <View style={s.greetingBox}>
          <View>
            <Text style={s.greetingText}>Halo, {user?.name?.split(' ')[0] || 'Mahasiswa'}!</Text>
            <Text style={s.subGreeting}>Ada yang hilang atau ketemu hari ini?</Text>
          </View>
          <TouchableOpacity style={s.avatar} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#000' }}>
              {user?.name?.charAt(0) || '?'}
            </Text>
          </TouchableOpacity>
        </View>

        {!isVerified && (
          <TouchableOpacity
            style={s.verifBanner}
            onPress={() => router.push('/profile/verify')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="school" size={20} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                  Verifikasi Mahasiswa
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  Upload KTM untuk bisa post & klaim barang
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </View>
          </TouchableOpacity>
        )}

        <View style={s.searchBar}>
          <Ionicons name="search" size={18} color={colors.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Cari barang hilang/temuan..."
            placeholderTextColor={colors.muted}
            value={kataKunci}
            onChangeText={setKataKunci}
          />
          {kataKunci.length > 0 && (
            <TouchableOpacity onPress={() => setKataKunci('')}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={s.catScroll} 
          contentContainerStyle={{ paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled" // Mencegah keyboard nutup saat klik kategori
        >
          {KATEGORI.map(c => (
            <TouchableOpacity
              key={c}
              style={[s.catBadge, kategoriAktif === c && s.catBadgeActive]}
              onPress={() => setKategoriAktif(c)}>
              <Text style={[s.catText, kategoriAktif === c && { color: '#000', fontWeight: '800' }]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={s.sectionLabel}>BARANG TERBARU</Text>

      <FlatList
        data={dataBarang}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshing={sedangRefresh}
        onRefresh={handleRefresh}
        keyboardShouldPersistTaps="handled" // Mencegah keyboard nutup saat klik list
        keyboardDismissMode="on-drag" // Keyboard otomatis nutup kalau user nge-scroll kebawah
        renderItem={({ item }) => {
          const imageUrl = item.image_url?.includes(',') 
            ? item.image_url.split(',')[0] 
            : item.image_url;

          return (
            <TouchableOpacity style={s.itemCard} onPress={() => router.push(`/items/${item.id}`)}>
              {imageUrl && imageUrl.startsWith('http') ? (
                <Image source={{ uri: imageUrl }} style={s.itemImg} resizeMode="cover" />
              ) : (
                <View style={[s.itemImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 }]}>
                  <Ionicons name="cube-outline" size={40} color={colors.muted} />
                </View>
              )}
              
              <View style={s.itemInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                  <View style={[s.typeBadge, item.type === 'found' ? { backgroundColor: 'rgba(46, 204, 138, 0.15)' } : { backgroundColor: 'rgba(224, 92, 92, 0.15)' }]}>
                    <Text style={[s.typeText, { color: item.type === 'found' ? colors.green : colors.red }]}>
                      {item.type === 'found' ? 'TEMUAN' : 'HILANG'}
                    </Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="location" size={12} color={colors.muted} />
                  <Text style={s.itemLocation} numberOfLines={1}>{item.location}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <Text style={s.itemTime}>
                    {item.created_at?.slice(0, 10)}
                    {item.incident_time ? ` · ${item.incident_time}` : ''}
                  </Text>
                  <Text style={s.itemReporter}>Oleh: {item.users?.name?.split(' ')[0] || 'Anonim'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Ionicons name="search-outline" size={60} color={colors.border} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Barang tidak ditemukan</Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>Coba ubah kata kunci atau kategori</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topSection: { paddingHorizontal: 20, paddingTop: 20 },
  greetingBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greetingText: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 4 },
  subGreeting: { fontSize: 14, color: colors.muted },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  verifBanner: { backgroundColor: 'rgba(240, 165, 0, 0.1)', borderWidth: 1, borderColor: colors.accent, borderRadius: 14, padding: 16, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  catScroll: { marginBottom: 16 },
  catBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: colors.surface },
  catBadgeActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  catText: { fontSize: 13, fontWeight: '600', color: colors.text },
  sectionLabel: { fontFamily: 'Michroma', fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 1, marginBottom: 16, marginHorizontal: 20 },
  itemCard: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  itemImg: { width: 100, height: '100%' },
  itemInfo: { flex: 1, padding: 14 },
  itemName: { fontSize: 15, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  itemLocation: { fontSize: 12, color: colors.muted, flex: 1 },
  itemTime: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  itemReporter: { fontSize: 11, color: colors.muted },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
});