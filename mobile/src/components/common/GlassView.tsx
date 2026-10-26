import React from 'react';
import { View, ViewProps, StyleSheet, Platform } from 'react-native';
import { colors } from '../../theme/colors';

interface GlassViewProps extends ViewProps {
  intensity?: 'light' | 'medium' | 'heavy' | 'highlight' | 'frosted';
  borderRadius?: number;
  children?: React.ReactNode;
}

export const GlassView: React.FC<GlassViewProps> = ({
  intensity = 'medium',
  borderRadius = 22,
  style,
  children,
  ...props
}) => {
  const getBackgroundColor = () => {
    switch (intensity) {
      case 'light':
        return colors.glass.surfaceSubtle;
      case 'heavy':
        return colors.glass.surfaceUltra;
      case 'highlight':
        return colors.glass.surfaceHighlight;
      case 'frosted':
        return 'rgba(240, 248, 246, 0.88)';
      case 'medium':
      default:
        return colors.glass.surfaceLight;
    }
  };

  const getBorderColor = () => {
    if (intensity === 'highlight') {
      return colors.glass.borderTeal;
    }
    if (intensity === 'frosted') {
      return 'rgba(18, 140, 126, 0.25)';
    }
    return colors.glass.borderLight;
  };

  const webGlassStyle: any = Platform.OS === 'web' ? {
    backdropFilter: intensity === 'heavy' ? 'blur(36px) saturate(200%)' : 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: intensity === 'heavy' ? 'blur(36px) saturate(200%)' : 'blur(24px) saturate(180%)',
    boxShadow: intensity === 'highlight'
      ? '0 12px 34px rgba(18, 140, 126, 0.16)'
      : '0 8px 28px rgba(0, 0, 0, 0.06)',
  } : {};

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderRadius,
        },
        webGlassStyle,
        style,
      ]}
      {...props}
    >
      {/* Specular high-light reflection line on top border (iOS 26 Liquid Glass characteristic) */}
      <View
        style={[
          styles.specularHighlight,
          {
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
          }
        ]}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.2,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
});
