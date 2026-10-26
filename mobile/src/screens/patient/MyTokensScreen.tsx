import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../theme/colors';
import { GlassView } from '../../components/common/GlassView';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';

interface MyTokensScreenProps {
  onViewReports: () => void;
  onBookNew: () => void;
}

export const MyTokensScreen: React.FC<MyTokensScreenProps> = ({
  onViewReports,
  onBookNew,
}) => {
  const { appointments, activeQueue } = useHospital();
  const { user, isDemo } = useAuth();

  // Find patient's appointment
  const targetName = user?.name || (isDemo ? 'Gowri T' : '');
  const myAppointment =
    appointments.find((a) => (user?.id && a.patientId === user.id) || (targetName && a.patientName === targetName)) ||
    (isDemo ? appointments.find((a) => a.patientName === 'Gowri T') || appointments[0] : undefined);

  if (!myAppointment) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Active Tokens</Text>
        <Text style={styles.emptySubtitle}>You do not have any appointments scheduled for today.</Text>
        <TouchableOpacity style={styles.bookNowBtn} onPress={onBookNew}>
          <Text style={styles.bookNowBtnText}>Book an Appointment Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCurrent = myAppointment.tokenNumber === activeQueue.currentToken;
  const tokensAhead = Math.max(0, myAppointment.tokenNumber - activeQueue.currentToken);
  const estimatedMins = isCurrent ? 0 : tokensAhead * 15;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* DIGITAL APPOINTMENT TOKEN PASS (iOS Liquid Glass Highlight) */}
      <GlassView intensity="highlight" style={styles.tokenCard}>
        {/* Hospital Branding Header */}
        <View style={styles.tokenHospitalHeader}>
          <View>
            <Text style={styles.tokenHospitalName}>{myAppointment.hospitalName}</Text>
            <Text style={styles.tokenDocSpec}>
              {myAppointment.doctorName} • {myAppointment.doctorSpecialty}
            </Text>
          </View>
          <View style={styles.roomTag}>
            <Text style={styles.roomTagText}>{myAppointment.roomNumber}</Text>
          </View>
        </View>

        {/* Big Bold Token Number */}
        <View style={styles.tokenCenterWrap}>
          <Text style={styles.tokenHeaderLabel}>YOUR QUEUE TOKEN</Text>
          <View style={styles.bigTokenCircle}>
            <Text style={styles.bigTokenNumber}>#{myAppointment.tokenNumber}</Text>
          </View>
          <Text style={styles.slotTimeText}>Scheduled: {myAppointment.timeSlot} Today</Text>
        </View>

        {/* Live Queue Progress Indicator */}
        <View style={styles.liveQueueProgressCard}>
          <View style={styles.progressRow}>
            <View style={styles.progressCol}>
              <Text style={styles.progressLabel}>NOW CALLING</Text>
              <Text style={styles.progressVal}>Token #{activeQueue.currentToken}</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressCol}>
              <Text style={styles.progressLabel}>PATIENTS AHEAD</Text>
              <Text style={[styles.progressVal, { color: tokensAhead === 0 ? '#10B981' : '#F59E0B' }]}>
                {tokensAhead === 0 ? 'Inside Room!' : `${tokensAhead} Patients`}
              </Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressCol}>
              <Text style={styles.progressLabel}>EST. WAIT</Text>
              <Text style={styles.progressVal}>
                {estimatedMins === 0 ? '0 mins' : `~${estimatedMins} mins`}
              </Text>
            </View>
          </View>

          {/* Status Message */}
          <View style={[styles.statusBanner, isCurrent ? styles.statusBannerActive : styles.statusBannerWaiting]}>
            <Text style={[styles.statusBannerText, isCurrent ? styles.statusTextActive : styles.statusTextWaiting]}>
              {isCurrent
                ? `🩺 Inside ${myAppointment.roomNumber} • In Consultation`
                : `⏳ Seated at ${myAppointment.roomNumber} • Token #${activeQueue.currentToken} in Cabin`}
            </Text>
          </View>
        </View>

        {/* Token Pass Details & Summary */}
        <View style={styles.ticketDetails}>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Patient</Text>
            <Text style={styles.ticketValue}>{myAppointment.patientName}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Payment</Text>
            <Text style={[styles.ticketValue, { color: '#075E54' }]}>
              ✓ ₹{myAppointment.paymentAmount} Paid
            </Text>
          </View>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Diagnostic Records</Text>
            <Text style={styles.ticketValue}>
              {myAppointment.scannedReports.length > 0 ? `${myAppointment.scannedReports.length} Scans Attached` : 'None'}
            </Text>
          </View>
        </View>

        {/* Quick View Reports Attached Button */}
        {myAppointment.scannedReports.length > 0 && (
          <TouchableOpacity
            style={styles.viewReportsBtn}
            onPress={onViewReports}
          >
            <Text style={styles.viewReportsBtnText}>
              🩻 View Scanned X-Ray & Blood Test ({myAppointment.scannedReports.length}) ➔
            </Text>
          </TouchableOpacity>
        )}
      </GlassView>

      {/* Helpful Hospital Directions & Notes */}
      <GlassView style={styles.infoCard}>
        <Text style={styles.infoTitle}>Waiting Room Navigation</Text>
        <Text style={styles.infoBody}>
          • {myAppointment.roomNumber} is located on the Ground Floor, Diagnostic Imaging Wing.{'\n'}
          • A large digital queue display monitor is positioned right outside the door.{'\n'}
          • Listen for the chime alert when your token is called.
        </Text>
      </GlassView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  bookNowBtn: {
    backgroundColor: colors.whatsapp.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  bookNowBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tokenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(18, 140, 126, 0.4)',
    marginBottom: 14,
  },
  tokenHospitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tokenHospitalName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  tokenDocSpec: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  roomTag: {
    backgroundColor: colors.whatsapp.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roomTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tokenCenterWrap: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  tokenHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  bigTokenCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(18, 140, 126, 0.12)',
    borderWidth: 3,
    borderColor: colors.whatsapp.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  bigTokenNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.whatsapp.primary,
  },
  slotTimeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  liveQueueProgressCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  progressCol: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  progressVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 2,
  },
  progressDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  statusBanner: {
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  statusBannerActive: {
    backgroundColor: '#DCF8C6',
  },
  statusBannerWaiting: {
    backgroundColor: '#FEF3C7',
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusTextActive: {
    color: '#075E54',
  },
  statusTextWaiting: {
    color: '#B45309',
  },
  ticketDetails: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 6,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  ticketValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  viewReportsBtn: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  viewReportsBtnText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});
