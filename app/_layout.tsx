import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';
import AdminFab from '../components/AdminFab';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}

function RootLayoutInner() {
  const setUser = useStore(s => s.setUser);
  const user = useStore(s => s.user);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('users').select('*')
          .eq('id', session.user.id).single()
          .then(({ data }) => {
            if (data) {
              setUser(data);
            } else {
              router.replace('/auth/complete-profile');
            }
          });
      }
      SplashScreen.hideAsync();
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null);
    });
  }, []);

  // Realtime listener — auto update store saat data user berubah di DB
  useEffect(() => {
    if (!user) return;

    const sub = supabase.channel(`user-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'users', filter: `id=eq.${user.id}`
      }, payload => {
        setUser({ ...user, ...payload.new });
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [user?.id]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
          animationDuration: 220
        }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="auth/complete-profile" />
          <Stack.Screen name="items/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="items/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="chat/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="profile/edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="profile/password" options={{ presentation: 'modal' }} />
          <Stack.Screen name="profile/verify" options={{ presentation: 'modal' }} />
          <Stack.Screen name="profile/faq" options={{ presentation: 'modal' }} />
          <Stack.Screen name="chat/appointment" options={{ presentation: 'modal' }} />
          <Stack.Screen name="admin/users" options={{ presentation: 'card' }} />
          <Stack.Screen name="admin/verifications" options={{ presentation: 'card' }} />
          <Stack.Screen name="admin/reports" options={{ presentation: 'card' }} />
          <Stack.Screen name="admin/items" options={{ presentation: 'card' }} />
        </Stack>
        <AdminFab />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


