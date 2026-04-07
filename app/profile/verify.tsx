import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  Alert, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyScreen() {
  const user = useStore(s => s.user);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
  if (!image) return Alert.alert('Upload foto KTM dulu!');
  setLoading(true);
  try {
    const ext = image.split('.').pop()?.toLowerCase() ?? 'jpg';
    const fileName = `ktm-${user!.id}-${Date.now()}.${ext}`;
    const response = await fetch(image);
    const arrayBuffer = await response.arrayBuffer();

    const { data: uploadData } = await supabase.storage
      .from('item-images')
      .upload(fileName, arrayBuffer, {
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        upsert: true,
      });

    const { data: urlData } = supabase.storage
      .from('item-images')
      .getPublicUrl(fileName);

    // Simpan ke tabel verifications
    await supabase.from('verifications').insert({
      user_id: user!.id,
      ktm_url: urlData.publicUrl,
      status: 'pending',
    });

    // Notif ke user
    await supabase.from('notifications').insert({
      user_id: user!.id, type: 'system',
      title: 'Verifikasi Dikirim!',
      body: 'Foto KTM kamu sedang diverifikasi admin. Proses 1x24 jam.',
      read: false,
    });

    setSubmitted(true);
  } catch (e: any) {
    Alert.alert('Error', e.message);
  } finally { setLoading(false); }
};

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Verifikasi Mahasiswa</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.body}>
        {submitted ? (
          <View style={s.successBox}>
            <Ionicons name="checkmark-circle-outline" size={80} color={colors.green} style={{ marginBottom: 16 }} />
            <Text style={s.successTitle}>Verifikasi Dikirim!</Text>
            <Text style={s.successDesc}>
              Foto KTM kamu sedang diverifikasi admin.{'\n'}Proses maksimal 1x24 jam.
            </Text>
            <TouchableOpacity style={s.btn} onPress={() => router.back()}>
              <Text style={s.btnText}>Kembali ke Profil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Ionicons name="school-outline" size={60} color={colors.accent} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={s.desc}>
              Upload foto Kartu Tanda Mahasiswa (KTM) untuk memverifikasi akunmu sebagai mahasiswa kampus.
            </Text>

            <View style={s.labelRow}>
              <Ionicons name="image-outline" size={14} color={colors.muted} />
              <Text style={s.label}>FOTO KTM</Text>
            </View>
            <TouchableOpacity style={s.uploadBox} onPress={pickImage}>
              {image
                ? <Image source={{ uri: image }}
                    style={{ width: '100%', height: 200, borderRadius: 8 }}
                    resizeMode="cover" />
                : <>
                    <Ionicons name="camera-outline" size={40} color={colors.muted} style={{ marginBottom: 8 }} />
                    <Text style={{ color: colors.muted, fontSize: 14 }}>Tap untuk upload foto KTM</Text>
                  </>
              }
            </TouchableOpacity>

            <View style={s.tipsBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="information-circle-outline" size={16} color={colors.text} />
                <Text style={s.tipsTitle}>Tips foto yang baik:</Text>
              </View>
              <Text style={s.tipsItem}>• Foto jelas dan tidak blur</Text>
              <Text style={s.tipsItem}>• NIM dan nama terlihat jelas</Text>
              <Text style={s.tipsItem}>• Pencahayaan cukup</Text>
            </View>

            <TouchableOpacity
              style={[s.btn, (!image || loading) && { opacity: 0.6 }]}
              onPress={handleSubmit} disabled={!image || loading}>
              {loading
                ? <ActivityIndicator color="#000" />
                : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="paper-plane-outline" size={18} color="#000" />
                    <Text style={s.btnText}>Kirim untuk Verifikasi</Text>
                  </View>
              }
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { flex: 1, padding: 24 },
  desc: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: { fontFamily: 'Michroma', fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  uploadBox: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 12, padding: 32, alignItems: 'center', marginBottom: 20 },
  tipsBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 24 },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  tipsItem: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  btn: { padding: 16, backgroundColor: colors.accent, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 12 },
  successDesc: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});