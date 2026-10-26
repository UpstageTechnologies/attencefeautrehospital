import React, { useRef } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';

interface AnimatedPressableCardProps {
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  activeScale?: number;
  activeOpacity?: number;
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * Micro-interaction wrapper for cards, list items, and action tiles.
 * Provides authentic iOS spring scale & opacity feedback on press.
 */
export const AnimatedPressableCard: React.FC<AnimatedPressableCardProps> = ({
  onPress,
  style,
  activeScale = 0.982,
  activeOpacity = 0.88,
  disabled = false,
  children,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: activeScale,
        useNativeDriver: true,
        speed: 35,
        bounciness: 4,
      }),
      Animated.timing(opacityAnim, {
        toValue: activeOpacity,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 6,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
