import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IOSPushTransitionProps {
  visible: boolean;
  onBackCompleted: () => void;
  children: React.ReactNode;
  underlyingScreen?: React.ReactNode;
}

/**
 * Authentic native iOS UINavigationController push & pop transition
 * - Pushes in from right with left-edge specular drop shadow
 * - Simultaneously pushes underlying screen slightly left (-24%) with subtle dimming
 * - Smoothly pops back to right upon dismissal before unmounting
 */
export const IOSPushTransition: React.FC<IOSPushTransitionProps> = ({
  visible,
  onBackCompleted,
  children,
  underlyingScreen,
}) => {
  const [shouldRenderPushed, setShouldRenderPushed] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRenderPushed(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 320,
        easing: Easing.bezier(0.28, 0.84, 0.42, 1), // Apple native deceleration curve
        useNativeDriver: true,
      }).start();
    } else if (shouldRenderPushed) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 260,
        easing: Easing.bezier(0.32, 0, 0.67, 0), // iOS native pop acceleration curve
        useNativeDriver: true,
      }).start(() => {
        setShouldRenderPushed(false);
        onBackCompleted();
      });
    }
  }, [visible]);

  // Pushed screen slides from SCREEN_WIDTH to 0
  const pushedTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH, 0],
    extrapolate: 'clamp',
  });

  // Underlying screen subtly shifts left by 24% and dims
  const underlyingTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_WIDTH * 0.24],
    extrapolate: 'clamp',
  });

  const underlyingOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.86],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Underlying Screen (shifts back during push) */}
      {underlyingScreen && (
        <Animated.View
          style={[
            styles.fullScreen,
            {
              transform: [{ translateX: underlyingTranslateX }],
              opacity: underlyingOpacity,
            },
          ]}
          pointerEvents={visible ? 'none' : 'auto'}
        >
          {underlyingScreen}
        </Animated.View>
      )}

      {/* Pushed Screen (slides in from right with iOS drop shadow) */}
      {shouldRenderPushed && (
        <Animated.View
          style={[
            styles.fullScreen,
            styles.pushedScreen,
            {
              transform: [{ translateX: pushedTranslateX }],
            },
          ]}
        >
          {children}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
  },
  pushedScreen: {
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '-4px 0 16px rgba(0,0,0,0.12)',
      },
    }),
  },
});
