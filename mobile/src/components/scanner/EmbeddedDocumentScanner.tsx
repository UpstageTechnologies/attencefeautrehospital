import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { useHospital } from '../../context/HospitalContext';
import { ReportType, ScannerFilter, ScannedReport } from '../../types';
import { SAMPLE_CHEST_XRAY, SAMPLE_BLOOD_TEST } from '../../services/dataStore';
import { AppIcon, IconName } from '../common/AppIcon';

interface EmbeddedDocumentScannerProps {
  visible: boolean;
  onClose: () => void;
  targetAppointmentId?: string;
  onScanComplete?: (report: ScannedReport) => void;
}

export const EmbeddedDocumentScanner: React.FC<EmbeddedDocumentScannerProps> = ({
  visible,
  onClose,
  targetAppointmentId,
  onScanComplete,
}) => {
  const insets = useSafeAreaInsets();
  const { appointments, attachScannedReport } = useHospital();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(
    targetAppointmentId || appointments[0]?.id || ''
  );
  const [reportType, setReportType] = useState<ReportType>('xray');
  const [reportTitle, setReportTitle] = useState<string>('Chest PA Digital Radiograph');
  const [filterMode, setFilterMode] = useState<ScannerFilter>('xray_contrast');
  const [torchOn, setTorchOn] = useState(false);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [step, setStep] = useState<'viewfinder' | 'review'>('viewfinder');

  // Sync target appointment if prop changes
  useEffect(() => {
    if (targetAppointmentId) {
      setSelectedAppointmentId(targetAppointmentId);
    }
  }, [targetAppointmentId]);

  // Request camera permission when modal becomes visible
  useEffect(() => {
    if (visible && (!permission || !permission.granted)) {
      requestPermission();
    }
  }, [visible]);

  const reportTypes: Array<{
    type: ReportType;
    label: string;
    iconName: IconName;
    defaultTitle: string;
    defaultFilter: ScannerFilter;
  }> = [
    { type: 'xray', label: 'X-Ray', iconName: 'scan-outline', defaultTitle: 'Chest PA Radiograph', defaultFilter: 'xray_contrast' },
    { type: 'blood_test', label: 'Blood Report', iconName: 'water-outline', defaultTitle: 'Complete Blood Count & Lipids', defaultFilter: 'document_bw' },
    { type: 'mri', label: 'MRI / CT Scan', iconName: 'medkit-outline', defaultTitle: 'Brain MRI T2 Contrast', defaultFilter: 'xray_contrast' },
    { type: 'ultrasound', label: 'Ultrasound', iconName: 'radio-outline', defaultTitle: 'Abdominal Ultrasound Scan', defaultFilter: 'original' },
    { type: 'prescription', label: 'Prescription', iconName: 'document-text-outline', defaultTitle: 'Previous Treatment Record', defaultFilter: 'document_bw' },
  ];

  const handleSelectReportType = (item: (typeof reportTypes)[0]) => {
    setReportType(item.type);
    setReportTitle(item.defaultTitle);
    setFilterMode(item.defaultFilter);
  };

  const handleCapture = async (preset?: 'xray' | 'blood') => {
    if (preset) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setScannedImageUri(preset === 'blood' ? SAMPLE_BLOOD_TEST : SAMPLE_CHEST_XRAY);
        setStep('review');
      }, 350);
      return;
    }

    if (cameraRef.current && permission?.granted) {
      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });
        setIsProcessing(false);
        if (photo?.uri) {
          setScannedImageUri(photo.uri);
          setStep('review');
          return;
        }
      } catch (error) {
        console.warn('Error taking picture from camera:', error);
        setIsProcessing(false);
      }
    }

    // Fallback if camera is unavailable (e.g. simulator)
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setScannedImageUri(reportType === 'blood_test' ? SAMPLE_BLOOD_TEST : SAMPLE_CHEST_XRAY);
      setStep('review');
    }, 400);
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setScannedImageUri(result.assets[0].uri);
        setStep('review');
      }
    } catch (err) {
      console.warn('Error picking image from library:', err);
      Alert.alert('Gallery Error', 'Could not open image library.');
    }
  };

  const handleSaveAndUpload = () => {
    if (!selectedAppointmentId) {
      if (Platform.OS === 'web') {
        window.alert('Please select a patient appointment to attach this report to.');
      } else {
        Alert.alert('Selection Required', 'Please select a patient appointment.');
      }
      return;
    }

    const apt = appointments.find((a) => a.id === selectedAppointmentId);
    const newReport = attachScannedReport(selectedAppointmentId, {
      patientId: apt?.patientId || 'pat_anon',
      patientName: apt?.patientName || 'Walk-in Patient',
      reportType,
      title: reportTitle,
      fileUri: scannedImageUri || SAMPLE_CHEST_XRAY,
      notes: notes || `Scanned with ${filterMode.replace('_', ' ')} filter at receptionist front desk.`,
      scannedBy: 'Kavitha Murugan (Desk 1)',
      filterApplied: filterMode,
      fileSize: reportType === 'xray' ? '4.2 MB' : '1.8 MB',
    });

    if (onScanComplete) {
      onScanComplete(newReport);
    }

    if (Platform.OS === 'web') {
      window.alert(`✅ Report Successfully Scanned & Attached!\nDoctor in Scan Room 1 can now view "${reportTitle}" on their screen.`);
    } else {
      Alert.alert('Report Uploaded', `Successfully attached "${reportTitle}" to ${apt?.patientName || 'patient'}.`);
    }

    // Reset and close
    setStep('viewfinder');
    setScannedImageUri(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top > 0 ? insets.top : 20 }]}>
        {/* Scanner Header with Vector Icons */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerCloseBtn}>
            <AppIcon name="close" size={20} color="#E2E8F0" />
            <Text style={styles.headerCloseText}>Close</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Document Scanner</Text>
            <Text style={styles.headerSubtitle}>Live Optical Camera</Text>
          </View>
          <TouchableOpacity
            onPress={() => setTorchOn(!torchOn)}
            style={[styles.torchBtn, torchOn && styles.torchBtnActive]}
          >
            <AppIcon
              name={torchOn ? 'flash' : 'flash-outline'}
              size={18}
              color={torchOn ? '#0F172A' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {step === 'viewfinder' ? (
          <View style={styles.viewfinderContainer}>
            {/* Report Type Selector Pills with Vector Icons */}
            <View style={styles.typeSelectorScroll}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
                {reportTypes.map((item) => {
                  const isSelected = reportType === item.type;
                  const iconColor = isSelected ? '#075E54' : '#94A3B8';
                  return (
                    <TouchableOpacity
                      key={item.type}
                      style={[styles.typePill, isSelected && styles.typePillActive]}
                      onPress={() => handleSelectReportType(item)}
                    >
                      <AppIcon name={item.iconName} size={16} color={iconColor} />
                      <Text style={[styles.typeLabel, isSelected && styles.typeLabelActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Viewfinder Camera Surface with Live Feed or Permission Prompt */}
            <View style={styles.cameraFrame}>
              {permission?.granted ? (
                <View style={StyleSheet.absoluteFill}>
                  <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    enableTorch={torchOn}
                  />

                  {/* Edge detection alignment guides overlay */}
                  <View style={[styles.cornerMarker, styles.cornerTopLeft]} pointerEvents="none" />
                  <View style={[styles.cornerMarker, styles.cornerTopRight]} pointerEvents="none" />
                  <View style={[styles.cornerMarker, styles.cornerBottomLeft]} pointerEvents="none" />
                  <View style={[styles.cornerMarker, styles.cornerBottomRight]} pointerEvents="none" />

                  {/* Laser scan line overlay */}
                  <View style={styles.scanLaserLine} pointerEvents="none" />

                  {/* Center reticle and instruction */}
                  <View style={styles.reticleCenter} pointerEvents="none">
                    <Text style={styles.reticleInstruction}>
                      Align {reportType === 'xray' ? 'X-Ray Film' : 'Medical Report Document'} Inside Corners
                    </Text>
                    <Text style={styles.reticleSubInstruction}>Auto-focus & optical capture active</Text>
                  </View>

                  {/* Filter indicator badge */}
                  <View style={styles.filterBadge} pointerEvents="none">
                    <Text style={styles.filterBadgeText}>
                      Mode: {filterMode === 'xray_contrast' ? 'High-Contrast Radiography' : 'Enhanced B&W Document'}
                    </Text>
                  </View>

                  {/* Processing overlay */}
                  {isProcessing && (
                    <View style={styles.processingOverlay}>
                      <ActivityIndicator size="large" color="#25D366" />
                      <Text style={styles.processingText}>Processing Optical Scan...</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.permissionPlaceholder}>
                  <AppIcon name="camera" size={48} color="#94A3B8" />
                  <Text style={styles.permissionTitle}>Camera Permission Required</Text>
                  <Text style={styles.permissionDesc}>
                    Please allow camera access to scan medical documents, X-rays, and pathology reports directly.
                  </Text>
                  <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                    <Text style={styles.permissionBtnText}>Enable Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Target Patient Selector */}
            <View style={styles.targetSection}>
              <Text style={styles.sectionLabel}>Attach to Patient / Token:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientRow}>
                {appointments.slice(0, 5).map((apt) => {
                  const isSelected = selectedAppointmentId === apt.id;
                  return (
                    <TouchableOpacity
                      key={apt.id}
                      style={[styles.patientChip, isSelected && styles.patientChipSelected]}
                      onPress={() => setSelectedAppointmentId(apt.id)}
                    >
                      <View style={[styles.tokenDot, isSelected && styles.tokenDotActive]}>
                        <Text style={styles.tokenDotText}>#{apt.tokenNumber}</Text>
                      </View>
                      <View>
                        <Text style={[styles.patientChipName, isSelected && styles.patientChipNameActive]}>
                          {apt.patientName}
                        </Text>
                        <Text style={styles.patientChipTime}>{apt.timeSlot}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Quick Demo Previews & Shutter Controls */}
            <View style={styles.controlsBar}>
              {/* Photo Library Picker */}
              <TouchableOpacity
                style={styles.auxBtn}
                onPress={handlePickFromGallery}
              >
                <AppIcon name="folder-outline" size={20} color="#38BDF8" />
                <Text style={styles.auxBtnText}>Photos</Text>
              </TouchableOpacity>

              {/* Shutter Button */}
              <TouchableOpacity
                style={[styles.shutterButton, isProcessing && styles.shutterButtonDisabled]}
                onPress={() => handleCapture()}
                disabled={isProcessing}
              >
                <View style={styles.shutterInnerRing}>
                  <View style={styles.shutterCore} />
                </View>
              </TouchableOpacity>

              {/* Sample Preset Button */}
              <TouchableOpacity
                style={styles.auxBtn}
                onPress={() => handleCapture('xray')}
              >
                <AppIcon name="scan-outline" size={20} color="#25D366" />
                <Text style={styles.auxBtnText}>Sample X-Ray</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Step 2: Review, Adjust Filters, and Attach */
          <ScrollView style={styles.reviewContainer} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.reviewImageCard}>
              <Text style={styles.reviewImageLabel}>Scanned Document Preview</Text>
              {scannedImageUri && (
                <Image
                  source={{ uri: scannedImageUri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Filter mode toggles */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionLabel}>Optical Enhancement Filter:</Text>
              <View style={styles.filterRow}>
                {(['xray_contrast', 'document_bw', 'original', 'color_enhanced'] as ScannerFilter[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterPill, filterMode === f && styles.filterPillActive]}
                    onPress={() => setFilterMode(f)}
                  >
                    <Text style={[styles.filterPillText, filterMode === f && styles.filterPillTextActive]}>
                      {f === 'xray_contrast'
                        ? 'X-Ray Density'
                        : f === 'document_bw'
                        ? 'Clean B&W'
                        : f === 'color_enhanced'
                        ? 'Sharp Color'
                        : 'Original'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Metadata Fields */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Report Title</Text>
              <TextInput
                style={styles.textInput}
                value={reportTitle}
                onChangeText={setReportTitle}
                placeholder="e.g. Chest X-Ray PA View"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Receptionist Clinical Notes / Observation</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Scanned original pathology report. Patient complaining of slight chest tightness."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.reviewActions}>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => setStep('viewfinder')}
              >
                <Text style={styles.retakeBtnText}>↺ Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveUploadBtn}
                onPress={handleSaveAndUpload}
              >
                <Text style={styles.saveUploadBtnText}>✓ Attach to Doctor</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  headerCloseText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  torchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchBtnActive: {
    backgroundColor: '#F59E0B',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  typeSelectorScroll: {
    paddingVertical: 10,
    backgroundColor: '#1E293B',
  },
  typeRow: {
    paddingHorizontal: 14,
    gap: 8,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#334155',
    gap: 6,
  },
  typePillActive: {
    backgroundColor: colors.whatsapp.accent,
  },
  typeLabel: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontWeight: '600',
  },
  typeLabelActive: {
    color: '#075E54',
    fontWeight: '700',
  },
  cameraFrame: {
    flex: 1,
    margin: 14,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#020617',
    position: 'relative',
  },
  cornerMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#25D366',
  },
  cornerTopLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  cornerTopRight: {
    top: 16,
    right: 16,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
  },
  cornerBottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  cornerBottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
  },
  scanLaserLine: {
    position: 'absolute',
    left: 30,
    right: 30,
    top: '48%',
    height: 2,
    backgroundColor: '#25D366',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  reticleCenter: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '25%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  reticleInstruction: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  reticleSubInstruction: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  filterBadge: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  filterBadgeText: {
    color: '#E2E8F0',
    fontSize: 11.5,
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  permissionPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  permissionDesc: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  permissionBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  permissionBtnText: {
    color: '#075E54',
    fontSize: 14,
    fontWeight: 'bold',
  },
  targetSection: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patientRow: {
    gap: 10,
  },
  patientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  patientChipSelected: {
    borderColor: '#25D366',
    backgroundColor: '#0F172A',
  },
  tokenDot: {
    backgroundColor: '#475569',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tokenDotActive: {
    backgroundColor: '#25D366',
  },
  tokenDotText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  patientChipName: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  patientChipNameActive: {
    color: '#25D366',
  },
  patientChipTime: {
    color: '#94A3B8',
    fontSize: 10,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0F172A',
  },
  auxBtn: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    minWidth: 85,
  },
  auxBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButtonDisabled: {
    opacity: 0.5,
  },
  shutterInnerRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#25D366',
  },
  reviewContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  reviewImageCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewImageLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 260,
    borderRadius: 8,
    backgroundColor: '#0A0D14',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterPillActive: {
    borderColor: '#25D366',
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
  },
  filterPillText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#25D366',
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  retakeBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  retakeBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  saveUploadBtn: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
