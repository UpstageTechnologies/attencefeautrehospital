import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { AppIcon } from '../../components/common/AppIcon';
import { attendanceService, PunchResult } from '../../services/attendanceService';
import { StaffMember, AttendanceAction } from '../../types';
import { INITIAL_STAFF_MEMBERS, RIO_SCAN_CENTER_INFO } from '../../services/rioStaffSeedData';

interface FaceAttendanceKioskScreenProps {
  visible: boolean;
  onClose: () => void;
  defaultFloor?: 1 | 2 | 3;
}

export const FaceAttendanceKioskScreen: React.FC<FaceAttendanceKioskScreenProps> = ({
  visible,
  onClose,
  defaultFloor = 1,
}) => {
  const { colors: tc, isDark } = useAppTheme();

  const [selectedFloor, setSelectedFloor] = useState<1 | 2 | 3>(defaultFloor);
  const [selectedAction, setSelectedAction] = useState<AttendanceAction>('SHIFT_IN');
  const [isScanning, setIsScanning] = useState(false);
  const [recognizedStaff, setRecognizedStaff] = useState<StaffMember | null>(null);
  const [punchResult, setPunchResult] = useState<PunchResult | null>(null);

  // Manual Quick Staff Picker for testing/demonstration without needing physical webcam
  const [isManualPickerOpen, setIsManualPickerOpen] = useState(false);

  // Trigger simulated biometric face scan
  const handleTriggerScan = async (forcedStaff?: StaffMember) => {
    setIsScanning(true);
    setRecognizedStaff(null);
    setPunchResult(null);

    try {
      let matchedStaff = forcedStaff;
      if (!matchedStaff) {
        const res = await attendanceService.matchFaceAgainstStaffGallery();
        matchedStaff = res.staffMember;
      }

      if (matchedStaff) {
        setRecognizedStaff(matchedStaff);

        // Execute attendance punch
        const floorName =
          selectedFloor === 1
            ? 'Floor 1 - Main Reception Kiosk'
            : selectedFloor === 2
            ? 'Floor 2 - CT/MRI Lift Lobby Kiosk'
            : 'Floor 3 - Pathology Lab Kiosk';

        const punch = await attendanceService.recordAttendancePunch(
          matchedStaff.id,
          selectedAction,
          floorName
        );
        setPunchResult(punch);
      }
    } catch (e) {
      console.warn('Scan error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const getCheckpointTitle = () => {
    switch (selectedFloor) {
      case 1:
        return 'Floor 1 Checkpoint (Reception & Ultrasound)';
      case 2:
        return 'Floor 2 Checkpoint (1.5T MRI, 128 CT & Lift Lobby)';
      case 3:
        return 'Floor 3 Checkpoint (Biochemistry & Pathology Labs)';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: '#090D16' }]}>
        {/* Top Kiosk Bar */}
        <View style={styles.topBar}>
          <View>
            <View style={styles.kioskBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.kioskBadgeText}>LIVE ATTENDANCE TABLET KIOSK</Text>
            </View>
            <Text style={styles.kioskTitle}>{RIO_SCAN_CENTER_INFO.name}</Text>
            <Text style={styles.kioskSub}>{getCheckpointTitle()}</Text>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <AppIcon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Floor Switcher */}
        <View style={styles.floorBar}>
          {[1, 2, 3].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.floorBtn, selectedFloor === f && styles.floorBtnActive]}
              onPress={() => setSelectedFloor(f as any)}
            >
              <Text style={[styles.floorBtnText, selectedFloor === f && styles.floorBtnTextActive]}>
                Floor {f} Kiosk
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Punch Type Selector */}
        <View style={styles.actionBar}>
          {[
            { id: 'SHIFT_IN', label: '1. Shift Clock In', icon: 'enter-outline', color: '#10B981' },
            { id: 'LUNCH_OUT', label: '2. Lunch Out (45m)', icon: 'restaurant-outline', color: '#F59E0B' },
            { id: 'LUNCH_IN', label: '3. Lunch Return', icon: 'checkmark-circle-outline', color: '#3B82F6' },
            { id: 'SHIFT_OUT', label: '4. Shift Clock Out', icon: 'exit-outline', color: '#8B5CF6' },
          ].map((act) => (
            <TouchableOpacity
              key={act.id}
              style={[
                styles.actionItem,
                selectedAction === act.id && { backgroundColor: act.color, borderColor: act.color },
              ]}
              onPress={() => {
                setSelectedAction(act.id as any);
                setPunchResult(null);
              }}
            >
              <AppIcon
                name={act.icon}
                size={14}
                color={selectedAction === act.id ? '#FFFFFF' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.actionText,
                  selectedAction === act.id && { color: '#FFFFFF', fontWeight: '800' },
                ]}
              >
                {act.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Central Camera HUD View */}
        <View style={styles.cameraWrapper}>
          <View style={styles.cameraFrame}>
            {/* Corner Bracket Guides */}
            <View style={[styles.cornerBracket, styles.topLeft]} />
            <View style={[styles.cornerBracket, styles.topRight]} />
            <View style={[styles.cornerBracket, styles.bottomLeft]} />
            <View style={[styles.cornerBracket, styles.bottomRight]} />

            {/* Scanning Laser Beam */}
            {isScanning && <View style={styles.scanningBeam} />}

            {/* Biometric Circle & Guidance */}
            <View style={styles.reticleCircle}>
              <AppIcon
                name={isScanning ? 'sync-outline' : recognizedStaff ? 'checkmark-circle' : 'scan-outline'}
                size={64}
                color={isScanning ? '#00FFCC' : recognizedStaff ? '#10B981' : '#38BDF8'}
              />
              <Text style={styles.hudInstruction}>
                {isScanning
                  ? 'ANALYZING FACIAL BIOMETRIC...'
                  : recognizedStaff
                  ? `VERIFIED: ${recognizedStaff.name}`
                  : 'ALIGN FACE INSIDE RETICLE'}
              </Text>
            </View>
          </View>
        </View>

        {/* Punch Result Toast Banner */}
        {punchResult && (
          <View
            style={[
              styles.punchCard,
              {
                borderColor: punchResult.isOverstayViolation ? '#F59E0B' : '#10B981',
                backgroundColor: punchResult.isOverstayViolation ? '#2D1B06' : '#0B261A',
              },
            ]}
          >
            <View style={styles.punchHeader}>
              <View style={styles.staffThumb}>
                <Text style={styles.staffThumbText}>
                  {punchResult.staffMember.name.charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.punchStaffName}>{punchResult.staffMember.name}</Text>
                <Text style={styles.punchStaffMeta}>
                  {punchResult.staffMember.department} • {punchResult.staffMember.id}
                </Text>
              </View>
              <View style={styles.punchBadge}>
                <Text style={styles.punchBadgeText}>CONFIDENCE 98.4%</Text>
              </View>
            </View>

            <Text
              style={[
                styles.punchFeedback,
                { color: punchResult.isOverstayViolation ? '#FCD34D' : '#6EE7B7' },
              ]}
            >
              {punchResult.message}
            </Text>

            {punchResult.isOverstayViolation && (
              <View style={styles.violationWarning}>
                <AppIcon name="alert-triangle" size={16} color="#F59E0B" />
                <Text style={styles.violationText}>
                  Payroll Notification: +{punchResult.overstayMinutes}m break overstay logged for automated salary deduction.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Bottom Trigger Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.scanTriggerBtn}
            onPress={() => handleTriggerScan()}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#090D16" />
            ) : (
              <>
                <AppIcon name="camera" size={20} color="#090D16" />
                <Text style={styles.scanTriggerBtnText}>Simulate Live Face Detection</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualStaffBtn}
            onPress={() => setIsManualPickerOpen(true)}
          >
            <Text style={styles.manualStaffBtnText}>
              Select Specific Staff (Test Overstay / Punctual) ➔
            </Text>
          </TouchableOpacity>
        </View>

        {/* Staff Choice Modal for Instant Testing */}
        <Modal visible={isManualPickerOpen} animationType="fade" transparent>
          <View style={styles.modalBg}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Staff Member to Test Face Scan</Text>
                <TouchableOpacity onPress={() => setIsManualPickerOpen(false)}>
                  <AppIcon name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }}>
                {INITIAL_STAFF_MEMBERS.map((staff) => (
                  <TouchableOpacity
                    key={staff.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      setIsManualPickerOpen(false);
                      handleTriggerScan(staff);
                    }}
                  >
                    <View style={styles.pickerAvatar}>
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                        {staff.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerName}>{staff.name}</Text>
                      <Text style={styles.pickerSub}>
                        {staff.department} • Floor {staff.floor} ({staff.id})
                      </Text>
                    </View>
                    <AppIcon name="chevron-forward" size={16} color="#64748B" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  kioskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,204,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FFCC',
  },
  kioskBadgeText: {
    color: '#00FFCC',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  kioskTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  kioskSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  floorBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginVertical: 8,
  },
  floorBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  floorBtnActive: {
    backgroundColor: '#00FFCC',
  },
  floorBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  floorBtnTextActive: {
    color: '#090D16',
    fontWeight: '900',
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 12,
  },
  actionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 4,
  },
  actionText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  cameraWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cameraFrame: {
    width: '90%',
    height: 280,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,255,204,0.3)',
    backgroundColor: 'rgba(15,23,42,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#00FFCC',
  },
  topLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 12,
    right: 12,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanningBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00FFCC',
    shadowColor: '#00FFCC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  reticleCircle: {
    alignItems: 'center',
    gap: 12,
  },
  hudInstruction: {
    color: '#00FFCC',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  punchCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  punchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  staffThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00FFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffThumbText: {
    color: '#090D16',
    fontWeight: 'bold',
    fontSize: 16,
  },
  punchStaffName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  punchStaffMeta: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  punchBadge: {
    backgroundColor: 'rgba(0,255,204,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  punchBadgeText: {
    color: '#00FFCC',
    fontSize: 8.5,
    fontWeight: '900',
  },
  punchFeedback: {
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 17,
  },
  violationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.2)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  violationText: {
    flex: 1,
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 8,
  },
  scanTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FFCC',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  scanTriggerBtnText: {
    color: '#090D16',
    fontSize: 14,
    fontWeight: '900',
  },
  manualStaffBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  manualStaffBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  pickerModal: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 10,
  },
  pickerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#075E54',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
});
