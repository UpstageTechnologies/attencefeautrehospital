import {
  UserProfile,
  Hospital,
  Appointment,
  AppointmentStatus,
  RoomQueue,
  ScannedReport,
  Prescription,
  UserRole,
  PaymentMethod,
  DoctorDateAvailability,
  AvailabilityStatus,
  AppNotification,
  NotificationType,
} from '../types';

// Sample medical illustration base64 SVGs for realistic X-rays & Blood tests
export const SAMPLE_CHEST_XRAY = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" style="background:#090B10;font-family:monospace">
  <rect width="100%" height="100%" fill="#0a0d14"/>
  <text x="25" y="40" fill="#00FFCC" font-size="16" font-weight="bold">RIO SCAN CENTER &amp; DIAGNOSTICS - DIGITAL RADIOGRAPHY</text>
  <text x="25" y="65" fill="#8892b0" font-size="13">PATIENT: GOWRI T | F/56 | KNEE PAIN | ID: #RIO-9281</text>
  <text x="450" y="40" fill="#FF5370" font-size="16" font-weight="bold">R [RIGHT]</text>
  <text x="25" y="720" fill="#64ffda" font-size="12">120 kVp, 2.5 mAs | DIGITAL RADIOGRAPHY | CALIBRATED • TIRUNELVELI</text>
  
  <!-- Spine & Sternum -->
  <path d="M 300,100 L 300,600" stroke="#718096" stroke-width="24" stroke-dasharray="12,4" opacity="0.6"/>
  <!-- Clavicles -->
  <path d="M 300,140 Q 200,120 120,160" stroke="#CBD5E0" stroke-width="14" fill="none" opacity="0.8"/>
  <path d="M 300,140 Q 400,120 480,160" stroke="#CBD5E0" stroke-width="14" fill="none" opacity="0.8"/>
  <!-- Rib cages -->
  <path d="M 300,180 C 180,190 140,240 180,310 C 220,380 300,340 300,340" stroke="#A0AEC0" stroke-width="10" fill="none" opacity="0.4"/>
  <path d="M 300,180 C 420,190 460,240 420,310 C 380,380 300,340 300,340" stroke="#A0AEC0" stroke-width="10" fill="none" opacity="0.4"/>
  <path d="M 300,240 C 160,260 120,330 170,410 C 210,480 300,430 300,430" stroke="#A0AEC0" stroke-width="11" fill="none" opacity="0.45"/>
  <path d="M 300,240 C 440,260 480,330 430,410 C 390,480 300,430 300,430" stroke="#A0AEC0" stroke-width="11" fill="none" opacity="0.45"/>
  <path d="M 300,310 C 150,330 110,420 170,510 C 210,570 300,520 300,520" stroke="#A0AEC0" stroke-width="12" fill="none" opacity="0.5"/>
  <path d="M 300,310 C 450,330 490,420 430,510 C 390,570 300,520 300,520" stroke="#A0AEC0" stroke-width="12" fill="none" opacity="0.5"/>
  <!-- Lungs Radiolucency (dark regions) -->
  <path d="M 280,160 C 220,170 140,240 140,420 C 140,540 220,560 280,540 Z" fill="#131B2E" opacity="0.8"/>
  <path d="M 320,160 C 380,170 460,240 460,420 C 460,540 380,560 320,540 Z" fill="#131B2E" opacity="0.8"/>
  <!-- Cardiac Silhouette -->
  <path d="M 280,300 C 240,360 200,440 250,510 C 290,560 360,550 370,470 C 370,400 330,320 280,300 Z" fill="#E2E8F0" opacity="0.6"/>
  <!-- Diaphragm domes -->
  <path d="M 100,580 Q 200,510 300,560" stroke="#EDF2F7" stroke-width="16" fill="none" opacity="0.7"/>
  <path d="M 300,560 Q 400,520 500,590" stroke="#EDF2F7" stroke-width="16" fill="none" opacity="0.7"/>
</svg>
`);

export const SAMPLE_BLOOD_TEST = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" style="background:#FFFFFF;font-family:sans-serif">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <rect x="0" y="0" width="600" height="90" fill="#075E54"/>
  <text x="30" y="42" fill="#ffffff" font-size="22" font-weight="bold">RIO SCAN CENTER &amp; PATHOLOGY LABS</text>
  <text x="30" y="70" fill="#DCF8C6" font-size="13">ISO 15189:2022 ACCREDITED • VANNARPETTAI, TIRUNELVELI</text>
  
  <rect x="30" y="110" width="540" height="70" fill="#F0FDF4" rx="8" stroke="#128C7E" stroke-width="1"/>
  <text x="45" y="135" fill="#333" font-size="12">Patient Name: <tspan font-weight="bold">Gowri T (56y / Female - Knee Pain)</tspan></text>
  <text x="45" y="160" fill="#333" font-size="12">Sample Collected: 26 Sep 2026, 08:30 AM | Fasting: Yes</text>
  <text x="340" y="135" fill="#333" font-size="12">Ref Doctor: <tspan font-weight="bold">Dr. Preetha Rajesh (Rio Scan)</tspan></text>
  <text x="340" y="160" fill="#333" font-size="12">Barcode ID: <tspan font-weight="bold">LAB-TN-984210</tspan></text>

  <!-- Table Header -->
  <rect x="30" y="200" width="540" height="34" fill="#E2E8F0" rx="4"/>
  <text x="45" y="222" font-size="13" font-weight="bold" fill="#1E293B">INVESTIGATION</text>
  <text x="250" y="222" font-size="13" font-weight="bold" fill="#1E293B">RESULT</text>
  <text x="350" y="222" font-size="13" font-weight="bold" fill="#1E293B">UNIT</text>
  <text x="440" y="222" font-size="13" font-weight="bold" fill="#1E293B">REFERENCE</text>

  <!-- Table Rows -->
  <text x="45" y="260" font-size="13" fill="#334155">Serum Uric Acid</text>
  <text x="250" y="260" font-size="13" font-weight="bold" fill="#047857">4.2</text>
  <text x="350" y="260" font-size="13" fill="#64748B">mg/dL</text>
  <text x="440" y="260" font-size="13" fill="#64748B">2.5 - 6.2</text>

  <text x="45" y="295" font-size="13" fill="#334155">Erythrocyte Sed Rate (ESR)</text>
  <text x="250" y="295" font-size="13" font-weight="bold" fill="#B91C1C">28 [MILD HIGH]</text>
  <text x="350" y="295" font-size="13" fill="#64748B">mm/hr</text>
  <text x="440" y="295" font-size="13" fill="#64748B">&lt; 20</text>

  <text x="45" y="330" font-size="13" fill="#334155">C-Reactive Protein (CRP)</text>
  <text x="250" y="330" font-size="13" font-weight="bold" fill="#047857">3.4</text>
  <text x="350" y="330" font-size="13" fill="#64748B">mg/L</text>
  <text x="440" y="330" font-size="13" fill="#64748B">&lt; 5.0</text>

  <text x="45" y="365" font-size="13" fill="#334155">Fasting Blood Sugar</text>
  <text x="250" y="365" font-size="13" font-weight="bold" fill="#047857">96</text>
  <text x="350" y="365" font-size="13" fill="#64748B">mg/dL</text>
  <text x="440" y="365" font-size="13" fill="#64748B">70 - 99</text>

  <text x="45" y="400" font-size="13" fill="#334155">Serum Calcium</text>
  <text x="250" y="400" font-size="13" font-weight="bold" fill="#047857">9.4</text>
  <text x="350" y="400" font-size="13" fill="#64748B">mg/dL</text>
  <text x="440" y="400" font-size="13" fill="#64748B">8.8 - 10.2</text>

  <text x="45" y="435" font-size="13" fill="#334155">Hemoglobin (Hb)</text>
  <text x="250" y="435" font-size="13" font-weight="bold" fill="#047857">13.2</text>
  <text x="350" y="435" font-size="13" fill="#64748B">g/dL</text>
  <text x="440" y="435" font-size="13" fill="#64748B">12.0 - 15.5</text>

  <line x1="30" y1="465" x2="570" y2="465" stroke="#CBD5E1" stroke-width="1"/>
  
  <rect x="30" y="485" width="540" height="90" fill="#FEF3C7" rx="8" stroke="#F59E0B" stroke-width="1"/>
  <text x="45" y="515" font-size="13" font-weight="bold" fill="#92400E">PATHOLOGIST CLINICAL INTERPRETATION</text>
  <text x="45" y="540" font-size="12" fill="#78350F">Serum Uric acid within normal range, ruling out active acute gouty arthritis.</text>
  <text x="45" y="558" font-size="12" fill="#78350F">Mild ESR elevation aligns with chronic degenerative knee joint osteoarthritis.</text>

  <text x="400" y="690" font-size="12" font-weight="bold" fill="#334155">Dr. S. Sundaram, MD (Path)</text>
  <text x="400" y="708" font-size="11" fill="#64748B">Consultant Pathologist, Tirunelveli</text>
</svg>
`);

// Pre-seeded Demo Hospitals
export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hosp_central',
    name: 'Rio Scan Center',
    tagline: 'Premier 3T MRI, CT & Multispecialty Diagnostics',
    address: '14/2 South Bypass Road, Vannarpettai',
    city: 'Tirunelveli, Tamil Nadu, India',
    latitude: 8.7274,
    longitude: 77.7282,
    phone: '+91 462 2501234',
    email: 'care@rioscan.com',
    ownerId: 'usr_owner_1',
    departments: ['Radiology & Imaging', 'Orthopedics', 'Cardiology', 'Pediatrics', 'General Medicine', 'Pathology'],
    rating: 4.95,
    reviewCount: 2450,
    imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80',
    openingHours: '24/7 Scan Services & OPD (8:00 AM - 9:00 PM)',
    totalDoctors: 28,
  },
  {
    id: 'hosp_metro',
    name: 'Ria Child Care',
    tagline: 'Pediatrics, Neonatal & Child Care Hospital',
    address: '77 High Ground Road, Palayamkottai',
    city: 'Tirunelveli, Tamil Nadu, India',
    latitude: 8.7185,
    longitude: 77.7412,
    phone: '+91 462 2574567',
    email: 'appointments@riachildcare.in',
    ownerId: 'usr_owner_1',
    departments: ['Pediatrics', 'Neonatology', 'Child Development', 'Vaccination'],
    rating: 4.98,
    reviewCount: 1820,
    imageUrl: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=600&auto=format&fit=crop&q=80',
    openingHours: '8:30 AM - 9:00 PM',
    totalDoctors: 14,
  },
  {
    id: 'hosp_children',
    name: 'Upstage Health Multispecialty',
    tagline: 'Joint Care, Orthopedics & Family Medicine',
    address: '25 North Car Street, Murugankurichi',
    city: 'Tirunelveli, Tamil Nadu, India',
    latitude: 8.7301,
    longitude: 77.7198,
    phone: '+91 462 2529900',
    email: 'contact@upstagehealth.in',
    ownerId: 'usr_owner_1',
    departments: ['Orthopedics', 'Cardiology', 'General Medicine', 'Gynecology'],
    rating: 4.88,
    reviewCount: 980,
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
    openingHours: '8:00 AM - 10:00 PM',
    totalDoctors: 18,
  }
];

// Pre-seeded Users with all 4 Roles
export const INITIAL_USERS: UserProfile[] = [
  // 1. Hospital Owner
  {
    id: 'usr_owner_1',
    name: 'Dr. S. K. Arumugam',
    email: 'owner@rioscan.com',
    phone: '+91 94430 11223',
    role: 'owner',
    hospitalId: 'hosp_central',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
    createdAt: '2025-01-10T00:00:00.000Z',
    ownerProfile: {
      title: 'Managing Director & Founder',
      qualification: 'MBBS, MD, DMRD, FICR',
      organization: 'Rio Scan Center & Healthcare Group',
      taxId: 'GSTIN33AAACR7812M1Z2',
      address: '14/2 South Bypass Road, Vannarpettai, Tirunelveli, Tamil Nadu 627003',
      contactPerson: 'S. Ramanathan (Executive Secretary)',
      emergencyContact: '+91 94430 99881',
    },
  },

  // 2. Doctors
  {
    id: 'usr_doc_jenkins',
    name: 'Dr. Preetha Rajesh',
    email: 'doctor@upstagehealth.com', // Demo login for doctor
    phone: '+91 94431 22334',
    role: 'doctor',
    hospitalId: 'hosp_central', // Rio Scan Center
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
    createdAt: '2025-02-01T00:00:00.000Z',
    doctorProfile: {
      specialty: 'Radiology & Imaging',
      qualification: 'MBBS, MD (Radiology), FRCR (London)',
      roomNumber: 'Scan Room 1',
      consultationFee: 800,
      avgConsultationMinutes: 15,
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      timingStart: '09:00 AM',
      timingEnd: '05:00 PM',
      maxTokensPerDay: 40,
      experienceYears: 15,
      rating: 4.97,
      about: 'Senior Consultant Radiologist at Rio Scan Center specializing in Musculoskeletal MRI, Knee Pain Diagnostics, CT Arthrograms, and Ultrasound.',
    }
  },
  {
    id: 'usr_doc_sharma',
    name: 'Dr. Rajesh',
    email: 'sharma@upstagehealth.com',
    phone: '+91 98402 77123',
    role: 'doctor',
    hospitalId: 'hosp_metro', // Ria Child care Tirunelveli, Tamil Nadu, India
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    createdAt: '2025-02-05T00:00:00.000Z',
    doctorProfile: {
      specialty: 'Pediatrics & Child Care',
      qualification: 'MBBS, DCH, MD (Pediatrics)',
      roomNumber: 'Room 101',
      consultationFee: 500,
      avgConsultationMinutes: 15,
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      timingStart: '09:30 AM',
      timingEnd: '06:00 PM',
      maxTokensPerDay: 35,
      experienceYears: 14,
      rating: 4.98,
      about: 'Chief Pediatrician at Ria Child Care Tirunelveli, Tamil Nadu, India. Specialist in child development, immunizations, neonatal care, and pediatric allergy.',
    }
  },
  {
    id: 'usr_doc_elena',
    name: 'Dr. M. Senthil Kumar',
    email: 'elena@upstagehealth.com',
    phone: '+91 94433 44556',
    role: 'doctor',
    hospitalId: 'hosp_central',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80',
    createdAt: '2025-02-10T00:00:00.000Z',
    doctorProfile: {
      specialty: 'Orthopedics & Joint Care',
      qualification: 'MS (Ortho), Fellowship in Arthroscopy & Knee Replacement',
      roomNumber: 'Room 108',
      consultationFee: 600,
      avgConsultationMinutes: 15,
      availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
      timingStart: '09:30 AM',
      timingEnd: '04:30 PM',
      maxTokensPerDay: 40,
      experienceYears: 13,
      rating: 4.92,
      about: 'Senior Orthopedic Consultant specializing in knee osteoarthritis, sports injuries, joint preservation, and spine care.',
    }
  },
  {
    id: 'usr_doc_patel',
    name: 'Dr. Vikram Ramanathan',
    email: 'patel@upstagecitycare.com',
    phone: '+91 94434 55667',
    role: 'doctor',
    hospitalId: 'hosp_central',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
    createdAt: '2025-02-15T00:00:00.000Z',
    doctorProfile: {
      specialty: 'Cardiology & General Medicine',
      qualification: 'MD, DM (Cardiology)',
      roomNumber: 'Room 104',
      consultationFee: 700,
      avgConsultationMinutes: 15,
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      timingStart: '09:00 AM',
      timingEnd: '05:30 PM',
      maxTokensPerDay: 40,
      experienceYears: 16,
      rating: 4.95,
      about: 'Interventional cardiologist specializing in preventive cardiology, hypertension, and cardiovascular health assessments.',
    }
  },
  {
    id: 'usr_doc_davis',
    name: 'Dr. K. Subbulakshmi',
    email: 'davis@upstagecitycare.com',
    phone: '+91 94435 66778',
    role: 'doctor',
    hospitalId: 'hosp_children',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813589-323e20038cb5?w=200&auto=format&fit=crop&q=80',
    createdAt: '2025-02-18T00:00:00.000Z',
    doctorProfile: {
      specialty: 'Obstetrics & Gynecology',
      qualification: 'MS (OB-GYN), DGO',
      roomNumber: 'Room 103',
      consultationFee: 500,
      avgConsultationMinutes: 15,
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      timingStart: '09:00 AM',
      timingEnd: '04:30 PM',
      maxTokensPerDay: 35,
      experienceYears: 18,
      rating: 4.96,
      about: 'Consultant Obstetrician & Gynecologist specializing in maternal-fetal wellness, high-risk pregnancies, and ultrasound diagnostics.',
    }
  },

  // 3. Receptionist
  {
    id: 'usr_recep_maya',
    name: 'Kavitha Murugan',
    email: 'reception@upstagehealth.com', // Demo login for receptionist
    phone: '+91 94432 33445',
    role: 'receptionist',
    hospitalId: 'hosp_central',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    createdAt: '2024-03-15T00:00:00.000Z',
    receptionistProfile: {
      deskNumber: 'Desk 1 (OPD Registration & Token Desk)',
      shift: 'morning',
      employeeId: 'EMP-RIO-2024-088',
      salary: 32000,
      salaryPeriod: 'month',
      basePay: 28000,
      allowance: 3000,
      incentive: 1000,
      bankAccount: 'State Bank of India (•••• 4821)',
      address: 'Plot 42, NGO Colony, Palayamkottai, Tirunelveli, Tamil Nadu, India',
      joiningDate: 'March 15, 2024',
      assignedDoctorId: 'usr_doc_jenkins',
      assignedDoctorName: 'Dr. Preetha Rajesh',
      assignedRoomNumber: 'Scan Room 1',
      assignedDoctorIds: ['usr_doc_jenkins', 'usr_doc_sharma'],
      assignedDoctorNames: ['Dr. Preetha Rajesh', 'Dr. Rajesh'],
      assignedRooms: ['Scan Room 1', 'Room 101'],
      emergencyContact: 'Murugan S (Spouse) • +91 94435 98765',
      bloodGroup: 'B+',
    }
  },

  // 4. Patients
  {
    id: 'usr_patient_john',
    name: 'Gowri T',
    email: 'patient@upstagehealth.com', // Demo login for patient
    phone: '+91 94431 55667',
    role: 'patient',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    createdAt: '2025-03-10T00:00:00.000Z',
    patientProfile: {
      age: 56,
      gender: 'female',
      bloodGroup: 'B+',
      address: 'Plot 18, Thiruvenkatanathapuram, Tirunelveli, Tamil Nadu 627006, India',
      emergencyContact: 'Thiyagarajan S (Son) • +91 98401 22334',
      allergies: ['Penicillin (Skin Rash)', 'Sulfa Drugs'],
      chronicConditions: ['Bilateral Knee Osteoarthritis (Grade 2 - Knee Pain)', 'Mild Hypertension'],
      activeMedications: ['Tab Paracetamol 650mg (SOS for Knee Pain)', 'Tab Glucosamine & Chondroitin (Night)', 'Tab Telmisartan 40mg (Morning)'],
      insuranceProvider: 'Star Health Senior Citizens Red Carpet Insurance',
      insurancePolicyNumber: 'STAR-TN-TIR-8829104',
      insuranceGroupNumber: 'GRP-TN-002918',
      insuranceValidity: 'Dec 31, 2026',
      copayAmount: 100,
    }
  },

  // 5. Scan Delivery Courier
  {
    id: 'usr_delivery_karthik',
    name: 'Karthik Esakkimuthu',
    email: 'delivery@upstagehealth.com',
    phone: '+91 94420 55002',
    role: 'delivery',
    hospitalId: 'hosp_central',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    createdAt: '2025-04-15T00:00:00.000Z',
    deliveryProfile: {
      courierId: 'RIO-DEL-02',
      vehicleType: 'bike',
      vehicleNumber: 'TN-72-AZ-4912',
      activeDeliveryCount: 2,
      currentLatitude: 8.7185,
      currentLongitude: 77.7490,
      contactNumber: '+91 94420 55002',
    },
  },

  // 6. Diagnostics Staff / Technician
  {
    id: 'usr_staff_muthuraj',
    name: 'Muthuraj Paramasivam',
    email: 'staff@upstagehealth.com',
    phone: '+91 97890 33001',
    role: 'staff',
    hospitalId: 'hosp_central',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    createdAt: '2025-01-20T00:00:00.000Z',
    staffProfile: {
      employeeId: 'RIO-RAD-01',
      department: 'Radiology (MRI/CT)',
      floor: 2,
      shift: 'morning',
      baseSalary: 38000,
      joiningDate: '2020-04-10',
      faceRegistered: true,
      bloodGroup: 'O+',
    },
  }
];

// Helper for relative date strings (e.g. 0 for today, -1 for yesterday, 1 for tomorrow)
const getRelativeDateStr = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

// Pre-seeded Today Appointments
export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt_001',
    tokenNumber: 8,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_john',
    patientName: 'Gowri T',
    patientPhone: '+91 94431 55667',
    patientAge: 56,
    patientGender: 'Female',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:30 AM',
    status: 'in_consultation', // Active inside Scan Room 1 with Dr. Preetha Rajesh right now!
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'upi',
    paidAt: '10:15 AM',
    receiptNumber: 'RCP-RIO-081',
    symptoms: 'Severe bilateral knee pain on weight-bearing, morning stiffness for 6 months, swelling in right knee joint',
    scannedReports: [
      {
        id: 'rep_xray_01',
        appointmentId: 'apt_001',
        patientId: 'usr_patient_john',
        patientName: 'Gowri T',
        reportType: 'xray',
        title: 'Bilateral Knee AP & Lateral Digital X-Ray (High Res)',
        fileUri: SAMPLE_CHEST_XRAY,
        notes: 'Scanned by receptionist Desk 1. Medial compartment joint space narrowing with marginal osteophytes noted, consistent with Grade 2 Osteoarthritis.',
        scannedBy: 'Kavitha Murugan (Desk 1)',
        scanDate: 'Today, 10:18 AM',
        filterApplied: 'xray_contrast',
        fileSize: '4.2 MB',
      },
      {
        id: 'rep_blood_01',
        appointmentId: 'apt_001',
        patientId: 'usr_patient_john',
        patientName: 'Gowri T',
        reportType: 'blood_test',
        title: 'Serum Uric Acid & Inflammatory Markers Panel',
        fileUri: SAMPLE_BLOOD_TEST,
        notes: 'Scanned from pathology hardcopy report. Uric acid 4.2 mg/dL (Normal). Fasting blood sugar 96 mg/dL.',
        scannedBy: 'Kavitha Murugan (Desk 1)',
        scanDate: 'Today, 10:20 AM',
        filterApplied: 'document_bw',
        fileSize: '1.8 MB',
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 0,
  },
  {
    id: 'apt_002',
    tokenNumber: 9,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_muthu',
    patientName: 'Muthukumar S',
    patientPhone: '+91 94434 22110',
    patientAge: 48,
    patientGender: 'Male',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:45 AM',
    status: 'checked_in', // Waiting outside Scan Room 1 next!
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'upi',
    paidAt: '10:25 AM',
    receiptNumber: 'RCP-RIO-082',
    symptoms: 'Right knee twisting injury while playing badminton, acute swelling and suspected meniscus tear',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 10,
  },
  {
    id: 'apt_003',
    tokenNumber: 10,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_meenakshi',
    patientName: 'Meenakshi K',
    patientPhone: '+91 98405 33441',
    patientAge: 62,
    patientGender: 'Female',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '11:00 AM',
    status: 'waiting',
    paymentStatus: 'pending', // To be paid at desk
    paymentAmount: 800,
    symptoms: 'Chronic bilateral knee pain, difficulty sitting cross-legged or climbing stairs',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 25,
  },
  {
    id: 'apt_004',
    tokenNumber: 11,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_karthik',
    patientName: 'Karthik R',
    patientPhone: '+91 94436 88776',
    patientAge: 38,
    patientGender: 'Male',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '11:15 AM',
    status: 'booked',
    paymentStatus: 'pending',
    paymentAmount: 800,
    symptoms: 'Persistent lower back pain radiating down left leg, lumbar spine MRI review',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 40,
  },

  // Appointment at Ria Child Care for Dr. Rajesh
  {
    id: 'apt_child_01',
    tokenNumber: 1,
    hospitalId: 'hosp_metro',
    hospitalName: 'Ria Child Care',
    doctorId: 'usr_doc_sharma',
    doctorName: 'Dr. Rajesh',
    doctorSpecialty: 'Pediatrics & Child Care',
    roomNumber: 'Room 101',
    patientId: 'usr_patient_kavin',
    patientName: 'Master Kavin Rajesh',
    patientPhone: '+91 98402 77123',
    patientAge: 4,
    patientGender: 'Male',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '11:30 AM',
    status: 'checked_in',
    paymentStatus: 'paid',
    paymentAmount: 500,
    paymentMethod: 'upi',
    paidAt: '11:15 AM',
    receiptNumber: 'RCP-RIA-001',
    symptoms: 'High fever for 2 days, runny nose, and routine pediatric vaccination review',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 15,
  },
  {
    id: 'apt_child_02',
    tokenNumber: 2,
    hospitalId: 'hosp_metro',
    hospitalName: 'Ria Child Care',
    doctorId: 'usr_doc_sharma',
    doctorName: 'Dr. Rajesh',
    doctorSpecialty: 'Pediatrics & Child Care',
    roomNumber: 'Room 101',
    patientId: 'usr_patient_ananya',
    patientName: 'Baby Ananya S',
    patientPhone: '+91 94433 11880',
    patientAge: 1,
    patientGender: 'Female',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    status: 'in_consultation',
    paymentStatus: 'paid',
    paymentAmount: 500,
    paymentMethod: 'gpay',
    paidAt: '09:50 AM',
    receiptNumber: 'GPAY-RIA-002',
    symptoms: '6-month routine developmental assessment and DPT booster immunization',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 0,
  },

  // Today Appointments for Dr. M. Senthil Kumar (Orthopedics - Room 108)
  {
    id: 'apt_ortho_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_elena',
    doctorName: 'Dr. M. Senthil Kumar',
    doctorSpecialty: 'Orthopedics & Joint Care',
    roomNumber: 'Room 108',
    patientId: 'usr_patient_bala',
    patientName: 'Balasubramanian T',
    patientPhone: '+91 94430 88211',
    patientAge: 61,
    patientGender: 'Male',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '09:30 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 600,
    paymentMethod: 'upi',
    paidAt: '09:15 AM',
    receiptNumber: 'RCP-RIO-1081',
    symptoms: 'Post-op 6 weeks knee arthroscopy checkup and rehabilitation review',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 0,
  },
  {
    id: 'apt_ortho_02',
    tokenNumber: 2,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_elena',
    doctorName: 'Dr. M. Senthil Kumar',
    doctorSpecialty: 'Orthopedics & Joint Care',
    roomNumber: 'Room 108',
    patientId: 'usr_patient_sundaram',
    patientName: 'Sundaram V',
    patientPhone: '+91 94432 44551',
    patientAge: 54,
    patientGender: 'Male',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:15 AM',
    status: 'in_consultation',
    paymentStatus: 'paid',
    paymentAmount: 600,
    paymentMethod: 'card',
    paidAt: '10:00 AM',
    receiptNumber: 'RCP-RIO-1082',
    symptoms: 'Right shoulder rotator cuff impingement, severe pain when lifting arm',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 0,
  },
  {
    id: 'apt_ortho_03',
    tokenNumber: 3,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_elena',
    doctorName: 'Dr. M. Senthil Kumar',
    doctorSpecialty: 'Orthopedics & Joint Care',
    roomNumber: 'Room 108',
    patientId: 'usr_patient_gomathi',
    patientName: 'Gomathi S',
    patientPhone: '+91 98401 77332',
    patientAge: 46,
    patientGender: 'Female',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '11:00 AM',
    status: 'waiting',
    paymentStatus: 'paid',
    paymentAmount: 600,
    paymentMethod: 'upi',
    paidAt: '10:45 AM',
    receiptNumber: 'RCP-RIO-1083',
    symptoms: 'L4-L5 lumbar disc bulge, burning lower back and leg radiculopathy',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 20,
  },

  // Today Appointments for Dr. Vikram Ramanathan (Cardiology - Room 104)
  {
    id: 'apt_cardio_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_patel',
    doctorName: 'Dr. Vikram Ramanathan',
    doctorSpecialty: 'Cardiology & General Medicine',
    roomNumber: 'Room 104',
    patientId: 'usr_patient_krishnan',
    patientName: 'Krishnan G',
    patientPhone: '+91 94431 88992',
    patientAge: 65,
    patientGender: 'Male',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '09:15 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 700,
    paymentMethod: 'upi',
    paidAt: '09:00 AM',
    receiptNumber: 'RCP-RIO-1041',
    symptoms: 'Essential hypertension routine quarterly check, BP 140/88 mmHg review',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 0,
  },
  {
    id: 'apt_cardio_02',
    tokenNumber: 2,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_patel',
    doctorName: 'Dr. Vikram Ramanathan',
    doctorSpecialty: 'Cardiology & General Medicine',
    roomNumber: 'Room 104',
    patientId: 'usr_patient_rajeshwari',
    patientName: 'Rajeshwari K',
    patientPhone: '+91 94435 66110',
    patientAge: 59,
    patientGender: 'Female',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:30 AM',
    status: 'in_consultation',
    paymentStatus: 'paid',
    paymentAmount: 700,
    paymentMethod: 'card',
    paidAt: '10:15 AM',
    receiptNumber: 'RCP-RIO-1042',
    symptoms: 'Exertional breathlessness and mild chest palpitations after walking uphill',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 0,
  },
  {
    id: 'apt_cardio_03',
    tokenNumber: 3,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_patel',
    doctorName: 'Dr. Vikram Ramanathan',
    doctorSpecialty: 'Cardiology & General Medicine',
    roomNumber: 'Room 104',
    patientId: 'usr_patient_subramaniam_n',
    patientName: 'Subramaniam N',
    patientPhone: '+91 98402 33118',
    patientAge: 53,
    patientGender: 'Male',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '11:15 AM',
    status: 'waiting',
    paymentStatus: 'pending',
    paymentAmount: 700,
    symptoms: 'Routine lipid panel review, fasting cholesterol 230 mg/dL consultation',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 25,
  },

  // Completed Records for Today (Sep 26, 2026)
  {
    id: 'apt_today_comp_1',
    tokenNumber: 5,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_annamalai',
    patientName: 'Annamalai R',
    patientPhone: '+91 94435 77199',
    patientAge: 58,
    patientGender: 'Male',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '09:15 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'gpay',
    paidAt: '09:05 AM',
    receiptNumber: 'GPAY-RIO-992144',
    symptoms: 'Right knee joint crepitus, severe pain while walking downhill, difficulty standing',
    consultationNotes: 'Bilateral Knee Osteoarthritis with Medial Meniscal Degeneration. Recommended isometric quad exercises and joint supplement therapy.',
    prescription: {
      diagnosis: 'Bilateral Knee Osteoarthritis (Grade 2) & Medial Joint Crepitus',
      medicines: [
        { id: 'm_mb1', name: 'Tab Aceclofenac + Paracetamol', dosage: '100mg + 325mg', frequency: '1-0-1 (After Food)', duration: '7 Days', instructions: 'Take with food for knee pain relief' },
        { id: 'm_mb2', name: 'Tab Glucosamine + Diacerein', dosage: '1 Tab', frequency: '0-0-1 (Night)', duration: '60 Days', instructions: 'Take post dinner with warm water' },
        { id: 'm_mb3', name: 'Joint Pain Relief Gel', dosage: 'Topical', frequency: 'Twice daily', duration: '30 Days', instructions: 'Apply gently around right knee' },
      ],
      clinicalAdvice: 'Avoid sitting cross-legged on floor. Use Indian western commode. Repeat digital X-Ray review in 6 months.',
      issuedAt: '09:35 AM',
      doctorSignature: 'Dr. Preetha Rajesh, MD (Radiology), FRCR',
    },
    scannedReports: [
      {
        id: 'rep_mb_1',
        appointmentId: 'apt_today_comp_1',
        patientId: 'usr_patient_annamalai',
        patientName: 'Annamalai R',
        reportType: 'blood_test',
        title: 'Serum Calcium, Uric Acid & ESR Panel',
        fileUri: SAMPLE_BLOOD_TEST,
        notes: 'Uric acid 4.8 mg/dL. ESR 22 mm/hr. No inflammatory arthropathy.',
        scannedBy: 'Kavitha Murugan (Desk 1)',
        scanDate: 'Today, 08:50 AM',
        filterApplied: 'document_bw',
        fileSize: '1.6 MB',
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_today_comp_2',
    tokenNumber: 6,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_lakshmi',
    patientName: 'Lakshmi Narayanan',
    patientPhone: '+91 98402 66411',
    patientAge: 50,
    patientGender: 'Female',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '09:40 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'card',
    paidAt: '09:30 AM',
    receiptNumber: 'RCP-RIO-88410',
    symptoms: 'Swelling above the kneecap with tenderness upon touch after a long bus journey',
    consultationNotes: 'High-frequency ultrasound demonstrates suprapatellar bursal fluid accumulation without internal debris. Suprapatellar bursitis.',
    prescription: {
      diagnosis: 'Right Knee Suprapatellar Bursitis & Mild Joint Effusion',
      medicines: [
        { id: 'm_sr1', name: 'Tab Trypsin Chymotrypsin', dosage: '100,000 Units', frequency: '1-0-1 (Before Food)', duration: '10 Days', instructions: 'Take 30 mins before food' },
        { id: 'm_sr2', name: 'Tab Etoricoxib', dosage: '90 mg', frequency: '0-1-0 (After Lunch)', duration: '5 Days', instructions: 'Take after lunch' },
      ],
      clinicalAdvice: 'Ice pack compression 15 mins twice daily. Knee immobilization sleeve for 5 days.',
      issuedAt: '10:00 AM',
      doctorSignature: 'Dr. Preetha Rajesh, MD (Radiology), FRCR',
    },
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_today_comp_3',
    tokenNumber: 7,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_sangeetha',
    patientName: 'Sangeetha M',
    patientPhone: '+91 94431 33899',
    patientAge: 42,
    patientGender: 'Female',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:05 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'cash',
    paidAt: '09:55 AM',
    receiptNumber: 'RCP-RIO-77201',
    symptoms: 'Anterior knee pain during walking, jumping, and climbing stairs',
    consultationNotes: 'Knee ultrasound indicates proximal patellar tendon thickening with micro-tears. Patellar tendinopathy (Jumper knee).',
    prescription: {
      diagnosis: 'Patellar Tendinopathy (Right Knee)',
      medicines: [
        { id: 'm_hg1', name: 'Tab Collagen Peptide + Vitamin C', dosage: '1 Sachet', frequency: '1-0-0 (Morning)', duration: '30 Days', instructions: 'Dissolve in glass of water' },
        { id: 'm_hg2', name: 'Tab Paracetamol', dosage: '650 mg', frequency: 'SOS', duration: '10 Days', instructions: 'Take only when knee pain is severe' },
      ],
      clinicalAdvice: 'Eccentric decline squat training with physical therapist. Avoid high impact activities.',
      issuedAt: '10:25 AM',
      doctorSignature: 'Dr. Preetha Rajesh, MD (Radiology), FRCR',
    },
    scannedReports: [
      {
        id: 'rep_hg_1',
        appointmentId: 'apt_today_comp_3',
        patientId: 'usr_patient_sangeetha',
        patientName: 'Sangeetha M',
        reportType: 'xray',
        title: 'Knee Skyline & Lateral View Radiograph',
        fileUri: SAMPLE_CHEST_XRAY,
        notes: 'Normal patellofemoral tracking, no bony spurs or avulsion fractures.',
        scannedBy: 'Kavitha Murugan (Desk 1)',
        scanDate: 'Today, 09:50 AM',
        filterApplied: 'xray_contrast',
        fileSize: '2.4 MB',
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Completed Records for Yesterday (Sep 25, 2026)
  {
    id: 'apt_yesterday_1',
    tokenNumber: 12,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_clara',
    patientName: 'Deepa R',
    patientPhone: '+91 94432 78244',
    patientAge: 44,
    patientGender: 'Female',
    appointmentDate: getRelativeDateStr(-1),
    timeSlot: '11:30 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'upi',
    paidAt: '11:15 AM',
    receiptNumber: 'RCP-RIO-66512',
    symptoms: 'Persistent knee ache and stiffness on waking up in the morning',
    consultationNotes: 'Ultrasound confirms mild joint effusion and early cartilage thinning on medial condyle.',
    prescription: {
      diagnosis: 'Early Knee Joint Degenerative Disease (Grade 1)',
      medicines: [
        { id: 'm_co1', name: 'Tab Glucosamine Sulfate', dosage: '1500 mg', frequency: '0-0-1 (Night)', duration: '90 Days', instructions: 'Take after dinner' },
        { id: 'm_co2', name: 'Tab Vitamin D3', dosage: '60,000 IU', frequency: 'Once weekly', duration: '8 Weeks', instructions: 'Take with warm milk' },
      ],
      clinicalAdvice: 'Daily 20 mins brisk walking on flat surface. Avoid sudden squats.',
      issuedAt: '11:55 AM',
      doctorSignature: 'Dr. Preetha Rajesh, MD (Radiology), FRCR',
    },
    scannedReports: [
      {
        id: 'rep_co_1',
        appointmentId: 'apt_yesterday_1',
        patientId: 'usr_patient_clara',
        patientName: 'Deepa R',
        reportType: 'blood_test',
        title: 'Vitamin D3 & Calcium Panel',
        fileUri: SAMPLE_BLOOD_TEST,
        notes: 'Vitamin D3 18.2 ng/mL (Deficient). Serum Calcium 9.1 mg/dL.',
        scannedBy: 'Kavitha Murugan (Desk 1)',
        scanDate: '25 Sep 2026, 11:05 AM',
        filterApplied: 'document_bw',
        fileSize: '1.5 MB',
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_yesterday_2',
    tokenNumber: 15,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_robert_v',
    patientName: 'Murugesan P',
    patientPhone: '+91 94430 90122',
    patientAge: 57,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(-1),
    timeSlot: '03:15 PM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'gpay',
    paidAt: '03:00 PM',
    receiptNumber: 'GPAY-RIO-881920',
    symptoms: 'Follow-up for knee joint cartilage evaluation and MRI scan report review',
    consultationNotes: '3T MRI of left knee shows intact cruciate ligaments, minor medial meniscus degenerative fraying.',
    prescription: {
      diagnosis: 'Left Knee Meniscal Degeneration without mechanical block',
      medicines: [
        { id: 'm_rv1', name: 'Tab Diacerein', dosage: '50 mg', frequency: '0-1-0', duration: '90 Days', instructions: 'Daily after lunch' },
        { id: 'm_rv2', name: 'Tab Calcium Carbonate + D3', dosage: '500 mg', frequency: '0-0-1', duration: '90 Days', instructions: 'Daily after dinner' },
      ],
      clinicalAdvice: 'Physical rehabilitation for hamstrings and vastus medialis strengthening.',
      issuedAt: '03:40 PM',
      doctorSignature: 'Dr. Preetha Rajesh, MD (Radiology), FRCR',
    },
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // ─── Additional Date-wise Historical Appointments for Revenue & Financial Reports ───
  // Yesterday: Dr. M. Senthil Kumar (Orthopedics)
  {
    id: 'apt_ortho_yest_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_elena',
    doctorName: 'Dr. M. Senthil Kumar',
    doctorSpecialty: 'Orthopedics & Joint Care',
    roomNumber: 'Room 108',
    patientId: 'usr_patient_arumugam',
    patientName: 'M. Arumugaperumal',
    patientPhone: '+91 94430 77112',
    patientAge: 63,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(-1),
    timeSlot: '10:00 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 600,
    paymentMethod: 'upi',
    paidAt: '09:45 AM',
    receiptNumber: 'RCP-RIO-1084',
    symptoms: 'Bilateral knee joint pain, osteophyte assessment',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_ortho_yest_02',
    tokenNumber: 2,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_elena',
    doctorName: 'Dr. M. Senthil Kumar',
    doctorSpecialty: 'Orthopedics & Joint Care',
    roomNumber: 'Room 108',
    patientId: 'usr_patient_radha',
    patientName: 'Radha Krishnan',
    patientPhone: '+91 94432 11988',
    patientAge: 51,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(-1),
    timeSlot: '11:30 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 600,
    paymentMethod: 'cash',
    paidAt: '11:15 AM',
    receiptNumber: 'RCP-RIO-1085',
    symptoms: 'Tennis elbow, right lateral epicondyle tendinitis',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Yesterday: Dr. Vikram Ramanathan (Cardiology)
  {
    id: 'apt_cardio_yest_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_patel',
    doctorName: 'Dr. Vikram Ramanathan',
    doctorSpecialty: 'Cardiology & General Medicine',
    roomNumber: 'Room 104',
    patientId: 'usr_patient_sankaran',
    patientName: 'P. Sankaran',
    patientPhone: '+91 94431 33221',
    patientAge: 68,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(-1),
    timeSlot: '09:30 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 700,
    paymentMethod: 'gpay',
    paidAt: '09:15 AM',
    receiptNumber: 'RCP-RIO-1044',
    symptoms: 'Hypertension monitoring and 2D Echocardiogram review',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_cardio_yest_02',
    tokenNumber: 2,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_patel',
    doctorName: 'Dr. Vikram Ramanathan',
    doctorSpecialty: 'Cardiology & General Medicine',
    roomNumber: 'Room 104',
    patientId: 'usr_patient_vasantha',
    patientName: 'K. Vasantha',
    patientPhone: '+91 98402 44331',
    patientAge: 59,
    patientGender: 'Female',
    appointmentDate: getRelativeDateStr(-1),
    timeSlot: '11:15 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 700,
    paymentMethod: 'upi',
    paidAt: '11:00 AM',
    receiptNumber: 'RCP-RIO-1045',
    symptoms: 'Post-prandial dyspnea and lipid panel check',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // 2 Days Ago: Multi-Doctor Collections
  {
    id: 'apt_doc1_2days_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_ananthi',
    patientName: 'Ananthi Vijay',
    patientPhone: '+91 94431 66554',
    patientAge: 48,
    patientGender: 'Female',
    appointmentDate: getRelativeDateStr(-2),
    timeSlot: '09:45 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'upi',
    paidAt: '09:30 AM',
    receiptNumber: 'RCP-RIO-071',
    symptoms: 'Pelvic ultrasound study and fatty liver screening',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_doc1_2days_02',
    tokenNumber: 2,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_karthik_s',
    patientName: 'Karthikeyan S',
    patientPhone: '+91 94433 99882',
    patientAge: 38,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(-2),
    timeSlot: '11:30 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'cash',
    paidAt: '11:15 AM',
    receiptNumber: 'RCP-RIO-072',
    symptoms: 'Cervical spine MRI scan analysis',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_ortho_2days_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_elena',
    doctorName: 'Dr. M. Senthil Kumar',
    doctorSpecialty: 'Orthopedics & Joint Care',
    roomNumber: 'Room 108',
    patientId: 'usr_patient_selva',
    patientName: 'Selvamurugan N',
    patientPhone: '+91 98401 55662',
    patientAge: 55,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(-2),
    timeSlot: '10:15 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 600,
    paymentMethod: 'upi',
    paidAt: '10:00 AM',
    receiptNumber: 'RCP-RIO-1071',
    symptoms: 'Right hip joint osteoarthritis consult',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_ortho_2days_02',
    tokenNumber: 2,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_elena',
    doctorName: 'Dr. M. Senthil Kumar',
    doctorSpecialty: 'Orthopedics & Joint Care',
    roomNumber: 'Room 108',
    patientId: 'usr_patient_vijaya',
    patientName: 'Vijayalakshmi G',
    patientPhone: '+91 94430 44221',
    patientAge: 58,
    patientGender: 'Female',
    appointmentDate: getRelativeDateStr(-2),
    timeSlot: '12:00 PM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 600,
    paymentMethod: 'card',
    paidAt: '11:45 AM',
    receiptNumber: 'RCP-RIO-1072',
    symptoms: 'Carpal tunnel syndrome bilateral wrist splint check',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_cardio_2days_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_patel',
    doctorName: 'Dr. Vikram Ramanathan',
    doctorSpecialty: 'Cardiology & General Medicine',
    roomNumber: 'Room 104',
    patientId: 'usr_patient_devaki',
    patientName: 'Devaki Raman',
    patientPhone: '+91 94432 88110',
    patientAge: 62,
    patientGender: 'Female',
    appointmentDate: getRelativeDateStr(-2),
    timeSlot: '09:15 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 700,
    paymentMethod: 'upi',
    paidAt: '09:00 AM',
    receiptNumber: 'RCP-RIO-1031',
    symptoms: 'Palpitations, Holter monitor report consultation',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_cardio_2days_02',
    tokenNumber: 2,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_patel',
    doctorName: 'Dr. Vikram Ramanathan',
    doctorSpecialty: 'Cardiology & General Medicine',
    roomNumber: 'Room 104',
    patientId: 'usr_patient_mano',
    patientName: 'Manoharan T',
    patientPhone: '+91 98403 22119',
    patientAge: 53,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(-2),
    timeSlot: '10:45 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 700,
    paymentMethod: 'gpay',
    paidAt: '10:30 AM',
    receiptNumber: 'RCP-RIO-1032',
    symptoms: 'Post-TMT evaluation and coronary risk profiling',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // 3 Days Ago: Multi-Doctor Collections
  {
    id: 'apt_doc1_3days_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_ponraj',
    patientName: 'Ponraj V',
    patientPhone: '+91 94431 12345',
    patientAge: 60,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(-3),
    timeSlot: '10:00 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'gpay',
    paidAt: '09:45 AM',
    receiptNumber: 'RCP-RIO-061',
    symptoms: 'Whole Abdomen Ultrasound and Gallstone check',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_doc1_3days_02',
    tokenNumber: 2,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_revathi',
    patientName: 'Revathi S',
    patientPhone: '+91 98402 99112',
    patientAge: 42,
    patientGender: 'Female',
    appointmentDate: getRelativeDateStr(-3),
    timeSlot: '02:30 PM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'upi',
    paidAt: '02:15 PM',
    receiptNumber: 'RCP-RIO-062',
    symptoms: 'Thyroid nodule USG elastography report',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_ortho_3days_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_elena',
    doctorName: 'Dr. M. Senthil Kumar',
    doctorSpecialty: 'Orthopedics & Joint Care',
    roomNumber: 'Room 108',
    patientId: 'usr_patient_kannan',
    patientName: 'Kannan M',
    patientPhone: '+91 94430 55119',
    patientAge: 50,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(-3),
    timeSlot: '09:30 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 600,
    paymentMethod: 'cash',
    paidAt: '09:15 AM',
    receiptNumber: 'RCP-RIO-1061',
    symptoms: 'Ankle sprain ligament laxity evaluation',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_cardio_3days_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_patel',
    doctorName: 'Dr. Vikram Ramanathan',
    doctorSpecialty: 'Cardiology & General Medicine',
    roomNumber: 'Room 104',
    patientId: 'usr_patient_saraswathi',
    patientName: 'Saraswathi K',
    patientPhone: '+91 94431 77665',
    patientAge: 67,
    patientGender: 'Female',
    appointmentDate: getRelativeDateStr(-3),
    timeSlot: '10:30 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 700,
    paymentMethod: 'card',
    paidAt: '10:15 AM',
    receiptNumber: 'RCP-RIO-1021',
    symptoms: 'Atrial fibrillation medication review and INR titration',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // 4 Days Ago: Multi-Doctor Collections
  {
    id: 'apt_doc1_4days_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_naveen',
    patientName: 'Naveen Kumar',
    patientPhone: '+91 98401 22339',
    patientAge: 29,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(-4),
    timeSlot: '11:00 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'upi',
    paidAt: '10:45 AM',
    receiptNumber: 'RCP-RIO-051',
    symptoms: 'Right knee ACL tear post-football injury MRI review',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_ortho_4days_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_elena',
    doctorName: 'Dr. M. Senthil Kumar',
    doctorSpecialty: 'Orthopedics & Joint Care',
    roomNumber: 'Room 108',
    patientId: 'usr_patient_thangavel',
    patientName: 'Thangavel P',
    patientPhone: '+91 94432 66778',
    patientAge: 64,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(-4),
    timeSlot: '10:00 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 600,
    paymentMethod: 'upi',
    paidAt: '09:45 AM',
    receiptNumber: 'RCP-RIO-1051',
    symptoms: 'Knee joint hyaluronic acid injection follow-up',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // 5 Days Ago: Multi-Doctor Collections
  {
    id: 'apt_doc1_5days_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_gopinath',
    patientName: 'Gopinath E',
    patientPhone: '+91 94430 11993',
    patientAge: 51,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(-5),
    timeSlot: '09:15 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'cash',
    paidAt: '09:00 AM',
    receiptNumber: 'RCP-RIO-041',
    symptoms: 'Lumbar spondylosis and facet joint arthropathy review',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt_cardio_5days_01',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_patel',
    doctorName: 'Dr. Vikram Ramanathan',
    doctorSpecialty: 'Cardiology & General Medicine',
    roomNumber: 'Room 104',
    patientId: 'usr_patient_venkatesan',
    patientName: 'Venkatesan R',
    patientPhone: '+91 98402 33441',
    patientAge: 61,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(-5),
    timeSlot: '11:30 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 700,
    paymentMethod: 'upi',
    paidAt: '11:15 AM',
    receiptNumber: 'RCP-RIO-1011',
    symptoms: 'Post-angioplasty 6-month routine cardiology review',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Booked Appointments for Tomorrow
  {
    id: 'apt_tomorrow_1',
    tokenNumber: 1,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_ramesh',
    patientName: 'Ramesh Kumar S',
    patientPhone: '+91 94432 99881',
    patientAge: 52,
    patientGender: 'Male',
    appointmentDate: getRelativeDateStr(1),
    timeSlot: '10:00 AM',
    status: 'booked',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'upi',
    symptoms: 'Follow-up consultation for right knee MRI review and cartilage assessment',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 0,
  },
  {
    id: 'apt_tomorrow_2',
    tokenNumber: 2,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_priya',
    patientName: 'Priya Soundar',
    patientPhone: '+91 98402 11994',
    patientAge: 34,
    patientGender: 'Female',
    appointmentDate: getRelativeDateStr(1),
    timeSlot: '11:30 AM',
    status: 'booked',
    paymentStatus: 'pending',
    paymentAmount: 800,
    symptoms: 'Anterior knee pain after half marathon, ultrasound study scheduled',
    scannedReports: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedWaitMinutes: 15,
  },

  // Completed Records for Sep 22, 2026
  {
    id: 'apt_sep22_1',
    tokenNumber: 9,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_nina',
    patientName: 'Nithya Selvaraj',
    patientPhone: '+91 94431 55499',
    patientAge: 31,
    patientGender: 'Female',
    appointmentDate: '2026-09-22',
    timeSlot: '10:20 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'card',
    paidAt: '10:05 AM',
    receiptNumber: 'RCP-RIO-55198',
    symptoms: 'Right ankle & knee sprain sustained during Bharatnatyam dance practice',
    consultationNotes: 'Ultrasound confirms mild anterior talofibular ligament strain, knee joints structurally intact.',
    prescription: {
      diagnosis: 'Ligament Strain & Tendon Overuse (Right Lower Limb)',
      medicines: [
        { id: 'm_np1', name: 'Tab Aceclofenac + Serratiopeptidase', dosage: '1 Tab', frequency: '1-0-1 (After Meals)', duration: '7 Days', instructions: 'Take with breakfast and dinner' },
        { id: 'm_np2', name: 'Elastic Compression Bandage', dosage: 'Application', frequency: 'Day time', duration: '14 Days', instructions: 'Wrap snug but not too tight' },
      ],
      clinicalAdvice: 'Rest from high impact dance routines for 14 days. Ankle mobility drills.',
      issuedAt: '10:45 AM',
      doctorSignature: 'Dr. Preetha Rajesh, MD (Radiology), FRCR',
    },
    scannedReports: [],
    createdAt: '2026-09-22T08:00:00.000Z',
    updatedAt: '2026-09-22T10:50:00.000Z',
  },

  // Completed Records for Sep 18, 2026
  {
    id: 'apt_sep18_1',
    tokenNumber: 11,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_arthur',
    patientName: 'Subramanian K',
    patientPhone: '+91 94432 23100',
    patientAge: 68,
    patientGender: 'Male',
    appointmentDate: '2026-09-18',
    timeSlot: '02:45 PM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'gpay',
    paidAt: '02:30 PM',
    receiptNumber: 'GPAY-RIO-772910',
    symptoms: 'Severe bilateral knee stiffness and bowing of legs (Genu Varum deformity)',
    consultationNotes: 'Bilateral Weight-Bearing Full Length Leg Radiographs show severe medial compartment collapse (Grade 3-4 Osteoarthritis).',
    prescription: {
      diagnosis: 'Advanced Bilateral Knee Osteoarthritis with Genu Varum Deformity',
      medicines: [
        { id: 'm_ak1', name: 'Tab Tramadol + Paracetamol', dosage: '37.5/325 mg', frequency: '1-0-1', duration: '10 Days', instructions: 'Space 12 hours apart for severe knee pain' },
        { id: 'm_ak2', name: 'Tab Pantoprazole', dosage: '40 mg', frequency: '1-0-0 (Morning)', duration: '14 Days', instructions: 'Take early morning before breakfast' },
      ],
      clinicalAdvice: 'Referred to Orthopedic Joint Replacement team for Total Knee Arthroplasty (TKA) evaluation.',
      issuedAt: '03:15 PM',
      doctorSignature: 'Dr. Preetha Rajesh, MD (Radiology), FRCR',
    },
    scannedReports: [
      {
        id: 'rep_ak_1',
        appointmentId: 'apt_sep18_1',
        patientId: 'usr_patient_arthur',
        patientName: 'Subramanian K',
        reportType: 'xray',
        title: 'Weight-Bearing Bilateral Knee Digital Radiograph',
        fileUri: SAMPLE_CHEST_XRAY,
        notes: 'Severe medial joint space obliteration, prominent marginal osteophytes, subchondral sclerosis.',
        scannedBy: 'Kavitha Murugan (Desk 1)',
        scanDate: '18 Sep 2026, 02:20 PM',
        filterApplied: 'xray_contrast',
        fileSize: '2.8 MB',
      }
    ],
    createdAt: '2026-09-18T13:00:00.000Z',
    updatedAt: '2026-09-18T15:20:00.000Z',
  },

  // Past Visits for Gowri T (for rich visit history)
  {
    id: 'apt_john_past_1',
    tokenNumber: 14,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_elena',
    doctorName: 'Dr. M. Senthil Kumar',
    doctorSpecialty: 'Orthopedics & Joint Care',
    roomNumber: 'Room 108',
    patientId: 'usr_patient_john',
    patientName: 'Gowri T',
    patientPhone: '+91 94431 55667',
    patientAge: 56,
    patientGender: 'Female',
    appointmentDate: '2026-08-14',
    timeSlot: '02:30 PM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 600,
    paymentMethod: 'upi',
    paidAt: '02:15 PM',
    receiptNumber: 'RCP-RIO-78912',
    symptoms: 'Right knee joint swelling and stiffness following temple pilgrimage walking, tenderness along joint line',
    consultationNotes: 'Bilateral knee osteoarthritis Grade 2. Advised knee brace, weight reduction, quadriceps physiotherapy.',
    prescription: {
      diagnosis: 'Bilateral Knee Osteoarthritis (Knee Pain Exacerbation)',
      medicines: [
        { id: 'm1', name: 'Tab Aceclofenac', dosage: '100mg', frequency: '1-0-1 (After Meals)', duration: '5 days', instructions: 'Take with full glass of water' },
        { id: 'm2', name: 'Knee Joint Pain Gel', dosage: 'Local', frequency: 'Twice daily', duration: '14 days', instructions: 'Apply gently over knee' },
      ],
      clinicalAdvice: 'Avoid sitting on floor. Apply warm fermentation at night. Isometric quad exercises.',
      issuedAt: '2026-08-14T15:00:00.000Z',
    },
    scannedReports: [],
    createdAt: '2026-08-14T09:00:00.000Z',
    updatedAt: '2026-08-14T15:15:00.000Z',
  },
  {
    id: 'apt_john_past_2',
    tokenNumber: 4,
    hospitalId: 'hosp_central',
    hospitalName: 'Rio Scan Center',
    doctorId: 'usr_doc_jenkins',
    doctorName: 'Dr. Preetha Rajesh',
    doctorSpecialty: 'Radiology & Imaging',
    roomNumber: 'Scan Room 1',
    patientId: 'usr_patient_john',
    patientName: 'Gowri T',
    patientPhone: '+91 94431 55667',
    patientAge: 56,
    patientGender: 'Female',
    appointmentDate: '2026-05-20',
    timeSlot: '09:30 AM',
    status: 'completed',
    paymentStatus: 'paid',
    paymentAmount: 800,
    paymentMethod: 'cash',
    paidAt: '09:10 AM',
    receiptNumber: 'RCP-RIO-64120',
    symptoms: 'High resolution ultrasound examination of both knee joints for swelling and knee pain',
    consultationNotes: 'Mild joint effusion in right suprapatellar pouch. Cartilage thinning noted over medial femoral condyle.',
    prescription: {
      diagnosis: 'Mild Suprapatellar Effusion & Early Knee Osteoarthritis',
      medicines: [
        { id: 'm3', name: 'Tab Glucosamine & Chondroitin', dosage: '1 Tab', frequency: '0-0-1', duration: '60 days', instructions: 'Daily after dinner' },
      ],
      clinicalAdvice: 'Follow up with orthopedics. Daily 20 mins low-impact walking on level ground.',
      issuedAt: '2026-05-20T10:00:00.000Z',
    },
    scannedReports: [],
    createdAt: '2026-05-20T08:30:00.000Z',
    updatedAt: '2026-05-20T10:15:00.000Z',
  }
];

// Room Queue for Doctor Preetha Rajesh (Scan Room 1 - Rio Scan Center)
export const INITIAL_ROOM_QUEUE: RoomQueue = {
  id: 'queue_hosp_central_usr_doc_jenkins',
  hospitalId: 'hosp_central',
  hospitalName: 'Rio Scan Center',
  doctorId: 'usr_doc_jenkins',
  doctorName: 'Dr. Preetha Rajesh',
  roomNumber: 'Scan Room 1',
  specialty: 'Radiology & Imaging',
  date: new Date().toISOString().split('T')[0],
  currentToken: 8,
  nextToken: 9,
  totalWaiting: 3,
  totalCompleted: 7,
  status: 'active',
  lastCalledAt: '10:30 AM',
  upcomingTokens: [
    { tokenNumber: 9, patientName: 'Muthukumar S', timeSlot: '10:45 AM', status: 'checked_in' },
    { tokenNumber: 10, patientName: 'Meenakshi K', timeSlot: '11:00 AM', status: 'waiting' },
    { tokenNumber: 11, patientName: 'Karthik R', timeSlot: '11:15 AM', status: 'booked' },
  ]
};

export const DEFAULT_DOCTOR_SLOTS = [
  '09:30 AM',
  '10:15 AM',
  '11:00 AM',
  '11:45 AM',
  '02:00 PM',
  '03:30 PM',
  '04:15 PM',
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  // 1. Patient Notifications (Gowri T)
  {
    id: 'notif_pat_1',
    recipientId: 'usr_patient_john',
    recipientRole: 'patient',
    type: 'appointment_confirmed',
    title: '✅ Appointment Confirmed • Token #8',
    message: 'Your knee scan consultation with Dr. Preetha Rajesh is scheduled for Today at 10:30 AM (Scan Room 1).',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    tokenNumber: 8,
    metadata: {
      patientName: 'Gowri T',
      doctorName: 'Dr. Preetha Rajesh',
      roomNumber: 'Scan Room 1',
      time: '10:30 AM',
    }
  },
  {
    id: 'notif_pat_2',
    recipientId: 'usr_patient_john',
    recipientRole: 'patient',
    type: 'appointment_reminder',
    title: '⏰ Upcoming Appointment Reminder',
    message: 'Friendly reminder: Your consultation with Dr. Preetha Rajesh is today at 10:30 AM. Please arrive 15 minutes early.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false,
    tokenNumber: 8,
    metadata: {
      patientName: 'Gowri T',
      doctorName: 'Dr. Preetha Rajesh',
      roomNumber: 'Scan Room 1',
      time: '10:30 AM',
    }
  },
  {
    id: 'notif_pat_3',
    recipientId: 'usr_patient_john',
    recipientRole: 'patient',
    type: 'payment_received',
    title: '💳 Payment Received: ₹800.00',
    message: 'Payment of ₹800 for Token #8 settled via UPI. Receipt #RCP-RIO-98421 generated.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: true,
    tokenNumber: 8,
    metadata: {
      amount: 800,
      receiptNumber: 'RCP-RIO-98421',
      method: 'UPI',
    }
  },
  {
    id: 'notif_pat_4',
    recipientId: 'usr_patient_john',
    recipientRole: 'patient',
    type: 'report_attached',
    title: '🩻 Diagnostic Report Ready',
    message: 'Bilateral Knee Digital Radiography & Blood ESR Report signed off by radiologist.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    metadata: {
      reportTitle: 'Digital Radiography (Bilateral Knee)',
    }
  },

  // 2. Doctor Notifications (Dr. Preetha Rajesh)
  {
    id: 'notif_doc_1',
    recipientId: 'usr_doc_jenkins',
    recipientRole: 'doctor',
    type: 'appointment_booked',
    title: '🩺 New Appointment: Token #12',
    message: 'Gowri T (56y/F) booked for 11:15 AM. Symptoms: Right knee joint pain and swelling.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false,
    tokenNumber: 12,
    metadata: {
      patientName: 'Gowri T',
      doctorName: 'Dr. Preetha Rajesh',
      time: '11:15 AM',
    }
  },
  {
    id: 'notif_doc_2',
    recipientId: 'usr_doc_jenkins',
    recipientRole: 'doctor',
    type: 'queue_turn_called',
    title: '🚶 Patient Waiting in OPD Lobby',
    message: 'Token #8 (Gowri T) has checked in and is ready in lobby for Scan Room 1.',
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    read: false,
    tokenNumber: 8,
    metadata: {
      patientName: 'Gowri T',
      roomNumber: 'Scan Room 1',
    }
  },
  {
    id: 'notif_doc_3',
    recipientId: 'usr_doc_jenkins',
    recipientRole: 'doctor',
    type: 'payment_recorded',
    title: '💰 Consultation Fee Settled',
    message: '₹800 consultation fee received for Token #8 (Gowri T) via UPI.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: true,
    metadata: {
      patientName: 'Gowri T',
      amount: 800,
    }
  },

  // 3. Receptionist Notifications (Kavitha Murugan)
  {
    id: 'notif_rec_1',
    recipientId: 'usr_recep_maya',
    recipientRole: 'receptionist',
    type: 'appointment_booked',
    title: '📋 New Patient Booking: Token #12',
    message: 'Gowri T registered for Dr. Preetha Rajesh (Scan Room 1).',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false,
    tokenNumber: 12,
    metadata: {
      patientName: 'Gowri T',
      doctorName: 'Dr. Preetha Rajesh',
    }
  },
  {
    id: 'notif_rec_2',
    recipientId: 'usr_recep_maya',
    recipientRole: 'receptionist',
    type: 'payment_recorded',
    title: '🧾 Payment Collected',
    message: '₹800 collected for Gowri T (Token #8). Receipt #RCP-RIO-98421 generated.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: true,
    metadata: {
      patientName: 'Gowri T',
      amount: 800,
      receiptNumber: 'RCP-RIO-98421',
    }
  },

  // 4. Owner Notifications (Dr. S. K. Arumugam)
  {
    id: 'notif_own_1',
    recipientId: 'usr_owner_1',
    recipientRole: 'owner',
    type: 'appointment_booked',
    title: '🏥 New OPD Booking',
    message: 'Token #12 booked for Dr. Preetha Rajesh at Rio Scan Center (Fee: ₹800).',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false,
    metadata: {
      doctorName: 'Dr. Preetha Rajesh',
      amount: 800,
    }
  },
  {
    id: 'notif_own_2',
    recipientId: 'usr_owner_1',
    recipientRole: 'owner',
    type: 'payment_received',
    title: '📈 Revenue Inflow: +₹800',
    message: '₹800 OPD consultation fee collected at Rio Scan Center via UPI.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: true,
    metadata: {
      amount: 800,
      method: 'UPI',
    }
  },
  {
    id: 'notif_own_3',
    recipientId: 'usr_owner_1',
    recipientRole: 'owner',
    type: 'consultation_completed',
    title: '📊 Daily Hospital Operations Report',
    message: 'Today: 24 OPD consultations completed across 4 scan rooms. Total collections: ₹24,800.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    metadata: {
      amount: 24800,
    }
  },
];

// Global Reactive Data Store Class (mimics Firestore Real-Time OnSnapshot)
class DataStoreService {
  private isDemo: boolean = false;
  private users: UserProfile[] = [];
  private hospitals: Hospital[] = [...INITIAL_HOSPITALS];
  private appointments: Appointment[] = [];
  private notifications: AppNotification[] = [];
  private roomQueues: Record<string, RoomQueue> = {};
  private registeredUsers: UserProfile[] = [];
  private freshAppointments: Appointment[] = [];
  private freshNotifications: AppNotification[] = [];
  private freshHospitals: Hospital[] = [];
  private freshRoomQueues: Record<string, RoomQueue> = {};

  private queueListeners: Array<(queue: RoomQueue) => void> = [];
  private appointmentListeners: Array<(appointments: Appointment[]) => void> = [];
  private availabilityListeners: Array<() => void> = [];
  private notificationListeners: Array<(notifs: AppNotification[], latestBanner?: AppNotification) => void> = [];

  private doctorAvailabilities: Record<string, Record<string, DoctorDateAvailability>> = {
    usr_doc_jenkins: {
      '2026-09-26': {
        date: '2026-09-26',
        isAvailable: true,
        status: 'available',
        timingStart: '09:00 AM',
        timingEnd: '05:00 PM',
        slots: ['09:30 AM', '10:15 AM', '11:00 AM', '11:45 AM', '02:00 PM', '03:30 PM', '04:15 PM'],
        maxTokens: 40,
        note: 'Full Day Radiology & Knee Scan OPD at Rio Scan Center',
      },
      '2026-09-27': {
        date: '2026-09-27',
        isAvailable: true,
        status: 'morning_only',
        timingStart: '09:00 AM',
        timingEnd: '01:00 PM',
        slots: ['09:30 AM', '10:15 AM', '11:00 AM', '11:45 AM'],
        maxTokens: 20,
        note: 'Morning Scan OPD only (Afternoon MRI Reporting)',
      },
      '2026-09-28': {
        date: '2026-09-28',
        isAvailable: true,
        status: 'available',
        timingStart: '09:00 AM',
        timingEnd: '05:00 PM',
        slots: ['09:30 AM', '10:15 AM', '11:00 AM', '11:45 AM', '02:00 PM', '03:30 PM', '04:15 PM'],
        maxTokens: 40,
        note: 'Full Day Musculoskeletal MRI & Joint Diagnostics',
      },
      '2026-09-29': {
        date: '2026-09-29',
        isAvailable: true,
        status: 'available',
        timingStart: '09:00 AM',
        timingEnd: '05:00 PM',
        slots: ['09:30 AM', '10:15 AM', '11:00 AM', '11:45 AM', '02:00 PM', '03:30 PM', '04:15 PM'],
        maxTokens: 40,
        note: 'Regular Scan & Ultrasound OPD',
      },
      '2026-09-30': {
        date: '2026-09-30',
        isAvailable: true,
        status: 'evening_only',
        timingStart: '02:00 PM',
        timingEnd: '06:00 PM',
        slots: ['02:00 PM', '03:30 PM', '04:15 PM'],
        maxTokens: 20,
        note: 'Evening OPD only (Morning Executive Scan Camps)',
      },
      '2026-10-01': {
        date: '2026-10-01',
        isAvailable: false,
        status: 'on_leave',
        timingStart: '09:00 AM',
        timingEnd: '05:00 PM',
        slots: [],
        maxTokens: 0,
        note: 'Attending Tamil Nadu Radiology Summit in Chennai',
      },
      '2026-10-02': {
        date: '2026-10-02',
        isAvailable: true,
        status: 'available',
        timingStart: '09:00 AM',
        timingEnd: '05:00 PM',
        slots: ['09:30 AM', '10:15 AM', '11:00 AM', '11:45 AM', '02:00 PM', '03:30 PM', '04:15 PM'],
        maxTokens: 40,
        note: 'Regular Scan Center OPD',
      },
    },
    'usr_doc_sharma': {
      '2026-09-26': {
        date: '2026-09-26',
        isAvailable: true,
        status: 'available',
        timingStart: '09:30 AM',
        timingEnd: '06:00 PM',
        slots: ['10:00 AM', '10:45 AM', '11:30 AM', '02:30 PM', '04:00 PM', '05:15 PM'],
        maxTokens: 35,
        note: 'Pediatrics & Child Care OPD at Ria Child Care Tirunelveli',
      },
      '2026-09-27': {
        date: '2026-09-27',
        isAvailable: false,
        status: 'on_leave',
        timingStart: '10:00 AM',
        timingEnd: '06:00 PM',
        slots: [],
        maxTokens: 0,
        note: 'Sunday Clinic Closed',
      },
      '2026-09-28': {
        date: '2026-09-28',
        isAvailable: true,
        status: 'morning_only',
        timingStart: '09:30 AM',
        timingEnd: '01:30 PM',
        slots: ['10:00 AM', '10:45 AM', '11:30 AM', '12:30 PM'],
        maxTokens: 20,
        note: 'Morning Consultations & Pediatric Immunization Clinic',
      },
      '2026-09-29': {
        date: '2026-09-29',
        isAvailable: false,
        status: 'on_leave',
        timingStart: '10:00 AM',
        timingEnd: '06:00 PM',
        slots: [],
        maxTokens: 0,
        note: 'Tamil Nadu Pediatric Association Conference in Madurai',
      },
      '2026-09-30': {
        date: '2026-09-30',
        isAvailable: true,
        status: 'available',
        timingStart: '09:30 AM',
        timingEnd: '06:00 PM',
        slots: ['10:00 AM', '10:45 AM', '11:30 AM', '02:30 PM', '04:00 PM'],
        maxTokens: 35,
        note: 'Pediatric OPD & Developmental Screening',
      },
    },
    'usr_doc_patel': {
      '2026-09-26': {
        date: '2026-09-26',
        isAvailable: true,
        status: 'available',
        timingStart: '09:00 AM',
        timingEnd: '05:30 PM',
        slots: ['09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:30 PM'],
        maxTokens: 40,
        note: 'Cardiology & General Medicine Clinic',
      },
      '2026-09-27': {
        date: '2026-09-27',
        isAvailable: false,
        status: 'on_leave',
        timingStart: '09:00 AM',
        timingEnd: '05:30 PM',
        slots: [],
        maxTokens: 0,
        note: 'Sunday Off',
      },
      '2026-09-28': {
        date: '2026-09-28',
        isAvailable: true,
        status: 'available',
        timingStart: '09:00 AM',
        timingEnd: '05:30 PM',
        slots: ['09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM'],
        maxTokens: 40,
        note: 'Full Day Clinic',
      },
      '2026-09-29': {
        date: '2026-09-29',
        isAvailable: true,
        status: 'evening_only',
        timingStart: '02:00 PM',
        timingEnd: '06:30 PM',
        slots: ['02:30 PM', '03:30 PM', '04:30 PM', '05:30 PM'],
        maxTokens: 25,
        note: 'Evening Clinic',
      },
    },
    'usr_doc_elena': {
      '2026-09-26': {
        date: '2026-09-26',
        isAvailable: true,
        status: 'morning_only',
        timingStart: '09:30 AM',
        timingEnd: '01:30 PM',
        slots: ['09:45 AM', '10:30 AM', '11:15 AM', '12:00 PM', '12:45 PM'],
        maxTokens: 25,
        note: 'Orthopedic Joint Care & Knee Pain Clinic',
      },
      '2026-09-27': {
        date: '2026-09-27',
        isAvailable: false,
        status: 'on_leave',
        timingStart: '09:00 AM',
        timingEnd: '04:00 PM',
        slots: [],
        maxTokens: 0,
        note: 'Sunday Off',
      },
      '2026-09-28': {
        date: '2026-09-28',
        isAvailable: true,
        status: 'available',
        timingStart: '09:30 AM',
        timingEnd: '04:30 PM',
        slots: ['09:45 AM', '10:30 AM', '11:15 AM', '12:00 PM', '02:00 PM', '03:00 PM'],
        maxTokens: 35,
        note: 'Joint Arthroscopy & Knee Pain Consultations',
      },
    }
  };

  // Demo Mode & Reset Controls
  setDemoMode(isDemo: boolean): void {
    this.isDemo = isDemo;
    if (isDemo) {
      this.appointments = [...INITIAL_APPOINTMENTS];
      this.notifications = [...INITIAL_NOTIFICATIONS];
      this.roomQueues = {
        [INITIAL_ROOM_QUEUE.id]: { ...INITIAL_ROOM_QUEUE },
      };
      this.users = [...INITIAL_USERS, ...this.registeredUsers];
      this.hospitals = [...INITIAL_HOSPITALS, ...this.freshHospitals];
    } else {
      this.appointments = [...this.freshAppointments];
      this.notifications = [...this.freshNotifications];
      this.roomQueues = { ...this.freshRoomQueues };
      this.users = this.registeredUsers.length > 0 ? [...this.registeredUsers] : [];
      this.hospitals = this.freshHospitals.length > 0 ? [...this.freshHospitals] : [...INITIAL_HOSPITALS];
    }
    this.notifyAppointmentListeners();
    this.notifyNotificationListeners();
    const firstQueueKey = Object.keys(this.roomQueues)[0];
    if (firstQueueKey) {
      this.notifyQueueListeners(this.roomQueues[firstQueueKey]);
    }
  }

  isDemoMode(): boolean {
    return this.isDemo;
  }

  registerUser(user: UserProfile): void {
    const existingIdx = this.registeredUsers.findIndex(
      (u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (existingIdx !== -1) {
      this.registeredUsers[existingIdx] = user;
    } else {
      this.registeredUsers.push(user);
    }

    const idx = this.users.findIndex(
      (u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (idx !== -1) {
      this.users[idx] = user;
    } else {
      this.users.push(user);
    }
  }

  registerHospital(hospital: Hospital): void {
    const existingIdx = this.freshHospitals.findIndex((h) => h.id === hospital.id);
    if (existingIdx !== -1) {
      this.freshHospitals[existingIdx] = hospital;
    } else {
      this.freshHospitals.unshift(hospital);
    }
    if (!this.isDemo) {
      this.hospitals = [...this.freshHospitals];
    }
  }

  // Authentication
  authenticate(role: UserRole, email?: string): UserProfile {
    if (email) {
      const match = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (match) return match;
    }
    const roleMatch = this.users.find((u) => u.role === role);
    if (roleMatch) return roleMatch;
    if (this.users.length > 0) return this.users[0];
    // Fallback safe fresh user profile
    const fallbackUser: UserProfile = {
      id: `usr_${role}_${Date.now()}`,
      email: email || `${role}@upstagehealth.app`,
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      phone: '+91 9876543210',
      role,
      createdAt: new Date().toISOString(),
      hospitalId: this.hospitals[0]?.id || 'hospital_rio_scans_tirunelveli',
    };
    return fallbackUser;
  }

  getUserById(id: string): UserProfile | undefined {
    return this.users.find(u => u.id === id);
  }

  updateUser(id: string, updates: Partial<UserProfile>): UserProfile | undefined {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...updates };
      return this.users[userIndex];
    }
    return undefined;
  }

  updateReceptionistAssignedDoctor(doctorId: string): UserProfile | undefined {
    return this.updateReceptionistAssignedDoctors([doctorId]);
  }

  updateReceptionistAssignedDoctors(doctorIds: string[]): UserProfile | undefined {
    const recep = this.users.find(u => u.role === 'receptionist');
    const docs = this.users.filter(u => doctorIds.includes(u.id));
    if (recep && recep.receptionistProfile && docs.length > 0) {
      recep.receptionistProfile = {
        ...recep.receptionistProfile,
        assignedDoctorId: docs[0].id,
        assignedDoctorName: docs[0].name,
        assignedRoomNumber: docs[0].doctorProfile?.roomNumber || 'Room 101',
        assignedDoctorIds: docs.map(d => d.id),
        assignedDoctorNames: docs.map(d => d.name),
        assignedRooms: docs.map(d => d.doctorProfile?.roomNumber || 'Room 101'),
      };
      return recep;
    }
    return recep;
  }

  // Check In, Call In (In Consultation), or Check Out patient
  updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Appointment | undefined {
    const apt = this.appointments.find(a => a.id === appointmentId);
    if (apt) {
      apt.status = status;
      apt.updatedAt = new Date().toISOString();
      const queueKey = `queue_hosp_central_${apt.doctorId}`;
      const queue = this.roomQueues[queueKey] || {
        ...INITIAL_ROOM_QUEUE,
        doctorId: apt.doctorId,
        id: queueKey,
      };

      if (status === 'in_consultation') {
        queue.currentToken = apt.tokenNumber;
        queue.lastCalledAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.notifyQueueListeners(queue);
      } else if (status === 'completed') {
        queue.totalCompleted += 1;
        this.notifyQueueListeners(queue);
      }

      this.updateQueueUpcoming(apt.doctorId);
      this.notifyAppointmentListeners();
    }
    return apt;
  }

  // Retrieve complete visit history for a patient
  getPatientVisits(patientNameOrId: string): Appointment[] {
    return this.appointments
      .filter(a => a.patientId === patientNameOrId || a.patientName.toLowerCase() === patientNameOrId.toLowerCase())
      .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  }

  // Hospitals
  getHospitals(userLat?: number, userLng?: number): Hospital[] {
    if (!userLat || !userLng) {
      return this.hospitals;
    }
    // Calculate Haversine distance
    return this.hospitals.map(h => {
      const distance = this.calcDistance(userLat, userLng, h.latitude, h.longitude);
      return { ...h, distanceKm: parseFloat(distance.toFixed(1)) };
    }).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }

  private calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  getDoctors(hospitalId?: string): UserProfile[] {
    let docs = this.users.filter(u => u.role === 'doctor');
    if (hospitalId) {
      const hospitalDocs = docs.filter(u => u.hospitalId === hospitalId);
      if (hospitalDocs.length > 0) return hospitalDocs;
    }
    return docs;
  }

  // Appointments
  getAppointments(filters?: {
    doctorId?: string;
    hospitalId?: string;
    patientId?: string;
    date?: string;
  }): Appointment[] {
    return this.appointments.filter(apt => {
      if (filters?.doctorId && apt.doctorId !== filters.doctorId) return false;
      if (filters?.hospitalId && apt.hospitalId !== filters.hospitalId) return false;
      if (filters?.patientId && apt.patientId !== filters.patientId) return false;
      if (filters?.date && apt.appointmentDate !== filters.date) return false;
      return true;
    });
  }

  // Book Appointment (Patient or Receptionist Walk-in)
  bookAppointment(data: {
    hospitalId: string;
    doctorId: string;
    patientName: string;
    patientPhone: string;
    patientAge: number;
    patientGender: string;
    timeSlot: string;
    appointmentDate?: string;
    symptoms?: string;
    isWalkIn?: boolean;
    paidNow?: boolean;
    paymentMethod?: PaymentMethod;
  }): Appointment {
    const hospital = this.hospitals.find(h => h.id === data.hospitalId) || this.hospitals[0];
    const doctor = this.users.find(u => u.id === data.doctorId) || this.users.find(u => u.role === 'doctor')!;
    
    // Auto-calculate next token
    const existingTokens = this.appointments
      .filter(a => a.doctorId === doctor.id)
      .map(a => a.tokenNumber);
    const nextTokenNum = existingTokens.length > 0 ? Math.max(...existingTokens) + 1 : 1;

    // Use current patient ID if matching demo patient, else auto-generated
    const patientId = data.patientName.toLowerCase().includes('gowri') || data.patientPhone.includes('94431')
      ? 'usr_patient_john'
      : `usr_pat_${Date.now()}`;

    const newAppointment: Appointment = {
      id: `apt_${Date.now()}`,
      tokenNumber: nextTokenNum,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.doctorProfile?.specialty || 'General Medicine',
      roomNumber: doctor.doctorProfile?.roomNumber || 'Room 101',
      patientId,
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      patientAge: data.patientAge,
      patientGender: data.patientGender,
      appointmentDate: data.appointmentDate || new Date().toISOString().split('T')[0],
      timeSlot: data.timeSlot,
      status: data.isWalkIn ? 'checked_in' : 'booked',
      paymentStatus: data.paidNow ? 'paid' : 'pending',
      paymentAmount: doctor.doctorProfile?.consultationFee || 500,
      paymentMethod: data.paymentMethod,
      paidAt: data.paidNow ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      receiptNumber: data.paidNow ? `RCP-${Math.floor(10000 + Math.random() * 90000)}` : undefined,
      symptoms: data.symptoms || 'General consultation',
      scannedReports: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedWaitMinutes: (nextTokenNum - (this.getCurrentQueue(doctor.id)?.currentToken || 1)) * 15
    };

    this.appointments.push(newAppointment);
    if (!this.isDemo) {
      this.freshAppointments.push(newAppointment);
    }
    this.updateQueueUpcoming(doctor.id);
    this.notifyAppointmentListeners();

    // -------------------------------------------------------------
    // AUTOMATIC MULTI-USER PUSH NOTIFICATION BROADCAST
    // -------------------------------------------------------------
    const room = doctor.doctorProfile?.roomNumber || 'Room 101';

    // 1. Notify Doctor
    this.addNotification({
      recipientId: doctor.id,
      recipientRole: 'doctor',
      type: 'appointment_booked',
      title: `🩺 New Appointment: Token #${nextTokenNum}`,
      message: `${data.patientName} (${data.patientAge}y/${data.patientGender}) booked Token #${nextTokenNum} for ${newAppointment.appointmentDate} at ${data.timeSlot}.`,
      subtitle: data.symptoms || 'General Consultation',
      appointmentId: newAppointment.id,
      tokenNumber: nextTokenNum,
      metadata: {
        patientName: data.patientName,
        doctorName: doctor.name,
        roomNumber: room,
        date: newAppointment.appointmentDate,
        time: data.timeSlot,
        amount: newAppointment.paymentAmount,
      }
    });

    // 2. Notify Doctor's Receptionist(s)
    const receptionists = this.users.filter(u => u.role === 'receptionist');
    receptionists.forEach(rec => {
      this.addNotification({
        recipientId: rec.id,
        recipientRole: 'receptionist',
        type: 'appointment_booked',
        title: `📋 New OPD Registration: Token #${nextTokenNum}`,
        message: `${data.patientName} registered for ${doctor.name} (${room}). Status: ${data.isWalkIn ? 'Checked-In (Walk-In)' : 'Booked Online'}.`,
        appointmentId: newAppointment.id,
        tokenNumber: nextTokenNum,
        metadata: {
          patientName: data.patientName,
          doctorName: doctor.name,
          roomNumber: room,
          date: newAppointment.appointmentDate,
          time: data.timeSlot,
        }
      });
    });

    // 3. Notify Hospital Owner
    const owner = this.users.find(u => u.role === 'owner') || this.users[0];
    this.addNotification({
      recipientId: owner.id,
      recipientRole: 'owner',
      type: 'appointment_booked',
      title: `🏥 New OPD Appointment Booked`,
      message: `Token #${nextTokenNum} (${data.patientName}) booked for ${doctor.name} at ${hospital.name}. Consultation fee: ₹${newAppointment.paymentAmount}.`,
      appointmentId: newAppointment.id,
      tokenNumber: nextTokenNum,
      metadata: {
        patientName: data.patientName,
        doctorName: doctor.name,
        amount: newAppointment.paymentAmount,
      }
    });

    // 4. Notify Patient (Confirmation)
    this.addNotification({
      recipientId: newAppointment.patientId,
      recipientRole: 'patient',
      type: 'appointment_confirmed',
      title: `✅ Appointment Confirmed! Token #${nextTokenNum}`,
      message: `Your consultation with ${doctor.name} is confirmed for ${newAppointment.appointmentDate} at ${data.timeSlot} (${room}).`,
      appointmentId: newAppointment.id,
      tokenNumber: nextTokenNum,
      metadata: {
        patientName: data.patientName,
        doctorName: doctor.name,
        roomNumber: room,
        date: newAppointment.appointmentDate,
        time: data.timeSlot,
      }
    });

    // 5. Patient Scheduled Reminder Notification
    this.addNotification({
      recipientId: newAppointment.patientId,
      recipientRole: 'patient',
      type: 'appointment_reminder',
      title: `⏰ Upcoming Appointment Reminder`,
      message: `Reminder: Your consultation with ${doctor.name} is on ${newAppointment.appointmentDate} at ${data.timeSlot} (${room}). Please arrive 15 minutes before your time.`,
      appointmentId: newAppointment.id,
      tokenNumber: nextTokenNum,
      metadata: {
        patientName: data.patientName,
        doctorName: doctor.name,
        roomNumber: room,
        date: newAppointment.appointmentDate,
        time: data.timeSlot,
      }
    });

    // 6. If paidNow was selected, also dispatch Payment Notifications
    if (data.paidNow) {
      this.dispatchPaymentNotifications(newAppointment, data.paymentMethod || 'upi');
    }

    return newAppointment;
  }

  // Receptionist: Mark Payment Received (Supports GPay, UPI, Cash, Card)
  recordPayment(appointmentId: string, method: PaymentMethod, customReceipt?: string): Appointment | undefined {
    const apt = this.appointments.find(a => a.id === appointmentId);
    if (apt) {
      apt.paymentStatus = 'paid';
      apt.paymentMethod = method;
      apt.paidAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      apt.receiptNumber = customReceipt || (method === 'gpay' 
        ? `GPAY-UP-${Math.floor(100000 + Math.random() * 900000)}`
        : `RCP-UP-${Math.floor(10000 + Math.random() * 90000)}`);
      if (apt.status === 'booked') {
        apt.status = 'checked_in';
      }
      apt.updatedAt = new Date().toISOString();
      this.notifyAppointmentListeners();

      // Dispatch Payment Notifications to Patient, Doctor, Receptionist, and Owner
      this.dispatchPaymentNotifications(apt, method);
    }
    return apt;
  }

  // Multi-user payment confirmation broadcast
  dispatchPaymentNotifications(apt: Appointment, method: PaymentMethod) {
    const methodLabel = method === 'gpay' ? 'Google Pay' : method.toUpperCase();
    const doctor = this.users.find(u => u.id === apt.doctorId) || this.users.find(u => u.role === 'doctor');
    const doctorName = doctor?.name || apt.doctorName;
    const receptionists = this.users.filter(u => u.role === 'receptionist');
    const owner = this.users.find(u => u.role === 'owner') || this.users[0];

    // 1. Patient Notification
    this.addNotification({
      recipientId: apt.patientId,
      recipientRole: 'patient',
      type: 'payment_received',
      title: `💳 Payment Confirmed: ₹${apt.paymentAmount}`,
      message: `Payment of ₹${apt.paymentAmount} received via ${methodLabel}. Receipt #${apt.receiptNumber}. Token #${apt.tokenNumber} is verified.`,
      appointmentId: apt.id,
      tokenNumber: apt.tokenNumber,
      metadata: {
        patientName: apt.patientName,
        amount: apt.paymentAmount,
        receiptNumber: apt.receiptNumber,
        method: methodLabel,
      }
    });

    // 2. Doctor Notification
    if (apt.doctorId) {
      this.addNotification({
        recipientId: apt.doctorId,
        recipientRole: 'doctor',
        type: 'payment_recorded',
        title: `💰 Consultation Fee Settled`,
        message: `₹${apt.paymentAmount} collected for Token #${apt.tokenNumber} (${apt.patientName}) via ${methodLabel}.`,
        appointmentId: apt.id,
        tokenNumber: apt.tokenNumber,
        metadata: {
          patientName: apt.patientName,
          amount: apt.paymentAmount,
          method: methodLabel,
        }
      });
    }

    // 3. Receptionist Notification
    receptionists.forEach(rec => {
      this.addNotification({
        recipientId: rec.id,
        recipientRole: 'receptionist',
        type: 'payment_recorded',
        title: `🧾 Payment Recorded: Receipt Issued`,
        message: `₹${apt.paymentAmount} collected from ${apt.patientName} (Token #${apt.tokenNumber}) via ${methodLabel}. Receipt #${apt.receiptNumber}.`,
        appointmentId: apt.id,
        tokenNumber: apt.tokenNumber,
        metadata: {
          patientName: apt.patientName,
          amount: apt.paymentAmount,
          receiptNumber: apt.receiptNumber,
          method: methodLabel,
        }
      });
    });

    // 4. Hospital Owner Notification
    this.addNotification({
      recipientId: owner.id,
      recipientRole: 'owner',
      type: 'payment_received',
      title: `📈 Hospital Revenue Inflow (+₹${apt.paymentAmount})`,
      message: `₹${apt.paymentAmount} received at ${apt.hospitalName} for ${doctorName} (${methodLabel}).`,
      appointmentId: apt.id,
      tokenNumber: apt.tokenNumber,
      metadata: {
        patientName: apt.patientName,
        doctorName: doctorName,
        amount: apt.paymentAmount,
        method: methodLabel,
      }
    });
  }

  // Receptionist: Embedded Document Scanner Upload (X-rays, blood test reports)
  attachScannedReport(appointmentId: string, report: Omit<ScannedReport, 'id' | 'appointmentId' | 'scanDate'>): ScannedReport {
    const apt = this.appointments.find(a => a.id === appointmentId);
    const newReport: ScannedReport = {
      id: `rep_${Date.now()}`,
      appointmentId,
      scanDate: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      ...report,
    };
    if (apt) {
      apt.scannedReports.unshift(newReport);
      this.notifyAppointmentListeners();

      // 1. Notify Patient
      this.addNotification({
        recipientId: apt.patientId,
        recipientRole: 'patient',
        type: 'report_attached',
        title: `📄 Diagnostic Report Attached`,
        message: `New report "${report.title}" (${report.reportType.toUpperCase()}) is now available in your visit history.`,
        appointmentId: apt.id,
        tokenNumber: apt.tokenNumber,
        metadata: {
          reportTitle: report.title,
        }
      });

      // 2. Notify Doctor
      this.addNotification({
        recipientId: apt.doctorId,
        recipientRole: 'doctor',
        type: 'report_attached',
        title: `🩻 Diagnostic Report Ready`,
        message: `"${report.title}" attached for ${apt.patientName} (Token #${apt.tokenNumber}) by ${report.scannedBy}.`,
        appointmentId: apt.id,
        tokenNumber: apt.tokenNumber,
        metadata: {
          patientName: apt.patientName,
          reportTitle: report.title,
        }
      });
    }
    return newReport;
  }

  // Doctor: Call Next Patient (Syncs with Outside Room Web Monitor!)
  callNextPatient(doctorId: string): { calledAppointment?: Appointment; queue: RoomQueue } {
    const queueKey = `queue_hosp_central_${doctorId}`;
    let queue = this.roomQueues[queueKey] || {
      ...INITIAL_ROOM_QUEUE,
      doctorId,
      id: queueKey
    };

    // Find next waiting / checked_in appointment
    const nextApt = this.appointments.find(
      a => a.doctorId === doctorId && (a.status === 'checked_in' || a.status === 'waiting' || a.status === 'booked') && a.tokenNumber > queue.currentToken
    );

    if (nextApt) {
      // Complete previous if in_consultation
      const curr = this.appointments.find(a => a.doctorId === doctorId && a.status === 'in_consultation');
      if (curr) {
        curr.status = 'completed';
      }

      nextApt.status = 'in_consultation';
      queue.currentToken = nextApt.tokenNumber;
      queue.lastCalledAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      queue.totalCompleted += 1;

      // 1. Notify Patient: Turn has arrived!
      this.addNotification({
        recipientId: nextApt.patientId,
        recipientRole: 'patient',
        type: 'queue_turn_called',
        title: `🔔 It's Your Turn! (Token #${nextApt.tokenNumber})`,
        message: `Please proceed to ${nextApt.roomNumber} immediately. ${nextApt.doctorName} is ready to see you!`,
        appointmentId: nextApt.id,
        tokenNumber: nextApt.tokenNumber,
        metadata: {
          patientName: nextApt.patientName,
          doctorName: nextApt.doctorName,
          roomNumber: nextApt.roomNumber,
        }
      });

      // 2. Notify Receptionist
      const receptionists = this.users.filter(u => u.role === 'receptionist');
      receptionists.forEach(rec => {
        this.addNotification({
          recipientId: rec.id,
          recipientRole: 'receptionist',
          type: 'queue_turn_called',
          title: `🚶 Patient In Consultation: Token #${nextApt.tokenNumber}`,
          message: `${nextApt.patientName} called into ${nextApt.roomNumber} with ${nextApt.doctorName}.`,
          appointmentId: nextApt.id,
          tokenNumber: nextApt.tokenNumber,
        });
      });
    } else {
      queue.currentToken += 1;
    }

    // Recalculate upcoming
    this.updateQueueUpcoming(doctorId);
    this.notifyQueueListeners(queue);
    this.notifyAppointmentListeners();

    return {
      calledAppointment: nextApt,
      queue
    };
  }

  // Doctor: Complete consultation & save digital prescription
  completeConsultation(appointmentId: string, prescription: Prescription): Appointment | undefined {
    const apt = this.appointments.find(a => a.id === appointmentId);
    if (apt) {
      apt.status = 'completed';
      apt.prescription = prescription;
      apt.updatedAt = new Date().toISOString();
      this.notifyAppointmentListeners();

      // 1. Notify Patient
      this.addNotification({
        recipientId: apt.patientId,
        recipientRole: 'patient',
        type: 'consultation_completed',
        title: `🩺 Digital Prescription Available`,
        message: `${apt.doctorName} has completed your consultation. Diagnosis: ${prescription.diagnosis}. View your Rx in Medical Records.`,
        appointmentId: apt.id,
        tokenNumber: apt.tokenNumber,
        metadata: {
          doctorName: apt.doctorName,
          patientName: apt.patientName,
        }
      });

      // 2. Notify Receptionist
      const receptionists = this.users.filter(u => u.role === 'receptionist');
      receptionists.forEach(rec => {
        this.addNotification({
          recipientId: rec.id,
          recipientRole: 'receptionist',
          type: 'consultation_completed',
          title: `✅ Consultation Completed: Token #${apt.tokenNumber}`,
          message: `${apt.patientName} consultation completed by ${apt.doctorName}. Rx issued.`,
          appointmentId: apt.id,
          tokenNumber: apt.tokenNumber,
        });
      });

      // 3. Notify Doctor
      this.addNotification({
        recipientId: apt.doctorId,
        recipientRole: 'doctor',
        type: 'consultation_completed',
        title: `📝 Consultation Logged`,
        message: `Prescription saved for ${apt.patientName} (Token #${apt.tokenNumber}). Follow-up: ${prescription.followUpDate || 'None'}.`,
        appointmentId: apt.id,
        tokenNumber: apt.tokenNumber,
      });
    }
    return apt;
  }

  // Queue Listeners for Real-time Display Web App
  getCurrentQueue(doctorId: string = 'usr_doc_jenkins'): RoomQueue {
    const key = `queue_hosp_central_${doctorId}`;
    if (this.roomQueues[key]) {
      return this.roomQueues[key];
    }
    if (this.isDemo) {
      return INITIAL_ROOM_QUEUE;
    }
    const doctor = this.users.find((u) => u.id === doctorId);
    return {
      id: key,
      hospitalId: doctor?.hospitalId || 'hospital_rio_scans_tirunelveli',
      hospitalName: 'RIO Scans & Labs',
      doctorId,
      doctorName: doctor?.name || 'Doctor',
      roomNumber: doctor?.doctorProfile?.roomNumber || 'Room 101',
      specialty: doctor?.doctorProfile?.specialty || 'General Medicine',
      date: new Date().toISOString().split('T')[0],
      currentToken: 0,
      nextToken: 0,
      totalWaiting: 0,
      totalCompleted: 0,
      status: 'active',
      lastCalledAt: '--:--',
      upcomingTokens: [],
    };
  }

  subscribeToQueue(doctorId: string, callback: (queue: RoomQueue) => void): () => void {
    this.queueListeners.push(callback);
    callback(this.getCurrentQueue(doctorId));
    return () => {
      this.queueListeners = this.queueListeners.filter(cb => cb !== callback);
    };
  }

  subscribeToAppointments(callback: (appointments: Appointment[]) => void): () => void {
    this.appointmentListeners.push(callback);
    callback([...this.appointments]);
    return () => {
      this.appointmentListeners = this.appointmentListeners.filter(cb => cb !== callback);
    };
  }

  private updateQueueUpcoming(doctorId: string) {
    const queueKey = `queue_hosp_central_${doctorId}`;
    const defaultQueue: RoomQueue = this.isDemo ? { ...INITIAL_ROOM_QUEUE } : {
      id: queueKey,
      hospitalId: 'hospital_rio_scans_tirunelveli',
      hospitalName: 'RIO Scans & Labs',
      doctorId,
      doctorName: 'Doctor',
      roomNumber: 'Room 101',
      specialty: 'General Medicine',
      date: new Date().toISOString().split('T')[0],
      currentToken: 0,
      nextToken: 0,
      totalWaiting: 0,
      totalCompleted: 0,
      status: 'active',
      lastCalledAt: '--:--',
      upcomingTokens: [],
    };
    const queue = this.roomQueues[queueKey] || defaultQueue;
    
    const upcoming = this.appointments
      .filter(a => a.doctorId === doctorId && a.tokenNumber > queue.currentToken && a.status !== 'completed' && a.status !== 'cancelled')
      .sort((a, b) => a.tokenNumber - b.tokenNumber)
      .slice(0, 5)
      .map(a => ({
        tokenNumber: a.tokenNumber,
        patientName: a.patientName,
        timeSlot: a.timeSlot,
        status: a.status
      }));

    queue.upcomingTokens = upcoming;
    queue.nextToken = upcoming.length > 0 ? upcoming[0].tokenNumber : (queue.currentToken > 0 ? queue.currentToken + 1 : 1);
    queue.totalWaiting = upcoming.length;
    this.roomQueues[queueKey] = queue;
    if (!this.isDemo) {
      this.freshRoomQueues[queueKey] = queue;
    }
    this.notifyQueueListeners(queue);
  }

  private notifyQueueListeners(queue: RoomQueue) {
    this.queueListeners.forEach(cb => cb({ ...queue }));
  }

  private notifyAppointmentListeners() {
    this.appointmentListeners.forEach(cb => cb([...this.appointments]));
  }

  // Doctor Date Availability
  getDoctorDateAvailability(doctorId: string, date: string): DoctorDateAvailability {
    const docMap = this.doctorAvailabilities[doctorId] || {};
    if (docMap[date]) {
      return { ...docMap[date] };
    }
    const d = new Date(date + 'T12:00:00');
    const isSunday = d.getDay() === 0;
    return {
      date,
      isAvailable: !isSunday,
      status: isSunday ? 'on_leave' : 'available',
      timingStart: '09:00 AM',
      timingEnd: '05:00 PM',
      slots: isSunday ? [] : [...DEFAULT_DOCTOR_SLOTS],
      maxTokens: isSunday ? 0 : 35,
      note: isSunday ? 'Sunday Clinic Closed' : 'Regular OPD Active',
    };
  }

  updateDoctorDateAvailability(doctorId: string, availability: DoctorDateAvailability): void {
    if (!this.doctorAvailabilities[doctorId]) {
      this.doctorAvailabilities[doctorId] = {};
    }
    this.doctorAvailabilities[doctorId][availability.date] = { ...availability };

    const doc = this.users.find(u => u.id === doctorId);
    if (doc && doc.doctorProfile) {
      if (!doc.doctorProfile.dateAvailability) {
        doc.doctorProfile.dateAvailability = {};
      }
      doc.doctorProfile.dateAvailability[availability.date] = { ...availability };
    }

    this.notifyAvailabilityListeners();
  }

  getDoctorUpcomingAvailability(doctorId: string, days: number = 14): DoctorDateAvailability[] {
    const result: DoctorDateAvailability[] = [];
    const base = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      result.push(this.getDoctorDateAvailability(doctorId, dateStr));
    }
    return result;
  }

  subscribeToDoctorAvailability(callback: () => void): () => void {
    this.availabilityListeners.push(callback);
    return () => {
      this.availabilityListeners = this.availabilityListeners.filter(cb => cb !== callback);
    };
  }

  private notifyAvailabilityListeners() {
    this.availabilityListeners.forEach(cb => cb());
  }

  // -------------------------------------------------------------
  // NOTIFICATION MANAGEMENT
  // -------------------------------------------------------------
  getNotifications(userId?: string, role?: UserRole): AppNotification[] {
    if (!userId && !role) return [...this.notifications];
    return this.notifications.filter(n => {
      if (n.recipientId === 'all') return true;
      if (userId && n.recipientId === userId) return true;
      if (role && n.recipientRole === role) return true;
      return false;
    });
  }

  getUnreadNotificationCount(userId?: string, role?: UserRole): number {
    return this.getNotifications(userId, role).filter(n => !n.read).length;
  }

  markNotificationAsRead(id: string): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.notifyNotificationListeners();
    }
  }

  markAllNotificationsAsRead(userId?: string, role?: UserRole): void {
    const list = this.getNotifications(userId, role);
    list.forEach(n => {
      n.read = true;
    });
    this.notifyNotificationListeners();
  }

  addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notif,
    };
    this.notifications.unshift(newNotif);
    if (!this.isDemo) {
      this.freshNotifications.unshift(newNotif);
    }
    this.notifyNotificationListeners(newNotif);
    return newNotif;
  }

  subscribeToNotifications(
    listener: (notifs: AppNotification[], latestBanner?: AppNotification) => void
  ): () => void {
    this.notificationListeners.push(listener);
    listener([...this.notifications]);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(cb => cb !== listener);
    };
  }

  private notifyNotificationListeners(latestBanner?: AppNotification): void {
    this.notificationListeners.forEach(cb => cb([...this.notifications], latestBanner));
  }
}

export const dataStore = new DataStoreService();
