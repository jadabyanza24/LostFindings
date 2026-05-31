import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, InteractionManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { colors } from '../../constants/theme';
import { SkeletonRows } from '../../components/Skeleton';

type ChatPreview = {
  id: string;
  itemName: string;
  otherName: string;
  otherInitial: string;
  lastText: string;
  lastMessageAt: string;
  hasUnread: boolean;
};

const formatTime = (isoString: string) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
};

const getLatestMessage = (messages: any[] = []) => messages[0] || null;

const ChatRow = memo(function ChatRow({ chat }: { chat: ChatPreview }) {
  return (
    <TouchableOpacity
      style={[s.chatItem, chat.hasUnread && s.chatItemUnread]}
      onPress={() => router.push(`/chat/${chat.id}`)}
      activeOpacity={0.82}
    >
      <View style={s.avatarWrapper}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{chat.otherInitial}</Text>
        </View>
        {chat.hasUnread && <View style={s.unreadDot} />}
      </View>

      <View style={s.chatBody}>
        <Text style={[s.name, chat.hasUnread && s.nameUnread]} numberOfLines={1}>
          {chat.otherName}
        </Text>
        <View style={s.previewRow}>
          <Ionicons name="pricetag" size={11} color={colors.muted} />
          <Text style={[s.preview, chat.hasUnread && s.previewUnread]} numberOfLines={1}>
            {chat.itemName} · {chat.lastText}
          </Text>
        </View>
      </View>

      <Text style={s.time}>{formatTime(chat.lastMessageAt)}</Text>
    </TouchableOpacity>
  );
});

export default function ChatListScreen() {
  const user = useStore(s => s.user);
  const insets = useSafeAreaInsets();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [interactionReady, setInteractionReady] = useState(false);
  const chatIdsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);
  const fetchVersionRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactionTaskRef = useRef<{ cancel?: () => void } | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const buildPreview = useCallback((chat: any): ChatPreview => {
    const other = chat.user1?.id === user?.id ? chat.user2 : chat.user1;
    const latestMessage = getLatestMessage(chat.messages || []);
    const hasUnread = !!latestMessage && latestMessage.sender_id !== user?.id && !((latestMessage.read_by || []).includes(user?.id));

    return {
      id: chat.id,
      itemName: chat.items?.name || 'Barang',
      otherName: other?.name || 'User',
      otherInitial: other?.name?.charAt(0) || '?',
      lastText: latestMessage?.text || 'Mulai percakapan...',
      lastMessageAt: latestMessage?.created_at || chat.created_at,
      hasUnread,
    };
  }, [user?.id]);

  const fetchChats = useCallback(async (showSkeleton = false) => {
    if (!user?.id) {
      setChats([]);
      setLoading(false);
      return;
    }

    const version = ++fetchVersionRef.current;
    if (showSkeleton) setLoading(true);

    const { data, error } = await supabase.from('chats')
      .select(`id, created_at,
        items(id, name),
        user1:users!chats_user1_id_fkey(id, name),
        user2:users!chats_user2_id_fkey(id, name),
        messages(id, text, created_at, sender_id, read_by)`)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: false, referencedTable: 'messages' })
      .limit(1, { referencedTable: 'messages' });

    if (!mountedRef.current || version !== fetchVersionRef.current) return;

    if (!error && data) {
      const previews = data
        .map(buildPreview)
        .sort((a, b) => {
          const unreadDiff = Number(b.hasUnread) - Number(a.hasUnread);
          if (unreadDiff !== 0) return unreadDiff;
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });

      chatIdsRef.current = new Set(previews.map(chat => chat.id));
      setChats(previews);
    }

    setLoading(false);
  }, [buildPreview, user?.id]);

  const scheduleFetch = useCallback((delay = 250) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => fetchChats(false));
    }, delay);
  }, [fetchChats]);

  useEffect(() => {
    if (!user?.id) {
      setChats([]);
      setLoading(false);
      return;
    }

    fetchChats(true);

    const channel = supabase.channel(`chat-list-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, payload => {
        const chatId = String((payload.new as any)?.chat_id || (payload.old as any)?.chat_id || '');
        if (!chatIdsRef.current.has(chatId)) return;
        scheduleFetch();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats',
      }, () => scheduleFetch(500))
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchChats, interactionReady, scheduleFetch, user?.id]);

  useFocusEffect(useCallback(() => {
    if (!user?.id) return;
    scheduleFetch(350);
  }, [scheduleFetch, user?.id]));

  const contentContainerStyle = useMemo(() => (
    chats.length === 0
      ? s.emptyContent
      : { paddingBottom: 49 + insets.bottom + 16 }
  ), [chats.length, insets.bottom]);

  const renderItem = useCallback(({ item }: { item: ChatPreview }) => <ChatRow chat={item} />, []);

  if (!interactionReady) return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}><Text style={s.title}>Percakapan</Text></View>
    </SafeAreaView>
  );

  if (loading) return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}><Text style={s.title}>Percakapan</Text></View>
      <SkeletonRows count={6} />
    </SafeAreaView>
  );

  if (!user) return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}><Text style={s.title}>Percakapan</Text></View>
      <View style={s.emptyBox}>
        <Text style={s.emptyTitle}>Belum Login</Text>
        <Text style={s.emptyText}>Login untuk melihat percakapan</Text>
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
        keyExtractor={chat => chat.id}
        renderItem={renderItem}
        contentContainerStyle={contentContainerStyle}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        getItemLayout={(_, index) => ({ length: 75, offset: 75 * index, index })}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.border} style={{ marginBottom: 12 }} />
            <Text style={s.emptyTitle}>Belum Ada Chat</Text>
            <Text style={s.emptyText}>Klaim barang atau hubungi pelapor untuk mulai chat</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  chatItem: { height: 75, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  chatItemUnread: { backgroundColor: `${colors.accent}08` },
  avatarWrapper: { width: 46, height: 46 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#4a9eff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#fff' },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 13, height: 13, borderRadius: 7, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.bg },
  chatBody: { flex: 1, minWidth: 0 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  nameUnread: { fontWeight: '900' },
  preview: { fontSize: 12, color: colors.muted, flex: 1 },
  previewUnread: { color: colors.text, fontWeight: '600' },
  time: { fontSize: 11, color: colors.muted },
  emptyContent: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', paddingHorizontal: 40 },
});

