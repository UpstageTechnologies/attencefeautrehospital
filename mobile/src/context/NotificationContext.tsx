import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Vibration } from 'react-native';
import { AppNotification, NotificationType, Appointment } from '../types';
import { dataStore } from '../services/dataStore';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: AppNotification[];
  allNotifications: AppNotification[];
  unreadCount: number;
  activeBanner: AppNotification | null;
  isNotificationCenterVisible: boolean;
  dismissBanner: () => void;
  openNotificationCenter: () => void;
  closeNotificationCenter: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  sendDemoNotification: (type?: NotificationType) => void;
  scheduleAppointmentReminder: (apt: Appointment, delaySeconds?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useAuth();
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>(() =>
    dataStore.getNotifications()
  );
  const [activeBanner, setActiveBanner] = useState<AppNotification | null>(null);
  const [isNotificationCenterVisible, setIsNotificationCenterVisible] = useState(false);
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to real-time notification events from dataStore
  useEffect(() => {
    const unsub = dataStore.subscribeToNotifications((updatedNotifs, latestBanner) => {
      setAllNotifications([...updatedNotifs]);

      // If a new notification was dispatched:
      if (latestBanner) {
        // Check if banner is relevant to the active user/role
        const isForMe =
          latestBanner.recipientId === 'all' ||
          latestBanner.recipientRole === role ||
          (user && latestBanner.recipientId === user.id);

        if (isForMe) {
          triggerBanner(latestBanner);
        }
      }
    });

    return () => unsub();
  }, [role, user]);

  const triggerBanner = useCallback((banner: AppNotification) => {
    // Clear previous timer
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }

    setActiveBanner(banner);

    // Haptic feedback
    try {
      if (Platform.OS !== 'web') {
        Vibration.vibrate(60);
      }
    } catch {
      // Ignore vibration error on unsupported platforms
    }

    // Auto dismiss after 5 seconds
    bannerTimerRef.current = setTimeout(() => {
      setActiveBanner(null);
    }, 5000);
  }, []);

  const dismissBanner = useCallback(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
    setActiveBanner(null);
  }, []);

  // Filter notifications for current user/role
  const userNotifications = allNotifications.filter(n => {
    if (n.recipientId === 'all') return true;
    if (user && n.recipientId === user.id) return true;
    if (n.recipientRole === role) return true;
    return false;
  });

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    dataStore.markNotificationAsRead(id);
  }, []);

  const markAllAsRead = useCallback(() => {
    dataStore.markAllNotificationsAsRead(user?.id, role);
  }, [user, role]);

  const openNotificationCenter = useCallback(() => {
    setIsNotificationCenterVisible(true);
  }, []);

  const closeNotificationCenter = useCallback(() => {
    setIsNotificationCenterVisible(false);
  }, []);

  // Quick Demo Trigger for live testing
  const sendDemoNotification = useCallback((type: NotificationType = 'appointment_reminder') => {
    let title = '⏰ Upcoming Appointment Reminder';
    let message = 'Friendly reminder: Your consultation with Dr. Preetha Rajesh is scheduled for 10:30 AM (Scan Room 1). Token #8.';

    if (type === 'appointment_booked') {
      title = '🩺 New Appointment: Token #14';
      message = 'Gowri T booked for 11:30 AM with Dr. Preetha Rajesh. Symptoms: Knee pain evaluation.';
    } else if (type === 'payment_received' || type === 'payment_recorded') {
      title = '💳 Payment Received: ₹800.00';
      message = 'Payment of ₹800 for Token #8 settled via UPI. Receipt #RCP-RIO-98421 generated.';
    } else if (type === 'queue_turn_called') {
      title = '🔔 It\'s Your Turn! (Token #8)';
      message = 'Please proceed to Scan Room 1 immediately. Dr. Preetha Rajesh is ready to see you!';
    } else if (type === 'consultation_completed') {
      title = '🩺 Digital Prescription Available';
      message = 'Dr. Preetha Rajesh has completed consultation. Rx now available in Medical Records.';
    } else if (type === 'report_attached') {
      title = '🩻 Diagnostic Report Ready';
      message = 'Digital Radiography (Bilateral Knee) report uploaded and ready for review.';
    }

    const notif = dataStore.addNotification({
      recipientId: user?.id || 'usr_patient_john',
      recipientRole: role,
      type,
      title,
      message,
      tokenNumber: 8,
      metadata: {
        patientName: 'Gowri T',
        doctorName: 'Dr. Preetha Rajesh',
        roomNumber: 'Scan Room 1',
        time: '10:30 AM',
        amount: 800,
      }
    });

    triggerBanner(notif);
  }, [role, user, triggerBanner]);

  // Appointment reminder scheduling
  const scheduleAppointmentReminder = useCallback((apt: Appointment, delaySeconds: number = 8) => {
    setTimeout(() => {
      const reminderNotif = dataStore.addNotification({
        recipientId: apt.patientId,
        recipientRole: 'patient',
        type: 'appointment_reminder',
        title: `⏰ Appointment Reminder: Token #${apt.tokenNumber}`,
        message: `Friendly reminder: Your appointment with ${apt.doctorName} is today at ${apt.timeSlot} (${apt.roomNumber}). Please arrive 15 minutes before your time.`,
        appointmentId: apt.id,
        tokenNumber: apt.tokenNumber,
        metadata: {
          patientName: apt.patientName,
          doctorName: apt.doctorName,
          roomNumber: apt.roomNumber,
          date: apt.appointmentDate,
          time: apt.timeSlot,
        }
      });

      // If patient is active user, trigger banner
      if (role === 'patient') {
        triggerBanner(reminderNotif);
      }
    }, delaySeconds * 1000);
  }, [role, triggerBanner]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: userNotifications,
        allNotifications,
        unreadCount,
        activeBanner,
        isNotificationCenterVisible,
        dismissBanner,
        openNotificationCenter,
        closeNotificationCenter,
        markAsRead,
        markAllAsRead,
        sendDemoNotification,
        scheduleAppointmentReminder,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
