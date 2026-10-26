import { StyleSheet, Platform } from 'react-native';
import { colors } from './colors';

export const glassStyles = StyleSheet.create({
  // iOS Liquid Glass Card
  glassCard: {
    backgroundColor: colors.glass.surfaceLight,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: colors.glass.borderLight,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 14,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.07,
        shadowRadius: 18,
      },
      android: {
        elevation: 4,
      },
      web: {
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
      } as any,
    }),
  },

  // Highlighted Glass Card (for active room consulting or current token)
  glassCardHighlight: {
    backgroundColor: colors.glass.surfaceHighlight,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.glass.borderTeal,
    padding: 18,
    marginVertical: 8,
    marginHorizontal: 14,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.whatsapp.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
      web: {
        backdropFilter: 'blur(34px) saturate(200%)',
        WebkitBackdropFilter: 'blur(34px) saturate(200%)',
        boxShadow: '0 12px 36px rgba(18, 140, 126, 0.18)',
      } as any,
    }),
  },

  // Floating iOS Liquid Glass Bottom Navigation Bar
  glassTabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 26 : 16,
    left: 18,
    right: 18,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.glass.tabBarGlass,
    borderWidth: 1.5,
    borderColor: colors.glass.tabBarBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.14,
        shadowRadius: 30,
      },
      android: {
        elevation: 12,
      },
      web: {
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        boxShadow: '0 14px 44px rgba(0, 0, 0, 0.14)',
      } as any,
    }),
  },

  // WhatsApp-style Pill Chip with Glass Polish
  glassPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.glass.pillActiveBg,
    borderWidth: 1,
    borderColor: colors.glass.pillActiveBorder,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // WhatsApp Chat Row Glass Item
  whatsappRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.whatsapp.chatRowBorder,
    backgroundColor: '#FFFFFF',
  },
});
