import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { HospitalProvider, useHospital } from './src/context/HospitalContext';
import { WhatsAppHeader } from './src/components/common/WhatsAppHeader';
import { NativeTabs } from './src/components/common/NativeTabs';
import { colors } from './src/theme/colors';
import { NotificationProvider } from './src/context/NotificationContext';
import { IOSPushNotificationBanner } from './src/components/notifications/IOSPushNotificationBanner';
import { NotificationCenterModal } from './src/components/notifications/NotificationCenterModal';

// Receptionist Screens
import { ReceptionistAppointmentsScreen } from './src/screens/receptionist/ReceptionistAppointmentsScreen';
import { ReceptionistProfileScreen } from './src/screens/receptionist/ReceptionistProfileScreen';
import { ReceptionistPaymentsScreen } from './src/screens/receptionist/ReceptionistPaymentsScreen';
import { PatientDetailScreen } from './src/screens/receptionist/PatientDetailScreen';
import { BookAppointmentModal } from './src/screens/receptionist/BookAppointmentModal';
import { PaymentCollectionModal } from './src/screens/receptionist/PaymentCollectionModal';
import { EmbeddedDocumentScanner } from './src/components/scanner/EmbeddedDocumentScanner';

// Doctor Screens
import { DoctorQueueScreen } from './src/screens/doctor/DoctorQueueScreen';
import { DoctorScheduleScreen } from './src/screens/doctor/DoctorScheduleScreen';
import { DoctorProfileScreen } from './src/screens/doctor/DoctorProfileScreen';
import { DoctorRecordsScreen } from './src/screens/doctor/DoctorRecordsScreen';
import { ConsultationScreen } from './src/screens/doctor/ConsultationScreen';

// Patient Screens
import { NearbyHospitalsScreen } from './src/screens/patient/NearbyHospitalsScreen';
import { MyTokensScreen } from './src/screens/patient/MyTokensScreen';
import { MedicalRecordsScreen } from './src/screens/patient/MedicalRecordsScreen';
import { PatientProfileScreen } from './src/screens/patient/PatientProfileScreen';
import { BookSlotModal } from './src/screens/patient/BookSlotModal';

// Owner Screen
import { OwnerDashboardScreen } from './src/screens/owner/OwnerDashboardScreen';
import { OwnerDoctorScheduleScreen } from './src/screens/owner/OwnerDoctorScheduleScreen';
import { OwnerRevenueScreen } from './src/screens/owner/OwnerRevenueScreen';
import { OwnerProfileScreen } from './src/screens/owner/OwnerProfileScreen';
import { StaffCredentialsScreen } from './src/screens/owner/StaffCredentialsScreen';
import { AttendancePayrollScreen } from './src/screens/owner/AttendancePayrollScreen';
import { DeliveryDispatchScreen } from './src/screens/delivery/DeliveryDispatchScreen';
import { FaceAttendanceKioskScreen } from './src/screens/kiosk/FaceAttendanceKioskScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { Appointment, Hospital } from './src/types';
import { IOSTabPageTransition } from './src/components/common/IOSTabPageTransition';
import { IOSPushTransition } from './src/components/common/IOSPushTransition';

const MainAppContent: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  const { selectedHospital } = useHospital();
  const { colors: tc, isDark } = useAppTheme();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('desk');

  // Modals state
  const [walkInModalVisible, setWalkInModalVisible] = useState(false);
  const [paymentModalApt, setPaymentModalApt] = useState<Appointment | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerAptId, setScannerAptId] = useState<string | undefined>(undefined);
  const [bookingHospital, setBookingHospital] = useState<Hospital | null>(null);
  const [bookingDoctorId, setBookingDoctorId] = useState<string | undefined>(undefined);
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingSlot, setBookingSlot] = useState<string | undefined>(undefined);
  const [consultationApt, setConsultationApt] = useState<Appointment | null>(null);
  const [isConsultationVisible, setIsConsultationVisible] = useState(false);
  const [receptionistPatientApt, setReceptionistPatientApt] = useState<Appointment | null>(null);
  const [isReceptionistPatientVisible, setIsReceptionistPatientVisible] = useState(false);
  const [isKioskModalVisible, setIsKioskModalVisible] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Switch default tab if role changes
  React.useEffect(() => {
    switch (role) {
      case 'receptionist':
        setActiveTab('desk');
        break;
      case 'doctor':
        setActiveTab('queue');
        break;
      case 'patient':
        setActiveTab('hospitals');
        break;
      case 'owner':
        setActiveTab('overview');
        break;
      case 'delivery':
        setActiveTab('dispatch');
        break;
      case 'staff':
        setActiveTab('attendance');
        break;
    }
  }, [role]);

  // Tab router with native iOS transition animations
  const renderCurrentScreen = () => {
    switch (role) {
      case 'receptionist': {
        const receptionistTabs = ['desk', 'scan', 'payments', 'walkin', 'profile'];
        const renderReceptionistContent = () => {
          if (activeTab === 'profile') {
            return <ReceptionistProfileScreen />;
          }
          if (activeTab === 'payments') {
            return (
              <ReceptionistPaymentsScreen
                onOpenPaymentModal={(apt) => setPaymentModalApt(apt)}
              />
            );
          }
          return (
            <ReceptionistAppointmentsScreen
              onOpenWalkInModal={() => setWalkInModalVisible(true)}
              onOpenPaymentModal={(apt) => setPaymentModalApt(apt)}
              onOpenScanner={(aptId) => {
                setScannerAptId(aptId);
                setScannerVisible(true);
              }}
              onSelectPatient={(apt) => {
                setReceptionistPatientApt(apt);
                setIsReceptionistPatientVisible(true);
              }}
            />
          );
        };

        return (
          <IOSPushTransition
            visible={isReceptionistPatientVisible && !!receptionistPatientApt}
            onBackCompleted={() => setReceptionistPatientApt(null)}
            underlyingScreen={
              <IOSTabPageTransition activeKey={activeTab} tabOrder={receptionistTabs}>
                {renderReceptionistContent()}
              </IOSTabPageTransition>
            }
          >
            {receptionistPatientApt && (
              <PatientDetailScreen
                appointment={receptionistPatientApt}
                onBack={() => setIsReceptionistPatientVisible(false)}
                onOpenScanner={(aptId) => {
                  setScannerAptId(aptId);
                  setScannerVisible(true);
                }}
                onOpenPayment={(apt) => setPaymentModalApt(apt)}
              />
            )}
          </IOSPushTransition>
        );
      }

      case 'doctor': {
        const doctorTabs = ['queue', 'schedule', 'history', 'profile'];
        const renderDoctorContent = () => {
          if (activeTab === 'profile') {
            return <DoctorProfileScreen />;
          }
          if (activeTab === 'schedule') {
            return (
              <DoctorScheduleScreen
                onSelectConsultation={(apt) => {
                  setConsultationApt(apt);
                  setIsConsultationVisible(true);
                }}
              />
            );
          }
          if (activeTab === 'history') {
            return <DoctorRecordsScreen />;
          }
          return (
            <DoctorQueueScreen
              onSelectConsultation={(apt) => {
                setConsultationApt(apt);
                setIsConsultationVisible(true);
              }}
            />
          );
        };

        return (
          <IOSPushTransition
            visible={isConsultationVisible && !!consultationApt}
            onBackCompleted={() => setConsultationApt(null)}
            underlyingScreen={
              <IOSTabPageTransition activeKey={activeTab} tabOrder={doctorTabs}>
                {renderDoctorContent()}
              </IOSTabPageTransition>
            }
          >
            {consultationApt && (
              <ConsultationScreen
                appointment={consultationApt}
                onBackToQueue={() => setIsConsultationVisible(false)}
              />
            )}
          </IOSPushTransition>
        );
      }

      case 'patient': {
        const patientTabs = ['hospitals', 'my_tokens', 'reports', 'profile'];
        const renderPatientContent = () => {
          if (activeTab === 'profile') {
            return <PatientProfileScreen />;
          }
          if (activeTab === 'my_tokens') {
            return (
              <MyTokensScreen
                onViewReports={() => setActiveTab('reports')}
                onBookNew={() => setActiveTab('hospitals')}
              />
            );
          }
          if (activeTab === 'reports') {
            return <MedicalRecordsScreen />;
          }
          return (
            <NearbyHospitalsScreen
              onSelectHospitalForBooking={(hosp, docId, date, slot) => {
                setBookingHospital(hosp);
                setBookingDoctorId(docId);
                setBookingDate(date);
                setBookingSlot(slot);
              }}
            />
          );
        };

        return (
          <IOSTabPageTransition activeKey={activeTab} tabOrder={patientTabs}>
            {renderPatientContent()}
          </IOSTabPageTransition>
        );
      }

      case 'owner': {
        const ownerTabs = ['overview', 'attendance', 'staff', 'delivery', 'profile'];
        const renderOwnerContent = () => {
          if (activeTab === 'profile') {
            return <OwnerProfileScreen />;
          }
          if (activeTab === 'attendance') {
            return (
              <AttendancePayrollScreen
                onOpenKioskModal={() => setIsKioskModalVisible(true)}
              />
            );
          }
          if (activeTab === 'staff') {
            return <StaffCredentialsScreen />;
          }
          if (activeTab === 'delivery') {
            return <DeliveryDispatchScreen />;
          }
          return <OwnerDashboardScreen />;
        };

        return (
          <IOSTabPageTransition activeKey={activeTab} tabOrder={ownerTabs}>
            {renderOwnerContent()}
          </IOSTabPageTransition>
        );
      }

      case 'delivery': {
        const deliveryTabs = ['dispatch', 'attendance', 'profile'];
        const renderDeliveryContent = () => {
          if (activeTab === 'profile') {
            return <OwnerProfileScreen />;
          }
          if (activeTab === 'attendance') {
            return (
              <AttendancePayrollScreen
                onOpenKioskModal={() => setIsKioskModalVisible(true)}
              />
            );
          }
          return <DeliveryDispatchScreen />;
        };

        return (
          <IOSTabPageTransition activeKey={activeTab} tabOrder={deliveryTabs}>
            {renderDeliveryContent()}
          </IOSTabPageTransition>
        );
      }

      case 'staff':
      default: {
        const staffTabs = ['attendance', 'profile'];
        const renderStaffContent = () => {
          if (activeTab === 'profile') {
            return <OwnerProfileScreen />;
          }
          return (
            <AttendancePayrollScreen
              onOpenKioskModal={() => setIsKioskModalVisible(true)}
            />
          );
        };

        return (
          <IOSTabPageTransition activeKey={activeTab} tabOrder={staffTabs}>
            {renderStaffContent()}
          </IOSTabPageTransition>
        );
      }
    }
  };

  const handleTabPress = (tabId: string) => {
    const isAlreadyActive = activeTab === tabId;

    // --- NATIVE TABS DISMISS BEHAVIOR (https://docs.expo.dev/router/advanced/native-tabs/#dismiss-behavior) ---
    // "By default, tapping a tab that is already active closes all screens in that tab's stack, returning the user to the root screen."
    if (isAlreadyActive) {
      let dismissedAny = false;

      // 1. Pop Doctor Consultation back to Queue
      if (isConsultationVisible || consultationApt) {
        setIsConsultationVisible(false);
        setConsultationApt(null);
        dismissedAny = true;
      }

      // 2. Pop Receptionist Patient Detail back to Queue
      if (isReceptionistPatientVisible || receptionistPatientApt) {
        setIsReceptionistPatientVisible(false);
        setReceptionistPatientApt(null);
        dismissedAny = true;
      }

      // 3. Dismiss any active modal
      if (walkInModalVisible) {
        setWalkInModalVisible(false);
        dismissedAny = true;
      }
      if (scannerVisible) {
        setScannerVisible(false);
        dismissedAny = true;
      }
      if (paymentModalApt) {
        setPaymentModalApt(null);
        dismissedAny = true;
      }
      if (bookingHospital) {
        setBookingHospital(null);
        setBookingDoctorId(undefined);
        setBookingDate(undefined);
        setBookingSlot(undefined);
        dismissedAny = true;
      }
      if (isKioskModalVisible) {
        setIsKioskModalVisible(false);
        dismissedAny = true;
      }

      if (dismissedAny) {
        return;
      }

      // If already at root with no modals or pushed screens, native tab behavior scrolls to top
      return;
    }

    // --- ACTION TABS TOGGLE/OPEN ---
    if (tabId === 'scan') {
      setScannerVisible((prev) => !prev);
      return;
    }
    if (tabId === 'walkin') {
      setWalkInModalVisible((prev) => !prev);
      return;
    }

    // --- TAB SWITCH: DISMISS ANY PUSHED SCREEN OR MODAL ---
    if (isConsultationVisible || consultationApt) {
      setIsConsultationVisible(false);
      setConsultationApt(null);
    }
    if (isReceptionistPatientVisible || receptionistPatientApt) {
      setIsReceptionistPatientVisible(false);
      setReceptionistPatientApt(null);
    }
    if (walkInModalVisible) setWalkInModalVisible(false);
    if (scannerVisible) setScannerVisible(false);
    if (paymentModalApt) setPaymentModalApt(null);

    setActiveTab(tabId);
  };

  // If not logged in, show production Login Screen or Register Screen
  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: tc.background }}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={tc.background}
        />
        {authView === 'login' ? (
          <LoginScreen
            onNavigateToRegister={() => setAuthView('register')}
            onOpenFaceKiosk={() => setIsKioskModalVisible(true)}
          />
        ) : (
          <RegisterScreen
            onNavigateToLogin={() => setAuthView('login')}
          />
        )}
        {isKioskModalVisible && (
          <FaceAttendanceKioskScreen
            visible={isKioskModalVisible}
            onClose={() => setIsKioskModalVisible(false)}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.rootContainer, { backgroundColor: tc.headerBackground }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={tc.headerBackground}
      />

      {/* WhatsApp Header with Safe Area handling and Vector Icons */}
      <WhatsAppHeader
        title="RIO Scans & Labs"
        onCameraPress={() => setScannerVisible(true)}
        onAddPress={() => setWalkInModalVisible(true)}
      />

      {/* Screen Content Container */}
      <View style={[styles.content, { backgroundColor: tc.background }]}>
        {renderCurrentScreen()}
      </View>

      {/* Platform Native iOS Liquid Glass Bottom Tabs (Expo Router NativeTabs) */}
      <NativeTabs
        activeTab={activeTab}
        onTabPress={handleTabPress}
        tintColor={isDark ? colors.whatsapp.accent : colors.whatsapp.primary}
        iconColor={{
          default: isDark ? '#98989D' : '#8E8E93',
          selected: isDark ? colors.whatsapp.accent : colors.whatsapp.primary,
        }}
      >
        {role === 'receptionist' && (
          <>
            <NativeTabs.Trigger name="desk">
              <NativeTabs.Trigger.Label>Queue</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'list-outline', selected: 'list' }} md="list" />
              <NativeTabs.Trigger.Badge>5</NativeTabs.Trigger.Badge>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="scan">
              <NativeTabs.Trigger.Label>Scanner</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'scan-outline', selected: 'scan' }} md="scan" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="payments">
              <NativeTabs.Trigger.Label>Billing</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'card-outline', selected: 'card' }} md="credit_card" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="walkin">
              <NativeTabs.Trigger.Label>Walk-In</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'add-circle-outline', selected: 'add-circle' }} md="add_circle" />
            </NativeTabs.Trigger>
          </>
        )}

        {role === 'doctor' && (
          <>
            <NativeTabs.Trigger name="queue">
              <NativeTabs.Trigger.Label>Queue</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'pulse-outline', selected: 'pulse' }} md="pulse" />
              <NativeTabs.Trigger.Badge>9</NativeTabs.Trigger.Badge>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="schedule">
              <NativeTabs.Trigger.Label>Schedule</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'time-outline', selected: 'time' }} md="schedule" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="history">
              <NativeTabs.Trigger.Label>Records</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'folder-outline', selected: 'folder' }} md="folder" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="profile">
              <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'person-outline', selected: 'person' }} md="person" />
            </NativeTabs.Trigger>
          </>
        )}

        {role === 'patient' && (
          <>
            <NativeTabs.Trigger name="hospitals">
              <NativeTabs.Trigger.Label>Clinics</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'business-outline', selected: 'business' }} md="local_hospital" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="my_tokens">
              <NativeTabs.Trigger.Label>Token</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'ticket-outline', selected: 'ticket' }} md="confirmation_number" />
              <NativeTabs.Trigger.Badge>#8</NativeTabs.Trigger.Badge>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="reports">
              <NativeTabs.Trigger.Label>Scans</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'medkit-outline', selected: 'medkit' }} md="medical_services" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="profile">
              <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'person-outline', selected: 'person' }} md="person" />
            </NativeTabs.Trigger>
          </>
        )}

        {role === 'owner' && (
          <>
            <NativeTabs.Trigger name="overview">
              <NativeTabs.Trigger.Label>Overview</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'stats-chart-outline', selected: 'stats-chart' }} md="bar_chart" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="attendance">
              <NativeTabs.Trigger.Label>Attendance</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'time-outline', selected: 'time' }} md="access_time" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="staff">
              <NativeTabs.Trigger.Label>Staff</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'id-card-outline', selected: 'id-card' }} md="badge" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="delivery">
              <NativeTabs.Trigger.Label>Dispatch</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'location-outline', selected: 'location' }} md="near_me" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="profile">
              <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'person-outline', selected: 'person' }} md="person" />
            </NativeTabs.Trigger>
          </>
        )}

        {role === 'delivery' && (
          <>
            <NativeTabs.Trigger name="dispatch">
              <NativeTabs.Trigger.Label>Dispatch</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'location-outline', selected: 'location' }} md="near_me" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="attendance">
              <NativeTabs.Trigger.Label>Attendance</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'time-outline', selected: 'time' }} md="access_time" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="profile">
              <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'person-outline', selected: 'person' }} md="person" />
            </NativeTabs.Trigger>
          </>
        )}

        {role === 'staff' && (
          <>
            <NativeTabs.Trigger name="attendance">
              <NativeTabs.Trigger.Label>Attendance</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'time-outline', selected: 'time' }} md="access_time" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="profile">
              <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: 'person-outline', selected: 'person' }} md="person" />
            </NativeTabs.Trigger>
          </>
        )}
      </NativeTabs>

      {/* Real-time iOS Push Notification Banner */}
      <IOSPushNotificationBanner />

      {/* Global Notification Center Modal */}
      <NotificationCenterModal />

      {/* Receptionist Modals - Lazily mounted for instant launch & zero camera overhead */}
      {walkInModalVisible && (
        <BookAppointmentModal
          visible={walkInModalVisible}
          onClose={() => setWalkInModalVisible(false)}
        />
      )}

      {!!paymentModalApt && (
        <PaymentCollectionModal
          visible={!!paymentModalApt}
          appointment={paymentModalApt}
          onClose={() => setPaymentModalApt(null)}
        />
      )}

      {scannerVisible && (
        <EmbeddedDocumentScanner
          visible={scannerVisible}
          targetAppointmentId={scannerAptId}
          onClose={() => {
            setScannerVisible(false);
            setScannerAptId(undefined);
          }}
        />
      )}

      {/* Patient Booking Modal */}
      {bookingHospital && (
        <BookSlotModal
          visible={!!bookingHospital}
          hospital={bookingHospital}
          initialDoctorId={bookingDoctorId}
          initialDate={bookingDate}
          initialSlot={bookingSlot}
          onClose={() => {
            setBookingHospital(null);
            setBookingDoctorId(undefined);
            setBookingDate(undefined);
            setBookingSlot(undefined);
          }}
          onBookingSuccess={() => {
            setBookingHospital(null);
            setBookingDoctorId(undefined);
            setBookingDate(undefined);
            setBookingSlot(undefined);
            setActiveTab('my_tokens');
          }}
        />
      )}

      {/* Standalone Face Attendance Biometric Kiosk Modal */}
      {isKioskModalVisible && (
        <FaceAttendanceKioskScreen
          visible={isKioskModalVisible}
          onClose={() => setIsKioskModalVisible(false)}
        />
      )}
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <HospitalProvider>
            <NotificationProvider>
              <MainAppContent />
            </NotificationProvider>
          </HospitalProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
