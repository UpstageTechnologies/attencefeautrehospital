import { DeliveryOrder, DeliveryStatus, DeliveryPriority } from '../types';
import { INITIAL_DELIVERY_ORDERS } from './rioStaffSeedData';
import { firestore } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import * as Location from 'expo-location';

export interface DeliveryNotificationEvent {
  type: 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';
  order: DeliveryOrder;
  recipient: 'doctor_receiver' | 'scan_center_sender';
  title: string;
  body: string;
  timestamp: string;
}

class DeliveryService {
  private isDemo: boolean = false;
  private orders: DeliveryOrder[] = [];
  private freshOrders: DeliveryOrder[] = [];

  setDemoMode(isDemo: boolean): void {
    this.isDemo = isDemo;
    if (isDemo) {
      this.orders = [...INITIAL_DELIVERY_ORDERS];
    } else {
      this.orders = [...this.freshOrders];
    }
  }
  private notificationListeners: Array<(event: DeliveryNotificationEvent) => void> = [];

  getOrders(): DeliveryOrder[] {
    return [...this.orders];
  }

  getOrderById(id: string): DeliveryOrder | undefined {
    return this.orders.find((o) => o.id === id);
  }

  onNotification(listener: (event: DeliveryNotificationEvent) => void) {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter((l) => l !== listener);
    };
  }

  private notify(event: DeliveryNotificationEvent) {
    this.notificationListeners.forEach((l) => l(event));
  }

  /**
   * Create a new scan delivery order from Reception or Lab
   */
  async createOrder(data: {
    patientName: string;
    patientAge: number;
    patientGender: string;
    scanType: string;
    packageDetails: string;
    destinationHospital: string;
    destinationDoctor: string;
    destinationPhone: string;
    priority: DeliveryPriority;
    assignedCourierId?: string;
    assignedCourierName?: string;
  }): Promise<DeliveryOrder> {
    const orderId = `DEL-RIO-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: DeliveryOrder = {
      id: orderId,
      patientId: `pat_${Date.now()}`,
      patientName: data.patientName,
      patientAge: data.patientAge,
      patientGender: data.patientGender,
      scanType: data.scanType,
      packageDetails: data.packageDetails,
      sourceLocation: 'RIO Scans & Labs, Vannarpettai, Tirunelveli',
      sourcePhone: '+91 462 2501900',
      destinationHospital: data.destinationHospital,
      destinationDoctor: data.destinationDoctor,
      destinationPhone: data.destinationPhone,
      assignedCourierId: data.assignedCourierId || 'RIO-DEL-02',
      assignedCourierName: data.assignedCourierName || 'Karthik Esakkimuthu',
      assignedCourierPhone: '+91 94420 55002',
      priority: data.priority,
      status: 'pending_pickup',
      createdAt: new Date().toISOString(),
      estimatedDeliveryMinutes: 25,
      courierLocation: {
        latitude: 8.7290,
        longitude: 77.7280,
        updatedAt: new Date().toISOString(),
        speedKmph: 0,
        landmark: 'RIO Scans Logistics Bay, Floor 1',
      },
    };

    this.orders.unshift(newOrder);

    try {
      if (firestore) {
        await setDoc(doc(firestore, 'deliveryOrders', newOrder.id), newOrder);
      }
    } catch (e) {
      console.warn('Firestore delivery order write (offline/demo):', e);
    }

    return newOrder;
  }

  /**
   * Courier picks up the package from RIO Scans:
   * 1. Updates status to 'in_transit'
   * 2. Captures current GPS coordinates
   * 3. Dispatches PUSH NOTIFICATION to the receiving doctor/hospital
   */
  async pickupPackage(orderId: string, courierName?: string): Promise<DeliveryOrder> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    order.status = 'in_transit';
    order.pickupTime = new Date().toISOString();
    if (courierName) order.assignedCourierName = courierName;

    // Try fetching real device GPS if permitted
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        order.courierLocation = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          updatedAt: new Date().toISOString(),
          speedKmph: loc.coords.speed ? Math.round(loc.coords.speed * 3.6) : 28,
          landmark: 'GPS Locked - En Route in Tirunelveli',
        };
      }
    } catch (e) {
      console.log('Using simulated Tirunelveli GPS coordinates:', e);
    }

    // Trigger notification to the RECEIVER (Doctor / Outside Hospital)
    this.notify({
      type: 'PICKED_UP',
      order,
      recipient: 'doctor_receiver',
      title: `📦 Scan Package Dispatched to ${order.destinationDoctor}`,
      body: `RIO Scans courier ${order.assignedCourierName} has picked up ${order.scanType} for patient ${order.patientName}. Live GPS tracking is active.`,
      timestamp: new Date().toISOString(),
    });

    try {
      if (firestore) {
        await setDoc(doc(firestore, 'deliveryOrders', order.id), order, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore pickup update notice:', e);
    }

    return order;
  }

  /**
   * Courier arrives at the outside hospital and delivers the package:
   * 1. Records proof of delivery (recipient name, designation, signature stamp)
   * 2. Sets status to 'delivered'
   * 3. Dispatches PUSH NOTIFICATION to the SENDER (RIO Scans Admin & Reception)
   */
  async completeDelivery(
    orderId: string,
    proof: {
      receivedBy: string;
      recipientDesignation?: string;
      signatureOrStampUri?: string;
      photoUri?: string;
      notes?: string;
    }
  ): Promise<DeliveryOrder> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    order.status = 'delivered';
    order.deliveredTime = new Date().toISOString();
    order.proofOfDelivery = {
      receivedBy: proof.receivedBy,
      recipientDesignation: proof.recipientDesignation || 'Hospital Staff / Doctor Assistant',
      signatureOrStampUri: proof.signatureOrStampUri || 'VERIFIED_OFFICIAL_STAMP_RECEIVED',
      photoUri: proof.photoUri,
      notes: proof.notes,
      deliveredAt: new Date().toISOString(),
    };

    // Trigger notification to the SENDER (RIO Scans Admin & Front Desk)
    this.notify({
      type: 'DELIVERED',
      order,
      recipient: 'scan_center_sender',
      title: `✅ Scan Film Successfully Delivered!`,
      body: `${order.scanType} (Patient: ${order.patientName}) delivered to ${order.destinationHospital} (${order.destinationDoctor}). Signed by ${proof.receivedBy}.`,
      timestamp: new Date().toISOString(),
    });

    try {
      if (firestore) {
        await setDoc(doc(firestore, 'deliveryOrders', order.id), order, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore delivery completion notice:', e);
    }

    return order;
  }

  /**
   * Broadcast updated GPS coordinates for live tracking
   */
  updateLocation(orderId: string, lat: number, lng: number, landmark?: string) {
    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      order.courierLocation = {
        latitude: lat,
        longitude: lng,
        updatedAt: new Date().toISOString(),
        speedKmph: Math.floor(25 + Math.random() * 20),
        landmark: landmark || order.courierLocation.landmark,
      };
    }
  }
}

export const deliveryService = new DeliveryService();
