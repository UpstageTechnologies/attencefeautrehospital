import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { useAppTheme } from '../../context/ThemeContext';
import { AppIcon } from '../../components/common/AppIcon';
import { PhotoPickerModal } from '../../components/profile/PhotoPickerModal';
import { UserRole } from '../../types';

type OwnerSubTab = 'profile' | 'hospitals' | 'settings';

export const OwnerProfileScreen: React.FC = () => {
  const { user, updateProfile, switchRole } = useAuth();
  const { hospitals, selectedHospital, selectHospital } = useHospital();
  const { setTheme, colors: tc, isDark } = useAppTheme();

  const [activeSubTab, setActiveSubTab] = useState<OwnerSubTab>('profile');
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const ownerProfile = user?.ownerProfile;

  // Edit form state
  const [editName, setEditName] = useState(user?.name || 'Dr. S. K. Arumugam');
  const [editTitle, setEditTitle] = useState(ownerProfile?.title || 'Managing Director & Founder');
  const [editQualification, setEditQualification] = useState(ownerProfile?.qualification || 'MBBS, MD, DMRD, FICR');
  const [editOrganization, setEditOrganization] = useState(ownerProfile?.organization || 'Rio Scan Center & Healthcare Group');
  const [editTaxId, setEditTaxId] = useState(ownerProfile?.taxId || 'GSTIN33AAACR7812M1Z2');
  const [editPhone, setEditPhone] = useState(user?.phone || '+91 94430 11223');
  const [editEmail, setEditEmail] = useState(user?.email || 'owner@rioscan.com');
  const [editAddress, setEditAddress] = useState(
    ownerProfile?.address || '14/2 South Bypass Road, Vannarpettai, Tirunelveli, Tamil Nadu 627003'
  );
  const [editContactPerson, setEditContactPerson] = useState(
    ownerProfile?.contactPerson || 'S. Ramanathan (Executive Secretary)'
  );
  const [editEmergencyContact, setEditEmergencyContact] = useState(
    ownerProfile?.emergencyContact || '+91 94430 99881'
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleOpenEditModal = () => {
    setEditName(user?.name || 'Dr. S. K. Arumugam');
    setEditTitle(user?.ownerProfile?.title || 'Managing Director & Founder');
    setEditQualification(user?.ownerProfile?.qualification || 'MBBS, MD, DMRD, FICR');
    setEditOrganization(user?.ownerProfile?.organization || 'Rio Scan Center & Healthcare Group');
    setEditTaxId(user?.ownerProfile?.taxId || 'GSTIN33AAACR7812M1Z2');
    setEditPhone(user?.phone || '+91 94430 11223');
    setEditEmail(user?.email || 'owner@rioscan.com');
    setEditAddress(user?.ownerProfile?.address || '14/2 South Bypass Road, Vannarpettai, Tirunelveli, Tamil Nadu 627003');
    setEditContactPerson(user?.ownerProfile?.contactPerson || 'S. Ramanathan (Executive Secretary)');
    setEditEmergencyContact(user?.ownerProfile?.emergencyContact || '+91 94430 99881');
    setShowEditModal(true);
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
      ownerProfile: {
        title: editTitle.trim(),
        qualification: editQualification.trim(),
        organization: editOrganization.trim(),
        taxId: editTaxId.trim(),
        address: editAddress.trim(),
        contactPerson: editContactPerson.trim(),
        emergencyContact: editEmergencyContact.trim(),
      },
    });

    setShowEditModal(false);
    showToast('Executive profile updated successfully! ✓');
  };

  const handleSaveAvatar = (newUri: string) => {
    updateProfile({ avatarUrl: newUri });
    showToast('Profile picture updated successfully! 📸');
  };

  const availableRoles: { role: UserRole; label: string; desc: string; icon: any }[] = [
    { role: 'receptionist', label: 'Receptionist', desc: 'Front Desk OPD & Token Management', icon: 'desktop-outline' },
    { role: 'doctor', label: 'Doctor', desc: 'Consultation Room & Patient Queues', icon: 'medkit-outline' },
    { role: 'patient', label: 'Patient', desc: 'Token Tracker, Scans & Hospital Explorer', icon: 'person-outline' },
    { role: 'owner', label: 'Hospital Owner', desc: 'Administrative & Executive Management', icon: 'business-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Toast Feedback */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <AppIcon name="checkmark" size={16} color="#FFFFFF" />
          <Text style={styles.toastText} numberOfLines={2}>
            {toastMessage}
          </Text>
        </View>
      )}

      {/* Segmented Control Tabs */}
      <View style={[styles.segmentedControlWrap, { backgroundColor: tc.background, borderBottomColor: tc.cardBorder }]}>
        <View style={[styles.iosSegmentContainer, { backgroundColor: isDark ? '#2C2C2E' : '#E3E3E8' }]}>
          <TouchableOpacity
            style={[styles.iosSegmentPill, activeSubTab === 'profile' && [styles.iosSegmentPillActive, { backgroundColor: isDark ? '#636366' : '#FFFFFF' }]]}
            onPress={() => setActiveSubTab('profile')}
            activeOpacity={0.8}
          >
            <Text style={[styles.iosSegmentText, { color: isDark ? '#9CA3AF' : '#64748B' }, activeSubTab === 'profile' && [styles.iosSegmentTextActive, { color: tc.text }]]}>
              Executive Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iosSegmentPill, activeSubTab === 'hospitals' && [styles.iosSegmentPillActive, { backgroundColor: isDark ? '#636366' : '#FFFFFF' }]]}
            onPress={() => setActiveSubTab('hospitals')}
            activeOpacity={0.8}
          >
            <Text style={[styles.iosSegmentText, { color: isDark ? '#9CA3AF' : '#64748B' }, activeSubTab === 'hospitals' && [styles.iosSegmentTextActive, { color: tc.text }]]}>
              Hospitals ({hospitals.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iosSegmentPill, activeSubTab === 'settings' && [styles.iosSegmentPillActive, { backgroundColor: isDark ? '#636366' : '#FFFFFF' }]]}
            onPress={() => setActiveSubTab('settings')}
            activeOpacity={0.8}
          >
            <Text style={[styles.iosSegmentText, { color: isDark ? '#9CA3AF' : '#64748B' }, activeSubTab === 'settings' && [styles.iosSegmentTextActive, { color: tc.text }]]}>
              Settings & Roles
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ========================================================
            TAB 1: EXECUTIVE PROFILE
        ======================================================== */}
        {activeSubTab === 'profile' && (
          <View style={styles.tabContentGroup}>
            {/* Identity Card */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.headerRow}>
                <View style={styles.avatarWrap}>
                  <Image
                    source={{
                      uri:
                        user?.avatarUrl ||
                        'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
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
                    <Text style={[styles.profileName, { color: tc.text }]} numberOfLines={1}>
                      {user?.name || 'Dr. S. K. Arumugam'}
                    </Text>
                    <View style={styles.executiveBadge}>
                      <Text style={styles.executiveBadgeText}>Owner</Text>
                    </View>
                  </View>

                  <Text style={[styles.profileRole, { color: tc.textSecondary }]}>
                    {user?.ownerProfile?.title || 'Managing Director & Founder'}
                  </Text>
                  <Text style={[styles.profileOrg, { color: colors.whatsapp.primary }]}>
                    {user?.ownerProfile?.organization || 'Rio Scan Center & Healthcare Group'}
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

            {/* Corporate & Professional Credentials */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#EDE9FE' }]}>
                    <AppIcon name="ribbon-outline" size={18} color="#7C3AED" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Corporate & Clinical Credentials</Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>Qualifications & Institutional Registrations</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cleanList}>
                <View style={[styles.stackedBlock, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.fieldLabel}>MEDICAL QUALIFICATIONS</Text>
                  <Text style={[styles.fieldValueBold, { color: tc.text }]}>
                    {user?.ownerProfile?.qualification || 'MBBS, MD, DMRD, FICR'}
                  </Text>
                  <Text style={[styles.fieldSubhint, { color: tc.textSecondary }]}>Fellow of Indian College of Radiology</Text>
                </View>

                <View style={styles.twoColumnGrid}>
                  <View style={[styles.gridCol, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    <Text style={styles.fieldLabel}>GSTIN / TAX IDENTIFIER</Text>
                    <Text style={[styles.fieldValueBold, { color: tc.text }]}>
                      {user?.ownerProfile?.taxId || 'GSTIN33AAACR7812M1Z2'}
                    </Text>
                    <Text style={[styles.fieldSubhint, { color: '#059669' }]}>Active & Verified</Text>
                  </View>

                  <View style={[styles.gridCol, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    <Text style={styles.fieldLabel}>CORPORATE REGISTRY</Text>
                    <Text style={[styles.fieldValueBold, { color: tc.text }]}>CIN-U85110TN2015</Text>
                    <Text style={[styles.fieldSubhint, { color: tc.textSecondary }]}>Registrar of Companies, TN</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Executive Contact & Secretariat */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#E0F2FE' }]}>
                    <AppIcon name="call-outline" size={18} color="#0284C7" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Executive Secretariat & Contacts</Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>Direct channels and corporate secretariat</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cleanList}>
                <View style={styles.twoColumnGrid}>
                  <View style={[styles.gridCol, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    <Text style={styles.fieldLabel}>DIRECT PHONE</Text>
                    <Text style={[styles.fieldValueBold, { color: tc.text }]}>{user?.phone || '+91 94430 11223'}</Text>
                  </View>
                  <View style={[styles.gridCol, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    <Text style={styles.fieldLabel}>EXECUTIVE EMAIL</Text>
                    <Text style={[styles.fieldValueBold, { color: tc.text }]}>{user?.email || 'owner@rioscan.com'}</Text>
                  </View>
                </View>

                <View style={styles.twoColumnGrid}>
                  <View style={[styles.gridCol, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    <Text style={styles.fieldLabel}>EXECUTIVE SECRETARY</Text>
                    <Text style={[styles.fieldValueBold, { color: tc.text }]}>
                      {user?.ownerProfile?.contactPerson || 'S. Ramanathan (Executive Secretary)'}
                    </Text>
                  </View>
                  <View style={[styles.gridCol, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    <Text style={styles.fieldLabel}>EMERGENCY ESCALATION</Text>
                    <Text style={[styles.fieldValueBold, { color: tc.text }]}>
                      {user?.ownerProfile?.emergencyContact || '+91 94430 99881'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.stackedBlock, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                  <Text style={styles.fieldLabel}>HEADQUARTERS ADDRESS</Text>
                  <Text style={[styles.fieldValueBold, { color: tc.text }]}>
                    {user?.ownerProfile?.address || '14/2 South Bypass Road, Vannarpettai, Tirunelveli, Tamil Nadu 627003'}
                  </Text>
                  <Text style={[styles.fieldSubhint, { color: tc.textSecondary }]}>Registered Corporate Headquarters • Tirunelveli</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================
            TAB 2: HOSPITALS & FACILITIES
        ======================================================== */}
        {activeSubTab === 'hospitals' && (
          <View style={styles.tabContentGroup}>
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#DCFCE7' }]}>
                    <AppIcon name="business-outline" size={18} color="#16A34A" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Hospital Network & Facilities</Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>
                      Tap a facility to switch active administration context
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.hospitalsList}>
                {hospitals.map((hosp) => {
                  const isSelected = selectedHospital.id === hosp.id;
                  return (
                    <TouchableOpacity
                      key={hosp.id}
                      style={[
                        styles.hospitalCardItem,
                        {
                          backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC',
                          borderColor: isSelected ? colors.whatsapp.primary : tc.cardBorder,
                        },
                        isSelected && {
                          backgroundColor: isDark ? 'rgba(37, 211, 102, 0.12)' : 'rgba(18, 140, 126, 0.06)',
                        },
                      ]}
                      onPress={() => {
                        selectHospital(hosp.id);
                        showToast(`Active management set to ${hosp.name}`);
                      }}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri: hosp.imageUrl }} style={styles.hospCardThumb} />
                      <View style={styles.hospCardInfo}>
                        <View style={styles.hospCardTitleRow}>
                          <Text style={[styles.hospCardTitle, { color: tc.text }, isSelected && { color: colors.whatsapp.primary }]}>
                            {hosp.name}
                          </Text>
                          {isSelected && (
                            <View style={styles.activeHospBadge}>
                              <Text style={styles.activeHospBadgeText}>Active Facility</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.hospCardTagline, { color: tc.textSecondary }]} numberOfLines={1}>
                          {hosp.tagline}
                        </Text>
                        <Text style={[styles.hospCardAddress, { color: tc.textSecondary }]}>
                          📍 {hosp.address}, {hosp.city}
                        </Text>
                        <View style={styles.hospCardFooter}>
                          <Text style={styles.hospCardStats}>
                            ⭐ {hosp.rating} ({hosp.reviewCount} reviews) • {hosp.totalDoctors} Doctors
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ========================================================
            TAB 3: SETTINGS & ROLE SWITCHER
        ======================================================== */}
        {activeSubTab === 'settings' && (
          <View style={styles.tabContentGroup}>
            {/* App Color Theme */}
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

              <View style={styles.themeCardsRow}>
                {/* Light Mode */}
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

                {/* Dark Mode */}
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
                  <Text style={styles.themeOptionSub}>Dark Mode</Text>
                  {isDark && (
                    <View style={[styles.themeSelectedCheck, { backgroundColor: '#25D366' }]}>
                      <AppIcon name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Fast Role Switcher */}
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#FEF3C7' }]}>
                    <AppIcon name="swap-horizontal-outline" size={18} color="#D97706" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Switch Operational Role</Text>
                    <Text style={[styles.cardSubtitle, { color: tc.textSecondary }]}>
                      Preview reception desk, doctor consultation room, or patient flow
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.rolesGrid}>
                {availableRoles.map((item) => (
                  <TouchableOpacity
                    key={item.role}
                    style={[
                      styles.roleTile,
                      { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder },
                      item.role === 'owner' && { borderColor: colors.whatsapp.primary, borderWidth: 1.5 },
                    ]}
                    onPress={() => {
                      if (item.role !== 'owner') {
                        switchRole(item.role);
                        showToast(`Switched into ${item.label} mode`);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.roleTileIconWrap}>
                      <AppIcon name={item.icon} size={20} color={item.role === 'owner' ? colors.whatsapp.primary : tc.text} />
                    </View>
                    <Text style={[styles.roleTileLabel, { color: tc.text }]}>{item.label}</Text>
                    <Text style={[styles.roleTileDesc, { color: tc.textSecondary }]}>{item.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Edit Profile Info Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={[styles.modalHandle, { backgroundColor: isDark ? '#3A3A3C' : '#E2E8F0' }]} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: tc.text }]}>Edit Executive Profile</Text>
                <Text style={[styles.modalSub, { color: tc.textSecondary }]}>Update leadership credentials & contacts</Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}
                onPress={() => setShowEditModal(false)}
              >
                <AppIcon name="close" size={18} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Dr. S. K. Arumugam"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EXECUTIVE TITLE</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Managing Director & Founder"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ORGANIZATION / HOSPITAL GROUP</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editOrganization}
                  onChangeText={setEditOrganization}
                  placeholder="Rio Scan Center & Healthcare Group"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>QUALIFICATIONS</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editQualification}
                  onChangeText={setEditQualification}
                  placeholder="MBBS, MD, DMRD, FICR"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GSTIN / TAX ID</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editTaxId}
                  onChangeText={setEditTaxId}
                  placeholder="GSTIN33AAACR7812M1Z2"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>DIRECT PHONE</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="+91 94430 11223"
                    placeholderTextColor={tc.textTertiary}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>EXECUTIVE EMAIL</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="owner@rioscan.com"
                    placeholderTextColor={tc.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>HEADQUARTERS ADDRESS</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="14/2 South Bypass Road, Vannarpettai, Tirunelveli"
                  placeholderTextColor={tc.textTertiary}
                />
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>SECRETARY / ASSISTANT</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editContactPerson}
                    onChangeText={setEditContactPerson}
                    placeholder="S. Ramanathan"
                    placeholderTextColor={tc.textTertiary}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>EMERGENCY CONTACT</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', color: tc.text, borderColor: tc.cardBorder }]}
                    value={editEmergencyContact}
                    onChangeText={setEditEmergencyContact}
                    placeholder="+91 94430 99881"
                    placeholderTextColor={tc.textTertiary}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: tc.cardBorder }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.cancelBtnText, { color: tc.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Picker Modal */}
      <PhotoPickerModal
        visible={showPhotoPicker}
        currentAvatarUrl={user?.avatarUrl}
        title="Update Executive Profile Photo"
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
    backgroundColor: '#075E54',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  segmentedControlWrap: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  iosSegmentContainer: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2,
  },
  iosSegmentPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  iosSegmentPillActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  iosSegmentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  iosSegmentTextActive: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 110,
  },
  tabContentGroup: {
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.whatsapp.primary,
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.whatsapp.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
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
    gap: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  executiveBadge: {
    backgroundColor: '#075E54',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  executiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  profileRole: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  profileOrg: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
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
  cardHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  cleanList: {
    gap: 10,
  },
  stackedBlock: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  fieldValueBold: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldSubhint: {
    fontSize: 11,
    marginTop: 2,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCol: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  hospitalsList: {
    gap: 10,
  },
  hospitalCardItem: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
    gap: 10,
  },
  hospCardThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  hospCardInfo: {
    flex: 1,
  },
  hospCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hospCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  activeHospBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeHospBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  hospCardTagline: {
    fontSize: 11,
    marginTop: 2,
  },
  hospCardAddress: {
    fontSize: 10.5,
    marginTop: 3,
  },
  hospCardFooter: {
    marginTop: 4,
  },
  hospCardStats: {
    fontSize: 10.5,
    color: '#D97706',
    fontWeight: '600',
  },
  themeCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOptionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    position: 'relative',
  },
  themeOptionCardSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  themePreviewLight: {
    height: 38,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 6,
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
  },
  previewBarLight: {
    height: 6,
    backgroundColor: '#075E54',
    borderRadius: 3,
    width: '60%',
  },
  previewBoxLight: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  themePreviewDark: {
    height: 38,
    backgroundColor: '#0A0A0C',
    borderRadius: 8,
    padding: 6,
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
  },
  previewBarDark: {
    height: 6,
    backgroundColor: '#25D366',
    borderRadius: 3,
    width: '60%',
  },
  previewBoxDark: {
    height: 10,
    backgroundColor: '#27272A',
    borderRadius: 4,
  },
  themeOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  themeOptionSub: {
    fontSize: 10.5,
    color: '#9CA3AF',
    marginTop: 1,
  },
  themeSelectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.whatsapp.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roleTile: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleTileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(18, 140, 126, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleTileLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleTileDesc: {
    fontSize: 10.5,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
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
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSub: {
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
  modalScroll: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  rowTwoCols: {
    flexDirection: 'row',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: colors.whatsapp.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
