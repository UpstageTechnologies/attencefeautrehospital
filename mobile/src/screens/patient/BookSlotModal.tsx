import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { colors } from '../../theme/colors';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { Hospital, UserProfile } from '../../types';
import { dataStore } from '../../services/dataStore';
import { AppIcon } from '../../components/common/AppIcon';

interface BookSlotModalProps {
  visible: boolean;
  hospital: Hospital;
  initialDoctorId?: string;
  initialDate?: string;
  initialSlot?: string;
  onClose: () => void;
  onBookingSuccess: () => void;
}

export const BookSlotModal: React.FC<BookSlotModalProps> = ({
  visible,
  hospital,
  initialDoctorId,
  initialDate,
  initialSlot,
  onClose,
  onBookingSuccess,
}) => {
  const { bookAppointment, getDoctorAvailability, availabilityVersion } = useHospital();
  const doctors = dataStore.getDoctors(hospital.id);

  const { user, isDemo } = useAuth();
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || doctors[0]?.id || 'usr_doc_jenkins');
  const [selectedSlot, setSelectedSlot] = useState<string>(initialSlot || '11:45 AM');
  const [patientName, setPatientName] = useState(user?.name || (isDemo ? 'Gowri T' : ''));
  const [patientPhone, setPatientPhone] = useState(user?.phone || (isDemo ? '+91 98421 77650' : ''));
  const [symptoms, setSymptoms] = useState('');

  // Synchronize state when initial props change or modal opens
  useEffect(() => {
    if (visible) {
      if (initialDate) setSelectedDate(initialDate);
      if (initialDoctorId) setSelectedDoctorId(initialDoctorId);
      if (initialSlot) setSelectedSlot(initialSlot);
      if (user?.name) setPatientName(user.name);
      if (user?.phone) setPatientPhone(user.phone);
    }
  }, [visible, initialDate, initialDoctorId, initialSlot, user]);

  // 7-day strip for appointment date selection
  const upcomingDays = useMemo(() => {
    const list: Array<{ date: string; dayName: string; dayNum: number; monthName: string; isToday: boolean }> = [];
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      list.push({
        date: dateStr,
        dayName: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString(undefined, { month: 'short' }),
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  // Dynamic Date-wise Doctor Availability
  const doctorAvailability = useMemo(() => {
    return getDoctorAvailability(selectedDoctorId, selectedDate);
  }, [selectedDoctorId, selectedDate, availabilityVersion, getDoctorAvailability]);

  // Sync selected slot with available slots
  useEffect(() => {
    if (doctorAvailability.isAvailable && doctorAvailability.slots.length > 0) {
      if (!doctorAvailability.slots.includes(selectedSlot)) {
        setSelectedSlot(doctorAvailability.slots[0]);
      }
    }
  }, [doctorAvailability, selectedSlot]);

  const handleConfirm = () => {
    if (!patientName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter patient name');
      } else {
        Alert.alert('Required Field', 'Please enter your name.');
      }
      return;
    }

    if (!doctorAvailability.isAvailable) {
      const unavailMsg = `${selectedDoctor.name} is not available on ${selectedDate} (${doctorAvailability.note || 'On leave'}). Please select another date or doctor.`;
      if (Platform.OS === 'web') {
        window.alert(unavailMsg);
      } else {
        Alert.alert('Doctor Unavailable', unavailMsg);
      }
      return;
    }

    const newApt = bookAppointment({
      hospitalId: hospital.id,
      doctorId: selectedDoctorId,
      patientName,
      patientPhone,
      patientAge: 34,
      patientGender: 'Male',
      appointmentDate: selectedDate,
      timeSlot: selectedSlot,
      symptoms: symptoms || 'Routine consultation',
      isWalkIn: false,
      paidNow: false,
    });

    const msg = `🎉 Appointment Confirmed!\nYour Token Number is #${newApt.tokenNumber}.\nDoctor: ${selectedDoctor?.name} (${selectedDoctor?.doctorProfile?.roomNumber})\nScheduled: ${selectedDate} at ${selectedSlot}.`;
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Booking Confirmed', msg);
    }

    onBookingSuccess();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Book Doctor Appointment</Text>
              <Text style={styles.modalSub}>{hospital.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* 1. Select Date */}
            <Text style={styles.sectionLabel}>1. Select Appointment Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateSelectorStrip}>
              {upcomingDays.map((item) => {
                const isSelected = selectedDate === item.date;
                const checkAvail = getDoctorAvailability(selectedDoctorId, item.date);

                return (
                  <TouchableOpacity
                    key={item.date}
                    style={[
                      styles.datePill,
                      isSelected && styles.datePillActive,
                    ]}
                    onPress={() => setSelectedDate(item.date)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.datePillDay, isSelected && styles.datePillDayActive]}>
                      {item.dayName}
                    </Text>
                    <Text style={[styles.datePillNum, isSelected && styles.datePillNumActive]}>
                      {item.dayNum}
                    </Text>
                    <Text style={[styles.datePillMonth, isSelected && styles.datePillMonthActive]}>
                      {item.monthName}
                    </Text>
                    {/* Tiny Availability Indicator */}
                    <View
                      style={[
                        styles.availPillDot,
                        { backgroundColor: checkAvail.isAvailable ? '#10B981' : '#EF4444' },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 2. Select Doctor */}
            <Text style={styles.sectionLabel}>2. Select Specialist</Text>
            <View style={styles.doctorsList}>
              {doctors.map((doc) => {
                const isSelected = selectedDoctorId === doc.id;
                const docAvailForDate = getDoctorAvailability(doc.id, selectedDate);

                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.docOption, isSelected && styles.docOptionActive]}
                    onPress={() => setSelectedDoctorId(doc.id)}
                  >
                    <View style={styles.docAvatarCircle}>
                      <Text style={styles.docEmoji}>🩺</Text>
                    </View>
                    <View style={styles.docTextCol}>
                      <View style={styles.docNameStatusRow}>
                        <Text style={[styles.docName, isSelected && styles.docNameActive]}>{doc.name}</Text>
                        <View
                          style={[
                            styles.docAvailMiniBadge,
                            { backgroundColor: docAvailForDate.isAvailable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.docAvailMiniText,
                              { color: docAvailForDate.isAvailable ? '#059669' : '#DC2626' },
                            ]}
                          >
                            {docAvailForDate.isAvailable ? 'Available' : 'Unavailable'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.docSpec}>
                        {doc.doctorProfile?.specialty} • {doc.doctorProfile?.roomNumber}
                      </Text>
                    </View>
                    <Text style={styles.docFee}>₹{doc.doctorProfile?.consultationFee}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Availability Banner & Slots */}
            <Text style={styles.sectionLabel}>3. Available Slots on {selectedDate}</Text>
            {doctorAvailability.isAvailable ? (
              <>
                <View style={styles.availNoticeBanner}>
                  <AppIcon name="checkmark-circle" size={15} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.availNoticeTitle}>
                      {selectedDoctor?.name} is Available
                    </Text>
                    <Text style={styles.availNoticeSub}>
                      Timing: {doctorAvailability.timingStart} - {doctorAvailability.timingEnd}
                      {doctorAvailability.note ? ` • ${doctorAvailability.note}` : ''}
                    </Text>
                  </View>
                </View>

                {doctorAvailability.slots.length > 0 ? (
                  <View style={styles.slotsGrid}>
                    {doctorAvailability.slots.map((s) => {
                      const isSelected = selectedSlot === s;
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[styles.slotChip, isSelected && styles.slotChipActive]}
                          onPress={() => setSelectedSlot(s)}
                        >
                          <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>{s}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.unavailCard}>
                    <Text style={styles.unavailCardTitle}>No Available Slots</Text>
                    <Text style={styles.unavailCardText}>
                      All consultation slots are full or not scheduled for this date.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.unavailCard}>
                <View style={styles.unavailHeaderRow}>
                  <AppIcon name="alert-circle" size={18} color="#DC2626" />
                  <Text style={styles.unavailCardTitle}>
                    {selectedDoctor?.name} is Unavailable on {selectedDate}
                  </Text>
                </View>
                <Text style={styles.unavailReasonText}>
                  Reason: "{doctorAvailability.note || 'Doctor is on leave or off-duty'}"
                </Text>
                <Text style={styles.unavailCardText}>
                  Please choose another date from the calendar above or select an alternate doctor for your consultation.
                </Text>
              </View>
            )}

            {/* Patient Name & Symptoms */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Patient Name</Text>
              <TextInput
                style={styles.textInput}
                value={patientName}
                onChangeText={setPatientName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason for Visit / Symptoms</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="e.g. Mild chest tightness, routine health check"
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                numberOfLines={2}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              !doctorAvailability.isAvailable && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!doctorAvailability.isAvailable}
          >
            <Text style={styles.confirmBtnText}>
              {doctorAvailability.isAvailable
                ? `Confirm Booking for ${selectedDate}`
                : 'Doctor Unavailable on Selected Date'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  formScroll: {
    maxHeight: 440,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 6,
  },
  doctorsList: {
    gap: 8,
    marginBottom: 12,
  },
  docOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  docOptionActive: {
    borderColor: colors.whatsapp.primary,
    backgroundColor: 'rgba(18, 140, 126, 0.08)',
  },
  docAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  docEmoji: {
    fontSize: 18,
  },
  docTextCol: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  docNameActive: {
    color: colors.whatsapp.primary,
  },
  docSpec: {
    fontSize: 11,
    color: '#64748B',
  },
  docFee: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#075E54',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  slotChipActive: {
    backgroundColor: colors.whatsapp.primary,
    borderColor: colors.whatsapp.primary,
  },
  slotText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  slotTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  textArea: {
    height: 50,
    textAlignVertical: 'top',
  },
  confirmBtn: {
    backgroundColor: colors.whatsapp.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Date Selector Styles
  dateSelectorStrip: {
    gap: 8,
    paddingBottom: 10,
  },
  datePill: {
    width: 64,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  datePillActive: {
    borderColor: colors.whatsapp.primary,
    backgroundColor: 'rgba(18, 140, 126, 0.08)',
  },
  datePillDay: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  datePillDayActive: {
    color: colors.whatsapp.primary,
  },
  datePillNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  datePillNumActive: {
    color: colors.whatsapp.primary,
  },
  datePillMonth: {
    fontSize: 10,
    color: '#94A3B8',
  },
  datePillMonthActive: {
    color: colors.whatsapp.primary,
  },
  availPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  docNameStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  docAvailMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  docAvailMiniText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  availNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 10,
  },
  availNoticeTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#15803D',
  },
  availNoticeSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
  },
  unavailCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
    gap: 4,
  },
  unavailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unavailCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
  unavailReasonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#991B1B',
    fontStyle: 'italic',
  },
  unavailCardText: {
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 15,
  },
});
