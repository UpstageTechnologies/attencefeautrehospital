import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert
} from 'react-native';
import { colors } from '../../theme/colors';
import { GlassView } from '../../components/common/GlassView';
import { useHospital } from '../../context/HospitalContext';
import { dataStore } from '../../services/dataStore';
import { attendanceService } from '../../services/attendanceService';
import { payrollService } from '../../services/payrollService';
import { deliveryService } from '../../services/deliveryService';

export const OwnerDashboardScreen: React.FC = () => {
  const { selectedHospital, appointments } = useHospital();
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpec, setNewDocSpec] = useState('Cardiology');
  const [newDocRoom, setNewDocRoom] = useState('Room 301');
  const [newDocFee, setNewDocFee] = useState('80');

  const floorStats = attendanceService.getFloorStats();
  const staffOnBreak = attendanceService.getStaffOnLunchBreak();
  const payrollSum = payrollService.getPayrollSummary();
  const deliveries = deliveryService.getOrders();
  const activeDeliveries = deliveries.filter((d) => d.status === 'in_transit');

  const totalRevenue = appointments
    .filter(a => a.paymentStatus === 'paid')
    .reduce((sum, a) => sum + a.paymentAmount, 0);

  const totalPatientsToday = appointments.length;
  const inConsultationCount = appointments.filter(a => a.status === 'in_consultation').length;
  const waitingCount = appointments.filter(a => a.status === 'checked_in' || a.status === 'waiting').length;

  const doctors = dataStore.getDoctors(selectedHospital.id);

  const handleAddDoctor = () => {
    if (!newDocName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter doctor name.');
      } else {
        Alert.alert('Doctor Name Required', 'Please enter doctor full name.');
      }
      return;
    }

    if (Platform.OS === 'web') {
      window.alert(`✅ Doctor ${newDocName} added to ${selectedHospital.name}!\nAssigned to ${newDocRoom} with consultation fee ₹${newDocFee}.`);
    } else {
      Alert.alert('Doctor Added', `Dr. ${newDocName} added and assigned to ${newDocRoom}.`);
    }

    setNewDocName('');
    setShowAddDoctorModal(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Hospital Identity Header */}
      <View style={styles.hospitalHero}>
        <Text style={styles.hospitalHeroTitle}>{selectedHospital.name}</Text>
        <Text style={styles.hospitalHeroSub}>
          Hospital Management & Executive Overview • Tirunelveli, Tamil Nadu
        </Text>
      </View>

      {/* Analytics KPI Tiles */}
      <View style={styles.kpiGrid}>
        <GlassView style={styles.kpiTile}>
          <Text style={styles.kpiLabel}>TODAY'S REVENUE</Text>
          <Text style={[styles.kpiValue, { color: '#059669' }]}>₹{totalRevenue}</Text>
          <Text style={styles.kpiSub}>From {appointments.filter(a => a.paymentStatus === 'paid').length} collected fees</Text>
        </GlassView>

        <GlassView style={styles.kpiTile}>
          <Text style={styles.kpiLabel}>TOTAL FOOTFALL</Text>
          <Text style={[styles.kpiValue, { color: '#2563EB' }]}>{totalPatientsToday}</Text>
          <Text style={styles.kpiSub}>Walk-ins + App Bookings</Text>
        </GlassView>

        <GlassView style={styles.kpiTile}>
          <Text style={styles.kpiLabel}>CURRENTLY SERVING</Text>
          <Text style={[styles.kpiValue, { color: '#075E54' }]}>{inConsultationCount} Active</Text>
          <Text style={styles.kpiSub}>In Doctor Rooms</Text>
        </GlassView>

        <GlassView style={styles.kpiTile}>
          <Text style={styles.kpiLabel}>WAITING ROOM</Text>
          <Text style={[styles.kpiValue, { color: '#D97706' }]}>{waitingCount} Patients</Text>
          <Text style={styles.kpiSub}>Avg Wait: ~14 mins</Text>
        </GlassView>
      </View>

      {/* RIO Scans 3-Floor Operational Command & Staff Monitor */}
      <GlassView style={styles.rioCommandCard}>
        <View style={styles.rioCommandHeader}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveCommandText}>RIO SCANS 80-STAFF CONTROL</Text>
            </View>
            <Text style={styles.rioCommandTitle}>3-Floor Attendance, Lifts & Payroll</Text>
          </View>
          <View style={styles.staffCountBadge}>
            <Text style={styles.staffCountText}>80 Staff Enrolled</Text>
          </View>
        </View>

        {/* 3 Floors Occupancy Strip */}
        <View style={styles.occupancyStrip}>
          <View style={styles.occItem}>
            <Text style={styles.occLabel}>FLOOR 1 (OPD)</Text>
            <Text style={styles.occVal}>{floorStats.floor1.present}/{floorStats.floor1.total}</Text>
          </View>
          <View style={styles.occDivider} />
          <View style={styles.occItem}>
            <Text style={styles.occLabel}>FLOOR 2 (MRI/CT)</Text>
            <Text style={styles.occVal}>{floorStats.floor2.present}/{floorStats.floor2.total}</Text>
          </View>
          <View style={styles.occDivider} />
          <View style={styles.occItem}>
            <Text style={styles.occLabel}>FLOOR 3 (LABS)</Text>
            <Text style={styles.occVal}>{floorStats.floor3.present}/{floorStats.floor3.total}</Text>
          </View>
        </View>

        {/* Live Break Overstay & Unannounced Absence Alert */}
        {(floorStats.unannouncedAbsentees > 0 || floorStats.breakViolations > 0) && (
          <View style={styles.kioskWarningBanner}>
            <Text style={styles.warningTitle}>
              ⚠️ ATTENDANCE REGULATION ALERT (LUNCH BREAKS & LEAVES)
            </Text>
            <Text style={styles.warningSub}>
              {floorStats.unannouncedAbsentees > 0 && `• ${floorStats.unannouncedAbsentees} staff on UNANNOUNCED LEAVE (1.5x daily pay penalty applied)\n`}
              {floorStats.breakViolations > 0 && `• ${floorStats.breakViolations} staff EXCEEDED 45m lunch break limit (lift exit logged & deductions computed)`}
            </Text>
          </View>
        )}

        {/* Active Scan Film Deliveries in Tirunelveli */}
        <View style={styles.deliveryStatusRow}>
          <Text style={styles.deliveryRowTitle}>
            🛵 Scan Film Deliveries: <Text style={{ color: '#00FFCC', fontWeight: 'bold' }}>{activeDeliveries.length} In-Transit</Text> (Live GPS Active)
          </Text>
        </View>
      </GlassView>

      {/* Manage Doctors Section */}
      <GlassView style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Hospital Doctors & Room Roster</Text>
            <Text style={styles.sectionSub}>Active consultation rooms and OPD capacity</Text>
          </View>
          <TouchableOpacity
            style={styles.addDoctorBtn}
            onPress={() => setShowAddDoctorModal(true)}
          >
            <Text style={styles.addDoctorBtnText}>+ Add Doctor</Text>
          </TouchableOpacity>
        </View>

        {doctors.map((doc) => {
          const initials = doc.name
            .replace('Dr. ', '')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2);
          return (
            <View key={doc.id} style={styles.doctorItem}>
              <View style={styles.docAvatar}>
                <Text style={styles.docAvatarText}>{initials || 'DR'}</Text>
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{doc.name}</Text>
                <View style={styles.docChipRow}>
                  <View style={styles.docChip}>
                    <Text style={styles.docChipText}>{doc.doctorProfile?.specialty}</Text>
                  </View>
                  <View style={styles.docChip}>
                    <Text style={styles.docChipText}>{doc.doctorProfile?.roomNumber}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.feeBadge}>
                <Text style={styles.feeText}>₹{doc.doctorProfile?.consultationFee}/visit</Text>
              </View>
            </View>
          );
        })}
      </GlassView>

      {/* Outside Waiting Room Monitor Integration Notice */}
      <GlassView style={styles.monitorNoticeCard}>
        <Text style={styles.monitorTitle}>📺 Waiting Room Door Monitor Display</Text>
        <Text style={styles.monitorText}>
          Connected to Scan Room 1 • Displays token numbers and audio chime automatically.
        </Text>
      </GlassView>

      {/* Add Doctor Modal */}
      <Modal visible={showAddDoctorModal} transparent animationType="slide" onRequestClose={() => setShowAddDoctorModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Doctor to Hospital</Text>
              <TouchableOpacity onPress={() => setShowAddDoctorModal(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Doctor Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Dr. K. Subbulakshmi"
                value={newDocName}
                onChangeText={setNewDocName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Department / Specialty</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Neurology"
                value={newDocSpec}
                onChangeText={setNewDocSpec}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Assigned Room #</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Scan Room 2"
                  value={newDocRoom}
                  onChangeText={setNewDocRoom}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Consultation Fee (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="600"
                  keyboardType="numeric"
                  value={newDocFee}
                  onChangeText={setNewDocFee}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveDocBtn} onPress={handleAddDoctor}>
              <Text style={styles.saveDocBtnText}>Register Doctor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  hospitalHero: {
    backgroundColor: '#075E54',
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
  },
  hospitalHeroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hospitalHeroSub: {
    color: '#A0D2CE',
    fontSize: 12,
    marginTop: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  kpiTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  addDoctorBtn: {
    backgroundColor: colors.whatsapp.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addDoctorBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  doctorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  docAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  docAvatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#047857',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  docChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  docChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  feeBadge: {
    backgroundColor: '#DCF8C6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  feeText: {
    color: '#075E54',
    fontSize: 11,
    fontWeight: 'bold',
  },
  monitorNoticeCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
  },
  monitorTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  monitorText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 12,
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  saveDocBtn: {
    backgroundColor: colors.whatsapp.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveDocBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rioCommandCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  rioCommandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FFCC',
  },
  liveCommandText: {
    color: '#00FFCC',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rioCommandTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  staffCountBadge: {
    backgroundColor: 'rgba(0,255,204,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  staffCountText: {
    color: '#00FFCC',
    fontSize: 10,
    fontWeight: '800',
  },
  occupancyStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 10,
  },
  occItem: {
    flex: 1,
    alignItems: 'center',
  },
  occLabel: {
    fontSize: 8.5,
    color: '#94A3B8',
    fontWeight: '800',
  },
  occVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  occDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  kioskWarningBanner: {
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  warningTitle: {
    color: '#F87171',
    fontSize: 10.5,
    fontWeight: '900',
    marginBottom: 2,
  },
  warningSub: {
    color: '#FECACA',
    fontSize: 11,
    lineHeight: 16,
  },
  deliveryStatusRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  deliveryRowTitle: {
    color: '#CBD5E1',
    fontSize: 11.5,
  },
});
