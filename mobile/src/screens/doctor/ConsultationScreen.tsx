import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Appointment, ScannedReport, MedicineItem } from '../../types';
import { AppIcon } from '../../components/common/AppIcon';

interface ConsultationScreenProps {
  appointment?: Appointment | null;
  onBackToQueue: () => void;
}

export const ConsultationScreen: React.FC<ConsultationScreenProps> = ({
  appointment: propAppointment,
  onBackToQueue,
}) => {
  const { user } = useAuth();
  const { appointments, completeConsultation, callNextPatient } = useHospital();
  const { colors: tc, isDark } = useAppTheme();

  const currentApt =
    propAppointment ||
    appointments.find((a) => a.status === 'in_consultation') ||
    appointments[0];

  const [diagnosis, setDiagnosis] = useState(
    currentApt?.symptoms?.toLowerCase().includes('knee')
      ? 'Bilateral Knee Osteoarthritis Grade 2 - Mild joint space narrowing'
      : 'Bilateral Knee Osteoarthritis & Mild joint inflammation'
  );
  const [advice, setAdvice] = useState(
    'Quadriceps strengthening exercises, avoid deep squatting, hot fomentation twice daily, review USG in 4 weeks.'
  );
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { id: '1', name: 'Diacerein + Glucosamine', dosage: '50/750 mg', frequency: '0-0-1 (Night)', duration: '30 Days', instructions: 'After dinner' },
    { id: '2', name: 'Paracetamol', dosage: '650 mg', frequency: '1-0-1 (SOS)', duration: '5 Days', instructions: 'After food for knee pain' },
  ]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('1-0-1');
  const [inspectReport, setInspectReport] = useState<ScannedReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  if (!currentApt) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: tc.background }]}>
        <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No patient selected for consultation.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBackToQueue}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDirectCall = (phone: string, name: string) => {
    const cleanNumber = phone.replace(/[^\d+]/g, '');
    Alert.alert(`Call ${name}?`, `Dial ${phone} directly?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call Now',
        onPress: () => {
          Linking.openURL(`tel:${cleanNumber}`).catch(() => {
            showToast(`Calling ${name}...`);
          });
        },
      },
    ]);
  };

  const handleAddMedicine = () => {
    if (!newMedName.trim()) return;
    setMedicines([
      ...medicines,
      {
        id: `med_${Date.now()}`,
        name: newMedName.trim(),
        dosage: newMedDose.trim() || '500 mg',
        frequency: newMedFreq,
        duration: '15 Days',
        instructions: 'After meals',
      },
    ]);
    setNewMedName('');
    setNewMedDose('');
  };

  const handleRemoveMedicine = (id: string) => {
    setMedicines(medicines.filter((m) => m.id !== id));
  };

  const handleFinishAndCallNext = () => {
    completeConsultation(currentApt.id, {
      diagnosis,
      clinicalAdvice: advice,
      medicines,
      issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      doctorSignature: user?.name ? `${user.name}, MD (Radiology)` : 'Dr. Preetha Rajesh, MD (Radiology)',
    });

    callNextPatient(currentApt.doctorId);

    showToast(`Consultation completed for Token #${currentApt.tokenNumber}! Next patient called ✓`);
    if (Platform.OS === 'web') {
      // web handled by toast
    } else {
      Alert.alert(
        'Consultation Finished',
        `Prescription saved for ${currentApt.patientName} (Token #${currentApt.tokenNumber}). Next patient called.`
      );
    }

    onBackToQueue();
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Toast Banner */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <AppIcon name="checkmark" size={16} color="#FFFFFF" />
          <Text style={styles.toastText} numberOfLines={2}>
            {toastMessage}
          </Text>
        </View>
      )}

      {/* Top Header Row with Back Button & Direct Call */}
      <View style={[styles.topHeaderRow, { backgroundColor: tc.headerBackground, borderBottomColor: tc.cardBorder }]}>
        <TouchableOpacity
          style={[styles.backBtnPill, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}
          onPress={onBackToQueue}
          activeOpacity={0.7}
        >
          <AppIcon name="arrow-back" size={18} color={tc.text} />
          <Text style={[styles.backBtnText, { color: tc.text }]}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenterCol}>
          <Text style={[styles.headerPatientName, { color: tc.text }]} numberOfLines={1}>
            {currentApt.patientName}
          </Text>
          <Text style={[styles.headerMetaSub, { color: tc.textSecondary }]}>
            Token #{currentApt.tokenNumber} • {currentApt.patientAge}y • Room {currentApt.roomNumber}
          </Text>
        </View>

        {/* Direct Call Quick Action */}
        <TouchableOpacity
          style={styles.directCallHeaderBtn}
          onPress={() => handleDirectCall(currentApt.patientPhone, currentApt.patientName)}
          activeOpacity={0.7}
        >
          <AppIcon name="call" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Patient Demographics & Vitals */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.patientAvatarWrap}>
              <View style={styles.patientAvatarCircle}>
                <Text style={styles.patientAvatarText}>
                  {currentApt.patientName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.tokenTagBadge}>
                <Text style={styles.tokenTagBadgeText}>#{currentApt.tokenNumber}</Text>
              </View>
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: tc.text }]} numberOfLines={1}>
                {currentApt.patientName}
              </Text>
              <Text style={[styles.cardSub, { color: tc.textSecondary }]}>
                {currentApt.patientGender} • {currentApt.patientAge}y • Room {currentApt.roomNumber}
              </Text>
            </View>
            <View style={styles.consultingBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.consultingBadgeText}>IN ROOM</Text>
            </View>
          </View>

          {/* Chief Complaint Quote Box */}
          <View style={[styles.symptomsBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
            <Text style={styles.symptomsLabel}>CHIEF COMPLAINT</Text>
            <Text style={[styles.symptomsText, { color: tc.text }]}>
              "{currentApt.symptoms || 'Patient reports shortness of breath on exertion and occasional palpitations.'}"
            </Text>
          </View>

          {/* Vitals Grid */}
          <View style={styles.vitalsRow}>
            <View style={[styles.vitalTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
              <Text style={styles.vitalLabel}>BP</Text>
              <Text style={[styles.vitalValue, { color: tc.text }]}>138/88</Text>
              <Text style={styles.vitalUnit}>mmHg</Text>
            </View>
            <View style={[styles.vitalTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
              <Text style={styles.vitalLabel}>PULSE</Text>
              <Text style={[styles.vitalValue, { color: tc.text }]}>78</Text>
              <Text style={styles.vitalUnit}>bpm</Text>
            </View>
            <View style={[styles.vitalTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
              <Text style={styles.vitalLabel}>SPO2</Text>
              <Text style={[styles.vitalValue, { color: tc.text }]}>99%</Text>
              <Text style={styles.vitalUnit}>Normal</Text>
            </View>
            <View style={[styles.vitalTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
              <Text style={styles.vitalLabel}>TEMP</Text>
              <Text style={[styles.vitalValue, { color: tc.text }]}>98.4</Text>
              <Text style={styles.vitalUnit}>°F</Text>
            </View>
          </View>
        </View>

        {/* 2. Attached Scanned Diagnostic Reports (X-Rays & Blood Tests) */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={[styles.cardTitle, { color: tc.text }]}>Scanned Medical Reports</Text>
              <Text style={[styles.cardSub, { color: tc.textSecondary }]}>
                Attached X-Rays, Lab Reports & Pathology ({currentApt.scannedReports.length})
              </Text>
            </View>
            <View style={styles.reportsCountBadge}>
              <Text style={styles.reportsCountBadgeText}>{currentApt.scannedReports.length} Available</Text>
            </View>
          </View>

          {currentApt.scannedReports.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reportsGallery}>
              {currentApt.scannedReports.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  style={[styles.reportThumbCard, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}
                  onPress={() => setInspectReport(report)}
                  activeOpacity={0.8}
                >
                  <View style={styles.reportImageFrame}>
                    <Image source={{ uri: report.fileUri }} style={styles.reportThumbImage} resizeMode="cover" />
                    <View style={styles.reportTypeBadge}>
                      <Text style={styles.reportTypeBadgeText}>
                        {report.reportType === 'xray' ? '🩻 X-RAY' : '📄 LAB'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reportThumbInfo}>
                    <Text style={[styles.reportThumbTitle, { color: tc.text }]} numberOfLines={1}>
                      {report.title}
                    </Text>
                    <Text style={styles.reportThumbDate}>{report.scanDate}</Text>
                    <Text style={styles.tapToInspectText}>Tap to Inspect 🔍</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.noReportsBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC' }]}>
              <Text style={[styles.noReportsMsg, { color: tc.textSecondary }]}>
                No scans uploaded by receptionist yet for this consultation.
              </Text>
            </View>
          )}
        </View>

        {/* 3. Clinical Diagnosis & Prescription Pad */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: tc.text }]}>Digital Prescription Pad</Text>
          <Text style={[styles.cardSub, { color: tc.textSecondary, marginBottom: 12 }]}>
            Clinical diagnosis and prescribed medication schedule
          </Text>

          {/* Provisional Diagnosis Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PROVISIONAL DIAGNOSIS</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
              value={diagnosis}
              onChangeText={setDiagnosis}
              placeholder="e.g. Essential Hypertension & Dyslipidemia"
              placeholderTextColor={tc.textTertiary}
            />
          </View>

          {/* Prescribed Medications List */}
          <Text style={[styles.inputLabel, { marginTop: 14, marginBottom: 6 }]}>
            PRESCRIBED MEDICATIONS ({medicines.length})
          </Text>
          <View style={styles.medsList}>
            {medicines.map((med) => (
              <View
                key={med.id}
                style={[styles.medRow, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}
              >
                <View style={styles.medInfo}>
                  <Text style={[styles.medNameText, { color: tc.text }]}>
                    💊 {med.name} ({med.dosage})
                  </Text>
                  <Text style={[styles.medScheduleText, { color: tc.textSecondary }]}>
                    {med.frequency} • {med.duration} • {med.instructions}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveMedicine(med.id)}
                  style={styles.deleteMedBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <AppIcon name="close" size={14} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Quick Add Medicine Input */}
          <View style={[styles.addMedBox, { backgroundColor: isDark ? '#1C1C1E' : '#F1F5F9' }]}>
            <TextInput
              style={[styles.addMedInput, { flex: 2, backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', color: tc.text }]}
              placeholder="Medicine Name (e.g. Metoprolol)"
              placeholderTextColor={tc.textTertiary}
              value={newMedName}
              onChangeText={setNewMedName}
            />
            <TextInput
              style={[styles.addMedInput, { flex: 1, backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', color: tc.text }]}
              placeholder="Dose (50mg)"
              placeholderTextColor={tc.textTertiary}
              value={newMedDose}
              onChangeText={setNewMedDose}
            />
            <TouchableOpacity style={styles.addMedBtn} onPress={handleAddMedicine} activeOpacity={0.8}>
              <Text style={styles.addMedBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Clinical Advice */}
          <View style={[styles.inputGroup, { marginTop: 14 }]}>
            <Text style={styles.inputLabel}>LIFESTYLE & CLINICAL ADVICE</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
              value={advice}
              onChangeText={setAdvice}
              placeholder="Clinical recommendations, diet advice, follow up..."
              placeholderTextColor={tc.textTertiary}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* 4. Complete Consultation Primary Action */}
        <TouchableOpacity
          style={styles.finishConsultBtn}
          onPress={handleFinishAndCallNext}
          activeOpacity={0.85}
        >
          <AppIcon name="checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.finishConsultBtnText}>
            Save Rx, Complete Consultation & Call Next ➔
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Full-Screen Report Inspection Modal */}
      <Modal visible={!!inspectReport} transparent animationType="fade" onRequestClose={() => setInspectReport(null)}>
        <View style={styles.inspectOverlay}>
          <View style={[styles.inspectCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.inspectHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inspectTitle, { color: tc.text }]}>{inspectReport?.title}</Text>
                <Text style={[styles.inspectMeta, { color: tc.textSecondary }]}>
                  {inspectReport?.reportType.toUpperCase()} • Scanned on {inspectReport?.scanDate}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setInspectReport(null)} style={styles.inspectCloseBtn}>
                <AppIcon name="close" size={18} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inspectImageWrap}>
              {inspectReport && (
                <Image source={{ uri: inspectReport.fileUri }} style={styles.inspectFullImage} resizeMode="contain" />
              )}
            </View>

            {inspectReport?.notes && (
              <View style={[styles.inspectNotesBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC' }]}>
                <Text style={styles.inspectNotesLabel}>TECHNICIAN NOTES</Text>
                <Text style={[styles.inspectNotesText, { color: tc.text }]}>{inspectReport.notes}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastBanner: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerCenterCol: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerPatientName: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerMetaSub: {
    fontSize: 11,
    marginTop: 1,
  },
  directCallHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 120,
    gap: 12,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientAvatarWrap: {
    position: 'relative',
  },
  patientAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0F766E',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  tokenTagBadge: {
    position: 'absolute',
    bottom: -2,
    right: -3,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tokenTagBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  consultingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  consultingBadgeText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
  },
  symptomsBox: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  symptomsLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  symptomsText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  vitalTile: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  vitalLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  vitalValue: {
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 2,
  },
  vitalUnit: {
    fontSize: 9.5,
    color: '#94A3B8',
  },
  reportsCountBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reportsCountBadgeText: {
    color: '#0369A1',
    fontSize: 10.5,
    fontWeight: '700',
  },
  reportsGallery: {
    gap: 12,
    paddingVertical: 4,
  },
  reportThumbCard: {
    width: 140,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  reportImageFrame: {
    width: '100%',
    height: 95,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  reportThumbImage: {
    width: '100%',
    height: '100%',
  },
  reportTypeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reportTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  reportThumbInfo: {
    padding: 8,
  },
  reportThumbTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  reportThumbDate: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  tapToInspectText: {
    fontSize: 10,
    color: colors.whatsapp.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  noReportsBox: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  noReportsMsg: {
    fontSize: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 55,
    textAlignVertical: 'top',
  },
  medsList: {
    gap: 8,
    marginBottom: 10,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  medInfo: {
    flex: 1,
  },
  medNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  medScheduleText: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteMedBtn: {
    padding: 6,
  },
  addMedBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 6,
    gap: 6,
  },
  addMedInput: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
  },
  addMedBtn: {
    backgroundColor: colors.whatsapp.primary,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addMedBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  finishConsultBtn: {
    backgroundColor: colors.whatsapp.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 4,
  },
  finishConsultBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 15,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: colors.whatsapp.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  inspectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  inspectCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 16,
    maxHeight: '88%',
  },
  inspectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  inspectTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inspectMeta: {
    fontSize: 11.5,
    marginTop: 2,
  },
  inspectCloseBtn: {
    padding: 4,
  },
  inspectImageWrap: {
    width: '100%',
    height: 320,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    overflow: 'hidden',
  },
  inspectFullImage: {
    width: '100%',
    height: '100%',
  },
  inspectNotesBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
  },
  inspectNotesLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  inspectNotesText: {
    fontSize: 12,
  },
});
