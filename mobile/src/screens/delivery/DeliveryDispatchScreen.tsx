import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { DeliveryOrder, DeliveryPriority } from '../../types';
import { deliveryService } from '../../services/deliveryService';
import { AppIcon } from '../../components/common/AppIcon';

export const DeliveryDispatchScreen: React.FC = () => {
  const { colors: tc, isDark } = useAppTheme();

  const [orders, setOrders] = useState<DeliveryOrder[]>(deliveryService.getOrders());
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'in_transit' | 'pending' | 'delivered'>('all');
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<DeliveryOrder | null>(
    orders.find((o) => o.status === 'in_transit') || orders[0] || null
  );

  // New Dispatch Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [scanType, setScanType] = useState('1.5T MRI Brain + Contrast Film');
  const [destinationHospital, setDestinationHospital] = useState('TMC Hospital, High Ground');
  const [destinationDoctor, setDestinationDoctor] = useState('Dr. Arumugam MS (Neuro)');
  const [destinationPhone, setDestinationPhone] = useState('+91 94432 77011');
  const [priority, setPriority] = useState<DeliveryPriority>('urgent_stat');

  // Proof of Delivery Modal
  const [deliveryModalOrder, setDeliveryModalOrder] = useState<DeliveryOrder | null>(null);
  const [receivedByName, setReceivedByName] = useState('');
  const [receiverDesignation, setReceiverDesignation] = useState('Head OPD Staff Nurse');

  useEffect(() => {
    const unsubscribe = deliveryService.onNotification((event) => {
      Alert.alert(
        event.title,
        `${event.body}\n\n[Push Notification Sent to ${
          event.recipient === 'doctor_receiver' ? 'Receiving Doctor / Hospital' : 'RIO Scans Admin'
        }]`
      );
      setOrders(deliveryService.getOrders());
    });
    return unsubscribe;
  }, []);

  const handleCreateOrder = async () => {
    if (!patientName.trim()) {
      Alert.alert('Required', 'Please enter patient name.');
      return;
    }

    const created = await deliveryService.createOrder({
      patientName: patientName.trim(),
      patientAge: 45,
      patientGender: 'Female',
      scanType,
      packageDetails: '2 Large Film Sheets + Diagnostic CD + Signed Doctor Report',
      destinationHospital,
      destinationDoctor,
      destinationPhone,
      priority,
    });

    setOrders(deliveryService.getOrders());
    setActiveTrackingOrder(created);
    setIsNewModalOpen(false);
    setPatientName('');

    Alert.alert(
      'Scan Delivery Dispatched',
      `Order ${created.id} created for ${destinationDoctor} at ${destinationHospital}. Assigned to courier.`
    );
  };

  const handlePickup = async (orderId: string) => {
    const updated = await deliveryService.pickupPackage(orderId, 'Karthik Esakkimuthu (Bike #TN-72-AZ-4912)');
    setOrders(deliveryService.getOrders());
    setActiveTrackingOrder(updated);
  };

  const handleDeliver = async () => {
    if (!deliveryModalOrder || !receivedByName.trim()) {
      Alert.alert('Required', 'Please enter the name of the staff or doctor who received the scan film.');
      return;
    }

    const updated = await deliveryService.completeDelivery(deliveryModalOrder.id, {
      receivedBy: receivedByName.trim(),
      recipientDesignation: receiverDesignation.trim(),
      signatureOrStampUri: 'STAMP_VERIFIED_HOSPITAL_OFFICIAL',
    });

    setOrders(deliveryService.getOrders());
    setActiveTrackingOrder(updated);
    setDeliveryModalOrder(null);
    setReceivedByName('');
  };

  const filteredOrders = orders.filter((o) => {
    if (selectedFilter === 'in_transit') return o.status === 'in_transit';
    if (selectedFilter === 'pending') return o.status === 'pending_pickup';
    if (selectedFilter === 'delivered') return o.status === 'delivered';
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Top GPS Active Map Card (for active delivery) */}
      {activeTrackingOrder && (
        <View
          style={[
            styles.mapSimCard,
            { backgroundColor: isDark ? '#0F172A' : '#1E293B', borderColor: '#38BDF8' },
          ]}
        >
          <View style={styles.mapHeader}>
            <View style={styles.liveGpsBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveGpsText}>
                {activeTrackingOrder.status === 'delivered' ? 'DELIVERY COMPLETED' : 'LIVE GPS BROADCAST'}
              </Text>
            </View>
            <Text style={styles.mapEta}>
              {activeTrackingOrder.status === 'delivered'
                ? 'Delivered'
                : `ETA: ~${activeTrackingOrder.estimatedDeliveryMinutes || 15} Mins`}
            </Text>
          </View>

          {/* Simulated Satellite Route Track */}
          <View style={styles.routeBox}>
            <View style={styles.routePoint}>
              <Text style={styles.pointDotGreen}>●</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointLabel}>ORIGIN (SCAN CENTER)</Text>
                <Text style={styles.pointVal}>RIO Scans, Vannarpettai, Tirunelveli</Text>
              </View>
            </View>

            <View style={styles.routeDivider} />

            <View style={styles.routePoint}>
              <Text style={styles.pointDotRed}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointLabel}>DESTINATION HOSPITAL & DOCTOR</Text>
                <Text style={styles.pointVal}>
                  {activeTrackingOrder.destinationHospital} ({activeTrackingOrder.destinationDoctor})
                </Text>
              </View>
            </View>
          </View>

          {/* Courier Telemetry Bar */}
          <View style={styles.telemetryBar}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>COURIER</Text>
              <Text style={styles.telemetryVal}>{activeTrackingOrder.assignedCourierName}</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>SPEED</Text>
              <Text style={[styles.telemetryVal, { color: '#00FFCC' }]}>
                {activeTrackingOrder.courierLocation.speedKmph || 0} km/h
              </Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>LOCATION</Text>
              <Text style={styles.telemetryVal} numberOfLines={1}>
                {activeTrackingOrder.courierLocation.landmark || 'Tirunelveli Bypass'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Control Buttons & Filter Tabs */}
      <View style={styles.controlsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'in_transit', label: `In Transit (${orders.filter((o) => o.status === 'in_transit').length})` },
            { id: 'pending', label: `Pending (${orders.filter((o) => o.status === 'pending_pickup').length})` },
            { id: 'delivered', label: `Delivered (${orders.filter((o) => o.status === 'delivered').length})` },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterTabBtn,
                selectedFilter === tab.id && styles.filterTabBtnActive,
              ]}
              onPress={() => setSelectedFilter(tab.id as any)}
            >
              <Text
                style={[
                  styles.filterTabBtnText,
                  selectedFilter === tab.id && styles.filterTabBtnTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.dispatchBtn} onPress={() => setIsNewModalOpen(true)}>
          <AppIcon name="add" size={16} color="#FFFFFF" />
          <Text style={styles.dispatchBtnText}>New Delivery</Text>
        </TouchableOpacity>
      </View>

      {/* Delivery Order Cards */}
      <ScrollView contentContainerStyle={styles.ordersList} showsVerticalScrollIndicator={false}>
        {filteredOrders.map((order) => {
          const isSelected = activeTrackingOrder?.id === order.id;

          return (
            <TouchableOpacity
              key={order.id}
              activeOpacity={0.9}
              style={[
                styles.orderCard,
                {
                  backgroundColor: tc.card,
                  borderColor: isSelected ? '#00FFCC' : tc.cardBorder,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => setActiveTrackingOrder(order)}
            >
              <View style={styles.orderTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.orderIdText}>{order.id}</Text>
                    {order.priority === 'urgent_stat' && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentBadgeText}>⚡ STAT URGENT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.orderPatientName, { color: tc.text }]}>
                    {order.patientName} ({order.patientAge}y/{order.patientGender})
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        order.status === 'delivered'
                          ? '#DCFCE7'
                          : order.status === 'in_transit'
                          ? '#E0F2FE'
                          : '#FEF3C7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color:
                          order.status === 'delivered'
                            ? '#15803D'
                            : order.status === 'in_transit'
                            ? '#0369A1'
                            : '#B45309',
                      },
                    ]}
                  >
                    {order.status === 'in_transit'
                      ? '🚴 IN TRANSIT'
                      : order.status === 'delivered'
                      ? '✅ DELIVERED'
                      : '⏳ PENDING PICKUP'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.scanTypeText, { color: tc.textSecondary }]}>
                📦 {order.scanType}
              </Text>
              <Text style={[styles.destDocText, { color: tc.text }]}>
                🏥 Deliver to: <Text style={{ fontWeight: 'bold' }}>{order.destinationDoctor}</Text> at {order.destinationHospital}
              </Text>

              {/* Action Buttons */}
              <View style={styles.orderActions}>
                {order.status === 'pending_pickup' && (
                  <TouchableOpacity
                    style={styles.pickupActionBtn}
                    onPress={() => handlePickup(order.id)}
                  >
                    <AppIcon name="bicycle-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.pickupActionBtnText}>
                      Pickup Package & Notify Doctor ➔
                    </Text>
                  </TouchableOpacity>
                )}

                {order.status === 'in_transit' && (
                  <TouchableOpacity
                    style={styles.deliverActionBtn}
                    onPress={() => setDeliveryModalOrder(order)}
                  >
                    <AppIcon name="checkmark-done-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.deliverActionBtnText}>
                      Confirm Delivery & Stamp Seal
                    </Text>
                  </TouchableOpacity>
                )}

                {order.status === 'delivered' && order.proofOfDelivery && (
                  <View style={styles.proofBox}>
                    <Text style={styles.proofText}>
                      ✅ Handed over to: <Text style={{ fontWeight: 'bold' }}>{order.proofOfDelivery.receivedBy}</Text> ({order.proofOfDelivery.recipientDesignation}) at{' '}
                      {new Date(order.proofOfDelivery.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* New Dispatch Modal */}
      <Modal visible={isNewModalOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: tc.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.text }]}>Dispatch Scan Films / Reports</Text>
              <TouchableOpacity onPress={() => setIsNewModalOpen(false)}>
                <AppIcon name="close" size={22} color={tc.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>PATIENT FULL NAME *</Text>
              <TextInput
                style={[styles.modalInput, { color: tc.text, borderColor: tc.cardBorder }]}
                placeholder="e.g. S. Meenakshi"
                placeholderTextColor={tc.textTertiary}
                value={patientName}
                onChangeText={setPatientName}
              />

              <Text style={styles.inputLabel}>SCAN / SPECIMEN PACKAGE</Text>
              <TextInput
                style={[styles.modalInput, { color: tc.text, borderColor: tc.cardBorder }]}
                placeholder="1.5T Brain MRI Films + Contrast"
                placeholderTextColor={tc.textTertiary}
                value={scanType}
                onChangeText={setScanType}
              />

              <Text style={styles.inputLabel}>DESTINATION HOSPITAL (TIRUNELVELI)</Text>
              <TextInput
                style={[styles.modalInput, { color: tc.text, borderColor: tc.cardBorder }]}
                placeholder="TMC Hospital, High Ground"
                placeholderTextColor={tc.textTertiary}
                value={destinationHospital}
                onChangeText={setDestinationHospital}
              />

              <Text style={styles.inputLabel}>RECEIVING DOCTOR NAME & SPECIALTY</Text>
              <TextInput
                style={[styles.modalInput, { color: tc.text, borderColor: tc.cardBorder }]}
                placeholder="Dr. R. Arumugam M.S (Ortho)"
                placeholderTextColor={tc.textTertiary}
                value={destinationDoctor}
                onChangeText={setDestinationDoctor}
              />

              <Text style={styles.inputLabel}>PRIORITY</Text>
              <View style={styles.prioRow}>
                <TouchableOpacity
                  style={[styles.prioBtn, priority === 'urgent_stat' && styles.prioBtnUrgent]}
                  onPress={() => setPriority('urgent_stat')}
                >
                  <Text style={[styles.prioText, priority === 'urgent_stat' && styles.prioTextActive]}>
                    ⚡ STAT URGENT
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.prioBtn, priority === 'standard' && styles.prioBtnStd]}
                  onPress={() => setPriority('standard')}
                >
                  <Text style={[styles.prioText, priority === 'standard' && styles.prioTextActive]}>
                    Standard Delivery
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.createBtn} onPress={handleCreateOrder}>
                <Text style={styles.createBtnText}>Assign Courier & Dispatch ➔</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Proof of Delivery Modal */}
      <Modal visible={!!deliveryModalOrder} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: tc.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.text }]}>Confirm Proof of Delivery</Text>
              <TouchableOpacity onPress={() => setDeliveryModalOrder(null)}>
                <AppIcon name="close" size={22} color={tc.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.proofSub, { color: tc.textSecondary }]}>
              Package delivered to: {deliveryModalOrder?.destinationHospital}
            </Text>

            <Text style={styles.inputLabel}>RECEIVED BY (STAFF / DOCTOR NAME) *</Text>
            <TextInput
              style={[styles.modalInput, { color: tc.text, borderColor: tc.cardBorder }]}
              placeholder="e.g. Staff Nurse Revathi"
              placeholderTextColor={tc.textTertiary}
              value={receivedByName}
              onChangeText={setReceivedByName}
            />

            <Text style={styles.inputLabel}>RECIPIENT DESIGNATION</Text>
            <TextInput
              style={[styles.modalInput, { color: tc.text, borderColor: tc.cardBorder }]}
              placeholder="Head OPD Staff Nurse / Doctor Assistant"
              placeholderTextColor={tc.textTertiary}
              value={receiverDesignation}
              onChangeText={setReceiverDesignation}
            />

            <View style={styles.stampBox}>
              <AppIcon name="checkmark-done-circle" size={24} color="#059669" />
              <Text style={styles.stampText}>Official Hospital Seal & Signature Verified</Text>
            </View>

            <TouchableOpacity style={styles.createBtn} onPress={handleDeliver}>
              <Text style={styles.createBtnText}>Submit & Notify RIO Scans Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapSimCard: {
    margin: 16,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveGpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56,189,248,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  liveGpsText: {
    color: '#38BDF8',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mapEta: {
    color: '#00FFCC',
    fontSize: 12,
    fontWeight: '800',
  },
  routeBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 10,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointDotGreen: {
    color: '#10B981',
    fontSize: 16,
  },
  pointDotRed: {
    fontSize: 14,
  },
  pointLabel: {
    fontSize: 8.5,
    color: '#94A3B8',
    fontWeight: '800',
  },
  pointVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  routeDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginLeft: 6,
    marginVertical: 2,
  },
  telemetryBar: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 8.5,
    color: '#94A3B8',
    fontWeight: '800',
  },
  telemetryVal: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 1,
  },
  telemetryDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterScroll: {
    gap: 6,
  },
  filterTabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterTabBtnActive: {
    backgroundColor: '#075E54',
  },
  filterTabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTabBtnTextActive: {
    color: '#FFFFFF',
  },
  dispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#075E54',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  dispatchBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  ordersList: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  orderCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  orderIdText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  urgentBadgeText: {
    color: '#DC2626',
    fontSize: 8.5,
    fontWeight: '900',
  },
  orderPatientName: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  scanTypeText: {
    fontSize: 11.5,
    marginTop: 2,
  },
  destDocText: {
    fontSize: 11.5,
    marginTop: 4,
  },
  orderActions: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  pickupActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  pickupActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  deliverActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  deliverActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  proofBox: {
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
  },
  proofText: {
    fontSize: 11,
    color: '#15803D',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
  },
  prioRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  prioBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  prioBtnUrgent: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  prioBtnStd: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  prioText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  prioTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  createBtn: {
    backgroundColor: '#075E54',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  proofSub: {
    fontSize: 12,
    marginBottom: 8,
  },
  stampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    marginTop: 14,
    gap: 8,
  },
  stampText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
});
