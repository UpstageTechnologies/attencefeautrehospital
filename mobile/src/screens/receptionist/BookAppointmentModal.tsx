import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { colors } from '../../theme/colors';
import { useHospital } from '../../context/HospitalContext';
import { PaymentMethod } from '../../types';

interface BookAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({ visible, onClose }) => {
  const { selectedHospital, bookAppointment } = useHospital();

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [department, setDepartment] = useState('Cardiology');
  const [doctorId, setDoctorId] = useState('usr_doc_jenkins');
  const [timeSlot, setTimeSlot] = useState('11:30 AM');
  const [symptoms, setSymptoms] = useState('');
  const [collectPaymentNow, setCollectPaymentNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const handleBooking = () => {
    if (!patientName.trim() || !patientPhone.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter patient name and phone number.');
      } else {
        Alert.alert('Required Fields', 'Please enter patient name and phone number.');
      }
      return;
    }

    const newApt = bookAppointment({
      hospitalId: selectedHospital.id,
      doctorId,
      patientName,
      patientPhone,
      patientAge: parseInt(patientAge, 10) || 30,
      patientGender,
      timeSlot,
      symptoms,
      isWalkIn: true,
      paidNow: collectPaymentNow,
      paymentMethod: collectPaymentNow ? paymentMethod : undefined,
    });

    const msg = `✅ Walk-In Appointment Booked!\nToken #${newApt.tokenNumber} assigned for ${newApt.patientName}.\nRoom: ${newApt.roomNumber} (${newApt.doctorName})`;
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Appointment Confirmed', msg);
    }

    // Reset and close
    setPatientName('');
    setPatientPhone('');
    setPatientAge('');
    setSymptoms('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Book Walk-In Patient</Text>
              <Text style={styles.modalSubtitle}>Immediate Token Assignment & Check-In</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Patient Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Patient Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. David Miller"
                value={patientName}
                onChangeText={setPatientName}
              />
            </View>

            {/* Phone & Age */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1.6 }]}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="+1 (555) 000-0000"
                  keyboardType="phone-pad"
                  value={patientPhone}
                  onChangeText={setPatientPhone}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="35"
                  keyboardType="numeric"
                  value={patientAge}
                  onChangeText={setPatientAge}
                />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, patientGender === g && styles.genderChipActive]}
                    onPress={() => setPatientGender(g)}
                  >
                    <Text style={[styles.genderChipText, patientGender === g && styles.genderChipTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Doctor & Room */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Assigned Doctor &amp; Room</Text>
              <View style={styles.doctorCard}>
                <Text style={styles.doctorCardName}>Dr. Preetha Rajesh, MD</Text>
                <Text style={styles.doctorCardSpec}>Radiology &amp; Imaging • Scan Room 1 • Fee: ₹800</Text>
                <Text style={styles.doctorCardTiming}>OPD Hours: 09:00 AM - 05:00 PM</Text>
              </View>
            </View>

            {/* Symptoms / Chief Complaint */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Symptoms / Reason for Visit</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="e.g. Knee pain, fever, swelling, digital X-Ray scan"
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Payment Collection Toggle */}
            <View style={styles.paymentSection}>
              <View style={styles.paymentHeaderRow}>
                <Text style={styles.label}>Collect Consultation Fee (₹800)</Text>
                <TouchableOpacity
                  style={[styles.toggleBtn, collectPaymentNow && styles.toggleBtnActive]}
                  onPress={() => setCollectPaymentNow(!collectPaymentNow)}
                >
                  <Text style={styles.toggleBtnText}>{collectPaymentNow ? 'YES (PAID)' : 'LATER'}</Text>
                </TouchableOpacity>
              </View>

              {collectPaymentNow && (
                <View style={styles.paymentMethodsRow}>
                  {(['cash', 'upi', 'card'] as PaymentMethod[]).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.methodChip, paymentMethod === m && styles.methodChipActive]}
                      onPress={() => setPaymentMethod(m)}
                    >
                      <Text style={[styles.methodChipText, paymentMethod === m && styles.methodChipTextActive]}>
                        {m === 'cash' ? '💵 Cash' : m === 'upi' ? '📱 UPI / QR' : '💳 Card'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleBooking}>
            <Text style={styles.submitBtnText}>Issue Token & Check-In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 10 },
      web: { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any,
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  formScroll: {
    maxHeight: 460,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  genderChipActive: {
    borderColor: colors.whatsapp.primary,
    backgroundColor: 'rgba(18, 140, 126, 0.1)',
  },
  genderChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  genderChipTextActive: {
    color: colors.whatsapp.primary,
    fontWeight: 'bold',
  },
  doctorCard: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  doctorCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#166534',
  },
  doctorCardSpec: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
  },
  doctorCardTiming: {
    fontSize: 11,
    color: '#65A30D',
    marginTop: 2,
  },
  paymentSection: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  toggleBtnActive: {
    backgroundColor: '#25D366',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#075E54',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  methodChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  methodChipActive: {
    borderColor: colors.whatsapp.primary,
    backgroundColor: 'rgba(18, 140, 126, 0.12)',
  },
  methodChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  methodChipTextActive: {
    color: colors.whatsapp.primary,
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: colors.whatsapp.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
