import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AdminScreen() {
  const user = useStore(s => s.user);
  const [stats, setStats] = useState({
    totalItems: 0, activeItems: 0, claimedItems: 0,
    totalUsers: 0, bannedUsers: 0, verifiedUsers: 0,
    pendingVerif: 0, pendingReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const [items, users, verifs, reports] = await Promise.all([
      supabase.from('items').select('status'),
      supabase.from('users').select('is_banned, is_verified'),
      supabase.from('verifications').select('status'),
      supabase.from('reports').select('status'),
    ]);

    setStats({
      totalItems: items.data?.length || 0,
      activeItems: items.data?.filter(i => i.status === 'active').length || 0,
      claimedItems: items.data?.filter(i => i.status === 'claimed').length || 0,
      totalUsers: users.data?.length || 0,
      bannedUsers: users.data?.filter(u => u.is_banned).length || 0,
      verifiedUsers: users.data?.filter(u => u.is_verified).length || 0,
      pendingVerif: verifs.data?.filter(v => v.status === 'pending').length || 0,
      pendingReports: reports.data?.filter(r => r.status === 'pending').length || 0,
    });
    setLoading(false);
  };

  if (user?.role !== 'admin') return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Akses Ditolak</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.center}>
        <Ionicons name="lock-closed-outline" size={60} color={colors.border} style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
          Hanya untuk Administrator
        </Text>
      </View>
    </SafeAreaView>
  );

  if (loading) return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    </SafeAreaView>
  );

  const MENU = [
    { icon: 'cube', label: 'Kelola Barang', sub: `${stats.activeItems} aktif · ${stats.claimedItems} kembali`, path: '/admin/items', color: colors.accent },
    { icon: 'people-outline', label: 'Kelola User', sub: `${stats.totalUsers} user · ${stats.bannedUsers} diblokir`, path: '/admin/users', color: colors.blue },
    { icon: 'id-card-outline', label: 'Verifikasi Mahasiswa', sub: `${stats.pendingVerif} menunggu`, path: '/admin/verifications', color: colors.green, badge: stats.pendingVerif },
    { icon: 'flag-outline', label: 'Laporan Konten', sub: `${stats.pendingReports} menunggu`, path: '/admin/reports', color: colors.red, badge: stats.pendingReports },
  ];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
          <Text style={s.title}>Admin Dashboard</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={s.greetBox}>
          <Text style={s.greetText}>Halo, {user.name}!</Text>
          <Text style={s.greetSub}>Kelola LostFindings dari sini</Text>
        </View>

        <Text style={s.sectionLabel}>STATISTIK</Text>
        <View style={s.statsGrid}>
          {[
            [stats.totalItems, 'Total Barang', 'cube-outline', colors.accent],
            [stats.totalUsers, 'Total User', 'people-outline', colors.blue],
            [stats.claimedItems, 'Dikembalikan', 'checkmark-circle-outline', colors.green],
            [stats.verifiedUsers, 'Terverifikasi', 'school-outline', colors.green],
          ].map(([n, l, icon, color]) => (
            <View key={l as string} style={s.statCard}>
              <Ionicons name={icon as any} size={24} color={color as string} />
              <Text style={[s.statNum, { color: color as string }]}>{n as number}</Text>
              <Text style={s.statLabel}>{l as string}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>KELOLA</Text>
        {MENU.map(m => (
          <TouchableOpacity key={m.label} style={s.menuItem}
            onPress={() => router.push(m.path as any)}>
            <View style={[s.menuIcon, { backgroundColor: `${m.color}15` }]}>
              <Ionicons name={m.icon as any} size={20} color={m.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuLabel}>{m.label}</Text>
              <Text style={s.menuSub}>{m.sub}</Text>
            </View>
            {m.badge ? (
              <View style={s.badge}>
                <Text style={s.badgeText}>{m.badge}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  greetBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20, marginBottom: 24 },
  greetText: { fontSize: 18, fontWeight: '800', color: colors.text },
  greetSub: { fontSize: 13, color: colors.muted, marginTop: 4 },
  sectionLabel: { fontFamily: 'Michroma', fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, alignItems: 'center', gap: 6 },
  statNum: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, color: colors.muted, textAlign: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, marginBottom: 10 },
  menuIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  menuSub: { fontSize: 12, color: colors.muted },
  badge: { backgroundColor: colors.red, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
});