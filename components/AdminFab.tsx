import { TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { useStore } from '../lib/store';

export default function AdminFab() {
  const user = useStore(s => s.user);
  const insets = useSafeAreaInsets();

  if (user?.role !== 'admin') return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[s.fab, { bottom: insets.bottom + 92 }]}
      onPress={() => router.push('/(tabs)/admin')}
    >
      <Ionicons name="shield-checkmark" size={24} color="#000" />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    zIndex: 100,
  },
});
