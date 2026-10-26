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
  Linking,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { useAppTheme } from '../../context/ThemeContext';
import { AppIcon } from '../../components/common/AppIcon';
import { PhotoPickerModal } from '../../components/profile/PhotoPickerModal';

type PatientProfileTab = 'profile' | 'invoices' | 'settings';

interface PatientInvoiceRecord {
  id: string;
  invoiceDate: string;
  hospitalName: string;
  doctorName: string;
  specialty: string;
  roomNumber: string;
  consultationFee: number;
  diagnosticsFee: number;
  pharmacyFee: number;
  totalGross: number;
  insuranceCovered: number;
  outOfPocketPaid: number;
  paymentMethod: 'gpay' | 'card' | 'insurance';
  paymentReference: string;
  status: 'paid' | 'settled';
}

interface DailyExpense {
  dayLabel: string;
  dateStr: string;
  service: string;
  department: string;
  totalAmount: number;
  insuranceCovered: number;
  outOfPocket: number;
  status: string;
}

export const PatientProfileScreen: React.FC = () => {
  const { user, updateProfile, switchRole } = useAuth();
  const { selectedHospital } = useHospital();
  const { theme, setTheme, toggleTheme, colors: tc, isDark } = useAppTheme();

  // Photo picker and profile editing state
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);

  const patientProfile = user?.patientProfile;
  const [editName, setEditName] = useState<string>(user?.name || 'Gowri T');
  const [editAge, setEditAge] = useState<string>(String(patientProfile?.age || 56));
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other'>(patientProfile?.gender || 'female');
  const [editBloodGroup, setEditBloodGroup] = useState<string>(patientProfile?.bloodGroup || 'B+');
  const [editPhone, setEditPhone] = useState<string>(user?.phone || '+91 98421 77650');
  const [editEmail, setEditEmail] = useState<string>(user?.email || 'patient@upstagehealth.com');
  const [editAddress, setEditAddress] = useState<string>(patientProfile?.address || '12 North Car Street, Vannarpettai, Tirunelveli, Tamil Nadu 627003');
  const [editEmergencyContact, setEditEmergencyContact] = useState<string>(patientProfile?.emergencyContact || 'K. Thiyagarajan (Spouse) • +91 94431 88770');
  const [editInsuranceProvider, setEditInsuranceProvider] = useState<string>(patientProfile?.insuranceProvider || 'Star Health MediClassic');
  const [editInsurancePolicyNumber, setEditInsurancePolicyNumber] = useState<string>(patientProfile?.insurancePolicyNumber || 'POL-SH-7749102-TN');

  const handleOpenEditModal = () => {
    setEditName(user?.name || 'Gowri T');
    setEditAge(String(user?.patientProfile?.age || 56));
    setEditGender(user?.patientProfile?.gender || 'female');
    setEditBloodGroup(user?.patientProfile?.bloodGroup || 'B+');
    setEditPhone(user?.phone || '+91 98421 77650');
    setEditEmail(user?.email || 'patient@upstagehealth.com');
    setEditAddress(user?.patientProfile?.address || '12 North Car Street, Vannarpettai, Tirunelveli, Tamil Nadu 627003');
    setEditEmergencyContact(user?.patientProfile?.emergencyContact || 'K. Thiyagarajan (Spouse) • +91 94431 88770');
    setEditInsuranceProvider(user?.patientProfile?.insuranceProvider || 'Star Health MediClassic');
    setEditInsurancePolicyNumber(user?.patientProfile?.insurancePolicyNumber || 'POL-SH-7749102-TN');
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
      patientProfile: {
        ...user?.patientProfile,
        age: Number(editAge) || 56,
        gender: editGender,
        bloodGroup: editBloodGroup.trim(),
        address: editAddress.trim(),
        emergencyContact: editEmergencyContact.trim(),
        insuranceProvider: editInsuranceProvider.trim(),
        insurancePolicyNumber: editInsurancePolicyNumber.trim(),
      },
    });

    setShowEditProfileModal(false);
    showToast('Patient profile updated successfully! ✓');
  };

  const handleSaveAvatar = (newUri: string) => {
    updateProfile({ avatarUrl: newUri });
    showToast('Patient profile picture updated successfully! 📸');
  };

  // Active top-level sub-tab in Profile Screen (shortened names to avoid text overflow)
  const [activeSubTab, setActiveSubTab] = useState<PatientProfileTab>('profile');

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings Toggles
  const [queueChimeEnabled, setQueueChimeEnabled] = useState<boolean>(true);
  const [smsTokenAlerts, setSmsTokenAlerts] = useState<boolean>(true);
  const [labReportAlerts, setLabReportAlerts] = useState<boolean>(true);
  const [biometricUnlock, setBiometricUnlock] = useState<boolean>(true);
  const [emergencySosSharing, setEmergencySosSharing] = useState<boolean>(true);

  // Statement / Report Generator State
  const [reportFromDate, setReportFromDate] = useState<string>('2026-08-01');
  const [reportToDate, setReportToDate] = useState<string>('2026-09-26');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf');
  const [selectedPreset, setSelectedPreset] = useState<string>('last30');
  const [showReportPreviewModal, setShowReportPreviewModal] = useState<boolean>(false);

  // Receipt Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<PatientInvoiceRecord | null>(null);

  // Role Switcher Modal
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          if (Platform.OS === 'web') {
            window.alert(`Calling: ${phoneNumber}`);
          } else {
            Alert.alert('Call Patient Contact', `Calling ${phoneNumber}`);
          }
        }
      })
      .catch(() => {
        if (Platform.OS === 'web') {
          window.alert(`Calling: ${phoneNumber}`);
        } else {
          Alert.alert('Call', `Connecting to ${phoneNumber}`);
        }
      });
  };

  // -------------------------------------------------------------
  // Mock Data: 7-Day Medical & OPD Expense Breakdown Table
  // -------------------------------------------------------------
  const recent7DayExpenses: DailyExpense[] = [
    {
      dayLabel: 'Sat',
      dateStr: 'Today, Sep 26',
      service: 'Rio Scan USG Knee Token #8',
      department: 'Radiology',
      totalAmount: 800,
      insuranceCovered: 700,
      outOfPocket: 100,
      status: 'Paid (UPI / GPay)',
    },
    {
      dayLabel: 'Fri',
      dateStr: 'Fri, Sep 25',
      service: 'Knee Joint Follow-up',
      department: 'Radiology',
      totalAmount: 400,
      insuranceCovered: 350,
      outOfPocket: 50,
      status: 'Paid (UPI)',
    },
    {
      dayLabel: 'Tue',
      dateStr: 'Tue, Sep 22',
      service: 'Orthopedic Knee Consult',
      department: 'Orthopedics',
      totalAmount: 600,
      insuranceCovered: 500,
      outOfPocket: 100,
      status: 'Paid (UPI)',
    },
    {
      dayLabel: 'Fri',
      dateStr: 'Fri, Sep 18',
      service: 'Digital Knee X-Ray (Bilateral)',
      department: 'Radiology',
      totalAmount: 1200,
      insuranceCovered: 1050,
      outOfPocket: 150,
      status: 'Paid (Card)',
    },
    {
      dayLabel: 'Thu',
      dateStr: 'Thu, Sep 10',
      service: 'Uric Acid & Joint Fluid Panel',
      department: 'Pathology Lab',
      totalAmount: 650,
      insuranceCovered: 550,
      outOfPocket: 100,
      status: 'Paid (UPI)',
    },
  ];

  // -------------------------------------------------------------
  // Mock Data: Historical Patient Invoices / Receipts Table
  // -------------------------------------------------------------
  const historicalInvoices: PatientInvoiceRecord[] = [
    {
      id: 'INV-2026-0926',
      invoiceDate: '26 Sep 2026',
      hospitalName: 'Rio Scan Center',
      doctorName: 'Dr. Preetha Rajesh',
      specialty: 'Radiology & USG',
      roomNumber: 'Scan Room 1',
      consultationFee: 800,
      diagnosticsFee: 1200,
      pharmacyFee: 0,
      totalGross: 2000,
      insuranceCovered: 1800,
      outOfPocketPaid: 200,
      paymentMethod: 'gpay',
      paymentReference: 'UPI-RIO-982141',
      status: 'paid',
    },
    {
      id: 'INV-2026-0922',
      invoiceDate: '22 Sep 2026',
      hospitalName: 'Rio Scan Center',
      doctorName: 'Dr. M. Senthil Kumar',
      specialty: 'Orthopedics',
      roomNumber: 'Room 102',
      consultationFee: 600,
      diagnosticsFee: 0,
      pharmacyFee: 350,
      totalGross: 950,
      insuranceCovered: 850,
      outOfPocketPaid: 100,
      paymentMethod: 'card',
      paymentReference: 'HDFC-DEBIT-77491',
      status: 'paid',
    },
    {
      id: 'INV-2026-0918',
      invoiceDate: '18 Sep 2026',
      hospitalName: 'Ria Child Care',
      doctorName: 'Dr. Rajesh',
      specialty: 'Pediatrics',
      roomNumber: 'Room 101',
      consultationFee: 500,
      diagnosticsFee: 0,
      pharmacyFee: 250,
      totalGross: 750,
      insuranceCovered: 650,
      outOfPocketPaid: 100,
      paymentMethod: 'gpay',
      paymentReference: 'UPI-RIA-44109',
      status: 'paid',
    },
    {
      id: 'INV-2026-0814',
      invoiceDate: '14 Aug 2026',
      hospitalName: 'Rio Scan Center',
      doctorName: 'Dr. Vikram Ramanathan',
      specialty: 'Cardiology',
      roomNumber: 'Room 105',
      consultationFee: 700,
      diagnosticsFee: 800,
      pharmacyFee: 280,
      totalGross: 1780,
      insuranceCovered: 1580,
      outOfPocketPaid: 200,
      paymentMethod: 'gpay',
      paymentReference: 'UPI-RIO-664188',
      status: 'paid',
    },
    {
      id: 'INV-2026-0520',
      invoiceDate: '20 May 2026',
      hospitalName: 'Rio Scan Center',
      doctorName: 'Dr. S. K. Arumugam',
      specialty: 'Senior Health Checkup',
      roomNumber: 'Suite 1',
      consultationFee: 1500,
      diagnosticsFee: 2500,
      pharmacyFee: 0,
      totalGross: 4000,
      insuranceCovered: 4000,
      outOfPocketPaid: 0,
      paymentMethod: 'insurance',
      paymentReference: 'STAR-HEALTH-0049',
      status: 'settled',
    },
  ];

  const totalGrossExpense = historicalInvoices.reduce((acc, inv) => acc + inv.totalGross, 0);
  const totalInsuranceSettled = historicalInvoices.reduce((acc, inv) => acc + inv.insuranceCovered, 0);
  const totalOutOfPocketPaid = historicalInvoices.reduce((acc, inv) => acc + inv.outOfPocketPaid, 0);

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
            style={[
              styles.iosSegmentPill,
              activeSubTab === 'profile' && [styles.iosSegmentPillActive, { backgroundColor: isDark ? '#636366' : '#FFFFFF' }],
            ]}
            onPress={() => setActiveSubTab('profile')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.iosSegmentText,
                { color: isDark ? '#9CA3AF' : '#64748B' },
                activeSubTab === 'profile' && [styles.iosSegmentTextActive, { color: tc.text }],
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iosSegmentPill,
              activeSubTab === 'invoices' && [styles.iosSegmentPillActive, { backgroundColor: isDark ? '#636366' : '#FFFFFF' }],
            ]}
            onPress={() => setActiveSubTab('invoices')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.iosSegmentText,
                { color: isDark ? '#9CA3AF' : '#64748B' },
                activeSubTab === 'invoices' && [styles.iosSegmentTextActive, { color: tc.text }],
              ]}
            >
              Invoices
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iosSegmentPill,
              activeSubTab === 'settings' && [styles.iosSegmentPillActive, { backgroundColor: isDark ? '#636366' : '#FFFFFF' }],
            ]}
            onPress={() => setActiveSubTab('settings')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.iosSegmentText,
                { color: isDark ? '#9CA3AF' : '#64748B' },
                activeSubTab === 'settings' && [styles.iosSegmentTextActive, { color: tc.text }],
              ]}
            >
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
            TAB 1: PATIENT PROFILE & CLINICAL SUMMARY
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
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
                    }}
                    style={styles.avatar}
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
                    <Text style={[styles.userName, { color: tc.text }]} numberOfLines={1}>
                      {user?.name || 'Gowri T'}
                    </Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>Patient</Text>
                    </View>
                  </View>

                  <Text style={[styles.patientIdText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    Patient ID: #RIO-9281 • Registered
                  </Text>

                  {/* Demographic Badges Row */}
                  <View style={styles.demographicRow}>
                    <View style={[styles.demographicPill, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}>
                      <AppIcon name="person" size={12} color="#0284C7" />
                      <Text style={[styles.demographicText, { color: tc.text }]}>
                        {patientProfile?.age || 56} yrs • {patientProfile?.gender === 'female' ? 'Female' : patientProfile?.gender === 'male' ? 'Male' : 'Other'}
                      </Text>
                    </View>

                    <View style={[styles.demographicPill, { backgroundColor: isDark ? '#3E1F1F' : '#FEF2F2' }]}>
                      <Text style={styles.bloodDropIcon}>🩸</Text>
                      <Text style={[styles.demographicText, { color: '#DC2626', fontWeight: '800' }]}>
                        {patientProfile?.bloodGroup || 'B+'}
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

              {/* Primary Physician Banner */}
              <View style={[styles.physicianBanner, { backgroundColor: isDark ? '#1C2E2A' : '#ECFDF5', borderColor: isDark ? '#234E44' : '#A7F3D0' }]}>
                <View style={styles.physicianIconWrap}>
                  <AppIcon name="medkit" size={16} color="#059669" />
                </View>
                <View style={styles.physicianInfo}>
                  <Text style={[styles.physicianLabel, { color: isDark ? '#6EE7B7' : '#047857' }]}>
                    PRIMARY CARE PHYSICIAN
                  </Text>
                  <Text style={[styles.physicianName, { color: tc.text }]}>
                    Dr. Preetha Rajesh, MD (Rio Scan Center • Scan Room 1)
                  </Text>
                </View>
              </View>
            </View>

            {/* Personal & Contact Information Card */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.sectionTitleRow}>
                <AppIcon name="person-outline" size={16} color={colors.whatsapp.primary} />
                <Text style={[styles.sectionTitle, { color: tc.text }]}>PERSONAL & CONTACT DETAILS</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Phone Number</Text>
                <View style={styles.interactiveValRow}>
                  <Text style={[styles.infoValue, { color: tc.text }]}>
                    {user?.phone || '+91 98421 77650'}
                  </Text>
                  <TouchableOpacity
                    style={styles.quickCallBtn}
                    onPress={() => handleCall(user?.phone || '+91 98421 77650')}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="call" size={13} color="#FFFFFF" />
                    <Text style={styles.quickCallText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Email Address</Text>
                <Text style={[styles.infoValue, { color: tc.text }]}>
                  {user?.email || 'gowri.t@gmail.com'}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Residential Address</Text>
                <Text style={[styles.infoValue, styles.infoValueMultiline, { color: tc.text }]}>
                  {patientProfile?.address || '12/4 South Bypass Road, Vannarpettai, Tirunelveli, Tamil Nadu 627003'}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Emergency Contact</Text>
                <View style={styles.emergencyContactCol}>
                  <Text style={[styles.infoValue, { color: tc.text, textAlign: 'right' }]}>
                    {patientProfile?.emergencyContact || 'Thiyagarajan S (Son) • +91 94431 88220'}
                  </Text>
                  <TouchableOpacity
                    style={styles.quickCallBtn}
                    onPress={() => handleCall(patientProfile?.emergencyContact || '+91 94431 88220')}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="call" size={13} color="#FFFFFF" />
                    <Text style={styles.quickCallText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Preferred Language</Text>
                <Text style={[styles.infoValue, { color: tc.text }]}>English (US)</Text>
              </View>
            </View>

            {/* Clinical & Health Summary Card */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.sectionTitleRow}>
                <AppIcon name="medkit-outline" size={16} color="#DC2626" />
                <Text style={[styles.sectionTitle, { color: tc.text }]}>CLINICAL & HEALTH SUMMARY</Text>
              </View>

              {/* Allergies Chips */}
              <View style={styles.clinicalGroup}>
                <Text style={[styles.clinicalSubLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  KNOWN ALLERGIES
                </Text>
                <View style={styles.chipsRow}>
                  <View style={[styles.allergyChip, { backgroundColor: isDark ? '#451A1A' : '#FEE2E2', borderColor: '#FCA5A5' }]}>
                    <Text style={styles.allergyChipText}>⚠️ Penicillin (Anaphylaxis Risk)</Text>
                  </View>
                  <View style={[styles.allergyChip, { backgroundColor: isDark ? '#451A1A' : '#FEE2E2', borderColor: '#FCA5A5' }]}>
                    <Text style={styles.allergyChipText}>⚠️ Sulfa Drugs</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              {/* Chronic Conditions */}
              <View style={styles.clinicalGroup}>
                <Text style={[styles.clinicalSubLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  CHRONIC HEALTH CONDITIONS
                </Text>
                <View style={styles.chipsRow}>
                  <View style={[styles.conditionChip, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: '#93C5FD' }]}>
                    <Text style={styles.conditionChipText}>🩺 Essential Hypertension (Stage 1)</Text>
                  </View>
                  <View style={[styles.conditionChip, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: '#93C5FD' }]}>
                    <Text style={styles.conditionChipText}>🫁 Mild Bronchial Asthma</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              {/* Active Prescriptions */}
              <View style={styles.clinicalGroup}>
                <Text style={[styles.clinicalSubLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  CURRENT ACTIVE MEDICATIONS
                </Text>
                <View style={styles.medsList}>
                  <View style={styles.medItem}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={[styles.medName, { color: tc.text }]}>
                      Tab Atorvastatin 10mg <Text style={styles.medDose}>— Once daily at bedtime (Cholesterol)</Text>
                    </Text>
                  </View>
                  <View style={styles.medItem}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={[styles.medName, { color: tc.text }]}>
                      Tab Telmisartan 40mg <Text style={styles.medDose}>— Once daily morning (Blood pressure)</Text>
                    </Text>
                  </View>
                  <View style={styles.medItem}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={[styles.medName, { color: tc.text }]}>
                      Inhaler Albuterol 90mcg <Text style={styles.medDose}>— 2 puffs PRN for wheezing</Text>
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              {/* Last Recorded Vitals */}
              <View style={styles.vitalsGrid}>
                <View style={[styles.vitalCard, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.vitalLabel}>BLOOD PRESSURE</Text>
                  <Text style={[styles.vitalVal, { color: '#059669' }]}>122/82</Text>
                  <Text style={styles.vitalUnit}>mmHg (Optimal)</Text>
                </View>
                <View style={[styles.vitalCard, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.vitalLabel}>HEART RATE</Text>
                  <Text style={[styles.vitalVal, { color: '#0284C7' }]}>72</Text>
                  <Text style={styles.vitalUnit}>bpm (Resting)</Text>
                </View>
                <View style={[styles.vitalCard, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.vitalLabel}>OXYGEN SPO2</Text>
                  <Text style={[styles.vitalVal, { color: '#7C3AED' }]}>99%</Text>
                  <Text style={styles.vitalUnit}>Room air</Text>
                </View>
                <View style={[styles.vitalCard, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.vitalLabel}>BODY MASS INDEX</Text>
                  <Text style={[styles.vitalVal, { color: '#D97706' }]}>23.4</Text>
                  <Text style={styles.vitalUnit}>74.5 kg (Normal)</Text>
                </View>
              </View>
            </View>

            {/* Health Insurance & Coverage Card */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.sectionTitleRow}>
                <AppIcon name="shield-checkmark" size={16} color="#059669" />
                <Text style={[styles.sectionTitle, { color: tc.text }]}>HEALTH INSURANCE & TPA POLICY</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Insurance Provider</Text>
                <Text style={[styles.infoValue, { color: tc.text, fontWeight: '700' }]}>
                  {patientProfile?.insuranceProvider || 'BlueCross BlueShield Premier'}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Policy Number</Text>
                <Text style={[styles.infoValue, { color: tc.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
                  {patientProfile?.insurancePolicyNumber || 'POL-BCBS-8829104'}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Group ID</Text>
                <Text style={[styles.infoValue, { color: tc.text }]}>
                  {patientProfile?.insuranceGroupNumber || 'GRP-002918-A'}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>OPD Co-Pay Rate</Text>
                <Text style={[styles.infoValue, { color: '#059669', fontWeight: '800' }]}>
                  ₹100 / Visit (90% Cashless Covered)
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Policy Status</Text>
                <View style={styles.statusPillActive}>
                  <AppIcon name="checkmark-circle" size={13} color="#059669" />
                  <Text style={styles.statusPillActiveText}>Active (Valid till Dec 31, 2026)</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================
            TAB 2: INVOICES & MEDICAL EXPENSES (Matching Receptionist Payroll)
        ======================================================== */}
        {activeSubTab === 'invoices' && (
          <View style={styles.tabContentGroup}>
            {/* 4 KPI Summary Cards (2x2 Grid) */}
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(37, 211, 102, 0.15)' }]}>
                  <AppIcon name="wallet" size={18} color={colors.whatsapp.primary} />
                </View>
                <Text style={[styles.kpiValue, { color: tc.text }]}>₹{totalGrossExpense}</Text>
                <Text style={[styles.kpiLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  Total Medical Spend
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                  <AppIcon name="shield-checkmark" size={18} color="#0284C7" />
                </View>
                <Text style={[styles.kpiValue, { color: '#0284C7' }]}>₹{totalInsuranceSettled}</Text>
                <Text style={[styles.kpiLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  Insurance Settled (85%)
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(234, 88, 12, 0.15)' }]}>
                  <AppIcon name="cash" size={18} color="#EA580C" />
                </View>
                <Text style={[styles.kpiValue, { color: '#EA580C' }]}>₹{totalOutOfPocketPaid}</Text>
                <Text style={[styles.kpiLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  Out-of-Pocket Paid
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <AppIcon name="checkmark-circle" size={18} color="#10B981" />
                </View>
                <Text style={[styles.kpiValue, { color: '#10B981' }]}>₹0</Text>
                <Text style={[styles.kpiLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  Pending Claims (All clear)
                </Text>
              </View>
            </View>

            {/* 7-Day Medical & OPD Expense Breakdown Table */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: tc.text }]}>7-Day Medical Expense Breakdown</Text>
                  <Text style={[styles.cardSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    Recent visits, consultation fees, and cashless settlements
                  </Text>
                </View>
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>Live Synced</Text>
                </View>
              </View>

              <View style={styles.tableWrap}>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}>
                  <Text style={[styles.tableColHeader, { flex: 1.8, color: tc.text }]}>Date / Service</Text>
                  <Text style={[styles.tableColHeader, { flex: 1.2, color: tc.text, textAlign: 'center' }]}>Dept</Text>
                  <Text style={[styles.tableColHeader, { flex: 1, color: tc.text, textAlign: 'right' }]}>Total</Text>
                  <Text style={[styles.tableColHeader, { flex: 1, color: tc.text, textAlign: 'right' }]}>Paid</Text>
                  <Text style={[styles.tableColHeader, { flex: 1.4, color: tc.text, textAlign: 'center' }]}>Status</Text>
                </View>

                {/* Table Rows */}
                {recent7DayExpenses.map((exp, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      { borderBottomColor: tc.cardBorder },
                      idx % 2 === 1 && { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FAFAFA' },
                    ]}
                  >
                    <View style={{ flex: 1.8 }}>
                      <Text style={[styles.tableCellMain, { color: tc.text }]}>{exp.dayLabel}</Text>
                      <Text style={[styles.tableCellSub, { color: isDark ? '#9CA3AF' : '#64748B' }]} numberOfLines={1}>
                        {exp.service}
                      </Text>
                    </View>

                    <Text style={[styles.tableCellNormal, { flex: 1.2, textAlign: 'center', color: tc.text }]}>
                      {exp.department}
                    </Text>

                    <Text style={[styles.tableCellNormal, { flex: 1, textAlign: 'right', color: tc.text }]}>
                      ₹{exp.totalAmount}
                    </Text>

                    <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right', color: '#059669' }]}>
                      ₹{exp.outOfPocket}
                    </Text>

                    <View style={{ flex: 1.4, alignItems: 'center' }}>
                      <View style={styles.tableStatusTag}>
                        <Text style={styles.tableStatusTagText}>{exp.status}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Historical Patient Invoices / Receipts Table */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: tc.text }]}>Date-Wise Invoices & Receipts</Text>
                  <Text style={[styles.cardSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    Tap any invoice row to view itemized tax receipt and download PDF
                  </Text>
                </View>
              </View>

              <View style={styles.recordsList}>
                {historicalInvoices.map((inv) => (
                  <TouchableOpacity
                    key={inv.id}
                    style={[styles.invoiceRecordCard, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}
                    onPress={() => setSelectedInvoice(inv)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.invoiceTopRow}>
                      <View>
                        <Text style={[styles.invoiceDateText, { color: tc.text }]}>{inv.invoiceDate}</Text>
                        <Text style={[styles.invoiceIdText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                          {inv.id} • {inv.doctorName}
                        </Text>
                      </View>
                      <View style={styles.invoiceAmountCol}>
                        <Text style={[styles.invoiceTotalText, { color: tc.text }]}>₹{inv.totalGross}</Text>
                        <Text style={styles.invoicePaidText}>Paid ₹{inv.outOfPocketPaid}</Text>
                      </View>
                    </View>

                    <View style={styles.invoiceBottomRow}>
                      <View style={styles.paymentMethodPill}>
                        <AppIcon
                          name={inv.paymentMethod === 'gpay' ? 'wallet' : 'card'}
                          size={12}
                          color="#059669"
                        />
                        <Text style={styles.paymentMethodText}>
                          {inv.paymentMethod === 'gpay' ? 'UPI Verified' : inv.paymentMethod === 'insurance' ? '100% Cashless' : 'Card'}
                        </Text>
                      </View>

                      <View style={styles.viewSlipActionRow}>
                        <Text style={styles.viewSlipActionText}>View Digital Receipt</Text>
                        <AppIcon name="chevron-forward" size={13} color={colors.whatsapp.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Statement Report Generator with From-To Date Picker */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.sectionTitleRow}>
                <AppIcon name="document-text" size={16} color={colors.whatsapp.primary} />
                <Text style={[styles.sectionTitle, { color: tc.text }]}>STATEMENT REPORT GENERATOR</Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: isDark ? '#9CA3AF' : '#64748B', marginBottom: 12 }]}>
                Export certified medical expense statement for insurance reimbursements and tax deductions
              </Text>

              {/* Quick Range Presets */}
              <View style={styles.presetRow}>
                {(['month', 'last30', 'q3', 'ytd'] as const).map((p) => {
                  const labels = { month: 'This Month', last30: 'Last 30 Days', q3: 'Q3 2026', ytd: 'YTD 2026' };
                  const isSelected = selectedPreset === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.presetChip,
                        { borderColor: tc.cardBorder, backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' },
                        isSelected && [styles.presetChipActive, { backgroundColor: colors.whatsapp.primary, borderColor: colors.whatsapp.primary }],
                      ]}
                      onPress={() => applyPreset(p)}
                    >
                      <Text style={[styles.presetChipText, { color: tc.text }, isSelected && styles.presetChipTextActive]}>
                        {labels[p]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Date Range Inputs */}
              <View style={styles.datePickerRow}>
                <View style={styles.dateField}>
                  <Text style={[styles.dateFieldLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>From Date</Text>
                  <TextInput
                    style={[styles.dateInput, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9', borderColor: tc.cardBorder, color: tc.text }]}
                    value={reportFromDate}
                    onChangeText={setReportFromDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDark ? '#71717A' : '#94A3B8'}
                  />
                </View>

                <View style={styles.dateArrowWrap}>
                  <AppIcon name="arrow-forward" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
                </View>

                <View style={styles.dateField}>
                  <Text style={[styles.dateFieldLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>To Date</Text>
                  <TextInput
                    style={[styles.dateInput, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9', borderColor: tc.cardBorder, color: tc.text }]}
                    value={reportToDate}
                    onChangeText={setReportToDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDark ? '#71717A' : '#94A3B8'}
                  />
                </View>
              </View>

              {/* Format Selector */}
              <View style={styles.formatSelectRow}>
                <Text style={[styles.formatLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Export Format:</Text>
                <View style={styles.formatTabs}>
                  <TouchableOpacity
                    style={[styles.formatTab, selectedFormat === 'pdf' && styles.formatTabActive]}
                    onPress={() => setSelectedFormat('pdf')}
                  >
                    <Text style={[styles.formatTabText, selectedFormat === 'pdf' && styles.formatTabTextActive]}>
                      PDF Statement
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formatTab, selectedFormat === 'csv' && styles.formatTabActive]}
                    onPress={() => setSelectedFormat('csv')}
                  >
                    <Text style={[styles.formatTabText, selectedFormat === 'csv' && styles.formatTabTextActive]}>
                      CSV Spreadsheet
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Generate CTA Button */}
              <TouchableOpacity
                style={styles.generateButton}
                onPress={() => setShowReportPreviewModal(true)}
                activeOpacity={0.8}
              >
                <AppIcon name="document-text" size={16} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Generate & Download Statement</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================
            TAB 3: SETTINGS & APPEARANCE (Plain White / Black)
        ======================================================== */}
        {activeSubTab === 'settings' && (
          <View style={styles.tabContentGroup}>
            {/* Theme & Display Mode */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.sectionTitleRow}>
                <AppIcon name="color-palette-outline" size={16} color={colors.whatsapp.primary} />
                <Text style={[styles.sectionTitle, { color: tc.text }]}>APP APPEARANCE & THEME</Text>
              </View>

              <Text style={[styles.cardSubtitle, { color: isDark ? '#9CA3AF' : '#64748B', marginBottom: 12 }]}>
                Switch between clean Plain White light theme and Pure Black dark theme
              </Text>

              <View style={styles.themeSelectorGrid}>
                {/* Plain White (Light) */}
                <TouchableOpacity
                  style={[
                    styles.themeOptionCard,
                    { backgroundColor: '#FFFFFF', borderColor: theme === 'light' ? colors.whatsapp.primary : '#E2E8F0' },
                    theme === 'light' && styles.themeOptionCardActive,
                  ]}
                  onPress={() => {
                    setTheme('light');
                    showToast('Switched to Plain White Light Theme');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.themePreviewLight}>
                    <View style={styles.previewHeaderLight} />
                    <View style={styles.previewLineLight} />
                    <View style={styles.previewLineLightShort} />
                  </View>
                  <Text style={[styles.themeOptionTitle, { color: '#0F172A' }]}>Plain White</Text>
                  <Text style={styles.themeOptionDesc}>Crisp Light Mode</Text>
                  {theme === 'light' && (
                    <View style={styles.themeActiveCheck}>
                      <AppIcon name="checkmark" size={11} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Pure Black (Dark) */}
                <TouchableOpacity
                  style={[
                    styles.themeOptionCard,
                    { backgroundColor: '#000000', borderColor: theme === 'dark' ? '#25D366' : '#27272A' },
                    theme === 'dark' && styles.themeOptionCardActive,
                  ]}
                  onPress={() => {
                    setTheme('dark');
                    showToast('Switched to Pure Black Dark Theme');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.themePreviewDark}>
                    <View style={styles.previewHeaderDark} />
                    <View style={styles.previewLineDark} />
                    <View style={styles.previewLineDarkShort} />
                  </View>
                  <Text style={[styles.themeOptionTitle, { color: '#FFFFFF' }]}>Pure Black</Text>
                  <Text style={styles.themeOptionDesc}>Deep OLED Black</Text>
                  {theme === 'dark' && (
                    <View style={styles.themeActiveCheck}>
                      <AppIcon name="checkmark" size={11} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* OPD & Queue Notifications */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.sectionTitleRow}>
                <AppIcon name="notifications-outline" size={16} color={colors.whatsapp.primary} />
                <Text style={[styles.sectionTitle, { color: tc.text }]}>LIVE OPD & QUEUE NOTIFICATIONS</Text>
              </View>

              <View style={styles.settingToggleRow}>
                <View style={styles.settingToggleInfo}>
                  <Text style={[styles.settingLabel, { color: tc.text }]}>Live Queue Turn Chime</Text>
                  <Text style={[styles.settingSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    Play gentle audible chime when your appointment token is 2 positions away
                  </Text>
                </View>
                <Switch
                  value={queueChimeEnabled}
                  onValueChange={(val) => {
                    setQueueChimeEnabled(val);
                    showToast(val ? 'Turn Chime enabled' : 'Turn Chime silenced');
                  }}
                  trackColor={{ false: '#767577', true: colors.whatsapp.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.settingToggleRow}>
                <View style={styles.settingToggleInfo}>
                  <Text style={[styles.settingLabel, { color: tc.text }]}>SMS & WhatsApp Token Updates</Text>
                  <Text style={[styles.settingSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    Receive estimated wait time broadcasts directly via WhatsApp
                  </Text>
                </View>
                <Switch
                  value={smsTokenAlerts}
                  onValueChange={(val) => {
                    setSmsTokenAlerts(val);
                    showToast(val ? 'WhatsApp alerts enabled' : 'WhatsApp alerts paused');
                  }}
                  trackColor={{ false: '#767577', true: colors.whatsapp.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.settingToggleRow}>
                <View style={styles.settingToggleInfo}>
                  <Text style={[styles.settingLabel, { color: tc.text }]}>Diagnostic Scan Ready Alerts</Text>
                  <Text style={[styles.settingSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    Instant notification when radiologists sign off on lab & X-Ray reports
                  </Text>
                </View>
                <Switch
                  value={labReportAlerts}
                  onValueChange={(val) => {
                    setLabReportAlerts(val);
                    showToast(val ? 'Diagnostic scan alerts enabled' : 'Diagnostic scan alerts disabled');
                  }}
                  trackColor={{ false: '#767577', true: colors.whatsapp.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Privacy & Health ID Security */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.sectionTitleRow}>
                <AppIcon name="lock-closed-outline" size={16} color="#0284C7" />
                <Text style={[styles.sectionTitle, { color: tc.text }]}>PRIVACY & DIGITAL HEALTH VAULT</Text>
              </View>

              <View style={styles.settingToggleRow}>
                <View style={styles.settingToggleInfo}>
                  <Text style={[styles.settingLabel, { color: tc.text }]}>ABHA National Health ID Link</Text>
                  <Text style={[styles.settingSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    Linked: 91-8842-1092-4411 (Fast Consent & Seamless Rx Transfer)
                  </Text>
                </View>
                <View style={styles.verifiedTagSmall}>
                  <Text style={styles.verifiedTagSmallText}>LINKED</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.settingToggleRow}>
                <View style={styles.settingToggleInfo}>
                  <Text style={[styles.settingLabel, { color: tc.text }]}>Biometric Unlock (FaceID / TouchID)</Text>
                  <Text style={[styles.settingSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    Require biometric verification to view medical scans and prescriptions
                  </Text>
                </View>
                <Switch
                  value={biometricUnlock}
                  onValueChange={(val) => {
                    setBiometricUnlock(val);
                    showToast(val ? 'Biometrics active' : 'Biometrics bypassed');
                  }}
                  trackColor={{ false: '#767577', true: colors.whatsapp.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: tc.cardBorder }]} />

              <View style={styles.settingToggleRow}>
                <View style={styles.settingToggleInfo}>
                  <Text style={[styles.settingLabel, { color: tc.text }]}>Emergency SOS Medical Broadcast</Text>
                  <Text style={[styles.settingSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    Allow emergency responders instant read-access to blood group & allergy list
                  </Text>
                </View>
                <Switch
                  value={emergencySosSharing}
                  onValueChange={(val) => {
                    setEmergencySosSharing(val);
                    showToast(val ? 'Emergency SOS profile active' : 'Emergency SOS profile off');
                  }}
                  trackColor={{ false: '#767577', true: colors.whatsapp.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Account & Role Switcher */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.sectionTitleRow}>
                <AppIcon name="people-outline" size={16} color="#7C3AED" />
                <Text style={[styles.sectionTitle, { color: tc.text }]}>ACCOUNT & DEMO ROLE SWITCHER</Text>
              </View>

              <TouchableOpacity
                style={[styles.roleSwitchBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9', borderColor: tc.cardBorder }]}
                onPress={() => setShowRoleModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.roleSwitchBtnLeft}>
                  <AppIcon name="swap-horizontal" size={18} color={colors.whatsapp.primary} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={[styles.roleSwitchBtnTitle, { color: tc.text }]}>Switch Demo Role</Text>
                    <Text style={[styles.roleSwitchBtnSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                      Current: Patient ({user?.name || 'Gowri T'})
                    </Text>
                  </View>
                </View>
                <AppIcon name="chevron-forward" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================================
          MODAL 1: ITEMIZED DIGITAL INVOICE & RECEIPT MODAL
      ======================================================== */}
      {selectedInvoice && (
        <Modal visible={!!selectedInvoice} animationType="slide" transparent onRequestClose={() => setSelectedInvoice(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: tc.card }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: tc.text }]}>Official Medical Tax Receipt</Text>
                  <Text style={[styles.modalSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    {selectedInvoice.id} • {selectedInvoice.hospitalName}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedInvoice(null)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Hospital Header & Stamp */}
                <View style={[styles.receiptHeaderBox, { backgroundColor: isDark ? '#1C2E2A' : '#ECFDF5', borderColor: isDark ? '#234E44' : '#A7F3D0' }]}>
                  <Text style={[styles.receiptHospTitle, { color: tc.text }]}>{selectedInvoice.hospitalName}</Text>
                  <Text style={[styles.receiptHospSub, { color: isDark ? '#6EE7B7' : '#047857' }]}>
                    OPD Tax Receipt • Accredited Multispecialty Center
                  </Text>
                  <Text style={[styles.receiptDateLine, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    Date Issued: {selectedInvoice.invoiceDate} • Ref: {selectedInvoice.paymentReference}
                  </Text>
                </View>

                {/* Patient & Doctor Row */}
                <View style={styles.receiptTwoCol}>
                  <View style={styles.receiptCol}>
                    <Text style={styles.receiptColLabel}>BILLED TO</Text>
                    <Text style={[styles.receiptColVal, { color: tc.text }]}>{user?.name || 'Gowri T'}</Text>
                    <Text style={styles.receiptColSub}>ID: #RIO-9281 • Age 56, Female</Text>
                    <Text style={styles.receiptColSub}>Ins: Star Health #POL-STAR-8829104</Text>
                  </View>
                  <View style={styles.receiptCol}>
                    <Text style={styles.receiptColLabel}>ATTENDING SPECIALIST</Text>
                    <Text style={[styles.receiptColVal, { color: tc.text }]}>{selectedInvoice.doctorName}</Text>
                    <Text style={styles.receiptColSub}>{selectedInvoice.specialty}</Text>
                    <Text style={styles.receiptColSub}>{selectedInvoice.roomNumber}</Text>
                  </View>
                </View>

                {/* Itemized Services Breakdown */}
                <View style={[styles.receiptTable, { borderColor: tc.cardBorder }]}>
                  <View style={[styles.receiptTableRow, styles.receiptTableHead, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}>
                    <Text style={[styles.receiptTh, { flex: 2, color: tc.text }]}>Service Item</Text>
                    <Text style={[styles.receiptTh, { flex: 1, textAlign: 'right', color: tc.text }]}>Amount</Text>
                  </View>

                  <View style={[styles.receiptTableRow, { borderBottomColor: tc.cardBorder }]}>
                    <Text style={[styles.receiptTd, { flex: 2, color: tc.text }]}>
                      Doctor Consultation ({selectedInvoice.specialty})
                    </Text>
                    <Text style={[styles.receiptTd, { flex: 1, textAlign: 'right', color: tc.text }]}>
                      ₹{selectedInvoice.consultationFee}.00
                    </Text>
                  </View>

                  {selectedInvoice.diagnosticsFee > 0 && (
                    <View style={[styles.receiptTableRow, { borderBottomColor: tc.cardBorder }]}>
                      <Text style={[styles.receiptTd, { flex: 2, color: tc.text }]}>
                        Clinical Diagnostics & Scans
                      </Text>
                      <Text style={[styles.receiptTd, { flex: 1, textAlign: 'right', color: tc.text }]}>
                        ₹{selectedInvoice.diagnosticsFee}.00
                      </Text>
                    </View>
                  )}

                  {selectedInvoice.pharmacyFee > 0 && (
                    <View style={[styles.receiptTableRow, { borderBottomColor: tc.cardBorder }]}>
                      <Text style={[styles.receiptTd, { flex: 2, color: tc.text }]}>
                        Prescribed Pharmacy Dispensary
                      </Text>
                      <Text style={[styles.receiptTd, { flex: 1, textAlign: 'right', color: tc.text }]}>
                        ₹{selectedInvoice.pharmacyFee}.00
                      </Text>
                    </View>
                  )}

                  <View style={[styles.receiptTableRow, { borderBottomColor: tc.cardBorder, backgroundColor: isDark ? '#262626' : '#F8FAFC' }]}>
                    <Text style={[styles.receiptTdBold, { flex: 2, color: tc.text }]}>Total Gross Charges</Text>
                    <Text style={[styles.receiptTdBold, { flex: 1, textAlign: 'right', color: tc.text }]}>
                      ₹{selectedInvoice.totalGross}.00
                    </Text>
                  </View>

                  <View style={[styles.receiptTableRow, { borderBottomColor: tc.cardBorder }]}>
                    <Text style={[styles.receiptTd, { flex: 2, color: '#0284C7' }]}>
                      Less: Cashless Insurance Settlement (Star Health)
                    </Text>
                    <Text style={[styles.receiptTd, { flex: 1, textAlign: 'right', color: '#0284C7' }]}>
                      -₹{selectedInvoice.insuranceCovered}.00
                    </Text>
                  </View>

                  <View style={[styles.receiptTableRow, { backgroundColor: isDark ? '#1C2E2A' : '#ECFDF5' }]}>
                    <Text style={[styles.receiptTdFinal, { flex: 2, color: '#059669' }]}>
                      Net Out-of-Pocket Paid
                    </Text>
                    <Text style={[styles.receiptTdFinal, { flex: 1, textAlign: 'right', color: '#059669' }]}>
                      ₹{selectedInvoice.outOfPocketPaid}.00
                    </Text>
                  </View>
                </View>

                {/* Payment Method & Security Seal */}
                <View style={styles.sealRow}>
                  <View style={styles.sealBadge}>
                    <AppIcon name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.sealText}>Verified Payment: {selectedInvoice.paymentReference}</Text>
                  </View>
                </View>

                {/* Download PDF Action */}
                <TouchableOpacity
                  style={styles.modalDownloadBtn}
                  onPress={() => {
                    showToast(`Downloaded Official Tax Receipt (${selectedInvoice.id}.pdf)`);
                    setSelectedInvoice(null);
                  }}
                  activeOpacity={0.8}
                >
                  <AppIcon name="download-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.modalDownloadBtnText}>Download PDF Tax Receipt</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================
          MODAL 2: STATEMENT REPORT PREVIEW MODAL
      ======================================================== */}
      <Modal
        visible={showReportPreviewModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReportPreviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: tc.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: tc.text }]}>Patient Expense Statement</Text>
                <Text style={[styles.modalSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  Period: {reportFromDate} to {reportToDate}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowReportPreviewModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={[styles.statementSummaryBox, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9', borderColor: tc.cardBorder }]}>
                <Text style={[styles.statementHospName, { color: tc.text }]}>{selectedHospital.name}</Text>
                <Text style={[styles.statementMeta, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  Patient: {user?.name || 'Gowri T'} • Policy: POL-STAR-8829104
                </Text>
                <Text style={[styles.statementMeta, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  Generated on: Sep 26, 2026 • Format: {selectedFormat.toUpperCase()}
                </Text>

                <View style={styles.statementKpiRow}>
                  <View style={styles.statementKpiCol}>
                    <Text style={styles.statementKpiLabel}>Total Billed</Text>
                    <Text style={[styles.statementKpiVal, { color: tc.text }]}>₹{totalGrossExpense}</Text>
                  </View>
                  <View style={styles.statementKpiCol}>
                    <Text style={styles.statementKpiLabel}>Insurance Paid</Text>
                    <Text style={[styles.statementKpiVal, { color: '#0284C7' }]}>₹{totalInsuranceSettled}</Text>
                  </View>
                  <View style={styles.statementKpiCol}>
                    <Text style={styles.statementKpiLabel}>Your Out-of-Pocket</Text>
                    <Text style={[styles.statementKpiVal, { color: '#059669' }]}>₹{totalOutOfPocketPaid}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalDownloadBtn}
                onPress={() => {
                  showToast(`Exported medical statement as ${selectedFormat.toUpperCase()}`);
                  setShowReportPreviewModal(false);
                }}
                activeOpacity={0.8}
              >
                <AppIcon name="download-outline" size={16} color="#FFFFFF" />
                <Text style={styles.modalDownloadBtnText}>
                  Export & Share {selectedFormat.toUpperCase()} Statement
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================
          MODAL 3: SWITCH ROLE MODAL
      ======================================================== */}
      <Modal visible={showRoleModal} animationType="fade" transparent onRequestClose={() => setShowRoleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.roleSelectCard, { backgroundColor: tc.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.text }]}>Select Demo Role</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.roleOption, { borderColor: tc.cardBorder }]}
              onPress={() => {
                switchRole('patient');
                setShowRoleModal(false);
              }}
            >
              <Text style={[styles.roleOptionTitle, { color: tc.text }]}>👤 Patient (Gowri T)</Text>
              <Text style={styles.roleOptionSub}>Book doctor slots, view scans, manage OPD bills</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOption, { borderColor: tc.cardBorder }]}
              onPress={() => {
                switchRole('doctor');
                setShowRoleModal(false);
              }}
            >
              <Text style={[styles.roleOptionTitle, { color: tc.text }]}>👨‍⚕️ Doctor (Dr. Preetha Rajesh)</Text>
              <Text style={styles.roleOptionSub}>Manage live queue, digital prescriptions, edit availability</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOption, { borderColor: tc.cardBorder }]}
              onPress={() => {
                switchRole('receptionist');
                setShowRoleModal(false);
              }}
            >
              <Text style={[styles.roleOptionTitle, { color: tc.text }]}>📋 Receptionist (Kavitha Murugan)</Text>
              <Text style={styles.roleOptionSub}>Walk-ins, payments collection, document scanner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOption, { borderColor: tc.cardBorder }]}
              onPress={() => {
                switchRole('owner');
                setShowRoleModal(false);
              }}
            >
              <Text style={[styles.roleOptionTitle, { color: tc.text }]}>🏥 Hospital Owner (Dr. S. K. Arumugam)</Text>
              <Text style={styles.roleOptionSub}>Multi-hospital analytics, doctor performance, revenue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Patient Profile Info Modal */}
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
                <Text style={[styles.editModalTitle, { color: tc.text }]}>Edit Patient Profile</Text>
                <Text style={[styles.editModalSubtitle, { color: tc.textSecondary }]}>Personal demographics, contacts & insurance</Text>
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
                <Text style={styles.editInputLabel}>PATIENT FULL NAME</Text>
                <TextInput
                  style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Gowri T"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.editTwoCols}>
                <View style={[styles.editInputGroup, { flex: 0.8, marginRight: 8 }]}>
                  <Text style={styles.editInputLabel}>AGE (YRS)</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editAge}
                    onChangeText={setEditAge}
                    placeholder="56"
                    placeholderTextColor={tc.textTertiary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.editInputGroup, { flex: 1.2 }]}>
                  <Text style={styles.editInputLabel}>GENDER</Text>
                  <View style={styles.genderSelectRow}>
                    {(['female', 'male', 'other'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genderOptionPill,
                          { borderColor: tc.cardBorder },
                          editGender === g && { backgroundColor: colors.whatsapp.primary, borderColor: colors.whatsapp.primary },
                        ]}
                        onPress={() => setEditGender(g)}
                      >
                        <Text style={[styles.genderOptionText, { color: tc.text }, editGender === g && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                          {g === 'female' ? 'Female' : g === 'male' ? 'Male' : 'Other'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.editTwoCols}>
                <View style={[styles.editInputGroup, { flex: 1.2, marginRight: 8 }]}>
                  <Text style={styles.editInputLabel}>PHONE NUMBER</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="+91 98421 77650"
                    placeholderTextColor={tc.textTertiary}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={[styles.editInputGroup, { flex: 0.8 }]}>
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

              <View style={styles.editInputGroup}>
                <Text style={styles.editInputLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="patient@upstagehealth.com"
                  placeholderTextColor={tc.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.editInputGroup}>
                <Text style={styles.editInputLabel}>RESIDENTIAL ADDRESS</Text>
                <TextInput
                  style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="12 North Car Street, Vannarpettai, Tirunelveli"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.editInputGroup}>
                <Text style={styles.editInputLabel}>EMERGENCY CONTACT & PHONE</Text>
                <TextInput
                  style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editEmergencyContact}
                  onChangeText={setEditEmergencyContact}
                  placeholder="K. Thiyagarajan (Spouse) • +91 94431 88770"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.editTwoCols}>
                <View style={[styles.editInputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.editInputLabel}>INSURANCE PROVIDER</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editInsuranceProvider}
                    onChangeText={setEditInsuranceProvider}
                    placeholder="Star Health MediClassic"
                    placeholderTextColor={tc.textTertiary}
                  />
                </View>

                <View style={[styles.editInputGroup, { flex: 1 }]}>
                  <Text style={styles.editInputLabel}>POLICY NUMBER</Text>
                  <TextInput
                    style={[styles.editTextInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editInsurancePolicyNumber}
                    onChangeText={setEditInsurancePolicyNumber}
                    placeholder="POL-SH-7749102-TN"
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
        title="Update Patient Photo"
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
    zIndex: 999,
    backgroundColor: '#128C7E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 6,
    gap: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  // Native iOS Segmented Control Tabs
  segmentedControlWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iosSegmentContainer: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 3,
  },
  iosSegmentPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  iosSegmentPillActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  iosSegmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  iosSegmentTextActive: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  tabContentGroup: {
    gap: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: colors.whatsapp.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#059669',
    width: 18,
    height: 18,
    borderRadius: 9,
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
  userName: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  roleBadge: {
    backgroundColor: 'rgba(37, 211, 102, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.35)',
  },
  roleBadgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  patientIdText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  demographicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  demographicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  bloodDropIcon: {
    fontSize: 10,
  },
  demographicText: {
    fontSize: 11,
    fontWeight: '600',
  },
  physicianBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    gap: 10,
  },
  physicianIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  physicianInfo: {
    flex: 1,
  },
  physicianLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  physicianName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 7,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 0,
    marginRight: 12,
    paddingTop: 1,
  },
  infoValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  infoValueMultiline: {
    lineHeight: 17,
  },
  interactiveValRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  emergencyContactCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 5,
  },
  quickCallBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    flexShrink: 0,
  },
  quickCallText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  clinicalGroup: {
    paddingVertical: 4,
  },
  clinicalSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  allergyChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  allergyChipText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  conditionChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  conditionChipText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '600',
  },
  medsList: {
    gap: 4,
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletDot: {
    fontSize: 13,
    color: '#059669',
    fontWeight: 'bold',
  },
  medName: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  medDose: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  vitalCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  vitalVal: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  vitalUnit: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  statusPillActive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginLeft: 8,
  },
  statusPillActiveText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  // Invoices & KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  badgePill: {
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  tableWrap: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeaderRow: {
    paddingVertical: 8,
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: '800',
  },
  tableCellMain: {
    fontSize: 12,
    fontWeight: '700',
  },
  tableCellSub: {
    fontSize: 10,
  },
  tableCellNormal: {
    fontSize: 11,
  },
  tableCellBold: {
    fontSize: 11,
    fontWeight: '800',
  },
  tableStatusTag: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tableStatusTagText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
  },
  recordsList: {
    gap: 8,
  },
  invoiceRecordCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  invoiceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceDateText: {
    fontSize: 13,
    fontWeight: '800',
  },
  invoiceIdText: {
    fontSize: 11,
    marginTop: 1,
  },
  invoiceAmountCol: {
    alignItems: 'flex-end',
  },
  invoiceTotalText: {
    fontSize: 14,
    fontWeight: '800',
  },
  invoicePaidText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  invoiceBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  paymentMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  viewSlipActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewSlipActionText: {
    color: colors.whatsapp.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  // Statement generator
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  presetChipActive: {},
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateField: {
    flex: 1,
  },
  dateFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  dateInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  dateArrowWrap: {
    paddingTop: 16,
  },
  formatSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  formatLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  formatTabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 2,
  },
  formatTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  formatTabActive: {
    backgroundColor: '#FFFFFF',
  },
  formatTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  formatTabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  generateButton: {
    backgroundColor: colors.whatsapp.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  // Theme selector
  themeSelectorGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOptionCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    padding: 12,
    position: 'relative',
  },
  themeOptionCardActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  themePreviewLight: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    gap: 4,
    marginBottom: 8,
  },
  previewHeaderLight: {
    height: 8,
    width: '50%',
    backgroundColor: '#CBD5E1',
    borderRadius: 4,
  },
  previewLineLight: {
    height: 6,
    width: '90%',
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
  },
  previewLineLightShort: {
    height: 6,
    width: '60%',
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
  },
  themePreviewDark: {
    height: 48,
    backgroundColor: '#18181B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 6,
    gap: 4,
    marginBottom: 8,
  },
  previewHeaderDark: {
    height: 8,
    width: '50%',
    backgroundColor: '#3F3F46',
    borderRadius: 4,
  },
  previewLineDark: {
    height: 6,
    width: '90%',
    backgroundColor: '#27272A',
    borderRadius: 3,
  },
  previewLineDarkShort: {
    height: 6,
    width: '60%',
    backgroundColor: '#27272A',
    borderRadius: 3,
  },
  themeOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  themeOptionDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  themeActiveCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#059669',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Setting Toggles
  settingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingToggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 11,
    marginTop: 2,
  },
  verifiedTagSmall: {
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedTagSmallText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  roleSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleSwitchBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleSwitchBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleSwitchBtnSub: {
    fontSize: 11,
    marginTop: 1,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  roleSelectCard: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  modalScroll: {
    maxHeight: 480,
  },
  receiptHeaderBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  receiptHospTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  receiptHospSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  receiptDateLine: {
    fontSize: 10,
    marginTop: 4,
  },
  receiptTwoCol: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  receiptCol: {
    flex: 1,
  },
  receiptColLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  receiptColVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  receiptColSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  receiptTable: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  receiptTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  receiptTableHead: {
    paddingVertical: 8,
  },
  receiptTh: {
    fontSize: 11,
    fontWeight: '800',
  },
  receiptTd: {
    fontSize: 11,
  },
  receiptTdBold: {
    fontSize: 11,
    fontWeight: '800',
  },
  receiptTdFinal: {
    fontSize: 12,
    fontWeight: '900',
  },
  sealRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sealText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  modalDownloadBtn: {
    backgroundColor: colors.whatsapp.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  modalDownloadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  statementSummaryBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statementHospName: {
    fontSize: 14,
    fontWeight: '800',
  },
  statementMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  statementKpiRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CBD5E1',
  },
  statementKpiCol: {
    flex: 1,
  },
  statementKpiLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
  },
  statementKpiVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  roleOption: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  roleOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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
  genderSelectRow: {
    flexDirection: 'row',
    gap: 6,
    height: 42,
    alignItems: 'center',
  },
  genderOptionPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderOptionText: {
    fontSize: 11.5,
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
