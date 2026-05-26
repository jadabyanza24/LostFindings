import { Tabs, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { useStore } from '../../lib/store';
import { useVerification } from '../../lib/useVerification';

const PostButton = () => {
  const { requireVerified } = useVerification();
  return (
    <TouchableOpacity
      onPress={() => requireVerified(() => router.push('/items/new'))}
      style={{
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: colors.accent,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
        shadowColor: colors.accent,
        shadowOpacity: 0.5, shadowRadius: 12, elevation: 8
      }}>
      <Ionicons name="add" size={28} color="#000" />
    </TouchableOpacity>
  );
};

export default function TabLayout() {
  const user = useStore(s => s.user);
  const isAdmin = user?.role === 'admin';

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        height: 72, paddingBottom: 12,
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.muted,
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Beranda',
        tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
      }} />
      <Tabs.Screen name="chat" options={{
        title: 'Chat',
        tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
      }} />
      <Tabs.Screen name="post" options={{
        title: '',
        tabBarIcon: () => <PostButton />,
        tabBarLabel: () => null,
      }} />
      <Tabs.Screen name="notifications" options={{
        title: 'Notifikasi',
        tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profil',
        tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
      }} />
      <Tabs.Screen name="admin" options={{
        title: 'Admin',
        href: isAdmin ? undefined : null,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="shield-checkmark" size={size} color={color} />
        ),
      }} />
    </Tabs>
  );
}