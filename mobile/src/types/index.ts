export type UserRole = 'owner' | 'doctor' | 'receptionist' | 'patient' | 'staff' | 'delivery';

export interface StaffProfile {
  employeeId: string;
  department: string;
  floor: number;
  shift: 'morning' | 'evening' | 'night' | 'general';
  baseSalary: number;
  joiningDate: string;
  faceRegistered: boolean;
  emergencyContact?: string;
  bloodGroup?: string;
}

export interface DeliveryProfile {
  courierId: string;
  vehicleType: 'bike' | 'scooter' | 'van';
  vehicleNumber: string;
  activeDeliveryCount: number;
  currentLatitude?: number;
  currentLongitude?: number;
  contactNumber: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  hospitalId?: string;
  avatarUrl?: string;
  createdAt: string;
  // Doctor specific fields
  doctorProfile?: DoctorProfile;
  // Patient specific fields
  patientProfile?: PatientProfile;
  // Receptionist specific fields
  receptionistProfile?: ReceptionistProfile;
  // Hospital owner specific fields
  ownerProfile?: OwnerProfile;
  // General lab technician / nursing staff specific fields
  staffProfile?: StaffProfile;
  // Delivery courier specific fields
  deliveryProfile?: DeliveryProfile;
}

export interface OwnerProfile {
  title?: string;
  qualification?: string;
  organization?: string;
  taxId?: string;
  address?: string;
  contactPerson?: string;
  emergencyContact?: string;
}

export interface ReceptionistProfile {
  deskNumber: string;
  shift: 'morning' | 'evening' | 'night';
  employeeId?: string;
  salary?: number;
  salaryPeriod?: 'month' | 'year';
  basePay?: number;
  allowance?: number;
  incentive?: number;
  bankAccount?: string;
  address?: string;
  joiningDate?: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  assignedRoomNumber?: string;
  assignedDoctorIds?: string[];
  assignedDoctorNames?: string[];
  assignedRooms?: string[];
  emergencyContact?: string;
  bloodGroup?: string;
}

export type AvailabilityStatus = 'available' | 'morning_only' | 'evening_only' | 'on_leave';

export interface DoctorDateAvailability {
  date: string; // YYYY-MM-DD
  isAvailable: boolean;
  status: AvailabilityStatus;
  timingStart: string;
  timingEnd: string;
  slots: string[];
  maxTokens: number;
  note?: string; // Reason or notice (e.g. "Cardiology Summit", "Morning OPD only")
}

export interface DoctorProfile {
  specialty: string;
  qualification: string;
  roomNumber: string;
  consultationFee: number;
  avgConsultationMinutes: number;
  availableDays: string[];
  timingStart: string;
  timingEnd: string;
  maxTokensPerDay: number;
  experienceYears: number;
  rating: number;
  about?: string;
  dateAvailability?: Record<string, DoctorDateAvailability>;
}

export interface PatientProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  bloodGroup: string;
  address: string;
  emergencyContact: string;
  allergies?: string[];
  chronicConditions?: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceGroupNumber?: string;
  insuranceValidity?: string;
  copayAmount?: number;
  activeMedications?: string[];
}

export interface Hospital {
  id: string;
  name: string;
  tagline: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  ownerId: string;
  departments: string[];
  rating: number;
  reviewCount: number;
  imageUrl: string;
  openingHours: string;
  totalDoctors: number;
  distanceKm?: number; // Calculated on-device based on user's GPS
}

export type AppointmentStatus =
  | 'booked'
  | 'checked_in'
  | 'waiting'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'pending' | 'paid' | 'waived';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'gpay';

export interface MedicineItem {
  id: string;
  name: string;
  dosage: string;      // e.g. "500mg"
  frequency: string;   // e.g. "1-0-1 (After Food)"
  duration: string;    // e.g. "5 days"
  instructions: string;
}

export interface Prescription {
  diagnosis: string;
  medicines: MedicineItem[];
  clinicalAdvice: string;
  followUpDate?: string;
  issuedAt: string;
  doctorSignature?: string;
}

export type ReportType =
  | 'xray'
  | 'blood_test'
  | 'mri'
  | 'ct_scan'
  | 'ultrasound'
  | 'ecg'
  | 'pathology'
  | 'prescription'
  | 'other';

export type ScannerFilter = 'original' | 'xray_contrast' | 'document_bw' | 'color_enhanced';

export interface ScannedReport {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  reportType: ReportType;
  title: string;
  fileUri: string;
  notes?: string;
  scannedBy: string; // Receptionist Name or ID
  scanDate: string;
  filterApplied: ScannerFilter;
  fileSize?: string;
}

export interface Appointment {
  id: string;
  tokenNumber: number;
  hospitalId: string;
  hospitalName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  roomNumber: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string;        // e.g. "10:30 AM"
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  receiptNumber?: string;
  symptoms?: string;
  consultationNotes?: string;
  prescription?: Prescription;
  scannedReports: ScannedReport[];
  createdAt: string;
  updatedAt: string;
  // Token queue dynamic estimation
  estimatedWaitMinutes?: number;
}

export interface RoomQueue {
  id: string;              // e.g. queue_hospital1_doc1_2026-09-25
  hospitalId: string;
  hospitalName: string;
  doctorId: string;
  doctorName: string;
  roomNumber: string;
  specialty: string;
  date: string;
  currentToken: number;    // Token inside doctor's room
  nextToken: number;       // Next token to be called
  totalWaiting: number;
  totalCompleted: number;
  status: 'active' | 'on_break' | 'completed';
  lastCalledAt: string;
  upcomingTokens: Array<{
    tokenNumber: number;
    patientName: string;
    timeSlot: string;
    status: AppointmentStatus;
  }>;
}

export type NotificationType =
  | 'appointment_booked'
  | 'appointment_confirmed'
  | 'appointment_reminder'
  | 'queue_turn_called'
  | 'consultation_completed'
  | 'payment_received'
  | 'payment_recorded'
  | 'report_attached';

export interface AppNotification {
  id: string;
  recipientId: string;       // target user ID (e.g. usr_doc_jenkins, usr_patient_john, etc.) or 'all'
  recipientRole: UserRole;   // 'patient' | 'doctor' | 'receptionist' | 'owner' | 'staff' | 'delivery'
  type: NotificationType;
  title: string;
  message: string;
  subtitle?: string;
  timestamp: string;         // ISO date string
  read: boolean;
  appointmentId?: string;
  tokenNumber?: number;
  metadata?: {
    patientName?: string;
    doctorName?: string;
    roomNumber?: string;
    amount?: number;
    receiptNumber?: string;
    reportTitle?: string;
    date?: string;
    time?: string;
    method?: string;
    orderId?: string;
    trackingUrl?: string;
  };
}

// ==========================================
// RIO SCANS & LABS - STAFF & ATTENDANCE TYPES
// ==========================================

export type StaffDepartment =
  | 'Radiology (MRI/CT)'
  | 'Ultrasound & X-Ray'
  | 'Biochemistry & Pathology'
  | 'Front Desk & Reception'
  | 'Logistics & Report Delivery'
  | 'Housekeeping & Lift Operations';

export type ShiftType = 'morning' | 'evening' | 'night' | 'general';

export interface StaffMember {
  id: string;                 // e.g. RIO-STF-014
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: StaffDepartment;
  floor: 1 | 2 | 3;           // 3-storied facility with lifts
  shift: ShiftType;
  shiftTiming: string;        // e.g. "08:00 AM - 04:00 PM"
  baseSalary: number;         // monthly salary in INR
  dailyWage: number;          // baseSalary / 26
  joiningDate: string;
  avatarUrl?: string;
  faceRegistered: boolean;
  faceDescriptor?: string;    // Base64 or biometric embedding for verification
  isActive: boolean;
  generatedPassword?: string;
  employeePin?: string;
}

export type AttendanceAction = 'SHIFT_IN' | 'LUNCH_OUT' | 'LUNCH_IN' | 'SHIFT_OUT';

export type AttendanceStatus =
  | 'present'
  | 'half_day'
  | 'absent_unannounced'
  | 'leave_approved'
  | 'on_duty_delivery';

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: UserRole;
  department: StaffDepartment;
  floor: number;
  date: string;               // YYYY-MM-DD
  shiftIn?: string;           // ISO string
  lunchOut?: string;          // ISO string (break start)
  lunchIn?: string;           // ISO string (break return)
  shiftOut?: string;          // ISO string
  lunchDurationMinutes: number;
  breakOverstayMinutes: number; // minutes beyond standard 45 mins limit
  status: AttendanceStatus;
  verifiedBy: 'face_biometric' | 'kiosk_scan' | 'manual_owner_override';
  floorCheckpoint: string;    // e.g. "Floor 1 - Main Entrance", "Floor 2 - MRI Lift", "Floor 3 - Lab"
  photoSnapshotUri?: string;
  notes?: string;
}

// ==========================================
// RIO SCANS & LABS - PAYROLL ENGINE TYPES
// ==========================================

export interface PayrollRecord {
  id: string;
  monthYear: string;          // e.g. "2026-10"
  staffId: string;
  staffName: string;
  role: UserRole;
  department: StaffDepartment;
  baseSalary: number;
  dailyWage: number;
  workingDays: number;        // Standard 26 days
  presentDays: number;
  halfDays: number;
  unannouncedLeaveDays: number;
  approvedLeaveDays: number;
  // Deductions
  unannouncedLeaveDeductions: number; // 1.5x daily wage penalty per unannounced leave
  breakOverstayMinutesTotal: number;
  breakOverstayDeductions: number;    // Deductions for exceeding 45m lunch breaks
  lateArrivalDeductions: number;      // Penalties for >15m late arrivals
  // Additions
  overtimeHours: number;
  overtimePay: number;
  incentives: number;
  // Totals
  grossEarnings: number;
  totalDeductions: number;
  netPayableSalary: number;
  paymentStatus: 'draft' | 'approved' | 'paid';
  paidAt?: string;
  paymentReference?: string;
}

// ==========================================
// RIO SCANS & LABS - SCAN REPORT DELIVERY TYPES
// ==========================================

export type DeliveryStatus =
  | 'pending_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed';

export type DeliveryPriority = 'urgent_stat' | 'standard';

export interface DeliveryOrder {
  id: string;                 // e.g. DEL-RIO-2026-891
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  scanType: string;           // e.g. "Brain MRI Contrast & 3D Film"
  packageDetails: string;     // e.g. "1 MRI Film packet + CD + Pathology report"
  sourceLocation: string;     // "RIO Scans & Labs, Vannarpettai, Tirunelveli"
  sourcePhone: string;
  destinationHospital: string;// e.g. "Tirunelveli Medical College Hospital (TMC)"
  destinationDoctor: string;  // e.g. "Dr. Arumugam MS (Ortho)"
  destinationPhone: string;
  assignedCourierId: string;
  assignedCourierName: string;
  assignedCourierPhone: string;
  priority: DeliveryPriority;
  status: DeliveryStatus;
  createdAt: string;
  pickupTime?: string;
  deliveredTime?: string;
  estimatedDeliveryMinutes?: number;
  courierLocation: {
    latitude: number;
    longitude: number;
    updatedAt: string;
    speedKmph?: number;
    landmark?: string;
  };
  proofOfDelivery?: {
    receivedBy: string;
    recipientDesignation?: string;
    signatureOrStampUri?: string;
    photoUri?: string;
    notes?: string;
    deliveredAt: string;
  };
}
