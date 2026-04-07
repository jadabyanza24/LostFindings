import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useStore } from './store';

export function useVerification() {
  const user = useStore(s => s.user);

  const requireVerified = (onPass: () => void) => {
    console.log('user role:', user?.role);
  console.log('user is_verified:', user?.is_verified);
    if (!user) {
      Alert.alert('Login Dulu', 'Kamu harus login untuk melanjutkan.', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    // Admin bypass semua gate
    if (user.role === 'admin') {
      onPass();
      return;
    }

    if (!user.is_verified) {
      Alert.alert(
        'Verifikasi Diperlukan',
        'Kamu harus verifikasi sebagai mahasiswa sebelum bisa menggunakan fitur ini.',
        [
          { text: 'Nanti Saja', style: 'cancel' },
          { text: 'Verifikasi Sekarang', onPress: () => router.push('/profile/verify') },
        ]
      );
      return;
    }

    onPass();
  };

  return { requireVerified, isVerified: user?.is_verified || user?.role === 'admin' };
}