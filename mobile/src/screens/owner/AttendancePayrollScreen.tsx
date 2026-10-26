import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { attendanceService } from '../../services/attendanceService';
import { payrollService } from '../../services/payrollService';
import { AppIcon } from '../../components/common/AppIcon';
import { RIO_SCAN_CENTER_INFO } from '../../services/rioStaffSeedData';

interface AttendancePayrollScreenProps {
  onOpenKioskModal?: () => void;
}

export const AttendancePayrollScreen: React.FC<AttendancePayrollScreenProps> = ({
  onOpenKioskModal,
}) => {
  const { colors: tc, isDark } = useAppTheme();

  const [activeSection, setActiveSection] = useState<'attendance' | 'payroll'>('attendance');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  // Attendance Data
  const attendanceList = attendanceService.getAttendanceForDate();
  const floorStats = attendanceService.getFloorStats();
  const staffOnBreak = attendanceService.getStaffOnLunchBreak();

  // Payroll Data
  const payrollSummary = payrollService.getPayrollSummary(selectedMonth);
  const payrollList = payrollService.getPayrollForMonth(selectedMonth);

  const handleApprovePayroll = (id: string, name: string) => {
    Alert.alert(
      'Approve & Pay Salary',
      `Approve monthly net salary for ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm UPI / Bank Payout',
          onPress: async () => {
            await payrollService.markAsPaid(id);
            Alert.alert('Success', `Salary marked as PAID for ${name}. Digital payslip generated.`);
          },
        },
      ]
    );
  };

  const handleSharePayslip = (staffName: string, net: number) => {
    Alert.alert(
      'WhatsApp Payslip Dispatched',
      `Official RIO Scans salary slip of ₹${net.toLocaleString('en-IN')} sent via WhatsApp to ${staffName}.`
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Top Switcher: Live Attendance vs Monthly Payroll */}
      <View style={[styles.switchBar, { backgroundColor: isDark ? '#1C2431' : '#E2E8F0' }]}>
        <TouchableOpacity
          style={[styles.switchBtn, activeSection === 'attendance' && styles.switchBtnActive]}
          onPress={() => setActiveSection('attendance')}
        >
          <AppIcon
            name="finger-print-outline"
            size={16}
            color={activeSection === 'attendance' ? '#FFFFFF' : tc.textSecondary}
          />
          <Text
            style={[
              styles.switchBtnText,
              { color: activeSection === 'attendance' ? '#FFFFFF' : tc.textSecondary },
            ]}
          >
            Live Attendance & Breaks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchBtn, activeSection === 'payroll' && styles.switchBtnActive]}
          onPress={() => setActiveSection('payroll')}
        >
          <AppIcon
            name="cash-outline"
            size={16}
            color={activeSection === 'payroll' ? '#FFFFFF' : tc.textSecondary}
          />
          <Text
            style={[
              styles.switchBtnText,
              { color: activeSection === 'payroll' ? '#FFFFFF' : tc.textSecondary },
            ]}
          >
            Automated Salary Payroll
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ======================================================== */}
        {/* SECTION 1: LIVE ATTENDANCE & LUNCH BREAK REGULATION      */}
        {/* ======================================================== */}
        {activeSection === 'attendance' && (
          <>
            {/* Top Quick Actions & Kiosk Trigger */}
            <View style={styles.kioskBar}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.kioskTitle, { color: tc.text }]}>
                  3-Floor Biometric Face Attendance
                </Text>
                <Text style={[styles.kioskSub, { color: tc.textSecondary }]}>
                  Regulating lunch breaks (45m max) & unannounced leaves
                </Text>
              </View>

              {onOpenKioskModal && (
                <TouchableOpacity style={styles.kioskLaunchBtn} onPress={onOpenKioskModal}>
                  <AppIcon name="camera-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.kioskLaunchBtnText}>Face Kiosk</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Floor Breakdown Cards */}
            <Text style={[styles.sectionTitle, { color: tc.text }]}>BUILDING OCCUPANCY & LIFTS</Text>
            <View style={styles.floorGrid}>
              {/* Floor 1 */}
              <View style={[styles.floorCard, { backgroundColor: isDark ? '#1C2431' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                <View style={styles.floorHeader}>
                  <Text style={styles.floorNum}>FLOOR 1</Text>
                  <View style={styles.floorDotActive} />
                </View>
                <Text style={[styles.floorDept, { color: tc.text }]}>Reception & USG</Text>
                <Text style={styles.floorCount}>
                  <Text style={{ fontWeight: '900', color: '#10B981' }}>{floorStats.floor1.present}</Text> / {floorStats.floor1.total} Present
                </Text>
                {floorStats.floor1.onBreak > 0 && (
                  <Text style={styles.onBreakTag}>☕ {floorStats.floor1.onBreak} on lunch</Text>
                )}
              </View>

              {/* Floor 2 */}
              <View style={[styles.floorCard, { backgroundColor: isDark ? '#1C2431' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                <View style={styles.floorHeader}>
                  <Text style={styles.floorNum}>FLOOR 2</Text>
                  <View style={styles.floorDotActive} />
                </View>
                <Text style={[styles.floorDept, { color: tc.text }]}>1.5T MRI & 128 CT</Text>
                <Text style={styles.floorCount}>
                  <Text style={{ fontWeight: '900', color: '#10B981' }}>{floorStats.floor2.present}</Text> / {floorStats.floor2.total} Present
                </Text>
                {floorStats.floor2.onBreak > 0 && (
                  <Text style={styles.onBreakTag}>☕ {floorStats.floor2.onBreak} on lunch</Text>
                )}
              </View>

              {/* Floor 3 */}
              <View style={[styles.floorCard, { backgroundColor: isDark ? '#1C2431' : '#F8FAFC', borderColor: tc.cardBorder }]}>
                <View style={styles.floorHeader}>
                  <Text style={styles.floorNum}>FLOOR 3</Text>
                  <View style={styles.floorDotActive} />
                </View>
                <Text style={[styles.floorDept, { color: tc.text }]}>Pathology & Admin</Text>
                <Text style={styles.floorCount}>
                  <Text style={{ fontWeight: '900', color: '#10B981' }}>{floorStats.floor3.present}</Text> / {floorStats.floor3.total} Present
                </Text>
                {floorStats.floor3.onBreak > 0 && (
                  <Text style={styles.onBreakTag}>☕ {floorStats.floor3.onBreak} on lunch</Text>
                )}
              </View>
            </View>

            {/* Live Lunch Break Overstay Monitor */}
            <View style={[styles.alertContainer, { backgroundColor: isDark ? '#2A1B1B' : '#FEF2F2', borderColor: '#FCA5A5' }]}>
              <View style={styles.alertHeader}>
                <AppIcon name="timer-outline" size={18} color="#DC2626" />
                <Text style={styles.alertTitle}>LUNCH BREAK REGULATION MONITOR</Text>
              </View>
              <Text style={styles.alertSub}>
                Standard Allowance: 45 minutes. System automatically flags lift exits and logs payroll penalties for overstays.
              </Text>

              {staffOnBreak.length > 0 ? (
                staffOnBreak.map((item) => (
                  <View key={item.staff.id} style={styles.overstayRow}>
                    <View style={styles.overstayInfo}>
                      <Text style={[styles.overstayName, { color: tc.text }]}>
                        {item.staff.name} ({item.staff.department})
                      </Text>
                      <Text style={styles.overstayTime}>
                        Out at: {new Date(item.lunchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Elapsed: {item.elapsedMinutes} mins
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.overstayBadge,
                        { backgroundColor: item.isOverstay ? '#FEE2E2' : '#DCFCE7' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.overstayBadgeText,
                          { color: item.isOverstay ? '#DC2626' : '#15803D' },
                        ]}
                      >
                        {item.isOverstay ? `⚠️ +${item.elapsedMinutes - 45}m OVERSTAY` : 'OK'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.allClearText}>
                  ✅ All active staff are currently in their designated floor work areas.
                </Text>
              )}
            </View>

            {/* Today's Punch Records Table */}
            <Text style={[styles.sectionTitle, { color: tc.text, marginTop: 18 }]}>
              TODAY'S BIOMETRIC PUNCH LOG ({attendanceList.length} LOGS)
            </Text>

            {attendanceList.map((record) => {
              const isAbsent = record.status === 'absent_unannounced';
              const isOverstay = record.breakOverstayMinutes > 0;

              return (
                <View
                  key={record.id}
                  style={[
                    styles.recordCard,
                    { backgroundColor: tc.card, borderColor: isAbsent ? '#FCA5A5' : tc.cardBorder },
                  ]}
                >
                  <View style={styles.recordTop}>
                    <View style={styles.recordCol}>
                      <Text style={[styles.recordName, { color: tc.text }]}>
                        {record.staffName}
                      </Text>
                      <Text style={[styles.recordMeta, { color: tc.textSecondary }]}>
                        {record.department} • Floor {record.floor}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isAbsent
                            ? '#FEE2E2'
                            : isOverstay
                            ? '#FEF3C7'
                            : '#DCFCE7',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color: isAbsent
                              ? '#DC2626'
                              : isOverstay
                              ? '#B45309'
                              : '#15803D',
                          },
                        ]}
                      >
                        {isAbsent
                          ? 'UNANNOUNCED ABSENCE'
                          : isOverstay
                          ? `OVERSTAY (+${record.breakOverstayMinutes}m)`
                          : 'PRESENT'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.punchRow, { backgroundColor: isDark ? '#1C2431' : '#F8FAFC' }]}>
                    <View style={styles.punchItem}>
                      <Text style={styles.punchLabel}>SHIFT IN</Text>
                      <Text style={[styles.punchTime, { color: tc.text }]}>
                        {record.shiftIn
                          ? new Date(record.shiftIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </Text>
                    </View>
                    <View style={styles.punchDivider} />
                    <View style={styles.punchItem}>
                      <Text style={styles.punchLabel}>LUNCH OUT</Text>
                      <Text style={[styles.punchTime, { color: tc.text }]}>
                        {record.lunchOut
                          ? new Date(record.lunchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </Text>
                    </View>
                    <View style={styles.punchDivider} />
                    <View style={styles.punchItem}>
                      <Text style={styles.punchLabel}>LUNCH IN</Text>
                      <Text style={[styles.punchTime, { color: tc.text }]}>
                        {record.lunchIn
                          ? new Date(record.lunchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </Text>
                    </View>
                    <View style={styles.punchDivider} />
                    <View style={styles.punchItem}>
                      <Text style={styles.punchLabel}>BREAK DURATION</Text>
                      <Text
                        style={[
                          styles.punchTime,
                          { color: isOverstay ? '#DC2626' : '#059669', fontWeight: '800' },
                        ]}
                      >
                        {record.lunchDurationMinutes ? `${record.lunchDurationMinutes}m` : '0m'}
                      </Text>
                    </View>
                  </View>

                  {!!record.notes && (
                    <Text style={styles.recordNote}>{record.notes}</Text>
                  )}
                </View>
              );
            })}

            {attendanceList.length === 0 && (
              <View style={[styles.emptyCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🕒</Text>
                <Text style={[styles.emptyCardTitle, { color: tc.text }]}>No Punch Logs for Today</Text>
                <Text style={[styles.emptyCardSub, { color: tc.textSecondary }]}>
                  Staff clock-ins and lunch breaks logged via Face Kiosk or Staff ID will appear in this real-time log.
                </Text>
              </View>
            )}
          </>
        )}

        {/* ======================================================== */}
        {/* SECTION 2: ATTENDANCE-LINKED AUTOMATED PAYROLL ENGINE    */}
        {/* ======================================================== */}
        {activeSection === 'payroll' && (
          <>
            {/* Monthly Financial Overview */}
            <View style={[styles.payrollSummaryCard, { backgroundColor: isDark ? '#13231F' : '#F0FDF4', borderColor: '#86EFAC' }]}>
              <View style={styles.paySumHeader}>
                <View>
                  <Text style={styles.paySumTitle}>OCTOBER 2026 SALARY PAYROLL</Text>
                  <Text style={styles.paySumSub}>
                    80 Staff Members • Automatic Unannounced Leave & Break Overstay Penalties Applied
                  </Text>
                </View>
                <View style={styles.payMonthBadge}>
                  <Text style={styles.payMonthText}>OCT 2026</Text>
                </View>
              </View>

              <View style={styles.payStatGrid}>
                <View style={styles.payStatItem}>
                  <Text style={styles.payStatNum}>
                    ₹{payrollSummary.totalNet.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.payStatLabel}>Total Net Payout</Text>
                </View>
                <View style={styles.payStatItem}>
                  <Text style={[styles.payStatNum, { color: '#DC2626' }]}>
                    -₹{payrollSummary.totalDeductions.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.payStatLabel}>Deductions Collected</Text>
                </View>
                <View style={styles.payStatItem}>
                  <Text style={[styles.payStatNum, { color: '#059669' }]}>
                    +₹{payrollSummary.totalOT.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.payStatLabel}>Overtime & Bonus</Text>
                </View>
              </View>

              <View style={styles.ruleExplainRow}>
                <Text style={styles.ruleExplainText}>
                  ⚖️ <Text style={{ fontWeight: 'bold' }}>Unannounced Leave Penalty:</Text> 1.5x daily pay deducted automatically.
                  <Text style={{ fontWeight: 'bold' }}> Break Overstay:</Text> Lunch &gt; 45 mins penalized pro-rata.
                </Text>
              </View>
            </View>

            {/* Staff-by-Staff Detailed Salary Slips */}
            <Text style={[styles.sectionTitle, { color: tc.text, marginTop: 18 }]}>
              INDIVIDUAL SALARY SLIPS ({payrollList.length})
            </Text>

            {payrollList.map((slip) => (
              <View
                key={slip.id}
                style={[
                  styles.slipCard,
                  { backgroundColor: tc.card, borderColor: tc.cardBorder },
                ]}
              >
                <View style={styles.slipTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.slipName, { color: tc.text }]}>{slip.staffName}</Text>
                    <Text style={[styles.slipDept, { color: tc.textSecondary }]}>
                      {slip.department} • Base: ₹{slip.baseSalary.toLocaleString('en-IN')}/m
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.payStatusBadge,
                      {
                        backgroundColor:
                          slip.paymentStatus === 'paid'
                            ? '#DCFCE7'
                            : slip.paymentStatus === 'approved'
                            ? '#E0F2FE'
                            : '#FEF3C7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.payStatusText,
                        {
                          color:
                            slip.paymentStatus === 'paid'
                              ? '#15803D'
                              : slip.paymentStatus === 'approved'
                              ? '#0369A1'
                              : '#B45309',
                        },
                      ]}
                    >
                      {slip.paymentStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Metrics Breakdown */}
                <View style={[styles.metricsBox, { backgroundColor: isDark ? '#1C2431' : '#F8FAFC' }]}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricVal}>{slip.presentDays} / {slip.workingDays}</Text>
                    <Text style={styles.metricLabel}>Present Days</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricVal, { color: slip.unannouncedLeaveDays > 0 ? '#DC2626' : '#10B981' }]}>
                      {slip.unannouncedLeaveDays} Days
                    </Text>
                    <Text style={styles.metricLabel}>Unannounced</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricVal, { color: slip.breakOverstayMinutesTotal > 0 ? '#D97706' : '#10B981' }]}>
                      {slip.breakOverstayMinutesTotal} mins
                    </Text>
                    <Text style={styles.metricLabel}>Lunch Excess</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricVal, { color: '#2563EB' }]}>{slip.overtimeHours} hrs</Text>
                    <Text style={styles.metricLabel}>OT Worked</Text>
                  </View>
                </View>

                {/* Financial Math */}
                <View style={styles.mathRow}>
                  <Text style={[styles.mathLabel, { color: tc.textSecondary }]}>Gross Earnings:</Text>
                  <Text style={[styles.mathVal, { color: tc.text }]}>₹{slip.grossEarnings.toLocaleString('en-IN')}</Text>
                </View>

                {slip.unannouncedLeaveDeductions > 0 && (
                  <View style={styles.mathRow}>
                    <Text style={[styles.mathLabel, { color: '#DC2626' }]}>
                      • Unannounced Leave Penalty (1.5x Daily):
                    </Text>
                    <Text style={[styles.mathVal, { color: '#DC2626' }]}>
                      -₹{slip.unannouncedLeaveDeductions.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}

                {slip.breakOverstayDeductions > 0 && (
                  <View style={styles.mathRow}>
                    <Text style={[styles.mathLabel, { color: '#D97706' }]}>
                      • Lunch Break Overstay Deduction:
                    </Text>
                    <Text style={[styles.mathVal, { color: '#D97706' }]}>
                      -₹{slip.breakOverstayDeductions.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}

                {slip.overtimePay > 0 && (
                  <View style={styles.mathRow}>
                    <Text style={[styles.mathLabel, { color: '#059669' }]}>• Overtime Pay (1.5x Rate):</Text>
                    <Text style={[styles.mathVal, { color: '#059669' }]}>+₹{slip.overtimePay.toLocaleString('en-IN')}</Text>
                  </View>
                )}

                <View style={styles.netSalaryRow}>
                  <Text style={[styles.netSalaryLabel, { color: tc.text }]}>Net Payable Salary:</Text>
                  <Text style={styles.netSalaryVal}>₹{slip.netPayableSalary.toLocaleString('en-IN')}</Text>
                </View>

                {/* Actions */}
                <View style={styles.slipActionsRow}>
                  <TouchableOpacity
                    style={styles.whatsappBtn}
                    onPress={() => handleSharePayslip(slip.staffName, slip.netPayableSalary)}
                  >
                    <AppIcon name="logo-whatsapp" size={14} color="#FFFFFF" />
                    <Text style={styles.whatsappBtnText}>Send WhatsApp</Text>
                  </TouchableOpacity>

                  {slip.paymentStatus !== 'paid' && (
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleApprovePayroll(slip.id, slip.staffName)}
                    >
                      <AppIcon name="checkmark-done" size={14} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Approve & Pay</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {payrollList.length === 0 && (
              <View style={[styles.emptyCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>💳</Text>
                <Text style={[styles.emptyCardTitle, { color: tc.text }]}>No Payroll Records for {selectedMonth}</Text>
                <Text style={[styles.emptyCardSub, { color: tc.textSecondary }]}>
                  Staff payroll will be automatically computed and generated from logged attendance shifts and working hours.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  switchBar: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  switchBtnActive: {
    backgroundColor: '#075E54',
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  kioskBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  kioskTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  kioskSub: {
    fontSize: 11,
    marginTop: 1,
  },
  kioskLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#075E54',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  kioskLaunchBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  floorGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  floorCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floorNum: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
  },
  floorDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  floorDept: {
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 4,
  },
  floorCount: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 4,
  },
  onBreakTag: {
    fontSize: 9.5,
    color: '#D97706',
    fontWeight: '700',
    marginTop: 3,
  },
  alertContainer: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  alertSub: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 4,
    lineHeight: 15,
  },
  overstayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(220, 38, 38, 0.1)',
  },
  overstayInfo: {
    flex: 1,
  },
  overstayName: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  overstayTime: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  overstayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  overstayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  allClearText: {
    fontSize: 11.5,
    color: '#15803D',
    fontWeight: '600',
    marginTop: 8,
  },
  recordCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  recordTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordCol: {
    flex: 1,
  },
  recordName: {
    fontSize: 13,
    fontWeight: '800',
  },
  recordMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  punchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  punchItem: {
    flex: 1,
    alignItems: 'center',
  },
  punchLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
  },
  punchTime: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  punchDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  recordNote: {
    fontSize: 10.5,
    color: '#B91C1C',
    fontWeight: '600',
    marginTop: 6,
    fontStyle: 'italic',
  },
  payrollSummaryCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  paySumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paySumTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#075E54',
  },
  paySumSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  payMonthBadge: {
    backgroundColor: '#075E54',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payMonthText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  payStatGrid: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(7,94,84,0.1)',
  },
  payStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  payStatNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#075E54',
  },
  payStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  ruleExplainRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(7,94,84,0.1)',
  },
  ruleExplainText: {
    fontSize: 10.5,
    color: '#334155',
    lineHeight: 15,
  },
  slipCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  slipTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  slipName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  slipDept: {
    fontSize: 11,
    marginTop: 1,
  },
  payStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  payStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricsBox: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  mathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  mathLabel: {
    fontSize: 11,
  },
  mathVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  netSalaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  netSalaryLabel: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  netSalaryVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#075E54',
  },
  slipActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#075E54',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 20,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyCardSub: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 320,
  },
});
