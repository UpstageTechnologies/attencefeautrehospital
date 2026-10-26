import React, { createContext, useContext, useState, useEffect } from 'react';
import { Hospital, Appointment, RoomQueue, ScannedReport, PaymentMethod, Prescription, DoctorDateAvailability } from '../types';
import { dataStore } from '../services/dataStore';

interface HospitalContextType {
  hospitals: Hospital[];
  selectedHospital: Hospital;
  appointments: Appointment[];
  activeQueue: RoomQueue;
  userLocation: { latitude: number; longitude: number } | null;
  availabilityVersion: number;
  selectHospital: (hospitalId: string) => void;
  setUserLocation: (coords: { latitude: number; longitude: number }) => void;
  bookAppointment: (data: {
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
  }) => Appointment;
  recordPayment: (appointmentId: string, method: PaymentMethod) => void;
  attachScannedReport: (
    appointmentId: string,
    report: Omit<ScannedReport, 'id' | 'appointmentId' | 'scanDate'>
  ) => ScannedReport;
  callNextPatient: (doctorId: string) => void;
  completeConsultation: (appointmentId: string, prescription: Prescription) => void;
  getAppointmentsForDoctor: (doctorId: string) => Appointment[];
  getAppointmentsForPatient: (patientId: string) => Appointment[];
  getDoctorAvailability: (doctorId: string, date: string) => DoctorDateAvailability;
  updateDoctorAvailability: (doctorId: string, availability: DoctorDateAvailability) => void;
  getDoctorUpcomingAvailability: (doctorId: string, days?: number) => DoctorDateAvailability[];
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default user location (e.g. Tirunelveli Center coordinates, Tamil Nadu)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 8.7139,
    longitude: 77.7567,
  });

  const [hospitals, setHospitals] = useState<Hospital[]>(() =>
    dataStore.getHospitals(userLocation?.latitude, userLocation?.longitude)
  );

  const [selectedHospital, setSelectedHospital] = useState<Hospital>(() => hospitals[0]);
  const [appointments, setAppointments] = useState<Appointment[]>(() => dataStore.getAppointments());
  const [activeQueue, setActiveQueue] = useState<RoomQueue>(() => dataStore.getCurrentQueue('usr_doc_jenkins'));
  const [availabilityVersion, setAvailabilityVersion] = useState<number>(0);

  // Subscribe to real-time appointments & queue changes & doctor availability
  useEffect(() => {
    const unsubApt = dataStore.subscribeToAppointments(newApts => {
      setAppointments([...newApts]);
    });

    const unsubQueue = dataStore.subscribeToQueue('usr_doc_jenkins', newQueue => {
      setActiveQueue({ ...newQueue });
    });

    const unsubAvail = dataStore.subscribeToDoctorAvailability(() => {
      setAvailabilityVersion(v => v + 1);
    });

    return () => {
      unsubApt();
      unsubQueue();
      unsubAvail();
    };
  }, []);

  // Update hospital distances if location changes
  useEffect(() => {
    if (userLocation) {
      setHospitals(dataStore.getHospitals(userLocation.latitude, userLocation.longitude));
    }
  }, [userLocation]);

  const selectHospital = (hospitalId: string) => {
    const hosp = hospitals.find(h => h.id === hospitalId);
    if (hosp) setSelectedHospital(hosp);
  };

  const bookAppointment = (data: Parameters<HospitalContextType['bookAppointment']>[0]) => {
    return dataStore.bookAppointment(data);
  };

  const recordPayment = (appointmentId: string, method: PaymentMethod) => {
    dataStore.recordPayment(appointmentId, method);
  };

  const attachScannedReport = (
    appointmentId: string,
    report: Omit<ScannedReport, 'id' | 'appointmentId' | 'scanDate'>
  ) => {
    return dataStore.attachScannedReport(appointmentId, report);
  };

  const callNextPatient = (doctorId: string) => {
    dataStore.callNextPatient(doctorId);
  };

  const completeConsultation = (appointmentId: string, prescription: Prescription) => {
    dataStore.completeConsultation(appointmentId, prescription);
  };

  const getAppointmentsForDoctor = (doctorId: string) => {
    return appointments.filter(a => a.doctorId === doctorId);
  };

  const getAppointmentsForPatient = (patientId: string) => {
    return appointments.filter(a => a.patientId === patientId);
  };

  const getDoctorAvailability = (doctorId: string, date: string) => {
    return dataStore.getDoctorDateAvailability(doctorId, date);
  };

  const updateDoctorAvailability = (doctorId: string, availability: DoctorDateAvailability) => {
    dataStore.updateDoctorDateAvailability(doctorId, availability);
  };

  const getDoctorUpcomingAvailability = (doctorId: string, days: number = 14) => {
    return dataStore.getDoctorUpcomingAvailability(doctorId, days);
  };

  return (
    <HospitalContext.Provider
      value={{
        hospitals,
        selectedHospital,
        appointments,
        activeQueue,
        userLocation,
        availabilityVersion,
        selectHospital,
        setUserLocation,
        bookAppointment,
        recordPayment,
        attachScannedReport,
        callNextPatient,
        completeConsultation,
        getAppointmentsForDoctor,
        getAppointmentsForPatient,
        getDoctorAvailability,
        updateDoctorAvailability,
        getDoctorUpcomingAvailability,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
};
