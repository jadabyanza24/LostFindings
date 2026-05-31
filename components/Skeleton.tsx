import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../constants/theme';

function useSkeletonProgress() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
  }, []);

  return progress;
}

export function SkeletonBlock({ style, progress }: { style?: ViewStyle | ViewStyle[]; progress: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.42, 0.9, 0.42]),
  }));

  return <Animated.View style={[s.block, style, animatedStyle]} />;
}

export function SkeletonCard() {
  const progress = useSkeletonProgress();

  return (
    <View style={s.card}>
      <SkeletonBlock progress={progress} style={s.image} />
      <View style={s.body}>
        <View style={s.topRow}>
          <SkeletonBlock progress={progress} style={s.title} />
          <SkeletonBlock progress={progress} style={s.badge} />
        </View>
        <SkeletonBlock progress={progress} style={s.location} />
        <View style={s.footerRow}>
          <SkeletonBlock progress={progress} style={s.date} />
          <SkeletonBlock progress={progress} style={s.reporter} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={s.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

export function SkeletonRow() {
  const progress = useSkeletonProgress();

  return (
    <View style={s.rowCard}>
      <SkeletonBlock progress={progress} style={s.avatar} />
      <View style={{ flex: 1 }}>
        <SkeletonBlock progress={progress} style={s.rowTitle} />
        <SkeletonBlock progress={progress} style={s.rowSubtitle} />
      </View>
    </View>
  );
}

export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <View style={s.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonRow key={index} />
      ))}
    </View>
  );
}

export function SkeletonDetail() {
  const progress = useSkeletonProgress();

  return (
    <View style={s.detailContainer}>
      <SkeletonBlock progress={progress} style={s.hero} />
      <View style={s.detailBody}>
        <SkeletonBlock progress={progress} style={s.detailTitle} />
        <SkeletonBlock progress={progress} style={s.detailMeta} />
        <SkeletonBlock progress={progress} style={s.detailLineWide} />
        <SkeletonBlock progress={progress} style={s.detailLine} />
        <View style={s.detailCard}>
          <SkeletonBlock progress={progress} style={s.rowTitle} />
          <SkeletonBlock progress={progress} style={s.detailLineWide} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  block: { backgroundColor: 'rgba(255,255,255,0.12)' },
  card: {
    flexDirection: 'row', minHeight: 100, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 16,
    overflow: 'hidden', marginBottom: 12,
  },
  image: { width: 100, height: '100%' },
  body: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { width: '58%', height: 16, borderRadius: 8 },
  badge: { width: 58, height: 22, borderRadius: 7 },
  location: { width: '72%', height: 12, borderRadius: 6, marginBottom: 18 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { width: 78, height: 11, borderRadius: 6 },
  reporter: { width: 88, height: 11, borderRadius: 6 },
  rowCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, marginBottom: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  rowTitle: { width: '62%', height: 14, borderRadius: 7, marginBottom: 10 },
  rowSubtitle: { width: '42%', height: 11, borderRadius: 6 },
  detailContainer: { flex: 1, backgroundColor: colors.bg },
  hero: { width: '100%', height: 280 },
  detailBody: { padding: 20 },
  detailTitle: { width: '68%', height: 24, borderRadius: 12, marginBottom: 14 },
  detailMeta: { width: '44%', height: 14, borderRadius: 7, marginBottom: 24 },
  detailLineWide: { width: '100%', height: 13, borderRadius: 7, marginBottom: 12 },
  detailLine: { width: '76%', height: 13, borderRadius: 7, marginBottom: 20 },
  detailCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginTop: 12 },
});
