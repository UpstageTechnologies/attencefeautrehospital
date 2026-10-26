import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';
import { AppIcon } from '../../components/common/AppIcon';
import { RegisterData } from '../../services/firebaseAuthService';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onQuickDemo?: (role: UserRole) => void;
}

interface RoleOption {
  key: UserRole;
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  icon: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    key: 'owner',
    title: 'Hospital Owner',
    subtitle: 'Clinic admin, payroll & staff master',
    badge: '👑 ADMIN',
    color: '#059669',
    icon: 'business-outline',
  },
  {
    key: 'doctor',
    title: 'Doctor / Specialist',
    subtitle: 'OPD queue, reports & prescriptions',
    badge: '🩺 CLINICAL',
    color: '#2563EB',
    icon: 'medkit-outline',
  },
  {
    key: 'receptionist',
    title: 'Front Desk Reception',
    subtitle: 'Walk-ins, billing & token dispatch',
    badge: '📋 DESK',
    color: '#7C3AED',
    icon: 'clipboard-outline',
  },
  {
    key: 'patient',
    title: 'Patient',
    subtitle: 'Token pass, appointments & vault',
    badge: '👤 PATIENT',
    color: '#0284C7',
    icon: 'person-outline',
  },
  {
    key: 'delivery',
    title: 'Delivery Courier',
    subtitle: 'Film delivery & GPS dispatch',
    badge: '🛵 LOGISTICS',
    color: '#D97706',
    icon: 'bicycle-outline',
  },
];

const SPECIALTY_OPTIONS = [
  'General Medicine',
  'Radiology (MRI/CT)',
  'Orthopedics & Joint Care',
  'Pediatrics & Child Care',
  'Cardiology',
  'Pathology & Lab Diagnostics',
  'Dermatology',
  'ENT & Ophthalmology',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
  onQuickDemo,
}) => {
  const { register, switchRole } = useAuth();
  const { colors: tc, isDark } = useAppTheme();

  // Selected Role
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');

  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Owner Fields
  const [organizationName, setOrganizationName] = useState('');
  const [city, setCity] = useState('Tirunelveli, Tamil Nadu');
  const [hospitalAddress, setHospitalAddress] = useState('');

  // Doctor Fields
  const [specialty, setSpecialty] = useState(SPECIALTY_OPTIONS[0]);
  const [qualification, setQualification] = useState('MBBS, MD');
  const [roomNumber, setRoomNumber] = useState('Room 101');
  const [consultationFee, setConsultationFee] = useState('500');

  // Receptionist Fields
  const [deskNumber, setDeskNumber] = useState('Counter 1');
  const [shift, setShift] = useState<'morning' | 'evening' | 'night'>('morning');

  // Patient Fields
  const [age, setAge] = useState('28');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [patientAddress, setPatientAddress] = useState('');

  // Delivery Fields
  const [vehicleType, setVehicleType] = useState<'bike' | 'scooter' | 'van'>('bike');
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async () => {
    // Basic validation
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must contain at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-type your password.');
      return;
    }

    if (selectedRole === 'owner' && !organizationName.trim()) {
      setErrorMessage('Please enter your hospital, clinic or diagnostic center name.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const regData: RegisterData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        phone: phone.trim(),
        role: selectedRole,
        // Role specifics
        organizationName: organizationName.trim() || `${name.trim()}'s Healthcare`,
        city: city.trim(),
        address: selectedRole === 'owner' ? hospitalAddress.trim() : patientAddress.trim(),
        specialty,
        qualification,
        roomNumber: roomNumber.trim() || 'Room 101',
        consultationFee: Number(consultationFee) || 500,
        deskNumber: deskNumber.trim() || 'Counter 1',
        shift,
        age: Number(age) || 30,
        gender,
        bloodGroup,
        vehicleType,
        vehicleNumber: vehicleNumber.trim() || 'TN-72-AB-1234',
      };

      const result = await register(regData);

      if (result.success) {
        setSuccessMessage('Account created successfully! Loading your fresh workspace...');
      } else {
        setErrorMessage(result.error || 'Failed to create account. Please check details.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRoleMeta = ROLE_OPTIONS.find((r) => r.key === selectedRole) || ROLE_OPTIONS[3];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#0B131E' : '#F8FAFC' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Navigation Bar / Top Row */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.backPill, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: tc.cardBorder }]}
            onPress={onNavigateToLogin}
          >
            <AppIcon name="arrow-back" size={16} color={tc.text} />
            <Text style={[styles.backPillText, { color: tc.text }]}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.badgeContainer}>
            <View style={styles.liveBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.liveBadgeText}>FRESH ACCOUNT</Text>
            </View>
          </View>
        </View>

        {/* Header Text */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: tc.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
            Sign up for a fresh account with a clean, live feed. No dummy data will be loaded.
          </Text>
        </View>

        {/* ROLE SELECTOR CARDS */}
        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>
          SELECT YOUR ACCOUNT TYPE
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roleScroll}
        >
          {ROLE_OPTIONS.map((r) => {
            const isSelected = selectedRole === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? '#1E293B'
                        : '#FFFFFF'
                      : isDark
                      ? '#131B26'
                      : '#F1F5F9',
                    borderColor: isSelected ? r.color : tc.cardBorder,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  setSelectedRole(r.key);
                  setErrorMessage('');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.roleCardHeader}>
                  <View style={[styles.roleIconCircle, { backgroundColor: isSelected ? r.color : (isDark ? '#243248' : '#E2E8F0') }]}>
                    <AppIcon
                      name={r.icon as any}
                      size={18}
                      color={isSelected ? '#FFFFFF' : tc.textSecondary}
                    />
                  </View>
                  {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: r.color }]}>
                      <AppIcon name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text style={[styles.roleCardTitle, { color: tc.text }]}>{r.title}</Text>
                <Text style={[styles.roleCardSub, { color: tc.textSecondary }]} numberOfLines={2}>
                  {r.subtitle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Error / Success Banners */}
        {!!errorMessage && (
          <View style={styles.errorBox}>
            <AppIcon name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {!!successMessage && (
          <View style={styles.successBox}>
            <AppIcon name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* MAIN REGISTRATION FORM */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          {/* Header Info Pill */}
          <View style={[styles.rolePillHeader, { backgroundColor: isDark ? '#1E293B' : '#F0FDF4', borderColor: selectedRoleMeta.color }]}>
            <AppIcon name={selectedRoleMeta.icon as any} size={16} color={selectedRoleMeta.color} />
            <Text style={[styles.rolePillHeaderText, { color: selectedRoleMeta.color }]}>
              Signing up as: {selectedRoleMeta.title} ({selectedRoleMeta.badge})
            </Text>
          </View>

          {/* SECTION 1: Credentials */}
          <Text style={[styles.groupTitle, { color: tc.text }]}>1. Contact & Credentials</Text>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: tc.textSecondary }]}>FULL NAME *</Text>
            <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
              <AppIcon name="person-outline" size={18} color={tc.textSecondary} />
              <TextInput
                style={[styles.input, { color: tc.text }]}
                placeholder={
                  selectedRole === 'doctor'
                    ? 'e.g. Dr. Preetha Rajesh'
                    : selectedRole === 'owner'
                    ? 'e.g. Rajesh Sundaram, MD'
                    : 'e.g. Gowri Thangavel'
                }
                placeholderTextColor={tc.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: tc.textSecondary }]}>EMAIL ADDRESS *</Text>
            <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
              <AppIcon name="mail-outline" size={18} color={tc.textSecondary} />
              <TextInput
                style={[styles.input, { color: tc.text }]}
                placeholder="name@example.com"
                placeholderTextColor={tc.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: tc.textSecondary }]}>MOBILE NUMBER (10 DIGITS) *</Text>
            <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
              <Text style={[styles.countryCode, { color: tc.text }]}>+91</Text>
              <TextInput
                style={[styles.input, { color: tc.text }]}
                placeholder="98421 XXXXX"
                placeholderTextColor={tc.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: tc.textSecondary }]}>PASSWORD (MIN 6 CHARACTERS) *</Text>
            <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
              <AppIcon name="lock-closed-outline" size={18} color={tc.textSecondary} />
              <TextInput
                style={[styles.input, { color: tc.text }]}
                placeholder="Create secure password"
                placeholderTextColor={tc.textTertiary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <AppIcon
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={tc.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: tc.textSecondary }]}>CONFIRM PASSWORD *</Text>
            <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
              <AppIcon name="shield-checkmark-outline" size={18} color={tc.textSecondary} />
              <TextInput
                style={[styles.input, { color: tc.text }]}
                placeholder="Re-type password"
                placeholderTextColor={tc.textTertiary}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          {/* SECTION 2: Role Specific Fields */}
          <View style={styles.divider} />
          <Text style={[styles.groupTitle, { color: tc.text }]}>
            2. {selectedRoleMeta.title} Profile
          </Text>

          {/* OWNER SPECIFIC */}
          {selectedRole === 'owner' && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: tc.textSecondary }]}>HOSPITAL / CLINIC NAME *</Text>
                <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
                  <AppIcon name="business-outline" size={18} color={tc.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: tc.text }]}
                    placeholder="e.g. Apex Multispecialty Hospital"
                    placeholderTextColor={tc.textTertiary}
                    value={organizationName}
                    onChangeText={setOrganizationName}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: tc.textSecondary }]}>CITY & STATE</Text>
                <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
                  <AppIcon name="location-outline" size={18} color={tc.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: tc.text }]}
                    placeholder="e.g. Tirunelveli, Tamil Nadu"
                    placeholderTextColor={tc.textTertiary}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: tc.textSecondary }]}>STREET ADDRESS</Text>
                <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
                  <AppIcon name="map-outline" size={18} color={tc.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: tc.text }]}
                    placeholder="e.g. 14 South Bypass Road, Vannarpettai"
                    placeholderTextColor={tc.textTertiary}
                    value={hospitalAddress}
                    onChangeText={setHospitalAddress}
                  />
                </View>
              </View>
            </>
          )}

          {/* DOCTOR SPECIFIC */}
          {selectedRole === 'doctor' && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: tc.textSecondary }]}>MEDICAL SPECIALTY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                  {SPECIALTY_OPTIONS.map((spec) => (
                    <TouchableOpacity
                      key={spec}
                      style={[
                        styles.specPill,
                        {
                          backgroundColor: specialty === spec ? '#2563EB' : isDark ? '#1E293B' : '#E2E8F0',
                        },
                      ]}
                      onPress={() => setSpecialty(spec)}
                    >
                      <Text
                        style={[
                          styles.specPillText,
                          { color: specialty === spec ? '#FFFFFF' : tc.text },
                        ]}
                      >
                        {spec}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: tc.textSecondary }]}>CABIN / ROOM</Text>
                  <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: tc.text }]}
                      placeholder="Room 101"
                      placeholderTextColor={tc.textTertiary}
                      value={roomNumber}
                      onChangeText={setRoomNumber}
                    />
                  </View>
                </View>

                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: tc.textSecondary }]}>CONSULTATION FEE (₹)</Text>
                  <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
                    <Text style={[styles.currencyPrefix, { color: tc.text }]}>₹</Text>
                    <TextInput
                      style={[styles.input, { color: tc.text }]}
                      placeholder="500"
                      placeholderTextColor={tc.textTertiary}
                      keyboardType="number-pad"
                      value={consultationFee}
                      onChangeText={setConsultationFee}
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          {/* RECEPTIONIST SPECIFIC */}
          {selectedRole === 'receptionist' && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: tc.textSecondary }]}>FRONT DESK / COUNTER NUMBER</Text>
                <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
                  <AppIcon name="desktop-outline" size={18} color={tc.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: tc.text }]}
                    placeholder="e.g. Counter 01 (Ground Floor)"
                    placeholderTextColor={tc.textTertiary}
                    value={deskNumber}
                    onChangeText={setDeskNumber}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: tc.textSecondary }]}>ASSIGNED SHIFT</Text>
                <View style={styles.pillRow}>
                  {(['morning', 'evening', 'night'] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.shiftPill,
                        {
                          backgroundColor: shift === s ? '#7C3AED' : isDark ? '#1E293B' : '#E2E8F0',
                        },
                      ]}
                      onPress={() => setShift(s)}
                    >
                      <Text
                        style={[
                          styles.shiftPillText,
                          { color: shift === s ? '#FFFFFF' : tc.text },
                        ]}
                      >
                        {s.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* PATIENT SPECIFIC */}
          {selectedRole === 'patient' && (
            <>
              <View style={styles.rowFields}>
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: tc.textSecondary }]}>AGE</Text>
                  <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: tc.text }]}
                      placeholder="28"
                      placeholderTextColor={tc.textTertiary}
                      keyboardType="number-pad"
                      maxLength={3}
                      value={age}
                      onChangeText={setAge}
                    />
                  </View>
                </View>

                <View style={[styles.fieldGroup, { flex: 1.5, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: tc.textSecondary }]}>GENDER</Text>
                  <View style={styles.pillRow}>
                    {(['male', 'female', 'other'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genderPill,
                          {
                            backgroundColor: gender === g ? '#0284C7' : isDark ? '#1E293B' : '#E2E8F0',
                          },
                        ]}
                        onPress={() => setGender(g)}
                      >
                        <Text
                          style={[
                            styles.genderPillText,
                            { color: gender === g ? '#FFFFFF' : tc.text },
                          ]}
                        >
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: tc.textSecondary }]}>BLOOD GROUP</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                  {BLOOD_GROUPS.map((bg) => (
                    <TouchableOpacity
                      key={bg}
                      style={[
                        styles.bgPill,
                        {
                          backgroundColor: bloodGroup === bg ? '#DC2626' : isDark ? '#1E293B' : '#E2E8F0',
                        },
                      ]}
                      onPress={() => setBloodGroup(bg)}
                    >
                      <Text
                        style={[
                          styles.bgPillText,
                          { color: bloodGroup === bg ? '#FFFFFF' : tc.text },
                        ]}
                      >
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: tc.textSecondary }]}>RESIDENTIAL ADDRESS / CITY</Text>
                <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
                  <AppIcon name="home-outline" size={18} color={tc.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: tc.text }]}
                    placeholder="e.g. Vannarpettai, Tirunelveli"
                    placeholderTextColor={tc.textTertiary}
                    value={patientAddress}
                    onChangeText={setPatientAddress}
                  />
                </View>
              </View>
            </>
          )}

          {/* DELIVERY SPECIFIC */}
          {selectedRole === 'delivery' && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: tc.textSecondary }]}>VEHICLE TYPE</Text>
                <View style={styles.pillRow}>
                  {(['bike', 'scooter', 'van'] as const).map((vt) => (
                    <TouchableOpacity
                      key={vt}
                      style={[
                        styles.shiftPill,
                        {
                          backgroundColor: vehicleType === vt ? '#D97706' : isDark ? '#1E293B' : '#E2E8F0',
                        },
                      ]}
                      onPress={() => setVehicleType(vt)}
                    >
                      <Text
                        style={[
                          styles.shiftPillText,
                          { color: vehicleType === vt ? '#FFFFFF' : tc.text },
                        ]}
                      >
                        {vt.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: tc.textSecondary }]}>VEHICLE REGISTRATION NUMBER</Text>
                <View style={[styles.inputWrap, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
                  <AppIcon name="car-outline" size={18} color={tc.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: tc.text }]}
                    placeholder="e.g. TN-72-AX-8910"
                    placeholderTextColor={tc.textTertiary}
                    value={vehicleNumber}
                    onChangeText={setVehicleNumber}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: selectedRoleMeta.color }]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Create Fresh Account</Text>
                <AppIcon name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation Prompts */}
        <View style={styles.bottomPromptRow}>
          <Text style={[styles.bottomPromptText, { color: tc.textSecondary }]}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={[styles.bottomPromptLink, { color: colors.whatsapp.primary }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Mode Bypass Card */}
        <TouchableOpacity
          style={[styles.demoBypassCard, { backgroundColor: isDark ? '#14251D' : '#F0FDF4', borderColor: '#86EFAC' }]}
          onPress={() => {
            if (onQuickDemo) {
              onQuickDemo(selectedRole);
            } else {
              switchRole(selectedRole);
            }
          }}
        >
          <View style={styles.demoBypassLeft}>
            <Text style={styles.demoBypassEmoji}>⚡</Text>
            <View>
              <Text style={[styles.demoBypassTitle, { color: '#047857' }]}>
                Just exploring? Try 1-Tap Demo Mode
              </Text>
              <Text style={styles.demoBypassSub}>
                Instant access pre-populated with 80 staff members & sample records
              </Text>
            </View>
          </View>
          <AppIcon name="chevron-forward" size={18} color="#059669" />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 40,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  backPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  roleScroll: {
    gap: 10,
    paddingBottom: 16,
  },
  roleCard: {
    width: 145,
    padding: 12,
    borderRadius: 14,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  roleCardSub: {
    fontSize: 11,
    lineHeight: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  rolePillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  rolePillHeaderText: {
    fontSize: 13,
    fontWeight: '700',
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  rowFields: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '700',
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '700',
  },
  pillScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  specPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginRight: 8,
  },
  specPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shiftPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  shiftPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  genderPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  genderPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bgPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    marginRight: 8,
  },
  bgPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 14,
  },
  successText: {
    color: '#15803D',
    fontSize: 13,
    flex: 1,
    fontWeight: '600',
  },
  bottomPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 18,
  },
  bottomPromptText: {
    fontSize: 14,
  },
  bottomPromptLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  demoBypassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  demoBypassLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  demoBypassEmoji: {
    fontSize: 22,
  },
  demoBypassTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  demoBypassSub: {
    fontSize: 11,
    color: '#059669',
  },
});
