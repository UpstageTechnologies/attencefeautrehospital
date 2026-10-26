import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
  TextStyle,
  ImageSourcePropType,
  Image,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';
import { AppIcon, IconName } from './AppIcon';

export interface TabItem {
  id: string;
  label: string;
  iconOutline: IconName;
  iconFilled: IconName;
  badge?: number | string;
  disablePopToTop?: boolean;
}

export type IconPropValue =
  | IconName
  | string
  | {
      default: IconName | string;
      selected: IconName | string;
    };

export type ImageSrcPropValue =
  | ImageSourcePropType
  | {
      default: ImageSourcePropType;
      selected: ImageSourcePropType;
    };

export interface TriggerIconProps {
  sf?: IconPropValue;
  md?: IconPropValue;
  src?: ImageSrcPropValue;
  renderingMode?: 'template' | 'original';
}

export interface TriggerLabelProps {
  hidden?: boolean;
  children?: React.ReactNode;
}

export interface TriggerBadgeProps {
  children?: React.ReactNode;
}

export interface TriggerProps {
  name: string;
  disablePopToTop?: boolean;
  disableScrollToTop?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  role?: string;
  contentStyle?: ViewStyle;
  children?: React.ReactNode;
}

export interface NativeTabsProps {
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  onScrollToTop?: (tabId: string) => void;
  hidden?: boolean;
  tintColor?: string;
  iconColor?: {
    default?: string;
    selected?: string;
  };
  labelStyle?: TextStyle;
  disableTransparentOnScrollEdge?: boolean;
  minimizeBehavior?: 'none' | 'onScrollDown';
  children?: React.ReactNode;
}

// Marker components for JSX compound declaration
const Trigger: React.FC<TriggerProps> = ({ children }) => <>{children}</>;
const TriggerLabel: React.FC<TriggerLabelProps> = ({ children }) => <>{children}</>;
const TriggerIcon: React.FC<TriggerIconProps> = () => null;
const TriggerBadge: React.FC<TriggerBadgeProps> = ({ children }) => <>{children}</>;
const BottomAccessory: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

// Helper to flatten children including React Fragments
const flattenChildren = (nodes: React.ReactNode): React.ReactElement[] => {
  const result: React.ReactElement[] = [];
  React.Children.forEach(nodes, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      result.push(...flattenChildren((child.props as any).children));
    } else {
      result.push(child);
    }
  });
  return result;
};

// Map SF Symbols / MD / Custom names to AppIcon IconNames
const resolveIconName = (val: IconPropValue | undefined, isSelected: boolean): IconName => {
  if (!val) return 'pulse' as any;
  let rawName: string;
  if (typeof val === 'string') {
    rawName = val;
  } else {
    rawName = isSelected ? val.selected : val.default;
  }

  // Common SF Symbol aliases
  const aliasMap: Record<string, IconName> = {
    'house': isSelected ? 'home' : 'home-outline',
    'house.fill': 'home',
    'gear': 'settings-outline',
    'gearshape': 'settings-outline',
    'bell': isSelected ? 'notifications' : 'notifications-outline',
    'bell.fill': 'notifications',
    'list.bullet': isSelected ? 'list' : 'list-outline',
    'creditcard': isSelected ? 'card' : 'card-outline',
    'creditcard.fill': 'card',
    'plus.circle': isSelected ? 'add-circle' : 'add-circle-outline',
    'plus.circle.fill': 'add-circle',
    'waveform.path.ecg': isSelected ? 'pulse' : 'pulse-outline',
    'clock': isSelected ? 'time' : 'time-outline',
    'clock.fill': 'time',
    'folder': isSelected ? 'folder' : 'folder-outline',
    'folder.fill': 'folder',
    'person': isSelected ? 'person' : 'person-outline',
    'person.fill': 'person',
    'cross.case': isSelected ? 'medkit' : 'medkit-outline',
    'cross.case.fill': 'medkit',
    'building.2': isSelected ? 'business' : 'business-outline',
    'building.2.fill': 'business',
    'chart.bar': isSelected ? 'stats-chart' : 'stats-chart-outline',
    'chart.bar.fill': 'stats-chart',
    'location': isSelected ? 'location' : 'location-outline',
    'location.fill': 'location',
  };

  if (aliasMap[rawName]) {
    return aliasMap[rawName];
  }
  return rawName as IconName;
};

interface TabButtonProps {
  name: string;
  label?: string;
  labelHidden?: boolean;
  iconProps?: TriggerIconProps;
  badge?: React.ReactNode;
  hasBadge?: boolean;
  isActive: boolean;
  activeTint: string;
  inactiveTint: string;
  labelStyle?: TextStyle;
  disabled?: boolean;
  onPress: () => void;
  isDark: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({
  name,
  label,
  labelHidden,
  iconProps,
  badge,
  hasBadge,
  isActive,
  activeTint,
  inactiveTint,
  labelStyle,
  disabled,
  onPress,
  isDark,
}) => {
  const touchScale = useRef(new Animated.Value(1)).current;
  const iconPop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      iconPop.setValue(1.16);
      Animated.spring(iconPop, {
        toValue: 1,
        stiffness: 350,
        damping: 18,
        mass: 0.6,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(touchScale, {
      toValue: 0.92,
      stiffness: 400,
      damping: 20,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(touchScale, {
      toValue: 1,
      stiffness: 300,
      damping: 16,
      useNativeDriver: true,
    }).start();
  };

  const color = isActive ? activeTint : inactiveTint;
  const iconSource = Platform.OS === 'ios' ? (iconProps?.sf || iconProps?.md) : (iconProps?.md || iconProps?.sf);
  const iconName = resolveIconName(iconSource, isActive);

  return (
    <TouchableOpacity
      style={[
        styles.tabItem,
        isActive && (isDark ? styles.tabItemActiveDark : styles.tabItemActiveLight),
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.85}
      disabled={disabled}
    >
      <Animated.View style={[styles.tabItemContent, { transform: [{ scale: touchScale }] }]}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconPop }] }]}>
          <AppIcon name={iconName} size={22} color={color} />

          {hasBadge && (
            <View
              style={[
                badge !== undefined && badge !== null && badge !== ''
                  ? styles.badgeContainer
                  : styles.badgeDot,
                isDark ? styles.badgeBorderDark : styles.badgeBorderLight,
              ]}
            >
              {badge !== undefined && badge !== null && badge !== '' ? (
                <Text style={styles.badgeText}>{badge}</Text>
              ) : null}
            </View>
          )}
        </Animated.View>

        {!labelHidden && label && (
          <Text
            style={[
              styles.tabLabel,
              isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              labelStyle,
              { color },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * Authentic Apple iOS Liquid Glass Floating Bottom Navigation Bar:
 * Conforms to Expo Router Native Tabs specification:
 * https://docs.expo.dev/router/advanced/native-tabs/
 *
 * 1. Floating pill capsule island elevated above iPhone home indicator
 * 2. Real native UIVisualEffectView / BlurView glass refraction
 * 3. Luminous specular reflection rim along top edge
 * 4. SF Symbol outline to filled icon transitions with native active tinting
 * 5. Clean, single-word 10.5pt typography
 * 6. Apple HIG system red (#FF3B30) notification badges
 * 7. Full dismiss behavior when re-tapping active tabs (pop to top)
 */
export const NativeTabs: React.FC<NativeTabsProps> & {
  Trigger: typeof Trigger & {
    Label: typeof TriggerLabel;
    Icon: typeof TriggerIcon;
    Badge: typeof TriggerBadge;
  };
  BottomAccessory: typeof BottomAccessory;
} = ({
  activeTab = '',
  onTabPress,
  onScrollToTop,
  hidden = false,
  tintColor,
  iconColor,
  labelStyle,
  children,
}) => {
  const { role } = useAuth();
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  if (hidden) {
    return null;
  }

  // Active / Inactive tints
  const activeTint =
    tintColor ||
    iconColor?.selected ||
    (isDark ? colors.whatsapp.accent : colors.whatsapp.primary);
  const inactiveTint =
    iconColor?.default ||
    (isDark ? '#98989D' : '#8E8E93'); // Native iOS system gray

  // Flatten triggers from children
  const rawChildren = flattenChildren(children);

  interface ParsedTrigger {
    name: string;
    disablePopToTop: boolean;
    disableScrollToTop: boolean;
    disabled: boolean;
    hidden: boolean;
    label?: string;
    labelHidden?: boolean;
    iconProps?: TriggerIconProps;
    badge?: React.ReactNode;
    hasBadge?: boolean;
  }

  const parsedTriggers: ParsedTrigger[] = [];

  if (rawChildren.length > 0) {
    rawChildren.forEach((child) => {
      if (child.type === Trigger || (child.props && child.props.name !== undefined)) {
        const p = child.props as TriggerProps;
        if (p.hidden) return;

        let label: string | undefined = undefined;
        let labelHidden = false;
        let iconProps: TriggerIconProps | undefined = undefined;
        let badge: React.ReactNode = undefined;
        let hasBadge = false;

        const subChildren = flattenChildren(p.children);
        subChildren.forEach((sub) => {
          if (sub.type === TriggerLabel) {
            const lp = sub.props as TriggerLabelProps;
            labelHidden = !!lp.hidden;
            if (typeof lp.children === 'string') {
              label = lp.children;
            }
          } else if (sub.type === TriggerIcon) {
            iconProps = sub.props as TriggerIconProps;
          } else if (sub.type === TriggerBadge) {
            hasBadge = true;
            badge = (sub.props as TriggerBadgeProps).children;
          }
        });

        parsedTriggers.push({
          name: p.name,
          disablePopToTop: !!p.disablePopToTop,
          disableScrollToTop: !!p.disableScrollToTop,
          disabled: !!p.disabled,
          hidden: !!p.hidden,
          label: label || p.name,
          labelHidden,
          iconProps,
          badge,
          hasBadge,
        });
      }
    });
  } else {
    // Default fallback based on active role if no children provided
    const getDefaultTriggers = (r: UserRole): ParsedTrigger[] => {
      switch (r) {
        case 'receptionist':
          return [
            { name: 'desk', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Queue', iconProps: { sf: { default: 'list-outline', selected: 'list' } }, badge: 5, hasBadge: true },
            { name: 'scan', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Scanner', iconProps: { sf: { default: 'scan-outline', selected: 'scan' } } },
            { name: 'payments', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Billing', iconProps: { sf: { default: 'card-outline', selected: 'card' } } },
            { name: 'walkin', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Walk-In', iconProps: { sf: { default: 'add-circle-outline', selected: 'add-circle' } } },
          ];
        case 'doctor':
          return [
            { name: 'queue', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Queue', iconProps: { sf: { default: 'pulse-outline', selected: 'pulse' } }, badge: 9, hasBadge: true },
            { name: 'schedule', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Schedule', iconProps: { sf: { default: 'time-outline', selected: 'time' } } },
            { name: 'history', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Records', iconProps: { sf: { default: 'folder-outline', selected: 'folder' } } },
            { name: 'profile', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Profile', iconProps: { sf: { default: 'person-outline', selected: 'person' } } },
          ];
        case 'patient':
          return [
            { name: 'hospitals', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Clinics', iconProps: { sf: { default: 'business-outline', selected: 'business' } } },
            { name: 'my_tokens', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Token', iconProps: { sf: { default: 'ticket-outline', selected: 'ticket' } }, badge: '#8', hasBadge: true },
            { name: 'reports', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Scans', iconProps: { sf: { default: 'medkit-outline', selected: 'medkit' } } },
            { name: 'profile', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Profile', iconProps: { sf: { default: 'person-outline', selected: 'person' } } },
          ];
        case 'owner':
          return [
            { name: 'overview', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Overview', iconProps: { sf: { default: 'stats-chart-outline', selected: 'stats-chart' } } },
            { name: 'attendance', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Attendance', iconProps: { sf: { default: 'time-outline', selected: 'time' } } },
            { name: 'staff', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Staff', iconProps: { sf: { default: 'id-card-outline', selected: 'id-card' } } },
            { name: 'delivery', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Dispatch', iconProps: { sf: { default: 'location-outline', selected: 'location' } } },
            { name: 'profile', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Profile', iconProps: { sf: { default: 'person-outline', selected: 'person' } } },
          ];
        case 'delivery':
          return [
            { name: 'dispatch', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Dispatch', iconProps: { sf: { default: 'location-outline', selected: 'location' } } },
            { name: 'attendance', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Attendance', iconProps: { sf: { default: 'time-outline', selected: 'time' } } },
            { name: 'profile', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Profile', iconProps: { sf: { default: 'person-outline', selected: 'person' } } },
          ];
        case 'staff':
        default:
          return [
            { name: 'attendance', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Attendance', iconProps: { sf: { default: 'time-outline', selected: 'time' } } },
            { name: 'profile', disablePopToTop: false, disableScrollToTop: false, disabled: false, hidden: false, label: 'Profile', iconProps: { sf: { default: 'person-outline', selected: 'person' } } },
          ];
      }
    };
    parsedTriggers.push(...getDefaultTriggers(role));
  }

  // Floating clearance above iPhone Home Indicator
  const bottomMargin = insets.bottom > 0 ? insets.bottom + 4 : (Platform.OS === 'ios' ? 22 : 12);

  const handlePress = (t: ParsedTrigger) => {
    if (t.disabled) return;

    const isAlreadyActive = activeTab === t.name;

    if (isAlreadyActive) {
      // Dismiss behavior (pop to top)
      onTabPress?.(t.name);

      if (!t.disableScrollToTop) {
        onScrollToTop?.(t.name);
      }
      return;
    }

    onTabPress?.(t.name);
  };

  return (
    <View style={[styles.container, { bottom: bottomMargin }]} pointerEvents="box-none">
      <View
        style={[
          styles.nativeBar,
          isDark ? styles.nativeBarDark : styles.nativeBarLight,
        ]}
      >
        {/* Apple Native Blur Material Layer */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 88 : 95}
          tint={
            isDark
              ? (Platform.OS === 'ios' ? 'systemChromeMaterialDark' : 'dark')
              : (Platform.OS === 'ios' ? 'systemChromeMaterialLight' : 'light')
          }
          style={StyleSheet.absoluteFill}
        />

        {/* Specular high-light reflection line on top edge */}
        <View
          style={[
            styles.specularHighlight,
            isDark ? styles.specularDark : styles.specularLight,
          ]}
        />

        {/* Triggers flex row */}
        {parsedTriggers.map((t) => {
          const isActive = activeTab === t.name;

          return (
            <TabButton
              key={t.name}
              name={t.name}
              label={t.label}
              labelHidden={t.labelHidden}
              iconProps={t.iconProps}
              badge={t.badge}
              hasBadge={t.hasBadge}
              isActive={isActive}
              activeTint={activeTint}
              inactiveTint={inactiveTint}
              labelStyle={labelStyle}
              disabled={t.disabled}
              onPress={() => handlePress(t)}
              isDark={isDark}
            />
          );
        })}
      </View>
    </View>
  );
};

// Compound API Attachments
NativeTabs.Trigger = Object.assign(Trigger, {
  Label: TriggerLabel,
  Icon: TriggerIcon,
  Badge: TriggerBadge,
});
NativeTabs.BottomAccessory = BottomAccessory;

// Backwards compatibility alias
export const GlassTabBar = NativeTabs;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    alignItems: 'center',
    zIndex: 999,
  },
  nativeBar: {
    width: '100%',
    maxWidth: 500,
    height: 66,
    borderRadius: 33,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 26,
      },
      android: {
        elevation: 12,
      },
      web: {
        backdropFilter: 'blur(36px) saturate(210%)',
        WebkitBackdropFilter: 'blur(36px) saturate(210%)',
        boxShadow: '0 12px 38px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
      } as any,
    }),
  },
  nativeBarLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    borderColor: 'rgba(255, 255, 255, 0.92)',
  },
  nativeBarDark: {
    backgroundColor: 'rgba(18, 26, 40, 0.74)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    ...Platform.select({
      web: {
        boxShadow: '0 12px 38px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
      } as any,
    }),
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.5,
    borderRadius: 1,
    zIndex: 1,
  },
  specularLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  specularDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  tabItem: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    marginHorizontal: 2,
    zIndex: 2,
  },
  tabItemActiveLight: {
    backgroundColor: 'rgba(18, 140, 126, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(18, 140, 126, 0.20)',
  },
  tabItemActiveDark: {
    backgroundColor: 'rgba(37, 211, 102, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.30)',
  },
  tabItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    width: '100%',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 25,
    width: 32,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#FF3B30', // Apple HIG System Red
    borderRadius: 8.5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    zIndex: 3,
  },
  badgeDot: {
    position: 'absolute',
    top: -1,
    right: -3,
    backgroundColor: '#FF3B30',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    zIndex: 3,
  },
  badgeBorderLight: {
    borderColor: '#FFFFFF',
  },
  badgeBorderDark: {
    borderColor: '#121A28',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  tabLabelInactive: {
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
