import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Appointment } from '../../types';
import { AppIcon } from '../../components/common/AppIcon';
import { PulsingStatusDot } from '../../components/common/PulsingStatusDot';
import { AnimatedPressableCard } from '../../components/common/AnimatedPressableCard';

interface DoctorQueueScreenProps {
  initialFilter?: 'all' | 'waiting' | 'in_consultation' | 'completed';
  onSelectConsultation: (apt: Appointment) => void;
}

export const DoctorQueueScreen: React.FC<DoctorQueueScreenProps> = ({
  initialFilter = 'waiting',
  onSelectConsultation,
}) => {
  const { user } = useAuth();
  const { appointments, activeQueue, callNextPatient } = useHospital();
  const { colors: tc, isDark } = useAppTheme();
  const doctorId = 'usr_doc_jenkins';

  const [filter, setFilter] = useState<'all' | 'waiting' | 'in_consultation' | 'completed'>(
    initialFilter || 'waiting'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Filter doctor's appointments
  const doctorAppointments = appointments.filter((a) => a.doctorId === doctorId || !a.doctorId);

  // Active patient in room
  const activePatient =
    doctorAppointments.find((a) => a.status === 'in_consultation') ||
    doctorAppointments.find((a) => a.tokenNumber === activeQueue.currentToken && a.status !== 'completed');

  // Filtered queue based on tab and search
  const filteredQueue = doctorAppointments.filter((apt) => {
    if (filter === 'waiting' && apt.status !== 'checked_in' && apt.status !== 'waiting') return false;
    if (filter === 'in_consultation' && apt.status !== 'in_consultation') return false;
    if (filter === 'completed' && apt.status !== 'completed') return false;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = apt.patientName.toLowerCase().includes(q);
      const matchesToken = apt.tokenNumber.toString().includes(q);
      const matchesSymptoms = (apt.symptoms || '').toLowerCase().includes(q);
      const matchesPhone = apt.patientPhone.toLowerCase().includes(q);
      if (!matchesName && !matchesToken && !matchesSymptoms && !matchesPhone) {
        return false;
      }
    }
    return true;
  });

  const waitingCount = doctorAppointments.filter((a) => a.status === 'checked_in' || a.status === 'waiting').length;
  const inRoomCount = doctorAppointments.filter((a) => a.status === 'in_consultation').length;
  const completedCount = doctorAppointments.filter((a) => a.status === 'completed').length;

  const handleCallNext = () => {
    callNextPatient(doctorId);
    const msg = `Called Next Patient (Token #${activeQueue.nextToken}) • TV Monitor in Scan Room 1 Updated!`;
    showToast(msg);
    if (Platform.OS === 'web') {
      // web friendly toast
    } else {
      Alert.alert('Patient Called', `Token #${activeQueue.nextToken} called to Scan Room 1.`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const summarizeText = (text?: string, fallback = 'Routine Consult') => {
    if (!text || !text.trim()) return fallback;
    const words = text.trim().split(/\s+/);
    if (words.length <= 2) return text;
    return `${words[0]} ${words[1]}`;
  };

  const renderQueueItem = ({ item }: { item: Appointment }) => {
    const isInsideRoom = item.status === 'in_consultation';
    const isWaiting = item.status === 'checked_in' || item.status === 'waiting';
    const isCompleted = item.status === 'completed';
    const hasScans = item.scannedReports && item.scannedReports.length > 0;
    const complaintSummary = summarizeText(item.symptoms, 'Consult');

    return (
      <AnimatedPressableCard
        style={[
          styles.queueCard,
          {
            backgroundColor: tc.card,
            borderColor: isInsideRoom ? '#2563EB' : tc.cardBorder,
          },
          isInsideRoom && styles.queueCardActive,
        ]}
        onPress={() => onSelectConsultation(item)}
      >
        {/* Profile Avatar (50px) with Token Tag */}
        <View style={styles.avatarWrap}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' },
              isInsideRoom && styles.avatarCircleActive,
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: isInsideRoom ? '#2563EB' : (isDark ? '#60A5FA' : '#2563EB') },
              ]}
            >
              {getInitials(item.patientName)}
            </Text>
          </View>
          <View style={[styles.tokenBadge, isInsideRoom && styles.tokenBadgeActive]}>
            <Text style={styles.tokenBadgeText}>#{item.tokenNumber}</Text>
          </View>
        </View>

        {/* Clean Responsive Content */}
        <View style={styles.contentCol}>
          {/* Line 1: Patient Name + Time Slot */}
          <View style={styles.lineOne}>
            <Text style={[styles.patientName, { color: tc.text }]} numberOfLines={1}>
              {item.patientName}
            </Text>
            <View style={[styles.timeSlotBadge, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Text style={[styles.timeText, { color: tc.textSecondary }]}>{item.timeSlot}</Text>
            </View>
          </View>

          {/* Line 2: Demographics, Complaint & Status */}
          <View style={styles.lineTwo}>
            <View style={styles.summaryMetaRow}>
              <Text style={[styles.metaSubText, { color: tc.textSecondary }]} numberOfLines={1}>
                {item.patientAge}y • {item.patientGender} • {complaintSummary}
              </Text>
              {hasScans && (
                <View style={styles.scansIndicator}>
                  <Text style={styles.scansIndicatorText}>🩻 {item.scannedReports.length}</Text>
                </View>
              )}
            </View>

            {/* Right Status Pill */}
            <View style={styles.rightActionWrap}>
              {isInsideRoom ? (
                <View style={styles.inRoomPill}>
                  <PulsingStatusDot color="#10B981" size={6} active={true} style={{ marginRight: 4 }} />
                  <Text style={styles.inRoomPillText}>In Cabin</Text>
                </View>
              ) : isWaiting ? (
                <View style={styles.waitingPill}>
                  <Text style={styles.waitingPillText}>Waiting</Text>
                </View>
              ) : isCompleted ? (
                <View style={styles.completedPill}>
                  <Text style={styles.completedPillText}>Done ✓</Text>
                </View>
              ) : (
                <View style={[styles.waitingPill, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={[styles.waitingPillText, { color: '#64748B' }]}>Booked</Text>
                </View>
              )}
              <AppIcon name="chevron-forward" size={14} color="#94A3B8" style={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>
      </AnimatedPressableCard>
    );
  };

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

      {/* Royal Blue Hero Card (Screenshots 1 & 2 aesthetic) */}
      <View style={styles.stackCardWrapper}>
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? '#1E3A8A' : colors.brand.primary,
            },
          ]}
        >
          {/* Top row: Room & Live Status */}
          <View style={styles.heroTopRow}>
            <View style={styles.heroLabelRow}>
              <PulsingStatusDot
                color="#6EE7B7"
                size={8}
                active={!!activePatient}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.heroCardTitle}>
                {user?.doctorProfile?.roomNumber || 'Scan Room 1'}
              </Text>
            </View>
            <View style={styles.heroPillTag}>
              <Text style={styles.heroPillTagText}>
                {activePatient ? 'IN CONSULTATION' : 'CABIN READY'}
              </Text>
            </View>
          </View>

          {/* Middle: Active Patient or Ready */}
          {activePatient ? (
            <TouchableOpacity
              style={styles.heroMiddleRow}
              activeOpacity={0.85}
              onPress={() => onSelectConsultation(activePatient)}
            >
              <View style={styles.heroPatientCol}>
                <Text style={styles.heroPatientSubtitle}>Currently In Session</Text>
                <Text style={styles.heroPatientName} numberOfLines={1}>
                  {activePatient.patientName}
                </Text>
                <Text style={styles.heroDoctorMeta} numberOfLines={1}>
                  Token #{activePatient.tokenNumber} • {activePatient.patientAge}y • {activePatient.patientGender}
                </Text>
              </View>
              {/* Circular Action Button */}
              <View style={styles.heroCircleArrowBtn}>
                <AppIcon name="arrow-forward" size={18} color={colors.brand.primary} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.heroMiddleRow}>
              <View style={styles.heroPatientCol}>
                <Text style={styles.heroPatientSubtitle}>Consultation Desk</Text>
                <Text style={styles.heroPatientName}>Cabin Ready</Text>
                <Text style={styles.heroDoctorMeta}>
                  Ready for Token #{activeQueue.nextToken} • {waitingCount} in queue
                </Text>
              </View>
              <TouchableOpacity
                style={styles.heroCircleArrowBtn}
                activeOpacity={0.8}
                onPress={handleCallNext}
              >
                <AppIcon name="arrow-forward" size={18} color={colors.brand.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Bar: Queue count and Call next patient */}
          <View style={styles.heroBottomRow}>
            <View style={styles.heroQueuePill}>
              <Text style={styles.heroQueuePillText}>
                👥 {waitingCount} in waiting queue
              </Text>
            </View>
            <TouchableOpacity
              style={styles.heroCallBtn}
              activeOpacity={0.85}
              onPress={handleCallNext}
            >
              <AppIcon name="people" size={14} color="#FFFFFF" />
              <Text style={styles.heroCallBtnText}>
                Call Token #{activeQueue.nextToken}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar with clean minimalist styling */}
      <View style={[styles.searchBarWrapper, { backgroundColor: tc.background }]}>
        <View style={[styles.searchBarContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: tc.cardBorder }]}>
          <AppIcon name="search-outline" size={16} color={tc.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: tc.text }]}
            placeholder="Search queue, patients, token #..."
            placeholderTextColor={tc.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="never"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.searchInnerClearBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AppIcon name="close-circle" size={16} color={tc.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modern Capsule Filter Tabs */}
      <View style={[styles.filterTabsRow, { backgroundColor: tc.background }]}>
        {(['all', 'waiting', 'in_consultation', 'completed'] as const).map((tabKey) => {
          const isActive = filter === tabKey;
          const label =
            tabKey === 'all'
              ? `All (${doctorAppointments.length})`
              : tabKey === 'waiting'
              ? `Waiting (${waitingCount})`
              : tabKey === 'in_consultation'
              ? `In Cabin (${inRoomCount})`
              : `Done (${completedCount})`;

          return (
            <TouchableOpacity
              key={tabKey}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isActive
                    ? (isDark ? '#F8FAFC' : '#0F172A')
                    : (isDark ? '#1E293B' : '#FFFFFF'),
                  borderColor: isActive
                    ? (isDark ? '#F8FAFC' : '#0F172A')
                    : tc.cardBorder,
                },
              ]}
              onPress={() => setFilter(tabKey)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color: isActive
                      ? (isDark ? '#0F172A' : '#FFFFFF')
                      : tc.textSecondary,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Minimal Queue List */}
      <FlatList
        data={filteredQueue}
        keyExtractor={(item) => item.id}
        renderItem={renderQueueItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 34, marginBottom: 8 }}>🩺</Text>
            <Text style={[styles.emptyTitle, { color: tc.text }]}>No Patients in This Queue</Text>
            <Text style={[styles.emptySubtitle, { color: tc.textSecondary }]}>
              {searchQuery
                ? `No patients matching "${searchQuery}"`
                : 'All patient consultations for this category have been attended to.'}
            </Text>
          </View>
        }
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
  },
  stackCardWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#1D4ED8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
      } as any,
    }),
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  heroPillTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  heroPillTagText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  heroPatientCol: {
    flex: 1,
    marginRight: 12,
  },
  heroPatientSubtitle: {
    color: '#BFDBFE',
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  heroPatientName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroDoctorMeta: {
    color: '#DBEAFE',
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  heroCircleArrowBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
  },
  heroQueuePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  heroQueuePillText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  heroCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  heroCallBtnText: {
    color: colors.brand.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    padding: 0,
  },
  searchInnerClearBtn: {
    padding: 2,
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 120,
  },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  queueCardActive: {
    borderWidth: 1.5,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleActive: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
  },
  tokenBadge: {
    position: 'absolute',
    bottom: -2,
    right: -3,
    backgroundColor: '#0F172A',
    borderRadius: 9,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tokenBadgeActive: {
    backgroundColor: '#10B981',
  },
  tokenBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
  },
  lineOne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  patientName: {
    fontSize: 15.5,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  timeSlotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lineTwo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  metaSubText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  scansIndicator: {
    backgroundColor: '#E0F2FE',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2.5,
  },
  scansIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  rightActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inRoomPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inRoomPillText: {
    color: '#15803D',
    fontSize: 10.5,
    fontWeight: '700',
  },
  waitingPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  waitingPillText: {
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: '700',
  },
  completedPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  completedPillText: {
    color: '#0369A1',
    fontSize: 10.5,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 12.5,
    marginTop: 4,
    textAlign: 'center',
  },
});
