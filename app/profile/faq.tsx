import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const FAQS = [
  {
    q: 'Bagaimana cara melaporkan barang temuan?',
    a: 'Tap tombol + di bagian bawah layar, pilih "Barang Temuan", isi detail barang seperti nama, kategori, lokasi, dan foto, lalu tap "Kirim Laporan".'
  },
  {
    q: 'Bagaimana cara melaporkan barang hilang?',
    a: 'Sama seperti melaporkan temuan, tap tombol + lalu pilih "Barang Hilang". Isi detail selengkap mungkin agar lebih mudah ditemukan.'
  },
  {
    q: 'Bagaimana cara mengklaim barang?',
    a: 'Buka detail barang yang kamu yakini milikmu, lalu tap "Ajukan Klaim". Kamu akan langsung terhubung dengan penemu lewat chat untuk verifikasi.'
  },
  {
    q: 'Bagaimana cara menghubungi penemu/pemilik?',
    a: 'Di halaman detail barang, tap ikon chat di samping nama pelapor, atau tap tombol "Hubungi Pemilik". Chat akan terbuka otomatis.'
  },
  {
    q: 'Di mana saja area cakupan LostFindings?',
    a: 'LostFindings mencakup seluruh area kampus termasuk gedung kuliah, perpustakaan, kantin, parkiran, dan fasilitas kampus lainnya.'
  },
  {
    q: 'Kenapa saya tidak dapat notifikasi?',
    a: 'Pastikan notifikasi diaktifkan di halaman Profil > Notifikasi Push. Pastikan juga koneksi internet stabil.'
  },
  {
    q: 'Apa itu verifikasi mahasiswa?',
    a: 'Verifikasi mahasiswa membuktikan bahwa kamu adalah mahasiswa aktif kampus. Upload foto KTM di menu Profil > Verifikasi Mahasiswa.'
  },
  {
    q: 'Bagaimana cara menghapus laporan?',
    a: 'Buka detail laporan milikmu, scroll ke bawah dan tap tombol "Hapus". Laporan yang sudah diklaim tidak bisa dihapus.'
  },
];

export default function FAQScreen() {
  const { colors } = useTheme();
  const s = getStyles(colors);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Bantuan & FAQ</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.heroBox}>
          <Ionicons name="help-circle" size={48} color={colors.accent} style={{ marginBottom: 8 }} />
          <Text style={s.heroTitle}>Ada yang bisa kami bantu?</Text>
          <Text style={s.heroDesc}>Temukan jawaban atas pertanyaan yang sering ditanyakan</Text>
        </View>

        {FAQS.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={[s.faqItem, openIndex === i && s.faqItemOpen]}
            onPress={() => setOpenIndex(openIndex === i ? null : i)}
            activeOpacity={0.8}>
            <View style={s.faqHeader}>
              <Text style={s.faqQ}>{faq.q}</Text>
              <View style={[openIndex === i && { transform: [{ rotate: '180deg' }] }]}>
                <Ionicons name="chevron-down" size={16} color={colors.muted} />
              </View>
            </View>
            {openIndex === i && (
              <Text style={s.faqA}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={s.contactBox}>
          <Text style={s.contactTitle}>Masih butuh bantuan?</Text>
          <Text style={s.contactDesc}>Hubungi admin kampus di:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Ionicons name="mail" size={16} color={colors.accent} />
            <Text style={s.contactEmail}>support@lostfindings.id</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  scroll: { padding: 20, paddingBottom: 60 },
  heroBox: { alignItems: 'center', marginBottom: 24, padding: 20, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  heroTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 },
  heroDesc: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  faqItem: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, marginBottom: 8 },
  faqItemOpen: { borderColor: colors.accent },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
  faqA: { fontSize: 14, color: colors.muted, lineHeight: 22, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  contactBox: { marginTop: 16, padding: 20, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  contactTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  contactDesc: { fontSize: 13, color: colors.muted },
  contactEmail: { fontSize: 14, fontWeight: '600', color: colors.text },
});
