import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAppTheme } from '../../context/ThemeContext';
import { dataStore } from '../../services/dataStore';
import { AppIcon } from '../../components/common/AppIcon';
import { Appointment, AppointmentStatus, PaymentMethod } from '../../types';
import { PaymentCollectionModal } from './PaymentCollectionModal';

interface PatientDetailScreenProps {
  appointment: Appointment;
  onBack: () => void;
  onOpenScanner?: (appointmentId: string) => void;
  onOpenPayment?: (appointment: Appointment) => void;
}

export const PatientDetailScreen: React.FC<PatientDetailScreenProps> = ({
  appointment,
  onBack,
  onOpenScanner,
  onOpenPayment,
}) => {
  const { colors: tc, isDark } = useAppTheme();
  const [currentApt, setCurrentApt] = useState<Appointment>(appointment);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Payment Collection Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalMethod, setPaymentModalMethod] = useState<PaymentMethod>('gpay');

  // Retrieve complete historical visits for this patient
  const patientVisits = dataStore.getPatientVisits(currentApt.patientName);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleDirectCall = (phone: string, name: string) => {
    const cleanNumber = phone.replace(/[^\d+]/g, '');
    Alert.alert(
      `Call ${name}?`,
      `Dial ${phone} directly on device?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => {
            Linking.openURL(`tel:${cleanNumber}`).catch(() => {
              showToast(`Calling ${name} at ${phone}...`);
            });
          },
        },
      ]
    );
  };

  // Status state machine actions to control doctor queue & outside TV monitor
  const handleUpdateStatus = (newStatus: AppointmentStatus, label: string) => {
    const updated = dataStore.updateAppointmentStatus(currentApt.id, newStatus);
    if (updated) {
      setCurrentApt({ ...updated });
      if (newStatus === 'waiting') {
        showToast(`Token #${updated.tokenNumber} is marked Waiting in lobby`);
      } else if (newStatus === 'checked_in') {
        showToast(`Token #${updated.tokenNumber} checked in for ${updated.doctorName} (${updated.roomNumber})`);
      } else if (newStatus === 'completed') {
        showToast(`Token #${updated.tokenNumber} consultation completed & checked out ✓`);
      } else {
        showToast(`Status updated to ${label}`);
      }
    }
  };

  // Open interactive payment collection with selected method
  const openPayment = (method: PaymentMethod = 'gpay') => {
    setPaymentModalMethod(method);
    setIsPaymentModalOpen(true);
  };

  // WhatsApp Digital Receipt Sharing
  const handleShareReceiptWhatsApp = () => {
    const rNo = currentApt.receiptNumber || 'GPAY-RIO-982104';
    const methodStr = (currentApt.paymentMethod || 'gpay').toUpperCase();
    const amountVal = currentApt.paymentAmount;
    const msg = `*RIO SCAN CENTER DIGITAL RECEIPT*\n` +
      `--------------------------------\n` +
      `Receipt No: ${rNo}\n` +
      `Patient: ${currentApt.patientName}\n` +
      `Doctor: ${currentApt.doctorName} (${currentApt.roomNumber})\n` +
      `Token #${currentApt.tokenNumber}\n` +
      `Amount Paid: ₹${amountVal}.00\n` +
      `Payment Method: ${methodStr}\n` +
      `Status: CONFIRMED ✓\n` +
      `Date: ${new Date().toLocaleDateString()}\n` +
      `--------------------------------\n` +
      `Thank you for choosing Rio Scan Center, Tirunelveli!`;
    const cleanPhone = currentApt.patientPhone.replace(/[^\d+]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      showToast('Digital receipt formatted and ready to send!');
    });
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'in_consultation':
        return { label: 'Inside ' + (currentApt.roomNumber || 'Scan Room 1'), bg: '#DCFCE7', text: '#15803D' };
      case 'checked_in':
        return { label: 'Waiting in Lobby', bg: '#FEF3C7', text: '#B45309' };
      case 'completed':
        return { label: 'Consult Completed', bg: '#E0F2FE', text: '#0369A1' };
      case 'booked':
      default:
        return { label: 'Booked / Scheduled', bg: '#F1F5F9', text: '#475569' };
    }
  };

  const statusBadge = getStatusBadge(currentApt.status);

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

      {/* Top Header Row with Back Button */}
      <View style={[styles.headerRow, { backgroundColor: tc.headerBackground, borderBottomColor: tc.cardBorder }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <AppIcon name="arrow-back" size={18} color={tc.text} />
          <Text style={[styles.backBtnText, { color: tc.text }]}>Queue</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: tc.text }]} numberOfLines={1}>
            Patient Medical Record
          </Text>
          <Text style={[styles.headerSub, { color: tc.textSecondary }]}>
            Token #{currentApt.tokenNumber} • {currentApt.roomNumber}
          </Text>
        </View>

        {/* Direct Call Quick Action */}
        <TouchableOpacity
          style={styles.directCallHeaderBtn}
          onPress={() => handleDirectCall(currentApt.patientPhone, currentApt.patientName)}
          activeOpacity={0.7}
        >
          <AppIcon name="call" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================
            1. PATIENT DEMOGRAPHICS & CONTACT CARD
        ======================================================== */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          <View style={styles.patientProfileRow}>
            {/* Initials Avatar */}
            <View style={styles.patientAvatarWrap}>
              <View style={styles.patientAvatar}>
                <Text style={styles.patientAvatarText}>
                  {currentApt.patientName.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                </Text>
              </View>
              <View style={styles.bloodTag}>
                <Text style={styles.bloodTagText}>O+</Text>
              </View>
            </View>

            <View style={styles.patientMainInfo}>
              <View style={styles.patientTitleRow}>
                <Text style={[styles.patientNameText, { color: tc.text }]}>{currentApt.patientName}</Text>
                <View style={[styles.statusPill, { backgroundColor: statusBadge.bg }]}>
                  <Text style={[styles.statusPillText, { color: statusBadge.text }]}>
                    {statusBadge.label}
                  </Text>
                </View>
              </View>

              <Text style={[styles.patientMeta, { color: tc.textSecondary }]}>
                {currentApt.patientAge} Years • {currentApt.patientGender} • ID: {currentApt.patientId.substring(0, 14)}
              </Text>

              {/* Direct Clickable Phone Row with Telephone Handset Icon & Prominent Green Call Button */}
              <View style={styles.phoneActionRow}>
                <TouchableOpacity
                  style={styles.phoneClickableRow}
                  onPress={() => handleDirectCall(currentApt.patientPhone, currentApt.patientName)}
                  activeOpacity={0.7}
                >
                  <View style={styles.phoneIconCircle}>
                    <AppIcon name="call" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={styles.phoneNumberText}>{currentApt.patientPhone}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.greenCallButton}
                  onPress={() => handleDirectCall(currentApt.patientPhone, currentApt.patientName)}
                  activeOpacity={0.7}
                >
                  <AppIcon name="call" size={13} color="#FFFFFF" />
                  <Text style={styles.greenCallButtonText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Contact & Residential Details */}
          <View style={styles.metaDetailsGrid}>
            <View style={[styles.metaTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
              <Text style={styles.metaLabel}>RESIDENTIAL ADDRESS</Text>
              <Text style={[styles.metaValue, { color: tc.text }]}>
                Plot 18, Thiruvenkatanathapuram, Tirunelveli, Tamil Nadu 627006, India
              </Text>
            </View>

            <View style={[styles.metaTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
              <Text style={styles.metaLabel}>EMERGENCY CONTACT</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 5 }}
                onPress={() => handleDirectCall('+91 98401 22334', 'Thiyagarajan S (Son)')}
              >
                <AppIcon name="call" size={13} color={tc.primary} />
                <Text style={[styles.metaValue, { color: tc.primary, textDecorationLine: 'underline' }]}>
                  +91 98401 22334
                </Text>
                <Text style={[styles.metaValue, { color: tc.textSecondary }]}> (Son)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ========================================================
            2. UNCLUTTERED LIVE QUEUE CONTROLS (iOS SEGMENTED STEPPER)
        ======================================================== */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          <View style={styles.queueHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: tc.text }]}>Queue Status</Text>
              <Text style={[styles.sectionSub, { color: tc.textSecondary }]}>
                Token #{currentApt.tokenNumber} • {currentApt.roomNumber}
              </Text>
            </View>
            <View style={[styles.liveStatusBadge, { backgroundColor: statusBadge.bg }]}>
              <View style={[styles.livePulseDot, { backgroundColor: statusBadge.text }]} />
              <Text style={[styles.liveStatusBadgeText, { color: statusBadge.text }]}>
                {statusBadge.label}
              </Text>
            </View>
          </View>

          {/* Minimal 3-Stage iOS Stepper Slider without icons */}
          <View style={[styles.queueStepperTrack, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}>
            {/* Stage 1: Waiting */}
            <TouchableOpacity
              style={[
                styles.queueStepPill,
                (currentApt.status === 'waiting' || currentApt.status === 'booked') && [
                  styles.queueStepPillActive,
                  { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' },
                ],
              ]}
              onPress={() => handleUpdateStatus('waiting', 'Waiting in Lobby')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.queueStepText,
                  { color: isDark ? '#9CA3AF' : '#64748B' },
                  (currentApt.status === 'waiting' || currentApt.status === 'booked') && [
                    styles.queueStepTextActive,
                    { color: '#B45309' },
                  ],
                ]}
              >
                Waiting
              </Text>
            </TouchableOpacity>

            {/* Stage 2: Check-in */}
            <TouchableOpacity
              style={[
                styles.queueStepPill,
                (currentApt.status === 'checked_in' || currentApt.status === 'in_consultation') && [
                  styles.queueStepPillActive,
                  styles.queueStepPillTVActive,
                  { backgroundColor: isDark ? '#064E3B' : '#DCFCE7' },
                ],
              ]}
              onPress={() => handleUpdateStatus('checked_in', 'Checked In')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.queueStepText,
                  { color: isDark ? '#9CA3AF' : '#64748B' },
                  (currentApt.status === 'checked_in' || currentApt.status === 'in_consultation') && [
                    styles.queueStepTextActive,
                    { color: '#15803D' },
                  ],
                ]}
              >
                Check-in
              </Text>
            </TouchableOpacity>

            {/* Stage 3: Check-out */}
            <TouchableOpacity
              style={[
                styles.queueStepPill,
                currentApt.status === 'completed' && [
                  styles.queueStepPillActive,
                  { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' },
                ],
              ]}
              onPress={() => handleUpdateStatus('completed', 'Checked Out')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.queueStepText,
                  { color: isDark ? '#9CA3AF' : '#64748B' },
                  currentApt.status === 'completed' && [
                    styles.queueStepTextActive,
                    { color: '#0369A1' },
                  ],
                ]}
              >
                Check-out
              </Text>
            </TouchableOpacity>
          </View>

          {/* Minimal 1-Line Dynamic Microcopy Caption */}
          <View style={styles.queueFeedbackRow}>
            {currentApt.status === 'in_consultation' || currentApt.status === 'checked_in' ? (
              <Text style={styles.tvActiveCaption}>
                Checked in • Token #{currentApt.tokenNumber} in Room {currentApt.roomNumber} with {currentApt.doctorName}
              </Text>
            ) : currentApt.status === 'completed' ? (
              <Text style={[styles.queuePassiveCaption, { color: '#0369A1' }]}>
                Consultation completed • Patient checked out
              </Text>
            ) : (
              <Text style={[styles.queuePassiveCaption, { color: tc.textSecondary }]}>
                Patient is waiting in lobby • Next in queue for {currentApt.doctorName}
              </Text>
            )}
          </View>
        </View>

        {/* ========================================================
            3. PAYMENT COLLECTION SECTION (GPAY INTEGRATION & CONFIRMATION)
        ======================================================== */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          <View style={styles.payHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: tc.text }]}>Payment Collection</Text>
              <Text style={[styles.sectionSub, { color: tc.textSecondary }]}>
                Fee settlement & paperless invoice
              </Text>
            </View>
            <View
              style={[
                styles.payStatusBadge,
                { backgroundColor: currentApt.paymentStatus === 'paid' ? '#DCFCE7' : '#FEE2E2' },
              ]}
            >
              <Text
                style={[
                  styles.payStatusBadgeText,
                  { color: currentApt.paymentStatus === 'paid' ? '#15803D' : '#DC2626' },
                ]}
              >
                {currentApt.paymentStatus === 'paid' ? 'PAID ✓' : 'PAYMENT DUE'}
              </Text>
            </View>
          </View>

          {currentApt.paymentStatus === 'paid' ? (
            /* Paid Receipt State */
            <View style={[styles.paidReceiptBox, { backgroundColor: isDark ? '#1C1C1E' : '#F0FDF4', borderColor: isDark ? '#2C2C2E' : '#DCFCE7' }]}>
              <View style={styles.paidReceiptTop}>
                <View style={styles.paidCheckCircle}>
                  <AppIcon name="checkmark" size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paidReceiptTitle, { color: isDark ? '#FFFFFF' : '#15803D' }]}>
                    ${currentApt.paymentAmount}.00 Collected
                  </Text>
                  <Text style={styles.paidReceiptSubtitle}>
                    via {(currentApt.paymentMethod || 'gpay').toUpperCase()} • Receipt {currentApt.receiptNumber || 'GPAY-UP-982104'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.reShareReceiptBtn}
                onPress={() => handleShareReceiptWhatsApp()}
                activeOpacity={0.7}
              >
                <AppIcon name="checkmark" size={14} color="#15803D" />
                <Text style={styles.reShareReceiptBtnText}>Send Digital Receipt via WhatsApp</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Pending Payment Collection with GPay Integration */
            <View style={styles.unpaidCollectionWrap}>
              {/* Itemized breakdown */}
              <View style={[styles.payBreakdownCard, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC' }]}>
                <View style={styles.payBreakdownRow}>
                  <Text style={[styles.payBreakdownLabel, { color: tc.textSecondary }]}>Doctor Consultation ({currentApt.doctorName})</Text>
                  <Text style={[styles.payBreakdownVal, { color: tc.text }]}>₹{currentApt.paymentAmount}.00</Text>
                </View>
                <View style={styles.payBreakdownRow}>
                  <Text style={[styles.payBreakdownLabel, { color: tc.textSecondary }]}>Clinic Registration & Digital Scans</Text>
                  <Text style={[styles.payBreakdownVal, { color: '#16A34A' }]}>FREE (₹0.00)</Text>
                </View>
                <View style={styles.payBreakdownDivider} />
                <View style={styles.payBreakdownTotalRow}>
                  <Text style={[styles.payTotalLabel, { color: tc.text }]}>Total Amount Payable:</Text>
                  <Text style={[styles.payTotalAmount, { color: tc.primary }]}>₹{currentApt.paymentAmount}.00</Text>
                </View>
              </View>

              {/* Primary Google Pay (GPay) Button - displays QR code when clicked */}
              <TouchableOpacity
                style={styles.gpayMainBtn}
                onPress={() => openPayment('gpay')}
                activeOpacity={0.85}
              >
                <View style={styles.gpayLogoCapsule}>
                  <Text style={styles.gpayLetterG}>G</Text>
                  <Text style={styles.gpayLetterPay}>Pay</Text>
                </View>
                <Text style={styles.gpayMainBtnText}>
                  Collect with Google Pay (${currentApt.paymentAmount}.00)
                </Text>
              </TouchableOpacity>

              {/* Secondary Alternate Payment Method Pills */}
              <View style={styles.altPaymentRow}>
                <TouchableOpacity
                  style={[styles.altPayChip, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}
                  onPress={() => openPayment('cash')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.altPayChipIcon}>💵</Text>
                  <Text style={[styles.altPayChipText, { color: tc.text }]}>Cash</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.altPayChip, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}
                  onPress={() => openPayment('upi')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.altPayChipIcon}>📱</Text>
                  <Text style={[styles.altPayChipText, { color: tc.text }]}>UPI QR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.altPayChip, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}
                  onPress={() => openPayment('card')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.altPayChipIcon}>💳</Text>
                  <Text style={[styles.altPayChipText, { color: tc.text }]}>Card / POS</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ========================================================
            3. COMPLETE VISIT HISTORY (ALL VISITS DATE-WISE)
        ======================================================== */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          <View style={styles.cardSectionHeader}>
            <View style={styles.headerIconWrap}>
              <AppIcon name="folder-outline" size={17} color={colors.whatsapp.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: tc.text }]}>
                Complete Visit History ({patientVisits.length} Visits Logged)
              </Text>
              <Text style={[styles.sectionSub, { color: tc.textSecondary }]}>
                Date-wise medical consultations, clinical diagnosis & itemized billing
              </Text>
            </View>
          </View>

          {/* Visits Timeline */}
          <View style={styles.visitsTimeline}>
            {patientVisits.map((visit, index) => {
              const isToday = index === 0;
              const hasScans = visit.scannedReports && visit.scannedReports.length > 0;
              const hasPrescription = visit.prescription && visit.prescription.medicines.length > 0;

              return (
                <View key={visit.id} style={styles.visitTimelineItem}>
                  {/* Timeline Left Dot & Connector */}
                  <View style={styles.timelineLeftTrack}>
                    <View style={[styles.timelineDot, isToday && styles.timelineDotToday]} />
                    {index < patientVisits.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  {/* Visit Card Box */}
                  <View style={[styles.visitBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                    {/* Header Row: Date & Token Badge */}
                    <View style={styles.visitBoxHeader}>
                      <View style={styles.visitHeaderLeft}>
                        <Text style={[styles.visitDateText, { color: tc.text }]}>
                          {isToday ? `Today (${visit.appointmentDate})` : visit.appointmentDate}
                        </Text>
                        <Text style={[styles.visitDoctorText, { color: tc.textSecondary }]}>
                          {visit.doctorName} • {visit.doctorSpecialty} ({visit.roomNumber})
                        </Text>
                      </View>
                      <View style={styles.tokenPill}>
                        <Text style={styles.tokenPillText}>Token #{visit.tokenNumber}</Text>
                      </View>
                    </View>

                    {/* Symptoms / Chief Complaints */}
                    <View style={styles.visitSectionItem}>
                      <Text style={styles.visitItemLabel}>SYMPTOMS & COMPLAINT</Text>
                      <Text style={[styles.visitItemVal, { color: tc.text }]}>{visit.symptoms}</Text>
                    </View>

                    {/* Prescription Details (if present) */}
                    {hasPrescription && (
                      <View style={styles.visitSectionItem}>
                        <Text style={styles.visitItemLabel}>DIAGNOSIS & PRESCRIPTION</Text>
                        <Text style={[styles.visitItemVal, { color: tc.text, fontWeight: '700' }]}>
                          {visit.prescription?.diagnosis}
                        </Text>
                        <View style={styles.medicineChipList}>
                          {visit.prescription?.medicines.map((m) => (
                            <View key={m.id} style={styles.medicineChip}>
                              <Text style={styles.medicineChipText}>
                                💊 {m.name} ({m.dosage}) • {m.frequency}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Scanned Diagnostic Reports (X-Rays & Blood Tests) */}
                    {hasScans && (
                      <View style={styles.visitSectionItem}>
                        <Text style={styles.visitItemLabel}>ATTACHED SCANNED REPORTS</Text>
                        <View style={styles.reportsThumbList}>
                          {visit.scannedReports.map((report) => (
                            <View key={report.id} style={styles.reportThumbCard}>
                              <Image source={{ uri: report.fileUri }} style={styles.reportThumbImg} />
                              <View style={styles.reportThumbInfo}>
                                <Text style={styles.reportThumbTitle} numberOfLines={1}>
                                  {report.title}
                                </Text>
                                <Text style={styles.reportThumbMeta}>
                                  {report.filterApplied === 'xray_contrast' ? '🩻 High-Res Radiography' : '📄 Pathology B&W'}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Itemized Payment Details for this visit */}
                    <View style={styles.paymentDetailStrip}>
                      <View style={styles.payStripLeft}>
                        <AppIcon name="card-outline" size={15} color="#047857" />
                        <Text style={styles.payStripTitle}>
                          Paid ${visit.paymentAmount}.00 ({visit.paymentMethod ? visit.paymentMethod.toUpperCase() : 'CASH'})
                        </Text>
                      </View>
                      <Text style={styles.receiptTag}>{visit.receiptNumber || 'RCP-UP-2026'}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Action: Attach New Scans for this Patient */}
        <TouchableOpacity
          style={styles.attachScanActionBtn}
          onPress={() => onOpenScanner && onOpenScanner(currentApt.id)}
          activeOpacity={0.8}
        >
          <AppIcon name="camera-outline" size={18} color="#FFFFFF" />
          <Text style={styles.attachScanActionText}>Scan & Attach Physical Lab Report / X-Ray</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ========================================================
          4. INTERACTIVE PAYMENT COLLECTION MODAL (GPAY QR / UPI / CARD / CASH)
      ======================================================== */}
      <PaymentCollectionModal
        visible={isPaymentModalOpen}
        appointment={currentApt}
        initialMethod={paymentModalMethod}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={(updated) => {
          setCurrentApt(updated);
          showToast(`Payment of $${updated.paymentAmount}.00 recorded via ${(updated.paymentMethod || 'gpay').toUpperCase()} ✓`);
        }}
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
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  directCallHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 130, // Space above bottom bar
    gap: 14,
  },
  card: {
    borderRadius: 18,
    padding: 16,
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

  // 1. Patient Profile Info
  patientProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  patientAvatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  patientAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  bloodTag: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bloodTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  patientMainInfo: {
    flex: 1,
  },
  patientTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patientNameText: {
    fontSize: 17,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  patientMeta: {
    fontSize: 11.5,
    marginTop: 2,
  },
  phoneActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  phoneClickableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  greenCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 5,
  },
  greenCallButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  metaDetailsGrid: {
    gap: 8,
  },
  metaTile: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
  },
  metaLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(18, 140, 126, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 1,
  },

  // 2. Uncluttered Queue Stepper
  queueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    gap: 5,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveStatusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  queueStepperTrack: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    gap: 3,
  },
  queueStepPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueStepPillActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  queueStepPillTVActive: {
    borderWidth: 1,
    borderColor: '#15803D',
  },
  queueStepText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  queueStepTextActive: {
    fontWeight: '800',
  },
  queueFeedbackRow: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  tvActiveCaption: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
  },
  queuePassiveCaption: {
    fontSize: 11.5,
    fontWeight: '500',
  },

  // 3. Payment Collection Section & GPay Button
  payHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  payStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  payStatusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  paidReceiptBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  paidReceiptTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paidCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidReceiptTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  paidReceiptSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  reShareReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  reShareReceiptBtnText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  unpaidCollectionWrap: {
    gap: 10,
  },
  payBreakdownCard: {
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  payBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payBreakdownLabel: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  payBreakdownVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  payBreakdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  payBreakdownTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payTotalLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  payTotalAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  gpayMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  gpayLogoCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 1,
  },
  gpayLetterG: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4285F4',
  },
  gpayLetterPay: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3C4043',
  },
  gpayMainBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  altPaymentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  altPayChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  altPayChipIcon: {
    fontSize: 13,
  },
  altPayChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  // 4. GPay Sheet Modal
  gpayModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  gpaySheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    gap: 12,
  },
  sheetDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 6,
  },
  gpaySheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gpayBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpayCapsuleSm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  gpayLetterGSm: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4285F4',
  },
  gpayLetterPaySm: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3C4043',
  },
  verifiedBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0284C7',
  },
  sheetCloseIconBtn: {
    padding: 6,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  merchantLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(18, 140, 126, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantLogoText: {
    fontSize: 18,
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '700',
  },
  merchantSub: {
    fontSize: 11,
    marginTop: 1,
  },
  gpayAmountBox: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  gpayAmountLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  gpayAmountValue: {
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 2,
  },
  gpayTokenSub: {
    fontSize: 11,
    color: '#64748B',
  },
  gpayAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  gpayBankIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpayAccountTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  gpayAccountSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  activeCheckPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeCheckPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
  },
  gpaySecurityRow: {
    alignItems: 'center',
  },
  gpaySecurityText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  gpayAuthorizeBtn: {
    backgroundColor: '#000000',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpayBtnDisabled: {
    opacity: 0.7,
  },
  gpayProcessingText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  gpayCapsuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 1,
  },
  gpayLetterGBtn: {
    fontSize: 12,
    fontWeight: '900',
    color: '#4285F4',
  },
  gpayLetterPayBtn: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3C4043',
  },
  gpayAuthorizeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // 5. Payment Confirmation Modal
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successCheckCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  confirmSubtitle: {
    fontSize: 11.5,
    color: '#16A34A',
    fontWeight: '700',
    marginTop: 2,
  },
  confirmAmount: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 12,
  },
  confirmDetailsBox: {
    width: '100%',
    borderRadius: 12,
    padding: 12,
    gap: 7,
    marginBottom: 14,
  },
  confirmDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmDetailLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  confirmDetailVal: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  confirmActionsGroup: {
    width: '100%',
    gap: 8,
  },
  shareWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  shareWhatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  confirmDoneBtn: {
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmDoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // 3. Visits Timeline
  visitsTimeline: {
    marginTop: 6,
  },
  visitTimelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeftTrack: {
    width: 22,
    alignItems: 'center',
    marginRight: 10,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#CBD5E1',
    marginTop: 4,
  },
  timelineDotToday: {
    backgroundColor: colors.whatsapp.primary,
    borderWidth: 2,
    borderColor: '#DCF8C6',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  visitBox: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  visitBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  visitHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  visitDateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  visitDoctorText: {
    fontSize: 11,
    marginTop: 1,
  },
  tokenPill: {
    backgroundColor: 'rgba(18, 140, 126, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  tokenPillText: {
    color: colors.whatsapp.primaryDark,
    fontSize: 10.5,
    fontWeight: '800',
  },
  visitSectionItem: {
    marginTop: 6,
  },
  visitItemLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  visitItemVal: {
    fontSize: 12,
    lineHeight: 16,
  },
  medicineChipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  medicineChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  medicineChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  reportsThumbList: {
    gap: 6,
    marginTop: 4,
  },
  reportThumbCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportThumbImg: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#000',
    marginRight: 8,
  },
  reportThumbInfo: {
    flex: 1,
  },
  reportThumbTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  reportThumbMeta: {
    fontSize: 10,
    color: '#64748B',
  },
  paymentDetailStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  payStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payStripTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#166534',
  },
  receiptTag: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '600',
  },
  attachScanActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.whatsapp.primary,
    borderRadius: 14,
    paddingVertical: 13,
    gap: 8,
  },
  attachScanActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
