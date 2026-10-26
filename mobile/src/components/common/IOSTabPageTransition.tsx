import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  StyleProp,
} from 'react-native';

interface IOSTabPageTransitionProps {
  activeKey: string;
  tabOrder?: string[];
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Authentic Apple iOS Tab Page Transition
 * - Direction-aware subtle slide (left <-> right) matching tab bar layout
 * - Delicate micro-scale (0.985 -> 1.0) and silky cross-fade (0 -> 1)
 * - 60fps / 120fps ProMotion hardware acceleration via useNativeDriver
 */
export const IOSTabPageTransition: React.FC<IOSTabPageTransitionProps> = ({
  activeKey,
  tabOrder = [],
  children,
  style,
}) => {
  const prevKeyRef = useRef<string>(activeKey);
  const directionRef = useRef<number>(1);
  const animProgress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (prevKeyRef.current !== activeKey) {
      // Determine tab shift direction based on tab index order
      const prevIdx = tabOrder.indexOf(prevKeyRef.current);
      const nextIdx = tabOrder.indexOf(activeKey);

      if (prevIdx !== -1 && nextIdx !== -1) {
        directionRef.current = nextIdx >= prevIdx ? 1 : -1;
      } else {
        directionRef.current = 1;
      }

      prevKeyRef.current = activeKey;

      // Reset and trigger iOS fluid cubic-bezier transition
      animProgress.setValue(0);
      Animated.timing(animProgress, {
        toValue: 1,
        duration: 230,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }).start();
    }
  }, [activeKey, tabOrder]);

  const translateX = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [directionRef.current * 20, 0],
    extrapolate: 'clamp',
  });

  const scale = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.988, 1],
    extrapolate: 'clamp',
  });

  const opacity = animProgress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.65, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity,
          transform: [{ translateX }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
