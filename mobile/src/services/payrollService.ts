import { PayrollRecord, StaffMember } from '../types';
import { INITIAL_MONTHLY_PAYROLL, INITIAL_STAFF_MEMBERS, RIO_SCAN_CENTER_INFO } from './rioStaffSeedData';
import { firestore } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';

class PayrollService {
  private isDemo: boolean = false;
  private payrollRecords: PayrollRecord[] = [];
  private freshPayrollRecords: PayrollRecord[] = [];

  setDemoMode(isDemo: boolean): void {
    this.isDemo = isDemo;
    if (isDemo) {
      this.payrollRecords = [...INITIAL_MONTHLY_PAYROLL];
    } else {
      this.payrollRecords = [...this.freshPayrollRecords];
    }
  }

  getPayrollForMonth(monthYear: string = '2026-10'): PayrollRecord[] {
    return this.payrollRecords.filter((p) => p.monthYear === monthYear);
  }

  getPayrollSummary(monthYear: string = '2026-10') {
    const list = this.getPayrollForMonth(monthYear);
    const totalGross = list.reduce((sum, p) => sum + p.grossEarnings, 0);
    const totalDeductions = list.reduce((sum, p) => sum + p.totalDeductions, 0);
    const totalNet = list.reduce((sum, p) => sum + p.netPayableSalary, 0);
    const unannouncedPenalties = list.reduce((sum, p) => sum + p.unannouncedLeaveDeductions, 0);
    const breakOverstayDeductions = list.reduce((sum, p) => sum + p.breakOverstayDeductions, 0);
    const totalOT = list.reduce((sum, p) => sum + p.overtimePay, 0);

    return {
      monthYear,
      totalStaffCount: list.length,
      totalGross,
      totalDeductions,
      totalNet,
      unannouncedPenalties,
      breakOverstayDeductions,
      totalOT,
      approvedCount: list.filter((p) => p.paymentStatus === 'approved' || p.paymentStatus === 'paid').length,
    };
  }

  /**
   * Recalculate or generate payroll for a staff member based on attendance metrics
   */
  calculateStaffPayroll(
    staff: StaffMember,
    params: {
      workingDays?: number;
      presentDays: number;
      halfDays: number;
      unannouncedLeaveDays: number;
      approvedLeaveDays: number;
      breakOverstayMinutesTotal: number;
      lateArrivalDays: number;
      overtimeHours: number;
      incentives?: number;
    },
    monthYear: string = '2026-10'
  ): PayrollRecord {
    const workingDays = params.workingDays || 26;
    const dailyWage = Math.round(staff.baseSalary / workingDays);
    const hourlyWage = Math.round(dailyWage / 8);

    // 1. Unannounced leave penalty (1.5x daily pay penalty!)
    const unannouncedLeaveDeductions = Math.round(
      params.unannouncedLeaveDays * dailyWage * RIO_SCAN_CENTER_INFO.unannouncedLeavePenaltyMultiplier
    );

    // 2. Break overstay penalty (calculated per 30 minutes block of unauthorized break)
    const breakOverstayBlocks = Math.floor(params.breakOverstayMinutesTotal / 30);
    const breakOverstayDeductions = Math.round(breakOverstayBlocks * (hourlyWage * 0.75));

    // 3. Late arrival penalty (>15 mins late more than twice = 150 INR each)
    const lateArrivalDeductions = Math.max(0, (params.lateArrivalDays - 2) * 150);

    // 4. Half day deductions (0.5 daily wage)
    const halfDayDeductions = Math.round(params.halfDays * (dailyWage * 0.5));

    // 5. Overtime additions (1.5x hourly wage)
    const overtimePay = Math.round(params.overtimeHours * (hourlyWage * 1.5));
    const incentives = params.incentives || 0;

    const grossEarnings = staff.baseSalary + overtimePay + incentives;
    const totalDeductions =
      unannouncedLeaveDeductions +
      breakOverstayDeductions +
      lateArrivalDeductions +
      halfDayDeductions;

    const netPayableSalary = Math.max(0, grossEarnings - totalDeductions);

    const record: PayrollRecord = {
      id: `PAY-${monthYear.replace(/-/g, '')}-${staff.id}`,
      monthYear,
      staffId: staff.id,
      staffName: staff.name,
      role: staff.role,
      department: staff.department,
      baseSalary: staff.baseSalary,
      dailyWage,
      workingDays,
      presentDays: params.presentDays,
      halfDays: params.halfDays,
      unannouncedLeaveDays: params.unannouncedLeaveDays,
      approvedLeaveDays: params.approvedLeaveDays,
      unannouncedLeaveDeductions,
      breakOverstayMinutesTotal: params.breakOverstayMinutesTotal,
      breakOverstayDeductions,
      lateArrivalDeductions,
      overtimeHours: params.overtimeHours,
      overtimePay,
      incentives,
      grossEarnings,
      totalDeductions,
      netPayableSalary,
      paymentStatus: 'approved',
    };

    // Replace or add to memory
    const existingIndex = this.payrollRecords.findIndex(
      (p) => p.staffId === staff.id && p.monthYear === monthYear
    );
    if (existingIndex >= 0) {
      this.payrollRecords[existingIndex] = record;
    } else {
      this.payrollRecords.unshift(record);
    }

    // Attempt saving to Firestore
    try {
      if (firestore) {
        setDoc(doc(firestore, 'payroll', record.id), record, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore payroll sync (offline/demo):', e);
    }

    return record;
  }

  /**
   * Approve and finalize payroll payment
   */
  async markAsPaid(payrollId: string, paymentReference: string = 'UPI-RIO-PAY-9810'): Promise<boolean> {
    const target = this.payrollRecords.find((p) => p.id === payrollId);
    if (target) {
      target.paymentStatus = 'paid';
      target.paidAt = new Date().toISOString();
      target.paymentReference = paymentReference;

      try {
        if (firestore) {
          await setDoc(doc(firestore, 'payroll', target.id), target, { merge: true });
        }
      } catch (e) {
        console.warn('Firestore payroll status update (offline):', e);
      }
      return true;
    }
    return false;
  }
}

export const payrollService = new PayrollService();
