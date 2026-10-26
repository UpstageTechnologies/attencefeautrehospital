import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { colors } from '../../theme/colors';
import { GlassView } from '../../components/common/GlassView';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { ScannedReport } from '../../types';

export const MedicalRecordsScreen: React.FC = () => {
  const { appointments } = useHospital();
  const { user, isDemo } = useAuth();
  
  // Aggregate all scanned reports for this patient
  const targetName = user?.name || (isDemo ? 'Gowri T' : '');
  const patientApts = appointments.filter((a) => {
    if (user?.id && a.patientId === user.id) return true;
    if (targetName && a.patientName === targetName) return true;
    if (isDemo && a.patientName === 'Gowri T') return true;
    return false;
  });
  const allReports: ScannedReport[] = patientApts.flatMap(a => a.scannedReports);

  const [inspectReport, setInspectReport] = useState<ScannedReport | null>(null);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Medical Vault</Text>
          <Text style={styles.subtitle}>
            Scanned X-Rays, Blood Tests & Prescriptions ({allReports.length})
          </Text>
        </View>

        {allReports.map((report) => (
          <GlassView key={report.id} style={styles.reportCard}>
            <View style={styles.reportRow}>
              <View style={styles.thumbWrap}>
                <Image source={{ uri: report.fileUri }} style={styles.thumbImage} />
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {report.reportType === 'xray' ? '🩻 X-RAY' : '🩸 BLOOD'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportDate}>{report.scanDate}</Text>
                <Text style={styles.scannedByText}>Scanned by: {report.scannedBy}</Text>
                {report.notes && (
                  <Text style={styles.notesText} numberOfLines={2}>
                    💬 {report.notes}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => setInspectReport(report)}
                >
                  <Text style={styles.viewBtnText}>Inspect Document ➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          </GlassView>
        ))}

        {allReports.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 38, marginBottom: 10 }}>📁</Text>
            <Text style={[styles.emptyText, { fontWeight: '700', fontSize: 16, color: '#0F172A', marginBottom: 4 }]}>
              Vault is Clean & Empty
            </Text>
            <Text style={[styles.emptyText, { fontSize: 13, color: '#64748B', lineHeight: 18 }]}>
              No digital medical scans or reports have been uploaded yet. When you complete an OPD consultation or lab test, your verified digital reports will appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* High-Res View Modal */}
      <Modal visible={!!inspectReport} transparent animationType="fade" onRequestClose={() => setInspectReport(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{inspectReport?.title}</Text>
                <Text style={styles.modalSub}>{inspectReport?.scanDate}</Text>
              </View>
              <TouchableOpacity onPress={() => setInspectReport(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.imageWrap}>
              {inspectReport && (
                <Image source={{ uri: inspectReport.fileUri }} style={styles.fullImage} resizeMode="contain" />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbWrap: {
    width: 100,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  reportDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  scannedByText: {
    fontSize: 11,
    color: '#075E54',
    fontWeight: '500',
    marginTop: 2,
  },
  notesText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
    fontStyle: 'italic',
  },
  viewBtn: {
    backgroundColor: colors.whatsapp.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageWrap: {
    height: 380,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#020617',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
