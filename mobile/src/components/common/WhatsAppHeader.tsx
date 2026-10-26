import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { UserRole } from '../../types';
import { AppIcon } from './AppIcon';

interface WhatsAppHeaderProps {
  title?: string;
  onSearchChange?: (query: string) => void;
  onCameraPress?: () => void;
  onAddPress?: () => void;
}

export const WhatsAppHeader: React.FC<WhatsAppHeaderProps> = ({
  title = 'Upstage Health',
  onSearchChange,
  onCameraPress,
  onAddPress,
}) => {
  const insets = useSafeAreaInsets();
  const { user, role, switchRole, logout } = useAuth();
  const { selectedHospital } = useHospital();
  const { colors: tc, isDark } = useAppTheme();
  const { unreadCount, openNotificationCenter } = useNotifications();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Time-based greeting matching the screenshot style ("Good Morning!")
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 17) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'owner':
        return { label: 'Owner', color: '#8B5CF6', bg: '#EDE9FE' };
      case 'doctor':
        return { label: 'Doctor', color: '#2563EB', bg: '#EFF6FF' };
      case 'receptionist':
        return { label: 'Reception', color: '#059669', bg: '#ECFDF5' };
      case 'patient':
        return { label: 'Patient', color: '#0284C7', bg: '#E0F2FE' };
      case 'delivery':
        return { label: 'Courier', color: '#D97706', bg: '#FEF3C7' };
      case 'staff':
      default:
        return { label: 'Staff', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const currentBadge = getRoleBadge(role);

  const roles: Array<{ role: UserRole; title: string; desc: string; icon: string }> = [
    { role: 'owner', title: 'Hospital Owner (Master MD)', desc: 'Manage credentials, attendance, payroll & revenue', icon: 'business-outline' },
    { role: 'doctor', title: 'Doctor / Radiologist (Scan Room 1)', desc: 'Call queue, review scanned reports, write Rx', icon: 'pulse-outline' },
    { role: 'receptionist', title: 'Receptionist (Desk 1)', desc: 'Scan X-rays/reports, book walk-ins, collect payments', icon: 'clipboard-outline' },
    { role: 'delivery', title: 'Scan Delivery Courier', desc: 'GPS tracking, hospital film deliveries & signature proof', icon: 'bicycle-outline' },
    { role: 'patient', title: 'Patient (Gowri T)', desc: 'Find nearby hospitals, book slots, view live token pass', icon: 'person-outline' },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = user?.name || (role === 'doctor' ? 'Dr. Jerry Simanungkalit' : title);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tc.headerBackground,
          borderBottomColor: tc.cardBorder,
          paddingTop: insets.top > 0 ? insets.top + 4 : (Platform.OS === 'ios' ? 44 : 24),
        },
      ]}
    >
      {searchExpanded ? (
        <View
          style={[
            styles.expandedSearchRow,
            {
              backgroundColor: isDark ? tc.card : '#FFFFFF',
              borderColor: tc.cardBorder,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.searchBackBtn}
            onPress={() => {
              setSearchExpanded(false);
              setSearchQuery('');
              if (onSearchChange) onSearchChange('');
            }}
          >
            <AppIcon name="arrow-back" size={20} color={tc.text} />
          </TouchableOpacity>
          <TextInput
            style={[styles.searchInput, { color: tc.text }]}
            placeholder="Search patients, doctors, tokens..."
            placeholderTextColor={tc.textTertiary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (onSearchChange) onSearchChange(text);
            }}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                if (onSearchChange) onSearchChange('');
              }}
            >
              <AppIcon name="close-circle" size={18} color={tc.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* Modern Airy Header (Screenshots 1 & 2 aesthetic) */
        <View style={styles.topRow}>
          {/* Left: User Avatar + Greeting */}
          <TouchableOpacity
            style={styles.profileSection}
            activeOpacity={0.7}
            onPress={() => setShowRoleModal(true)}
          >
            <View style={styles.avatarWrap}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}>
                  <Text style={[styles.avatarInitials, { color: colors.brand.primary }]}>
                    {getInitials(displayName)}
                  </Text>
                </View>
              )}
              {/* Online Dot */}
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.greetingCol}>
              <Text style={[styles.greetingText, { color: tc.textSecondary }]}>
                {getGreeting()}
              </Text>
              <Text style={[styles.profileName, { color: tc.text }]} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Right: Search, Notifications & Role Capsule */}
          <View style={styles.actionsArea}>
            {/* Search Button */}
            <TouchableOpacity
              style={[
                styles.circleBtn,
                {
                  backgroundColor: isDark ? tc.card : '#FFFFFF',
                  borderColor: tc.cardBorder,
                },
              ]}
              onPress={() => setSearchExpanded(true)}
              activeOpacity={0.7}
            >
              <AppIcon name="search-outline" size={18} color={tc.text} />
            </TouchableOpacity>

            {/* Notification Bell Button */}
            <TouchableOpacity
              style={[
                styles.circleBtn,
                {
                  backgroundColor: isDark ? tc.card : '#FFFFFF',
                  borderColor: tc.cardBorder,
                },
              ]}
              onPress={openNotificationCenter}
              activeOpacity={0.7}
            >
              <AppIcon name="notifications-outline" size={18} color={tc.text} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Role Switcher Capsule */}
            <TouchableOpacity
              style={[
                styles.roleCapsule,
                {
                  backgroundColor: isDark ? '#1E293B' : currentBadge.bg,
                  borderColor: isDark ? '#334155' : currentBadge.color + '40',
                },
              ]}
              onPress={() => setShowRoleModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.roleDot, { backgroundColor: currentBadge.color }]} />
              <Text style={[styles.roleCapsuleText, { color: isDark ? '#E2E8F0' : currentBadge.color }]}>
                {currentBadge.label}
              </Text>
              <AppIcon
                name="chevron-down"
                size={11}
                color={isDark ? '#94A3B8' : currentBadge.color}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Role Switcher Glass Modal */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRoleModal(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#131C2E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Switch Profile Role
              </Text>
              <Text style={[styles.modalSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Hospital: {selectedHospital.name}
              </Text>
            </View>

            {roles.map((item) => {
              const isSelected = role === item.role;
              return (
                <TouchableOpacity
                  key={item.role}
                  style={[
                    styles.roleItem,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? '#1E293B' : '#EFF6FF')
                        : (isDark ? '#0F172A' : '#F8FAFC'),
                      borderColor: isSelected ? colors.brand.primary : (isDark ? '#1E293B' : '#E2E8F0'),
                    },
                  ]}
                  onPress={() => {
                    switchRole(item.role);
                    setShowRoleModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.roleIconWrap,
                      {
                        backgroundColor: isSelected
                          ? colors.brand.primary
                          : (isDark ? '#1E293B' : '#E2E8F0'),
                      },
                    ]}
                  >
                    <AppIcon
                      name={item.icon}
                      size={20}
                      color={isSelected ? '#FFFFFF' : (isDark ? '#94A3B8' : '#475569')}
                    />
                  </View>
                  <View style={styles.roleItemInfo}>
                    <View style={styles.roleItemTitleRow}>
                      <Text
                        style={[
                          styles.roleItemTitle,
                          {
                            color: isSelected
                              ? (isDark ? '#60A5FA' : colors.brand.primary)
                              : (isDark ? '#F1F5F9' : '#0F172A'),
                          },
                        ]}
                      >
                        {item.title}
                      </Text>
                      {isSelected && (
                        <View style={[styles.activeCheckBadge, { backgroundColor: colors.brand.primary }]}>
                          <Text style={styles.activeCheckText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.roleItemDesc,
                        { color: isDark ? '#94A3B8' : '#64748B' },
                      ]}
                    >
                      {item.desc}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.closeModalButton,
                { backgroundColor: '#FEE2E2', marginTop: 14, marginBottom: 8 },
              ]}
              onPress={() => {
                setShowRoleModal(false);
                logout();
              }}
            >
              <Text style={[styles.closeModalText, { color: '#DC2626', fontWeight: '700' }]}>
                🔒 Sign Out / Switch to Login Screen
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.closeModalButton,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={[styles.closeModalText, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  greetingCol: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  actionsArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      } as any,
    }),
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  roleCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  roleCapsuleText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  expandedSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      } as any,
    }),
  },
  searchBackBtn: {
    padding: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 19, 21, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 28,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      } as any,
    }),
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 12.5,
    marginTop: 3,
    fontWeight: '500',
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  roleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleItemInfo: {
    flex: 1,
  },
  roleItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  activeCheckBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeCheckText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  roleItemDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
  closeModalButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
  },
  closeModalText: {
    fontSize: 13,
  },
});
