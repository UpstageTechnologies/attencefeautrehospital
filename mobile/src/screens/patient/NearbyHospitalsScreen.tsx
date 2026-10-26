import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Platform,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useHospital } from '../../context/HospitalContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Hospital, UserProfile } from '../../types';
import { dataStore } from '../../services/dataStore';
import { AppIcon } from '../../components/common/AppIcon';

interface NearbyHospitalsScreenProps {
  onSelectHospitalForBooking: (hospital: Hospital, doctorId?: string, date?: string, slot?: string) => void;
}

export const NearbyHospitalsScreen: React.FC<NearbyHospitalsScreenProps> = ({
  onSelectHospitalForBooking,
}) => {
  const { hospitals, setUserLocation, getDoctorAvailability, availabilityVersion } = useHospital();
  const { colors: tc, isDark } = useAppTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');

  // Hospital Detail Modal State
  const [selectedHospitalForDetail, setSelectedHospitalForDetail] = useState<Hospital | null>(null);

  // Selected date for doctor availability inspection (7-day strip)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Selected slot per doctor { [doctorId]: string }
  const [selectedDoctorSlots, setSelectedDoctorSlots] = useState<Record<string, string>>({});

  const departments = ['All', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Radiology', 'General Medicine'];

  // 7-day upcoming date strip
  const upcoming7Days = useMemo(() => {
    const list: Array<{ date: string; dayName: string; dayNum: number; monthName: string; isToday: boolean }> = [];
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      list.push({
        date: dateStr,
        dayName: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString(undefined, { month: 'short' }),
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        h.name.toLowerCase().includes(query) ||
        h.city.toLowerCase().includes(query) ||
        h.address.toLowerCase().includes(query) ||
        h.departments.some((d) => d.toLowerCase().includes(query));
      const matchesDept = selectedDept === 'All' || h.departments.includes(selectedDept);
      return matchesSearch && matchesDept;
    });
  }, [hospitals, searchQuery, selectedDept]);

  const handleSimulateGPS = () => {
    setUserLocation({ latitude: 8.7139, longitude: 77.7567 });
    if (Platform.OS === 'web') {
      window.alert('📍 GPS Location Updated: Current location set to Tirunelveli Center, Tamil Nadu. Distances recalculated!');
    } else {
      Alert.alert('GPS Refreshed', 'Hospitals sorted by distance to your current coordinates in Tirunelveli.');
    }
  };

  const handleCallHospital = (phone: string) => {
    const cleanNumber = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          if (Platform.OS === 'web') {
            window.alert(`Calling: ${phone}`);
          } else {
            Alert.alert('Call Hospital', `Connecting to ${phone}`);
          }
        }
      })
      .catch(() => {
        if (Platform.OS === 'web') {
          window.alert(`Calling: ${phone}`);
        } else {
          Alert.alert('Call', `Connecting to ${phone}`);
        }
      });
  };

  // Doctors in the currently inspected hospital
  const hospitalDoctors = useMemo(() => {
    if (!selectedHospitalForDetail) return [];
    return dataStore.getDoctors(selectedHospitalForDetail.id);
  }, [selectedHospitalForDetail]);

  const handleBookDoctor = (doc: UserProfile) => {
    if (!selectedHospitalForDetail) return;
    const avail = getDoctorAvailability(doc.id, selectedDate);
    if (!avail.isAvailable) {
      const msg = `${doc.name} is on leave on ${selectedDate} (${avail.note || 'Clinic closed'}). Please choose another date.`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Doctor Unavailable', msg);
      }
      return;
    }

    const slot = selectedDoctorSlots[doc.id] || avail.slots[0] || '10:00 AM';
    const targetHosp = selectedHospitalForDetail;
    setSelectedHospitalForDetail(null);
    onSelectHospitalForBooking(targetHosp, doc.id, selectedDate, slot);
  };

  const renderHospitalCard = ({ item }: { item: Hospital }) => {
    return (
      <TouchableOpacity
        style={[styles.hospitalCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
        onPress={() => {
          setSelectedHospitalForDetail(item);
          setSelectedDate(todayStr);
        }}
        activeOpacity={0.88}
      >
        {/* Cover Image & Badges */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.hospitalImage} />
          <View style={styles.imageOverlayGradient} />

          {/* Distance Badge */}
          <View style={styles.distanceBadge}>
            <AppIcon name="location" size={11} color="#25D366" />
            <Text style={styles.distanceText}>
              {item.distanceKm ? `${item.distanceKm} km away` : '1.4 km away'}
            </Text>
          </View>

          {/* Rating Badge */}
          <View style={styles.ratingBadge}>
            <AppIcon name="star" size={11} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.reviewCountText}>({item.reviewCount})</Text>
          </View>
        </View>

        {/* Content Info */}
        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <Text style={[styles.hospitalName, { color: tc.text }]} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <Text style={[styles.tagline, { color: isDark ? '#9CA3AF' : '#64748B' }]} numberOfLines={1}>
            {item.tagline}
          </Text>

          <View style={styles.addressRow}>
            <AppIcon name="location-outline" size={13} color={isDark ? '#9CA3AF' : '#64748B'} />
            <Text style={[styles.addressText, { color: isDark ? '#9CA3AF' : '#64748B' }]} numberOfLines={1}>
              {item.address}
            </Text>
          </View>

          {/* Department Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.deptsRow}
          >
            {item.departments.slice(0, 4).map((dept) => (
              <View
                key={dept}
                style={[
                  styles.deptChip,
                  { backgroundColor: isDark ? '#1C2E2A' : '#F0FDF4', borderColor: isDark ? '#234E44' : '#DCF8C6' },
                ]}
              >
                <Text style={[styles.deptChipText, { color: isDark ? '#6EE7B7' : '#166534' }]}>
                  {dept}
                </Text>
              </View>
            ))}
            {item.departments.length > 4 && (
              <View
                style={[
                  styles.deptChip,
                  { backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderColor: tc.cardBorder },
                ]}
              >
                <Text style={[styles.deptChipText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                  +{item.departments.length - 4} more
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer with Specialists Count & Action */}
          <View style={[styles.cardFooter, { borderTopColor: tc.cardBorder }]}>
            <View style={styles.footerMeta}>
              <View style={styles.metaItem}>
                <AppIcon name="people" size={13} color={colors.whatsapp.primary} />
                <Text style={[styles.specialistsCount, { color: tc.text }]}>
                  {item.totalDoctors} Specialists
                </Text>
              </View>
              <View style={styles.metaItem}>
                <AppIcon name="time-outline" size={12} color={isDark ? '#9CA3AF' : '#64748B'} />
                <Text style={[styles.hoursText, { color: isDark ? '#9CA3AF' : '#64748B' }]} numberOfLines={1}>
                  {item.openingHours.split('(')[0].trim()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewDoctorsBtn}
              onPress={() => {
                setSelectedHospitalForDetail(item);
                setSelectedDate(todayStr);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.viewDoctorsBtnText}>Specialists & Book</Text>
              <AppIcon name="chevron-forward" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const features = [
    { id: 'symptoms', label: 'Symptom\nChecker', icon: 'pulse-outline', bg: isDark ? '#1E293B' : '#EFF6FF', color: '#2563EB' },
    { id: 'teleconsult', label: 'Video\nConsult', icon: 'call', bg: isDark ? '#1E1B4B' : '#FAF5FF', color: '#8B5CF6' },
    { id: 'scans', label: 'Scan\nReports', icon: 'scan-outline', bg: isDark ? '#082F49' : '#E0F2FE', color: '#0284C7' },
    { id: 'labs', label: 'RIO Labs\n& Scans', icon: 'medkit', bg: isDark ? '#064E3B' : '#ECFDF5', color: '#059669' },
    { id: 'queue', label: 'Live Queue\nToken Pass', icon: 'ticket', bg: isDark ? '#451A03' : '#FFFBEB', color: '#D97706' },
    { id: 'pharmacy', label: 'Medicines\n& Rx', icon: 'card', bg: isDark ? '#4C0519' : '#FFF1F2', color: '#E11D48' },
  ];

  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* 2x3 Feature Grid (Screenshot 2) */}
      <View style={styles.featureGrid}>
        {features.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.featureTile, { backgroundColor: item.bg }]}
            activeOpacity={0.8}
            onPress={() => {
              if (item.id === 'labs') setSearchQuery('RIO');
              else if (item.id === 'scans') setSearchQuery('Scan');
              else if (item.id === 'symptoms') setSelectedDept('General Medicine');
            }}
          >
            <View style={[styles.featureIconWrap, { backgroundColor: item.color + '15' }]}>
              <AppIcon name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={[styles.featureLabel, { color: tc.text }]} numberOfLines={2}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: tc.text }]}>Top Clinics & Centers</Text>
        <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
          {filteredHospitals.length} Found
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* ========================================================
          GPS LOCATION BAR (Clean iOS Design)
      ======================================================== */}
      <View
        style={[
          styles.locationBar,
          { backgroundColor: isDark ? '#18181B' : '#F8FAFC', borderBottomColor: tc.cardBorder },
        ]}
      >
        <View style={styles.locationIconWrap}>
          <AppIcon name="location" size={16} color={colors.brand.primary} />
        </View>
        <View style={styles.locationTextWrap}>
          <Text style={[styles.locationLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
            PATIENT GPS COORDINATES
          </Text>
          <Text style={[styles.locationAddress, { color: tc.text }]} numberOfLines={1}>
            Tirunelveli Center, Tamil Nadu
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.gpsRefreshBtn, { borderColor: tc.cardBorder, backgroundColor: isDark ? '#27272A' : '#FFFFFF' }]}
          onPress={handleSimulateGPS}
          activeOpacity={0.7}
        >
          <AppIcon name="refresh" size={12} color={colors.brand.primary} />
          <Text style={[styles.gpsRefreshText, { color: tc.text }]}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================
          SEARCH BAR (Collapsible, Sleek iOS with Clear Button)
      ======================================================== */}
      <View style={[styles.searchSection, { backgroundColor: tc.background }]}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: isDark ? '#27272A' : '#FFFFFF', borderColor: tc.cardBorder },
          ]}
        >
          <AppIcon name="search-outline" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
          <TextInput
            style={[styles.searchInput, { color: tc.text }]}
            placeholder="Search hospitals, doctors, or specialty..."
            placeholderTextColor={isDark ? '#71717A' : '#94A3B8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <AppIcon name="close-circle" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ========================================================
          DEPARTMENT FILTER CHIPS
      ======================================================== */}
      <View style={[styles.deptsFilterBar, { backgroundColor: tc.background }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          {departments.map((dept) => {
            const isSelected = selectedDept === dept;
            return (
              <TouchableOpacity
                key={dept}
                style={[
                  styles.filterPill,
                  { borderColor: tc.cardBorder, backgroundColor: isDark ? '#27272A' : '#FFFFFF' },
                  isSelected && [
                    styles.filterPillActive,
                    { backgroundColor: '#0F172A', borderColor: '#0F172A' },
                  ],
                ]}
                onPress={() => setSelectedDept(dept)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#FFFFFF' : tc.text },
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {dept}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ========================================================
          HOSPITALS LIST
      ======================================================== */}
      <FlatList
        data={filteredHospitals}
        keyExtractor={(item) => item.id}
        renderItem={renderHospitalCard}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <AppIcon name="business-outline" size={44} color={isDark ? '#52525B' : '#CBD5E1'} />
            <Text style={[styles.emptyTitle, { color: tc.text }]}>No Hospitals Found</Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
              Try adjusting your search query or department filter.
            </Text>
          </View>
        }
      />

      {/* ========================================================
          HOSPITAL DETAIL & DOCTOR AVAILABILITY BOOKING MODAL
      ======================================================== */}
      {selectedHospitalForDetail && (
        <Modal
          visible={!!selectedHospitalForDetail}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedHospitalForDetail(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContentCard, { backgroundColor: tc.card }]}>
              {/* Modal Top Header */}
              <View style={[styles.modalHeaderRow, { borderBottomColor: tc.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalHospitalName, { color: tc.text }]} numberOfLines={1}>
                    {selectedHospitalForDetail.name}
                  </Text>
                  <Text style={[styles.modalHospitalSub, { color: isDark ? '#9CA3AF' : '#64748B' }]} numberOfLines={1}>
                    {selectedHospitalForDetail.address}
                  </Text>
                </View>

                {/* Quick Call Hospital Button */}
                <TouchableOpacity
                  style={styles.modalCallBtn}
                  onPress={() => handleCallHospital(selectedHospitalForDetail.phone)}
                  activeOpacity={0.7}
                >
                  <AppIcon name="call" size={13} color="#FFFFFF" />
                  <Text style={styles.modalCallBtnText}>Call Hospital</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedHospitalForDetail(null)}
                  style={styles.modalCloseBtn}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Hospital Header Banner */}
                <View style={styles.modalBannerWrap}>
                  <Image source={{ uri: selectedHospitalForDetail.imageUrl }} style={styles.modalBannerImage} />
                  <View style={styles.modalBannerOverlay} />
                  <View style={styles.modalBannerInfo}>
                    <Text style={styles.modalBannerRating}>★ {selectedHospitalForDetail.rating} ({selectedHospitalForDetail.reviewCount} Reviews)</Text>
                    <Text style={styles.modalBannerHours}>{selectedHospitalForDetail.openingHours}</Text>
                  </View>
                </View>

                {/* ========================================================
                    7-DAY DATE SELECTOR STRIP (Date-wise doctor availability)
                ======================================================== */}
                <View style={styles.dateSelectorSection}>
                  <View style={styles.dateSectionHeader}>
                    <View>
                      <Text style={[styles.dateSectionTitle, { color: tc.text }]}>
                        SELECT APPOINTMENT DATE
                      </Text>
                      <Text style={[styles.dateSectionSub, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                        Doctor availability and active slots update per selected date
                      </Text>
                    </View>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateStripRow}
                  >
                    {upcoming7Days.map((d) => {
                      const isSelected = selectedDate === d.date;
                      return (
                        <TouchableOpacity
                          key={d.date}
                          style={[
                            styles.datePill,
                            { backgroundColor: isDark ? '#27272A' : '#F1F5F9', borderColor: tc.cardBorder },
                            isSelected && [
                              styles.datePillActive,
                              { backgroundColor: colors.whatsapp.primary, borderColor: colors.whatsapp.primary },
                            ],
                          ]}
                          onPress={() => setSelectedDate(d.date)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.dateDayName,
                              { color: isDark ? '#9CA3AF' : '#64748B' },
                              isSelected && styles.dateDayNameActive,
                            ]}
                          >
                            {d.dayName}
                          </Text>
                          <Text
                            style={[
                              styles.dateDayNum,
                              { color: tc.text },
                              isSelected && styles.dateDayNumActive,
                            ]}
                          >
                            {d.dayNum}
                          </Text>
                          <Text
                            style={[
                              styles.dateMonthName,
                              { color: isDark ? '#71717A' : '#94A3B8' },
                              isSelected && styles.dateMonthNameActive,
                            ]}
                          >
                            {d.monthName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* ========================================================
                    SPECIALISTS PRACTICING AT THIS HOSPITAL
                ======================================================== */}
                <View style={styles.doctorsSection}>
                  <View style={styles.doctorsHeaderRow}>
                    <Text style={[styles.doctorsSectionTitle, { color: tc.text }]}>
                      SPECIALISTS AT THIS HOSPITAL ({hospitalDoctors.length})
                    </Text>
                  </View>

                  {hospitalDoctors.map((doc) => {
                    const profile = doc.doctorProfile;
                    const availability = getDoctorAvailability(doc.id, selectedDate);
                    const currentSelectedSlot = selectedDoctorSlots[doc.id] || availability.slots[0];

                    const isAvailable = availability.isAvailable;
                    const isMorningOnly = availability.status === 'morning_only';
                    const isEveningOnly = availability.status === 'evening_only';
                    const isOnLeave = availability.status === 'on_leave' || !isAvailable;

                    return (
                      <View
                        key={doc.id}
                        style={[
                          styles.doctorCard,
                          { backgroundColor: isDark ? '#27272A' : '#F8FAFC', borderColor: tc.cardBorder },
                        ]}
                      >
                        {/* Doctor Identity Header */}
                        <View style={styles.docHeaderRow}>
                          <Image
                            source={{
                              uri:
                                doc.avatarUrl ||
                                'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
                            }}
                            style={styles.docAvatar}
                          />

                          <View style={styles.docInfo}>
                            <View style={styles.docNameRatingRow}>
                              <Text style={[styles.docName, { color: tc.text }]} numberOfLines={1}>
                                {doc.name}
                              </Text>
                              <View style={styles.docRatingPill}>
                                <AppIcon name="star" size={10} color="#F59E0B" />
                                <Text style={styles.docRatingText}>{profile?.rating || 4.9}</Text>
                              </View>
                            </View>

                            <Text style={[styles.docSpecialty, { color: colors.whatsapp.primary }]}>
                              {profile?.specialty || 'Diagnostic Radiology'}
                            </Text>

                            <Text style={[styles.docQual, { color: isDark ? '#9CA3AF' : '#64748B' }]} numberOfLines={1}>
                              {profile?.qualification || 'MBBS, MD'} • {profile?.roomNumber || 'Scan Room 1'}
                            </Text>

                            <View style={styles.docMetaRow}>
                              <Text style={[styles.docFee, { color: tc.text }]}>
                                Fee: ₹{profile?.consultationFee || 800}
                              </Text>
                              <Text style={[styles.docExp, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                                • {profile?.experienceYears || 12} yrs experience
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Live Availability Status Pill */}
                        <View style={styles.statusBannerRow}>
                          {isAvailable && !isMorningOnly && !isEveningOnly && (
                            <View style={[styles.availBadge, styles.availBadgeGreen]}>
                              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                              <Text style={styles.availBadgeGreenText}>Available (Full Day OPD)</Text>
                            </View>
                          )}
                          {isMorningOnly && (
                            <View style={[styles.availBadge, styles.availBadgeYellow]}>
                              <View style={[styles.statusDot, { backgroundColor: '#D97706' }]} />
                              <Text style={styles.availBadgeYellowText}>Morning Shift Only (09:00 AM - 01:00 PM)</Text>
                            </View>
                          )}
                          {isEveningOnly && (
                            <View style={[styles.availBadge, styles.availBadgeBlue]}>
                              <View style={[styles.statusDot, { backgroundColor: '#0284C7' }]} />
                              <Text style={styles.availBadgeBlueText}>Evening Shift Only (02:00 PM - 06:00 PM)</Text>
                            </View>
                          )}
                          {isOnLeave && (
                            <View style={[styles.availBadge, styles.availBadgeRed]}>
                              <View style={[styles.statusDot, { backgroundColor: '#DC2626' }]} />
                              <Text style={styles.availBadgeRedText}>
                                On Leave • {availability.note || 'Clinic Closed on this date'}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Time Slots Grid (if available) */}
                        {isAvailable && availability.slots.length > 0 ? (
                          <View style={styles.slotsSection}>
                            <Text style={[styles.slotsLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                              SELECT TIME SLOT:
                            </Text>
                            <View style={styles.slotsGrid}>
                              {availability.slots.map((slot) => {
                                const isSlotSelected = currentSelectedSlot === slot;
                                return (
                                  <TouchableOpacity
                                    key={slot}
                                    style={[
                                      styles.slotChip,
                                      { backgroundColor: isDark ? '#1F1F23' : '#FFFFFF', borderColor: tc.cardBorder },
                                      isSlotSelected && [
                                        styles.slotChipActive,
                                        { backgroundColor: colors.whatsapp.primary, borderColor: colors.whatsapp.primary },
                                      ],
                                    ]}
                                    onPress={() => {
                                      setSelectedDoctorSlots((prev) => ({
                                        ...prev,
                                        [doc.id]: slot,
                                      }));
                                    }}
                                    activeOpacity={0.7}
                                  >
                                    <Text
                                      style={[
                                        styles.slotChipText,
                                        { color: tc.text },
                                        isSlotSelected && styles.slotChipTextActive,
                                      ]}
                                    >
                                      {slot}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        ) : (
                          <View style={[styles.unavailNotice, { backgroundColor: isDark ? '#3E1F1F' : '#FEF2F2' }]}>
                            <Text style={styles.unavailNoticeText}>
                              ⚠️ No appointment slots on this date. Doctor will resume consultations on next active day.
                            </Text>
                          </View>
                        )}

                        {/* Book Doctor Action Button */}
                        <TouchableOpacity
                          style={[
                            styles.bookDoctorBtn,
                            isOnLeave && styles.bookDoctorBtnDisabled,
                          ]}
                          disabled={isOnLeave}
                          onPress={() => handleBookDoctor(doc)}
                          activeOpacity={0.8}
                        >
                          <AppIcon
                            name={isOnLeave ? 'close-circle' : 'calendar'}
                            size={15}
                            color="#FFFFFF"
                          />
                          <Text style={styles.bookDoctorBtnText}>
                            {isOnLeave
                              ? 'Unavailable on Selected Date'
                              : `Book for ${selectedDate === todayStr ? 'Today' : selectedDate} (${currentSelectedSlot || 'Slot'})`}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
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
  // GPS Location Bar
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  locationIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrap: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  locationAddress: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  gpsRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  gpsRefreshText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Search Bar
  searchSection: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  clearSearchBtn: {
    padding: 2,
  },
  // Departments Filter
  deptsFilterBar: {
    paddingBottom: 8,
  },
  filterPillsRow: {
    paddingHorizontal: 14,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterPillActive: {},
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Hospitals List
  listContent: {
    padding: 14,
    paddingBottom: 110,
    gap: 14,
  },
  listHeaderContainer: {
    paddingBottom: 6,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  featureTile: {
    width: '31%',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      } as any,
    }),
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  hospitalCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 145,
    position: 'relative',
  },
  hospitalImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  distanceBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  reviewCountText: {
    color: '#64748B',
    fontSize: 10,
  },
  cardBody: {
    padding: 14,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  tagline: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  addressText: {
    fontSize: 11,
    flex: 1,
  },
  deptsRow: {
    gap: 6,
    marginVertical: 10,
  },
  deptChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  deptChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerMeta: {
    flex: 1,
    gap: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specialistsCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  hoursText: {
    fontSize: 10,
  },
  viewDoctorsBtn: {
    backgroundColor: colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 4,
  },
  viewDoctorsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Hospital Detail Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  modalHospitalName: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalHospitalSub: {
    fontSize: 11,
    marginTop: 1,
  },
  modalCallBtn: {
    backgroundColor: colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  modalCallBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  modalScroll: {
    paddingHorizontal: 16,
  },
  modalBannerWrap: {
    width: '100%',
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
    position: 'relative',
  },
  modalBannerImage: {
    width: '100%',
    height: '100%',
  },
  modalBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalBannerInfo: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBannerRating: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
  },
  modalBannerHours: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  // 7-day strip
  dateSelectorSection: {
    marginTop: 14,
  },
  dateSectionHeader: {
    marginBottom: 8,
  },
  dateSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateSectionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  dateStripRow: {
    gap: 8,
    paddingVertical: 4,
  },
  datePill: {
    width: 62,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  datePillActive: {},
  dateDayName: {
    fontSize: 10,
    fontWeight: '600',
  },
  dateDayNameActive: {
    color: '#FFFFFF',
  },
  dateDayNum: {
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 1,
  },
  dateDayNumActive: {
    color: '#FFFFFF',
  },
  dateMonthName: {
    fontSize: 9,
    fontWeight: '500',
  },
  dateMonthNameActive: {
    color: '#FFFFFF',
  },
  // Doctors Section
  doctorsSection: {
    marginTop: 16,
    paddingBottom: 20,
  },
  doctorsHeaderRow: {
    marginBottom: 10,
  },
  doctorsSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  doctorCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  docHeaderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  docAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
  },
  docInfo: {
    flex: 1,
  },
  docNameRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docName: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  docRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  docRatingText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  docSpecialty: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  docQual: {
    fontSize: 11,
    marginTop: 1,
  },
  docMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  docFee: {
    fontSize: 11,
    fontWeight: '800',
  },
  docExp: {
    fontSize: 11,
  },
  // Status banner
  statusBannerRow: {
    marginVertical: 8,
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availBadgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  availBadgeGreenText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  availBadgeYellow: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
  },
  availBadgeYellowText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },
  availBadgeBlue: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  availBadgeBlueText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
  },
  availBadgeRed: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  availBadgeRedText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  // Slots
  slotsSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  slotsLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  slotChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  slotChipActive: {},
  slotChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  slotChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  unavailNotice: {
    padding: 8,
    borderRadius: 8,
    marginVertical: 6,
  },
  unavailNoticeText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
  },
  bookDoctorBtn: {
    backgroundColor: colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    marginTop: 6,
  },
  bookDoctorBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  bookDoctorBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
