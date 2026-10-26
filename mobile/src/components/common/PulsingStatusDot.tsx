import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';

interface PulsingStatusDotProps {
  color?: string;
  size?: number;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Idle animated pulsing status indicator dot
 * Smoothly scales a translucent halo ring around the status dot with native driver.
 */
export const PulsingStatusDot: React.FC<PulsingStatusDotProps> = ({
  color = '#10B981',
  size = 9,
  active = true,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulseAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [active]);

  const haloScale = pulseAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 1.85, 2.2],
  });

  const haloOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.3, 0.8, 1],
    outputRange: [0.75, 0.5, 0.15, 0],
  });

  return (
    <View
      style={[
        styles.container,
        { width: size * 2.2, height: size * 2.2 },
        style,
      ]}
    >
      {active && (
        <Animated.View
          style={[
            styles.halo,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              transform: [{ scale: haloScale }],
              opacity: haloOpacity,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.coreDot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
  },
  coreDot: {
    zIndex: 1,
  },
});
