import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Modal,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { useAppTheme } from '../../context/ThemeContext';
import { dataStore } from '../../services/dataStore';
import { AppIcon } from '../../components/common/AppIcon';
import { PhotoPickerModal } from '../../components/profile/PhotoPickerModal';
import { UserProfile } from '../../types';
import { PulsingStatusDot } from '../../components/common/PulsingStatusDot';
import { AnimatedPressableCard } from '../../components/common/AnimatedPressableCard';

type ProfileTab = 'profile' | 'payroll' | 'settings';

interface SalaryRecord {
  id: string;
  disbursedDate: string;
  cyclePeriod: string;
  grossAmount: number;
  deductions: number;
  netPaid: number;
  paymentMethod: string;
  referenceNumber: string;
}

interface DailyEarning {
  dayLabel: string;
  dateStr: string;
  tokensCount: number;
  hoursWorked: number;
  baseAmount: number;
  incentiveAmount: number;
  totalEarned: number;
}

export const ReceptionistProfileScreen: React.FC = () => {
  const { user, updateProfile, switchRole } = useAuth();
  const { selectedHospital } = useHospital();
  const { theme, setTheme, toggleTheme, colors: tc, isDark } = useAppTheme();

  // Active top-level sub-tab in Profile Screen (shortened names for zero overflow)
  const [activeSubTab, setActiveSubTab] = useState<ProfileTab>('profile');

  // Receptionist profile fields with fallbacks
  const recepProfile = user?.receptionistProfile;
  const initialDoctorIds = recepProfile?.assignedDoctorIds || (recepProfile?.assignedDoctorId ? [recepProfile.assignedDoctorId] : ['usr_doc_jenkins', 'usr_doc_sharma']);

  // Photo picker and profile editing state
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(user?.name || 'Kavitha Murugan');
  const [editPhone, setEditPhone] = useState<string>(user?.phone || '+91 94432 33445');
  const [editEmail, setEditEmail] = useState<string>(user?.email || 'reception@rioscan.com');
  const [editDeskNumber, setEditDeskNumber] = useState<string>(recepProfile?.deskNumber || 'Desk 1');
  const [editShift, setEditShift] = useState<'morning' | 'evening' | 'night'>(recepProfile?.shift || 'morning');
  const [editAddress, setEditAddress] = useState<string>(recepProfile?.address || 'Plot 42, NGO Colony, Palayamkottai, Tirunelveli, Tamil Nadu, India');
  const [editEmergencyContact, setEditEmergencyContact] = useState<string>(recepProfile?.emergencyContact || '+91 98421 99880');
  const [editBloodGroup, setEditBloodGroup] = useState<string>(recepProfile?.bloodGroup || 'B+');

  // Multi-select doctors state
  const [assignedDoctorIds, setAssignedDoctorIds] = useState<string[]>(initialDoctorIds);
  const [tempSelectedDoctorIds, setTempSelectedDoctorIds] = useState<string[]>(initialDoctorIds);
  const [showDoctorMultiModal, setShowDoctorMultiModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings toggles
  const [autoPrintTokens, setAutoPrintTokens] = useState<boolean>(true);
  const [audioChimeEnabled, setAudioChimeEnabled] = useState<boolean>(true);
  const [biometricUnlock, setBiometricUnlock] = useState<boolean>(true);
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [highContrastXray, setHighContrastXray] = useState<boolean>(true);

  // Report Generator with From-To Date Picker state
  const [reportFromDate, setReportFromDate] = useState<string>('2026-08-01');
  const [reportToDate, setReportToDate] = useState<string>('2026-09-26');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf');
  const [selectedPreset, setSelectedPreset] = useState<string>('last30');
  const [showReportPreviewModal, setShowReportPreviewModal] = useState<boolean>(false);

  // Payslip Modal state
  const [selectedSlip, setSelectedSlip] = useState<SalaryRecord | null>(null);

  // Available doctors at the current hospital
  const allDoctors = dataStore.getDoctors(selectedHospital.id);
  const assignedDoctors = allDoctors.filter((d) => assignedDoctorIds.includes(d.id));

  // -------------------------------------------------------------
  // Mock Data: Last 7 Days Daily Compensation & Token Stats
  // -------------------------------------------------------------
  const last7DaysData: DailyEarning[] = [
    { dayLabel: 'Sat', dateStr: 'Today, Sep 26', tokensCount: 38, hoursWorked: 8.0, baseAmount: 1050, incentiveAmount: 250, totalEarned: 1300 },
    { dayLabel: 'Fri', dateStr: 'Fri, Sep 25', tokensCount: 42, hoursWorked: 8.5, baseAmount: 1050, incentiveAmount: 350, totalEarned: 1400 },
    { dayLabel: 'Thu', dateStr: 'Thu, Sep 24', tokensCount: 36, hoursWorked: 8.0, baseAmount: 1050, incentiveAmount: 200, totalEarned: 1250 },
    { dayLabel: 'Wed', dateStr: 'Wed, Sep 23', tokensCount: 39, hoursWorked: 8.0, baseAmount: 1050, incentiveAmount: 250, totalEarned: 1300 },
    { dayLabel: 'Tue', dateStr: 'Tue, Sep 22', tokensCount: 45, hoursWorked: 8.5, baseAmount: 1050, incentiveAmount: 400, totalEarned: 1450 },
    { dayLabel: 'Mon', dateStr: 'Mon, Sep 21', tokensCount: 40, hoursWorked: 8.0, baseAmount: 1050, incentiveAmount: 300, totalEarned: 1350 },
    { dayLabel: 'Sun', dateStr: 'Sun, Sep 20', tokensCount: 8, hoursWorked: 7.0, baseAmount: 900, incentiveAmount: 100, totalEarned: 1000 },
  ];

  const total7DayTokens = last7DaysData.reduce((acc, d) => acc + d.tokensCount, 0);
  const total7DayHours = last7DaysData.reduce((acc, d) => acc + d.hoursWorked, 0);
  const total7DayEarnings = last7DaysData.reduce((acc, d) => acc + d.totalEarned, 0);

  // -------------------------------------------------------------
  // Mock Data: Historical Salary Payout Table (Date-Wise)
  // -------------------------------------------------------------
  const historicalSalaryRecords: SalaryRecord[] = [
    { id: 'sal_09_2026', disbursedDate: '01 Sep 2026', cyclePeriod: 'Aug 01 – Aug 31, 2026', grossAmount: 32000, deductions: 2400, netPaid: 29600, paymentMethod: 'Direct Deposit (NEFT)', referenceNumber: 'NEFT-RIO-984210' },
    { id: 'sal_08_2026', disbursedDate: '01 Aug 2026', cyclePeriod: 'Jul 01 – Jul 31, 2026', grossAmount: 32000, deductions: 2400, netPaid: 29600, paymentMethod: 'Direct Deposit (NEFT)', referenceNumber: 'NEFT-RIO-981105' },
    { id: 'sal_07_2026', disbursedDate: '01 Jul 2026', cyclePeriod: 'Jun 01 – Jun 30, 2026', grossAmount: 32000, deductions: 2400, netPaid: 29600, paymentMethod: 'Direct Deposit (NEFT)', referenceNumber: 'NEFT-RIO-978841' },
    { id: 'sal_06_2026', disbursedDate: '01 Jun 2026', cyclePeriod: 'May 01 – May 31, 2026', grossAmount: 30000, deductions: 2200, netPaid: 27800, paymentMethod: 'Direct Deposit (NEFT)', referenceNumber: 'NEFT-RIO-974221' },
    { id: 'sal_05_2026', disbursedDate: '01 May 2026', cyclePeriod: 'Apr 01 – Apr 30, 2026', grossAmount: 30000, deductions: 2200, netPaid: 27800, paymentMethod: 'Direct Deposit (NEFT)', referenceNumber: 'NEFT-RIO-969910' },
    { id: 'sal_04_2026', disbursedDate: '01 Apr 2026', cyclePeriod: 'Mar 01 – Mar 31, 2026', grossAmount: 30000, deductions: 2200, netPaid: 27800, paymentMethod: 'Direct Deposit (NEFT)', referenceNumber: 'NEFT-RIO-965412' },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleOpenEditModal = () => {
    setEditName(user?.name || 'Kavitha Murugan');
    setEditPhone(user?.phone || '+91 94432 33445');
    setEditEmail(user?.email || 'reception@rioscan.com');
    setEditDeskNumber(recepProfile?.deskNumber || 'Desk 1');
    setEditShift(recepProfile?.shift || 'morning');
    setEditAddress(recepProfile?.address || 'Plot 42, NGO Colony, Palayamkottai, Tirunelveli, Tamil Nadu, India');
    setEditEmergencyContact(recepProfile?.emergencyContact || '+91 98421 99880');
    setEditBloodGroup(recepProfile?.bloodGroup || 'B+');
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Name cannot be empty');
      } else {
        Alert.alert('Required', 'Please enter your full name.');
      }
      return;
    }

    updateProfile({
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      receptionistProfile: {
        ...user?.receptionistProfile,
        deskNumber: editDeskNumber.trim(),
        shift: editShift,
        address: editAddress.trim(),
        emergencyContact: editEmergencyContact.trim(),
        bloodGroup: editBloodGroup.trim(),
      },
    });

    setShowEditProfileModal(false);
    showToast('Receptionist profile updated successfully! ✓');
  };

  const handleSaveAvatar = (newUri: string) => {
    updateProfile({ avatarUrl: newUri });
    showToast('Profile photo updated successfully! 📸');
  };

  const handleOpenMultiDoctorModal = () => {
    setTempSelectedDoctorIds([...assignedDoctorIds]);
    setShowDoctorMultiModal(true);
  };

  const handleToggleDoctorSelection = (doctorId: string) => {
    if (tempSelectedDoctorIds.includes(doctorId)) {
      if (tempSelectedDoctorIds.length === 1) {
        showToast('At least one doctor must remain assigned');
        return;
      }
      setTempSelectedDoctorIds(tempSelectedDoctorIds.filter((id) => id !== doctorId));
    } else {
      setTempSelectedDoctorIds([...tempSelectedDoctorIds, doctorId]);
    }
  };

  const handleSaveDoctorSelection = () => {
    setAssignedDoctorIds([...tempSelectedDoctorIds]);
    setShowDoctorMultiModal(false);

    dataStore.updateReceptionistAssignedDoctors(tempSelectedDoctorIds);

    const updatedDocs = allDoctors.filter((d) => tempSelectedDoctorIds.includes(d.id));
    if (user && user.receptionistProfile) {
      updateProfile({
        receptionistProfile: {
          ...user.receptionistProfile,
          assignedDoctorIds: tempSelectedDoctorIds,
          assignedDoctorNames: updatedDocs.map((d) => d.name),
          assignedRooms: updatedDocs.map((d) => d.doctorProfile?.roomNumber || 'Room 101'),
          assignedDoctorId: updatedDocs[0]?.id,
          assignedDoctorName: updatedDocs[0]?.name,
          assignedRoomNumber: updatedDocs[0]?.doctorProfile?.roomNumber,
        },
      });
    }

    showToast(`Assigned as Receptionist for ${tempSelectedDoctorIds.length} Doctor(s)`);
  };

  const applyPreset = (preset: 'month' | 'last30' | 'q3' | 'ytd') => {
    setSelectedPreset(preset);
    if (preset === 'month') {
      setReportFromDate('2026-09-01');
      setReportToDate('2026-09-26');
    } else if (preset === 'last30') {
      setReportFromDate('2026-08-27');
      setReportToDate('2026-09-26');
    } else if (preset === 'q3') {
      setReportFromDate('2026-07-01');
      setReportToDate('2026-09-26');
    } else if (preset === 'ytd') {
      setReportFromDate('2026-01-01');
      setReportToDate('2026-09-26');
    }
  };

  const handleGenerateReport = () => {
    setShowReportPreviewModal(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Toast Feedback Banner */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <AppIcon name="checkmark" size={16} color="#FFFFFF" />
          <Text style={styles.toastText} numberOfLines={2}>
            {toastMessage}
          </Text>
        </View>
      )}

      {/* ========================================================
          NATIVE iOS SEGMENTED CONTROL TABS (Shortened Names)
      ======================================================== */}
      <View style={[styles.segmentedControlWrap, { backgroundColor: tc.background, borderBottomColor: tc.cardBorder }]}>
        <View style={[styles.iosSegmentContainer, { backgroundColor: isDark ? '#2C2C2E' : '#E3E3E8' }]}>
          <TouchableOpacity
            style={[styles.iosSegmentPill, activeSubTab === 'profile' && [styles.iosSegmentPillActive, { backgroundColor: isDark ? '#636366' : '#FFFFFF' }]]}
            onPress={() => setActiveSubTab('profile')}
            activeOpacity={0.8}
          >
            <Text style={[styles.iosSegmentText, { color: isDark ? '#9CA3AF' : '#64748B' }, activeSubTab === 'profile' && [styles.iosSegmentTextActive, { color: tc.text }]]}>
              Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iosSegmentPill, activeSubTab === 'payroll' && [styles.iosSegmentPillActive, { backgroundColor: isDark ? '#636366' : '#FFFFFF' }]]}
            onPress={() => setActiveSubTab('payroll')}
            activeOpacity={0.8}
          >
            <Text style={[styles.iosSegmentText, { color: isDark ? '#9CA3AF' : '#64748B' }, activeSubTab === 'payroll' && [styles.iosSegmentTextActive, { color: tc.text }]]}>
              Payroll
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iosSegmentPill, activeSubTab === 'settings' && [styles.iosSegmentPillActive, { backgroundColor: isDark ? '#636366' : '#FFFFFF' }]]}
            onPress={() => setActiveSubTab('settings')}
            activeOpacity={0.8}
          >
            <Text style={[styles.iosSegmentText, { color: isDark ? '#9CA3AF' : '#64748B' }, activeSubTab === 'settings' && [styles.iosSegmentTextActive, { color: tc.text }]]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================
            TAB 1: PROFILE INFO & MULTI-DOCTOR GROUP
        ======================================================== */}
        {activeSubTab === 'profile' && (
          <View style={styles.tabContentGroup}>
            {/* Identity Header Card */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.headerRow}>
                <View style={styles.avatarWrap}>
                  <Image
                    source={{
                      uri:
                        user?.avatarUrl ||
                        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
                    }}
                    style={styles.avatarImage}
                  />
                  <TouchableOpacity
                    style={styles.avatarEditBtn}
                    onPress={() => setShowPhotoPicker(true)}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="camera-outline" size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.headerInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.profileName, { color: tc.text }]} numberOfLines={1}>{user?.name || 'Kavitha Murugan'}</Text>
                    <View style={styles.onlineBadge}>
                      <PulsingStatusDot color="#10B981" size={6} active={true} style={{ marginRight: 4 }} />
                      <Text style={styles.onlineText}>On Duty</Text>
                    </View>
                  </View>

                  <Text style={[styles.profileRole, { color: tc.textSecondary }]}>Front Desk & OPD Triage Receptionist</Text>

                  {/* Responsive Badges with Zero Overflow */}
                  <View style={styles.badgePillRow}>
                    <View style={[styles.empBadge, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}>
                      <Text style={[styles.empBadgeText, { color: tc.text }]}>
                        {recepProfile?.employeeId || 'EMP-RIO-2024-088'}
                      </Text>
                    </View>
                    <View style={styles.deskBadge}>
                      <Text style={styles.deskBadgeText} numberOfLines={1}>
                        {recepProfile?.deskNumber || 'Desk 1'} • {recepProfile?.shift || 'OPD Triage'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.editProfileBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9', borderColor: tc.cardBorder }]}
                  onPress={handleOpenEditModal}
                  activeOpacity={0.7}
                >
                  <AppIcon name="create-outline" size={15} color={colors.whatsapp.primary} />
                  <Text style={[styles.editProfileBtnText, { color: colors.whatsapp.primary }]}>Edit Profile Info</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.changePhotoBtn, { backgroundColor: colors.whatsapp.primary }]}
                  onPress={() => setShowPhotoPicker(true)}
                  activeOpacity={0.8}
                >
                  <AppIcon name="camera-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.changePhotoBtnText}>Update Photo</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Assigned Doctors & Rooms (MULTI-SELECT SUPPORT!) */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#E0F2FE' }]}>
                    <AppIcon name="briefcase-outline" size={18} color="#0284C7" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>
                      Assigned Doctors ({assignedDoctors.length} Selected)
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>
                      Manage queues & walk-ins for multiple doctors concurrently
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.manageDoctorsBtn}
                  onPress={handleOpenMultiDoctorModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.manageDoctorsBtnText}>Select</Text>
                  <AppIcon name="chevron-down" size={12} color={colors.whatsapp.primary} />
                </TouchableOpacity>
              </View>

              {/* List of currently assigned doctors */}
              <View style={styles.assignedDoctorsStack}>
                {assignedDoctors.map((doc) => (
                  <AnimatedPressableCard
                    key={doc.id}
                    style={[
                      styles.doctorMiniCard,
                      { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder },
                    ]}
                  >
                    <Image source={{ uri: doc.avatarUrl }} style={styles.docMiniAvatar} />
                    <View style={styles.docMiniInfo}>
                      <View style={styles.docMiniHeader}>
                        <Text style={[styles.docMiniName, { color: tc.text }]}>{doc.name}</Text>
                        <View style={styles.roomTag}>
                          <Text style={styles.roomTagText}>{doc.doctorProfile?.roomNumber || 'Scan Room 1'}</Text>
                        </View>
                      </View>
                      <View style={styles.docMiniChipsRow}>
                        <View style={[styles.microChip, { backgroundColor: isDark ? '#1F2937' : '#E2E8F0' }]}>
                          <Text style={[styles.microChipText, { color: tc.textSecondary }]}>
                            {doc.doctorProfile?.specialty || 'General'}
                          </Text>
                        </View>
                        <View style={[styles.microChip, { backgroundColor: '#DCFCE7' }]}>
                          <Text style={[styles.microChipText, { color: '#15803D' }]}>
                            Fee ₹{doc.doctorProfile?.consultationFee || 800}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </AnimatedPressableCard>
                ))}
              </View>
            </View>

            {/* Personal & Verified Contact Details */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#EDE9FE' }]}>
                    <AppIcon name="location-outline" size={18} color="#7C3AED" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Personal & Contact Information</Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>Residential address and verified contacts</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cleanList}>
                <View style={[styles.stackedBlock, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.fieldLabel}>RESIDENTIAL ADDRESS</Text>
                  <Text style={[styles.fieldValueBold, { color: tc.text }]}>
                    {recepProfile?.address || 'Plot 42, NGO Colony, Palayamkottai, Tirunelveli, Tamil Nadu, India'}
                  </Text>
                  <Text style={[styles.fieldSubhint, { color: tc.textSecondary }]}>Verified Staff Residence • Tirunelveli</Text>
                </View>

                <View style={styles.twoColumnGrid}>
                  <View style={[styles.gridCol, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                    <Text style={[styles.fieldValueBold, { color: tc.text }]}>{user?.phone || '+91 94432 33445'}</Text>
                  </View>
                  <View style={[styles.gridCol, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    <Text style={styles.fieldLabel}>WORK EMAIL</Text>
                    <Text style={[styles.fieldValueBold, { color: tc.text }]}>{user?.email || 'reception@rioscan.com'}</Text>
                  </View>
                </View>

                <View style={styles.twoColumnGrid}>
                  <View style={[styles.gridCol, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    <Text style={styles.fieldLabel}>EMERGENCY CONTACT</Text>
                    <Text style={[styles.fieldValueBold, { color: tc.text }]}>
                      {recepProfile?.emergencyContact || 'Murugan (Spouse) • +91 98421 99880'}
                    </Text>
                    <Text style={[styles.fieldSubhint, { color: tc.textSecondary }]}>Verified Contact</Text>
                  </View>
                  <View style={[styles.gridCol, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    <Text style={styles.fieldLabel}>BLOOD GROUP</Text>
                    <Text style={[styles.fieldValueBold, { color: tc.text }]}>{recepProfile?.bloodGroup || 'B+'}</Text>
                    <Text style={[styles.fieldSubhint, { color: tc.textSecondary }]}>Universal Platelet</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Employment & Joining Details Card */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#FEF3C7' }]}>
                    <AppIcon name="calendar-outline" size={18} color="#D97706" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Employment & Joining</Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>Hospital appointment and tenure</Text>
                  </View>
                </View>
              </View>

              <View style={styles.fourBoxGrid}>
                <View style={[styles.boxTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.boxTileLabel}>Date of Joining</Text>
                  <Text style={[styles.boxTileValue, { color: tc.text }]}>{recepProfile?.joiningDate || 'March 15, 2024'}</Text>
                  <Text style={[styles.boxTileHint, { color: tc.textSecondary }]}>Tenure: 2 yrs 6 mos</Text>
                </View>

                <View style={[styles.boxTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.boxTileLabel}>Employment</Text>
                  <Text style={[styles.boxTileValue, { color: tc.text }]}>Full-Time Staff</Text>
                  <Text style={[styles.boxTileHint, { color: tc.textSecondary }]}>Permanent</Text>
                </View>

                <View style={[styles.boxTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.boxTileLabel}>Shift Schedule</Text>
                  <Text style={[styles.boxTileValue, { color: tc.text }]}>Morning OPD</Text>
                  <Text style={[styles.boxTileHint, { color: tc.textSecondary }]}>08:00 – 16:30</Text>
                </View>

                <View style={[styles.boxTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.boxTileLabel}>Supervisor</Text>
                  <Text style={[styles.boxTileValue, { color: tc.text }]}>Dr. S. K. Arumugam</Text>
                  <Text style={[styles.boxTileHint, { color: tc.textSecondary }]}>Managing Director</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================
            TAB 2: PAYROLL & COMPENSATION (KEY REQUIREMENT)
        ======================================================== */}
        {activeSubTab === 'payroll' && (
          <View style={styles.tabContentGroup}>
            {/* Overview Banner */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#DCFCE7' }]}>
                    <AppIcon name="cash-outline" size={18} color="#16A34A" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Compensation Overview</Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>Monthly net payroll and verified direct deposit</Text>
                  </View>
                </View>
              </View>

              {/* Big Net Salary Card */}
              <View style={[styles.salaryHighlightBanner, { backgroundColor: isDark ? '#1C3829' : '#F0FDF4', borderColor: isDark ? '#059669' : '#BBF7D0' }]}>
                <View>
                  <Text style={styles.salaryLabel}>Monthly Net Salary</Text>
                  <Text style={[styles.salaryAmount, { color: isDark ? '#4ADE80' : '#166534' }]}>
                    ₹{(recepProfile?.salary || 32000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    <Text style={[styles.salaryCadence, { color: isDark ? '#4ADE80' : '#15803D' }]}> / mo</Text>
                  </Text>
                  <Text style={[styles.payCycleText, { color: isDark ? '#86EFAC' : '#15803D' }]}>Cycle: Sep 01 – Sep 30, 2026</Text>
                </View>
                <View style={styles.payStatusBadge}>
                  <Text style={styles.payStatusText}>Disbursed</Text>
                </View>
              </View>

              {/* Key Dates Strip */}
              <View style={[styles.keyDatesRow, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                <View style={styles.keyDateItem}>
                  <Text style={styles.keyDateLabel}>LAST DISBURSED</Text>
                  <Text style={[styles.keyDateValue, { color: tc.text }]}>01 Sep 2026</Text>
                </View>
                <View style={[styles.keyDateSeparator, { backgroundColor: tc.cardBorder }]} />
                <View style={styles.keyDateItem}>
                  <Text style={styles.keyDateLabel}>NEXT PAYDAY</Text>
                  <Text style={[styles.keyDateValue, { color: '#16A34A' }]}>01 Oct 2026</Text>
                </View>
                <View style={[styles.keyDateSeparator, { backgroundColor: tc.cardBorder }]} />
                <View style={styles.keyDateItem}>
                  <Text style={styles.keyDateLabel}>PAY METHOD</Text>
                  <Text style={[styles.keyDateValue, { color: tc.text }]}>Direct NEFT</Text>
                </View>
              </View>

              {/* Bank Account Details */}
              <View style={[styles.bankAccountCard, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                <View style={styles.bankIconWrap}>
                  <AppIcon name="card-outline" size={20} color={colors.whatsapp.primary} />
                </View>
                <View style={styles.bankDetails}>
                  <Text style={styles.bankLabel}>DIRECT DEPOSIT BANK ACCOUNT</Text>
                  <Text style={[styles.bankName, { color: tc.text }]}>State Bank of India (SBI) Payroll Checking</Text>
                  <Text style={[styles.bankNumber, { color: tc.textSecondary }]}>Account ending in •••• 4821 (Verified)</Text>
                </View>
              </View>

              {/* Breakdown Table */}
              <View style={[styles.breakdownTable, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableLabel, { color: tc.textSecondary }]}>Base Salary</Text>
                  <Text style={[styles.tableValue, { color: tc.text }]}>₹28,000.00</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableLabel, { color: tc.textSecondary }]}>OPD &amp; Triage Allowance</Text>
                  <Text style={[styles.tableValue, { color: '#16A34A' }]}>+₹3,000.00</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableLabel, { color: tc.textSecondary }]}>Performance Incentive</Text>
                  <Text style={[styles.tableValue, { color: '#16A34A' }]}>+₹1,000.00</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableLabel, { color: tc.textSecondary }]}>Tax &amp; PF Deductions</Text>
                  <Text style={[styles.tableValue, { color: '#DC2626' }]}>-₹2,400.00</Text>
                </View>
                <View style={[styles.tableDivider, { backgroundColor: tc.cardBorder }]} />
                <View style={styles.tableRowTotal}>
                  <Text style={[styles.tableTotalLabel, { color: tc.text }]}>Net Take-Home</Text>
                  <Text style={[styles.tableTotalValue, { color: isDark ? '#4ADE80' : colors.whatsapp.primaryDark }]}>₹29,600.00</Text>
                </View>
              </View>
            </View>

            {/* Last 7 Days Shift & Token Stats */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#F0FDF4' }]}>
                    <AppIcon name="stats-chart-outline" size={18} color="#16A34A" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Last 7 Days Activity</Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>Throughput & daily compensation</Text>
                  </View>
                </View>
              </View>

              {/* 3 KPI Blocks */}
              <View style={styles.kpiRow}>
                <View style={[styles.kpiTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={[styles.kpiNum, { color: tc.text }]}>{total7DayTokens}</Text>
                  <Text style={[styles.kpiLabel, { color: tc.textSecondary }]}>Tokens</Text>
                </View>
                <View style={[styles.kpiTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={[styles.kpiNum, { color: tc.text }]}>{total7DayHours.toFixed(1)}h</Text>
                  <Text style={[styles.kpiLabel, { color: tc.textSecondary }]}>Hours Logged</Text>
                </View>
                <View style={[styles.kpiTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={[styles.kpiNum, { color: '#16A34A' }]}>₹{total7DayEarnings.toLocaleString()}</Text>
                  <Text style={[styles.kpiLabel, { color: tc.textSecondary }]}>Earned 7d</Text>
                </View>
              </View>

              {/* Daily Rows */}
              <View style={[styles.daysList, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                {last7DaysData.map((day, idx) => (
                  <View key={idx} style={[styles.dayItemRow, { borderBottomColor: tc.cardBorder }]}>
                    <View style={styles.dayItemLeft}>
                      <Text style={[styles.dayItemDate, { color: tc.text }]}>{day.dateStr}</Text>
                      <Text style={[styles.dayItemMeta, { color: tc.textSecondary }]}>
                        {day.hoursWorked} hrs • {day.tokensCount} tokens
                      </Text>
                    </View>
                    <View style={styles.dayItemRight}>
                      <Text style={[styles.dayItemAmount, { color: tc.text }]}>₹{day.totalEarned}.00</Text>
                      <Text style={styles.dayItemIncentive}>+₹{day.incentiveAmount} bonus</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Historical Payroll Disbursements Table */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#E0F2FE' }]}>
                    <AppIcon name="calendar-outline" size={18} color="#0284C7" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Paid Salary History (Date-Wise)</Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>Historical disbursements & verifiable slips</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.historyTable, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <View style={[styles.tableHeaderRow, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9', borderBottomColor: tc.cardBorder }]}>
                  <Text style={[styles.thText, { flex: 2.2, color: tc.textSecondary }]}>PAID DATE</Text>
                  <Text style={[styles.thText, { flex: 2.4, color: tc.textSecondary }]}>PERIOD</Text>
                  <Text style={[styles.thText, { flex: 1.8, textAlign: 'right', color: tc.textSecondary }]}>NET PAID</Text>
                  <Text style={[styles.thText, { flex: 1.6, textAlign: 'center', color: tc.textSecondary }]}>SLIP</Text>
                </View>

                {historicalSalaryRecords.map((record, index) => (
                  <TouchableOpacity
                    key={record.id}
                    style={[
                      styles.tableDataRow,
                      { borderBottomColor: tc.cardBorder },
                      index % 2 === 1 && { backgroundColor: isDark ? '#1C1C1E' : '#F8FAFC' },
                    ]}
                    onPress={() => setSelectedSlip(record)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 2.2 }}>
                      <Text style={[styles.tdDate, { color: tc.text }]}>{record.disbursedDate}</Text>
                      <Text style={[styles.tdRef, { color: tc.textSecondary }]}>{record.referenceNumber.substring(0, 10)}</Text>
                    </View>

                    <View style={{ flex: 2.4 }}>
                      <Text style={[styles.tdPeriod, { color: tc.text }]} numberOfLines={1}>
                        {record.cyclePeriod.split('–')[0].trim()}
                      </Text>
                      <Text style={styles.tdStatus}>✓ NEFT Paid</Text>
                    </View>

                    <View style={{ flex: 1.8, alignItems: 'flex-end' }}>
                      <Text style={[styles.tdNet, { color: tc.text }]}>₹{record.netPaid.toLocaleString()}</Text>
                      <Text style={[styles.tdGross, { color: tc.textSecondary }]}>Gross ₹{record.grossAmount.toLocaleString()}</Text>
                    </View>

                    <View style={{ flex: 1.6, alignItems: 'center' }}>
                      <View style={styles.viewSlipChip}>
                        <AppIcon name="document-text-outline" size={13} color={colors.whatsapp.primary} />
                        <Text style={styles.viewSlipText}>PDF</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Report Generation with From-To Date Picker */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#FEF3C7' }]}>
                    <AppIcon name="download-outline" size={18} color="#D97706" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Report Generation</Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>Custom date range payroll statement</Text>
                  </View>
                </View>
              </View>

              {/* Presets */}
              <Text style={styles.pickerSectionLabel}>DATE PRESETS</Text>
              <View style={styles.presetChipsRow}>
                {(['month', 'last30', 'q3', 'ytd'] as const).map((pKey) => (
                  <TouchableOpacity
                    key={pKey}
                    style={[styles.presetChip, selectedPreset === pKey && styles.presetChipActive, { borderColor: tc.cardBorder }]}
                    onPress={() => applyPreset(pKey)}
                  >
                    <Text style={[styles.presetChipText, { color: tc.textSecondary }, selectedPreset === pKey && styles.presetChipTextActive]}>
                      {pKey === 'month' ? 'This Month' : pKey === 'last30' ? 'Last 30 Days' : pKey === 'q3' ? 'Q3 2026' : 'YTD'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* From-To Pickers */}
              <View style={styles.datePickerInputRow}>
                <View style={styles.dateInputCol}>
                  <Text style={[styles.dateFieldTitle, { color: tc.textSecondary }]}>From Date</Text>
                  <View style={[styles.dateInputBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    <AppIcon name="calendar-outline" size={15} color={tc.textSecondary} />
                    <TextInput
                      style={[styles.dateTextInput, { color: tc.text }]}
                      value={reportFromDate}
                      onChangeText={setReportFromDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={tc.textTertiary}
                    />
                  </View>
                </View>

                <View style={styles.dateArrowBox}>
                  <AppIcon name="arrow-back" size={16} color={tc.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
                </View>

                <View style={styles.dateInputCol}>
                  <Text style={[styles.dateFieldTitle, { color: tc.textSecondary }]}>To Date</Text>
                  <View style={[styles.dateInputBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    <AppIcon name="calendar-outline" size={15} color={tc.textSecondary} />
                    <TextInput
                      style={[styles.dateTextInput, { color: tc.text }]}
                      value={reportToDate}
                      onChangeText={setReportToDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={tc.textTertiary}
                    />
                  </View>
                </View>
              </View>

              {/* Export Button */}
              <TouchableOpacity
                style={styles.generateReportBtn}
                onPress={handleGenerateReport}
                activeOpacity={0.8}
              >
                <AppIcon name="download-outline" size={17} color="#FFFFFF" />
                <Text style={styles.generateReportBtnText}>Generate Statement Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================
            TAB 3: SETTINGS (INCLUDES APP COLOR THEME SETTING!)
        ======================================================== */}
        {activeSubTab === 'settings' && (
          <View style={styles.tabContentGroup}>
            {/* APP COLOR THEME SETTING (KEY REQUIREMENT!) */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
                    <AppIcon name="flash-outline" size={18} color={isDark ? '#FACC15' : '#4B5563'} />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>App Color Theme</Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>
                      Switch between Plain White (Light) and Pure Black (Dark)
                    </Text>
                  </View>
                </View>
              </View>

              {/* Theme Choice Cards */}
              <View style={styles.themeCardsRow}>
                {/* Light Mode Card */}
                <TouchableOpacity
                  style={[
                    styles.themeOptionCard,
                    !isDark && styles.themeOptionCardSelected,
                    { backgroundColor: '#FFFFFF', borderColor: !isDark ? colors.whatsapp.primary : '#E5E7EB' },
                  ]}
                  onPress={() => setTheme('light')}
                  activeOpacity={0.8}
                >
                  <View style={styles.themePreviewLight}>
                    <View style={styles.previewBarLight} />
                    <View style={styles.previewBoxLight} />
                  </View>
                  <Text style={[styles.themeOptionTitle, { color: '#111827' }]}>Plain White</Text>
                  <Text style={styles.themeOptionSub}>Light Mode</Text>
                  {!isDark && (
                    <View style={styles.themeSelectedCheck}>
                      <AppIcon name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Dark Mode Card */}
                <TouchableOpacity
                  style={[
                    styles.themeOptionCard,
                    isDark && styles.themeOptionCardSelected,
                    { backgroundColor: '#1C1C1E', borderColor: isDark ? '#25D366' : '#2C2C2E' },
                  ]}
                  onPress={() => setTheme('dark')}
                  activeOpacity={0.8}
                >
                  <View style={styles.themePreviewDark}>
                    <View style={styles.previewBarDark} />
                    <View style={styles.previewBoxDark} />
                  </View>
                  <Text style={[styles.themeOptionTitle, { color: '#FFFFFF' }]}>Pure Black</Text>
                  <Text style={[styles.themeOptionSub, { color: '#9CA3AF' }]}>Dark Mode</Text>
                  {isDark && (
                    <View style={[styles.themeSelectedCheck, { backgroundColor: '#25D366' }]}>
                      <AppIcon name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Hardware & Triage Preferences */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
                    <AppIcon name="settings-outline" size={18} color={tc.text} />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Hardware & Desk Preferences</Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>Auto-print, chime, and thermal POS printer</Text>
                  </View>
                </View>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingTextWrap}>
                  <Text style={[styles.settingTitle, { color: tc.text }]}>Auto-Print Token Slips</Text>
                  <Text style={[styles.settingDesc, { color: tc.textSecondary }]}>
                    Print thermal paper token immediately on walk-in check-in
                  </Text>
                </View>
                <Switch
                  value={autoPrintTokens}
                  onValueChange={setAutoPrintTokens}
                  trackColor={{ false: '#D1D5DB', true: colors.whatsapp.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.settingDivider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.settingRow}>
                <View style={styles.settingTextWrap}>
                  <Text style={[styles.settingTitle, { color: tc.text }]}>Audio Chime on Check-in</Text>
                  <Text style={[styles.settingDesc, { color: tc.textSecondary }]}>
                    Play acoustic chime on desk speakers for new arrivals
                  </Text>
                </View>
                <Switch
                  value={audioChimeEnabled}
                  onValueChange={setAudioChimeEnabled}
                  trackColor={{ false: '#D1D5DB', true: colors.whatsapp.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.settingDivider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.settingRow}>
                <View style={styles.settingTextWrap}>
                  <Text style={[styles.settingTitle, { color: tc.text }]}>Default Radiography Filter</Text>
                  <Text style={[styles.settingDesc, { color: tc.textSecondary }]}>
                    Auto-invert contrast for physical X-ray films
                  </Text>
                </View>
                <Switch
                  value={highContrastXray}
                  onValueChange={setHighContrastXray}
                  trackColor={{ false: '#D1D5DB', true: colors.whatsapp.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.settingDivider, { backgroundColor: tc.cardBorder }]} />

              {/* POS Printer Status */}
              <View style={[styles.printerStatusRow, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                <View style={styles.printerLeft}>
                  <AppIcon name="print-outline" size={20} color={colors.whatsapp.primary} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={[styles.printerName, { color: tc.text }]}>Epson TM-T88VI (Thermal POS)</Text>
                    <Text style={styles.printerStatus}>Connected via Bluetooth • Ready</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.printerTestBtn, { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF', borderColor: tc.cardBorder }]}
                  onPress={() => showToast('Printed test pattern on Epson POS 🖨️')}
                >
                  <Text style={[styles.printerTestText, { color: tc.text }]}>Test</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* App Security Preferences */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#EDE9FE' }]}>
                    <AppIcon name="shield-outline" size={18} color="#7C3AED" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Security & Notifications</Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>Biometrics and real-time doctor alerts</Text>
                  </View>
                </View>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingTextWrap}>
                  <Text style={[styles.settingTitle, { color: tc.text }]}>Biometric / Face ID Unlock</Text>
                  <Text style={[styles.settingDesc, { color: tc.textSecondary }]}>Instant unlock when resuming shift</Text>
                </View>
                <Switch
                  value={biometricUnlock}
                  onValueChange={setBiometricUnlock}
                  trackColor={{ false: '#D1D5DB', true: colors.whatsapp.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* App Version & Sign Out */}
            <View style={styles.footerSection}>
              <Text style={[styles.versionText, { color: tc.textSecondary }]}>Upstage Health for iOS • v2.4.0 (Build 2026.09)</Text>
              <Text style={[styles.versionSubtext, { color: tc.textTertiary }]}>Hospital ID: {selectedHospital.id} • Node: PROD-US-EAST</Text>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  Alert.alert(
                    'End Front Desk Shift',
                    'Are you sure you want to sign out of the reception desk?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Sign Out',
                        style: 'destructive',
                        onPress: () => {
                          showToast('Signed out of reception desk');
                          switchRole('patient');
                        },
                      },
                    ]
                  );
                }}
                activeOpacity={0.8}
              >
                <AppIcon name="log-out-outline" size={17} color="#DC2626" />
                <Text style={styles.logoutBtnText}>End Shift & Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================================
          MULTI-SELECT DOCTOR CHOOSER MODAL
      ======================================================== */}
      <Modal
        visible={showDoctorMultiModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDoctorMultiModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDoctorMultiModal(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={[styles.modalHandle, { backgroundColor: isDark ? '#3A3A3C' : '#E2E8F0' }]} />

            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalSheetTitle, { color: tc.text }]}>Assign Doctors to Assist</Text>
                <Text style={[styles.modalSheetSubtitle, { color: tc.textSecondary }]}>
                  Select multiple doctors to manage their patient queue simultaneously
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}
                onPress={() => setShowDoctorMultiModal(false)}
              >
                <AppIcon name="close" size={18} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {allDoctors.map((doctor) => {
                const isSelected = tempSelectedDoctorIds.includes(doctor.id);
                return (
                  <TouchableOpacity
                    key={doctor.id}
                    style={[
                      styles.doctorOptionCard,
                      { backgroundColor: isDark ? '#2C2C2E' : '#FAFAFA', borderColor: isSelected ? colors.whatsapp.primary : tc.cardBorder },
                      isSelected && { backgroundColor: isDark ? 'rgba(37, 211, 102, 0.12)' : 'rgba(18, 140, 126, 0.06)' },
                    ]}
                    onPress={() => handleToggleDoctorSelection(doctor.id)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: doctor.avatarUrl }} style={styles.docOptionAvatar} />

                    <View style={styles.docOptionInfo}>
                      <View style={styles.docOptionTitleRow}>
                        <Text style={[styles.docOptionName, { color: tc.text }, isSelected && { color: colors.whatsapp.primary }]}>
                          {doctor.name}
                        </Text>
                        <View style={[styles.docOptionRoomBadge, { backgroundColor: isDark ? '#3A3A3C' : '#F1F5F9' }]}>
                          <Text style={[styles.docOptionRoomText, { color: tc.text }]}>
                            {doctor.doctorProfile?.roomNumber || 'Room 101'}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.docOptionSpecialty, { color: tc.textSecondary }]}>
                        {doctor.doctorProfile?.specialty || 'General Medicine'} • Fee ₹{doctor.doctorProfile?.consultationFee || 800}
                      </Text>
                    </View>

                    {/* Checkbox circle */}
                    <View
                      style={[
                        styles.docRadioCircle,
                        isSelected && styles.docRadioCircleActive,
                      ]}
                    >
                      {isSelected && <AppIcon name="checkmark" size={13} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={handleSaveDoctorSelection}
            >
              <Text style={styles.modalCancelBtnText}>
                Save Assignment ({tempSelectedDoctorIds.length} Selected)
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Payslip Modal */}
      {selectedSlip && (
        <Modal
          visible={!!selectedSlip}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedSlip(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedSlip(null)}
          >
            <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <View style={[styles.modalHandle, { backgroundColor: isDark ? '#3A3A3C' : '#E2E8F0' }]} />

              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={[styles.modalSheetTitle, { color: tc.text }]}>Official Payslip Details</Text>
                  <Text style={[styles.modalSheetSubtitle, { color: tc.textSecondary }]}>Cycle: {selectedSlip.cyclePeriod}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}
                  onPress={() => setSelectedSlip(null)}
                >
                  <AppIcon name="close" size={18} color={tc.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.slipCard, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                <View style={styles.slipMetaRow}>
                  <Text style={[styles.slipMetaLabel, { color: tc.textSecondary }]}>Employee Name:</Text>
                  <Text style={[styles.slipMetaVal, { color: tc.text }]}>Kavitha Murugan ({recepProfile?.employeeId || 'EMP-RIO-2024-088'})</Text>
                </View>
                <View style={styles.slipMetaRow}>
                  <Text style={[styles.slipMetaLabel, { color: tc.textSecondary }]}>Disbursed Date:</Text>
                  <Text style={[styles.slipMetaVal, { color: tc.text }]}>{selectedSlip.disbursedDate}</Text>
                </View>

                <View style={[styles.slipDivider, { backgroundColor: tc.cardBorder }]} />

                <View style={styles.slipLine}>
                  <Text style={[styles.slipLineLabel, { color: tc.textSecondary }]}>Gross Salary:</Text>
                  <Text style={[styles.slipLineVal, { color: tc.text }]}>₹{selectedSlip.grossAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.slipLine}>
                  <Text style={[styles.slipLineLabel, { color: tc.textSecondary }]}>Deductions:</Text>
                  <Text style={[styles.slipLineVal, { color: '#DC2626' }]}>-₹{selectedSlip.deductions.toFixed(2)}</Text>
                </View>

                <View style={[styles.slipDivider, { backgroundColor: tc.cardBorder }]} />

                <View style={styles.slipLineTotal}>
                  <Text style={[styles.slipTotalLabel, { color: tc.text }]}>Net Paid:</Text>
                  <Text style={[styles.slipTotalVal, { color: isDark ? '#4ADE80' : colors.whatsapp.primaryDark }]}>
                    ₹{selectedSlip.netPaid.toFixed(2)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setSelectedSlip(null);
                  showToast(`Payslip for ${selectedSlip.cyclePeriod} downloaded (PDF) 📄`);
                }}
              >
                <Text style={styles.modalCancelBtnText}>Download PDF Payslip</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Report Preview Modal */}
      <Modal
        visible={showReportPreviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportPreviewModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReportPreviewModal(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={[styles.modalHandle, { backgroundColor: isDark ? '#3A3A3C' : '#E2E8F0' }]} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalSheetTitle, { color: tc.text }]}>Payroll Statement</Text>
                <Text style={[styles.modalSheetSubtitle, { color: tc.textSecondary }]}>
                  {reportFromDate} to {reportToDate} ({selectedFormat.toUpperCase()})
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}
                onPress={() => setShowReportPreviewModal(false)}
              >
                <AppIcon name="close" size={18} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.reportSummaryBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
              <View style={styles.reportSummaryRow}>
                <Text style={[styles.reportSummaryLabel, { color: tc.textSecondary }]}>Employee:</Text>
                <Text style={[styles.reportSummaryVal, { color: tc.text }]}>Kavitha Murugan</Text>
              </View>
              <View style={styles.reportSummaryRow}>
                <Text style={[styles.reportSummaryLabel, { color: tc.textSecondary }]}>Date Range:</Text>
                <Text style={[styles.reportSummaryVal, { color: tc.text }]}>{reportFromDate} – {reportToDate}</Text>
              </View>
              <View style={styles.reportSummaryRow}>
                <Text style={[styles.reportSummaryLabel, { color: tc.textSecondary }]}>Net Paid via NEFT:</Text>
                <Text style={[styles.reportSummaryVal, { color: '#16A34A', fontWeight: '800' }]}>₹59,200.00</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setShowReportPreviewModal(false);
                showToast(`Report exported (${selectedFormat.toUpperCase()})! 📥`);
              }}
            >
              <Text style={styles.modalCancelBtnText}>Download {selectedFormat.toUpperCase()} Statement</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Receptionist Profile Info Modal */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={[styles.modalHandle, { backgroundColor: isDark ? '#3A3A3C' : '#E2E8F0' }]} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalSheetTitle, { color: tc.text }]}>Edit Receptionist Profile</Text>
                <Text style={[styles.modalSheetSubtitle, { color: tc.textSecondary }]}>Update desk info, shift & verified contacts</Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}
                onPress={() => setShowEditProfileModal(false)}
              >
                <AppIcon name="close" size={18} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.editInputGroup}>
                <Text style={styles.editInputLabel}>FULL NAME</Text>
                <TextInput
                  style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Kavitha Murugan"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.editTwoCols}>
                <View style={[styles.editInputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.editInputLabel}>PHONE NUMBER</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="+91 94432 33445"
                    placeholderTextColor={tc.textTertiary}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={[styles.editInputGroup, { flex: 1 }]}>
                  <Text style={styles.editInputLabel}>WORK EMAIL</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="reception@rioscan.com"
                    placeholderTextColor={tc.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.editTwoCols}>
                <View style={[styles.editInputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.editInputLabel}>DESK NUMBER</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editDeskNumber}
                    onChangeText={setEditDeskNumber}
                    placeholder="Desk 1"
                    placeholderTextColor={tc.textTertiary}
                  />
                </View>

                <View style={[styles.editInputGroup, { flex: 1.2 }]}>
                  <Text style={styles.editInputLabel}>SHIFT</Text>
                  <View style={{ flexDirection: 'row', gap: 4, height: 42, alignItems: 'center' }}>
                    {(['morning', 'evening', 'night'] as const).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: tc.cardBorder, alignItems: 'center', justifyContent: 'center' },
                          editShift === s && { backgroundColor: colors.whatsapp.primary, borderColor: colors.whatsapp.primary },
                        ]}
                        onPress={() => setEditShift(s)}
                      >
                        <Text style={[{ fontSize: 10.5, color: tc.text }, editShift === s && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.editInputGroup}>
                <Text style={styles.editInputLabel}>RESIDENTIAL ADDRESS</Text>
                <TextInput
                  style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="Plot 42, NGO Colony, Palayamkottai, Tirunelveli"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.editTwoCols}>
                <View style={[styles.editInputGroup, { flex: 1.3, marginRight: 8 }]}>
                  <Text style={styles.editInputLabel}>EMERGENCY CONTACT</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editEmergencyContact}
                    onChangeText={setEditEmergencyContact}
                    placeholder="Murugan (Spouse) • +91 98421 99880"
                    placeholderTextColor={tc.textTertiary}
                  />
                </View>

                <View style={[styles.editInputGroup, { flex: 0.7 }]}>
                  <Text style={styles.editInputLabel}>BLOOD GROUP</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editBloodGroup}
                    onChangeText={setEditBloodGroup}
                    placeholder="B+"
                    placeholderTextColor={tc.textTertiary}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.editModalFooter}>
              <TouchableOpacity
                style={[styles.editCancelBtn, { borderColor: tc.cardBorder }]}
                onPress={() => setShowEditProfileModal(false)}
              >
                <Text style={[styles.editCancelBtnText, { color: tc.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.editSaveBtn} onPress={handleSaveProfile}>
                <Text style={styles.editSaveBtnText}>Save Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Picker Modal */}
      <PhotoPickerModal
        visible={showPhotoPicker}
        currentAvatarUrl={user?.avatarUrl}
        title="Update Receptionist Photo"
        onClose={() => setShowPhotoPicker(false)}
        onSelectAvatar={handleSaveAvatar}
      />
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
  },

  // Native iOS Segmented Control
  segmentedControlWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  iosSegmentContainer: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2.5,
  },
  iosSegmentPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  iosSegmentPillActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iosSegmentText: {
    fontSize: 13,
    fontWeight: '500',
  },
  iosSegmentTextActive: {
    fontWeight: '700',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 130, // Clearance for bottom bar
  },
  tabContentGroup: {
    gap: 14,
  },

  // Cards
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardHeaderTextWrap: {
    flex: 1,
  },
  cardHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.whatsapp.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  onlineText: {
    color: '#16A34A',
    fontSize: 10.5,
    fontWeight: '700',
  },
  profileRole: {
    fontSize: 11.5,
    marginTop: 2,
  },
  badgePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  empBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  empBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  deskBadge: {
    backgroundColor: 'rgba(18, 140, 126, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  deskBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.whatsapp.primaryDark,
  },

  // Multi-Doctor Stack
  manageDoctorsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 140, 126, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 3,
  },
  manageDoctorsBtnText: {
    color: colors.whatsapp.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  assignedDoctorsStack: {
    gap: 8,
  },
  doctorMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  docMiniAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  docMiniInfo: {
    flex: 1,
  },
  docMiniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  docMiniName: {
    fontSize: 14,
    fontWeight: '800',
  },
  roomTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  roomTagText: {
    color: '#0369A1',
    fontSize: 9.5,
    fontWeight: '700',
  },
  docMiniChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  microChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  microChipText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Personal Info Clean List
  cleanList: {
    gap: 8,
  },
  stackedBlock: {
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  fieldValueBold: {
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 17,
  },
  fieldSubhint: {
    fontSize: 10,
    marginTop: 2,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  gridCol: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },

  // 4-Box Grid
  fourBoxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  boxTile: {
    width: '48.5%',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  boxTileLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  boxTileValue: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 2,
  },
  boxTileHint: {
    fontSize: 9.5,
    marginTop: 1,
  },

  // Salary & Payroll Styling
  salaryHighlightBanner: {
    borderRadius: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    marginBottom: 10,
  },
  salaryLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  salaryAmount: {
    fontSize: 21,
    fontWeight: '800',
    marginTop: 2,
  },
  salaryCadence: {
    fontSize: 12,
    fontWeight: '500',
  },
  payCycleText: {
    fontSize: 10,
    marginTop: 2,
  },
  payStatusBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  payStatusText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  keyDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 12,
    paddingVertical: 9,
    borderWidth: 1,
    marginBottom: 10,
  },
  keyDateItem: {
    alignItems: 'center',
  },
  keyDateLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  keyDateValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  keyDateSeparator: {
    width: 1,
    height: 20,
  },
  bankAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  bankIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(18, 140, 126, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bankDetails: {
    flex: 1,
  },
  bankLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  bankName: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 1,
  },
  bankNumber: {
    fontSize: 10.5,
    marginTop: 1,
  },
  breakdownTable: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tableLabel: {
    fontSize: 11.5,
  },
  tableValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableDivider: {
    height: 1,
    marginVertical: 4,
  },
  tableRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 3,
  },
  tableTotalLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  tableTotalValue: {
    fontSize: 13.5,
    fontWeight: '800',
  },

  // KPI
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  kpiTile: {
    flex: 1,
    borderRadius: 10,
    padding: 9,
    alignItems: 'center',
    borderWidth: 1,
  },
  kpiNum: {
    fontSize: 15,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 9.5,
    marginTop: 2,
  },
  daysList: {
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
  },
  dayItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
  },
  dayItemLeft: {
    flex: 1,
  },
  dayItemDate: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayItemMeta: {
    fontSize: 10,
    marginTop: 1,
  },
  dayItemRight: {
    alignItems: 'flex-end',
  },
  dayItemAmount: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  dayItemIncentive: {
    fontSize: 9.5,
    color: '#16A34A',
    fontWeight: '600',
  },

  // History Table
  historyTable: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  thText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tdDate: {
    fontSize: 11,
    fontWeight: '700',
  },
  tdRef: {
    fontSize: 9,
    marginTop: 1,
  },
  tdPeriod: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  tdStatus: {
    fontSize: 9,
    color: '#047857',
    fontWeight: '700',
  },
  tdNet: {
    fontSize: 12,
    fontWeight: '800',
  },
  tdGross: {
    fontSize: 9,
  },
  viewSlipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 140, 126, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  viewSlipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.whatsapp.primary,
  },

  // Report Generator
  pickerSectionLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetChipActive: {
    backgroundColor: 'rgba(18, 140, 126, 0.12)',
    borderColor: colors.whatsapp.primary,
  },
  presetChipText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: colors.whatsapp.primaryDark,
    fontWeight: '700',
  },
  datePickerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateInputCol: {
    flex: 1,
  },
  dateFieldTitle: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 3,
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderWidth: 1,
    gap: 6,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    padding: 0,
  },
  dateArrowBox: {
    paddingTop: 14,
  },
  generateReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.whatsapp.primary,
    borderRadius: 12,
    paddingVertical: 11,
    gap: 6,
  },
  generateReportBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // App Theme Setting
  themeCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    position: 'relative',
  },
  themeOptionCardSelected: {
    borderWidth: 2,
  },
  themePreviewLight: {
    width: 60,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    padding: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewBarLight: {
    width: '100%',
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    marginBottom: 4,
  },
  previewBoxLight: {
    width: '60%',
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  themePreviewDark: {
    width: 60,
    height: 40,
    backgroundColor: '#000000',
    borderRadius: 6,
    padding: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  previewBarDark: {
    width: '100%',
    height: 6,
    backgroundColor: '#2C2C2E',
    borderRadius: 3,
    marginBottom: 4,
  },
  previewBoxDark: {
    width: '60%',
    height: 14,
    backgroundColor: '#2C2C2E',
    borderRadius: 3,
  },
  themeOptionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  themeOptionSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  themeSelectedCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.whatsapp.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 10.5,
    marginTop: 1,
  },
  settingDivider: {
    height: 1,
    marginVertical: 4,
  },
  printerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
  },
  printerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  printerName: {
    fontSize: 12,
    fontWeight: '700',
  },
  printerStatus: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '600',
  },
  printerTestBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  printerTestText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footerSection: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  versionSubtext: {
    fontSize: 9.5,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '82%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalSheetTitle: {
    fontSize: 16.5,
    fontWeight: '700',
  },
  modalSheetSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: {
    marginBottom: 14,
  },
  doctorOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  docOptionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  docOptionInfo: {
    flex: 1,
  },
  docOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  docOptionName: {
    fontSize: 14,
    fontWeight: '700',
  },
  docOptionRoomBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  docOptionRoomText: {
    fontSize: 10,
    fontWeight: '700',
  },
  docOptionSpecialty: {
    fontSize: 11,
    marginTop: 1,
  },
  docRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  docRadioCircleActive: {
    backgroundColor: colors.whatsapp.primary,
    borderColor: colors.whatsapp.primary,
  },
  modalCancelBtn: {
    backgroundColor: colors.whatsapp.primary,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  slipCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  slipMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  slipMetaLabel: {
    fontSize: 11.5,
  },
  slipMetaVal: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  slipDivider: {
    height: 1,
    marginVertical: 8,
  },
  slipLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  slipLineLabel: {
    fontSize: 12,
  },
  slipLineVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  slipLineTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slipTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  slipTotalVal: {
    fontSize: 15,
    fontWeight: '800',
  },

  reportSummaryBox: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
    gap: 6,
  },
  reportSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  reportSummaryLabel: {
    fontSize: 11.5,
  },
  reportSummaryVal: {
    fontSize: 12,
    fontWeight: '700',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  editProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  editProfileBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  changePhotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  changePhotoBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  modalScroll: {
    maxHeight: 380,
  },
  editInputGroup: {
    marginBottom: 12,
  },
  editInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  editTextInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  editTwoCols: {
    flexDirection: 'row',
  },
  editModalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editSaveBtn: {
    flex: 1.5,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: colors.whatsapp.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
