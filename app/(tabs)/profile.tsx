import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, setUser } = useStore();
  const { colors, isDark, setTheme } = useTheme();
  const s = getStyles(colors);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [notifOn, setNotifOn] = useState(true);

  useEffect(() => {
    if (user)
      supabase.from('items').select('*').eq('user_id', user.id)
        .then(({ data }) => setMyItems(data || []));
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Keluar?', 'Kamu akan logout dari LostFindings.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.replace('/auth/login');
      }},
    ]);
  };

  if (!user) return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.center}>
        <Ionicons name="person-circle-outline" size={80} color={colors.muted} style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
          Belum Login
        </Text>
        <TouchableOpacity style={s.loginBtn} onPress={() => router.push('/auth/login')}>
          <Text style={s.loginBtnText}>Login Sekarang</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const found = myItems.filter(i => i.type === 'found').length;
  const returned = myItems.filter(i => i.status === 'claimed').length;
  const lost = myItems.filter(i => i.type === 'lost').length;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={s.hero}>
          <View style={s.avatar}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: colors.text }}>
              {user.name.charAt(0)}
            </Text>
          </View>
          <Text style={s.name}>{user.name}</Text>
          <Text style={s.nim}>NIM: {user.nim} · {user.fakultas || 'Mahasiswa'}</Text>
          <View style={s.statsRow}>
            {[
              [found, 'Temuan', 'bag-check'],
              [returned, 'Dikembalikan', 'checkmark-done'],
              [lost, 'Dicari', 'search'],
            ].map(([n, l, icon]) => (
              <View key={l as string} style={s.stat}>
                <Ionicons name={icon as any} size={20} color={colors.accent} style={{ marginBottom: 4 }} />
                <Text style={s.statNum}>{n as number}</Text>
                <Text style={s.statLabel}>{l as string}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={s.sectionLabel}>LAPORAN SAYA</Text>

          {myItems.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="document-text-outline" size={32} color={colors.muted} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.muted, fontSize: 14 }}>
                Belum ada laporan.
              </Text>
            </View>
          ) : (
            myItems.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={s.myItem}
                onPress={() => router.push(`/items/${item.id}`)}
              >
                <Ionicons
                  name={item.type === "found" ? "search" : "help-circle"}
                  size={22}
                  color={item.type === "found" ? colors.green : colors.red}
                  style={{ marginRight: 10 }}
                />

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                    {item.name}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name="location-sharp" size={12} color={colors.muted} />
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      {item.location}
                    </Text>
                  </View>
                </View>

                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: item.status === "claimed" ? colors.green : colors.accent,
                  }}
                >
                  {item.status === "claimed" ? "Kembali" : "Aktif"}
                </Text>
              </TouchableOpacity>
            ))
          )}

          {user?.role === 'admin' && (
            <>
              <Text style={s.sectionLabel}>ADMIN DASHBOARD</Text>
              <TouchableOpacity style={[s.menuItem, { borderColor: colors.accent }]}
                onPress={() => router.push('/admin')}>
                <View style={s.menuIcon}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.accent} />
                </View>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text }}>
                  Panel Admin
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </TouchableOpacity>
            </>
          )}

          <Text style={s.sectionLabel}>PENGATURAN</Text>
          <View style={s.menuItem}>
            <View style={s.menuIcon}>
              <Ionicons name="notifications" size={18} color={colors.accent} />
            </View>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.text }}>
              Notifikasi Push
            </Text>
            <Switch value={notifOn} onValueChange={setNotifOn}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#fff"/>
          </View>

          <View style={s.menuItem}>
            <View style={s.menuIcon}>
              <Ionicons name="moon" size={18} color={colors.accent} />
            </View>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.text }}>
              Mode Gelap
            </Text>
            <Switch value={isDark} onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#fff"/>
          </View>

          {[
            ['person', 'Edit Profil', '/profile/edit'],
            ['school', 'Verifikasi Mahasiswa', '/profile/verify'],
            ['lock-closed', 'Ubah Password', '/profile/password'],
            ['help-circle', 'Bantuan & FAQ', '/profile/faq'],
          ].map(([icon, label, path]) => (
            <TouchableOpacity key={label as string} style={s.menuItem}
              onPress={() => router.push(path as any)}>
              <View style={s.menuIcon}>
                <Ionicons name={icon as any} size={18} color={colors.accent} />
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.text }}>{label as string}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[s.menuItem, { borderColor: colors.red, marginTop: 8 }]}
            onPress={handleLogout}>
            <View style={[s.menuIcon, { backgroundColor: 'rgba(224,92,92,0.1)' }]}>
              <Ionicons name="log-out" size={18} color={colors.red} />
            </View>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.red }}>Keluar</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.red} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loginBtn: { paddingVertical: 14, paddingHorizontal: 32, backgroundColor: colors.accent, borderRadius: 14 },
  loginBtnText: { fontSize: 15, fontWeight: '800', color: colors.accentText },
  hero: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: colors.border },
  name: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 4 },
  nim: { fontSize: 13, color: colors.muted, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 32 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: colors.accent },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  sectionLabel: { fontFamily: 'Michroma', fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 1, marginBottom: 10, marginTop: 20 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 8 },
  myItem: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 8 },
  menuIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(240,165,0,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 8 },
});
