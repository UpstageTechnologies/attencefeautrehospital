import React, { useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { StaffMember, UserRole } from '../../types';
import { firebaseAuthService } from '../../services/firebaseAuthService';
import { AppIcon } from '../../components/common/AppIcon';

export const StaffCredentialsScreen: React.FC = () => {
  const { colors: tc, isDark } = useAppTheme();
  const { isDemo } = useAuth();

  const [staffList, setStaffList] = useState<StaffMember[]>(() =>
    firebaseAuthService.getStaffMembers(isDemo)
  );
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Staff Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [department, setDepartment] = useState('Radiology (MRI/CT)');
  const [floor, setFloor] = useState<1 | 2 | 3>(2);
  const [shift, setShift] = useState<'morning' | 'evening' | 'night' | 'general'>('morning');
  const [baseSalary, setBaseSalary] = useState('25000');
  const [initialPassword, setInitialPassword] = useState('Rio@1234');
  const [isCreating, setIsCreating] = useState(false);

  const filteredStaff = staffList.filter((s) => {
    if (selectedFloor !== 'all' && s.floor !== selectedFloor) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateStaff = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Required Fields', 'Please fill in Name, Email and Phone number.');
      return;
    }

    setIsCreating(true);
    const res = await firebaseAuthService.createStaffCredentialByOwner({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      department,
      floor,
      shift,
      baseSalary: Number(baseSalary) || 20000,
      initialPassword: initialPassword.trim(),
    });

    setIsCreating(false);

    if (res.success && res.staffMember) {
      setStaffList((prev) => [res.staffMember!, ...prev]);
      setIsAddModalOpen(false);
      Alert.alert(
        'Staff Login Created!',
        `Staff ID: ${res.staffMember.id}\nInitial Password: ${initialPassword}\nFloor: ${res.staffMember.floor}\nDepartment: ${res.staffMember.department}`,
        [{ text: 'OK' }]
      );
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
    } else {
      Alert.alert('Error', res.error || 'Failed to create staff login');
    }
  };

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'owner':
        return { bg: '#FEF3C7', text: '#B45309' };
      case 'doctor':
        return { bg: '#EFF6FF', text: '#1D4ED8' };
      case 'receptionist':
        return { bg: '#FAF5FF', text: '#7E22CE' };
      case 'delivery':
        return { bg: '#FFFBEB', text: '#D97706' };
      default:
        return { bg: '#DCFCE7', text: '#15803D' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* Top Banner */}
      <View style={[styles.topSummaryBar, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9' }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: '#075E54' }]}>{staffList.length}</Text>
          <Text style={[styles.summaryLabel, { color: tc.textSecondary }]}>Total Staff</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: '#2563EB' }]}>
            {staffList.filter((s) => s.floor === 1).length}
          </Text>
          <Text style={[styles.summaryLabel, { color: tc.textSecondary }]}>Floor 1 (OPD)</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: '#7C3AED' }]}>
            {staffList.filter((s) => s.floor === 2).length}
          </Text>
          <Text style={[styles.summaryLabel, { color: tc.textSecondary }]}>Floor 2 (Scans)</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: '#D97706' }]}>
            {staffList.filter((s) => s.floor === 3).length}
          </Text>
          <Text style={[styles.summaryLabel, { color: tc.textSecondary }]}>Floor 3 (Labs)</Text>
        </View>
      </View>

      {/* Action Row & Search */}
      <View style={styles.actionRow}>
        <View style={[styles.searchBox, { backgroundColor: isDark ? '#1C2431' : '#F1F5F9', borderColor: tc.cardBorder }]}>
          <AppIcon name="search-outline" size={16} color={tc.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: tc.text }]}
            placeholder="Search by name, ID, or department..."
            placeholderTextColor={tc.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setIsAddModalOpen(true)}
        >
          <AppIcon name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>+ Add Staff</Text>
        </TouchableOpacity>
      </View>

      {/* Floor Filter Pills */}
      <View style={styles.floorPillsRow}>
        <TouchableOpacity
          style={[styles.floorPill, selectedFloor === 'all' && styles.floorPillActive]}
          onPress={() => setSelectedFloor('all')}
        >
          <Text style={[styles.floorPillText, selectedFloor === 'all' && styles.floorPillTextActive]}>
            All Floors
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.floorPill, selectedFloor === 1 && styles.floorPillActive]}
          onPress={() => setSelectedFloor(1)}
        >
          <Text style={[styles.floorPillText, selectedFloor === 1 && styles.floorPillTextActive]}>
            Floor 1 (Reception & USG)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.floorPill, selectedFloor === 2 && styles.floorPillActive]}
          onPress={() => setSelectedFloor(2)}
        >
          <Text style={[styles.floorPillText, selectedFloor === 2 && styles.floorPillTextActive]}>
            Floor 2 (MRI & CT Lift)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.floorPill, selectedFloor === 3 && styles.floorPillActive]}
          onPress={() => setSelectedFloor(3)}
        >
          <Text style={[styles.floorPillText, selectedFloor === 3 && styles.floorPillTextActive]}>
            Floor 3 (Pathology)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Staff Roster List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredStaff.map((staff) => {
          const badge = getRoleBadgeColor(staff.role);
          return (
            <View
              key={staff.id}
              style={[
                styles.staffCard,
                { backgroundColor: tc.card, borderColor: tc.cardBorder },
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.staffAvatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {staff.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.nameCol}>
                  <Text style={[styles.staffNameText, { color: tc.text }]} numberOfLines={1}>
                    {staff.name}
                  </Text>
                  <Text style={[styles.deptText, { color: tc.textSecondary }]}>
                    {staff.department} • Floor {staff.floor}
                  </Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.roleBadgeText, { color: badge.text }]}>
                    {staff.role.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={[styles.credPillRow, { backgroundColor: isDark ? '#1C2431' : '#F8FAFC' }]}>
                <View style={styles.credItem}>
                  <Text style={styles.credLabel}>STAFF ID</Text>
                  <Text style={[styles.credVal, { color: tc.text }]}>{staff.id}</Text>
                </View>
                <View style={styles.credDivider} />
                <View style={styles.credItem}>
                  <Text style={styles.credLabel}>PASSWORD / PIN</Text>
                  <Text style={[styles.credVal, { color: '#075E54' }]}>
                    {staff.employeePin || 'Rio@1234'}
                  </Text>
                </View>
                <View style={styles.credDivider} />
                <View style={styles.credItem}>
                  <Text style={styles.credLabel}>BASE SALARY</Text>
                  <Text style={[styles.credVal, { color: tc.text }]}>
                    ₹{staff.baseSalary.toLocaleString('en-IN')}/m
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.metaRow}>
                  <AppIcon name="time-outline" size={13} color={tc.textSecondary} />
                  <Text style={[styles.metaText, { color: tc.textSecondary }]}>
                    Shift: {staff.shiftTiming}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <AppIcon
                    name={staff.faceRegistered ? 'scan-circle' : 'alert-circle-outline'}
                    size={14}
                    color={staff.faceRegistered ? '#059669' : '#D97706'}
                  />
                  <Text
                    style={[
                      styles.metaText,
                      { color: staff.faceRegistered ? '#059669' : '#D97706', fontWeight: '700' },
                    ]}
                  >
                    {staff.faceRegistered ? 'Face Enrolled' : 'Pending Face'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {filteredStaff.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>👥</Text>
            <Text style={[styles.emptyTitle, { color: tc.text }]}>No Staff Records Found</Text>
            <Text style={[styles.emptySubtitle, { color: tc.textSecondary }]}>
              {isDemo
                ? 'No staff members match the current filter or search.'
                : 'Your hospital employee directory is clean. Tap "+ Add Staff" to issue credentials for your first doctor, receptionist, nurse or technician.'}
            </Text>
            {!isDemo && (
              <TouchableOpacity
                style={[styles.addStaffEmptyBtn, { backgroundColor: colors.whatsapp.primary }]}
                onPress={() => setIsAddModalOpen(true)}
              >
                <AppIcon name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addStaffEmptyBtnText}>Add First Staff Member</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Staff Modal */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: tc.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.text }]}>Add New Staff Credentials</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <AppIcon name="close" size={22} color={tc.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>FULL NAME *</Text>
              <TextInput
                style={[styles.modalInput, { color: tc.text, borderColor: tc.cardBorder }]}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor={tc.textTertiary}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>OFFICIAL EMAIL *</Text>
              <TextInput
                style={[styles.modalInput, { color: tc.text, borderColor: tc.cardBorder }]}
                placeholder="ramesh@rioscans.in"
                placeholderTextColor={tc.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.inputLabel}>PHONE NUMBER (10 DIGITS) *</Text>
              <TextInput
                style={[styles.modalInput, { color: tc.text, borderColor: tc.cardBorder }]}
                placeholder="94431 00000"
                placeholderTextColor={tc.textTertiary}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.inputLabel}>ROLE</Text>
              <View style={styles.roleChoiceRow}>
                {(['staff', 'doctor', 'receptionist', 'delivery'] as UserRole[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleChoiceBtn, role === r && styles.roleChoiceBtnActive]}
                    onPress={() => setRole(r)}
                  >
                    <Text
                      style={[
                        styles.roleChoiceText,
                        role === r && styles.roleChoiceTextActive,
                      ]}
                    >
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>DEPARTMENT & FLOOR</Text>
              <View style={styles.roleChoiceRow}>
                {[1, 2, 3].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.floorBtn, floor === f && styles.floorBtnActive]}
                    onPress={() => setFloor(f as any)}
                  >
                    <Text style={[styles.floorBtnText, floor === f && styles.floorBtnTextActive]}>
                      Floor {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>BASE MONTHLY SALARY (INR)</Text>
              <TextInput
                style={[styles.modalInput, { color: tc.text, borderColor: tc.cardBorder }]}
                placeholder="25000"
                placeholderTextColor={tc.textTertiary}
                keyboardType="numeric"
                value={baseSalary}
                onChangeText={setBaseSalary}
              />

              <Text style={styles.inputLabel}>TEMPORARY PASSWORD / PIN</Text>
              <TextInput
                style={[styles.modalInput, { color: tc.text, borderColor: tc.cardBorder }]}
                placeholder="Rio@1234"
                placeholderTextColor={tc.textTertiary}
                value={initialPassword}
                onChangeText={setInitialPassword}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateStaff}
                disabled={isCreating}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {isCreating ? 'Creating Login...' : 'Create Credentials & Save'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
  topSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNum: {
    fontSize: 16,
    fontWeight: '900',
  },
  summaryLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#075E54',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  floorPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  floorPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  floorPillActive: {
    backgroundColor: '#075E54',
  },
  floorPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  floorPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  staffCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  staffAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#075E54',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  nameCol: {
    flex: 1,
  },
  staffNameText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  deptText: {
    fontSize: 11,
    marginTop: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  credPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  credItem: {
    flex: 1,
    alignItems: 'center',
  },
  credLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  credVal: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  credDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 5,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
  },
  roleChoiceRow: {
    flexDirection: 'row',
    gap: 6,
  },
  roleChoiceBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  roleChoiceBtnActive: {
    backgroundColor: '#075E54',
    borderColor: '#075E54',
  },
  roleChoiceText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  roleChoiceTextActive: {
    color: '#FFFFFF',
  },
  floorBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  floorBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  floorBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  floorBtnTextActive: {
    color: '#FFFFFF',
  },
  modalSubmitBtn: {
    backgroundColor: '#075E54',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  addStaffEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addStaffEmptyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
