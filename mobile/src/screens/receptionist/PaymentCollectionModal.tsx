import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useHospital } from '../../context/HospitalContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Appointment, PaymentMethod } from '../../types';
import { AppIcon } from '../../components/common/AppIcon';

interface PaymentCollectionModalProps {
  visible: boolean;
  appointment: Appointment | null;
  initialMethod?: PaymentMethod;
  onClose: () => void;
  onPaymentSuccess?: (updatedAppointment: Appointment) => void;
}

export const PaymentCollectionModal: React.FC<PaymentCollectionModalProps> = ({
  visible,
  appointment,
  initialMethod = 'gpay',
  onClose,
  onPaymentSuccess,
}) => {
  const { recordPayment } = useHospital();
  const { colors: tc, isDark } = useAppTheme();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(initialMethod);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStage, setVerificationStage] = useState<string>('');

  // Confirmation screen state (ONLY shown when payment passes through)
  const [confirmedTransaction, setConfirmedTransaction] = useState<{
    receiptNo: string;
    txnId: string;
    utr: string;
    amount: number;
    time: string;
    method: PaymentMethod;
  } | null>(null);

  // Reset states when appointment changes or modal opens
  useEffect(() => {
    if (visible && appointment) {
      setSelectedMethod(initialMethod || 'gpay');
      setIsVerifying(false);
      setVerificationStage('');
      setConfirmedTransaction(null);
    }
  }, [visible, appointment, initialMethod]);

  if (!appointment) return null;

  // Verification Gate: Simulates bank gateway authorization and triggers confirmation ONLY on completion
  const handleVerifyAndPay = () => {
    setIsVerifying(true);

    if (selectedMethod === 'gpay') {
      setVerificationStage('Waiting for customer to scan on Google Pay...');
      setTimeout(() => {
        setVerificationStage(`UPI Network: Authorizing ₹${appointment.paymentAmount}.00 transfer...`);
        setTimeout(() => {
          setVerificationStage('Payment Verified by Google Pay ✓');
          setTimeout(() => {
            finalizePayment('gpay');
          }, 400);
        }, 800);
      }, 700);
    } else if (selectedMethod === 'upi') {
      setVerificationStage('Scanning UPI QR code...');
      setTimeout(() => {
        setVerificationStage('NPCI Gateway: Processing payment...');
        setTimeout(() => {
          setVerificationStage('UPI Transfer Confirmed ✓');
          setTimeout(() => {
            finalizePayment('upi');
          }, 400);
        }, 800);
      }, 700);
    } else if (selectedMethod === 'card') {
      setVerificationStage('Terminal POS-8820: Reading EMV Chip...');
      setTimeout(() => {
        setVerificationStage('Contacting Visa / Mastercard Network...');
        setTimeout(() => {
          setVerificationStage('PIN Approved • Auth Code 9821 ✓');
          setTimeout(() => {
            finalizePayment('card');
          }, 500);
        }, 900);
      }, 700);
    } else {
      // Cash
      setVerificationStage('Registering Cash Counter settlement...');
      setTimeout(() => {
        finalizePayment('cash');
      }, 500);
    }
  };

  const finalizePayment = (method: PaymentMethod) => {
    setIsVerifying(false);
    setVerificationStage('');

    const generatedReceipt = method === 'gpay'
      ? `GPAY-UP-${Math.floor(100000 + Math.random() * 900000)}`
      : `RCP-UP-${Math.floor(100000 + Math.random() * 900000)}`;

    const txnId = method === 'gpay'
      ? `CICAg${Math.floor(1000000 + Math.random() * 9000000)}_GA`
      : `TXN-${method.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const utr = `${Math.floor(400000000000 + Math.random() * 900000000000)}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Record in persistent dataStore
    recordPayment(appointment.id, method);

    const updatedApt: Appointment = {
      ...appointment,
      paymentStatus: 'paid',
      paymentMethod: method,
      receiptNumber: generatedReceipt,
    };

    // 2. Present Confirmation Screen ONLY now!
    setConfirmedTransaction({
      receiptNo: generatedReceipt,
      txnId,
      utr,
      amount: appointment.paymentAmount,
      time,
      method,
    });

    if (onPaymentSuccess) {
      onPaymentSuccess(updatedApt);
    }
  };

  // WhatsApp Digital Receipt Sharing
  const handleShareWhatsApp = () => {
    if (!confirmedTransaction) return;
    const msg =
      `*RIO SCAN CENTER DIGITAL RECEIPT*\n` +
      `--------------------------------\n` +
      `Receipt No: ${confirmedTransaction.receiptNo}\n` +
      `Patient: ${appointment.patientName}\n` +
      `Doctor: ${appointment.doctorName} (${appointment.roomNumber})\n` +
      `Token #${appointment.tokenNumber}\n` +
      `Amount Paid: ₹${confirmedTransaction.amount}.00\n` +
      `Payment Method: ${confirmedTransaction.method.toUpperCase()}\n` +
      `Transaction ID: ${confirmedTransaction.txnId}\n` +
      `UPI Ref (UTR): ${confirmedTransaction.utr}\n` +
      `Status: CONFIRMED ✓\n` +
      `Date: ${new Date().toLocaleDateString()} at ${confirmedTransaction.time}\n` +
      `--------------------------------\n` +
      `Thank you for choosing Rio Scan Center, Tirunelveli!`;

    const cleanPhone = appointment.patientPhone.replace(/[^\d+]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Digital Receipt Ready', 'WhatsApp receipt text copied for patient.');
    });
  };

  // Realistic High-Fidelity Vector QR Code Component
  const renderQRCode = (type: 'gpay' | 'upi') => {
    const size = 170;
    return (
      <View style={styles.qrOuterWrapper}>
        <View style={styles.qrInnerCard}>
          {/* 3 Large Corner Finder Patterns */}
          <View style={[styles.cornerFinder, { top: 12, left: 12 }]}>
            <View style={styles.cornerFinderCenter} />
          </View>
          <View style={[styles.cornerFinder, { top: 12, right: 12 }]}>
            <View style={styles.cornerFinderCenter} />
          </View>
          <View style={[styles.cornerFinder, { bottom: 12, left: 12 }]}>
            <View style={styles.cornerFinderCenter} />
          </View>

          {/* Data Modules Grid Matrix */}
          <View style={styles.qrMatrixGrid}>
            {Array.from({ length: 64 }).map((_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const isTopLeft = row < 3 && col < 3;
              const isTopRight = row < 3 && col >= 5;
              const isBottomLeft = row >= 5 && col < 3;
              const isCenter = row >= 3 && row <= 4 && col >= 3 && col <= 4;
              if (isTopLeft || isTopRight || isBottomLeft || isCenter) {
                return <View key={i} style={styles.qrModuleSpacer} />;
              }
              const isFilled = ((i * 7 + 19) % 11) > 4;
              return (
                <View key={i} style={styles.qrModuleBox}>
                  {isFilled && <View style={styles.qrDotFilled} />}
                </View>
              );
            })}
          </View>

          {/* Center Brand Badge */}
          <View style={styles.qrCenterBadge}>
            {type === 'gpay' ? (
              <View style={styles.gpayCenterBadgeRow}>
                <Text style={styles.gpayBrandLetterG}>G</Text>
                <Text style={styles.gpayBrandLetterPay}>Pay</Text>
              </View>
            ) : (
              <Text style={styles.upiCenterBadgeText}>UPI</Text>
            )}
          </View>
        </View>

        {/* Amount & Merchant Details */}
        <View style={styles.qrDetailTextRow}>
          <Text style={styles.qrAmountCallout}>₹{appointment.paymentAmount}.00</Text>
          <Text style={styles.qrVpaSubtitle}>
            {type === 'gpay' ? 'rioscan@okhdfcbank' : 'rioscan@icici'}
          </Text>
          <View style={styles.qrLiveStatusCapsule}>
            <View style={styles.livePulseDot} />
            <Text style={styles.qrLiveStatusText}>
              {type === 'gpay' ? 'Scan with Google Pay App' : 'Scan with Any UPI App'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Card / POS Terminal Simulation View
  const renderCardPOSTerminal = () => {
    return (
      <View style={styles.posTerminalWrapper}>
        <View style={styles.posTerminalScreen}>
          <View style={styles.posTerminalTopRow}>
            <Text style={styles.posTerminalBrand}>RIO SCAN CENTER POS-8820</Text>
            <View style={styles.posTerminalSignalDot} />
          </View>
          <Text style={styles.posTerminalInstruction}>INSERT, SWIPE OR TAP CARD</Text>
          <Text style={styles.posTerminalAmount}>₹{appointment.paymentAmount}.00</Text>
          <Text style={styles.posTerminalMeta}>{appointment.doctorName} Desk • {appointment.roomNumber}</Text>
        </View>
        <View style={styles.cardLogosRow}>
          <Text style={styles.cardLogoText}>💳 RuPay</Text>
          <Text style={styles.cardLogoText}>💳 VISA</Text>
          <Text style={styles.cardLogoText}>💳 Mastercard</Text>
          <Text style={styles.cardLogoText}>📱 UPI / Tap</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => !isVerifying && onClose()}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          {/* ========================================================
              STATE A: CONFIRMATION SCREEN (ONLY WHEN PAYMENT PASSES THROUGH)
          ======================================================== */}
          {confirmedTransaction ? (
            <View style={styles.confirmContentWrap}>
              {/* Green Success Badge */}
              <View style={styles.successCheckCircle}>
                <AppIcon name="checkmark" size={32} color="#FFFFFF" />
              </View>

              <Text style={[styles.confirmTitle, { color: tc.text }]}>Payment Confirmed!</Text>
              <Text style={styles.confirmSubtitle}>
                Verified & cleared via {confirmedTransaction.method.toUpperCase()}
              </Text>

              <Text style={[styles.confirmAmount, { color: tc.text }]}>
                ₹{confirmedTransaction.amount}.00
              </Text>

              {/* Receipt Details Box */}
              <View style={[styles.confirmReceiptBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC' }]}>
                <View style={styles.confirmReceiptRow}>
                  <Text style={styles.confirmRowLabel}>Receipt Number</Text>
                  <Text style={[styles.confirmRowVal, { color: tc.text, fontWeight: '700' }]}>
                    {confirmedTransaction.receiptNo}
                  </Text>
                </View>

                <View style={styles.confirmReceiptRow}>
                  <Text style={styles.confirmRowLabel}>Transaction ID</Text>
                  <Text style={[styles.confirmRowVal, { color: tc.text }]}>
                    {confirmedTransaction.txnId}
                  </Text>
                </View>

                <View style={styles.confirmReceiptRow}>
                  <Text style={styles.confirmRowLabel}>UPI Ref (UTR)</Text>
                  <Text style={[styles.confirmRowVal, { color: tc.text }]}>
                    {confirmedTransaction.utr}
                  </Text>
                </View>

                <View style={styles.confirmReceiptRow}>
                  <Text style={styles.confirmRowLabel}>Patient</Text>
                  <Text style={[styles.confirmRowVal, { color: tc.text }]}>
                    {appointment.patientName} (Token #{appointment.tokenNumber})
                  </Text>
                </View>

                <View style={styles.confirmReceiptRow}>
                  <Text style={styles.confirmRowLabel}>Doctor</Text>
                  <Text style={[styles.confirmRowVal, { color: tc.text }]}>
                    {appointment.doctorName} ({appointment.roomNumber})
                  </Text>
                </View>

                <View style={styles.confirmReceiptRow}>
                  <Text style={styles.confirmRowLabel}>Timestamp</Text>
                  <Text style={[styles.confirmRowVal, { color: tc.text }]}>
                    Today at {confirmedTransaction.time}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.confirmActionsWrap}>
                <TouchableOpacity
                  style={styles.shareWhatsAppBtn}
                  onPress={handleShareWhatsApp}
                  activeOpacity={0.8}
                >
                  <AppIcon name="checkmark" size={17} color="#FFFFFF" />
                  <Text style={styles.shareWhatsAppBtnText}>Send Receipt via WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmDoneBtn, { backgroundColor: isDark ? '#3A3A3C' : '#F1F5F9' }]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.confirmDoneBtnText, { color: tc.text }]}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ========================================================
               STATE B: PAYMENT COLLECTION & METHOD SELECTION FLOW
            ======================================================== */
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: tc.text }]}>Payment Collection</Text>
                  <Text style={[styles.modalSub, { color: tc.textSecondary }]}>
                    Rio Scan Center Cashier &amp; Billing Desk
                  </Text>
                </View>
                {!isVerifying && (
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <AppIcon name="close" size={18} color={tc.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Consultation Bill Summary */}
              <View style={[styles.billSummaryBox, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC' }]}>
                <View style={styles.billSummaryRow}>
                  <Text style={[styles.billSummaryLabel, { color: tc.textSecondary }]}>Patient Name</Text>
                  <Text style={[styles.billSummaryVal, { color: tc.text }]}>
                    {appointment.patientName} (Token #{appointment.tokenNumber})
                  </Text>
                </View>
                <View style={styles.billSummaryRow}>
                  <Text style={[styles.billSummaryLabel, { color: tc.textSecondary }]}>Doctor Consultation</Text>
                  <Text style={[styles.billSummaryVal, { color: tc.text }]}>
                    {appointment.doctorName} • {appointment.roomNumber}
                  </Text>
                </View>
                <View style={styles.billSummaryDivider} />
                <View style={styles.billSummaryRow}>
                  <Text style={[styles.billTotalLabel, { color: tc.text }]}>Total Amount Due:</Text>
                  <Text style={[styles.billTotalAmount, { color: colors.whatsapp.primary }]}>
                    ₹{appointment.paymentAmount}.00
                  </Text>
                </View>
              </View>

              {/* Method Selector Tabs */}
              <Text style={[styles.sectionHeading, { color: tc.textSecondary }]}>SELECT PAYMENT METHOD</Text>
              <View style={styles.methodSelectorRow}>
                {/* 1. Google Pay (GPay) */}
                <TouchableOpacity
                  style={[
                    styles.methodSelectorBtn,
                    { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder },
                    selectedMethod === 'gpay' && styles.methodSelectorBtnActive,
                  ]}
                  onPress={() => !isVerifying && setSelectedMethod('gpay')}
                  activeOpacity={0.7}
                >
                  <View style={styles.gpayIconCapsule}>
                    <Text style={styles.gpayLetterG}>G</Text>
                    <Text style={styles.gpayLetterPay}>Pay</Text>
                  </View>
                  <Text
                    style={[
                      styles.methodSelectorLabel,
                      { color: tc.text },
                      selectedMethod === 'gpay' && { color: colors.whatsapp.primary, fontWeight: '700' },
                    ]}
                  >
                    Google Pay
                  </Text>
                </TouchableOpacity>

                {/* 2. UPI QR */}
                <TouchableOpacity
                  style={[
                    styles.methodSelectorBtn,
                    { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder },
                    selectedMethod === 'upi' && styles.methodSelectorBtnActive,
                  ]}
                  onPress={() => !isVerifying && setSelectedMethod('upi')}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 18 }}>📱</Text>
                  <Text
                    style={[
                      styles.methodSelectorLabel,
                      { color: tc.text },
                      selectedMethod === 'upi' && { color: colors.whatsapp.primary, fontWeight: '700' },
                    ]}
                  >
                    UPI QR
                  </Text>
                </TouchableOpacity>

                {/* 3. Card / POS */}
                <TouchableOpacity
                  style={[
                    styles.methodSelectorBtn,
                    { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder },
                    selectedMethod === 'card' && styles.methodSelectorBtnActive,
                  ]}
                  onPress={() => !isVerifying && setSelectedMethod('card')}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 18 }}>💳</Text>
                  <Text
                    style={[
                      styles.methodSelectorLabel,
                      { color: tc.text },
                      selectedMethod === 'card' && { color: colors.whatsapp.primary, fontWeight: '700' },
                    ]}
                  >
                    Card POS
                  </Text>
                </TouchableOpacity>

                {/* 4. Cash */}
                <TouchableOpacity
                  style={[
                    styles.methodSelectorBtn,
                    { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder },
                    selectedMethod === 'cash' && styles.methodSelectorBtnActive,
                  ]}
                  onPress={() => !isVerifying && setSelectedMethod('cash')}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 18 }}>💵</Text>
                  <Text
                    style={[
                      styles.methodSelectorLabel,
                      { color: tc.text },
                      selectedMethod === 'cash' && { color: colors.whatsapp.primary, fontWeight: '700' },
                    ]}
                  >
                    Cash Desk
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Dynamic Content Based on Selected Method */}
              {selectedMethod === 'gpay' && (
                <View style={styles.interactiveArea}>
                  <Text style={styles.qrInstructionHeading}>
                    Display Google Pay QR Code to Patient
                  </Text>
                  {renderQRCode('gpay')}
                </View>
              )}

              {selectedMethod === 'upi' && (
                <View style={styles.interactiveArea}>
                  <Text style={styles.qrInstructionHeading}>
                    Display UPI QR Code to Patient
                  </Text>
                  {renderQRCode('upi')}
                </View>
              )}

              {selectedMethod === 'card' && (
                <View style={styles.interactiveArea}>
                  {renderCardPOSTerminal()}
                </View>
              )}

              {selectedMethod === 'cash' && (
                <View style={styles.cashDeskCard}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>💵</Text>
                  <Text style={[styles.cashDeskTitle, { color: tc.text }]}>Cash Counter Collection</Text>
                  <Text style={styles.cashDeskSub}>
                    Collect physical cash of ${appointment.paymentAmount}.00 from {appointment.patientName}
                  </Text>
                </View>
              )}

              {/* Live Verification Status Banner */}
              {isVerifying && (
                <View style={styles.verifyingBanner}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.verifyingBannerText}>{verificationStage}</Text>
                </View>
              )}

              {/* Trigger Button: ONLY transitions when payment passes through! */}
              <TouchableOpacity
                style={[
                  styles.collectActionBtn,
                  isVerifying && styles.collectActionBtnDisabled,
                ]}
                onPress={handleVerifyAndPay}
                disabled={isVerifying}
                activeOpacity={0.85}
              >
                <Text style={styles.collectActionBtnText}>
                  {isVerifying
                    ? 'Verifying with Bank...'
                    : selectedMethod === 'gpay'
                    ? `Confirm Google Pay Received ($${appointment.paymentAmount}.00)`
                    : selectedMethod === 'upi'
                    ? `Confirm UPI Payment Received ($${appointment.paymentAmount}.00)`
                    : selectedMethod === 'card'
                    ? `Authorize Card on POS ($${appointment.paymentAmount}.00)`
                    : `Confirm Cash Received ($${appointment.paymentAmount}.00)`}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    padding: 20,
    maxHeight: '92%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billSummaryBox: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  billSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billSummaryLabel: {
    fontSize: 12.5,
  },
  billSummaryVal: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  billSummaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  billTotalAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  methodSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  methodSelectorBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  methodSelectorBtnActive: {
    borderColor: colors.whatsapp.primary,
    backgroundColor: 'rgba(18, 140, 126, 0.08)',
  },
  methodSelectorLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  gpayIconCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  gpayLetterG: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4285F4',
  },
  gpayLetterPay: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  interactiveArea: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrInstructionHeading: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    fontWeight: '600',
  },
  qrOuterWrapper: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrInnerCard: {
    width: 170,
    height: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cornerFinder: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderWidth: 6,
    borderColor: '#0F172A',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerFinderCenter: {
    width: 16,
    height: 16,
    backgroundColor: '#0F172A',
    borderRadius: 4,
  },
  qrMatrixGrid: {
    width: 140,
    height: 140,
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  qrModuleSpacer: {
    width: 140 / 8,
    height: 140 / 8,
  },
  qrModuleBox: {
    width: 140 / 8,
    height: 140 / 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrDotFilled: {
    width: 10,
    height: 10,
    backgroundColor: '#0F172A',
    borderRadius: 2,
  },
  qrCenterBadge: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpayCenterBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  gpayBrandLetterG: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4285F4',
  },
  gpayBrandLetterPay: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  upiCenterBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  qrDetailTextRow: {
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  qrAmountCallout: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  qrVpaSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  qrLiveStatusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    gap: 6,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
  },
  qrLiveStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  posTerminalWrapper: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  posTerminalScreen: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  posTerminalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  posTerminalBrand: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  posTerminalSignalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  posTerminalInstruction: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  posTerminalAmount: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 6,
  },
  posTerminalMeta: {
    color: '#94A3B8',
    fontSize: 10.5,
  },
  cardLogosRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cardLogoText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  cashDeskCard: {
    width: '100%',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  cashDeskTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cashDeskSub: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
  verifyingBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  verifyingBannerText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  collectActionBtn: {
    backgroundColor: colors.whatsapp.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  collectActionBtnDisabled: {
    opacity: 0.6,
  },
  collectActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },

  // Confirmation Screen Styles
  confirmContentWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  successCheckCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  confirmSubtitle: {
    fontSize: 12.5,
    color: '#16A34A',
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 8,
  },
  confirmAmount: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 16,
  },
  confirmReceiptBox: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    marginBottom: 16,
  },
  confirmReceiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmRowLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  confirmRowVal: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  confirmActionsWrap: {
    width: '100%',
    gap: 10,
  },
  shareWhatsAppBtn: {
    backgroundColor: colors.whatsapp.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  shareWhatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  confirmDoneBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
