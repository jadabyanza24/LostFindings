import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';


export default function AppointmentScreen() {
  const { colors } = useTheme();
  const s = getStyles(colors);
  const { chatId, itemName, otherName } = useLocalSearchParams<{
    chatId: string; itemName: string; otherName: string;
  }>();
  const user = useStore(s => s.user);
  const [selectedDateTime, setSelectedDateTime] = useState(() => {
    const next = new Date();
    next.setMinutes(next.getMinutes() + 30);
    return next;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async () => {
    const date = selectedDateTime.toISOString().slice(0, 10);
    const time = selectedDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
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

  const date = selectedDateTime.toISOString().slice(0, 10);
  const time = selectedDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

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
        <TouchableOpacity style={s.pickerBtn} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar" size={16} color={colors.accent} />
          <Text style={s.pickerText}>{date.split('-').reverse().join('/')}</Text>
        </TouchableOpacity>

        <View style={[s.labelRow, { marginTop: 20 }]}>
          <Ionicons name="time-outline" size={14} color={colors.muted} />
          <Text style={s.label}>PILIH WAKTU</Text>
        </View>
        <TouchableOpacity style={s.pickerBtn} onPress={() => setShowTimePicker(true)}>
          <Ionicons name="time" size={16} color={colors.accent} />
          <Text style={s.pickerText}>{time} WIB</Text>
        </TouchableOpacity>

        {/* iOS Date Picker Modal */}
        {Platform.OS === 'ios' ? (
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity 
              style={s.modalBackdrop} 
              activeOpacity={1} 
              onPress={() => setShowDatePicker(false)}
            >
              <View style={s.modalContainer}>
                <View style={s.modalHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={s.modalCancelText}>Batal</Text>
                  </TouchableOpacity>
                  <Text style={s.modalTitle}>Pilih Tanggal</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={s.modalDoneText}>Selesai</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDateTime}
                  mode="date"
                  display="spinner"
                  textColor={colors.text}
                  minimumDate={new Date()}
                  onChange={(_, nextDate) => {
                    if (nextDate) setSelectedDateTime(prev => new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate(), prev.getHours(), prev.getMinutes()));
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          showDatePicker && (
            <DateTimePicker
              value={selectedDateTime}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(_, nextDate) => {
                setShowDatePicker(false);
                if (nextDate) setSelectedDateTime(prev => new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate(), prev.getHours(), prev.getMinutes()));
              }}
            />
          )
        )}

        {/* iOS Time Picker Modal */}
        {Platform.OS === 'ios' ? (
          <Modal
            visible={showTimePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <TouchableOpacity 
              style={s.modalBackdrop} 
              activeOpacity={1} 
              onPress={() => setShowTimePicker(false)}
            >
              <View style={s.modalContainer}>
                <View style={s.modalHeader}>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={s.modalCancelText}>Batal</Text>
                  </TouchableOpacity>
                  <Text style={s.modalTitle}>Pilih Waktu</Text>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={s.modalDoneText}>Selesai</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDateTime}
                  mode="time"
                  display="spinner"
                  textColor={colors.text}
                  minuteInterval={1}
                  onChange={(_, nextTime) => {
                    if (nextTime) setSelectedDateTime(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), nextTime.getHours(), nextTime.getMinutes()));
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          showTimePicker && (
            <DateTimePicker
              value={selectedDateTime}
              mode="time"
              display="default"
              minuteInterval={1}
              onChange={(_, nextTime) => {
                setShowTimePicker(false);
                if (nextTime) setSelectedDateTime(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), nextTime.getHours(), nextTime.getMinutes()));
              }}
            />
          )
        )}

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

        {location.trim() && (
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

const getStyles = (colors: any) => StyleSheet.create({
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
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 },
  pickerText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  previewBox: { backgroundColor: 'rgba(240,165,0,0.08)', borderWidth: 1, borderColor: colors.accent, borderRadius: 12, padding: 16, marginTop: 16, marginBottom: 8 },
  previewTitle: { fontSize: 13, fontWeight: '700', color: colors.accent },
  previewItem: { fontSize: 14, color: colors.text, fontWeight: '500' },
  submitBtn: { marginTop: 20, padding: 16, backgroundColor: colors.accent, borderRadius: 16, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '800', color: '#000' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  modalCancelText: { fontSize: 15, color: colors.muted },
  modalDoneText: { fontSize: 15, fontWeight: '700', color: colors.accent },
});

