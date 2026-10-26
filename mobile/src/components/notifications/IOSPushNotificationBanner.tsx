import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationContext';
import { useAppTheme } from '../../context/ThemeContext';
import { AppIcon } from '../common/AppIcon';
import { colors } from '../../theme/colors';

export const IOSPushNotificationBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { activeBanner, dismissBanner, openNotificationCenter, markAsRead } = useNotifications();
  const { colors: tc, isDark } = useAppTheme();

  const translateY = useRef(new Animated.Value(-160)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeBanner) {
      // Animate in from top
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out to top
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -160,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeBanner, translateY, opacity]);

  // Swipe up to dismiss gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy < -6;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -20) {
          dismissBanner();
        }
      },
    })
  ).current;

  if (!activeBanner) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return '#8B5CF6';
      case 'doctor':
        return '#10B981';
      case 'receptionist':
        return '#F59E0B';
      case 'patient':
        return '#3B82F6';
      default:
        return colors.whatsapp.primary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment_booked':
      case 'appointment_confirmed':
        return 'calendar';
      case 'appointment_reminder':
        return 'time-outline';
      case 'queue_turn_called':
        return 'pulse-outline';
      case 'consultation_completed':
        return 'medkit';
      case 'payment_received':
      case 'payment_recorded':
        return 'cash';
      case 'report_attached':
        return 'scan';
      default:
        return 'bell';
    }
  };

  const handlePress = () => {
    markAsRead(activeBanner.id);
    dismissBanner();
    openNotificationCenter();
  };

  const topOffset = insets.top > 0 ? insets.top + 6 : (Platform.OS === 'ios' ? 44 : 20);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: topOffset,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(28, 28, 30, 0.96)' : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {/* Top Header Row of Push Notification */}
        <View style={styles.topRow}>
          <View style={styles.appBranding}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.appIcon}
            />
            <Text style={[styles.appName, { color: tc.textSecondary }]}>UPSTAGE HEALTH</Text>
            <View
              style={[
                styles.rolePill,
                { backgroundColor: getRoleBadgeColor(activeBanner.recipientRole) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.rolePillText,
                  { color: getRoleBadgeColor(activeBanner.recipientRole) },
                ]}
              >
                {activeBanner.recipientRole.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.timeText, { color: tc.textSecondary }]}>now</Text>
            <TouchableOpacity
              onPress={dismissBanner}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <AppIcon name="close" size={14} color={tc.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Row */}
        <View style={styles.bodyRow}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: getRoleBadgeColor(activeBanner.recipientRole) + '18' },
            ]}
          >
            <AppIcon
              name={getTypeIcon(activeBanner.type)}
              size={18}
              color={getRoleBadgeColor(activeBanner.recipientRole)}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: tc.text }]} numberOfLines={1}>
              {activeBanner.title}
            </Text>
            <Text style={[styles.message, { color: tc.textSecondary }]} numberOfLines={2}>
              {activeBanner.message}
            </Text>
          </View>
        </View>

        {/* Swipe Pill Handle Indicator */}
        <View style={styles.pillContainer}>
          <View style={[styles.pillBar, { backgroundColor: isDark ? '#4B5563' : '#D1D5DB' }]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 99999,
    elevation: 99999,
  },
  container: {
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  appBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appIcon: {
    width: 17,
    height: 17,
    borderRadius: 4,
  },
  appName: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  rolePillText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 2,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  pillContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  pillBar: {
    width: 36,
    height: 3,
    borderRadius: 1.5,
  },
});
