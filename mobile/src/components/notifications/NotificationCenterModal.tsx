import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { AppIcon } from '../common/AppIcon';
import { colors } from '../../theme/colors';
import { AppNotification, NotificationType, UserRole } from '../../types';

export const NotificationCenterModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { role, user } = useAuth();
  const { colors: tc, isDark } = useAppTheme();
  const {
    notifications,
    allNotifications,
    isNotificationCenterVisible,
    closeNotificationCenter,
    markAsRead,
    markAllAsRead,
    sendDemoNotification,
  } = useNotifications();

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'appointments' | 'payments' | 'reports'>('all');
  const [viewRole, setViewRole] = useState<UserRole | 'current'>('current');

  if (!isNotificationCenterVisible) return null;

  // Active role for filtering
  const targetRole = viewRole === 'current' ? role : viewRole;

  // Filter list
  const currentRoleNotifs = viewRole === 'current'
    ? notifications
    : allNotifications.filter(n => n.recipientRole === targetRole);

  const filteredNotifs = currentRoleNotifs.filter(n => {
    if (selectedCategory === 'appointments') {
      return (
        n.type === 'appointment_booked' ||
        n.type === 'appointment_confirmed' ||
        n.type === 'appointment_reminder' ||
        n.type === 'queue_turn_called'
      );
    }
    if (selectedCategory === 'payments') {
      return n.type === 'payment_received' || n.type === 'payment_recorded';
    }
    if (selectedCategory === 'reports') {
      return n.type === 'report_attached' || n.type === 'consultation_completed';
    }
    return true;
  });

  const unreadCount = currentRoleNotifs.filter(n => !n.read).length;

  const getRoleColor = (r: UserRole) => {
    switch (r) {
      case 'owner':
        return '#8B5CF6';
      case 'doctor':
        return '#10B981';
      case 'receptionist':
        return '#F59E0B';
      case 'patient':
        return '#3B82F6';
    }
  };

  const getTypeIcon = (type: NotificationType) => {
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

  const formatTimestamp = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <Modal
      visible={isNotificationCenterVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={closeNotificationCenter}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: tc.background,
            paddingTop: insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 20),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
          },
        ]}
      >
        {/* Navigation Bar Header */}
        <View style={[styles.header, { borderBottomColor: tc.cardBorder }]}>
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: tc.text }]}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount} New</Text>
                </View>
              )}
            </View>
            <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
              {viewRole === 'current'
                ? `${user?.name || 'User'} (${role.toUpperCase()}) Inbox`
                : `${viewRole.toUpperCase()} Inbox Preview`}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllBtn}
                onPress={markAllAsRead}
                activeOpacity={0.7}
              >
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}
              onPress={closeNotificationCenter}
              activeOpacity={0.8}
            >
              <Text style={[styles.doneBtnText, { color: colors.whatsapp.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Multi-Role Inbox Switcher Pills */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeading, { color: tc.textSecondary }]}>
              VIEW ROLE NOTIFICATIONS
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleTabs}>
              <TouchableOpacity
                style={[
                  styles.roleTabPill,
                  viewRole === 'current' && {
                    backgroundColor: colors.whatsapp.primary,
                    borderColor: colors.whatsapp.primary,
                  },
                ]}
                onPress={() => setViewRole('current')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.roleTabText,
                    { color: viewRole === 'current' ? '#FFFFFF' : tc.textSecondary },
                  ]}
                >
                  My Active Role ({role.toUpperCase()})
                </Text>
              </TouchableOpacity>

              {(['patient', 'doctor', 'receptionist', 'owner'] as UserRole[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleTabPill,
                    viewRole === r && {
                      backgroundColor: getRoleColor(r),
                      borderColor: getRoleColor(r),
                    },
                  ]}
                  onPress={() => setViewRole(r)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.roleTabText,
                      { color: viewRole === r ? '#FFFFFF' : tc.textSecondary },
                    ]}
                  >
                    {r.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Interactive Live Demo Trigger Bar */}
          <View
            style={[
              styles.demoTriggerCard,
              {
                backgroundColor: isDark ? '#1C2E2A' : '#ECFDF5',
                borderColor: isDark ? '#234E44' : '#A7F3D0',
              },
            ]}
          >
            <View style={styles.demoHeaderRow}>
              <AppIcon name="flash" size={14} color="#059669" />
              <Text style={[styles.demoTitle, { color: isDark ? '#6EE7B7' : '#047857' }]}>
                TRIGGER LIVE TEST NOTIFICATIONS
              </Text>
            </View>
            <Text style={[styles.demoDesc, { color: isDark ? '#D1FAE5' : '#065F46' }]}>
              Test push banners for appointment reminders, payments, and clinic queue alerts:
            </Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => sendDemoNotification('appointment_reminder')}
                activeOpacity={0.8}
              >
                <Text style={styles.demoBtnText}>⏰ Reminder</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => sendDemoNotification('payment_received')}
                activeOpacity={0.8}
              >
                <Text style={styles.demoBtnText}>💳 Payment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => sendDemoNotification('queue_turn_called')}
                activeOpacity={0.8}
              >
                <Text style={styles.demoBtnText}>🔔 Turn Alert</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => sendDemoNotification('report_attached')}
                activeOpacity={0.8}
              >
                <Text style={styles.demoBtnText}>🩻 Rx / Report</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Filter Tabs */}
          <View style={styles.filterRow}>
            {(['all', 'appointments', 'payments', 'reports'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  selectedCategory === cat
                    ? { backgroundColor: colors.whatsapp.primary }
                    : { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' },
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: selectedCategory === cat ? '#FFFFFF' : tc.textSecondary,
                      fontWeight: selectedCategory === cat ? '700' : '600',
                    },
                  ]}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notifications List */}
          {filteredNotifs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AppIcon name="notifications-outline" size={44} color={tc.textSecondary} />
              <Text style={[styles.emptyTitle, { color: tc.text }]}>No Notifications Yet</Text>
              <Text style={[styles.emptySubtitle, { color: tc.textSecondary }]}>
                New appointment bookings, payment receipts, and diagnostic report updates will appear here in real-time.
              </Text>
            </View>
          ) : (
            <View style={styles.notifList}>
              {filteredNotifs.map((item) => {
                const roleColor = getRoleColor(item.recipientRole);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.notifCard,
                      {
                        backgroundColor: tc.card,
                        borderColor: item.read ? tc.cardBorder : roleColor + '60',
                      },
                      !item.read && {
                        borderLeftWidth: 3.5,
                        borderLeftColor: roleColor,
                      },
                    ]}
                    onPress={() => markAsRead(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={[styles.notifIconWrap, { backgroundColor: roleColor + '18' }]}>
                          <AppIcon name={getTypeIcon(item.type)} size={16} color={roleColor} />
                        </View>
                        <View style={styles.headerTextCol}>
                          <Text style={[styles.notifTitle, { color: tc.text }]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={[styles.notifTime, { color: tc.textSecondary }]}>
                            {formatTimestamp(item.timestamp)}
                          </Text>
                        </View>
                      </View>

                      {!item.read && (
                        <View style={[styles.unreadDot, { backgroundColor: roleColor }]} />
                      )}
                    </View>

                    <Text style={[styles.notifMessage, { color: tc.textSecondary }]}>
                      {item.message}
                    </Text>

                    {/* Metadata Badges if present */}
                    {(item.tokenNumber || item.metadata?.amount || item.metadata?.roomNumber) && (
                      <View style={styles.metaBadgesRow}>
                        {item.tokenNumber && (
                          <View style={[styles.metaBadge, { backgroundColor: 'rgba(18, 140, 126, 0.12)' }]}>
                            <Text style={styles.metaBadgeToken}>Token #{item.tokenNumber}</Text>
                          </View>
                        )}
                        {item.metadata?.amount && (
                          <View style={[styles.metaBadge, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
                            <Text style={styles.metaBadgeAmount}>₹{item.metadata.amount}</Text>
                          </View>
                        )}
                        {item.metadata?.roomNumber && (
                          <View style={[styles.metaBadge, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                            <Text style={styles.metaBadgeRoom}>{item.metadata.roomNumber}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  markAllText: {
    color: colors.whatsapp.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  doneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  sectionWrap: {
    gap: 6,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  roleTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  roleTabPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  demoTriggerCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  demoBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterChipText: {
    fontSize: 12,
  },
  notifList: {
    gap: 10,
  },
  notifCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  notifIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  notifTime: {
    fontSize: 10.5,
    marginTop: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
    marginTop: 4,
  },
  notifMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  metaBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  metaBadgeToken: {
    color: colors.whatsapp.primaryDark,
    fontSize: 10,
    fontWeight: '800',
  },
  metaBadgeAmount: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  metaBadgeRoom: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 17,
  },
});
