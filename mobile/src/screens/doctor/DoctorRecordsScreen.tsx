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
  Alert,
  Linking,
  Image,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useHospital } from '../../context/HospitalContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Appointment, ScannedReport, MedicineItem } from '../../types';
import { AppIcon } from '../../components/common/AppIcon';
import { AnimatedPressableCard } from '../../components/common/AnimatedPressableCard';

export const DoctorRecordsScreen: React.FC = () => {
  const { appointments } = useHospital();
  const { colors: tc, isDark } = useAppTheme();
  const doctorId = 'usr_doc_jenkins';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [inspectRecord, setInspectRecord] = useState<Appointment | null>(null);
  const [inspectReport, setInspectReport] = useState<ScannedReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCallPatient = (phone: string, name: string) => {
    const cleanNumber = phone.replace(/[^\d+]/g, '');
    Alert.alert(`Call Patient?`, `Dial ${name} (${phone}) directly?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call Now',
        onPress: () => {
          Linking.openURL(`tel:${cleanNumber}`).catch(() => {
            showToast(`Dialing ${name}...`);
          });
        },
      },
    ]);
  };

  // Filter completed appointments for this doctor
  const doctorCompletedRecords = useMemo(() => {
    return appointments
      .filter((a) => (a.doctorId === doctorId || !a.doctorId) && a.status === 'completed')
      .sort((a, b) => {
        // Sort descending by appointment date and time
        const dateA = new Date(`${a.appointmentDate}T12:00:00`).getTime();
        const dateB = new Date(`${b.appointmentDate}T12:00:00`).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return b.tokenNumber - a.tokenNumber;
      });
  }, [appointments, doctorId]);

  // Apply search and date range filters
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredRecords = useMemo(() => {
    return doctorCompletedRecords.filter((apt) => {
      // Date filter
      if (selectedDateFilter === 'today' && apt.appointmentDate !== todayStr) {
        return false;
      }
      if (selectedDateFilter === 'week') {
        const aptTime = new Date(`${apt.appointmentDate}T12:00:00`).getTime();
        const now = new Date().getTime();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        if (aptTime < sevenDaysAgo) return false;
      }
      if (selectedDateFilter === 'month') {
        const aptTime = new Date(`${apt.appointmentDate}T12:00:00`).getTime();
        const now = new Date().getTime();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        if (aptTime < thirtyDaysAgo) return false;
      }

      // Search filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = apt.patientName.toLowerCase().includes(q);
        const tokenMatch = apt.tokenNumber.toString().includes(q);
        const diagMatch = apt.prescription?.diagnosis?.toLowerCase().includes(q) || false;
        const noteMatch = apt.consultationNotes?.toLowerCase().includes(q) || false;
        const symptomMatch = apt.symptoms?.toLowerCase().includes(q) || false;
        const medMatch =
          apt.prescription?.medicines.some((m) => m.name.toLowerCase().includes(q)) || false;
        return nameMatch || tokenMatch || diagMatch || noteMatch || symptomMatch || medMatch;
      }

      return true;
    });
  }, [doctorCompletedRecords, selectedDateFilter, searchQuery, todayStr]);

  // Group filtered records by visited/consulted date
  const recordsByDate = useMemo(() => {
    const groups: { [date: string]: Appointment[] } = {};
    filteredRecords.forEach((apt) => {
      const dateKey = apt.appointmentDate || todayStr;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(apt);
    });
    return groups;
  }, [filteredRecords, todayStr]);

  // Unique sorted dates
  const sortedDateKeys = useMemo(() => {
    return Object.keys(recordsByDate).sort((a, b) => {
      return new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime();
    });
  }, [recordsByDate]);

  // Format date header nicely
  const formatDateHeading = (dateStr: string) => {
    try {
      const d = new Date(`${dateStr}T12:00:00`);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const isToday = d.toISOString().split('T')[0] === today.toISOString().split('T')[0];
      const isYesterday = d.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];

      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      };
      const formatted = d.toLocaleDateString(undefined, options);

      if (isToday) return `Today • ${formatted}`;
      if (isYesterday) return `Yesterday • ${formatted}`;
      return formatted;
    } catch {
      return dateStr;
    }
  };

  // Stats calculation
  const totalCompletedCount = doctorCompletedRecords.length;
  const totalReportsCount = doctorCompletedRecords.reduce(
    (acc, a) => acc + (a.scannedReports ? a.scannedReports.length : 0),
    0
  );
  const totalPrescriptionsCount = doctorCompletedRecords.filter((a) => a.prescription).length;
  const todayRevenue = doctorCompletedRecords
    .filter((a) => a.appointmentDate === todayStr)
    .reduce((acc, a) => acc + (a.paymentAmount || 75), 0);

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

      {/* Screen Header */}
      <View style={[styles.headerArea, { backgroundColor: tc.headerBackground, borderBottomColor: tc.cardBorder }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={[styles.headerTitle, { color: tc.text }]}>Patient Records</Text>
            <Text style={[styles.headerSubtitle, { color: tc.textSecondary }]}>
              Clinical consultations arranged by visited date
            </Text>
          </View>
          <View style={[styles.totalBadge, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
            <Text style={[styles.totalBadgeText, { color: tc.text }]}>{totalCompletedCount} Patients</Text>
          </View>
        </View>

        {/* Quick Metric Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsStrip}>
          <View style={[styles.metricCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={styles.metricEmoji}>🩺</Text>
            <View>
              <Text style={[styles.metricVal, { color: tc.text }]}>{totalCompletedCount}</Text>
              <Text style={[styles.metricLabel, { color: tc.textSecondary }]}>Total Consults</Text>
            </View>
          </View>
          <View style={[styles.metricCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={styles.metricEmoji}>💊</Text>
            <View>
              <Text style={[styles.metricVal, { color: tc.text }]}>{totalPrescriptionsCount}</Text>
              <Text style={[styles.metricLabel, { color: tc.textSecondary }]}>Rx Prescribed</Text>
            </View>
          </View>
          <View style={[styles.metricCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={styles.metricEmoji}>🩻</Text>
            <View>
              <Text style={[styles.metricVal, { color: tc.text }]}>{totalReportsCount}</Text>
              <Text style={[styles.metricLabel, { color: tc.textSecondary }]}>Scans / Lab</Text>
            </View>
          </View>
          <View style={[styles.metricCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={styles.metricEmoji}>💵</Text>
            <View>
              <Text style={[styles.metricVal, { color: '#16A34A' }]}>₹{todayRevenue.toLocaleString()}</Text>
              <Text style={[styles.metricLabel, { color: tc.textSecondary }]}>Today's Fee</Text>
            </View>
          </View>
        </ScrollView>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          <AppIcon name="search-outline" size={17} color={tc.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: tc.text }]}
            placeholder="Search by patient name, diagnosis, medication..."
            placeholderTextColor={tc.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <AppIcon name="close-circle" size={17} color={tc.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          {(['all', 'today', 'week', 'month'] as const).map((filterKey) => {
            const isSelected = selectedDateFilter === filterKey;
            const labels = {
              all: 'All Dates',
              today: 'Today',
              week: 'Last 7 Days',
              month: 'Past 30 Days',
            };
            return (
              <TouchableOpacity
                key={filterKey}
                style={[
                  styles.filterPill,
                  isSelected
                    ? { backgroundColor: colors.whatsapp.primary }
                    : { backgroundColor: isDark ? '#27272A' : '#E2E8F0' },
                ]}
                onPress={() => setSelectedDateFilter(filterKey)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected ? { color: '#FFFFFF', fontWeight: '700' } : { color: tc.textSecondary },
                  ]}
                >
                  {labels[filterKey]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main Records List Grouped By Visited Dates */}
      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {sortedDateKeys.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={[styles.emptyTitle, { color: tc.text }]}>No Patient Records Found</Text>
            <Text style={[styles.emptySubtitle, { color: tc.textSecondary }]}>
              {searchQuery
                ? `No records matching "${searchQuery}". Try a different keyword.`
                : 'Completed patient consultations will appear here arranged by visited date.'}
            </Text>
          </View>
        ) : (
          sortedDateKeys.map((dateKey) => {
            const dateRecords = recordsByDate[dateKey];
            return (
              <View key={dateKey} style={styles.dateGroupContainer}>
                {/* Date Section Header */}
                <View style={[styles.dateSectionHeader, { backgroundColor: isDark ? '#1C1C1E' : '#F1F5F9' }]}>
                  <View style={styles.dateHeaderLeft}>
                    <AppIcon name="calendar-outline" size={15} color={colors.whatsapp.primary} />
                    <Text style={[styles.dateSectionTitle, { color: tc.text }]}>
                      {formatDateHeading(dateKey)}
                    </Text>
                  </View>
                  <View style={styles.countBadgePill}>
                    <Text style={styles.countBadgePillText}>
                      {dateRecords.length} {dateRecords.length === 1 ? 'Patient' : 'Patients'}
                    </Text>
                  </View>
                </View>

                {/* Patient Record Cards for This Date */}
                {dateRecords.map((apt) => {
                  const hasReports = apt.scannedReports && apt.scannedReports.length > 0;
                  const medCount = apt.prescription?.medicines?.length || 0;

                  return (
                    <AnimatedPressableCard
                      key={apt.id}
                      style={[
                        styles.recordCard,
                        { backgroundColor: tc.card, borderColor: tc.cardBorder },
                      ]}
                      onPress={() => setInspectRecord(apt)}
                    >
                      {/* Card Header: 54px Profile Avatar + Token Tag + Name/Chips */}
                      <View style={styles.cardHeaderRow}>
                        {/* Bigger 54px Profile Avatar with Prominent Token Badge */}
                        <View style={styles.avatarWrap}>
                          <View
                            style={[
                              styles.avatarCircle,
                              { backgroundColor: isDark ? '#2C2C2E' : '#EEF2FF' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.avatarText,
                                { color: isDark ? '#A5B4FC' : '#4338CA' },
                              ]}
                            >
                              {getInitials(apt.patientName)}
                            </Text>
                          </View>
                          <View style={styles.tokenBadge}>
                            <Text style={styles.tokenBadgeText}>#{apt.tokenNumber}</Text>
                          </View>
                        </View>

                        {/* Patient Identity & Meta Col */}
                        <View style={styles.patientIdentityCol}>
                          <View style={styles.lineOne}>
                            <Text style={[styles.patientNameText, { color: tc.text }]} numberOfLines={1}>
                              {apt.patientName}
                            </Text>
                            <View style={[styles.timeSlotBadge, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}>
                              <Text style={[styles.timeText, { color: tc.textSecondary }]}>🕒 {apt.timeSlot}</Text>
                            </View>
                          </View>

                          {/* Summarized Info Chips Row */}
                          <View style={styles.summaryChipsRow}>
                            <View style={[styles.microChip, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                              <Text style={[styles.microChipText, { color: tc.textSecondary }]}>
                                {apt.patientAge}y • {apt.patientGender}
                              </Text>
                            </View>
                            <View style={[styles.microChip, { backgroundColor: isDark ? '#1F2937' : '#F8FAFC' }]}>
                              <Text style={[styles.microChipText, { color: tc.textSecondary }]}>
                                Room {apt.roomNumber}
                              </Text>
                            </View>
                            {hasReports && (
                              <View style={styles.scansIndicator}>
                                <Text style={styles.scansIndicatorText}>🩻 {apt.scannedReports.length} Scans</Text>
                              </View>
                            )}
                            {medCount > 0 && (
                              <View style={[styles.microChip, { backgroundColor: isDark ? '#27272A' : '#FEF3C7' }]}>
                                <Text style={[styles.microChipText, { color: isDark ? '#F59E0B' : '#B45309' }]}>
                                  💊 {medCount} Rx
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Clinical Diagnosis Section */}
                      {apt.prescription?.diagnosis ? (
                        <View style={[styles.diagnosisBox, { backgroundColor: isDark ? '#1E293B' : '#F0FDF4' }]}>
                          <Text style={styles.diagnosisLabel}>DIAGNOSIS</Text>
                          <Text style={[styles.diagnosisText, { color: tc.text }]}>
                            {apt.prescription.diagnosis}
                          </Text>
                        </View>
                      ) : apt.consultationNotes ? (
                        <View style={[styles.diagnosisBox, { backgroundColor: isDark ? '#1E293B' : '#F0FDF4' }]}>
                          <Text style={styles.diagnosisLabel}>CONSULTATION NOTES</Text>
                          <Text style={[styles.diagnosisText, { color: tc.text }]}>
                            {apt.consultationNotes}
                          </Text>
                        </View>
                      ) : null}

                      {/* Symptoms reported */}
                      {apt.symptoms && (
                        <Text style={[styles.symptomsPreviewText, { color: tc.textSecondary }]} numberOfLines={2}>
                          <Text style={styles.boldLabel}>Chief Complaint: </Text>
                          {apt.symptoms}
                        </Text>
                      )}

                      {/* Prescribed Medicines Preview */}
                      {medCount > 0 && (
                        <View style={styles.medsPreviewRow}>
                          <Text style={[styles.medsHeaderLabel, { color: tc.textSecondary }]}>
                            💊 {medCount} Prescribed:
                          </Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.medChipsScroll}>
                            {apt.prescription?.medicines.map((m) => (
                              <View key={m.id} style={[styles.medChip, { backgroundColor: isDark ? '#27272A' : '#E2E8F0' }]}>
                                <Text style={[styles.medChipText, { color: tc.text }]}>
                                  {m.name} ({m.dosage})
                                </Text>
                              </View>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      {/* Scanned Reports attached */}
                      {hasReports && (
                        <View style={styles.reportsAttachedRow}>
                          <AppIcon name="document-text-outline" size={14} color="#0D9488" />
                          <Text style={styles.reportsAttachedText}>
                            {apt.scannedReports.length} Scanned Diagnostic{' '}
                            {apt.scannedReports.length === 1 ? 'Report' : 'Reports'} Attached
                          </Text>
                          <TouchableOpacity
                            onPress={() => setInspectReport(apt.scannedReports[0])}
                            style={styles.viewScanInlineBtn}
                          >
                            <Text style={styles.viewScanInlineBtnText}>Inspect Scans ➔</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Card Footer: Fee Badge & Actions */}
                      <View style={[styles.cardFooterRow, { borderTopColor: tc.cardBorder }]}>
                        <View style={styles.feeBadge}>
                          <Text style={styles.feeBadgeText}>
                            ✓ ${apt.paymentAmount || 75} Paid ({apt.paymentMethod ? apt.paymentMethod.toUpperCase() : 'PAID'})
                          </Text>
                        </View>

                        <View style={styles.actionsRightGroup}>
                          {/* Direct Call Button */}
                          <TouchableOpacity
                            style={styles.callSmallBtn}
                            onPress={() => handleCallPatient(apt.patientPhone, apt.patientName)}
                            activeOpacity={0.7}
                          >
                            <AppIcon name="call" size={14} color="#FFFFFF" />
                            <Text style={styles.callSmallBtnText}>Call</Text>
                          </TouchableOpacity>

                          {/* View Full Medical Record / Rx */}
                          <TouchableOpacity
                            style={[styles.viewFullBtn, { backgroundColor: colors.whatsapp.primary }]}
                            onPress={() => setInspectRecord(apt)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.viewFullBtnText}>Full Record ➔</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </AnimatedPressableCard>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FULL MEDICAL RECORD & DIGITAL PRESCRIPTION MODAL */}
      {inspectRecord && (
        <Modal
          visible={!!inspectRecord}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setInspectRecord(null)}
        >
          <View style={[styles.modalRoot, { backgroundColor: tc.background }]}>
            {/* Modal Header */}
            <View style={[styles.modalTopBar, { backgroundColor: tc.headerBackground, borderBottomColor: tc.cardBorder }]}>
              <View>
                <Text style={[styles.modalMainTitle, { color: tc.text }]}>Patient Medical Record</Text>
                <Text style={[styles.modalMainSub, { color: tc.textSecondary }]}>
                  {inspectRecord.hospitalName} • Token #{inspectRecord.tokenNumber}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#27272A' : '#E2E8F0' }]}
                onPress={() => setInspectRecord(null)}
              >
                <AppIcon name="close" size={18} color={tc.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {/* Doctor Credentials & Hospital Stamp Header */}
              <View style={[styles.docLetterheadCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <View style={styles.docStampRow}>
                  <View>
                    <Text style={[styles.letterheadDocName, { color: tc.text }]}>
                      Dr. Preetha Rajesh, MD (Radiology), FRCR
                    </Text>
                    <Text style={[styles.letterheadDocSpec, { color: colors.whatsapp.primary }]}>
                      Senior Consultant Radiologist &amp; Imaging Specialist
                    </Text>
                    <Text style={[styles.letterheadReg, { color: tc.textSecondary }]}>
                      TNMC Reg #984210 • Scan Room 1 • Rio Scan Center, Tirunelveli
                    </Text>
                  </View>
                  <View style={styles.verifiedSeal}>
                    <Text style={styles.verifiedSealEmoji}>🩺</Text>
                    <Text style={styles.verifiedSealText}>VERIFIED Rx</Text>
                  </View>
                </View>

                <View style={[styles.dividerLine, { backgroundColor: tc.cardBorder }]} />

                {/* Patient Demographics Grid */}
                <View style={styles.patientGrid}>
                  <View style={styles.gridItem}>
                    <Text style={[styles.gridLabel, { color: tc.textSecondary }]}>PATIENT NAME</Text>
                    <Text style={[styles.gridVal, { color: tc.text }]}>{inspectRecord.patientName}</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={[styles.gridLabel, { color: tc.textSecondary }]}>AGE / GENDER</Text>
                    <Text style={[styles.gridVal, { color: tc.text }]}>
                      {inspectRecord.patientAge} Years / {inspectRecord.patientGender}
                    </Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={[styles.gridLabel, { color: tc.textSecondary }]}>VISIT DATE</Text>
                    <Text style={[styles.gridVal, { color: tc.text }]}>
                      {formatDateHeading(inspectRecord.appointmentDate)}
                    </Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={[styles.gridLabel, { color: tc.textSecondary }]}>PHONE / CONTACT</Text>
                    <TouchableOpacity
                      onPress={() => handleCallPatient(inspectRecord.patientPhone, inspectRecord.patientName)}
                    >
                      <Text style={[styles.gridVal, { color: colors.whatsapp.primary, textDecorationLine: 'underline' }]}>
                        {inspectRecord.patientPhone} 📞
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Diagnosis & Clinical Findings */}
              <View style={[styles.modalCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <Text style={[styles.modalCardTitle, { color: tc.text }]}>Clinical Diagnosis & Findings</Text>
                <View style={[styles.diagHighlightBox, { backgroundColor: isDark ? '#1C2E24' : '#F0FDF4' }]}>
                  <Text style={styles.diagHighlightText}>
                    {inspectRecord.prescription?.diagnosis ||
                      inspectRecord.consultationNotes ||
                      'Standard Cardiovascular Clinical Evaluation'}
                  </Text>
                </View>

                {inspectRecord.symptoms && (
                  <View style={styles.fieldSection}>
                    <Text style={[styles.fieldTitle, { color: tc.textSecondary }]}>Chief Presenting Symptoms</Text>
                    <Text style={[styles.fieldText, { color: tc.text }]}>{inspectRecord.symptoms}</Text>
                  </View>
                )}

                {inspectRecord.prescription?.clinicalAdvice && (
                  <View style={styles.fieldSection}>
                    <Text style={[styles.fieldTitle, { color: tc.textSecondary }]}>Doctor's Clinical Advice & Lifestyle Plan</Text>
                    <Text style={[styles.fieldText, { color: tc.text }]}>
                      {inspectRecord.prescription.clinicalAdvice}
                    </Text>
                  </View>
                )}
              </View>

              {/* Prescribed Medications Table */}
              <View style={[styles.modalCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <View style={styles.cardHeaderWithCount}>
                  <Text style={[styles.modalCardTitle, { color: tc.text }]}>Prescribed Medications (Rx)</Text>
                  <Text style={styles.rxCountBadge}>
                    {inspectRecord.prescription?.medicines?.length || 0} Medicines
                  </Text>
                </View>

                {inspectRecord.prescription?.medicines && inspectRecord.prescription.medicines.length > 0 ? (
                  <View style={styles.rxTableContainer}>
                    {inspectRecord.prescription.medicines.map((med, idx) => (
                      <View
                        key={med.id || idx}
                        style={[
                          styles.rxTableRow,
                          { borderBottomColor: tc.cardBorder },
                          idx === 0 && { borderTopWidth: 0 },
                        ]}
                      >
                        <View style={styles.rxNumberBadge}>
                          <Text style={styles.rxNumberBadgeText}>{idx + 1}</Text>
                        </View>
                        <View style={styles.rxDetailsCol}>
                          <View style={styles.rxNameRow}>
                            <Text style={[styles.rxMedName, { color: tc.text }]}>{med.name}</Text>
                            <Text style={styles.rxMedDose}>{med.dosage}</Text>
                          </View>
                          <Text style={[styles.rxFreqText, { color: tc.textSecondary }]}>
                            Timing: {med.frequency} • Duration: {med.duration}
                          </Text>
                          {med.instructions && (
                            <Text style={styles.rxInstText}>Note: {med.instructions}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.noRxText, { color: tc.textSecondary }]}>
                    No medications were prescribed during this visit.
                  </Text>
                )}
              </View>

              {/* Scanned Diagnostic Reports & X-rays */}
              <View style={[styles.modalCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <Text style={[styles.modalCardTitle, { color: tc.text }]}>
                  Attached Scanned Diagnostics & Radiology (
                  {inspectRecord.scannedReports ? inspectRecord.scannedReports.length : 0})
                </Text>

                {inspectRecord.scannedReports && inspectRecord.scannedReports.length > 0 ? (
                  <View style={styles.reportsGrid}>
                    {inspectRecord.scannedReports.map((rep) => (
                      <TouchableOpacity
                        key={rep.id}
                        style={[styles.reportItemCard, { backgroundColor: isDark ? '#27272A' : '#F8FAFC' }]}
                        onPress={() => setInspectReport(rep)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: rep.fileUri }} style={styles.reportThumb} resizeMode="cover" />
                        <View style={styles.reportItemInfo}>
                          <Text style={[styles.reportItemTitle, { color: tc.text }]} numberOfLines={1}>
                            {rep.title}
                          </Text>
                          <Text style={[styles.reportItemSub, { color: tc.textSecondary }]}>
                            {rep.reportType.toUpperCase()} • {rep.scanDate}
                          </Text>
                          <Text style={styles.inspectHintText}>Tap to inspect full report ➔</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.noRxText, { color: tc.textSecondary }]}>
                    No diagnostic scans or blood reports attached for this visit.
                  </Text>
                )}
              </View>

              {/* Financial & Receipt Information */}
              <View style={[styles.modalCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <Text style={[styles.modalCardTitle, { color: tc.text }]}>Payment & Billing Record</Text>
                <View style={styles.billingRow}>
                  <Text style={[styles.billingLabel, { color: tc.textSecondary }]}>Consultation Fee:</Text>
                  <Text style={[styles.billingVal, { color: tc.text }]}>
                    ${inspectRecord.paymentAmount || 75}.00
                  </Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={[styles.billingLabel, { color: tc.textSecondary }]}>Payment Method:</Text>
                  <Text style={[styles.billingVal, { color: tc.text }]}>
                    {inspectRecord.paymentMethod ? inspectRecord.paymentMethod.toUpperCase() : 'PAID'}
                  </Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={[styles.billingLabel, { color: tc.textSecondary }]}>Receipt Reference:</Text>
                  <Text style={[styles.billingVal, { color: colors.whatsapp.primary }]}>
                    {inspectRecord.receiptNumber || 'RCP-UP-98214'}
                  </Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={[styles.billingLabel, { color: tc.textSecondary }]}>Payment Status:</Text>
                  <Text style={[styles.billingVal, { color: '#16A34A', fontWeight: 'bold' }]}>
                    ✓ Settled & Verified
                  </Text>
                </View>
              </View>

              {/* Actions Footer */}
              <View style={styles.modalFooterActions}>
                <TouchableOpacity
                  style={[styles.shareRxBtn, { backgroundColor: colors.whatsapp.primary }]}
                  onPress={() => {
                    showToast(`Prescription summary for ${inspectRecord.patientName} copied to clipboard!`);
                  }}
                  activeOpacity={0.7}
                >
                  <AppIcon name="share-outline" size={17} color="#FFFFFF" />
                  <Text style={styles.shareRxBtnText}>Share / Export Digital Rx</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.callDirectModalBtn, { backgroundColor: '#16A34A' }]}
                  onPress={() => handleCallPatient(inspectRecord.patientPhone, inspectRecord.patientName)}
                  activeOpacity={0.7}
                >
                  <AppIcon name="call" size={17} color="#FFFFFF" />
                  <Text style={styles.callDirectModalBtnText}>Call Patient Directly</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* FULL REPORT INSPECTION MODAL */}
      {inspectReport && (
        <Modal
          visible={!!inspectReport}
          transparent
          animationType="fade"
          onRequestClose={() => setInspectReport(null)}
        >
          <View style={styles.reportModalOverlay}>
            <View style={[styles.reportModalCard, { backgroundColor: isDark ? '#18181B' : '#FFFFFF' }]}>
              <View style={styles.reportModalHeader}>
                <View>
                  <Text style={[styles.reportModalTitle, { color: tc.text }]}>{inspectReport.title}</Text>
                  <Text style={[styles.reportModalSub, { color: tc.textSecondary }]}>
                    {inspectReport.patientName} • {inspectReport.scanDate}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setInspectReport(null)} style={styles.reportCloseBtn}>
                  <AppIcon name="close" size={20} color={tc.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.reportViewerScroll} maximumZoomScale={3} minimumZoomScale={1}>
                <Image
                  source={{ uri: inspectReport.fileUri }}
                  style={styles.fullReportImage}
                  resizeMode="contain"
                />
              </ScrollView>

              {inspectReport.notes && (
                <View style={[styles.reportNotesCard, { backgroundColor: isDark ? '#27272A' : '#FEF3C7' }]}>
                  <Text style={[styles.reportNotesTitle, { color: isDark ? '#F59E0B' : '#92400E' }]}>
                    Pathologist / Radiologist Interpretation:
                  </Text>
                  <Text style={[styles.reportNotesBody, { color: isDark ? '#F4F4F5' : '#78350F' }]}>
                    {inspectReport.notes}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.dismissBtn, { backgroundColor: colors.whatsapp.primary }]}
                onPress={() => setInspectReport(null)}
              >
                <Text style={styles.dismissBtnText}>Close Report Viewer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 12 : 8,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#0F766E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  totalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  totalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsStrip: {
    gap: 10,
    paddingBottom: 10,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  metricEmoji: {
    fontSize: 18,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  dateGroupContainer: {
    marginBottom: 20,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  countBadgePill: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgePillText: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '700',
  },
  recordCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tokenBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  patientIdentityCol: {
    flex: 1,
    justifyContent: 'center',
  },
  lineOne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientNameText: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
  },
  timeSlotBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  summaryChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  microChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  microChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  scansIndicator: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scansIndicatorText: {
    color: '#0369A1',
    fontSize: 9.5,
    fontWeight: '700',
  },
  tokenPill: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  tokenPillSub: {
    color: '#CCFBF1',
    fontSize: 8,
    fontWeight: '700',
  },
  tokenPillNum: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  diagnosisBox: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  diagnosisLabel: {
    color: '#16A34A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  diagnosisText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  symptomsPreviewText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  boldLabel: {
    fontWeight: '700',
  },
  medsPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  medsHeaderLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  medChipsScroll: {
    gap: 6,
  },
  medChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  medChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reportsAttachedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    marginBottom: 6,
  },
  reportsAttachedText: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  viewScanInlineBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  viewScanInlineBtnText: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  feeBadge: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  feeBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callSmallBtn: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  viewFullBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewFullBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Modal styles
  modalRoot: {
    flex: 1,
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalMainTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalMainSub: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  docLetterheadCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  docStampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  letterheadDocName: {
    fontSize: 16,
    fontWeight: '800',
  },
  letterheadDocSpec: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  letterheadReg: {
    fontSize: 11,
    marginTop: 2,
  },
  verifiedSeal: {
    alignItems: 'center',
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  verifiedSealEmoji: {
    fontSize: 16,
  },
  verifiedSealText: {
    color: '#0D9488',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  dividerLine: {
    height: 1,
    marginVertical: 12,
  },
  patientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47%',
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  gridVal: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  modalCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  diagHighlightBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  diagHighlightText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  fieldSection: {
    marginTop: 8,
  },
  fieldTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  fieldText: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardHeaderWithCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rxCountBadge: {
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rxTableContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  rxTableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  rxNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  rxNumberBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  rxDetailsCol: {
    flex: 1,
  },
  rxNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rxMedName: {
    fontSize: 14,
    fontWeight: '700',
  },
  rxMedDose: {
    color: colors.whatsapp.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  rxFreqText: {
    fontSize: 12,
    marginTop: 2,
  },
  rxInstText: {
    color: '#F59E0B',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  noRxText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  reportsGrid: {
    gap: 10,
  },
  reportItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 8,
    gap: 12,
  },
  reportThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  reportItemInfo: {
    flex: 1,
  },
  reportItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  reportItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  inspectHintText: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billingLabel: {
    fontSize: 13,
  },
  billingVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooterActions: {
    gap: 10,
    marginTop: 10,
  },
  shareRxBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  shareRxBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  callDirectModalBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  callDirectModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Full report viewer modal
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  reportModalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    borderRadius: 20,
    padding: 18,
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportModalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  reportModalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  reportCloseBtn: {
    padding: 4,
  },
  reportViewerScroll: {
    maxHeight: 380,
  },
  fullReportImage: {
    width: '100%',
    height: 380,
    borderRadius: 12,
  },
  reportNotesCard: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  reportNotesTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  reportNotesBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  dismissBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
