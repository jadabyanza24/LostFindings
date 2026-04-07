import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Share, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import ImageViewing from 'react-native-image-viewing';
import { useVerification } from '../../lib/useVerification';

const CATEGORY_ICONS: Record<string, any> = {
  elektronik: 'phone-portrait-outline',
  dompet: 'wallet-outline',
  kunci: 'key-outline',
  kartu: 'card-outline',
  tas: 'briefcase-outline',
  lainnya: 'cube-outline'
};

export default function ItemDetailScreen() {
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useStore(s => s.user);
  const { requireVerified } = useVerification();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  useEffect(() => { fetchItem(); }, [id]);

  const fetchItem = async () => {
    const { data } = await supabase
      .from('items').select('*, users(id, name, nim, fakultas)')
      .eq('id', id).single();
    if (data) setItem(data);
    if (user) {
      const { data: claim } = await supabase.from('claims')
        .select('id').eq('item_id', id).eq('claimant_id', user.id).single();
      if (claim) setAlreadyClaimed(true);
    }
    setLoading(false);
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handleClaim = async () => {
  if (!user || !item) return;
  setClaiming(true);
  try {
    // Cek apakah sudah ada klaim pending
    const { data: existingClaim } = await supabase
      .from('claims')
      .select('id')
      .eq('item_id', item.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingClaim) {
      Alert.alert('Tidak Bisa Klaim', 'Barang ini sedang dalam proses klaim oleh orang lain.');
      setClaiming(false);
      return;
    }

    const { error } = await supabase.from('claims').insert({
      item_id: item.id,
      claimant_id: user.id,
      status: 'pending',
    });
    if (error) throw error;
    setAlreadyClaimed(true);
    Alert.alert('Klaim Terkirim!', 'Tunggu konfirmasi dari pelapor.');
  } catch (e: any) {
    Alert.alert('Error', e.message);
  } finally { setClaiming(false); }
};

  const handleChat = async () => {
    if (!user) return Alert.alert('Login dulu!');
    const { data: existing } = await supabase.from('chats').select('id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('item_id', item.id).single();
    if (existing) return router.push(`/chat/${existing.id}`);
    const { data: chat } = await supabase.from('chats').insert({
      item_id: item.id, user1_id: user.id, user2_id: item.user_id,
    }).select().single();
    if (chat) router.push(`/chat/${chat.id}`);
  };

  const submitReport = async (reason: string) => {
    if (!user) return Alert.alert('Login dulu!');
    await supabase.from('reports').insert({
      reporter_id: user.id,
      item_id: item.id,
      reason,
      status: 'pending',
    });
    Alert.alert('Laporan Terkirim', 'Terima kasih! Tim admin akan meninjau laporan ini.');
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.accent} size="large"/></View>;
  if (!item) return <View style={s.center}><Text style={{color:colors.muted}}>Tidak ditemukan.</Text></View>;

  const isOwner = user?.id === item.users?.id;
  const isFound = item.type === 'found';
  const isClaimed = item.status === 'claimed';

  const handleShare = async () => {
    try {
      await Share.share({
        title: `[LostFindings] ${isFound ? 'Barang Temuan' : 'Barang Hilang'}: ${item.name}`,
        message:
          `[${isFound ? 'DITEMUKAN' : 'DICARI'}] — ${item.name}\n` +
          `Lokasi: ${item.location}\n` +
          `Dilaporkan: ${item.created_at?.slice(0, 10)}\n` +
          `Pelapor: ${item.users?.name || 'Anonim'}\n\n` +
          `Bantu sebarkan! Cek di app LostFindings.`,
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (item && item.image_url && typeof item.image_url === 'string' && item.image_url.includes(',')) {
    item.image_urls = item.image_url.split(',');
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Detail Barang</Text>
        <View style={{width:36}}/>
      </View>
      <ScrollView contentContainerStyle={{paddingBottom:100}}>
        <View style={{position:'relative'}}>
          {item.image_urls && item.image_urls.length > 0 ? (
            <View style={{ height: 280 }}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={{ height: 280 }}>
                {item.image_urls.map((url: string, i: number) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.9}
                    onPress={() => { setViewerIndex(i); setViewerVisible(true); }}>
                    <Image
                      source={{ uri: url }}
                      style={{ width: SCREEN_WIDTH, height: 280, backgroundColor: '#000' }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {item.image_urls.length > 1 && (
                <View style={s.dotRow}>
                  {item.image_urls.map((_: any, i: number) => (
                    <View key={i} style={[s.dot, i === activeIndex ? s.dotActive : null]} />
                  ))}
                </View>
              )}
              <ImageViewing
                images={item.image_urls.map((url: string) => ({ uri: url }))}
                imageIndex={viewerIndex}
                visible={viewerVisible}
                onRequestClose={() => setViewerVisible(false)}
                swipeToCloseEnabled
                doubleTapToZoomEnabled
              />
            </View>
          ) : item.image_url && item.image_url.startsWith('http') ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => { setViewerIndex(0); setViewerVisible(true); }}>
              <Image
                source={{ uri: item.image_url }}
                style={{ width: '100%', height: 280, backgroundColor: '#000' }}
                resizeMode="contain"
              />
              <ImageViewing
                images={[{ uri: item.image_url }]}
                imageIndex={0}
                visible={viewerVisible}
                onRequestClose={() => setViewerVisible(false)}
                swipeToCloseEnabled
                doubleTapToZoomEnabled
              />
            </TouchableOpacity>
          ) : (
            <View style={s.imgPlaceholder}>
              <Ionicons name={CATEGORY_ICONS[item.category?.toLowerCase()] || 'cube-outline'} size={80} color={colors.muted} />
            </View>
          )}
          <View style={[s.statusBadge, isClaimed ? s.badgeClaimed : isFound ? s.badgeFound : s.badgeLost]}>
            <Ionicons
              name={isClaimed ? 'checkmark-circle' : isFound ? 'search' : 'help-circle'}
              size={12} color="#fff" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>
              {isClaimed ? 'Diklaim' : isFound ? 'Ditemukan' : 'Dicari'}
            </Text>
          </View>
        </View>
        <View style={{padding:20}}>
          <Text style={s.name}>{item.name}</Text>
          
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <View style={s.infoTile}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Ionicons name="location" size={12} color={colors.muted} />
                <Text style={s.infoLabel}>Lokasi</Text>
              </View>
              <Text style={s.infoValue}>{item.location}</Text>
            </View>

            <View style={s.infoTile}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Ionicons name="calendar" size={12} color={colors.muted} />
                <Text style={s.infoLabel}>Waktu {isFound ? 'Temuan' : 'Hilang'}</Text>
              </View>
              {/* Ini bagian yang dipisah barisnya */}
              <Text style={s.infoValue}>{item.created_at?.slice(0, 10)}</Text>
              {item.incident_time ? (
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 4 }}>
                  {item.incident_time} WIB
                </Text>
              ) : null}
            </View>
          </View>

          {item.description ? (
            <View style={s.descBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="document-text" size={14} color={colors.muted} />
                <Text style={[s.sectionLabel, { marginBottom: 0 }]}>Deskripsi</Text>
              </View>
              <Text style={{fontSize:14,color:colors.text,lineHeight:22}}>{item.description}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name="person" size={14} color={colors.muted} />
            <Text style={[s.sectionLabel, { marginBottom: 0 }]}>{isFound?'PENEMU':'PEMILIK'}</Text>
          </View>
          <View style={s.reporterCard}>
            <View style={s.avatar}>
              <Text style={{fontSize:18,fontWeight:'900',color:'#000'}}>
                {item.users?.name?.charAt(0)||'?'}
              </Text>
            </View>
            <View style={{flex:1}}>
              <Text style={{fontSize:15,fontWeight:'700',color:colors.text}}>{item.users?.name||'Anonim'}</Text>
              <Text style={{fontSize:12,color:colors.muted}}>NIM: {item.users?.nim||'-'}</Text>
            </View>
            {!isOwner && (
              <TouchableOpacity style={s.chatIconBtn} onPress={() => requireVerified(handleChat)}>
                <Ionicons name="chatbubble" size={18} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>
          {!isOwner && !isClaimed && isFound && (
            <TouchableOpacity
              style={[s.actionBtn, (alreadyClaimed || claiming) && s.actionBtnDisabled]}
              onPress={() => requireVerified(handleClaim)}
              disabled={alreadyClaimed || claiming}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {claiming
                  ? <Ionicons name="time" size={18} color={colors.muted} />
                  : alreadyClaimed
                  ? <Ionicons name="checkmark-circle" size={18} color={colors.muted} />
                  : <Ionicons name="hand-right" size={18} color="#000" />
                }
                <Text style={[s.actionBtnText, alreadyClaimed && { color: colors.muted }]}>
                  {claiming ? 'Memproses...' : alreadyClaimed ? 'Klaim Terkirim' : 'Ajukan Klaim'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <TouchableOpacity style={[s.shareBtn, { flex: 1 }]} onPress={handleShare}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="share-social" size={16} color={colors.text} />
                <Text style={s.shareBtnText}>Bagikan</Text>
              </View>
            </TouchableOpacity>
            {!isOwner && !isClaimed && (
              <TouchableOpacity style={[s.reportBtn, { flex: 1 }]} onPress={() => {
                Alert.alert(
                  'Laporkan Barang',
                  'Kenapa kamu melaporkan barang ini?',
                  [
                    { text: 'Konten Palsu/Spam', onPress: () => submitReport('Konten palsu atau spam') },
                    { text: 'Informasi Menyesatkan', onPress: () => submitReport('Informasi menyesatkan') },
                    { text: 'Konten Tidak Pantas', onPress: () => submitReport('Konten tidak pantas') },
                    { text: 'Batal', style: 'cancel' },
                  ]
                );
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Ionicons name="flag" size={14} color={colors.red} />
                  <Text style={s.reportBtnText}>Laporkan</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          {!isOwner && item.type==='lost' && (
            <TouchableOpacity style={s.actionBtn} onPress={() => requireVerified(handleChat)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="chatbubbles" size={18} color="#000" />
                <Text style={s.actionBtnText}>Hubungi Pemilik</Text>
              </View>
            </TouchableOpacity>
          )}
          {isClaimed && (
            <View style={s.claimedBanner}>
              <Ionicons name="checkmark-circle" size={20} color={colors.green} />
              <Text style={s.claimedText}>Barang Sudah Dikembalikan</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:colors.bg},
  center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.bg},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,borderBottomWidth:1,borderBottomColor:colors.border},
  backBtn:{width:36,height:36,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  headerTitle:{fontSize:17,fontWeight:'700',color:colors.text},
  imgPlaceholder:{width:'100%',height:240,backgroundColor:colors.surface2,alignItems:'center',justifyContent:'center'},
  badgeFound: { backgroundColor: 'rgba(0,0,0,0.65)' },
  badgeLost: { backgroundColor: 'rgba(0,0,0,0.65)' },
  badgeClaimed: { backgroundColor: 'rgba(0,0,0,0.65)' },
  name:{fontSize:26,fontWeight:'900',color:colors.text,marginBottom:12},
  infoTile:{flex:1, backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:10,padding:12},
  infoLabel:{fontSize:10,color:colors.muted,fontWeight:'600',textTransform:'uppercase',letterSpacing:0.5,marginBottom:4},
  infoValue:{fontSize:13,fontWeight:'600',color:colors.text},
  descBox:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:10,padding:14,marginBottom:20},
  descLabel:{fontSize:12,fontWeight:'700',color:colors.muted,marginBottom:6},
  sectionLabel:{fontFamily: 'Michroma',fontSize:11,fontWeight:'700',color:colors.muted,letterSpacing:1,marginBottom:8},
  reporterCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:12,padding:14,marginBottom:20},
  avatar:{width:46,height:46,borderRadius:23,backgroundColor:colors.accent,alignItems:'center',justifyContent:'center'},
  chatIconBtn:{width:38,height:38,borderRadius:19,backgroundColor:colors.surface2,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  actionBtn:{padding:17,backgroundColor:colors.accent,borderRadius:16,alignItems:'center',marginBottom:10},
  actionBtnDisabled:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  actionBtnText:{fontSize:16,fontWeight:'800',color:'#000'},
  claimedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: 'rgba(46,204,138,0.1)',
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 14,
    marginBottom: 12,
  },
  claimedText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.green,
  },
  shareBtn: { 
    padding: 14, 
    backgroundColor: colors.surface, 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 12,
  },
  shareBtnText: { fontSize: 13, fontWeight: '700', color: colors.text },
  reportBtn: {
    padding: 14,
    backgroundColor: 'rgba(224,92,92,0.1)',
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 12,
  },
  reportBtnText: { fontSize: 13, fontWeight: '700', color: colors.red },
  dotRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    position: 'absolute', 
    bottom: 12, 
    width: '100%', 
    gap: 6 
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: 'rgba(255, 255, 255, 0.5)' 
  },
  dotActive: {
    backgroundColor: '#ffffff'
  },
  statusBadge: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 }
});