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
  Platform,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { useAppTheme } from '../../context/ThemeContext';
import { AppIcon } from '../../components/common/AppIcon';
import { PhotoPickerModal } from '../../components/profile/PhotoPickerModal';
import { DoctorDateAvailability, AvailabilityStatus } from '../../types';
import { DEFAULT_DOCTOR_SLOTS } from '../../services/dataStore';

type DoctorProfileTab = 'profile' | 'availability' | 'earnings' | 'settings';

interface DoctorSalaryRecord {
  id: string;
  disbursedDate: string;
  cyclePeriod: string;
  consultationsCount: number;
  grossAmount: number;
  deductions: number;
  netPaid: number;
  paymentMethod: string;
  referenceNumber: string;
}

interface DoctorDailyEarning {
  dayLabel: string;
  dateStr: string;
  consultations: number;
  hoursWorked: number;
  feeShare: number;
  baseRetainer: number;
  totalEarned: number;
}

export const DoctorProfileScreen: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const {
    selectedHospital,
    getDoctorAvailability,
    updateDoctorAvailability,
    getDoctorUpcomingAvailability,
    availabilityVersion,
  } = useHospital();
  const { theme, setTheme, toggleTheme, colors: tc, isDark } = useAppTheme();
  const doctorId = user?.id || 'usr_doc_jenkins';

  const [activeTab, setActiveTab] = useState<DoctorProfileTab>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Photo picker and profile editing state
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);

  const docProfile = user?.doctorProfile;
  const [editDocName, setEditDocName] = useState<string>(user?.name || 'Dr. Preetha Rajesh');
  const [editDocSpec, setEditDocSpec] = useState<string>(docProfile?.specialty || 'Senior Consultant Radiologist & Sonologist');
  const [editDocQual, setEditDocQual] = useState<string>(docProfile?.qualification || 'MBBS, MD (Radiology), FRCR (London), FICR');
  const [editDocRoom, setEditDocRoom] = useState<string>(docProfile?.roomNumber || 'Scan Room 1');
  const [editDocFee, setEditDocFee] = useState<string>(String(docProfile?.consultationFee || 800));
  const [editDocPhone, setEditDocPhone] = useState<string>(user?.phone || '+91 94431 22880');
  const [editDocEmail, setEditDocEmail] = useState<string>(user?.email || 'dr.preetha@rioscan.com');
  const [editDocReg, setEditDocReg] = useState<string>('TNMC-89421');
  const [editDocExp, setEditDocExp] = useState<string>(String(docProfile?.experienceYears || 15));
  const [editDocAbout, setEditDocAbout] = useState<string>(docProfile?.about || 'Senior Consultant Radiologist at Rio Scan Center specializing in Musculoskeletal MRI, Knee Pain Diagnostics, CT Arthrograms, and Ultrasound.');

  const handleOpenEditModal = () => {
    setEditDocName(user?.name || 'Dr. Preetha Rajesh');
    setEditDocSpec(user?.doctorProfile?.specialty || 'Senior Consultant Radiologist & Sonologist');
    setEditDocQual(user?.doctorProfile?.qualification || 'MBBS, MD (Radiology), FRCR (London), FICR');
    setEditDocRoom(user?.doctorProfile?.roomNumber || 'Scan Room 1');
    setEditDocFee(String(user?.doctorProfile?.consultationFee || 800));
    setEditDocPhone(user?.phone || '+91 94431 22880');
    setEditDocEmail(user?.email || 'dr.preetha@rioscan.com');
    setEditDocReg('TNMC-89421');
    setEditDocExp(String(user?.doctorProfile?.experienceYears || 15));
    setEditDocAbout(user?.doctorProfile?.about || '');
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    if (!editDocName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Name cannot be empty');
      } else {
        Alert.alert('Required', 'Please enter doctor full name.');
      }
      return;
    }

    updateProfile({
      name: editDocName.trim(),
      phone: editDocPhone.trim(),
      email: editDocEmail.trim(),
      doctorProfile: {
        avgConsultationMinutes: user?.doctorProfile?.avgConsultationMinutes ?? 15,
        availableDays: user?.doctorProfile?.availableDays ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timingStart: user?.doctorProfile?.timingStart ?? '09:00 AM',
        timingEnd: user?.doctorProfile?.timingEnd ?? '05:00 PM',
        maxTokensPerDay: user?.doctorProfile?.maxTokensPerDay ?? 40,
        rating: user?.doctorProfile?.rating ?? 4.97,
        ...user?.doctorProfile,
        specialty: editDocSpec.trim(),
        qualification: editDocQual.trim(),
        roomNumber: editDocRoom.trim(),
        consultationFee: Number(editDocFee) || 800,
        experienceYears: Number(editDocExp) || 15,
        about: editDocAbout.trim(),
      },
    });

    setShowEditProfileModal(false);
    showToast('Doctor professional profile updated successfully! ✓');
  };

  const handleSaveAvatar = (newUri: string) => {
    updateProfile({ avatarUrl: newUri });
    showToast('Doctor profile picture updated successfully! 📸');
  };

  // Availability editing state
  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedAvailDate, setSelectedAvailDate] = useState<string>(todayStr);

  // Active date form values
  const [availIsAvailable, setAvailIsAvailable] = useState<boolean>(true);
  const [availStatus, setAvailStatus] = useState<AvailabilityStatus>('available');
  const [availTimingStart, setAvailTimingStart] = useState('09:00 AM');
  const [availTimingEnd, setAvailTimingEnd] = useState('05:00 PM');
  const [availSlots, setAvailSlots] = useState<string[]>([...DEFAULT_DOCTOR_SLOTS]);
  const [availMaxTokens, setAvailMaxTokens] = useState<number>(40);
  const [availNote, setAvailNote] = useState<string>('');

  // Load availability for the selected date
  React.useEffect(() => {
    const cur = getDoctorAvailability(doctorId, selectedAvailDate);
    setAvailIsAvailable(cur.isAvailable);
    setAvailStatus(cur.status);
    setAvailTimingStart(cur.timingStart);
    setAvailTimingEnd(cur.timingEnd);
    setAvailSlots(cur.slots || []);
    setAvailMaxTokens(cur.maxTokens || 35);
    setAvailNote(cur.note || '');
  }, [selectedAvailDate, availabilityVersion]);

  // Upcoming 14 days availability list
  const upcomingAvailabilities = React.useMemo(() => {
    return getDoctorUpcomingAvailability(doctorId, 14);
  }, [getDoctorUpcomingAvailability, doctorId, availabilityVersion]);

  const handleSaveAvailability = () => {
    const updated: DoctorDateAvailability = {
      date: selectedAvailDate,
      isAvailable: availIsAvailable,
      status: availStatus,
      timingStart: availTimingStart,
      timingEnd: availTimingEnd,
      slots: availIsAvailable ? availSlots : [],
      maxTokens: availIsAvailable ? availMaxTokens : 0,
      note: availNote.trim() || (availIsAvailable ? 'Regular OPD Active' : 'Doctor on leave'),
    };
    updateDoctorAvailability(doctorId, updated);
    showToast(`✓ Live availability updated for ${selectedAvailDate}! Patient booking updated.`);
  };

  const handleToggleSlot = (slot: string) => {
    if (availSlots.includes(slot)) {
      setAvailSlots(availSlots.filter((s) => s !== slot));
    } else {
      setAvailSlots([...availSlots, slot].sort());
    }
  };

  const handleApplyShiftPreset = (shift: 'full' | 'morning' | 'evening') => {
    if (shift === 'full') {
      setAvailIsAvailable(true);
      setAvailStatus('available');
      setAvailTimingStart('09:00 AM');
      setAvailTimingEnd('05:00 PM');
      setAvailSlots([...DEFAULT_DOCTOR_SLOTS]);
      setAvailMaxTokens(40);
      setAvailNote('Full Day Regular Cardiology OPD');
    } else if (shift === 'morning') {
      setAvailIsAvailable(true);
      setAvailStatus('morning_only');
      setAvailTimingStart('09:00 AM');
      setAvailTimingEnd('01:00 PM');
      setAvailSlots(['09:30 AM', '10:15 AM', '11:00 AM', '11:45 AM']);
      setAvailMaxTokens(20);
      setAvailNote('Morning OPD only (Afternoon ICU Rounds)');
    } else if (shift === 'evening') {
      setAvailIsAvailable(true);
      setAvailStatus('evening_only');
      setAvailTimingStart('02:00 PM');
      setAvailTimingEnd('06:00 PM');
      setAvailSlots(['02:00 PM', '03:30 PM', '04:15 PM']);
      setAvailMaxTokens(20);
      setAvailNote('Evening OPD only (Morning Procedure Duty)');
    }
  };

  // Settings toggles
  const [tvChimeSync, setTvChimeSync] = useState(true);
  const [autoAdvanceQueue, setAutoAdvanceQueue] = useState(true);
  const [highResScans, setHighResScans] = useState(true);
  const [pushEmergencyAlerts, setPushEmergencyAlerts] = useState(true);
  const [biometricUnlock, setBiometricUnlock] = useState(true);

  // Report generator state
  const [reportFromDate, setReportFromDate] = useState('2026-08-01');
  const [reportToDate, setReportToDate] = useState('2026-09-26');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf');
  const [selectedPreset, setSelectedPreset] = useState('last30');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<DoctorSalaryRecord | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

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

  // Mock Data: Last 7 Days Doctor Consultations & Fee Share
  const last7DaysData: DoctorDailyEarning[] = [
    { dayLabel: 'Sat', dateStr: 'Today, Sep 26', consultations: 11, hoursWorked: 4.5, feeShare: 4400, baseRetainer: 2500, totalEarned: 6900 },
    { dayLabel: 'Fri', dateStr: 'Fri, Sep 25', consultations: 16, hoursWorked: 7.5, feeShare: 6400, baseRetainer: 2500, totalEarned: 8900 },
    { dayLabel: 'Thu', dateStr: 'Thu, Sep 24', consultations: 14, hoursWorked: 7.0, feeShare: 5600, baseRetainer: 2500, totalEarned: 8100 },
    { dayLabel: 'Wed', dateStr: 'Wed, Sep 23', consultations: 15, hoursWorked: 7.0, feeShare: 6000, baseRetainer: 2500, totalEarned: 8500 },
    { dayLabel: 'Tue', dateStr: 'Tue, Sep 22', consultations: 18, hoursWorked: 8.0, feeShare: 7200, baseRetainer: 2500, totalEarned: 9700 },
    { dayLabel: 'Mon', dateStr: 'Mon, Sep 21', consultations: 15, hoursWorked: 7.5, feeShare: 6000, baseRetainer: 2500, totalEarned: 8500 },
    { dayLabel: 'Sun', dateStr: 'Sun, Sep 20', consultations: 0, hoursWorked: 0, feeShare: 0, baseRetainer: 2500, totalEarned: 2500 },
  ];

  const total7DayConsults = last7DaysData.reduce((acc, d) => acc + d.consultations, 0);
  const total7DayHours = last7DaysData.reduce((acc, d) => acc + d.hoursWorked, 0);
  const total7DayEarnings = last7DaysData.reduce((acc, d) => acc + d.totalEarned, 0);

  // Historical Monthly Payout Records
  const historicalPayouts: DoctorSalaryRecord[] = [
    { id: 'doc_sal_09_2026', disbursedDate: '01 Sep 2026', cyclePeriod: 'Aug 01 – Aug 31, 2026', consultationsCount: 384, grossAmount: 228000, deductions: 18500, netPaid: 209500, paymentMethod: 'Direct Deposit (NEFT / SBI)', referenceNumber: 'NEFT-RIO-984210' },
    { id: 'doc_sal_08_2026', disbursedDate: '01 Aug 2026', cyclePeriod: 'Jul 01 – Jul 31, 2026', consultationsCount: 412, grossAmount: 239000, deductions: 19500, netPaid: 219500, paymentMethod: 'Direct Deposit (NEFT / SBI)', referenceNumber: 'NEFT-RIO-981105' },
    { id: 'doc_sal_07_2026', disbursedDate: '01 Jul 2026', cyclePeriod: 'Jun 01 – Jun 30, 2026', consultationsCount: 390, grossAmount: 225000, deductions: 18000, netPaid: 207000, paymentMethod: 'Direct Deposit (NEFT / SBI)', referenceNumber: 'NEFT-RIO-978841' },
    { id: 'doc_sal_06_2026', disbursedDate: '01 Jun 2026', cyclePeriod: 'May 01 – May 31, 2026', consultationsCount: 375, grossAmount: 218000, deductions: 17500, netPaid: 200500, paymentMethod: 'Direct Deposit (NEFT / SBI)', referenceNumber: 'NEFT-RIO-974221' },
  ];

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

      {/* Segmented Sub-Tabs: Profile | Availability | Earnings | Settings */}
      <View style={[styles.segmentedTabsRow, { backgroundColor: tc.background, borderBottomColor: tc.cardBorder }]}>
        {(['profile', 'availability', 'earnings', 'settings'] as DoctorProfileTab[]).map((tab) => {
          const isActive = activeTab === tab;
          const tabLabels: Record<DoctorProfileTab, string> = {
            profile: 'Profile',
            availability: 'Availability',
            earnings: 'Earnings',
            settings: 'Settings',
          };
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.segmentedTab,
                { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' },
                isActive && styles.segmentedTabActive,
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentedTabText,
                  { color: isDark ? '#9CA3AF' : '#475569' },
                  isActive && styles.segmentedTabTextActive,
                ]}
                numberOfLines={1}
              >
                {tabLabels[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ========================================================
            TAB 1: DOCTOR PROFESSIONAL PROFILE & CREDENTIALS
        ======================================================== */}
        {activeTab === 'profile' && (
          <View style={styles.tabContentWrap}>
            {/* Doctor Hero Card */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.heroRow}>
                <View style={styles.avatarWrap}>
                  {user?.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatarImageCircle} />
                  ) : (
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {(user?.name || 'PR').split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.avatarEditBtn}
                    onPress={() => setShowPhotoPicker(true)}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="camera-outline" size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.heroInfo}>
                  <Text style={[styles.heroName, { color: tc.text }]}>{user?.name || 'Dr. Preetha Rajesh'}</Text>
                  <Text style={styles.heroSpec}>{user?.doctorProfile?.specialty || 'Senior Consultant Radiologist & Sonologist'}</Text>
                  <Text style={[styles.heroSub, { color: tc.textSecondary }]}>
                    {user?.doctorProfile?.roomNumber || 'Scan Room 1'} • {selectedHospital.name}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingText}>⭐ {user?.doctorProfile?.rating || 4.97}</Text>
                    <Text style={[styles.reviewsCount, { color: tc.textSecondary }]}>• 312 Patient Reviews</Text>
                  </View>
                </View>
              </View>

              {/* Direct Clickable Phone & Contact Strip */}
              <View style={[styles.contactStrip, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => handleDirectCall(user?.phone || '+91 94431 22880', user?.name || 'Dr. Preetha Rajesh')}
                >
                  <AppIcon name="call" size={14} color="#16A34A" />
                  <Text style={styles.contactItemText}>{user?.phone || '+91 94431 22880'}</Text>
                </TouchableOpacity>

                <View style={styles.contactDivider} />

                <View style={styles.contactItem}>
                  <AppIcon name="mail-outline" size={14} color={tc.primary} />
                  <Text style={[styles.contactItemText, { color: tc.text }]} numberOfLines={1}>
                    {user?.email || 'dr.preetha@rioscan.com'}
                  </Text>
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

            {/* Medical Credentials & Hospital Details */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: tc.text }]}>Medical Credentials & Affiliation</Text>

              <View style={styles.infoGrid}>
                <View style={[styles.infoTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.infoLabel}>QUALIFICATIONS</Text>
                  <Text style={[styles.infoVal, { color: tc.text }]}>MBBS, MD (Radiology), FRCR (London), FICR</Text>
                </View>

                <View style={[styles.infoTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.infoLabel}>MEDICAL REGISTRATION #</Text>
                  <Text style={[styles.infoVal, { color: tc.text }]}>TNMC-89421 • Valid through 2030</Text>
                </View>

                <View style={[styles.infoTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.infoLabel}>EXPERIENCE</Text>
                  <Text style={[styles.infoVal, { color: tc.text }]}>14+ Years Clinical & Diagnostic Imaging Practice</Text>
                </View>

                <View style={[styles.infoTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.infoLabel}>PRIMARY HOSPITAL</Text>
                  <Text style={[styles.infoVal, { color: tc.text }]}>{selectedHospital.name}</Text>
                  <Text style={styles.infoSubText}>Radiology & USG Dept • Ground Floor, Scan Room 1</Text>
                </View>
              </View>
            </View>

            {/* OPD Consultation Schedule & Slot Rules */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: tc.text }]}>OPD Consultation Parameters</Text>

              <View style={styles.parametersRow}>
                <View style={[styles.paramBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.paramLabel}>CONSULT FEE</Text>
                  <Text style={[styles.paramVal, { color: colors.whatsapp.primary }]}>₹800.00</Text>
                  <Text style={styles.paramSub}>Per Patient</Text>
                </View>

                <View style={[styles.paramBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.paramLabel}>AVG TIME</Text>
                  <Text style={[styles.paramVal, { color: tc.text }]}>15 Min</Text>
                  <Text style={styles.paramSub}>Target Slot</Text>
                </View>

                <View style={[styles.paramBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.paramLabel}>MAX TOKENS</Text>
                  <Text style={[styles.paramVal, { color: tc.text }]}>35</Text>
                  <Text style={styles.paramSub}>Daily Cap</Text>
                </View>
              </View>

              <View style={[styles.scheduleStrip, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC' }]}>
                <Text style={styles.scheduleDaysText}>🗓️ Available Days: Mon, Tue, Wed, Thu, Fri, Sat</Text>
                <Text style={styles.scheduleHoursText}>⏰ Clinic Hours: 09:00 AM – 05:00 PM (Lunch 1–2 PM)</Text>
              </View>

              <TouchableOpacity
                style={[styles.manageAvailabilityQuickBtn, { backgroundColor: colors.whatsapp.primary }]}
                onPress={() => setActiveTab('availability')}
                activeOpacity={0.7}
              >
                <AppIcon name="calendar-outline" size={16} color="#FFFFFF" />
                <Text style={styles.manageAvailabilityQuickBtnText}>
                  Edit Date-wise Availability & Active Slots ➔
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================
            TAB: DATE-WISE AVAILABILITY & ACTIVE SLOTS MANAGER
        ======================================================== */}
        {activeTab === 'availability' && (
          <View style={styles.tabContentWrap}>
            {/* Header info */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.availHeaderTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.availMainTitle, { color: tc.text }]}>
                    Date-wise Availability Manager
                  </Text>
                  <Text style={[styles.availMainSub, { color: tc.textSecondary }]}>
                    Set which days and times you are open for patient bookings.
                  </Text>
                </View>
                <View style={styles.syncBadge}>
                  <Text style={styles.syncBadgeText}>● LIVE SYNC</Text>
                </View>
              </View>

              {/* 14-Day Calendar Strip */}
              <Text style={[styles.availSectionMiniLabel, { color: tc.textSecondary }]}>
                SELECT DATE TO EDIT (NEXT 14 DAYS)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.availDateStrip}>
                {upcomingAvailabilities.map((dayItem) => {
                  const isSelected = selectedAvailDate === dayItem.date;
                  const dObj = new Date(`${dayItem.date}T12:00:00`);
                  const dayName = dObj.toLocaleDateString(undefined, { weekday: 'short' });
                  const dayNum = dObj.getDate();
                  const monthName = dObj.toLocaleDateString(undefined, { month: 'short' });
                  const isToday = dayItem.date === todayStr;

                  return (
                    <TouchableOpacity
                      key={dayItem.date}
                      style={[
                        styles.availDatePill,
                        { backgroundColor: isDark ? '#27272A' : '#F8FAFC', borderColor: tc.cardBorder },
                        isSelected && {
                          borderColor: colors.whatsapp.primary,
                          backgroundColor: isDark ? '#1C2E24' : '#F0FDF4',
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => setSelectedAvailDate(dayItem.date)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.availDayName, { color: isSelected ? colors.whatsapp.primary : tc.textSecondary }]}>
                        {isToday ? 'Today' : dayName}
                      </Text>
                      <Text style={[styles.availDayNum, { color: tc.text }]}>{dayNum}</Text>
                      <Text style={[styles.availMonthText, { color: tc.textSecondary }]}>{monthName}</Text>

                      {/* Status indicator dot */}
                      <View style={styles.statusDotRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: !dayItem.isAvailable
                                ? '#EF4444'
                                : dayItem.status === 'morning_only'
                                ? '#F59E0B'
                                : dayItem.status === 'evening_only'
                                ? '#3B82F6'
                                : '#10B981',
                            },
                          ]}
                        />
                        <Text style={[styles.statusMiniText, { color: tc.textSecondary }]}>
                          {!dayItem.isAvailable
                            ? 'Off'
                            : dayItem.status === 'morning_only'
                            ? 'Morn'
                            : dayItem.status === 'evening_only'
                            ? 'Eve'
                            : 'Open'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Selected Date Detail & Editor Card */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              {/* Selected date header */}
              <View style={styles.selectedDateTitleRow}>
                <View>
                  <Text style={[styles.selectedDateTitle, { color: tc.text }]}>
                    {new Date(`${selectedAvailDate}T12:00:00`).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={[styles.selectedDateSub, { color: tc.textSecondary }]}>
                    {selectedAvailDate === todayStr ? 'Today • Scan Room 1' : 'Upcoming OPD Date'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.currentStatusBadge,
                    {
                      backgroundColor: !availIsAvailable
                        ? 'rgba(239, 68, 68, 0.15)'
                        : availStatus === 'morning_only'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currentStatusBadgeText,
                      {
                        color: !availIsAvailable
                          ? '#EF4444'
                          : availStatus === 'morning_only'
                          ? '#D97706'
                          : '#059669',
                      },
                    ]}
                  >
                    {!availIsAvailable ? '🔴 On Leave / Off' : '🟢 Open for Booking'}
                  </Text>
                </View>
              </View>

              {/* Toggle Availability Switch */}
              <View style={[styles.switchCardRow, { backgroundColor: isDark ? '#27272A' : '#F8FAFC' }]}>
                <View style={styles.switchInfoCol}>
                  <Text style={[styles.switchTitle, { color: tc.text }]}>Available for Consultations</Text>
                  <Text style={[styles.switchDesc, { color: tc.textSecondary }]}>
                    Allow patients to view and book appointments on this date
                  </Text>
                </View>
                <Switch
                  value={availIsAvailable}
                  onValueChange={(val) => {
                    setAvailIsAvailable(val);
                    if (!val) {
                      setAvailStatus('on_leave');
                      if (!availNote) setAvailNote('Attending Cardiology Seminar / Off-duty');
                    } else {
                      setAvailStatus('available');
                      if (availSlots.length === 0) setAvailSlots([...DEFAULT_DOCTOR_SLOTS]);
                    }
                  }}
                  trackColor={{ false: '#767577', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {availIsAvailable ? (
                <>
                  {/* Shift Presets */}
                  <Text style={[styles.inputSectionLabel, { color: tc.textSecondary }]}>
                    SELECT SHIFT & TIMING
                  </Text>
                  <View style={styles.shiftPillsRow}>
                    <TouchableOpacity
                      style={[
                        styles.shiftPresetPill,
                        availStatus === 'available' && {
                          backgroundColor: colors.whatsapp.primary,
                          borderColor: colors.whatsapp.primary,
                        },
                      ]}
                      onPress={() => handleApplyShiftPreset('full')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.shiftPresetText,
                          availStatus === 'available' && styles.shiftPresetTextActive,
                        ]}
                      >
                        Full Day (9am–5pm)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.shiftPresetPill,
                        availStatus === 'morning_only' && {
                          backgroundColor: colors.whatsapp.primary,
                          borderColor: colors.whatsapp.primary,
                        },
                      ]}
                      onPress={() => handleApplyShiftPreset('morning')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.shiftPresetText,
                          availStatus === 'morning_only' && styles.shiftPresetTextActive,
                        ]}
                      >
                        Morning (9am–1pm)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.shiftPresetPill,
                        availStatus === 'evening_only' && {
                          backgroundColor: colors.whatsapp.primary,
                          borderColor: colors.whatsapp.primary,
                        },
                      ]}
                      onPress={() => handleApplyShiftPreset('evening')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.shiftPresetText,
                          availStatus === 'evening_only' && styles.shiftPresetTextActive,
                        ]}
                      >
                        Evening (2pm–6pm)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Active Slots Selector */}
                  <View style={styles.slotsHeaderRow}>
                    <Text style={[styles.inputSectionLabel, { color: tc.textSecondary, marginBottom: 0 }]}>
                      ACTIVE TIME SLOTS (TAP TO TOGGLE)
                    </Text>
                    <Text style={styles.slotsCountBadge}>
                      {availSlots.length} Slots Enabled
                    </Text>
                  </View>

                  <View style={styles.slotsSelectorGrid}>
                    {DEFAULT_DOCTOR_SLOTS.map((slot) => {
                      const isEnabled = availSlots.includes(slot);
                      return (
                        <TouchableOpacity
                          key={slot}
                          style={[
                            styles.slotToggleChip,
                            { backgroundColor: isDark ? '#27272A' : '#F1F5F9' },
                            isEnabled && {
                              backgroundColor: colors.whatsapp.primary,
                              borderColor: colors.whatsapp.primary,
                            },
                          ]}
                          onPress={() => handleToggleSlot(slot)}
                          activeOpacity={0.7}
                        >
                          <AppIcon
                            name={isEnabled ? 'checkmark-circle' : 'close-circle'}
                            size={14}
                            color={isEnabled ? '#FFFFFF' : '#94A3B8'}
                          />
                          <Text
                            style={[
                              styles.slotToggleChipText,
                              { color: isEnabled ? '#FFFFFF' : tc.textSecondary },
                            ]}
                          >
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Patient Token Cap */}
                  <View style={styles.tokenCapRow}>
                    <View style={styles.tokenCapInfo}>
                      <Text style={[styles.tokenCapTitle, { color: tc.text }]}>Maximum Patient Tokens</Text>
                      <Text style={[styles.tokenCapSub, { color: tc.textSecondary }]}>
                        Daily cap before booking slots automatically close
                      </Text>
                    </View>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setAvailMaxTokens(Math.max(10, availMaxTokens - 5))}
                      >
                        <Text style={styles.stepperBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={[styles.stepperValueText, { color: tc.text }]}>{availMaxTokens}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setAvailMaxTokens(availMaxTokens + 5)}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Doctor's note for patients */}
                  <View style={styles.noteInputSection}>
                    <Text style={[styles.inputSectionLabel, { color: tc.textSecondary }]}>
                      PATIENT NOTICE / OPD NOTE (OPTIONAL)
                    </Text>
                    <TextInput
                      style={[styles.availNoteInput, { color: tc.text, borderColor: tc.cardBorder, backgroundColor: isDark ? '#27272A' : '#F8FAFC' }]}
                      placeholder="e.g. Regular OPD. Walk-ins accommodated between 4:00 - 5:00 PM."
                      placeholderTextColor={tc.textSecondary}
                      value={availNote}
                      onChangeText={setAvailNote}
                    />
                  </View>
                </>
              ) : (
                /* Unavailable / Leave reason configuration */
                <View style={styles.leaveSection}>
                  <Text style={[styles.inputSectionLabel, { color: tc.textSecondary }]}>
                    REASON FOR ABSENCE (DISPLAYED TO PATIENTS)
                  </Text>

                  {/* Quick Reason Presets */}
                  <View style={styles.leavePresetsRow}>
                    {['Medical Conference', 'Annual Vacation', 'ICU Emergency Duty', 'Personal Leave'].map(
                      (preset) => (
                        <TouchableOpacity
                          key={preset}
                          style={[
                            styles.leavePresetChip,
                            availNote === preset && {
                              backgroundColor: '#EF4444',
                              borderColor: '#EF4444',
                            },
                          ]}
                          onPress={() => setAvailNote(preset)}
                        >
                          <Text
                            style={[
                              styles.leavePresetChipText,
                              availNote === preset && { color: '#FFFFFF', fontWeight: '700' },
                            ]}
                          >
                            {preset}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>

                  <TextInput
                    style={[styles.availNoteInput, { color: tc.text, borderColor: tc.cardBorder, backgroundColor: isDark ? '#27272A' : '#F8FAFC' }]}
                    placeholder="e.g. Attending Cardiology Summit in Chicago"
                    placeholderTextColor={tc.textSecondary}
                    value={availNote}
                    onChangeText={setAvailNote}
                  />

                  <View style={[styles.leavePreviewNotice, { backgroundColor: isDark ? '#2A1818' : '#FEF2F2' }]}>
                    <AppIcon name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.leavePreviewNoticeText}>
                      When patients select this date on the booking screen, they will see that you are
                      unavailable: "{availNote || 'Doctor on leave'}" and won't be able to book slots.
                    </Text>
                  </View>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveAvailBtn, { backgroundColor: colors.whatsapp.primary }]}
                onPress={handleSaveAvailability}
                activeOpacity={0.7}
              >
                <AppIcon name="checkmark-circle" size={17} color="#FFFFFF" />
                <Text style={styles.saveAvailBtnText}>
                  Save & Update Patient Booking Schedule
                </Text>
              </TouchableOpacity>
            </View>

            {/* Upcoming 7-Day Overview Summary */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: tc.text }]}>7-Day Schedule Overview</Text>
              <Text style={[styles.sectionSub, { color: tc.textSecondary }]}>
                Live availability status as shown to patients in the Upstage Health app
              </Text>

              <View style={styles.overviewList}>
                {upcomingAvailabilities.slice(0, 7).map((item) => {
                  const dObj = new Date(`${item.date}T12:00:00`);
                  const dateText = dObj.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <View
                      key={item.date}
                      style={[
                        styles.overviewRow,
                        { borderBottomColor: tc.cardBorder },
                        item.date === selectedAvailDate && {
                          backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                        },
                      ]}
                    >
                      <View style={styles.overviewLeftCol}>
                        <Text style={[styles.overviewDateText, { color: tc.text }]}>{dateText}</Text>
                        <Text style={[styles.overviewSlotsCount, { color: tc.textSecondary }]}>
                          {item.isAvailable
                            ? `${item.slots.length} Slots (${item.timingStart} - ${item.timingEnd})`
                            : item.note || 'Closed'}
                        </Text>
                      </View>
                      <View style={styles.overviewRightCol}>
                        <View
                          style={[
                            styles.overviewBadge,
                            {
                              backgroundColor: !item.isAvailable
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(16, 185, 129, 0.15)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.overviewBadgeText,
                              { color: !item.isAvailable ? '#EF4444' : '#059669' },
                            ]}
                          >
                            {!item.isAvailable ? 'Unavailable' : 'Available'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.editDateBtn}
                          onPress={() => setSelectedAvailDate(item.date)}
                        >
                          <Text style={styles.editDateBtnText}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ========================================================
            TAB 2: EARNINGS, SALARY BREAKDOWN & REPORT GENERATOR
        ======================================================== */}
        {activeTab === 'earnings' && (
          <View style={styles.tabContentWrap}>
            {/* Compensation Overview KPI Cards */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1C1C1E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                <Text style={styles.kpiCardLabel}>MONTHLY RETAINER</Text>
                <Text style={[styles.kpiCardValue, { color: tc.text }]}>₹1,45,000.00</Text>
                <Text style={styles.kpiCardSub}>Base Fixed Salary</Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1C1C1E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                <Text style={styles.kpiCardLabel}>TODAY'S FEE SHARE</Text>
                <Text style={[styles.kpiCardValue, { color: '#16A34A' }]}>+₹4,400.00</Text>
                <Text style={styles.kpiCardSub}>11 Consults Cleared</Text>
              </View>
            </View>

            {/* Last 7 Days Daily Compensation Breakdown */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.sectionTitle, { color: tc.text }]}>Last 7 Days Earnings Breakdown</Text>
                  <Text style={[styles.sectionSub, { color: tc.textSecondary }]}>
                    {total7DayConsults} Consultations • {total7DayHours.toFixed(1)} Clinic Hours
                  </Text>
                </View>
                <View style={styles.earningsTotalPill}>
                  <Text style={styles.earningsTotalPillText}>₹{total7DayEarnings.toLocaleString('en-IN')}.00</Text>
                </View>
              </View>

              {/* Table of Daily Earnings */}
              <View style={styles.dailyEarningsList}>
                {last7DaysData.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dailyEarningRow,
                      { borderBottomColor: tc.cardBorder },
                      idx === 0 && { backgroundColor: isDark ? '#2C2C2E' : '#F0FDF4' },
                    ]}
                  >
                    <View style={styles.dayCol}>
                      <Text style={[styles.dayLabelText, { color: tc.text }]}>{item.dayLabel}</Text>
                      <Text style={[styles.dateSubText, { color: tc.textSecondary }]}>{item.dateStr}</Text>
                    </View>

                    <View style={styles.statsCol}>
                      <Text style={[styles.consultCountText, { color: tc.text }]}>
                        {item.consultations} Consults
                      </Text>
                      <Text style={[styles.hoursText, { color: tc.textSecondary }]}>{item.hoursWorked} hrs</Text>
                    </View>

                    <View style={styles.earnedCol}>
                      <Text style={[styles.earnedAmountText, { color: '#16A34A' }]}>
                        ₹{item.totalEarned.toLocaleString('en-IN')}.00
                      </Text>
                      <Text style={styles.shareSplitText}>(₹{item.feeShare} fee + ₹{item.baseRetainer})</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Date-Wise Historical Monthly Payouts */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: tc.text }]}>Historical Monthly Payouts</Text>
              <Text style={[styles.sectionSub, { color: tc.textSecondary, marginBottom: 12 }]}>
                Official disbursed compensation slips and NEFT settlements
              </Text>

              <View style={styles.payoutsList}>
                {historicalPayouts.map((record) => (
                  <TouchableOpacity
                    key={record.id}
                    style={[styles.payoutCard, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}
                    onPress={() => setSelectedPayslip(record)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.payoutCardTop}>
                      <View>
                        <Text style={[styles.payoutPeriodText, { color: tc.text }]}>{record.cyclePeriod}</Text>
                        <Text style={[styles.payoutDisbursedDate, { color: tc.textSecondary }]}>
                          Disbursed on {record.disbursedDate}
                        </Text>
                      </View>
                      <View style={styles.payoutAmountCol}>
                        <Text style={[styles.payoutAmountText, { color: '#16A34A' }]}>
                          ₹{record.netPaid.toLocaleString('en-IN')}.00
                        </Text>
                        <Text style={styles.payoutRefText}>{record.referenceNumber}</Text>
                      </View>
                    </View>

                    <View style={styles.payoutCardBottom}>
                      <Text style={styles.payoutConsultsCount}>
                        🏥 {record.consultationsCount} Consultations Billed
                      </Text>
                      <Text style={styles.viewSlipText}>View Details ➔</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Compensation Report Generator */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: tc.text }]}>Generate Earnings Report</Text>
              <Text style={[styles.sectionSub, { color: tc.textSecondary, marginBottom: 12 }]}>
                Export certified statement for tax, clinic accounting or audit
              </Text>

              {/* Date Presets */}
              <View style={styles.presetChipsRow}>
                {[
                  { id: 'last7', label: 'Last 7 Days' },
                  { id: 'last30', label: 'Last 30 Days' },
                  { id: 'thisMonth', label: 'This Month' },
                  { id: 'quarter', label: 'Q3 2026' },
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetChip,
                      { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' },
                      selectedPreset === preset.id && styles.presetChipActive,
                    ]}
                    onPress={() => setSelectedPreset(preset.id)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: isDark ? '#9CA3AF' : '#475569' },
                        selectedPreset === preset.id && styles.presetChipTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* From / To Date Inputs */}
              <View style={styles.dateInputsRow}>
                <View style={styles.dateInputWrap}>
                  <Text style={styles.dateInputLabel}>FROM DATE</Text>
                  <TextInput
                    style={[styles.dateInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={reportFromDate}
                    onChangeText={setReportFromDate}
                  />
                </View>
                <View style={styles.dateInputWrap}>
                  <Text style={styles.dateInputLabel}>TO DATE</Text>
                  <TextInput
                    style={[styles.dateInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={reportToDate}
                    onChangeText={setReportToDate}
                  />
                </View>
              </View>

              {/* Format Selector & Generate Button */}
              <View style={styles.formatRow}>
                <TouchableOpacity
                  style={[styles.formatBtn, selectedFormat === 'pdf' && styles.formatBtnActive]}
                  onPress={() => setSelectedFormat('pdf')}
                >
                  <Text style={[styles.formatBtnText, selectedFormat === 'pdf' && styles.formatBtnTextActive]}>
                    📄 PDF Statement
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formatBtn, selectedFormat === 'csv' && styles.formatBtnActive]}
                  onPress={() => setSelectedFormat('csv')}
                >
                  <Text style={[styles.formatBtnText, selectedFormat === 'csv' && styles.formatBtnTextActive]}>
                    📊 CSV Spreadsheet
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.generateReportBtn}
                onPress={() => setShowReportModal(true)}
                activeOpacity={0.85}
              >
                <AppIcon name="print-outline" size={16} color="#FFFFFF" />
                <Text style={styles.generateReportBtnText}>Generate & Download Statement</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================
            TAB 3: APP SETTINGS & THEME CUSTOMIZATION
        ======================================================== */}
        {activeTab === 'settings' && (
          <View style={styles.tabContentWrap}>
            {/* Theme Customization Card */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: tc.text }]}>Appearance & Theme</Text>
              <Text style={[styles.sectionSub, { color: tc.textSecondary, marginBottom: 12 }]}>
                Switch between crisp plain white and pure dark mode
              </Text>

              <View style={styles.themeSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.themeOptionBtn,
                    { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder },
                    !isDark && styles.themeOptionBtnActive,
                  ]}
                  onPress={() => setTheme('light')}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>☀️</Text>
                  <Text style={[styles.themeOptionTitle, { color: tc.text }]}>Plain White</Text>
                  <Text style={styles.themeOptionSub}>Light Mode</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeOptionBtn,
                    { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder },
                    isDark && styles.themeOptionBtnActive,
                  ]}
                  onPress={() => setTheme('dark')}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>🌙</Text>
                  <Text style={[styles.themeOptionTitle, { color: tc.text }]}>Pure Black</Text>
                  <Text style={styles.themeOptionSub}>Dark Mode</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Clinic & OPD Operational Settings */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: tc.text }]}>OPD Clinic Operations</Text>

              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: tc.text }]}>TV Monitor Chime Sync</Text>
                  <Text style={[styles.settingSub, { color: tc.textSecondary }]}>
                    Sound audio chime outside Scan Room 1 on calling next token
                  </Text>
                </View>
                <Switch
                  value={tvChimeSync}
                  onValueChange={setTvChimeSync}
                  trackColor={{ false: '#CBD5E1', true: colors.whatsapp.primary }}
                />
              </View>

              <View style={[styles.settingDivider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: tc.text }]}>Auto-Advance Live Queue</Text>
                  <Text style={[styles.settingSub, { color: tc.textSecondary }]}>
                    Automatically queue next token when consultation completes
                  </Text>
                </View>
                <Switch
                  value={autoAdvanceQueue}
                  onValueChange={setAutoAdvanceQueue}
                  trackColor={{ false: '#CBD5E1', true: colors.whatsapp.primary }}
                />
              </View>

              <View style={[styles.settingDivider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: tc.text }]}>High-Contrast X-Ray Rendering</Text>
                  <Text style={[styles.settingSub, { color: tc.textSecondary }]}>
                    Enhance radiography image contrast by default in viewer
                  </Text>
                </View>
                <Switch
                  value={highResScans}
                  onValueChange={setHighResScans}
                  trackColor={{ false: '#CBD5E1', true: colors.whatsapp.primary }}
                />
              </View>

              <View style={[styles.settingDivider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: tc.text }]}>Emergency Walk-in Alerts</Text>
                  <Text style={[styles.settingSub, { color: tc.textSecondary }]}>
                    High-priority notification for acute cardiac triage
                  </Text>
                </View>
                <Switch
                  value={pushEmergencyAlerts}
                  onValueChange={setPushEmergencyAlerts}
                  trackColor={{ false: '#CBD5E1', true: colors.whatsapp.primary }}
                />
              </View>
            </View>

            {/* App Version & Clinic Info */}
            <View style={styles.appInfoBox}>
              <Text style={styles.appInfoText}>Upstage Health for Doctors • v2.4.0 (Build 904)</Text>
              <Text style={styles.appInfoSub}>Connected to Scan Room 1 Broadcast Server • Latency 14ms</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Generated Report Statement Preview Modal */}
      <Modal visible={showReportModal} transparent animationType="fade" onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: tc.text }]}>Doctor Statement Preview</Text>
                <Text style={styles.modalSub}>Statement Period: {reportFromDate} to {reportToDate}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReportModal(false)} style={styles.closeBtn}>
                <AppIcon name="close" size={16} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.reportPreviewBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC' }]}>
              <Text style={[styles.reportPreviewTitle, { color: tc.text }]}>RIO SCAN CENTER CLINICAL COMPENSATION</Text>
              <Text style={styles.reportPreviewDoctor}>Doctor: Dr. Preetha Rajesh, MD • Scan Room 1</Text>
              <Text style={styles.reportPreviewMeta}>Total Consultations: {total7DayConsults} Billed</Text>
              <Text style={styles.reportPreviewAmount}>Net Statement Total: ₹{total7DayEarnings.toLocaleString('en-IN')}.00</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setShowReportModal(false);
                  showToast(`Report downloaded successfully in ${selectedFormat.toUpperCase()}!`);
                }}
              >
                <AppIcon name="print-outline" size={16} color="#FFFFFF" />
                <Text style={styles.modalPrimaryBtnText}>Download {selectedFormat.toUpperCase()} File</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payout Slip Inspection Modal */}
      <Modal visible={!!selectedPayslip} transparent animationType="fade" onRequestClose={() => setSelectedPayslip(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: tc.text }]}>Disbursement Details</Text>
                <Text style={styles.modalSub}>{selectedPayslip?.cyclePeriod}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPayslip(null)} style={styles.closeBtn}>
                <AppIcon name="close" size={16} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.payslipDetailBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC' }]}>
              <View style={styles.payslipRow}>
                <Text style={styles.payslipRowLabel}>Gross Compensation</Text>
                <Text style={[styles.payslipRowVal, { color: tc.text }]}>₹{selectedPayslip?.grossAmount.toLocaleString('en-IN')}.00</Text>
              </View>
              <View style={styles.payslipRow}>
                <Text style={styles.payslipRowLabel}>Taxes & Deductions</Text>
                <Text style={[styles.payslipRowVal, { color: '#DC2626' }]}>-₹{selectedPayslip?.deductions.toLocaleString('en-IN')}.00</Text>
              </View>
              <View style={styles.payslipDivider} />
              <View style={styles.payslipRow}>
                <Text style={[styles.payslipTotalLabel, { color: tc.text }]}>Net Disbursed:</Text>
                <Text style={styles.payslipTotalVal}>₹{selectedPayslip?.netPaid.toLocaleString('en-IN')}.00</Text>
              </View>
              <View style={styles.payslipRow}>
                <Text style={styles.payslipRowLabel}>Disbursement Ref</Text>
                <Text style={[styles.payslipRowVal, { color: tc.textSecondary }]}>{selectedPayslip?.referenceNumber}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setSelectedPayslip(null)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Doctor Profile Info Modal */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalSheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={[styles.modalHandle, { backgroundColor: isDark ? '#3A3A3C' : '#E2E8F0' }]} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.editModalTitle, { color: tc.text }]}>Edit Doctor Profile</Text>
                <Text style={[styles.editModalSubtitle, { color: tc.textSecondary }]}>Clinical credentials, OPD room & fees</Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}
                onPress={() => setShowEditProfileModal(false)}
              >
                <AppIcon name="close" size={18} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.editInputGroup}>
                <Text style={styles.editInputLabel}>DOCTOR FULL NAME</Text>
                <TextInput
                  style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editDocName}
                  onChangeText={setEditDocName}
                  placeholder="Dr. Preetha Rajesh, MD"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.editInputGroup}>
                <Text style={styles.editInputLabel}>SPECIALTY / DEPARTMENT</Text>
                <TextInput
                  style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editDocSpec}
                  onChangeText={setEditDocSpec}
                  placeholder="Senior Consultant Radiologist & Sonologist"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.editTwoCols}>
                <View style={[styles.editInputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.editInputLabel}>ASSIGNED ROOM</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editDocRoom}
                    onChangeText={setEditDocRoom}
                    placeholder="Scan Room 1"
                    placeholderTextColor={tc.textTertiary}
                  />
                </View>

                <View style={[styles.editInputGroup, { flex: 1 }]}>
                  <Text style={styles.editInputLabel}>CONSULTATION FEE (₹)</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editDocFee}
                    onChangeText={setEditDocFee}
                    placeholder="800"
                    placeholderTextColor={tc.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.editTwoCols}>
                <View style={[styles.editInputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.editInputLabel}>PHONE NUMBER</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editDocPhone}
                    onChangeText={setEditDocPhone}
                    placeholder="+91 94431 22880"
                    placeholderTextColor={tc.textTertiary}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={[styles.editInputGroup, { flex: 1 }]}>
                  <Text style={styles.editInputLabel}>EMAIL ADDRESS</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editDocEmail}
                    onChangeText={setEditDocEmail}
                    placeholder="dr.preetha@rioscan.com"
                    placeholderTextColor={tc.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.editInputGroup}>
                <Text style={styles.editInputLabel}>QUALIFICATIONS</Text>
                <TextInput
                  style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editDocQual}
                  onChangeText={setEditDocQual}
                  placeholder="MBBS, MD (Radiology), FRCR (London), FICR"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.editTwoCols}>
                <View style={[styles.editInputGroup, { flex: 1.2, marginRight: 8 }]}>
                  <Text style={styles.editInputLabel}>MEDICAL COUNCIL REG #</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editDocReg}
                    onChangeText={setEditDocReg}
                    placeholder="TNMC-89421"
                    placeholderTextColor={tc.textTertiary}
                  />
                </View>

                <View style={[styles.editInputGroup, { flex: 0.8 }]}>
                  <Text style={styles.editInputLabel}>EXPERIENCE (YRS)</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editDocExp}
                    onChangeText={setEditDocExp}
                    placeholder="15"
                    placeholderTextColor={tc.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.editInputGroup}>
                <Text style={styles.editInputLabel}>ABOUT / CLINICAL SPECIALIZATION</Text>
                <TextInput
                  style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder, height: 60 }]}
                  value={editDocAbout}
                  onChangeText={setEditDocAbout}
                  placeholder="Senior Consultant Radiologist specializing in..."
                  placeholderTextColor={tc.textTertiary}
                  multiline
                />
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
        title="Update Doctor Photo"
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
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
  },
  segmentedTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentedTabActive: {
    backgroundColor: colors.whatsapp.primary,
  },
  segmentedTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  segmentedTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 120,
    gap: 14,
  },
  tabContentWrap: {
    gap: 14,
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
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  doctorBadgeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 17,
    fontWeight: '800',
  },
  heroSpec: {
    fontSize: 12,
    color: colors.whatsapp.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  heroSub: {
    fontSize: 11,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#F59E0B',
  },
  reviewsCount: {
    fontSize: 11,
  },
  contactStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  contactItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  contactItemText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#16A34A',
  },
  contactDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 11.5,
  },
  infoGrid: {
    gap: 8,
    marginTop: 8,
  },
  infoTile: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  infoLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  parametersRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  paramBox: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  paramLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
  },
  paramVal: {
    fontSize: 18,
    fontWeight: '900',
    marginVertical: 2,
  },
  paramSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  scheduleStrip: {
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  scheduleDaysText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  scheduleHoursText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiCardLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  kpiCardValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  kpiCardSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  earningsTotalPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  earningsTotalPillText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '800',
  },
  dailyEarningsList: {
    gap: 2,
  },
  dailyEarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  dayCol: {
    flex: 1.2,
  },
  dayLabelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateSubText: {
    fontSize: 10.5,
  },
  statsCol: {
    flex: 1.2,
    alignItems: 'center',
  },
  consultCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hoursText: {
    fontSize: 10.5,
  },
  earnedCol: {
    flex: 1.3,
    alignItems: 'flex-end',
  },
  earnedAmountText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  shareSplitText: {
    fontSize: 9.5,
    color: '#94A3B8',
  },
  payoutsList: {
    gap: 8,
  },
  payoutCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  payoutCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  payoutPeriodText: {
    fontSize: 13,
    fontWeight: '700',
  },
  payoutDisbursedDate: {
    fontSize: 11,
    marginTop: 1,
  },
  payoutAmountCol: {
    alignItems: 'flex-end',
  },
  payoutAmountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  payoutRefText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  payoutCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  payoutConsultsCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  viewSlipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.whatsapp.primary,
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presetChipActive: {
    backgroundColor: colors.whatsapp.primary,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  dateInputWrap: {
    flex: 1,
    gap: 4,
  },
  dateInputLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
  },
  dateInput: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    borderWidth: 1,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  formatBtnActive: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  formatBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  formatBtnTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  generateReportBtn: {
    backgroundColor: colors.whatsapp.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  generateReportBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  themeOptionBtnActive: {
    borderColor: colors.whatsapp.primary,
    backgroundColor: 'rgba(18, 140, 126, 0.08)',
  },
  themeOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  themeOptionSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 11,
    marginTop: 1,
  },
  settingDivider: {
    height: 1,
    marginVertical: 4,
  },
  appInfoBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  appInfoText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  appInfoSub: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  reportPreviewBox: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
    marginBottom: 14,
  },
  reportPreviewTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reportPreviewDoctor: {
    fontSize: 12,
    color: '#64748B',
  },
  reportPreviewMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  reportPreviewAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 4,
  },
  modalActions: {
    gap: 8,
  },
  modalPrimaryBtn: {
    backgroundColor: colors.whatsapp.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  payslipDetailBox: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 14,
  },
  payslipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payslipRowLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  payslipRowVal: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  payslipDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  payslipTotalLabel: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  payslipTotalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#16A34A',
  },
  modalDoneBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  // Availability styles
  manageAvailabilityQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 12,
  },
  manageAvailabilityQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  availHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  availMainTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  availMainSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  syncBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  syncBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  availSectionMiniLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  availDateStrip: {
    gap: 8,
    paddingBottom: 4,
  },
  availDatePill: {
    width: 66,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  availDayName: {
    fontSize: 11,
    fontWeight: '700',
  },
  availDayNum: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  availMonthText: {
    fontSize: 10,
    marginTop: 1,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusMiniText: {
    fontSize: 9,
    fontWeight: '700',
  },
  selectedDateTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  selectedDateSub: {
    fontSize: 12,
    marginTop: 2,
  },
  currentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  switchCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  switchInfoCol: {
    flex: 1,
    marginRight: 12,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  switchDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  inputSectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 6,
  },
  shiftPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  shiftPresetPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  shiftPresetText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  shiftPresetTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  slotsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotsCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  slotsSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  slotToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  slotToggleChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tokenCapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  tokenCapInfo: {
    flex: 1,
    marginRight: 10,
  },
  tokenCapTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  tokenCapSub: {
    fontSize: 11,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepperValueText: {
    fontSize: 16,
    fontWeight: '800',
    minWidth: 26,
    textAlign: 'center',
  },
  noteInputSection: {
    marginBottom: 14,
  },
  availNoteInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 12.5,
  },
  leaveSection: {
    marginBottom: 14,
    gap: 10,
  },
  leavePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  leavePresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  leavePresetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  leavePreviewNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  leavePreviewNoticeText: {
    flex: 1,
    fontSize: 11.5,
    color: '#EF4444',
    lineHeight: 16,
    fontWeight: '600',
  },
  saveAvailBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 4,
  },
  saveAvailBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  overviewList: {
    gap: 6,
    marginTop: 10,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  overviewLeftCol: {
    flex: 1,
  },
  overviewDateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  overviewSlotsCount: {
    fontSize: 11,
    marginTop: 2,
  },
  overviewRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overviewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  overviewBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  editDateBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  editDateBtnText: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '700',
  },

  avatarImageCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.whatsapp.primary,
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.whatsapp.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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

  editModalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  editModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editModalSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModalScroll: {
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
