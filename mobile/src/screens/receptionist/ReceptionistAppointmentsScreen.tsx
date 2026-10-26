import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
  TextInput,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useHospital } from '../../context/HospitalContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Appointment } from '../../types';
import { EmbeddedDocumentScanner } from '../../components/scanner/EmbeddedDocumentScanner';
import { AppIcon } from '../../components/common/AppIcon';
import { PatientDetailScreen } from './PatientDetailScreen';
import { IOSPushTransition } from '../../components/common/IOSPushTransition';
import { PulsingStatusDot } from '../../components/common/PulsingStatusDot';
import { AnimatedPressableCard } from '../../components/common/AnimatedPressableCard';

interface ReceptionistAppointmentsScreenProps {
  onOpenWalkInModal: () => void;
  onOpenPaymentModal: (apt: Appointment) => void;
  onOpenScanner?: (aptId?: string) => void;
  filterMode?: 'all' | 'waiting' | 'in_consultation' | 'completed';
  onSelectPatient?: (apt: Appointment) => void;
}

export const ReceptionistAppointmentsScreen: React.FC<ReceptionistAppointmentsScreenProps> = ({
  onOpenWalkInModal,
  onOpenPaymentModal,
  onOpenScanner,
  filterMode,
  onSelectPatient,
}) => {
  const { appointments } = useHospital();
  const { colors: tc, isDark } = useAppTheme();
  const [filter, setFilter] = useState<'all' | 'waiting' | 'in_consultation' | 'completed'>(
    filterMode || 'waiting'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPatientApt, setSelectedPatientApt] = useState<Appointment | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedAptForScan, setSelectedAptForScan] = useState<string | undefined>(undefined);
  const [activeActionSheetApt, setActiveActionSheetApt] = useState<Appointment | null>(null);

  const handlePatientPress = (apt: Appointment) => {
    if (onSelectPatient) {
      onSelectPatient(apt);
    } else {
      setSelectedPatientApt(apt);
      setIsDetailVisible(true);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = apt.patientName.toLowerCase().includes(q);
      const matchesPhone = apt.patientPhone.toLowerCase().includes(q);
      const matchesToken = apt.tokenNumber.toString().includes(q);
      const matchesDoctor = apt.doctorName.toLowerCase().includes(q);
      const matchesSymptoms = apt.symptoms?.toLowerCase().includes(q);
      if (!matchesName && !matchesPhone && !matchesToken && !matchesDoctor && !matchesSymptoms) {
        return false;
      }
    }
    if (filter === 'waiting') return apt.status === 'checked_in' || apt.status === 'waiting';
    if (filter === 'in_consultation') return apt.status === 'in_consultation';
    if (filter === 'completed') return apt.status === 'completed';
    return true;
  });

  const waitingCount = appointments.filter((a) => a.status === 'checked_in' || a.status === 'waiting').length;
  const inRoomCount = appointments.filter((a) => a.status === 'in_consultation').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  const activeInRoom = appointments.find((a) => a.status === 'in_consultation');


  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const hasReports = item.scannedReports.length > 0;
    const isInsideRoom = item.status === 'in_consultation';
    const isWaiting = item.status === 'checked_in' || item.status === 'waiting';
    const isCompleted = item.status === 'completed';
    const isPaid = item.paymentStatus === 'paid';

    return (
      <AnimatedPressableCard
        style={[
          styles.appointmentCard,
          {
            backgroundColor: tc.card,
            borderColor: isInsideRoom ? '#2563EB' : tc.cardBorder,
          },
          isInsideRoom && styles.appointmentCardActive,
        ]}
        onPress={() => handlePatientPress(item)}
      >
        {/* Profile Avatar with Token Tag */}
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
          {/* Line 1: Patient Name + Time */}
          <View style={styles.lineOne}>
            <Text style={[styles.patientName, { color: tc.text }]} numberOfLines={1}>
              {item.patientName}
            </Text>
            <View style={[styles.timeSlotBadge, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Text style={[styles.timeText, { color: tc.textSecondary }]}>{item.timeSlot}</Text>
            </View>
          </View>

          {/* Line 2: Doctor & Room + Right Status Pill */}
          <View style={styles.lineTwo}>
            <View style={styles.summaryMetaRow}>
              <Text style={[styles.doctorSubtitleText, { color: tc.textSecondary }]} numberOfLines={1}>
                {item.roomNumber} • Dr. {item.doctorName.split(' ')[1] || item.doctorName}
              </Text>
              {hasReports && (
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
                  <Text style={styles.inRoomPillText}>In Room</Text>
                </View>
              ) : isWaiting ? (
                <View style={styles.waitingPill}>
                  <Text style={styles.waitingPillText}>Waiting</Text>
                </View>
              ) : (
                <View style={styles.completedPill}>
                  <Text style={styles.completedPillText}>Done ✓</Text>
                </View>
              )}
              <AppIcon name="chevron-forward" size={14} color="#94A3B8" style={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>
      </AnimatedPressableCard>
    );
  };

  const mainScreen = (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
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
          {/* Top row: Label + Live Status */}
          <View style={styles.heroTopRow}>
            <View style={styles.heroLabelRow}>
              <PulsingStatusDot
                color="#6EE7B7"
                size={8}
                active={inRoomCount > 0}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.heroCardTitle}>
                OPD Consultation Cabin
              </Text>
            </View>
            <View style={styles.heroPillTag}>
              <Text style={styles.heroPillTagText}>
                {inRoomCount > 0 ? `${inRoomCount} Active` : 'Ready'}
              </Text>
            </View>
          </View>

          {/* Middle: Active Patient or Ready state */}
          {activeInRoom ? (
            <TouchableOpacity
              style={styles.heroMiddleRow}
              activeOpacity={0.85}
              onPress={() => handlePatientPress(activeInRoom)}
            >
              <View style={styles.heroPatientCol}>
                <Text style={styles.heroPatientSubtitle}>Currently in consultation</Text>
                <Text style={styles.heroPatientName} numberOfLines={1}>
                  {activeInRoom.patientName}
                </Text>
                <Text style={styles.heroDoctorMeta} numberOfLines={1}>
                  Dr. {activeInRoom.doctorName} • #{activeInRoom.tokenNumber} • {activeInRoom.roomNumber}
                </Text>
              </View>
              {/* Circular Action Button with Arrow ↗ */}
              <View style={styles.heroCircleArrowBtn}>
                <AppIcon name="arrow-forward" size={18} color={colors.brand.primary} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.heroMiddleRow}>
              <View style={styles.heroPatientCol}>
                <Text style={styles.heroPatientSubtitle}>Clinic Status</Text>
                <Text style={styles.heroPatientName}>Cabins Ready</Text>
                <Text style={styles.heroDoctorMeta}>
                  {waitingCount} patients waiting in queue
                </Text>
              </View>
              <TouchableOpacity
                style={styles.heroCircleArrowBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (appointments.length > 0) {
                    const firstWaiting = appointments.find(a => a.status === 'waiting' || a.status === 'checked_in');
                    if (firstWaiting) handlePatientPress(firstWaiting);
                  }
                }}
              >
                <AppIcon name="arrow-forward" size={18} color={colors.brand.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Bar: Queue count and Attach scan button */}
          <View style={styles.heroBottomRow}>
            <View style={styles.heroQueuePill}>
              <Text style={styles.heroQueuePillText}>
                👥 {waitingCount} in waiting lounge
              </Text>
            </View>
            <TouchableOpacity
              style={styles.heroScanBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (onOpenScanner) onOpenScanner();
                else setScannerOpen(true);
              }}
            >
              <AppIcon name="scan-outline" size={14} color="#FFFFFF" />
              <Text style={styles.heroScanBtnText}>Scan Report</Text>
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
            placeholder="Search patients, tokens, doctor..."
            placeholderTextColor={tc.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="never"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.searchInnerClearBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Clear search"
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
              ? `All (${appointments.length})`
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

      {/* Clean Minimal FlatList */}
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointmentItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AppIcon name="search-outline" size={32} color={tc.textTertiary} />
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
              {searchQuery.trim().length > 0
                ? `No appointments matching "${searchQuery}"`
                : 'No appointments in this category'}
            </Text>
          </View>
        }
      />

      {/* Native iOS Action Sheet Modal on Row Tap */}
      <Modal
        visible={!!activeActionSheetApt}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveActionSheetApt(null)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setActiveActionSheetApt(null)}
        >
          <View style={styles.sheetCard}>
            <View style={styles.sheetDragHandle} />

            {activeActionSheetApt && (
              <>
                {/* Header */}
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetAvatar}>
                    <Text style={styles.sheetAvatarText}>
                      {getInitials(activeActionSheetApt.patientName)}
                    </Text>
                  </View>
                  <View style={styles.sheetTitleCol}>
                    <Text style={styles.sheetPatientName}>
                      {activeActionSheetApt.patientName}
                    </Text>
                    <Text style={styles.sheetMeta}>
                      Token #{activeActionSheetApt.tokenNumber} • {activeActionSheetApt.patientGender}, {activeActionSheetApt.patientAge}y • {activeActionSheetApt.timeSlot}
                    </Text>
                    <Text style={styles.sheetDoctor}>
                      {activeActionSheetApt.doctorName} ({activeActionSheetApt.roomNumber})
                    </Text>
                  </View>
                </View>

                {/* Symptoms Box */}
                {activeActionSheetApt.symptoms && (
                  <View style={styles.sheetSymptoms}>
                    <Text style={styles.sheetSymptomsLabel}>Symptoms:</Text>
                    <Text style={styles.sheetSymptomsText}>"{activeActionSheetApt.symptoms}"</Text>
                  </View>
                )}

                {/* Scanned Reports Count */}
                {activeActionSheetApt.scannedReports.length > 0 && (
                  <View style={styles.sheetReports}>
                    <Text style={styles.sheetReportsTitle}>Attached Reports ({activeActionSheetApt.scannedReports.length}):</Text>
                    {activeActionSheetApt.scannedReports.map((r) => (
                      <View key={r.id} style={styles.sheetReportRow}>
                        <Text style={styles.sheetReportIcon}>{r.reportType === 'xray' ? '🩻' : '🩸'}</Text>
                        <Text style={styles.sheetReportName}>{r.title}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.sheetActionsGroup}>
                  <TouchableOpacity
                    style={styles.sheetActionBtnScan}
                    onPress={() => {
                      const aptId = activeActionSheetApt.id;
                      setActiveActionSheetApt(null);
                      setSelectedAptForScan(aptId);
                      setScannerOpen(true);
                    }}
                  >
                    <AppIcon name="camera" size={18} color="#FFFFFF" />
                    <Text style={styles.sheetActionBtnTextScan}>
                      {activeActionSheetApt.scannedReports.length > 0 ? 'Scan Additional Reports' : 'Scan Reports (X-Ray/Lab)'}
                    </Text>
                  </TouchableOpacity>

                  {activeActionSheetApt.paymentStatus !== 'paid' && (
                    <TouchableOpacity
                      style={styles.sheetActionBtnPay}
                      onPress={() => {
                        const target = activeActionSheetApt;
                        setActiveActionSheetApt(null);
                        onOpenPaymentModal(target);
                      }}
                    >
                      <AppIcon name="card" size={18} color="#FFFFFF" />
                      <Text style={styles.sheetActionBtnTextPay}>
                        Collect Fee (${activeActionSheetApt.paymentAmount})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setActiveActionSheetApt(null)}
                >
                  <Text style={styles.sheetCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Embedded Document Scanner Modal - lazily mounted */}
      {scannerOpen && (
        <EmbeddedDocumentScanner
          visible={scannerOpen}
          onClose={() => setScannerOpen(false)}
          targetAppointmentId={selectedAptForScan}
        />
      )}
      </View>
  );

  if (onSelectPatient) {
    return mainScreen;
  }

  return (
    <IOSPushTransition
      visible={isDetailVisible && !!selectedPatientApt}
      onBackCompleted={() => setSelectedPatientApt(null)}
      underlyingScreen={mainScreen}
    >
      {selectedPatientApt && (
        <PatientDetailScreen
          appointment={selectedPatientApt}
          onBack={() => setIsDetailVisible(false)}
          onOpenScanner={
            onOpenScanner
              ? onOpenScanner
              : (aptId) => {
                  setSelectedAptForScan(aptId);
                  setScannerOpen(true);
                }
          }
          onOpenPayment={onOpenPaymentModal}
        />
      )}
    </IOSPushTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 11,
    fontWeight: '700',
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
  heroScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  heroScanBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  activePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  pulseDotMini: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
    marginRight: 4,
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
    paddingBottom: 110,
  },
  appointmentCard: {
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
  appointmentCardActive: {
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
  doctorSubtitleText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  microChip: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  microChipText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  paymentChip: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  paymentChipPaid: {
    backgroundColor: '#DCF8C6',
  },
  paymentChipPending: {
    backgroundColor: '#FEF3C7',
  },
  paymentChipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  paymentChipTextPaid: {
    color: '#075E54',
  },
  paymentChipTextPending: {
    color: '#B45309',
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
  paidPill: {
    backgroundColor: '#DCF8C6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  paidPillText: {
    color: '#075E54',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  pendingPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingPillText: {
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  sheetDragHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4338CA',
  },
  sheetTitleCol: {
    flex: 1,
  },
  sheetPatientName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sheetMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sheetDoctor: {
    fontSize: 12,
    color: colors.whatsapp.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  sheetSymptoms: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.whatsapp.primary,
  },
  sheetSymptomsLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  sheetSymptomsText: {
    fontSize: 12.5,
    color: '#334155',
    fontStyle: 'italic',
    marginTop: 2,
  },
  sheetReports: {
    marginBottom: 14,
  },
  sheetReportsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  sheetReportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
    gap: 8,
  },
  sheetReportIcon: {
    fontSize: 14,
  },
  sheetReportName: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  sheetActionsGroup: {
    gap: 10,
    marginVertical: 10,
  },
  sheetActionBtnScan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.whatsapp.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  sheetActionBtnTextScan: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sheetActionBtnPay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#075E54',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  sheetActionBtnTextPay: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sheetCloseBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginTop: 4,
  },
  sheetCloseBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  inRoomPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inRoomPillText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  waitingPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  waitingPillText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  completedPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  completedPillText: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '700',
  },
});
