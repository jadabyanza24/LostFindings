import { memo, useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { colors } from '../../constants/theme';
import { SkeletonDetail, SkeletonList, SkeletonRows } from '../../components/Skeleton';
import { Ionicons } from '@expo/vector-icons';

const ChatMessageBubble = memo(function ChatMessageBubble({ msg, userId, formatTime }: {
  msg: any;
  userId?: string;
  formatTime: (isoString: string) => string;
}) {
  const isMine = msg.sender_id === userId;
  const isSystem = msg.text?.includes('sudah konfirmasi') || msg.text?.includes('menolak jadwal') || msg.text?.includes('menerima jadwal');

  if (isSystem) return (
    <View style={s.systemMsg}>
      <Text style={s.systemMsgText}>{msg.text}</Text>
    </View>
  );

  return (
    <View style={[s.msgRow, isMine && { alignSelf: 'flex-end', alignItems: 'flex-end' }]}>
      <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
        <Text style={[s.bubbleText, isMine && { color: '#000' }]}>{msg.text}</Text>
      </View>
      <Text style={s.msgTime}>{formatTime(msg.created_at)}</Text>
    </View>
  );
});
const mergeUniqueMessages = (current: any[], incoming: any[]) => {
  const map = new Map<string, any>();
  [...current, ...incoming].forEach((message, index) => {
    const key = message.id ? String(message.id) : `fallback-${message.created_at}-${message.sender_id}-${index}`;
    map.set(key, message);
  });
  return [...map.values()].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};
export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useStore(s => s.user);
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchChat();
    const sub = supabase.channel(`chat:${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'messages', filter: `chat_id=eq.${id}`
      }, payload => {
        if (payload.new.sender_id !== user?.id) {
          setMessages(prev => mergeUniqueMessages(prev, [payload.new]));
          markMessagesAsRead([payload.new]);
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'chats', filter: `id=eq.${id}`
      }, payload => {
        setChat((prev: any) => ({ ...prev, ...payload.new }));
      })
      .on('postgres_changes', {
        event: '*', schema: 'public',
        table: 'appointments', filter: `chat_id=eq.${id}`
      }, () => fetchChat())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [id]);

  const formatTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Jakarta' });
};

  const fetchChat = async () => {
    const { data: chatData } = await supabase.from('chats')
      .select(`*, items(id, name, type, user_id),
        user1:users!chats_user1_id_fkey(id, name),
        user2:users!chats_user2_id_fkey(id, name)`)
      .eq('id', id).single();
    setChat(chatData);

    const { data: msgs } = await supabase.from('messages')
      .select('*').eq('chat_id', id).order('created_at', { ascending: false }).limit(80);
    if (msgs) {
      const orderedMsgs = [...msgs].reverse();
      setMessages(prev => mergeUniqueMessages(prev, orderedMsgs));
      markMessagesAsRead(orderedMsgs);
    }

    const { data: appts } = await supabase.from('appointments')
      .select('*').eq('chat_id', id);
    if (appts) setAppointments(appts);

    setLoading(false);
  };

  const markMessagesAsRead = async (messagesToMark: any[]) => {
    if (!user) return;

    const unreadMessages = messagesToMark.filter(message =>
      message.sender_id !== user.id && !((message.read_by || []).includes(user.id))
    );

    if (unreadMessages.length === 0) return;

    await Promise.all(unreadMessages.map(message => {
      const readBy = [...new Set([...(message.read_by || []), user.id])];
      return supabase.from('messages')
        .update({ read_by: readBy })
        .eq('id', message.id);
    }));

    setMessages(prev => prev.map(message => {
      if (!unreadMessages.some(unread => unread.id === message.id)) return message;
      return { ...message, read_by: [...new Set([...(message.read_by || []), user.id])] };
    }));
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const text = input.trim();
    setInput('');
    const tempMsg = {
      id: `temp-${Date.now()}`,
      chat_id: id, sender_id: user.id,
      text, created_at: new Date().toISOString() };
    setMessages(prev => mergeUniqueMessages(prev, [tempMsg]));
    const { data: sentMsg } = await supabase.from('messages')
      .insert({ chat_id: id, sender_id: user.id, text })
      .select().single();
    if (sentMsg) setMessages(prev => prev.map(m => m.id === tempMsg.id ? sentMsg : m));
    const otherUserId = chat?.user1?.id === user.id ? chat?.user2?.id : chat?.user1?.id;
    await supabase.from('notifications').insert({
      user_id: otherUserId, type: 'msg',
      title: `Pesan dari ${user.name}`,
      body: text.length > 50 ? text.substring(0, 50) + '...' : text, read: false });
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleCancel = async () => {
  Alert.alert(
    'Batalkan Klaim?',
    'Klaim akan dibatalkan dan barang kembali tersedia untuk diklaim orang lain.',
    [
      { text: 'Tidak', style: 'cancel' },
      { text: 'Ya, Batalkan', style: 'destructive', onPress: async () => {
        // Reset klaim
        await supabase.from('claims')
          .update({ status: 'cancelled' })
          .eq('item_id', chat.items?.id)
          .eq('status', 'pending');

        // Reset item status
        await supabase.from('items')
          .update({ status: 'active' })
          .eq('id', chat.items?.id);

        // Reset konfirmasi di chat
        await supabase.from('chats')
          .update({
            confirmed_by_finder: false,
            confirmed_by_owner: false,
            completed: false })
          .eq('id', id);

        // Kirim pesan sistem
        await supabase.from('messages').insert({
          chat_id: id, sender_id: user!.id,
          text: `${user!.name} membatalkan klaim barang.` });

        // Notif ke pihak lain
        const otherUserId = chat?.user1?.id === user!.id
          ? chat?.user2?.id : chat?.user1?.id;
        await supabase.from('notifications').insert({
          user_id: otherUserId, type: 'claim',
          title: 'Klaim Dibatalkan',
          body: `${user!.name} membatalkan klaim "${chat.items?.name}".`,
          read: false });

        fetchChat();
        Alert.alert('Klaim Dibatalkan', 'Barang kembali tersedia untuk diklaim.');
      }}
    ]
  );
};

  const handleConfirm = async () => {
    if (!user || !chat) return;
    const itemOwnerId = chat.items?.user_id;
    const isFinder = user.id === itemOwnerId;
    console.log('=== DEBUG KONFIRMASI ===');
    console.log('user.id:', user.id);
    console.log('itemOwnerId:', itemOwnerId);
    console.log('isFinder:', isFinder);
    console.log('chat.user1:', chat.user1?.id, chat.user1?.name);
    console.log('chat.user2:', chat.user2?.id, chat.user2?.name);
    console.log('item.user_id:', chat.items?.user_id);
    Alert.alert(
      'Konfirmasi Serah Terima',
      isFinder
        ? 'Konfirmasi bahwa kamu sudah menyerahkan barang ke pemiliknya?'
        : 'Konfirmasi bahwa kamu sudah menerima barangmu?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya, Konfirmasi', onPress: async () => {
          const updateField = isFinder
            ? { confirmed_by_finder: true }
            : { confirmed_by_owner: true };
          await supabase.from('chats').update(updateField).eq('id', id);
          const { data: updatedChat } = await supabase
            .from('chats').select('*').eq('id', id).single();
          if (updatedChat?.confirmed_by_finder && updatedChat?.confirmed_by_owner) {
            await supabase.from('chats').update({ completed: true }).eq('id', id);
            await supabase.from('items').update({ status: 'claimed' }).eq('id', chat.items?.id);
            const otherUserId = chat?.user1?.id === user.id ? chat?.user2?.id : chat?.user1?.id;
            await supabase.from('notifications').insert([
              { user_id: user.id, type: 'match', title: 'Barang Berhasil Dikembalikan!', body: `"${chat.items?.name}" sudah diserahterimakan.`, read: false },
              { user_id: otherUserId, type: 'match', title: 'Barang Berhasil Dikembalikan!', body: `"${chat.items?.name}" sudah diserahterimakan.`, read: false }
            ]);
            Alert.alert('Selesai!', 'Terima kasih sudah menggunakan aplikasi ini!', [
              { text: 'OK', onPress: () => router.replace('/(tabs)') }
            ]);
          } else {
            const otherUserId = chat?.user1?.id === user.id ? chat?.user2?.id : chat?.user1?.id;
            await supabase.from('notifications').insert({
              user_id: otherUserId, type: 'claim',
              title: 'Menunggu Konfirmasimu!',
              body: `${user.name} sudah konfirmasi serah terima "${chat.items?.name}".`, read: false });
            await supabase.from('messages').insert({
              chat_id: id, sender_id: user.id,
              text: `${user.name} sudah konfirmasi serah terima barang.` });
            Alert.alert('Konfirmasi Dikirim!', 'Menunggu konfirmasi dari pihak lainnya.');
          }
          fetchChat();
        }}
      ]
    );
  };

  const handleAppointmentResponse = async (apptId: string, status: 'accepted' | 'declined') => {
    await supabase.from('appointments').update({ status }).eq('id', apptId);
    await supabase.from('messages').insert({
      chat_id: id, sender_id: user!.id,
      text: status === 'accepted'
        ? `${user!.name} menerima jadwal janjian!`
        : `${user!.name} menolak jadwal janjian.` });
    fetchChat();
  };

  const otherUser = chat?.user1?.id === user?.id ? chat?.user2 : chat?.user1;
  const itemOwnerId = chat?.items?.user_id;
  const isFinder = user?.id === itemOwnerId;
  const myConfirmed = isFinder ? chat?.confirmed_by_finder : chat?.confirmed_by_owner;
  const isCompleted = chat?.completed;

  if (loading) return <SkeletonRows count={7} />;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={s.chatAvatar}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff' }}>
            {otherUser?.name?.charAt(0) || '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.chatName}>{otherUser?.name || 'User'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Ionicons name="pricetag-outline" size={12} color={colors.muted} />
            <Text style={s.chatItem}>{chat?.items?.name}</Text>
          </View>
        </View>
        {!isCompleted && (
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => router.push({
              pathname: '/chat/appointment',
              params: {
                chatId: id,
                itemName: chat?.items?.name || 'Barang',
                otherName: otherUser?.name || 'User' }
            })}>
            <Ionicons name="calendar" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {!isCompleted && (
  <View style={{ margin: 12, marginBottom: 4 }}>
    {/* Banner Penemu */}
    <TouchableOpacity
      style={[s.confirmBanner, chat?.confirmed_by_finder && s.confirmBannerDone]}
      onPress={isFinder && !chat?.confirmed_by_finder ? handleConfirm : undefined}
      disabled={!isFinder || !!chat?.confirmed_by_finder}>
      <View style={s.confirmRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="search" size={14} color={colors.text} />
          <Text style={s.confirmRole}>Penemu</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {chat?.confirmed_by_finder
            ? <Ionicons name="checkmark-circle" size={14} color={colors.green} />
            : <Ionicons name="time" size={14} color={colors.accent} />
          }
          <Text style={[s.confirmStatus, chat?.confirmed_by_finder && { color: colors.green }]}>
            {chat?.confirmed_by_finder ? 'Sudah serahkan' : 'Belum konfirmasi'}
          </Text>
        </View>
      </View>
      {isFinder && !chat?.confirmed_by_finder && (
        <Text style={s.confirmTap}>Tap untuk konfirmasi kamu sudah menyerahkan barang</Text>
      )}
    </TouchableOpacity>

    {/* Banner Pemilik */}
    <TouchableOpacity
      style={[s.confirmBanner, chat?.confirmed_by_owner && s.confirmBannerDone, { marginTop: 4 }]}
      onPress={!isFinder && !chat?.confirmed_by_owner ? handleConfirm : undefined}
      disabled={isFinder || !!chat?.confirmed_by_owner}>
      <View style={s.confirmRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="person" size={14} color={colors.text} />
          <Text style={s.confirmRole}>Pemilik</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {chat?.confirmed_by_owner
            ? <Ionicons name="checkmark-circle" size={14} color={colors.green} />
            : <Ionicons name="time" size={14} color={colors.accent} />
          }
          <Text style={[s.confirmStatus, chat?.confirmed_by_owner && { color: colors.green }]}>
            {chat?.confirmed_by_owner ? 'Sudah terima' : 'Belum konfirmasi'}
          </Text>
        </View>
      </View>
      {!isFinder && !chat?.confirmed_by_owner && (
        <Text style={s.confirmTap}>Tap untuk konfirmasi kamu sudah menerima barangmu</Text>
      )}
    </TouchableOpacity>

    {/* Tombol Cancel — hanya muncul kalau belum completed */}
    {!chat?.confirmed_by_finder && !chat?.confirmed_by_owner && (
      <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
        <Ionicons name="close-circle" size={14} color={colors.red} />
        <Text style={s.cancelBtnText}>Batalkan Klaim</Text>
      </TouchableOpacity>
    )}
  </View>
)}

      {isCompleted && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding:10 }}>
          <Ionicons name="checkmark-circle" size={18} color={colors.green} />
          <Text style={s.completedText}>Barang sudah berhasil diserahterimakan!</Text>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
          ref={flatRef}
          data={messages}
          keyExtractor={(message, index) => `${message.id || 'message'}-${message.created_at || index}-${index}`}
          contentContainerStyle={[
            { padding: 16, gap: 8, paddingBottom: 16 },
            messages.length === 0 && { flex: 1, justifyContent: 'center' }
          ]}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons 
                name="chatbubbles-outline" 
                size={60} 
                color={colors.border}
                style={{ marginBottom: 12 }} 
              />
              <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center' }}>
                Belum ada pesan.{"\n"}Mulai percakapan duluan!
              </Text>
            </View>
          }
          renderItem={({ item: msg }) => {
            return <ChatMessageBubble msg={msg} userId={user?.id} formatTime={formatTime} />;
          }}
        />

        {!isCompleted && (
          <View style={s.inputRow}>
            <TextInput
              style={s.inputBox}
              placeholder="Ketik pesan..."
              placeholderTextColor={colors.muted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
              <Ionicons name="send" size={18} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {isCompleted && (
          <View style={s.completedFooter}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Chat ini sudah selesai</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  chatAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4a9eff', alignItems: 'center', justifyContent: 'center' },
  chatName: { fontSize: 15, fontWeight: '700', color: colors.text },
  chatItem: { fontSize: 11, color: colors.muted },
  confirmBanner: { marginHorizontal: 12, marginTop: 8, padding: 12, backgroundColor: 'rgba(240,165,0,0.1)', borderWidth: 1, borderColor: colors.accent, borderRadius: 10 },
  confirmBannerDone: { backgroundColor: 'rgba(46,204,138,0.1)', borderColor: colors.green },
  confirmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  confirmRole: { fontSize: 13, fontWeight: '700', color: colors.text },
  confirmStatus: { fontSize: 12, fontWeight: '600', color: colors.accent },
  confirmTap: { fontSize: 11, color: colors.muted, marginTop: 4 },
  completedBanner: { margin: 12, padding: 14, backgroundColor: 'rgba(46,204,138,0.15)', borderWidth: 1, borderColor: colors.green, borderRadius: 12, alignItems: 'center' },
  completedText: { fontSize: 13, fontWeight: '700', color: colors.green },
  msgRow: { maxWidth: '78%', alignSelf: 'flex-start' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  msgTime: { fontSize: 10, color: colors.muted, marginTop: 3, marginHorizontal: 4 },
  systemMsg: { alignSelf: 'center', backgroundColor: 'rgba(46,204,138,0.1)', borderWidth: 1, borderColor: colors.green, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 6, marginVertical: 4 },
  systemMsgText: { fontSize: 12, color: colors.green, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  inputBox: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, color: colors.text, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  completedFooter: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  apptCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent, borderRadius: 16, padding: 16, marginVertical: 4, width: '85%', alignSelf: 'center' },
  apptTitle: { fontSize: 14, fontWeight: '800', color: colors.accent, marginBottom: 12, textAlign: 'center' },
  apptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  apptLabel: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  apptValue: { fontSize: 13, color: colors.text, fontWeight: '700' },
  apptActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, padding: 10, backgroundColor: 'rgba(224,92,92,0.08)', borderWidth: 1, borderColor: 'rgba(224,92,92,0.3)', borderRadius: 10 },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: colors.red },
  apptAccept: { flex: 1, flexDirection: 'row', padding: 10, backgroundColor: colors.accent, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  apptDecline: { flex: 1, flexDirection: 'row', padding: 10, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.red, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  apptAccepted: { marginTop: 10, padding: 8, backgroundColor: 'rgba(46,204,138,0.1)', borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  apptDeclined: { marginTop: 10, padding: 8, backgroundColor: 'rgba(224,92,92,0.1)', borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  apptPending: { marginTop: 10, padding: 8, backgroundColor: colors.surface2, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' } });











