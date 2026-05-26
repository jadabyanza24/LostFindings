import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ChatListScreen() {
  const user = useStore(s => s.user);
  const insets = useSafeAreaInsets();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchChats();

    const uniqueChannelName = `chat-list-${user.id}-${Date.now()}`;
    const channel = supabase.channel(uniqueChannelName)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
      }, () => fetchChats())
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
      }, () => fetchChats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Refresh saat tab difokus — ini yang bikin dot hilang setelah buka chat
useFocusEffect(useCallback(() => {
  if (!user) return;
  // Delay sedikit supaya markAsRead di chat screen selesai dulu
  const timer = setTimeout(() => {
    fetchChats();
  }, 500);
  return () => clearTimeout(timer);
}, [user?.id]));

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    });
  };

  const fetchChats = async () => {
    const { data } = await supabase.from('chats')
      .select(`id, created_at, confirmed_by_finder, confirmed_by_owner, completed,
        items(id, name),
        user1:users!chats_user1_id_fkey(id, name),
        user2:users!chats_user2_id_fkey(id, name),
        messages(text, created_at, sender_id, read_by)`)
      .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      const sorted = data.sort((a, b) => {
        const aLast = [...(a.messages||[])].sort((x:any,y:any) =>
          new Date(y.created_at).getTime()-new Date(x.created_at).getTime())[0]?.created_at || a.created_at;
        const bLast = [...(b.messages||[])].sort((x:any,y:any) =>
          new Date(y.created_at).getTime()-new Date(x.created_at).getTime())[0]?.created_at || b.created_at;
        return new Date(bLast).getTime() - new Date(aLast).getTime();
      });
      setChats(sorted);
    }
    setLoading(false);
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={colors.accent} size="large"/>
    </View>
  );

  if (!user) return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}><Text style={s.title}>Percakapan</Text></View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
          Belum Login
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted }}>Login untuk melihat percakapan</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Percakapan</Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={c => c.id}
        contentContainerStyle={chats.length === 0
          ? { flex: 1 }
          : { paddingBottom: 49 + insets.bottom + 16 }}
        renderItem={({ item: chat }) => {
          const other = chat.user1?.id === user?.id ? chat.user2 : chat.user1;
          const lastMsg = [...(chat.messages || [])]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

          const hasUnread = lastMsg 
  ? lastMsg.sender_id !== user?.id && (!lastMsg.read_by || !lastMsg.read_by.includes(user?.id))
  : false;

          return (
            <TouchableOpacity
              style={[s.chatItem, hasUnread && s.chatItemUnread]}
              onPress={() => router.push(`/chat/${chat.id}`)}>

              <View style={s.avatarWrapper}>
                <View style={s.avatar}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>
                    {other?.name?.charAt(0) || '?'}
                  </Text>
                </View>
                {hasUnread && <View style={s.unreadDot} />}
              </View>

              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[s.name, hasUnread && s.nameUnread]}>
                  {other?.name || 'User'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="pricetag" size={11} color={colors.muted} />
                  <Text style={[s.preview, hasUnread && s.previewUnread]} numberOfLines={1}>
                    {chat.items?.name} · {lastMsg?.text || 'Mulai percakapan...'}
                  </Text>
                </View>
              </View>

              <Text style={s.time}>{lastMsg ? formatTime(lastMsg.created_at) : ''}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.border} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
              Belum Ada Chat
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', paddingHorizontal: 40 }}>
              Klaim barang atau hubungi pelapor untuk mulai chat
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
  header: { padding: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  chatItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  chatItemUnread: { backgroundColor: `${colors.accent}08` },
  avatarWrapper: { width: 46, height: 46 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#4a9eff', alignItems: 'center', justifyContent: 'center' },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 13, height: 13, borderRadius: 7, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.bg },
  name: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  nameUnread: { fontWeight: '900' },
  preview: { fontSize: 12, color: colors.muted, flex: 1 },
  previewUnread: { color: colors.text, fontWeight: '600' },
  time: { fontSize: 11, color: colors.muted },
});