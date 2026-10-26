# Upstage Health 🏥

**Upstage Health** is an enterprise-grade hospital appointments and queue management platform built for modern hospitals, medical centers, and outpatient clinics.

The platform unites four distinct user roles, incorporates an **embedded document scanner** for medical records (X-rays and blood tests), features a **WhatsApp-inspired UI/UX with iOS Liquid Glass design aesthetics**, and delivers a **dedicated Waiting Room Monitor Web App** designed to run on large screens outside doctors' consultation rooms.

---

## 🌟 Key Capabilities & Architectural Highlights

### 1. 👥 Four Dedicated Role Logins & Portals
- **🏥 Hospital Owner Portal**:
  - Central executive dashboard tracking hospital footfall, today's collected revenue, active OPD rooms, and average wait times.
  - Doctor roster management: Add doctors, assign consultation rooms (e.g. Room 204), configure OPD timings and consultation fee structures.
  - Multi-department oversight (Cardiology, Orthopedics, Pediatrics, Radiology, General Medicine).
- **🩺 Doctor Portal (Consulting Room Experience)**:
  - Live patient queue tracker styled like WhatsApp chat lists with active status badges.
  - **"Call Next Patient"** action: Automatically announces the next patient on the waiting room monitor outside the room.
  - **Embedded Medical Scan Inspector**: Full-resolution viewer for scanned X-rays and pathology blood test reports with high-contrast radiography filters.
  - Digital Prescription Pad: Clinical diagnosis recording, structured medication table (dosage, frequency, duration), and clinical advice.
- **📋 Doctor's Receptionist Portal (Front Desk Triage)**:
  - Daily appointment queue management with status indicators (Booked, Checked In, In Room, Completed).
  - Rapid Walk-in patient registration with immediate token assignment.
  - Cashier & Payment processing: Supports Cash, Credit/Debit Cards, and dynamic UPI QR codes with instant digital receipts.
  - **Embedded Optical Document Scanner**: High-contrast camera scanner with document boundary guides, perspective enhancement, and direct attachment of physical X-rays and lab test reports to patient records.
- **👤 Patient Portal (Self-Service & Live Queue Tracker)**:
  - **Location-Based Hospital Discovery**: Automatically detects device GPS coordinates and sorts registered hospitals by real-time travel distance (km).
  - Department filtering & specialist doctor directory.
  - Slot selection & instant digital token generation.
  - **Live Digital Token Pass**: Displays current token being served inside the room, remaining patients ahead, estimated wait time in minutes, and floor directions.
  - Personal Medical Vault: Access all past prescriptions and scanned diagnostic reports.

---

### 2. 🩻 Embedded Medical Document Scanner (Receptionist)
- **Report Types Supported**:
  - Chest / Bone X-Rays
  - Blood Pathology Reports (CBC, Lipids, Blood Sugar)
  - MRI / CT Scans & Ultrasounds
  - Historical prescriptions & discharge summaries
- **Optical Enhancement Filters**:
  - **High-Contrast Radiography Mode**: Enhances bone density and pulmonary structures on X-ray films.
  - **Clean Document B&W Mode**: Removes surface shadows, glare, and flattens paper contrast.
  - **Color Diagnostic Mode**: Preserves color-coded lab flags and pathology histology markers.
- **Instant Synchronization**: When scanned by the receptionist at the front desk, documents are instantly uploaded and attached to the patient's record, immediately visible on the doctor's consultation screen in Room 204.

---

### 3. 📺 Outside-the-Doctor's-Room Monitor Web App (`web-monitor/`)
- Designed specifically for smart TVs, wall-mounted monitors, or mini PCs placed outside consultation doors.
- **Ultra-Large Readable Typography**: Crystal-clear token display visible from 25+ feet away across waiting lounges.
- **Primary Stage**:
  - Massive bold Token Number (e.g., **`TOKEN #08`**) with animated calling ripple.
  - Doctor identity: "DR. SARAH JENKINS, MD (CARDIOLOGY) • ROOM 204".
  - Status banner: "NOW CONSULTING / PLEASE ENTER".
  - Patient privacy toggle (display patient name or anonymized token only).
- **Upcoming Queue List**: Shows the next 3 tokens in line (e.g. Token #09, #10, #11) with estimated call times.
- **Acoustic Audio Chime System**:
  - Synthesized dual-tone airport/hospital bell (*Ding-Dong!*) using the browser's native Web Audio API (zero audio file dependencies).
  - Optional automated speech announcement (*"Token number 08, please proceed to Room 204"*).

---

### 4. 🎨 Design System: WhatsApp UX + iOS Liquid Glass UI
- **WhatsApp-Inspired UX**:
  - Classic header with Upstage Health emerald branding (`#075E54` / `#128C7E`).
  - Chat/card list layout with intuitive status ticks (single tick = booked, double grey tick = checked in, double blue tick = completed/paid).
  - Floating action buttons for rapid scanning and walk-ins.
- **iOS Liquid Glass UI (Glassmorphism)**:
  - Floating translucent glass bottom navigation bar with `backdrop-filter: blur(36px) saturate(190%)`.
  - Specular edge rim highlights (`border: 1.2px solid rgba(255,255,255,0.85)`).
  - Elevated frosted glass cards with soft ambient drop shadows.

---

### 5. 🔥 Firebase Architecture & Data Schema
- **Firebase Authentication**: Role-based access control with custom profile metadata.
- **Cloud Firestore**:
  - `/hospitals/{hospitalId}`: Hospital profile, GPS latitude/longitude, departments, capacity.
  - `/users/{userId}`: Staff, doctors, and patient profiles.
  - `/appointments/{appointmentId}`: Tokens, dates, time slots, payment status, prescriptions.
  - `/queues/{queueId}`: Real-time room status (`currentToken`, `nextToken`, `upcomingTokens`).
  - `/medicalReports/{reportId}`: Scanned reports metadata with file URIs.
- **Firebase Storage**: Secure storage bucket for scanned medical images (`image/*` and `application/pdf`).
- **Security Rules**: Production rules included in `firebase/firestore.rules` and `firebase/storage.rules`.

---

## 📁 Repository Structure

```
.
├── firebase.json                   # Firebase emulator and services configuration
├── package.json                    # Workspace root scripts
├── README.md                       # Comprehensive system documentation
├── firebase/
│   ├── firestore.rules             # Role-based Firestore security rules
│   ├── firestore.indexes.json      # Optimized query compound indexes
│   └── storage.rules               # Medical document storage rules
├── mobile/                         # React Native (Expo) Mobile App for iOS & Android
│   ├── App.tsx                     # Main app root & multi-role tab navigator
│   ├── package.json                # React Native & Expo dependencies
│   ├── app.json                    # iOS & Android bundle & permission metadata
│   └── src/
│       ├── config/firebase.ts      # Firebase SDK initialization & fallback layer
│       ├── types/index.ts          # TypeScript interfaces (Roles, Tokens, Scans)
│       ├── theme/
│       │   ├── colors.ts           # WhatsApp emerald palette & medical brand tokens
│       │   └── glass.ts            # iOS Liquid Glass blur & specular styles
│       ├── context/
│       │   ├── AuthContext.tsx     # Role switcher & authentication state
│       │   └── HospitalContext.tsx # Reactive appointments, queue & GPS state
│       ├── services/
│       │   └── dataStore.ts        # Reactive store with sample X-rays & pathology data
│       ├── components/
│       │   ├── common/
│       │   │   ├── GlassView.tsx   # Cross-platform frosted glass container
│       │   │   ├── GlassTabBar.tsx # Floating iOS Glass Bottom Navigation Bar
│       │   │   └── WhatsAppHeader.tsx # Header with multi-role switcher
│       │   └── scanner/
│       │       └── EmbeddedDocumentScanner.tsx # Optical X-ray & lab report scanner
│       └── screens/
│           ├── receptionist/       # Appointment queue, walk-in modal, payment modal
│           ├── doctor/             # Live queue, consultation pad & high-res scan viewer
│           ├── patient/            # Nearby hospital locator, slot booking & token pass
│           └── owner/              # Hospital analytics & doctor room management
└── web-monitor/                    # Waiting Room Display Web App for Outside Doctor Rooms
    ├── index.html                  # HTML5 shell for TV monitors
    ├── package.json                # React 18 + Vite dependencies
    ├── vite.config.ts              # Vite server configuration
    └── src/
        ├── App.tsx                 # Root monitor display
        ├── main.tsx                # React DOM mount
        ├── components/
        │   └── MonitorDisplay.tsx  # Ultra-large font queue display
        ├── services/
        │   └── audioChime.ts       # Synthesized hospital chime & voice synthesizer
        └── styles/
            └── monitor.css         # High-contrast OLED/TV styling
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- For iOS/Android mobile builds: Xcode (macOS) and Android Studio, or the Expo Go mobile app.

---

### 2. Running the Outside-the-Doctor-Room Web Monitor
The Waiting Room Monitor can be launched immediately on any screen or smart TV:
```bash
cd web-monitor
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.
- Click **"Enable Sound & Chime"** to enable the hospital chime when patients are called.
- Click **"Fullscreen Kiosk"** for edge-to-edge TV display outside the doctor's room.

---

### 3. Running the React Native Mobile App (iOS / Android / Web)
```bash
cd mobile
npm install
npm start
```
- Press **`i`** to run on the **iOS Simulator**.
- Press **`a`** to run on the **Android Emulator**.
- Press **`w`** to preview directly in the **Web Browser**.

---

### 4. Testing All 4 Roles
In the mobile app, tap the **role badge in the top right of the header** at any time to switch roles:
1. **Receptionist**: Test walk-in patient booking, document scanner for X-rays/blood reports, and payment recording.
2. **Doctor**: View active consultations, inspect scanned reports in high-resolution, prescribe medications, and press **"Call Next Patient"** to see the waiting room monitor update live with sound!
3. **Patient**: Use GPS to find nearby hospitals, pick doctor time slots, and view the live digital token pass.
4. **Hospital Owner**: Review collected revenue, patient throughput, and hospital room assignments.
