import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { AppIcon } from '../common/AppIcon';

export interface PhotoPickerModalProps {
  visible: boolean;
  currentPhotoUri?: string;
  currentAvatarUrl?: string;
  title?: string;
  userName?: string;
  userRole?: string;
  onClose: () => void;
  onSelectPhoto?: (uri: string) => void;
  onSelectAvatar?: (uri: string) => void;
}

// Curated high-resolution medical and executive preset avatars
export const PRESET_AVATARS = [
  {
    id: 'avatar_doc_female_1',
    label: 'Dr. Preetha',
    uri: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
    category: 'doctor',
  },
  {
    id: 'avatar_doc_male_1',
    label: 'Dr. Rajesh',
    uri: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    category: 'doctor',
  },
  {
    id: 'avatar_doc_male_2',
    label: 'Dr. Senthil',
    uri: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
    category: 'doctor',
  },
  {
    id: 'avatar_recep_female_1',
    label: 'Kavitha',
    uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    category: 'receptionist',
  },
  {
    id: 'avatar_recep_female_2',
    label: 'Ananya',
    uri: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=300&auto=format&fit=crop&q=80',
    category: 'receptionist',
  },
  {
    id: 'avatar_patient_female_1',
    label: 'Gowri T',
    uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    category: 'patient',
  },
  {
    id: 'avatar_patient_male_1',
    label: 'Muthukumar',
    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    category: 'patient',
  },
  {
    id: 'avatar_owner_male_1',
    label: 'Dr. Arumugam',
    uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    category: 'owner',
  },
];

export const PhotoPickerModal: React.FC<PhotoPickerModalProps> = ({
  visible,
  currentPhotoUri,
  currentAvatarUrl,
  title,
  userName = 'User',
  userRole = 'Account',
  onClose,
  onSelectPhoto,
  onSelectAvatar,
}) => {
  const { colors: tc, isDark } = useAppTheme();
  const [showPresets, setShowPresets] = useState(false);

  const activePhotoUri = currentPhotoUri || currentAvatarUrl;
  const handleSelect = (uri: string) => {
    if (onSelectAvatar) {
      onSelectAvatar(uri);
    } else if (onSelectPhoto) {
      onSelectPhoto(uri);
    }
    onClose();
  };

  const handleLaunchCamera = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Camera Access Required',
            'Please enable camera permissions in your device settings to take a profile picture.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleSelect(result.assets[0].uri);
      }
    } catch (err: any) {
      console.warn('Camera launch error:', err);
      Alert.alert('Camera Error', 'Unable to launch camera. Please try selecting a photo from the gallery.');
    }
  };

  const handleLaunchLibrary = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Photo Library Access Required',
            'Please enable photo library access in your device settings to select a picture.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleSelect(result.assets[0].uri);
      }
    } catch (err: any) {
      console.warn('Gallery launch error:', err);
      Alert.alert('Gallery Error', 'Unable to access photos. You can choose from the preset avatars.');
    }
  };

  const handleSelectPreset = (uri: string) => {
    setShowPresets(false);
    handleSelect(uri);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheetCard,
            {
              backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.65)',
            },
          ]}
        >
          {/* iOS 27 Top Specular Highlight */}
          <View
            style={[
              styles.specularBar,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.9)' },
            ]}
          />

          {/* Sheet Handle Indicator */}
          <View style={styles.sheetHandle} />

          {/* Header with Avatar Preview */}
          <View style={styles.headerRow}>
            <View style={styles.previewAvatarWrap}>
              {activePhotoUri ? (
                <Image source={{ uri: activePhotoUri }} style={styles.previewAvatar} />
              ) : (
                <View style={[styles.previewInitials, { backgroundColor: isDark ? '#2C2C2E' : '#EEF2FF' }]}>
                  <Text style={[styles.previewInitialsText, { color: tc.primary }]}>
                    {userName.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIconBadge}>
                <AppIcon name="camera" size={13} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.headerInfo}>
              <Text style={[styles.sheetTitle, { color: tc.text }]}>{title || 'Change Profile Picture'}</Text>
              <Text style={[styles.sheetSubtitle, { color: tc.textSecondary }]}>
                {userName} • {userRole}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <AppIcon name="close" size={18} color={tc.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Action Buttons Row */}
          {!showPresets ? (
            <View style={styles.actionsList}>
              <TouchableOpacity
                style={[styles.actionTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}
                onPress={handleLaunchCamera}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(37, 211, 102, 0.15)' }]}>
                  <AppIcon name="camera" size={20} color={colors.whatsapp.primary} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={[styles.actionTitle, { color: tc.text }]}>Take New Photo</Text>
                  <Text style={[styles.actionSub, { color: tc.textSecondary }]}>Use your camera for a live picture</Text>
                </View>
                <AppIcon name="chevron-forward" size={16} color={tc.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}
                onPress={handleLaunchLibrary}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                  <AppIcon name="images" size={20} color="#0284C7" />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={[styles.actionTitle, { color: tc.text }]}>Choose from Gallery</Text>
                  <Text style={[styles.actionSub, { color: tc.textSecondary }]}>Select an existing image from photos</Text>
                </View>
                <AppIcon name="chevron-forward" size={16} color={tc.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionTile, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder }]}
                onPress={() => setShowPresets(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <AppIcon name="person" size={20} color="#A855F7" />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={[styles.actionTitle, { color: tc.text }]}>Choose Curated Avatar</Text>
                  <Text style={[styles.actionSub, { color: tc.textSecondary }]}>Pick from 8 professional preset avatars</Text>
                </View>
                <AppIcon name="chevron-forward" size={16} color={tc.textTertiary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.presetSection}>
              <View style={styles.presetHeader}>
                <TouchableOpacity
                  style={styles.presetBackBtn}
                  onPress={() => setShowPresets(false)}
                >
                  <AppIcon name="arrow-back" size={16} color={tc.primary} />
                  <Text style={[styles.presetBackText, { color: tc.primary }]}>Back to Options</Text>
                </TouchableOpacity>
                <Text style={[styles.presetCountText, { color: tc.textSecondary }]}>
                  Select an Avatar
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsGrid}
              >
                {PRESET_AVATARS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.presetCard,
                      { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC', borderColor: tc.cardBorder },
                      currentPhotoUri === item.uri && styles.presetCardActive,
                    ]}
                    onPress={() => handleSelectPreset(item.uri)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.uri }} style={styles.presetImage} />
                    <Text style={[styles.presetLabel, { color: tc.text }]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text style={styles.presetCategory}>{item.category.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelBtnText, { color: tc.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheetCard: {
    width: '100%',
    maxWidth: 500,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.2,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
      },
      android: {
        elevation: 16,
      },
      web: {
        backdropFilter: 'blur(30px) saturate(200%)',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
      } as any,
    }),
  },
  specularBar: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 40,
    height: 1.5,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(156, 163, 175, 0.5)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  previewAvatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  previewAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.whatsapp.primary,
  },
  previewInitials: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.whatsapp.primary,
  },
  previewInitialsText: {
    fontSize: 20,
    fontWeight: '800',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.whatsapp.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sheetSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
  },
  actionsList: {
    gap: 10,
    marginBottom: 16,
  },
  actionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  actionSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  presetSection: {
    marginBottom: 16,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  presetBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  presetBackText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  presetCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetsGrid: {
    gap: 12,
    paddingVertical: 4,
  },
  presetCard: {
    width: 82,
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  presetCardActive: {
    borderColor: colors.whatsapp.primary,
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
  },
  presetImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 6,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  presetCategory: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0D9488',
    marginTop: 2,
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
});
