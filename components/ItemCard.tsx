import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

const CATEGORY_ICONS: Record<string, any> = {
  elektronik: 'phone-portrait',
  dompet: 'wallet',
  kunci: 'key',
  kartu: 'card',
  tas: 'bag-handle',
  lainnya: 'cube',
};

export default function ItemCard({ item, onPress }: { item: any; onPress: () => void }) {
  const isFound = item.type === 'found';
  const isClaimed = item.status === 'claimed';
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.imgBox}>
        {item.image_url && item.image_url.startsWith('http')
          ? <Image source={{ uri: item.image_url }} style={{ width: 90, height: 90 }} resizeMode="cover" />
          : <View style={s.iconBox}>
              <Ionicons
                name={CATEGORY_ICONS[item.category] || 'cube'}
                size={32} color={colors.muted} />
            </View>
        }
      </View>
      <View style={s.body}>
        <View style={s.top}>
          <Text style={s.name} numberOfLines={1}>{item.name}</Text>
          <View style={[s.badge,
            isClaimed ? s.badgeClaimed : isFound ? s.badgeFound : s.badgeLost]}>
            <Ionicons
              name={isClaimed ? 'checkmark-circle' : isFound ? 'search' : 'help-circle'}
              size={10}
              color={isClaimed ? colors.blue : isFound ? colors.green : colors.red}
            />
            <Text style={[s.badgeText,
              { color: isClaimed ? colors.blue : isFound ? colors.green : colors.red }]}>
              {isClaimed ? 'Diklaim' : isFound ? 'Temuan' : 'Hilang'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
          <Ionicons name="location" size={11} color={colors.muted} />
          <Text style={s.loc} numberOfLines={1}>{item.location}</Text>
        </View>
        <View style={s.footer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time" size={11} color={colors.muted} />
            <Text style={s.time}>{item.created_at?.slice(0, 10)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="person" size={11} color={colors.accent} />
            <Text style={s.finder}>{item.users?.name || 'Anonim'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden', marginBottom: 2 },
  imgBox: { width: 90, height: 90 },
  iconBox: { width: 90, height: 90, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 12 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  badgeFound: { backgroundColor: 'rgba(46,204,138,0.15)' },
  badgeLost: { backgroundColor: 'rgba(224,92,92,0.15)' },
  badgeClaimed: { backgroundColor: 'rgba(74,158,255,0.15)' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  loc: { fontSize: 12, color: colors.muted, flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontSize: 11, color: colors.muted },
  finder: { fontSize: 11, color: colors.accent, fontWeight: '600' },
});