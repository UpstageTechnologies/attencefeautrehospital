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
import { firebaseAuthService } from '../../services/firebaseAuthService';
import { RIO_SCAN_CENTER_INFO } from '../../services/rioStaffSeedData';

interface LoginScreenProps {
  onOpenFaceKiosk?: () => void;
  onNavigateToRegister?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onOpenFaceKiosk,
  onNavigateToRegister,
}) => {
  const { login } = useAuth();
  const { colors: tc, isDark } = useAppTheme();

  // Active Login Tab
  const [activeTab, setActiveTab] = useState<'staff' | 'patient' | 'demo'>('staff');

  // Staff Form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Patient Phone Form
  const [phoneNumber, setPhoneNumber] = useState('');
  const [patientName, setPatientName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleStaffLogin = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Please enter your Staff ID or registered Email.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password or PIN.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = await firebaseAuthService.loginWithCredentials(identifier, password);
      if (result.success && result.user) {
        // Real staff sign in starts fresh without dummy data
        await login(result.user.role, result.user.email, password, false);
      } else {
        setErrorMessage(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOtp = async () => {
    if (phoneNumber.replace(/[^0-9]/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setErrorMessage('');
    setOtpLoading(true);

    try {
      const res = await firebaseAuthService.requestPhoneOtp(phoneNumber);
      if (res.success && res.session) {
        setOtpSessionId(res.session.verificationId);
        setOtpSent(true);
      } else {
        setErrorMessage(res.error || 'Failed to send OTP.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to request OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    setErrorMessage('');
    setOtpLoading(true);

    try {
      const res = await firebaseAuthService.verifyPhoneOtp(
        otpSessionId,
        otpCode,
        patientName.trim() || 'Patient'
      );
      if (res.success && res.user) {
        // Real patient OTP sign in starts fresh without dummy data
        await login('patient', res.user.email, undefined, false);
      } else {
        setErrorMessage(res.error || 'Invalid OTP code.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    // Explicit demo login populates dummy data
    login(role, undefined, undefined, true);
  };

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
        {/* Top Header & Branding */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.liveBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveBadgeText}>TIRUNELVELI FACILITY</Text>
            </View>
            <View style={[styles.facilityPill, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
              <Text style={styles.facilityText}>3 Floors • 80 Staff</Text>
            </View>
          </View>

          <Text style={[styles.brandTitle, { color: tc.text }]}>RIO Scans & Labs</Text>
          <Text style={[styles.brandSubtitle, { color: tc.textSecondary }]}>
            Hospital Appointment Management & Staff Attendance System
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabBar, { backgroundColor: isDark ? '#1C2431' : '#E2E8F0' }]}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'staff' && styles.activeTabItem]}
            onPress={() => {
              setActiveTab('staff');
              setErrorMessage('');
            }}
          >
            <AppIcon
              name="lock-closed-outline"
              size={14}
              color={activeTab === 'staff' ? '#FFFFFF' : tc.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'staff' ? '#FFFFFF' : tc.textSecondary },
              ]}
            >
              Staff Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'patient' && styles.activeTabItem]}
            onPress={() => {
              setActiveTab('patient');
              setErrorMessage('');
            }}
          >
            <AppIcon
              name="phone-portrait-outline"
              size={14}
              color={activeTab === 'patient' ? '#FFFFFF' : tc.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'patient' ? '#FFFFFF' : tc.textSecondary },
              ]}
            >
              Patient OTP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'demo' && styles.activeTabItemDemo]}
            onPress={() => {
              setActiveTab('demo');
              setErrorMessage('');
            }}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'demo' ? '#FFFFFF' : '#059669', fontWeight: '800' },
              ]}
            >
              ⚡ Demo Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {!!errorMessage && (
          <View style={styles.errorBox}>
            <AppIcon name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* TAB 1: Staff / Doctor / Owner Login */}
        {activeTab === 'staff' && (
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: tc.text }]}>Staff & Management Login</Text>
              <Text style={[styles.cardSub, { color: tc.textSecondary }]}>
                Login using your Staff ID (e.g. RIO-ADM-01, RIO-DOC-02) or email
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: tc.textSecondary }]}>STAFF ID / EMAIL</Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder },
                ]}
              >
                <AppIcon name="person-outline" size={18} color={tc.textSecondary} />
                <TextInput
                  style={[styles.input, { color: tc.text }]}
                  placeholder="e.g. RIO-ADM-01 or dr.preetha@rioscans.in"
                  placeholderTextColor={tc.textTertiary}
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: tc.textSecondary }]}>PASSWORD / PIN</Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder },
                ]}
              >
                <AppIcon name="key-outline" size={18} color={tc.textSecondary} />
                <TextInput
                  style={[styles.input, { color: tc.text }]}
                  placeholder="Enter password or employee PIN"
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

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleStaffLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Secure Staff Sign In</Text>
                  <AppIcon name="arrow-forward" size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Pre-Registered RIO Credentials:</Text>
              <Text style={styles.hintItem}>• Owner (MD): <Text style={styles.codeText}>RIO-ADM-01</Text> (PIN: 1001 or Rio@1234)</Text>
              <Text style={styles.hintItem}>• Doctor (Radiology): <Text style={styles.codeText}>RIO-DOC-02</Text> (PIN: 1002)</Text>
              <Text style={styles.hintItem}>• Reception Desk: <Text style={styles.codeText}>RIO-REC-01</Text> (PIN: 2001)</Text>
              <Text style={styles.hintItem}>• Delivery Courier: <Text style={styles.codeText}>RIO-DEL-02</Text> (PIN: 5002)</Text>
            </View>

            {onNavigateToRegister && (
              <TouchableOpacity
                style={styles.switchAuthBtn}
                onPress={onNavigateToRegister}
              >
                <Text style={[styles.switchAuthText, { color: tc.textSecondary }]}>
                  New employee or clinic?{' '}
                  <Text style={{ color: colors.whatsapp.primary, fontWeight: '700' }}>
                    Register fresh account
                  </Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* TAB 2: Patient Phone OTP Login */}
        {activeTab === 'patient' && (
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: tc.text }]}>Patient Portal Login</Text>
              <Text style={[styles.cardSub, { color: tc.textSecondary }]}>
                Instant access to appointments, token queues & digital scan reports
              </Text>
            </View>

            {!otpSent ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: tc.textSecondary }]}>PATIENT FULL NAME</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder },
                    ]}
                  >
                    <AppIcon name="person-outline" size={18} color={tc.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: tc.text }]}
                      placeholder="e.g. Gowri Thangavel"
                      placeholderTextColor={tc.textTertiary}
                      value={patientName}
                      onChangeText={setPatientName}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: tc.textSecondary }]}>MOBILE NUMBER (10 DIGITS)</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder },
                    ]}
                  >
                    <Text style={[styles.countryCode, { color: tc.text }]}>+91</Text>
                    <TextInput
                      style={[styles.input, { color: tc.text }]}
                      placeholder="98421 XXXXX"
                      placeholderTextColor={tc.textTertiary}
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleRequestOtp}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Send 6-Digit OTP</Text>
                      <AppIcon name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.otpNotice}>
                  <AppIcon name="checkmark-circle" size={18} color="#059669" />
                  <Text style={styles.otpNoticeText}>
                    OTP sent to +91 {phoneNumber}. (Test Code: 627003)
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: tc.textSecondary }]}>ENTER 6-DIGIT OTP</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder },
                    ]}
                  >
                    <AppIcon name="shield-checkmark-outline" size={18} color="#059669" />
                    <TextInput
                      style={[styles.input, { color: tc.text, letterSpacing: 4, fontWeight: 'bold' }]}
                      placeholder="627003"
                      placeholderTextColor={tc.textTertiary}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otpCode}
                      onChangeText={setOtpCode}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleVerifyOtp}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Verify & Enter App</Text>
                      <AppIcon name="arrow-forward" size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={() => setOtpSent(false)}
                >
                  <Text style={styles.resendBtnText}>← Change Mobile Number</Text>
                </TouchableOpacity>
              </>
            )}

            {onNavigateToRegister && (
              <TouchableOpacity
                style={styles.switchAuthBtn}
                onPress={onNavigateToRegister}
              >
                <Text style={[styles.switchAuthText, { color: tc.textSecondary }]}>
                  First-time patient?{' '}
                  <Text style={{ color: colors.whatsapp.primary, fontWeight: '700' }}>
                    Create an Account
                  </Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* TAB 3: ⚡ Quick Demo Login (Preserves existing one-tap UX exactly) */}
        {activeTab === 'demo' && (
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: tc.text }]}>⚡ One-Tap Demo Access</Text>
              <Text style={[styles.cardSub, { color: tc.textSecondary }]}>
                Switch instantly between pre-configured RIO Scans profiles with complete sample data
              </Text>
            </View>

            {/* Owner Card */}
            <TouchableOpacity
              style={[styles.demoCard, { backgroundColor: isDark ? '#1A2923' : '#F0FDF4', borderColor: '#86EFAC' }]}
              onPress={() => handleQuickDemoLogin('owner')}
            >
              <View style={[styles.demoIconCircle, { backgroundColor: '#10B981' }]}>
                <Text style={styles.demoIconText}>👑</Text>
              </View>
              <View style={styles.demoInfo}>
                <Text style={[styles.demoName, { color: tc.text }]}>Hospital Owner / Managing Director</Text>
                <Text style={styles.demoRole}>Master Account: Staff Credentials, Attendance & Payroll</Text>
              </View>
              <AppIcon name="chevron-forward" size={18} color="#10B981" />
            </TouchableOpacity>

            {/* Doctor Card */}
            <TouchableOpacity
              style={[styles.demoCard, { backgroundColor: isDark ? '#1C263A' : '#EFF6FF', borderColor: '#93C5FD' }]}
              onPress={() => handleQuickDemoLogin('doctor')}
            >
              <View style={[styles.demoIconCircle, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.demoIconText}>🩺</Text>
              </View>
              <View style={styles.demoInfo}>
                <Text style={[styles.demoName, { color: tc.text }]}>Chief Radiologist & Doctor</Text>
                <Text style={styles.demoRole}>OPD Consultation, MRI/CT Reporting & Schedule</Text>
              </View>
              <AppIcon name="chevron-forward" size={18} color="#3B82F6" />
            </TouchableOpacity>

            {/* Receptionist Card */}
            <TouchableOpacity
              style={[styles.demoCard, { backgroundColor: isDark ? '#2B2338' : '#FAF5FF', borderColor: '#D8B4FE' }]}
              onPress={() => handleQuickDemoLogin('receptionist')}
            >
              <View style={[styles.demoIconCircle, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.demoIconText}>📋</Text>
              </View>
              <View style={styles.demoInfo}>
                <Text style={[styles.demoName, { color: tc.text }]}>Front Desk Receptionist</Text>
                <Text style={styles.demoRole}>Walk-ins, Token Dispatch, Billing & Scanner</Text>
              </View>
              <AppIcon name="chevron-forward" size={18} color="#8B5CF6" />
            </TouchableOpacity>

            {/* Delivery Courier Card */}
            <TouchableOpacity
              style={[styles.demoCard, { backgroundColor: isDark ? '#302619' : '#FFFBEB', borderColor: '#FCD34D' }]}
              onPress={() => handleQuickDemoLogin('delivery')}
            >
              <View style={[styles.demoIconCircle, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.demoIconText}>🛵</Text>
              </View>
              <View style={styles.demoInfo}>
                <Text style={[styles.demoName, { color: tc.text }]}>Scan Film Delivery Courier</Text>
                <Text style={styles.demoRole}>GPS Route Tracking, Hospital Delivery & Signatures</Text>
              </View>
              <AppIcon name="chevron-forward" size={18} color="#F59E0B" />
            </TouchableOpacity>

            {/* Patient Card */}
            <TouchableOpacity
              style={[styles.demoCard, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderColor: tc.cardBorder }]}
              onPress={() => handleQuickDemoLogin('patient')}
            >
              <View style={[styles.demoIconCircle, { backgroundColor: '#64748B' }]}>
                <Text style={styles.demoIconText}>👤</Text>
              </View>
              <View style={styles.demoInfo}>
                <Text style={[styles.demoName, { color: tc.text }]}>Patient Profile</Text>
                <Text style={styles.demoRole}>Token Live Queue, Medical Records & Booking</Text>
              </View>
              <AppIcon name="chevron-forward" size={18} color="#64748B" />
            </TouchableOpacity>

            {/* Standalone Face Attendance Kiosk Launcher */}
            {onOpenFaceKiosk && (
              <TouchableOpacity
                style={[styles.demoCard, { backgroundColor: '#0F172A', borderColor: '#334155', marginTop: 12 }]}
                onPress={onOpenFaceKiosk}
              >
                <View style={[styles.demoIconCircle, { backgroundColor: colors.brand.primary }]}>
                  <Text style={styles.demoIconText}>📷</Text>
                </View>
                <View style={styles.demoInfo}>
                  <Text style={[styles.demoName, { color: '#FFFFFF' }]}>Face Attendance Tablet Kiosk</Text>
                  <Text style={[styles.demoRole, { color: '#93C5FD' }]}>
                    Floor Checkpoint camera: Shift-In, Lunch-Break & Overstay Detector
                  </Text>
                </View>
                <AppIcon name="scan" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Registration Quick Switch Banner */}
        {onNavigateToRegister && (
          <TouchableOpacity
            style={[
              styles.registerBannerBtn,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: tc.cardBorder },
            ]}
            onPress={onNavigateToRegister}
            activeOpacity={0.8}
          >
            <View style={styles.registerBannerLeft}>
              <View style={[styles.registerIconCircle, { backgroundColor: colors.whatsapp.primary }]}>
                <AppIcon name="person-add-outline" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.registerBannerTitle, { color: tc.text }]}>
                  Need a Fresh Account?
                </Text>
                <Text style={[styles.registerBannerSub, { color: tc.textSecondary }]}>
                  Sign up for clean feed with 0 dummy data (Doctor, Owner, Patient, Desk)
                </Text>
              </View>
            </View>
            <AppIcon name="chevron-forward" size={18} color={tc.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: tc.textTertiary }]}>
            {RIO_SCAN_CENTER_INFO.name} • {RIO_SCAN_CENTER_INFO.city}
          </Text>
          <Text style={[styles.footerSub, { color: tc.textTertiary }]}>
            Secured by Firebase Multi-Role Auth & Biometric Kiosk
          </Text>
        </View>
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
  header: {
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  facilityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  facilityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 5,
  },
  activeTabItem: {
    backgroundColor: '#0F172A',
  },
  activeTabItemDemo: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
  },
  card: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 12.5,
    marginTop: 3,
    lineHeight: 17,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: colors.brand.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  hintBox: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  hintTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brand.primary,
    marginBottom: 4,
  },
  hintItem: {
    fontSize: 11.5,
    color: '#64748B',
    marginVertical: 1.5,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: 'bold',
    color: '#0F172A',
  },
  otpNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  otpNoticeText: {
    fontSize: 12,
    color: colors.brand.primary,
    fontWeight: '700',
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 6,
  },
  resendBtnText: {
    fontSize: 12,
    color: colors.brand.primary,
    fontWeight: '700',
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  demoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoIconText: {
    fontSize: 18,
  },
  demoInfo: {
    flex: 1,
  },
  demoName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  demoRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  footerSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
  switchAuthBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  switchAuthText: {
    fontSize: 13,
  },
  registerBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
    gap: 12,
  },
  registerBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  registerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerBannerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  registerBannerSub: {
    fontSize: 11,
    lineHeight: 14,
  },
});
