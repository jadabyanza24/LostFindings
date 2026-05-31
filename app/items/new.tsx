import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useVerification } from '../../lib/useVerification';

const CATEGORIES = ['Elektronik', 'Dompet', 'Kunci', 'Kartu', 'Tas', 'Lainnya'];

export default function NewItemScreen() {
  const user = useStore(s => s.user);
  const { requireVerified } = useVerification();

  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [desc, setDesc] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    Alert.alert(
      'Pilih Foto',
      'Ambil foto dari mana?',
      [
        {
          text: 'Kamera',
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) return Alert.alert('Permission diperlukan', 'Izinkan akses kamera.');

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.7,
              aspect: [4, 3],
            });
            if (!result.canceled) setImages(prev => [...prev, result.assets[0].uri]);
          },
        },
        {
          text: 'Galeri',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.7,
              allowsMultipleSelection: true,
              selectionLimit: 3,
            });
            if (!result.canceled) {
              const newUris = result.assets.map(asset => asset.uri);
              setImages(prev => [...prev, ...newUris]);
            }
          },
        },
        { text: 'Batal', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!name || !location || !category) return Alert.alert('Lengkapi nama, kategori, dan lokasi!');
    if (!user) return Alert.alert('Login dulu ya!');
    setLoading(true);

    try {
      let uploadedUrls: string[] = [];

      if (images.length > 0) {
        const uploadPromises = images.map(async (imgUri, index) => {
          const ext = imgUri.split('.').pop()?.toLowerCase() ?? 'jpg';
          const fileName = `${user.id}-${Date.now()}-${index}.${ext}`;
          const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

          const response = await fetch(imgUri);
          const arrayBuffer = await response.arrayBuffer();

          const { error: uploadError } = await supabase.storage
            .from('item-images')
            .upload(fileName, arrayBuffer, { contentType, upsert: true });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('item-images')
            .getPublicUrl(fileName);

          return urlData.publicUrl;
        });

        uploadedUrls = await Promise.all(uploadPromises);
      }

      const finalImageUrl = uploadedUrls.length > 0 ? uploadedUrls.join(',') : null;

      // Membuat string waktu otomatis (Jam:Menit)
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const { error } = await supabase.from('items').insert({
        user_id: user.id, 
        type, 
        name, 
        category: category.toLowerCase(),
        location, 
        description: desc, 
        incident_time: timeString, // Waktu dimasukkan otomatis ke sini
        image_url: finalImageUrl, 
        status: 'active'
      });

      if (error) throw error;

      Alert.alert('Berhasil!', 'Laporan kamu sudah dikirim!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Buat Laporan</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.typeSelector}>
          <TouchableOpacity
            style={[s.typeBtn, type === 'lost' && s.typeBtnActiveLost]}
            onPress={() => setType('lost')}>
            <Text style={[s.typeText, type === 'lost' && { color: '#fff' }]}>Barang Hilang</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.typeBtn, type === 'found' && s.typeBtnActiveFound]}
            onPress={() => setType('found')}>
            <Text style={[s.typeText, type === 'found' && { color: '#fff' }]}>Barang Temuan</Text>
          </TouchableOpacity>
        </View>

        <View style={s.labelRow}>
          <Ionicons name="pricetag-outline" size={14} color={colors.muted} />
          <Text style={s.label}>NAMA BARANG</Text>
        </View>
        <TextInput style={s.input} placeholder="Misal: Dompet Hitam, Kunci Motor"
          placeholderTextColor={colors.muted} value={name} onChangeText={setName} />

        <View style={s.labelRow}>
          <Ionicons name="grid-outline" size={14} color={colors.muted} />
          <Text style={s.label}>KATEGORI</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c}
              style={[s.catBadge, category === c && { backgroundColor: colors.accent, borderColor: colors.accent }]}
              onPress={() => setCategory(c)}>
              <Text style={[s.catText, category === c && { color: '#000', fontWeight: '800' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.labelRow}>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={s.label}>LOKASI</Text>
        </View>
        <TextInput style={s.input} placeholder="Misal: Kantin, Gedung A Lantai 2"
          placeholderTextColor={colors.muted} value={location} onChangeText={setLocation} />

        <View style={s.labelRow}>
          <Ionicons name="document-text-outline" size={14} color={colors.muted} />
          <Text style={s.label}>DESKRIPSI (Opsional)</Text>
        </View>
        <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Ciri-ciri khusus, isi dompet, dll."
          placeholderTextColor={colors.muted} multiline value={desc} onChangeText={setDesc} />

        <View style={s.labelRow}>
          <Ionicons name="camera-outline" size={14} color={colors.muted} />
          <Text style={s.label}>FOTO BARANG (Maks 3)</Text>
        </View>
        {images.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {images.map((uri, index) => (
              <View key={index} style={{ marginRight: 12, position: 'relative' }}>
                <Image source={{ uri }} style={{ width: 120, height: 120, borderRadius: 10 }} />
                <TouchableOpacity
                  style={s.removePhotoBtn}
                  onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
                >
                  <Ionicons name="close-circle" size={26} color={colors.red} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 3 && (
              <TouchableOpacity style={s.addMorePhotoBtn} onPress={pickImage}>
                <Ionicons name="add" size={32} color={colors.muted} />
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <TouchableOpacity style={s.uploadBox} onPress={pickImage}>
            <Ionicons name="camera-outline" size={40} color={colors.muted} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 13, color: colors.muted }}>Tap untuk upload foto</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={() => requireVerified(handleSubmit)}
          disabled={loading}>
          {loading ? <Text style={s.btnText}>Mengirim...</Text> : <Text style={s.btnText}>Kirim Laporan</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  content: { padding: 20, paddingBottom: 100 },
  typeSelector: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  typeBtnActiveLost: { backgroundColor: colors.red },
  typeBtnActiveFound: { backgroundColor: colors.green },
  typeText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: { fontFamily: 'Michroma', fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14, marginBottom: 16 },
  catBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: colors.surface },
  catText: { fontSize: 13, fontWeight: '600', color: colors.text },
  uploadBox: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 12, padding: 32, alignItems: 'center', marginBottom: 20 },
  removePhotoBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: '#fff', borderRadius: 12 },
  addMorePhotoBtn: { width: 120, height: 120, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btn: { padding: 16, backgroundColor: colors.accent, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  btnText: { fontSize: 16, fontWeight: '800', color: '#000' },
});



