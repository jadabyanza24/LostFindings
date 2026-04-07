import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

export default function AppointmentScreen() {
  const { chatId, itemName, otherName } = useLocalSearchParams<{
    chatId: string; itemName: string; otherName: string;
  }>();
  const user = useStore(s => s.user);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const label = i === 0 ? 'Hari ini' : i === 1 ? 'Besok' :
        d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      const value = d.toISOString().slice(0, 10);
      days.push({ label, value });
    }
    return days;
  };

  const handleSubmit = async () => {
    if (!date) return Alert.alert('Pilih tanggal dulu!');
    if (!time) return Alert.alert('Pilih waktu dulu!');
    if (!location.trim()) return Alert.alert('Isi lokasi dulu!');

    setLoading(true);
    try {
      const { data: appt, error } = await supabase.from('appointments').insert({
        chat_id: chatId,
        proposed_by: user!.id,
        date,
        time,
        location: location.trim(),
        status: 'pending',
      }).select().single();
      if (error) throw error;

      await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: user!.id,
        text: `JADWAL_JANJIAN:${appt.id}`,
      });

      Alert.alert('Jadwal Dikirim!', `Menunggu konfirmasi dari ${otherName}.`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  };

  const days = getNextDays();

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Jadwalkan Janjian</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.infoBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="pricetag-outline" size={16} color={colors.text} />
            <Text style={s.infoText}>{itemName}</Text>
          </View>
          <Text style={s.infoSub}>Janjian dengan {otherName}</Text>
        </View>

        <View style={s.labelRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.muted} />
          <Text style={s.label}>PILIH TANGGAL</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
          {days.map(d => (
            <TouchableOpacity key={d.value} onPress={() => setDate(d.value)}
              style={[s.dayBtn, date === d.value && s.dayBtnActive]}>
              <Text style={[s.dayText, date === d.value && { color: '#000' }]}>{d.label}</Text>
              <Text style={[s.dayDate, date === d.value && { color: '#000' }]}>
                {d.value.slice(5).replace('-', '/')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[s.labelRow, { marginTop: 20 }]}>
          <Ionicons name="time-outline" size={14} color={colors.muted} />
          <Text style={s.label}>PILIH WAKTU</Text>
        </View>
        <View style={s.timeGrid}>
          {TIME_SLOTS.map(t => (
            <TouchableOpacity key={t} onPress={() => setTime(t)}
              style={[s.timeBtn, time === t && s.timeBtnActive]}>
              <Text style={[s.timeText, time === t && { color: '#000', fontWeight: '700' }]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.labelRow, { marginTop: 20 }]}>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={s.label}>LOKASI JANJIAN</Text>
        </View>
        <TextInput
          style={s.input}
          placeholder="contoh: Lobby, Kantin, LKC..."
          placeholderTextColor={colors.muted}
          value={location}
          onChangeText={setLocation}
        />

        {date && time && (location && location !== 'Lainnya...' || customLocation) && (
          <View style={s.previewBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="list" size={14} color={colors.accent} />
              <Text style={s.previewTitle}>Ringkasan Janjian</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Ionicons name="calendar" size={14} color={colors.text} />
              <Text style={s.previewItem}>{date.split('-').reverse().join('/')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Ionicons name="time" size={14} color={colors.text} />
              <Text style={s.previewItem}>{time} WIB</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Ionicons name="location" size={14} color={colors.text} />
              <Text style={s.previewItem}>{location === 'Lainnya...' ? customLocation : location}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[s.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit} disabled={loading}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {!loading && <Ionicons name="paper-plane" size={18} color="#000" />}
            <Text style={s.submitText}>{loading ? 'Mengirim...' : 'Kirim Jadwal'}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  scroll: { padding: 20, paddingBottom: 60 },
  infoBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 24, alignItems: 'center' },
  infoText: { fontSize: 15, fontWeight: '700', color: colors.text },
  infoSub: { fontSize: 13, color: colors.muted, marginTop: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  dayBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', minWidth: 80 },
  dayBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayText: { fontSize: 12, fontWeight: '600', color: colors.text },
  dayDate: { fontSize: 11, color: colors.muted, marginTop: 2 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  timeBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  timeText: { fontSize: 13, color: colors.text },
  locGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  locBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  locBtnActive: { borderColor: colors.accent, backgroundColor: 'rgba(240,165,0,0.1)' },
  locText: { fontSize: 12, color: colors.muted },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 13, color: colors.text, fontSize: 14, marginBottom: 16 },
  previewBox: { backgroundColor: 'rgba(240,165,0,0.08)', borderWidth: 1, borderColor: colors.accent, borderRadius: 12, padding: 16, marginTop: 16, marginBottom: 8 },
  previewTitle: { fontSize: 13, fontWeight: '700', color: colors.accent },
  previewItem: { fontSize: 14, color: colors.text, fontWeight: '500' },
  submitBtn: { marginTop: 20, padding: 16, backgroundColor: colors.accent, borderRadius: 16, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '800', color: '#000' },
});