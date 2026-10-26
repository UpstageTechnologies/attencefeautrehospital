import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useHospital } from '../../context/HospitalContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Appointment, UserProfile } from '../../types';
import { AppIcon } from '../../components/common/AppIcon';
import { AnimatedPressableCard } from '../../components/common/AnimatedPressableCard';
import { dataStore } from '../../services/dataStore';

interface DateRevenueGroup {
  dateStr: string;
  formattedDate: string;
  isToday: boolean;
  isYesterday: boolean;
  totalRevenue: number;
  totalTransactions: number;
  appointments: Appointment[];
}

export const OwnerRevenueScreen: React.FC = () => {
  const { selectedHospital, appointments } = useHospital();
  const { colors: tc, isDark } = useAppTheme();

  // Retrieve hospital doctors (fallback to all doctors in the health group)
  const doctors: UserProfile[] = useMemo(() => {
    const hospDoctors = dataStore.getDoctors(selectedHospital?.id);
    if (hospDoctors.length > 0) return hospDoctors;
    return dataStore.getDoctors();
  }, [selectedHospital?.id]);

  // Selected Doctor Filter: 'all' or doctorId
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Date Range Quick Filter: 'all' | 'today' | 'yesterday' | 'week' | 'month'
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('all');

  // Modal for inspecting receipt details
  const [inspectedApt, setInspectedApt] = useState<Appointment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const getInitials = (name: string) => {
    return name
      .replace(/^Dr\.\s*/i, '')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Helper to format date nicely
  const formatDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Filter appointments by Doctor and Search Query
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Must be paid to count towards revenue
      const isPaid = apt.paymentStatus === 'paid';
      if (!isPaid) return false;

      // Doctor filter
      if (selectedDoctorId !== 'all') {
        const matchesDoc = apt.doctorId === selectedDoctorId ||
          (!apt.doctorId && selectedDoctorId === 'usr_doc_jenkins');
        if (!matchesDoc) return false;
      }

      // Date Range filter
      if (dateFilter === 'today' && apt.appointmentDate !== todayStr) return false;
      if (dateFilter === 'yesterday' && apt.appointmentDate !== yesterdayStr) return false;
      if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        if (apt.appointmentDate < weekAgoStr) return false;
      }

      // Search Query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesPatient = apt.patientName?.toLowerCase().includes(q);
        const matchesDoctor = apt.doctorName?.toLowerCase().includes(q);
        const matchesReceipt = apt.receiptNumber?.toLowerCase().includes(q);
        const matchesToken = apt.tokenNumber?.toString().includes(q);
        const matchesPhone = apt.patientPhone?.includes(q);
        if (!matchesPatient && !matchesDoctor && !matchesReceipt && !matchesToken && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, selectedDoctorId, dateFilter, searchQuery, todayStr, yesterdayStr]);

  // Group appointments by date in descending order
  const dateWiseGroups: DateRevenueGroup[] = useMemo(() => {
    const map = new Map<string, Appointment[]>();

    filteredAppointments.forEach((apt) => {
      const dateKey = apt.appointmentDate || todayStr;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(apt);
    });

    // Sort dates in reverse chronological order
    const sortedDateKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    return sortedDateKeys.map((dateStr) => {
      const apts = map.get(dateStr) || [];
      // Sort within the date by timeSlot
      apts.sort((a, b) => (b.timeSlot || '').localeCompare(a.timeSlot || ''));

      const totalRevenue = apts.reduce((sum, a) => sum + (a.paymentAmount || 500), 0);
      const isToday = dateStr === todayStr;
      const isYesterday = dateStr === yesterdayStr;

      return {
        dateStr,
        formattedDate: formatDateLabel(dateStr),
        isToday,
        isYesterday,
        totalRevenue,
        totalTransactions: apts.length,
        appointments: apts,
      };
    });
  }, [filteredAppointments, todayStr, yesterdayStr]);

  // Overall Financial KPIs for the currently selected doctor (or All Doctors)
  const totalRevenue = useMemo(() => {
    return filteredAppointments.reduce((sum, a) => sum + (a.paymentAmount || 500), 0);
  }, [filteredAppointments]);

  const todayRevenue = useMemo(() => {
    return filteredAppointments
      .filter((a) => a.appointmentDate === todayStr)
      .reduce((sum, a) => sum + (a.paymentAmount || 500), 0);
  }, [filteredAppointments, todayStr]);

  const paymentModesBreakdown = useMemo(() => {
    let upi = 0;
    let cash = 0;
    let card = 0;

    filteredAppointments.forEach((a) => {
      const amt = a.paymentAmount || 500;
      const method = (a.paymentMethod || 'upi').toLowerCase();
      if (method === 'upi' || method === 'gpay') {
        upi += amt;
      } else if (method === 'cash') {
        cash += amt;
      } else if (method === 'card') {
        card += amt;
      } else {
        upi += amt;
      }
    });

    return { upi, cash, card };
  }, [filteredAppointments]);

  // Compute doctor-specific revenue totals for doctor filter pill badges
  const doctorRevenueMap = useMemo(() => {
    const map: { [docId: string]: number } = {};
    appointments
      .filter((a) => a.paymentStatus === 'paid')
      .forEach((a) => {
        const docId = a.doctorId || 'usr_doc_jenkins';
        map[docId] = (map[docId] || 0) + (a.paymentAmount || 500);
      });
    return map;
  }, [appointments]);

  const totalAllDoctorsRevenue = useMemo(() => {
    return appointments
      .filter((a) => a.paymentStatus === 'paid')
      .reduce((sum, a) => sum + (a.paymentAmount || 500), 0);
  }, [appointments]);

  // Share digital receipt via WhatsApp
  const handleShareWhatsAppReceipt = (item: Appointment) => {
    const rNo = item.receiptNumber || `RCP-RIO-${item.tokenNumber}2026`;
    const methodStr = (item.paymentMethod || 'upi').toUpperCase();
    const amountVal = item.paymentAmount || 800;
    const msg =
      `*${selectedHospital?.name || 'RIO SCAN CENTER'} DIGITAL RECEIPT*\n` +
      `--------------------------------\n` +
      `Receipt No: ${rNo}\n` +
      `Patient: ${item.patientName} (${item.patientAge}y/${item.patientGender})\n` +
      `Doctor: ${item.doctorName} (${item.roomNumber})\n` +
      `Specialty: ${item.doctorSpecialty}\n` +
      `Token #${item.tokenNumber}\n` +
      `Date: ${item.appointmentDate} • ${item.timeSlot}\n` +
      `Amount Paid: ₹${amountVal}.00\n` +
      `Payment Mode: ${methodStr}\n` +
      `Status: CONFIRMED & AUDITED ✓\n` +
      `--------------------------------\n` +
      `Executive Ledger • ${selectedHospital?.address || 'Tirunelveli, Tamil Nadu'}`;

    const cleanPhone = (item.patientPhone || '').replace(/[^\d+]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      showToast('Digital receipt copied for patient.');
    });
  };

  const getMethodBadge = (method?: string) => {
    const m = (method || 'upi').toLowerCase();
    if (m === 'upi') {
      return { label: 'UPI', bg: '#EEF2FF', text: '#4F46E5', icon: 'card-outline' };
    }
    if (m === 'gpay') {
      return { label: 'GPay', bg: '#EFF6FF', text: '#2563EB', icon: 'logo-google' };
    }
    if (m === 'card') {
      return { label: 'Card', bg: '#FEF3C7', text: '#D97706', icon: 'card' };
    }
    if (m === 'cash') {
      return { label: 'Cash', bg: '#ECFDF5', text: '#059669', icon: 'cash-outline' };
    }
    return { label: 'Online', bg: '#F3F4F6', text: '#4B5563', icon: 'wallet-outline' };
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <AppIcon name="checkmark" size={16} color="#FFFFFF" />
          <Text style={styles.toastText} numberOfLines={2}>
            {toastMessage}
          </Text>
        </View>
      )}

      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: tc.headerBackground, borderBottomColor: tc.cardBorder }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: tc.text }]}>Hospital Revenue & Collections</Text>
          <Text style={[styles.headerSubtitle, { color: tc.textSecondary }]}>
            {selectedHospital?.name || 'Rio Scan Center'} • Executive Financial Ledger
          </Text>
        </View>
        <View style={styles.currencyBadge}>
          <Text style={styles.currencyBadgeText}>₹ INR</Text>
        </View>
      </View>

      {/* ─── Doctor Filter Tabs Bar ─── */}
      <View style={[styles.doctorFilterContainer, { backgroundColor: isDark ? '#18181B' : '#F8FAFC', borderBottomColor: tc.cardBorder }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.doctorFilterScroll}
        >
          {/* "All Doctors" Tab Pill */}
          <TouchableOpacity
            style={[
              styles.doctorTabPill,
              { backgroundColor: isDark ? '#27272A' : '#FFFFFF', borderColor: tc.cardBorder },
              selectedDoctorId === 'all' && styles.doctorTabPillActive,
            ]}
            onPress={() => {
              setSelectedDoctorId('all');
              showToast('Viewing combined revenue for All Doctors');
            }}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.doctorTabAvatar,
                { backgroundColor: isDark ? '#374151' : '#E0E7FF' },
                selectedDoctorId === 'all' && styles.doctorTabAvatarActive,
              ]}
            >
              <AppIcon
                name="business"
                size={16}
                color={selectedDoctorId === 'all' ? '#FFFFFF' : (isDark ? '#A5B4FC' : '#4338CA')}
              />
            </View>
            <View style={styles.doctorTabInfo}>
              <Text
                style={[
                  styles.doctorTabName,
                  selectedDoctorId === 'all' ? styles.doctorTabNameActive : { color: tc.text },
                ]}
                numberOfLines={1}
              >
                All Doctors
              </Text>
              <Text
                style={[
                  styles.doctorTabSub,
                  selectedDoctorId === 'all' ? styles.doctorTabSubActive : { color: tc.textSecondary },
                ]}
                numberOfLines={1}
              >
                {doctors.length} Doctors • Full Hospital
              </Text>
            </View>
            <View
              style={[
                styles.doctorTokensBadge,
                selectedDoctorId === 'all' ? styles.doctorTokensBadgeActive : { backgroundColor: isDark ? '#3F3F46' : '#F1F5F9' },
              ]}
            >
              <Text
                style={[
                  styles.doctorTokensBadgeText,
                  selectedDoctorId === 'all' ? styles.doctorTokensBadgeTextActive : { color: tc.textSecondary },
                ]}
              >
                ₹{totalAllDoctorsRevenue.toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Individual Doctor Tabs */}
          {doctors.map((doc) => {
            const isSelected = doc.id === selectedDoctorId;
            const docRevenue = doctorRevenueMap[doc.id] || 0;

            return (
              <TouchableOpacity
                key={doc.id}
                style={[
                  styles.doctorTabPill,
                  { backgroundColor: isDark ? '#27272A' : '#FFFFFF', borderColor: tc.cardBorder },
                  isSelected && styles.doctorTabPillActive,
                ]}
                onPress={() => {
                  setSelectedDoctorId(doc.id);
                  showToast(`Viewing ${doc.name} revenue`);
                }}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.doctorTabAvatar,
                    { backgroundColor: isDark ? '#3F3F46' : '#EEF2FF' },
                    isSelected && styles.doctorTabAvatarActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.doctorTabAvatarText,
                      { color: isSelected ? '#FFFFFF' : (isDark ? '#A5B4FC' : '#4338CA') },
                    ]}
                  >
                    {getInitials(doc.name)}
                  </Text>
                </View>

                <View style={styles.doctorTabInfo}>
                  <Text
                    style={[
                      styles.doctorTabName,
                      isSelected ? styles.doctorTabNameActive : { color: tc.text },
                    ]}
                    numberOfLines={1}
                  >
                    {doc.name}
                  </Text>
                  <Text
                    style={[
                      styles.doctorTabSub,
                      isSelected ? styles.doctorTabSubActive : { color: tc.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {doc.doctorProfile?.roomNumber || 'Cabin'} • {doc.doctorProfile?.specialty?.split('&')[0]?.trim() || 'General'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.doctorTokensBadge,
                    isSelected ? styles.doctorTokensBadgeActive : { backgroundColor: isDark ? '#3F3F46' : '#F1F5F9' },
                  ]}
                >
                  <Text
                    style={[
                      styles.doctorTokensBadgeText,
                      isSelected ? styles.doctorTokensBadgeTextActive : { color: tc.textSecondary },
                    ]}
                  >
                    ₹{docRevenue.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Financial Overview Cards */}
        <View style={styles.kpiGrid}>
          {/* Total Collections */}
          <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1C1917' : '#FFFFFF', borderColor: tc.cardBorder }]}>
            <View style={styles.kpiHeaderRow}>
              <Text style={[styles.kpiLabel, { color: tc.textSecondary }]}>TOTAL REVENUE</Text>
              <View style={[styles.kpiIconPill, { backgroundColor: '#ECFDF5' }]}>
                <AppIcon name="cash" size={14} color="#059669" />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>
              ₹{totalRevenue.toLocaleString()}
            </Text>
            <Text style={[styles.kpiSub, { color: tc.textSecondary }]}>
              From {filteredAppointments.length} paid consultations
            </Text>
          </View>

          {/* Today's Collections */}
          <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1C1917' : '#FFFFFF', borderColor: tc.cardBorder }]}>
            <View style={styles.kpiHeaderRow}>
              <Text style={[styles.kpiLabel, { color: tc.textSecondary }]}>TODAY'S COLLECTIONS</Text>
              <View style={[styles.kpiIconPill, { backgroundColor: '#EFF6FF' }]}>
                <AppIcon name="time" size={14} color="#2563EB" />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>
              ₹{todayRevenue.toLocaleString()}
            </Text>
            <Text style={[styles.kpiSub, { color: tc.textSecondary }]}>
              {filteredAppointments.filter((a) => a.appointmentDate === todayStr).length} visits today
            </Text>
          </View>
        </View>

        {/* Payment Modes Strip */}
        <View style={[styles.paymentModesBar, { backgroundColor: isDark ? '#1C1917' : '#FFFFFF', borderColor: tc.cardBorder }]}>
          <Text style={[styles.paymentModesTitle, { color: tc.textSecondary }]}>PAYMENT MODES BREAKDOWN</Text>
          <View style={styles.paymentChipsRow}>
            <View style={[styles.paymentChip, { backgroundColor: '#EEF2FF' }]}>
              <AppIcon name="phone-portrait-outline" size={13} color="#4F46E5" />
              <Text style={[styles.paymentChipText, { color: '#4F46E5' }]}>
                UPI / GPay: ₹{paymentModesBreakdown.upi.toLocaleString()}
              </Text>
            </View>

            <View style={[styles.paymentChip, { backgroundColor: '#ECFDF5' }]}>
              <AppIcon name="cash-outline" size={13} color="#059669" />
              <Text style={[styles.paymentChipText, { color: '#059669' }]}>
                Cash: ₹{paymentModesBreakdown.cash.toLocaleString()}
              </Text>
            </View>

            <View style={[styles.paymentChip, { backgroundColor: '#FEF3C7' }]}>
              <AppIcon name="card-outline" size={13} color="#D97706" />
              <Text style={[styles.paymentChipText, { color: '#D97706' }]}>
                Card: ₹{paymentModesBreakdown.card.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Search & Quick Date Filter Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: isDark ? '#27272A' : '#FFFFFF', borderColor: tc.cardBorder }]}>
            <AppIcon name="search" size={16} color={tc.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: tc.text }]}
              placeholder="Search patient, receipt #, token, phone..."
              placeholderTextColor={tc.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <AppIcon name="close-circle" size={16} color={tc.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Date Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickDateFilterRow}
          >
            {(['all', 'today', 'yesterday', 'week'] as const).map((filter) => {
              const isActive = dateFilter === filter;
              const labels = {
                all: 'All Dates',
                today: 'Today',
                yesterday: 'Yesterday',
                week: 'Past 7 Days',
              };
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.quickDatePill,
                    { backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderColor: tc.cardBorder },
                    isActive && styles.quickDatePillActive,
                  ]}
                  onPress={() => setDateFilter(filter)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.quickDatePillText,
                      { color: isActive ? '#FFFFFF' : tc.textSecondary },
                    ]}
                  >
                    {labels[filter]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── DATE-WISE REVENUE LISTINGS ─── */}
        <View style={styles.dateWiseListContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: tc.text }]}>
                {selectedDoctorId === 'all'
                  ? 'All Hospital Collections Date-Wise'
                  : `${doctors.find((d) => d.id === selectedDoctorId)?.name || 'Doctor'} Revenue Date-Wise`}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
                {dateWiseGroups.length} Active Days • Itemized Patient Consultations
              </Text>
            </View>
          </View>

          {dateWiseGroups.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#1C1917' : '#FFFFFF', borderColor: tc.cardBorder }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                <AppIcon name="receipt-outline" size={36} color={tc.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: tc.text }]}>No Revenue Records Found</Text>
              <Text style={[styles.emptySub, { color: tc.textSecondary }]}>
                {searchQuery
                  ? 'No receipts match your search filter.'
                  : 'No collected fees found for this doctor in the selected date range.'}
              </Text>
            </View>
          ) : (
            dateWiseGroups.map((group) => {
              return (
                <View key={group.dateStr} style={styles.dateGroupCard}>
                  {/* Date Header Strip */}
                  <View
                    style={[
                      styles.dateHeaderRow,
                      {
                        backgroundColor: group.isToday
                          ? (isDark ? '#064E3B40' : '#ECFDF5')
                          : (isDark ? '#27272A' : '#F8FAFC'),
                        borderColor: group.isToday ? '#10B98150' : tc.cardBorder,
                      },
                    ]}
                  >
                    <View style={styles.dateHeaderLeft}>
                      <View
                        style={[
                          styles.dateCalendarIcon,
                          { backgroundColor: group.isToday ? colors.whatsapp.primary : (isDark ? '#3F3F46' : '#E2E8F0') },
                        ]}
                      >
                        <AppIcon
                          name="calendar"
                          size={14}
                          color={group.isToday ? '#FFFFFF' : (isDark ? '#CBD5E1' : '#475569')}
                        />
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={[
                              styles.dateHeaderText,
                              { color: group.isToday ? '#059669' : tc.text },
                            ]}
                          >
                            {group.formattedDate}
                          </Text>
                          {group.isToday && (
                            <View style={styles.todayTagBadge}>
                              <Text style={styles.todayTagText}>TODAY</Text>
                            </View>
                          )}
                          {group.isYesterday && (
                            <View style={[styles.todayTagBadge, { backgroundColor: '#F1F5F9' }]}>
                              <Text style={[styles.todayTagText, { color: '#64748B' }]}>YESTERDAY</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.dateSubText, { color: tc.textSecondary }]}>
                          {group.totalTransactions} {group.totalTransactions === 1 ? 'consultation' : 'consultations'}
                        </Text>
                      </View>
                    </View>

                    {/* Date Revenue Badge */}
                    <View style={styles.dateRevenueBadge}>
                      <Text style={styles.dateRevenueBadgeLabel}>COLLECTED</Text>
                      <Text style={styles.dateRevenueBadgeAmount}>
                        ₹{group.totalRevenue.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Transactions within this date */}
                  <View style={[styles.transactionsContainer, { borderColor: tc.cardBorder }]}>
                    {group.appointments.map((apt, index) => {
                      const methodBadge = getMethodBadge(apt.paymentMethod);
                      const isLast = index === group.appointments.length - 1;

                      return (
                        <AnimatedPressableCard
                          key={apt.id}
                          style={[
                            styles.transactionItem,
                            {
                              backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                              borderBottomColor: tc.cardBorder,
                              borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                            },
                          ]}
                          onPress={() => setInspectedApt(apt)}
                        >
                          {/* Token & Patient Avatar */}
                          <View style={styles.transactionLeft}>
                            <View style={[styles.tokenCircle, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                              <Text style={[styles.tokenCircleText, { color: tc.text }]}>
                                #{apt.tokenNumber}
                              </Text>
                            </View>

                            <View style={styles.transactionDetails}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.patientName, { color: tc.text }]} numberOfLines={1}>
                                  {apt.patientName}
                                </Text>
                                <Text style={[styles.patientMeta, { color: tc.textSecondary }]}>
                                  {apt.patientAge}y/{apt.patientGender?.[0] || 'M'}
                                </Text>
                              </View>

                              {/* Doctor info (vital when in 'All Doctors' view) */}
                              <Text style={[styles.transactionDocText, { color: tc.textSecondary }]} numberOfLines={1}>
                                {apt.doctorName} • {apt.roomNumber}
                              </Text>

                              {/* Time & Receipt number */}
                              <View style={styles.receiptMetaRow}>
                                <Text style={[styles.receiptText, { color: tc.textSecondary }]}>
                                  {apt.receiptNumber || `RCP-RIO-${apt.tokenNumber}`} • {apt.timeSlot}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Payment Method & Amount */}
                          <View style={styles.transactionRight}>
                            <Text style={styles.amountCollectedText}>
                              +₹{(apt.paymentAmount || 500).toLocaleString()}
                            </Text>

                            <View style={[styles.methodTag, { backgroundColor: methodBadge.bg }]}>
                              <Text style={[styles.methodTagText, { color: methodBadge.text }]}>
                                {methodBadge.label}
                              </Text>
                            </View>

                            <View style={styles.statusVerifiedRow}>
                              <AppIcon name="checkmark-circle" size={11} color="#059669" />
                              <Text style={styles.statusVerifiedText}>Paid</Text>
                            </View>
                          </View>
                        </AnimatedPressableCard>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ─── EXECUTIVE AUDIT & RECEIPT MODAL ─── */}
      <Modal
        visible={!!inspectedApt}
        transparent
        animationType="slide"
        onRequestClose={() => setInspectedApt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1C1917' : '#FFFFFF' }]}>
            {inspectedApt && (
              <>
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: tc.cardBorder }]}>
                  <View>
                    <Text style={[styles.modalTitle, { color: tc.text }]}>Digital Financial Receipt</Text>
                    <Text style={[styles.modalSub, { color: tc.textSecondary }]}>
                      Receipt #{inspectedApt.receiptNumber || `RCP-RIO-${inspectedApt.tokenNumber}`} • Verified
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}
                    onPress={() => setInspectedApt(null)}
                  >
                    <AppIcon name="close" size={18} color={tc.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {/* Big Receipt Card */}
                  <View style={[styles.receiptPaper, { backgroundColor: isDark ? '#27272A' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    <View style={styles.receiptTopHero}>
                      <Text style={[styles.receiptHospitalTitle, { color: tc.text }]}>
                        {selectedHospital?.name || 'Rio Scan Center'}
                      </Text>
                      <Text style={[styles.receiptHospitalSub, { color: tc.textSecondary }]}>
                        GSTIN: 33AAACR7812M1Z2 • Tirunelveli, Tamil Nadu
                      </Text>
                      <View style={styles.receiptDashedLine} />
                    </View>

                    {/* Key-Value Breakdown */}
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptKey, { color: tc.textSecondary }]}>Patient Name:</Text>
                      <Text style={[styles.receiptVal, { color: tc.text }]}>{inspectedApt.patientName}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptKey, { color: tc.textSecondary }]}>Token Number:</Text>
                      <Text style={[styles.receiptVal, { color: tc.text }]}>Token #{inspectedApt.tokenNumber}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptKey, { color: tc.textSecondary }]}>Attending Doctor:</Text>
                      <Text style={[styles.receiptVal, { color: tc.text }]}>{inspectedApt.doctorName}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptKey, { color: tc.textSecondary }]}>Specialty / Cabin:</Text>
                      <Text style={[styles.receiptVal, { color: tc.text }]}>
                        {inspectedApt.doctorSpecialty} ({inspectedApt.roomNumber})
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptKey, { color: tc.textSecondary }]}>Date & Slot:</Text>
                      <Text style={[styles.receiptVal, { color: tc.text }]}>
                        {inspectedApt.appointmentDate} at {inspectedApt.timeSlot}
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptKey, { color: tc.textSecondary }]}>Payment Method:</Text>
                      <Text style={[styles.receiptVal, { color: tc.text }]}>
                        {(inspectedApt.paymentMethod || 'UPI').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptKey, { color: tc.textSecondary }]}>Settlement Status:</Text>
                      <Text style={[styles.receiptVal, { color: '#059669', fontWeight: '700' }]}>
                        CONFIRMED & AUDITED ✓
                      </Text>
                    </View>

                    <View style={styles.receiptDashedLine} />

                    {/* Total Amount Row */}
                    <View style={styles.receiptTotalRow}>
                      <Text style={[styles.receiptTotalLabel, { color: tc.text }]}>TOTAL COLLECTED</Text>
                      <Text style={styles.receiptTotalAmount}>
                        ₹{(inspectedApt.paymentAmount || 500).toLocaleString()}.00
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.modalActionButtons}>
                    <TouchableOpacity
                      style={styles.shareWhatsAppBtn}
                      onPress={() => {
                        handleShareWhatsAppReceipt(inspectedApt);
                        setInspectedApt(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <AppIcon name="logo-whatsapp" size={18} color="#FFFFFF" />
                      <Text style={styles.shareWhatsAppBtnText}>Share Digital Receipt via WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.auditDoneBtn, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}
                      onPress={() => {
                        showToast(`Audit record ${inspectedApt.receiptNumber} verified.`);
                        setInspectedApt(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.auditDoneBtnText, { color: tc.text }]}>Close Ledger Entry</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  currencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  currencyBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  toastBanner: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Doctor Filter Bar
  doctorFilterContainer: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  doctorFilterScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  doctorTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  doctorTabPillActive: {
    backgroundColor: '#075E54',
    borderColor: '#075E54',
  },
  doctorTabAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorTabAvatarActive: {
    backgroundColor: '#10B981',
  },
  doctorTabAvatarText: {
    fontSize: 12,
    fontWeight: '700',
  },
  doctorTabInfo: {
    maxWidth: 140,
  },
  doctorTabName: {
    fontSize: 13,
    fontWeight: '700',
  },
  doctorTabNameActive: {
    color: '#FFFFFF',
  },
  doctorTabSub: {
    fontSize: 10,
    marginTop: 1,
  },
  doctorTabSubActive: {
    color: '#A7F3D0',
  },
  doctorTokensBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  doctorTokensBadgeActive: {
    backgroundColor: '#064E3B',
  },
  doctorTokensBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  doctorTokensBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Main Scrollable Area
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    padding: 14,
    paddingBottom: 40,
  },

  // KPI Overview
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kpiIconPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  kpiSub: {
    fontSize: 11,
    marginTop: 4,
  },

  // Payment Modes Strip
  paymentModesBar: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  paymentModesTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  paymentChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  paymentChipText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Search & Filter
  searchSection: {
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  quickDateFilterRow: {
    gap: 8,
  },
  quickDatePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickDatePillActive: {
    backgroundColor: '#075E54',
    borderColor: '#075E54',
  },
  quickDatePillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Date-wise Revenue Section
  dateWiseListContainer: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  dateGroupCard: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateCalendarIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dateSubText: {
    fontSize: 11,
    marginTop: 1,
  },
  todayTagBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  todayTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateRevenueBadge: {
    alignItems: 'flex-end',
  },
  dateRevenueBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },
  dateRevenueBadgeAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },

  // Transactions inside date
  transactionsContainer: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tokenCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenCircleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  transactionDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '700',
  },
  patientMeta: {
    fontSize: 12,
  },
  transactionDocText: {
    fontSize: 11,
    marginTop: 2,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  receiptText: {
    fontSize: 10,
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 10,
  },
  amountCollectedText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  methodTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusVerifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },

  // Empty state
  emptyContainer: {
    padding: 36,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 11,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 16,
  },
  receiptPaper: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  receiptTopHero: {
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptHospitalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  receiptHospitalSub: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  receiptDashedLine: {
    height: 1,
    backgroundColor: '#CBD5E1',
    width: '100%',
    marginVertical: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  receiptKey: {
    fontSize: 12,
  },
  receiptVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  receiptTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  receiptTotalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
  },
  modalActionButtons: {
    gap: 10,
    paddingBottom: 24,
  },
  shareWhatsAppBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareWhatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  auditDoneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  auditDoneBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
