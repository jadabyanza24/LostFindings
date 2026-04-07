import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { colors } from '../../constants/theme';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ICON_COLORS: Record<string, string> = {
  claim: colors.accent, msg: colors.blue, match: colors.green, system: colors.muted
};

export default function NotificationsScreen() {
  const user = useStore(s => s.user);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchNotifs();

    const sub = supabase
      .channel(`notif-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifs(prev => [payload.new, ...prev]);
      })
      .subscribe((status) => {
        console.log('Notif subscription status:', status);
      });

    return () => { supabase.removeChannel(sub); };
  }, [user]);

  const fetchNotifs = async () => {
    const { data } = await supabase.from('notifications')
      .select('*').eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setNotifs(data);
    setLoading(false);
  };

  const markAllRead = () =>
    supabase.from('notifications')
      .update({ read: true })
      .eq('user_id', user!.id).eq('read', false);

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={colors.accent} size="large"/>
    </View>
  );

  const handleNotifPress = async (notif: any) => {
    await supabase.from('notifications')
      .update({ read: true }).eq('id', notif.id);
    setNotifs(prev => prev.map(n =>
      n.id === notif.id ? { ...n, read: true } : n));

    if (notif.type === 'system') {
      router.push('/(tabs)/profile');
      return;
    }

    if (notif.type === 'msg' || notif.type === 'claim' || notif.type === 'match') {
      const { data: chats } = await supabase.from('chats')
        .select('id')
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (chats && chats.length > 0) {
        router.push(`/chat/${chats[0].id}`);
      } else {
        router.push('/(tabs)/chat');
      }
      return;
    }

    router.push('/(tabs)/chat');
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Notifikasi</Text>
        <TouchableOpacity onPress={() =>
          supabase.from('notifications').delete()
            .eq('user_id', user!.id).then(fetchNotifs)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="trash" size={14} color={colors.muted} />
            <Text style={{ fontSize: 13, color: colors.muted }}>Hapus semua</Text>
          </View>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifs}
        keyExtractor={n => n.id}
        scrollEnabled={notifs.length > 0}
        contentContainerStyle={notifs.length === 0
        ? { flexGrow: 1 }
        : { paddingBottom: 100 }}
        renderItem={({ item: notif }) => (
          <TouchableOpacity
            style={[s.item, !notif.read && s.itemUnread]}
            onPress={() => handleNotifPress(notif)}
            activeOpacity={0.7}>
            <View style={[s.icon, { backgroundColor: `${ICON_COLORS[notif.type] || colors.muted}22` }]}>
              <Ionicons
                name={
                  notif.type === 'claim' ? 'hand-right' :
                  notif.type === 'msg' ? 'chatbubble' :
                  notif.type === 'match' ? 'star' : 'notifications'
                }
                size={20}
                color={ICON_COLORS[notif.type] || colors.muted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.notifTitle}>{notif.title}</Text>
              <Text style={s.notifBody}>{notif.body}</Text>
              <Text style={s.notifTime}>{notif.created_at?.slice(0, 10)}</Text>
            </View>
            {!notif.read && <View style={s.dot}/>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="notifications-outline" size={60} color={colors.border} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              Tidak Ada Notifikasi
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 6 }}>
              Kamu sudah up-to-date!
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemUnread: { backgroundColor: 'rgba(240,165,0,0.04)' },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 3 },
  notifBody: { fontSize: 13, color: colors.muted, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11, color: colors.muted },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 6 },
});