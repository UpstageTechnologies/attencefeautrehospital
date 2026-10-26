import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Appointment } from '../../types';
import { AppIcon } from '../../components/common/AppIcon';
import { PulsingStatusDot } from '../../components/common/PulsingStatusDot';
import { AnimatedPressableCard } from '../../components/common/AnimatedPressableCard';

interface DoctorScheduleScreenProps {
  onSelectConsultation: (apt: Appointment) => void;
}

interface CalendarDay {
  dayName: string;
  dayNumber: number;
  monthName: string;
  dateStr: string;
  isToday: boolean;
  hasAppointments: boolean;
}

export const DoctorScheduleScreen: React.FC<DoctorScheduleScreenProps> = ({
  onSelectConsultation,
}) => {
  const { user } = useAuth();
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

  const summarizeText = (text?: string, fallback = 'Routine Consult') => {
    if (!text || !text.trim()) return fallback;
    const words = text.trim().split(/\s+/);
    if (words.length <= 2) return text;
    return `${words[0]} ${words[1]}`;
  };

  // Today reference
  const today = React.useMemo(() => new Date(), []);
  const todayDateStr = today.toISOString().split('T')[0];

  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayDateStr);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Memoize all doctor appointments to prevent unnecessary re-computations on ticking clock
  const allDoctorAppointments = React.useMemo(() => {
    return appointments.filter((a) => a.doctorId === doctorId || !a.doctorId);
  }, [appointments, doctorId]);

  // Filter ONLY appointments specifically booked on the selected day
  const selectedDayAppointments = React.useMemo(() => {
    return allDoctorAppointments.filter((a) => a.appointmentDate === selectedDateStr);
  }, [allDoctorAppointments, selectedDateStr]);

  // Time Mode: 'demo' (10:39 AM OPD peak) or 'system' (live device clock)
  const initialSystemHour = today.getHours();
  const initialInClinicHours = initialSystemHour >= 8 && initialSystemHour <= 18;
  const [timeMode, setTimeMode] = useState<'demo' | 'system'>(
    initialInClinicHours ? 'system' : 'demo'
  );

  // Dynamic live clock
  const [currentTime, setCurrentTime] = useState<Date>(() => {
    const d = new Date();
    if (!initialInClinicHours) {
      d.setHours(10, 39, 0, 0); // 10:39 AM demo scenario requested by user
    }
    return d;
  });

  // Ticking timer: updates live every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime((prev) => {
        if (timeMode === 'system') {
          return new Date();
        } else {
          // Advance demo clock by 1s every second so it is genuinely dynamic
          return new Date(prev.getTime() + 1000);
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeMode]);

  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinutes;
  const formattedNowTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Apple Calendar style time string: "10:39" (12h format without AM/PM)
  const appleTimeFormatted = React.useMemo(() => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const minutePad = m < 10 ? `0${m}` : `${m}`;
    return `${hour12}:${minutePad}`;
  }, [currentTime]);

  // Generate 1 full month of dates (from 7 days ago to 23 days in future = 31 days)
  const calendarDays: CalendarDay[] = React.useMemo(() => {
    const days: CalendarDay[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = -7; i <= 23; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const isToday = i === 0;
      const hasAppointments = allDoctorAppointments.some((a) => a.appointmentDate === dStr);
      days.push({
        dayName: dayNames[d.getDay()],
        dayNumber: d.getDate(),
        monthName: monthNames[d.getMonth()],
        dateStr: dStr,
        isToday,
        hasAppointments,
      });
    }
    return days;
  }, [allDoctorAppointments, today]);

  // Calendar Horizontal ScrollView reference
  const calendarScrollRef = useRef<ScrollView>(null);
  const initialCalendarCentered = useRef<boolean>(false);

  // Center selected day in the 1-month calendar strip
  const centerCalendarDay = useCallback((index: number, animated = true) => {
    const screenWidth = Dimensions.get('window').width;
    const itemWidth = 58; // 50 width + 8 margin
    const targetX = Math.max(0, index * itemWidth - screenWidth / 2 + itemWidth / 2 + 12);
    calendarScrollRef.current?.scrollTo({ x: targetX, animated });
  }, []);

  // Center calendar ONLY ONCE on initial mount (leaving user free to scroll without snapping back)
  useEffect(() => {
    if (!initialCalendarCentered.current && calendarDays.length > 0) {
      initialCalendarCentered.current = true;
      const todayIdx = calendarDays.findIndex((d) => d.isToday);
      if (todayIdx !== -1) {
        setTimeout(() => centerCalendarDay(todayIdx, false), 150);
      }
    }
  }, [calendarDays, centerCalendarDay]);

  const handleDirectCall = (phone: string, name: string) => {
    const cleanNumber = phone.replace(/[^\d+]/g, '');
    Alert.alert(`Call ${name}?`, `Dial ${phone} directly?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call Now',
        onPress: () => {
          Linking.openURL(`tel:${cleanNumber}`).catch(() => {
            showToast(`Calling ${name}...`);
          });
        },
      },
    ]);
  };

  // Helper to parse strings like "10:30 AM", "09:15 AM", "02:45 PM" into 24-hr minutes
  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const meridiem = (match[3] || '').toUpperCase();
    if (meridiem === 'PM' && h < 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  // Formatted date string for header & empty state
  const formattedDisplayDate = React.useMemo(() => {
    try {
      const parts = selectedDateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return selectedDateStr;
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  // Hourly slots for the daily planner (08:00 AM to 06:00 PM)
  const timeSlots = [
    { time: '08:00 AM', hour24: 8 },
    { time: '09:00 AM', hour24: 9 },
    { time: '10:00 AM', hour24: 10 },
    { time: '11:00 AM', hour24: 11 },
    { time: '12:00 PM', hour24: 12 },
    { time: '01:00 PM', hour24: 13, isBreak: true, title: 'Doctor Lunch Break & In-Patient ICU Rounds' },
    { time: '02:00 PM', hour24: 14 },
    { time: '03:00 PM', hour24: 15 },
    { time: '04:00 PM', hour24: 16 },
    { time: '05:00 PM', hour24: 17 },
    { time: '06:00 PM', hour24: 18 },
  ];

  // Map appointments to their slot for the SELECTED day only
  const getAppointmentsForSlot = (hour24: number) => {
    return selectedDayAppointments
      .filter((apt) => {
        const aptMins = parseTimeToMinutes(apt.timeSlot);
        return Math.floor(aptMins / 60) === hour24;
      })
      .sort((a, b) => parseTimeToMinutes(a.timeSlot) - parseTimeToMinutes(b.timeSlot));
  };

  const isViewingToday = selectedDateStr === todayDateStr;

  // Active clinic hours: 08:00 AM to 06:30 PM (480 mins to 1110 mins)
  const isCurrentlyInClinicHours = currentTotalMinutes >= 8 * 60 && currentTotalMinutes <= 18 * 60 + 30;
  const isBeforeClinicHours = isViewingToday && currentTotalMinutes < 8 * 60;
  const isAfterClinicHours = isViewingToday && currentTotalMinutes > 18 * 60 + 30;

  // Active slot hour for positioning red marker during clinic hours
  const activeMarkerHour = isCurrentlyInClinicHours ? currentHour : -1;

  // Only show slots that have booked appointments on this day, or active current hour on today
  const visibleTimeSlots = timeSlots.filter((slot) => {
    const slotApts = getAppointmentsForSlot(slot.hour24);
    if (slotApts.length > 0) return true;
    if (isViewingToday && isCurrentlyInClinicHours && slot.hour24 === activeMarkerHour) return true;
    if (slot.isBreak && selectedDayAppointments.length > 0 && isViewingToday) return true;
    return false;
  });

  // Determine appointment timing state: 'past' | 'current' | 'upcoming'
  const getAppointmentTimeState = (apt: Appointment): 'past' | 'current' | 'upcoming' => {
    if (selectedDateStr < todayDateStr) {
      return 'past';
    }
    if (selectedDateStr > todayDateStr) {
      return 'upcoming';
    }

    // On Today
    if (apt.status === 'completed') {
      return 'past';
    }

    // If outside daytime clinic hours (e.g. 1:45 AM before 8:00 AM)
    if (currentTotalMinutes < 8 * 60) {
      return 'upcoming';
    }

    // If after evening clinic hours (after 6:30 PM)
    if (currentTotalMinutes > 18 * 60 + 30) {
      return 'past';
    }

    const startMins = parseTimeToMinutes(apt.timeSlot);
    const duration = user?.doctorProfile?.avgConsultationMinutes || 15;
    const endMins = startMins + duration;

    if (apt.status === 'in_consultation') {
      if (currentTotalMinutes >= endMins + 30) {
        return 'past';
      }
      if (currentTotalMinutes < startMins - 20) {
        return 'upcoming';
      }
      return 'current';
    }

    if (currentTotalMinutes >= endMins) {
      return 'past';
    }
    if (currentTotalMinutes >= startMins && currentTotalMinutes < endMins) {
      return 'current';
    }
    return 'upcoming';
  };

  // Find the current denoted patient appointment
  const currentPatientApt = selectedDayAppointments.find((apt) => {
    if (!isViewingToday) return false;
    return getAppointmentTimeState(apt) === 'current';
  }) || (isViewingToday && currentHour === 10 ? selectedDayAppointments.find((a) => a.id === 'apt_001') : undefined);

  // Vertical Centering logic with ScrollView
  const scrollViewRef = useRef<ScrollView>(null);
  const [viewportHeight, setViewportHeight] = useState<number>(Dimensions.get('window').height);
  const slotYMap = useRef<{ [hour: number]: number }>({});
  const markerRelativeY = useRef<number>(0);
  const isAutoCentered = useRef<boolean>(false);
  const isUserInteracting = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToCenter = useCallback((animated = true) => {
    if (!isViewingToday) return;
    const slotY = slotYMap.current[activeMarkerHour];
    if (slotY !== undefined) {
      const totalMarkerY = slotY + (markerRelativeY.current || 20);
      const targetScrollY = Math.max(0, totalMarkerY - (viewportHeight / 2) + 30);
      scrollViewRef.current?.scrollTo({ y: targetScrollY, animated });
    }
  }, [isViewingToday, activeMarkerHour, viewportHeight]);

  const handleMarkerLayout = (y: number) => {
    markerRelativeY.current = y;
    if (!isAutoCentered.current) {
      isAutoCentered.current = true;
      setTimeout(() => scrollToCenter(true), 150);
    }
  };

  // Auto-scroll screen when in the page as time moves (currentMinutes updates)
  useEffect(() => {
    if (!isViewingToday) return;
    if (isUserInteracting.current) return;
    scrollToCenter(true);
  }, [currentMinutes, currentHour, isViewingToday, scrollToCenter]);

  // Recenter when date changes to today
  useEffect(() => {
    if (isViewingToday) {
      setTimeout(() => scrollToCenter(true), 180);
    }
  }, [selectedDateStr, isViewingToday, scrollToCenter]);

  const onScrollBeginDrag = () => {
    isUserInteracting.current = true;
  };

  const onScrollEndDrag = () => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 3000);
  };

  const onMomentumScrollEnd = () => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 2500);
  };

  const getStatusBadge = (status: Appointment['status'], isPast: boolean, isCurrent: boolean) => {
    if (isCurrent) {
      return { label: 'Now in Cabin', bg: '#DCFCE7', text: '#15803D' };
    }
    if (isPast) {
      return { label: 'Passed / Done ✓', bg: isDark ? '#27272A' : '#E2E8F0', text: isDark ? '#A1A1AA' : '#64748B' };
    }
    switch (status) {
      case 'in_consultation':
        return { label: `Inside ${user?.doctorProfile?.roomNumber || 'Scan Room 1'}`, bg: '#DCFCE7', text: '#15803D' };
      case 'checked_in':
      case 'waiting':
        return { label: 'Waiting in Lobby', bg: '#FEF3C7', text: '#B45309' };
      case 'completed':
        return { label: 'Done ✓', bg: '#E0F2FE', text: '#0369A1' };
      default:
        return { label: 'Booked', bg: '#F1F5F9', text: '#64748B' };
    }
  };

  // Tracks single render of Apple Calendar red marker per frame
  let redPointerRendered = false;

  // Helper to render Apple Calendar style red time pointer (guaranteed exactly once)
  const renderAppleCalendarRedPointer = (extraLabel?: string) => {
    if (redPointerRendered || !isViewingToday) return null;
    redPointerRendered = true;

    return (
      <View
        style={styles.appleRedPointerContainer}
        onLayout={(e) => handleMarkerLayout(e.nativeEvent.layout.y)}
      >
        {/* Left: Apple Calendar style Red stadium capsule pill */}
        <View style={styles.appleRedTimePill}>
          <Text style={styles.appleRedTimeText}>{appleTimeFormatted}</Text>
        </View>

        {/* Crisp solid Red horizontal line spanning across */}
        <View style={styles.appleRedLine} />

        {extraLabel ? (
          <View style={styles.appleRedExtraBadge}>
            <Text style={styles.appleRedExtraText}>{extraLabel}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Toast Notification */}
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
          <Text style={[styles.headerTitle, { color: tc.text }]}>OPD Schedule & Planner</Text>
          <Text style={[styles.headerSubtitle, { color: tc.textSecondary }]}>
            {user?.name || 'Dr. Preetha Rajesh'} • {user?.doctorProfile?.roomNumber || 'Scan Room 1'}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          {/* Demo / System Time Mode Toggle */}
          <TouchableOpacity
            style={[
              styles.timeModeBtn,
              timeMode === 'demo' ? styles.timeModeBtnActive : { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' },
            ]}
            onPress={() => {
              if (timeMode === 'demo') {
                setTimeMode('system');
                setCurrentTime(new Date());
                showToast('Switched to live device system clock');
              } else {
                setTimeMode('demo');
                const d = new Date();
                d.setHours(10, 39, 0, 0);
                setCurrentTime(d);
                showToast('Switched to 10:39 AM OPD Active Demo');
              }
              setTimeout(() => scrollToCenter(true), 200);
            }}
            activeOpacity={0.75}
          >
            <PulsingStatusDot color={timeMode === 'demo' ? '#FFFFFF' : colors.whatsapp.primary} size={6} active={true} />
            <Text
              style={[
                styles.timeModeBtnText,
                { color: timeMode === 'demo' ? '#FFFFFF' : (isDark ? '#E2E8F0' : '#334155') },
              ]}
            >
              {formattedNowTime}
            </Text>
          </TouchableOpacity>

          {/* Today Button */}
          <TouchableOpacity
            style={[
              styles.todayButton,
              isViewingToday ? styles.todayButtonActive : { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' },
            ]}
            onPress={() => {
              setSelectedDateStr(todayDateStr);
              const todayIdx = calendarDays.findIndex((d) => d.isToday);
              if (todayIdx !== -1) {
                centerCalendarDay(todayIdx, true);
              }
              setTimeout(() => scrollToCenter(true), 150);
            }}
            activeOpacity={0.7}
          >
            <AppIcon name="time-outline" size={13} color={isViewingToday ? '#FFFFFF' : tc.primary} />
            <Text style={[styles.todayButtonText, { color: isViewingToday ? '#FFFFFF' : tc.primary }]}>Today</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 1-Month Horizontal Calendar Strip (Smooth, freely scrollable across 31 days) */}
      <View style={[styles.calendarStripWrapper, { backgroundColor: isDark ? '#1C1C1E' : '#F8FAFC', borderBottomColor: tc.cardBorder }]}>
        <ScrollView
          ref={calendarScrollRef}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarStripScrollContent}
        >
          {calendarDays.map((day, index) => {
            const isSelected = selectedDateStr === day.dateStr;
            return (
              <TouchableOpacity
                key={day.dateStr}
                style={[
                  styles.dayPill,
                  { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
                  isSelected && styles.dayPillActive,
                ]}
                onPress={() => {
                  setSelectedDateStr(day.dateStr);
                  centerCalendarDay(index, true);
                  if (day.dateStr === todayDateStr) {
                    setTimeout(() => scrollToCenter(true), 150);
                  }
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.dayNameText, isSelected ? styles.dayTextActive : { color: tc.textSecondary }]}>
                  {day.dayName}
                </Text>
                <Text style={[styles.dayNumberText, isSelected ? styles.dayTextActive : { color: tc.text }]}>
                  {day.dayNumber}
                </Text>

                {/* Dots: Today Dot vs Booked Appointments Dot */}
                {day.isToday ? (
                  <View style={[styles.todayDot, isSelected && { backgroundColor: '#FFFFFF' }]} />
                ) : day.hasAppointments ? (
                  <View style={[styles.appointmentDot, isSelected && { backgroundColor: '#FFFFFF' }]} />
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content Area: If NO appointments booked on chosen date -> Show clean blank screen */}
      {selectedDayAppointments.length === 0 ? (
        <View style={[styles.blankScreenContainer, { backgroundColor: tc.background }]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1F2937' : '#EEF2FF' }]}>
            <AppIcon name="calendar-outline" size={40} color={isDark ? '#818CF8' : '#4F46E5'} />
          </View>
          <Text style={[styles.emptyHeadline, { color: tc.text }]}>
            No Appointments Scheduled
          </Text>
          <Text style={[styles.emptyDescription, { color: tc.textSecondary }]}>
            No patients have booked appointments for {formattedDisplayDate}.
            {'\n'}Any new bookings or walk-in OPD tokens registered at the reception desk will appear here automatically.
          </Text>

          {!isViewingToday && (
            <TouchableOpacity
              style={styles.jumpTodayBtn}
              onPress={() => {
                setSelectedDateStr(todayDateStr);
                const todayIdx = calendarDays.findIndex((d) => d.isToday);
                if (todayIdx !== -1) {
                  centerCalendarDay(todayIdx, true);
                }
                setTimeout(() => scrollToCenter(true), 150);
              }}
              activeOpacity={0.8}
            >
              <AppIcon name="time-outline" size={15} color="#FFFFFF" />
              <Text style={styles.jumpTodayBtnText}>Return to Today's Schedule</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* Daily Planner ScrollView with only the booked appointments */
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.plannerContent}
          showsVerticalScrollIndicator={false}
          onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          onMomentumScrollEnd={onMomentumScrollEnd}
        >
          {/* Planner Header Summary */}
          <View style={styles.plannerDateRow}>
            <Text style={[styles.plannerDateTitle, { color: tc.text }]}>
              {isViewingToday
                ? `Today's Schedule (${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`
                : `Schedule for ${formattedDisplayDate}`}
            </Text>
            <View style={styles.totalTokensPill}>
              <Text style={styles.totalTokensPillText}>
                {selectedDayAppointments.length} {selectedDayAppointments.length === 1 ? 'Token' : 'Tokens'} Booked
              </Text>
            </View>
          </View>

          {/* 1. Early Morning Out-of-Hours Marker (e.g. 1:45 AM before 08:00 AM) */}
          {isBeforeClinicHours && (
            <View style={styles.outOfHoursTopBlock}>
              {renderAppleCalendarRedPointer('OPD Opens 08:00 AM')}
            </View>
          )}

          {/* Timeline Slots */}
          {visibleTimeSlots.map((slot) => {
            const slotAppointments = getAppointmentsForSlot(slot.hour24);
            const isCurrentHourSlot = isViewingToday && slot.hour24 === activeMarkerHour;
            const isSlotFullyPassed = isViewingToday
              ? currentTotalMinutes >= (slot.hour24 + 1) * 60
              : selectedDateStr < todayDateStr;

            // Break Slot (1:00 PM)
            if (slot.isBreak) {
              const isBreakPassed = isViewingToday
                ? currentTotalMinutes >= 14 * 60
                : selectedDateStr < todayDateStr;

              return (
                <View
                  key={slot.time}
                  style={styles.timelineRow}
                  onLayout={(e) => {
                    slotYMap.current[slot.hour24] = e.nativeEvent.layout.y;
                  }}
                >
                  <View style={styles.timeLabelCol}>
                    <Text
                      style={[
                        styles.timeLabelText,
                        { color: isBreakPassed ? tc.textTertiary : tc.textSecondary },
                      ]}
                    >
                      {slot.time}
                    </Text>
                  </View>
                  <View style={styles.timelineConnectorCol}>
                    <View
                      style={[
                        styles.timelineNode,
                        { borderColor: isBreakPassed ? '#94A3B8' : '#F59E0B' },
                      ]}
                    />
                    <View style={[styles.timelineVerticalLine, { backgroundColor: tc.cardBorder }]} />
                  </View>
                  <View
                    style={[
                      styles.breakBlockCard,
                      {
                        backgroundColor: isDark ? '#2C2C2E' : '#FEF3C7',
                        opacity: isBreakPassed ? 0.52 : 1,
                      },
                    ]}
                  >
                    {isCurrentHourSlot && renderAppleCalendarRedPointer()}
                    <Text style={[styles.breakTitle, isBreakPassed && { color: tc.textTertiary }]}>
                      ☕ {slot.title}
                    </Text>
                    <Text style={[styles.breakSub, isBreakPassed && { color: tc.textTertiary }]}>
                      1:00 PM – 2:00 PM • {isBreakPassed ? 'Break Concluded' : 'OPD Closed for Walk-ins'}
                    </Text>
                  </View>
                </View>
              );
            }

            // Check if current appointment exists in this slot
            const currentAptIndex = slotAppointments.findIndex(
              (apt) => getAppointmentTimeState(apt) === 'current'
            );

            return (
              <View
                key={slot.time}
                style={styles.timelineRow}
                onLayout={(e) => {
                  slotYMap.current[slot.hour24] = e.nativeEvent.layout.y;
                }}
              >
                {/* Time Column */}
                <View style={styles.timeLabelCol}>
                  <Text
                    style={[
                      styles.timeLabelText,
                      {
                        color: isCurrentHourSlot
                          ? '#FF3B30'
                          : isSlotFullyPassed
                          ? tc.textTertiary
                          : tc.textSecondary,
                        fontWeight: isCurrentHourSlot ? '900' : '700',
                      },
                    ]}
                  >
                    {slot.time}
                  </Text>
                  {isCurrentHourSlot && (
                    <View style={styles.currentHourIndicator}>
                      <Text style={styles.currentHourIndicatorText}>ACTIVE</Text>
                    </View>
                  )}
                </View>

                {/* Timeline Connector Line & Node */}
                <View style={styles.timelineConnectorCol}>
                  <View
                    style={[
                      styles.timelineNode,
                      isCurrentHourSlot && styles.timelineNodeCurrentHour,
                      !isCurrentHourSlot && slotAppointments.length > 0 && !isSlotFullyPassed && styles.timelineNodeActive,
                      isSlotFullyPassed && styles.timelineNodePassed,
                    ]}
                  />
                  <View style={[styles.timelineVerticalLine, { backgroundColor: tc.cardBorder }]} />
                </View>

                {/* Appointment Content Column */}
                <View style={styles.slotContentCol}>
                  {/* If this is the current hour, and current time is BEFORE first appointment, render Apple Calendar red pointer here */}
                  {isCurrentHourSlot &&
                    slotAppointments.length > 0 &&
                    currentAptIndex === -1 &&
                    currentTotalMinutes < parseTimeToMinutes(slotAppointments[0]?.timeSlot) &&
                    renderAppleCalendarRedPointer()}

                  {slotAppointments.length > 0 ? (
                    slotAppointments.map((apt, aptIdx) => {
                      const timeState = getAppointmentTimeState(apt);
                      const isPast = timeState === 'past';
                      const isCurrent = timeState === 'current';
                      const statusBadge = getStatusBadge(apt.status, isPast, isCurrent);
                      const isInsideRoom = apt.status === 'in_consultation' || isCurrent;
                      const hasScans = apt.scannedReports && apt.scannedReports.length > 0;
                      const complaintSummary = summarizeText(apt.symptoms, 'Consult');

                      return (
                        <React.Fragment key={apt.id}>
                          {/* Apple Calendar Red Pointer: rendered right above the current patient card */}
                          {isCurrent && renderAppleCalendarRedPointer()}

                          {/* Patient Appointment Cardview: Current is highlighted in APP ACCENT GREEN */}
                          <AnimatedPressableCard
                            style={[
                              styles.appointmentPlannerCard,
                              {
                                backgroundColor: isCurrent
                                  ? (isDark ? '#064E3B20' : '#F0FDF4')
                                  : isPast
                                  ? (isDark ? '#141416' : '#F1F5F9')
                                  : tc.card,
                                borderColor: isCurrent
                                  ? colors.whatsapp.primary
                                  : isInsideRoom
                                  ? '#10B981'
                                  : isPast
                                  ? (isDark ? '#27272A' : '#CBD5E1')
                                  : tc.cardBorder,
                                opacity: isPast ? 0.52 : 1.0,
                              },
                              isCurrent && styles.appointmentCardDenotedCurrentGreen,
                              isInsideRoom && !isCurrent && styles.appointmentCardActiveRoom,
                            ]}
                            onPress={() => onSelectConsultation(apt)}
                          >
                            {/* Active Current Patient Denotation Banner in App Accent Green */}
                            {isCurrent && (
                              <View style={[styles.currentDenotedBannerGreen, { backgroundColor: isDark ? '#064E3B' : '#DCFCE7' }]}>
                                <PulsingStatusDot color={colors.whatsapp.primary} size={6} active={true} style={{ marginRight: 6 }} />
                                <Text style={[styles.currentDenotedTitleGreen, { color: isDark ? '#4ADE80' : '#15803D' }]}>
                                  CURRENT PATIENT • CONSULTATION IN PROGRESS ({formattedNowTime})
                                </Text>
                              </View>
                            )}

                            {/* Upper Content: 54px Avatar + Metadata */}
                            <View style={styles.aptMainContentRow}>
                              {/* 54px Profile Avatar with Token Badge */}
                              <View style={styles.avatarWrap}>
                                <View
                                  style={[
                                    styles.avatarCircle,
                                    {
                                      backgroundColor: isCurrent
                                        ? (isDark ? '#064E3B40' : '#DCFCE7')
                                        : isPast
                                        ? (isDark ? '#27272A' : '#E2E8F0')
                                        : (isDark ? '#2C2C2E' : '#EEF2FF'),
                                    },
                                    isCurrent && styles.avatarCircleCurrentGreen,
                                    isInsideRoom && !isCurrent && styles.avatarCircleActive,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.avatarText,
                                      {
                                        color: isCurrent
                                          ? (isDark ? '#4ADE80' : '#15803D')
                                          : isPast
                                          ? (isDark ? '#71717A' : '#94A3B8')
                                          : isInsideRoom
                                          ? '#10B981'
                                          : (isDark ? '#A5B4FC' : '#4338CA'),
                                      },
                                    ]}
                                  >
                                    {getInitials(apt.patientName)}
                                  </Text>
                                </View>
                                <View
                                  style={[
                                    styles.tokenBadge,
                                    isCurrent && styles.tokenBadgeCurrentGreen,
                                    isPast && styles.tokenBadgePassed,
                                    isInsideRoom && !isCurrent && styles.tokenBadgeActive,
                                  ]}
                                >
                                  <Text style={styles.tokenBadgeText}>#{apt.tokenNumber}</Text>
                                </View>
                              </View>

                              {/* Info Column */}
                              <View style={styles.contentCol}>
                                {/* Line 1: Patient Name + Time Slot */}
                                <View style={styles.lineOne}>
                                  <Text
                                    style={[
                                      styles.aptPatientName,
                                      {
                                        color: isCurrent
                                          ? (isDark ? '#4ADE80' : '#0F172A')
                                          : isPast
                                          ? (isDark ? '#A1A1AA' : '#64748B')
                                          : tc.text,
                                        fontWeight: isCurrent ? '900' : '800',
                                      },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {apt.patientName}
                                  </Text>
                                  <View
                                    style={[
                                      styles.timeSlotBadge,
                                      {
                                        backgroundColor: isCurrent
                                          ? (isDark ? '#064E3B' : '#DCFCE7')
                                          : isPast
                                          ? (isDark ? '#1F2937' : '#E2E8F0')
                                          : (isDark ? '#2C2C2E' : '#F1F5F9'),
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.timeText,
                                        {
                                          color: isCurrent
                                            ? (isDark ? '#86EFAC' : '#15803D')
                                            : isPast
                                            ? (isDark ? '#9CA3AF' : '#64748B')
                                            : tc.textSecondary,
                                          fontWeight: isCurrent ? '800' : '700',
                                        },
                                      ]}
                                    >
                                      {apt.timeSlot}
                                      {isPast ? ' (Passed)' : ''}
                                    </Text>
                                  </View>
                                </View>

                                {/* Line 2: Summarized Micro-Chips */}
                                <View style={styles.summaryChipsRow}>
                                  <View
                                    style={[
                                      styles.microChip,
                                      {
                                        backgroundColor: isCurrent
                                          ? (isDark ? '#064E3B30' : '#E8F5E9')
                                          : isPast
                                          ? (isDark ? '#18181B' : '#E2E8F0')
                                          : (isDark ? '#1F2937' : '#F8FAFC'),
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.microChipText,
                                        {
                                          color: isCurrent
                                            ? (isDark ? '#86EFAC' : '#166534')
                                            : isPast
                                            ? (isDark ? '#71717A' : '#94A3B8')
                                            : tc.textSecondary,
                                        },
                                      ]}
                                    >
                                      {apt.patientAge}y • {apt.patientGender}
                                    </Text>
                                  </View>

                                  <View
                                    style={[
                                      styles.microChip,
                                      {
                                        backgroundColor: isCurrent
                                          ? (isDark ? '#064E3B30' : '#E8F5E9')
                                          : isPast
                                          ? (isDark ? '#18181B' : '#E2E8F0')
                                          : (isDark ? '#1F2937' : '#F8FAFC'),
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.microChipText,
                                        {
                                          color: isCurrent
                                            ? (isDark ? '#86EFAC' : '#166534')
                                            : isPast
                                            ? (isDark ? '#71717A' : '#94A3B8')
                                            : tc.textSecondary,
                                        },
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {complaintSummary}
                                    </Text>
                                  </View>

                                  {hasScans && (
                                    <View
                                      style={[
                                        styles.scansIndicator,
                                        isPast && { backgroundColor: isDark ? '#27272A' : '#E2E8F0' },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.scansIndicatorText,
                                          isPast && { color: isDark ? '#71717A' : '#94A3B8' },
                                        ]}
                                      >
                                        🩻 {apt.scannedReports.length}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            </View>

                            {/* Bottom Row: Status Pill & Interactive CTAs */}
                            <View
                              style={[
                                styles.aptBottomActionRow,
                                {
                                  borderTopColor: isCurrent
                                    ? (isDark ? '#064E3B' : '#BBF7D0')
                                    : isPast
                                    ? (isDark ? '#27272A' : '#CBD5E1')
                                    : '#E2E8F0',
                                },
                              ]}
                            >
                              <View style={styles.statusPillCol}>
                                <View style={[styles.statusBadgePill, { backgroundColor: statusBadge.bg }]}>
                                  {isCurrent && (
                                    <PulsingStatusDot
                                      color="#10B981"
                                      size={6}
                                      active={true}
                                      style={{ marginRight: 4 }}
                                    />
                                  )}
                                  <Text style={[styles.statusBadgeText, { color: statusBadge.text }]}>
                                    {statusBadge.label}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.aptActionBtnGroup}>
                                <TouchableOpacity
                                  style={[
                                    styles.attendBtn,
                                    isPast && styles.pastAttendBtn,
                                    isCurrent && styles.currentAttendBtnGreen,
                                  ]}
                                  onPress={() => onSelectConsultation(apt)}
                                  activeOpacity={0.8}
                                >
                                  <AppIcon
                                    name="document-text-outline"
                                    size={13}
                                    color={isPast ? (isDark ? '#A1A1AA' : '#64748B') : '#FFFFFF'}
                                  />
                                  <Text
                                    style={[
                                      styles.attendBtnText,
                                      isPast && { color: isDark ? '#A1A1AA' : '#64748B' },
                                    ]}
                                  >
                                    {isPast ? 'Record' : isCurrent ? 'Resume ➔' : 'Attend ➔'}
                                  </Text>
                                </TouchableOpacity>

                                {!isPast && (
                                  <TouchableOpacity
                                    style={styles.callPatientBtn}
                                    onPress={() => handleDirectCall(apt.patientPhone, apt.patientName)}
                                    activeOpacity={0.7}
                                  >
                                    <AppIcon name="call" size={13} color="#FFFFFF" />
                                    <Text style={styles.callPatientBtnText}>Call</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          </AnimatedPressableCard>

                          {/* If current time is between this appointment and the next one in the current hour */}
                          {isCurrentHourSlot &&
                            currentAptIndex === -1 &&
                            currentTotalMinutes >= parseTimeToMinutes(apt.timeSlot) &&
                            (aptIdx === slotAppointments.length - 1 ||
                              currentTotalMinutes < parseTimeToMinutes(slotAppointments[aptIdx + 1]?.timeSlot)) &&
                            renderAppleCalendarRedPointer()}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    /* Slot with no appointments */
                    <View
                      style={[
                        styles.emptySlotCard,
                        {
                          borderColor: isDark ? '#2C2C2E' : '#E2E8F0',
                          opacity: isSlotFullyPassed ? 0.45 : 1,
                        },
                      ]}
                    >
                      {isCurrentHourSlot && renderAppleCalendarRedPointer()}
                      <Text
                        style={[
                          styles.emptySlotText,
                          { color: isSlotFullyPassed ? tc.textTertiary : tc.textSecondary },
                        ]}
                      >
                        {isSlotFullyPassed
                          ? 'Slot Ended • No patient scheduled'
                          : 'Available Slot • No patient scheduled'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* 3. Evening / Night Out-of-Hours Marker or Fallback (guaranteed exactly once) */}
          {(isAfterClinicHours || (!redPointerRendered && isViewingToday)) && (
            <View style={styles.outOfHoursBottomBlock}>
              {renderAppleCalendarRedPointer(isAfterClinicHours ? 'OPD Closed for Today' : undefined)}
            </View>
          )}
        </ScrollView>
      )}

      {/* Floating Pill: Center Live Marker on Screen (Only when viewing Today with appointments) */}
      {isViewingToday && selectedDayAppointments.length > 0 && (
        <TouchableOpacity
          style={styles.floatingCenterPill}
          onPress={() => scrollToCenter(true)}
          activeOpacity={0.85}
        >
          <View style={styles.floatingRedDot} />
          <Text style={styles.floatingCenterText}>
            Center Red Pointer ({appleTimeFormatted})
          </Text>
        </TouchableOpacity>
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
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 5,
  },
  timeModeBtnActive: {
    backgroundColor: '#FF3B30',
  },
  timeModeBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  todayButtonActive: {
    backgroundColor: colors.brand.primary,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  calendarStripWrapper: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  calendarStripScrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  dayPill: {
    width: 52,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  dayPillActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.brand.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayNumberText: {
    fontSize: 17,
    fontWeight: '800',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand.primary,
    marginTop: 4,
  },
  appointmentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
    marginTop: 4,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 4,
  },
  // Blank Screen Container when no appointments
  blankScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
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
    }),
  },
  emptyHeadline: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  jumpTodayBtn: {
    backgroundColor: colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 16,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: colors.brand.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  jumpTodayBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  // Planner Content
  plannerContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 140,
  },
  plannerDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  plannerDateTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  totalTokensPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalTokensPillText: {
    color: colors.brand.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeLabelCol: {
    width: 62,
    paddingTop: 2,
  },
  timeLabelText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  currentHourIndicator: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  currentHourIndicatorText: {
    color: '#FF3B30',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  timelineConnectorCol: {
    width: 18,
    alignItems: 'center',
    marginRight: 8,
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  timelineNodeActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary,
  },
  timelineNodeCurrentHour: {
    borderColor: '#FF3B30',
    backgroundColor: '#FF3B30',
    width: 12,
    height: 12,
    borderRadius: 6,
    transform: [{ scale: 1.15 }],
  },
  timelineNodePassed: {
    borderColor: '#CBD5E1',
    backgroundColor: '#E2E8F0',
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    marginTop: -2,
  },
  slotContentCol: {
    flex: 1,
    gap: 10,
  },
  breakBlockCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    justifyContent: 'center',
  },
  breakTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brand.primary,
  },
  breakSub: {
    fontSize: 10.5,
    color: '#B45309',
    marginTop: 2,
  },
  emptySlotCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: 11.5,
    fontStyle: 'italic',
  },

  // Apple Calendar style Red Time Pointer
  appleRedPointerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    zIndex: 20,
    width: '100%',
  },
  appleRedTimePill: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.35,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  appleRedTimeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  appleRedLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 1,
  },
  appleRedExtraBadge: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  appleRedExtraText: {
    color: '#DC2626',
    fontSize: 9.5,
    fontWeight: '700',
  },
  outOfHoursTopBlock: {
    marginBottom: 8,
    marginTop: 2,
  },
  outOfHoursBottomBlock: {
    marginTop: 12,
    marginBottom: 8,
  },

  // Appointment Card
  appointmentPlannerCard: {
    borderRadius: 16,
    padding: 12,
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
  appointmentCardActiveRoom: {
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  // Current patient cardview highlighted in APP ACCENT GREEN
  appointmentCardDenotedCurrentGreen: {
    borderColor: colors.whatsapp.primary,
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowColor: colors.whatsapp.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  currentDenotedBannerGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 8,
    marginBottom: 8,
  },
  currentDenotedTitleGreen: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    flex: 1,
  },
  aptMainContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  avatarCircleActive: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  avatarCircleCurrentGreen: {
    borderWidth: 2.5,
    borderColor: colors.whatsapp.primary,
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
  tokenBadgeActive: {
    backgroundColor: '#10B981',
  },
  tokenBadgeCurrentGreen: {
    backgroundColor: colors.whatsapp.primary,
  },
  tokenBadgePassed: {
    backgroundColor: '#64748B',
    borderColor: '#94A3B8',
  },
  tokenBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
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
    marginBottom: 4,
  },
  aptPatientName: {
    fontSize: 14.5,
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
  aptBottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  statusPillCol: {
    justifyContent: 'center',
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  aptActionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendBtn: {
    backgroundColor: colors.whatsapp.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    gap: 4,
  },
  currentAttendBtnGreen: {
    backgroundColor: colors.whatsapp.primary,
  },
  pastAttendBtn: {
    backgroundColor: '#E2E8F0',
  },
  attendBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  callPatientBtn: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    gap: 3,
  },
  callPatientBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  // Floating Center Pill
  floatingCenterPill: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  floatingRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  floatingCenterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
