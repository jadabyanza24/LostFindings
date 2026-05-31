import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/theme';
import { SkeletonDetail, SkeletonList, SkeletonRows } from '../../components/Skeleton';
import { Ionicons } from '@expo/vector-icons';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users')
      .select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleBan = (user: any) => {
    const isBanned = user.is_banned;
    Alert.alert(
      isBanned ? 'Buka Blokir User?' : 'Blokir User?',
      `${isBanned ? 'Buka blokir' : 'Blokir'} akun ${user.name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: isBanned ? 'Buka Blokir' : 'Blokir', style: 'destructive',
          onPress: async () => {
            await supabase.from('users')
              .update({ is_banned: !isBanned }).eq('id', user.id);
            fetchUsers();
          }
        }
      ]
    );
  };

  const handleDelete = (user: any) => {
    Alert.alert('Hapus User?', `Hapus akun ${user.name} secara permanen?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        await supabase.from('users').delete().eq('id', user.id);
        fetchUsers();
      }}
    ]);
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.nim?.includes(search) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <SkeletonRows count={6} />;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Kelola User</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.searchBar}>
        <Ionicons name="search" size={18} color={colors.muted} style={{ marginRight: 8 }} />
        <TextInput style={s.searchInput}
          placeholder="Cari nama, NIM, email..."
          placeholderTextColor={colors.muted}
          value={search} onChangeText={setSearch} />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        data={filtered}
        keyExtractor={u => u.id}
        contentContainerStyle={[
          { paddingHorizontal: 16, paddingBottom: 100 },
          filtered.length === 0 && { flexGrow: 1 }
        ]}
        renderItem={({ item: u }) => (
          <View style={[s.userCard, u.is_banned && s.userCardBanned]}>
            <View style={s.userAvatar}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#000' }}>
                {u.name?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.userName}>{u.name}</Text>
                {u.role === 'admin' && (
                  <View style={s.adminBadge}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: colors.accent }}>ADMIN</Text>
                  </View>
                )}
                {u.is_verified && (
                  <Ionicons name="checkmark-circle" size={14} color={colors.green} />
                )}
                {u.is_banned && (
                  <Ionicons name="ban" size={14} color={colors.red} />
                )}
              </View>
              <Text style={s.userNim}>{u.nim} · {u.fakultas || '-'}</Text>
              <Text style={s.userEmail}>{u.email}</Text>
            </View>
            {u.role !== 'admin' && (
              <View style={{ gap: 8 }}>
                <TouchableOpacity onPress={() => handleBan(u)}>
                  <Ionicons
                    name={u.is_banned ? 'refresh-circle' : 'ban'}
                    size={24}
                    color={u.is_banned ? colors.green : colors.red}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(u)}>
                  <Ionicons name="trash" size={24} color={colors.red} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="people-outline" size={60} color={colors.border} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              User tidak ditemukan
            </Text>
          </View>
        }
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
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 16, marginVertical: 16 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, marginBottom: 10 },
  userCardBanned: { opacity: 0.6, borderColor: colors.red },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 14, fontWeight: '700', color: colors.text },
  userNim: { fontSize: 12, color: colors.muted, marginTop: 2 },
  userEmail: { fontSize: 11, color: colors.muted },
  adminBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: colors.accent } });





