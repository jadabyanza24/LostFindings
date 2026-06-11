import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity,
  StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { useTheme } from '../../context/ThemeContext';
import { SkeletonDetail, SkeletonList, SkeletonRows } from '../../components/Skeleton';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const parseNotification = (notif: any) => {
  if (!notif) return notif;
  const match = notif.body?.match(/\[chat_id:([^\]]+)\]/);
  if (match) {
    const chatId = match[1];
    const cleanBody = notif.body.replace(/\[chat_id:[^\]]+\]/, '').trim();
    return { ...notif, chat_id: chatId, body: cleanBody };
  }
  return notif;
};

export default function NotificationsScreen() {
  const user = useStore(s => s.user);
  const { colors } = useTheme();
  const s = getStyles(colors);
  const iconColors: Record<string, string> = {
    claim: colors.accent, msg: colors.accent, match: colors.green, system: colors.muted
  };
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to fetch notifications (safely defined above useEffect)
  const fetchNotifs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('notifications')
      .select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setNotifs(data.map(parseNotification));
    setLoading(false);
  };

  // Helper function to mark all notifications as read (safely defined above useEffect)
  const markAllRead = () => {
    if (!user) return;
    supabase.from('notifications')
      .update({ read: true })
      .eq('user_id', user.id).eq('read', false);
  };

  // Hooks: useEffect runs unconditionally on every render.
  // This satisfies React's Rule of Hooks that hook calls must happen in the exact same order on every render.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchNotifs();

    const sub = supabase
      .channel(`notif-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}` }, payload => {
        setNotifs(prev => [parseNotification(payload.new), ...prev]);
      })
      .subscribe((status) => {
        console.log('Notif subscription status:', status);
      });

    return () => { supabase.removeChannel(sub); };
  }, [user]);

  // Refresh notifications list when the screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchNotifs();
      }
    }, [user])
  );

  // Conditional early return for unauthenticated users is placed AFTER all hooks have been declared.
  // This prevents React from throwing the "Rendered fewer hooks than expected" runtime error when the user is logged out.
  if (!user) return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Notifikasi</Text>
      </View>
      <View style={s.center}>
        <Ionicons name="notifications-off-outline" size={80} color={colors.muted} style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
          Belum Login
        </Text>
        <TouchableOpacity 
          style={{ paddingVertical: 14, paddingHorizontal: 32, backgroundColor: colors.accent, borderRadius: 14 }} 
          onPress={() => router.push('/auth/login')}
        >
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#000' }}>Login Sekarang</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (loading) return <SkeletonRows count={6} />;

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
      if (notif.chat_id) {
        router.push(`/chat/${notif.chat_id}`);
      } else {
        const { data: chats } = await supabase.from('chats')
          .select('id')
          .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (chats && chats.length > 0) {
          router.push(`/chat/${chats[0].id}`);
        } else {
          router.push('/(tabs)/chat');
        }
      }
      return;
    }

    router.push('/(tabs)/chat');
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Notifikasi</Text>
        <TouchableOpacity onPress={() => {
          if (!user) return;
          supabase.from('notifications').delete()
            .eq('user_id', user.id).then(fetchNotifs);
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="trash" size={14} color={colors.muted} />
            <Text style={{ fontSize: 13, color: colors.muted }}>Hapus semua</Text>
          </View>
        </TouchableOpacity>
      </View>
      <FlatList
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
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
            <View style={[s.icon, { backgroundColor: `${iconColors[notif.type] || colors.muted}22` }]}>
              <Ionicons
                name={
                  notif.type === 'claim' ? 'hand-right' :
                  notif.type === 'msg' ? 'chatbubble' :
                  notif.type === 'match' ? 'star' : 'notifications'
                }
                size={20}
                color={iconColors[notif.type] || colors.muted}
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
            <Ionicons name="notifications-outline" size={60} color={colors.muted} style={{ marginBottom: 12 }} />
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

const getStyles = (colors: any) => StyleSheet.create({
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
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 6 } });





