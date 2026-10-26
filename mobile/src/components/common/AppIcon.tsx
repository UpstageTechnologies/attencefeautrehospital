import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

export type IconName =
  | 'camera'
  | 'camera-outline'
  | 'search'
  | 'search-outline'
  | 'add'
  | 'add-circle'
  | 'add-circle-outline'
  | 'chevron-down'
  | 'chevron-forward'
  | 'close'
  | 'close-circle'
  | 'arrow-back'
  | 'list'
  | 'list-outline'
  | 'scan'
  | 'scan-outline'
  | 'card'
  | 'card-outline'
  | 'pulse'
  | 'pulse-outline'
  | 'document-text'
  | 'document-text-outline'
  | 'folder'
  | 'folder-outline'
  | 'time'
  | 'time-outline'
  | 'business'
  | 'business-outline'
  | 'ticket'
  | 'ticket-outline'
  | 'medkit'
  | 'medkit-outline'
  | 'person'
  | 'person-outline'
  | 'people'
  | 'people-outline'
  | 'stats-chart'
  | 'stats-chart-outline'
  | 'id-card'
  | 'id-card-outline'
  | 'cash'
  | 'cash-outline'
  | 'water-outline'
  | 'flash'
  | 'flash-outline'
  | 'radio-outline'
  | 'clipboard-outline'
  | 'settings-outline'
  | 'location'
  | 'location-outline'
  | 'call'
  | 'call-outline'
  | 'calendar'
  | 'calendar-outline'
  | 'checkmark'
  | 'log-out-outline'
  | 'print-outline'
  | 'shield-outline'
  | 'home'
  | 'home-outline'
  | 'qr-code'
  | 'download-outline'
  | 'notifications'
  | 'notifications-outline'
  | 'bell';

interface AppIconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 20,
  color = '#FFFFFF',
  style,
}) => {
  const s = size;

  switch (name) {
    // --- CAMERA ---
    case 'camera':
    case 'camera-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          {/* Top flash hump */}
          <View
            style={{
              width: s * 0.32,
              height: s * 0.12,
              backgroundColor: color,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
              marginBottom: -1,
            }}
          />
          {/* Camera body */}
          <View
            style={{
              width: s * 0.88,
              height: s * 0.62,
              borderRadius: s * 0.14,
              borderWidth: 1.8,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Lens */}
            <View
              style={{
                width: s * 0.28,
                height: s * 0.28,
                borderRadius: (s * 0.28) / 2,
                borderWidth: 1.6,
                borderColor: color,
              }}
            />
          </View>
        </View>
      );

    // --- SEARCH ---
    case 'search':
    case 'search-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          {/* Circle glass */}
          <View
            style={{
              width: s * 0.62,
              height: s * 0.62,
              borderRadius: (s * 0.62) / 2,
              borderWidth: 1.8,
              borderColor: color,
              marginTop: -s * 0.12,
              marginLeft: -s * 0.12,
            }}
          />
          {/* Handle */}
          <View
            style={{
              position: 'absolute',
              bottom: s * 0.12,
              right: s * 0.12,
              width: 2,
              height: s * 0.34,
              backgroundColor: color,
              borderRadius: 1,
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </View>
      );

    // --- PLUS / ADD ---
    case 'add':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              position: 'absolute',
              width: s * 0.72,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          <View
            style={{
              position: 'absolute',
              height: s * 0.72,
              width: 2,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
        </View>
      );

    case 'add-circle':
    case 'add-circle-outline': {
      const isCircleOutline = name === 'add-circle-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.88,
              height: s * 0.88,
              borderRadius: (s * 0.88) / 2,
              borderWidth: isCircleOutline ? 1.8 : 0,
              backgroundColor: isCircleOutline ? 'transparent' : color,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                position: 'absolute',
                width: s * 0.44,
                height: 1.8,
                backgroundColor: isCircleOutline ? color : '#FFFFFF',
                borderRadius: 1,
              }}
            />
            <View
              style={{
                position: 'absolute',
                height: s * 0.44,
                width: 1.8,
                backgroundColor: isCircleOutline ? color : '#FFFFFF',
                borderRadius: 1,
              }}
            />
          </View>
        </View>
      );
    }

    // --- CHEVRON DOWN ---
    case 'chevron-down':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.42,
              height: s * 0.42,
              borderBottomWidth: 2,
              borderRightWidth: 2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginTop: -s * 0.16,
            }}
          />
        </View>
      );

    // --- CHEVRON FORWARD ---
    case 'chevron-forward':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.38,
              height: s * 0.38,
              borderTopWidth: 2,
              borderRightWidth: 2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginLeft: -s * 0.12,
            }}
          />
        </View>
      );

    // --- CLOSE / CLOSE CIRCLE ---
    case 'close':
    case 'close-circle':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              position: 'absolute',
              width: s * 0.65,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              transform: [{ rotate: '45deg' }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: s * 0.65,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </View>
      );

    // --- ARROW BACK ---
    case 'arrow-back':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              position: 'absolute',
              width: s * 0.62,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: s * 0.15,
              width: s * 0.35,
              height: s * 0.35,
              borderTopWidth: 2,
              borderLeftWidth: 2,
              borderColor: color,
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </View>
      );

    // --- LIST / QUEUE ---
    case 'list':
    case 'list-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View style={{ width: s * 0.75, height: 2, backgroundColor: color, borderRadius: 1, marginBottom: 3.5 }} />
          <View style={{ width: s * 0.75, height: 2, backgroundColor: color, borderRadius: 1, marginBottom: 3.5 }} />
          <View style={{ width: s * 0.55, height: 2, backgroundColor: color, borderRadius: 1, alignSelf: 'flex-start', marginLeft: s * 0.12 }} />
        </View>
      );

    // --- SCANNER / SCAN OUTLINE ---
    case 'scan':
    case 'scan-outline': {
      const isFilled = name === 'scan';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          {/* 4 Corner Target Brackets */}
          <View style={{ position: 'absolute', top: 2, left: 2, width: s * 0.28, height: s * 0.28, borderTopWidth: isFilled ? 2.4 : 1.8, borderLeftWidth: isFilled ? 2.4 : 1.8, borderColor: color }} />
          <View style={{ position: 'absolute', top: 2, right: 2, width: s * 0.28, height: s * 0.28, borderTopWidth: isFilled ? 2.4 : 1.8, borderRightWidth: isFilled ? 2.4 : 1.8, borderColor: color }} />
          <View style={{ position: 'absolute', bottom: 2, left: 2, width: s * 0.28, height: s * 0.28, borderBottomWidth: isFilled ? 2.4 : 1.8, borderLeftWidth: isFilled ? 2.4 : 1.8, borderColor: color }} />
          <View style={{ position: 'absolute', bottom: 2, right: 2, width: s * 0.28, height: s * 0.28, borderBottomWidth: isFilled ? 2.4 : 1.8, borderRightWidth: isFilled ? 2.4 : 1.8, borderColor: color }} />
          {/* Laser beam */}
          <View style={{ width: s * 0.52, height: isFilled ? 2.2 : 1.5, backgroundColor: color, borderRadius: 1 }} />
        </View>
      );
    }

    // --- CARD / PAYMENTS ---
    case 'card':
    case 'card-outline': {
      const isCardOutline = name === 'card-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.88,
              height: s * 0.62,
              borderRadius: 3.5,
              borderWidth: isCardOutline ? 1.8 : 0,
              backgroundColor: isCardOutline ? 'transparent' : color,
              borderColor: color,
              overflow: 'hidden',
            }}
          >
            <View style={{ width: '100%', height: s * 0.15, backgroundColor: isCardOutline ? color : '#FFFFFF', marginTop: s * 0.08 }} />
            <View style={{ width: s * 0.25, height: 2, backgroundColor: isCardOutline ? color : '#FFFFFF', marginTop: s * 0.12, marginLeft: 3 }} />
          </View>
        </View>
      );
    }

    // --- PULSE (DOCTOR LIVE QUEUE) ---
    case 'pulse':
    case 'pulse-outline': {
      const isFilled = name === 'pulse';
      const stroke = isFilled ? 2.6 : 1.8;
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: s * 0.18, height: stroke, backgroundColor: color }} />
            <View style={{ width: s * 0.16, height: s * 0.48, borderLeftWidth: stroke, borderTopWidth: stroke, borderColor: color, transform: [{ skewX: '-22deg' }] }} />
            <View style={{ width: s * 0.16, height: s * 0.48, borderRightWidth: stroke, borderBottomWidth: stroke, borderColor: color, transform: [{ skewX: '22deg' }] }} />
            <View style={{ width: s * 0.18, height: stroke, backgroundColor: color }} />
          </View>
        </View>
      );
    }

    // --- DOCUMENT / CONSULT ---
    case 'document-text':
    case 'document-text-outline':
    case 'clipboard-outline': {
      const isDocOutline = name === 'document-text-outline' || name === 'clipboard-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.65,
              height: s * 0.82,
              borderRadius: 2,
              borderWidth: isDocOutline ? 1.8 : 0,
              backgroundColor: isDocOutline ? 'transparent' : color,
              borderColor: color,
              padding: 2,
              justifyContent: 'space-around',
            }}
          >
            <View style={{ width: '80%', height: 1.6, backgroundColor: isDocOutline ? color : '#FFFFFF' }} />
            <View style={{ width: '60%', height: 1.6, backgroundColor: isDocOutline ? color : '#FFFFFF' }} />
            <View style={{ width: '70%', height: 1.6, backgroundColor: isDocOutline ? color : '#FFFFFF' }} />
          </View>
        </View>
      );
    }

    // --- FOLDER / HISTORY ---
    case 'folder':
    case 'folder-outline': {
      const isFolderOutline = name === 'folder-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View style={{ width: s * 0.4, height: s * 0.15, backgroundColor: color, borderTopLeftRadius: 2, borderTopRightRadius: 2, alignSelf: 'flex-start', marginLeft: s * 0.08 }} />
          <View
            style={{
              width: s * 0.84,
              height: s * 0.58,
              borderRadius: 2.5,
              borderWidth: isFolderOutline ? 1.8 : 0,
              backgroundColor: isFolderOutline ? 'transparent' : color,
              borderColor: color,
            }}
          />
        </View>
      );
    }

    // --- TIME / SCHEDULE ---
    case 'time':
    case 'time-outline': {
      const isTimeOutline = name === 'time-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.8,
              height: s * 0.8,
              borderRadius: (s * 0.8) / 2,
              borderWidth: isTimeOutline ? 1.8 : 0,
              backgroundColor: isTimeOutline ? 'transparent' : color,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ position: 'absolute', top: s * 0.14, width: 1.8, height: s * 0.26, backgroundColor: isTimeOutline ? color : '#FFFFFF' }} />
            <View style={{ position: 'absolute', right: s * 0.14, width: s * 0.26, height: 1.8, backgroundColor: isTimeOutline ? color : '#FFFFFF' }} />
          </View>
        </View>
      );
    }

    // --- BUSINESS / HOSPITALS ---
    case 'business':
    case 'business-outline': {
      const isBusinessOutline = name === 'business-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.72,
              height: s * 0.8,
              borderRadius: 2,
              borderWidth: isBusinessOutline ? 1.8 : 0,
              backgroundColor: isBusinessOutline ? 'transparent' : color,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Medical cross */}
            <View style={{ position: 'absolute', width: s * 0.32, height: 2, backgroundColor: isBusinessOutline ? color : '#FFFFFF' }} />
            <View style={{ position: 'absolute', height: s * 0.32, width: 2, backgroundColor: isBusinessOutline ? color : '#FFFFFF' }} />
          </View>
        </View>
      );
    }

    // --- TICKET / TOKENS ---
    case 'ticket':
    case 'ticket-outline': {
      const isTicketOutline = name === 'ticket-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.85,
              height: s * 0.55,
              borderRadius: 3,
              borderWidth: isTicketOutline ? 1.8 : 0,
              backgroundColor: isTicketOutline ? 'transparent' : color,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: s * 0.4, height: 1.5, backgroundColor: isTicketOutline ? color : '#FFFFFF' }} />
          </View>
        </View>
      );
    }

    // --- MEDKIT / MY SCANS ---
    case 'medkit':
    case 'medkit-outline': {
      const isMedkitOutline = name === 'medkit-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View style={{ width: s * 0.3, height: s * 0.12, borderWidth: 1.5, borderBottomWidth: 0, borderColor: color, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
          <View
            style={{
              width: s * 0.82,
              height: s * 0.58,
              borderRadius: 3,
              borderWidth: isMedkitOutline ? 1.8 : 0,
              backgroundColor: isMedkitOutline ? 'transparent' : color,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ position: 'absolute', width: s * 0.3, height: 2, backgroundColor: isMedkitOutline ? color : '#FFFFFF' }} />
            <View style={{ position: 'absolute', height: s * 0.3, width: 2, backgroundColor: isMedkitOutline ? color : '#FFFFFF' }} />
          </View>
        </View>
      );
    }

    // --- PERSON / PROFILE ---
    case 'person':
    case 'person-outline': {
      const isPersonOutline = name === 'person-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          {/* Head */}
          <View
            style={{
              width: s * 0.34,
              height: s * 0.34,
              borderRadius: (s * 0.34) / 2,
              borderWidth: isPersonOutline ? 1.8 : 0,
              backgroundColor: isPersonOutline ? 'transparent' : color,
              borderColor: color,
              marginBottom: 1,
            }}
          />
          {/* Shoulders */}
          <View
            style={{
              width: s * 0.68,
              height: s * 0.28,
              borderTopLeftRadius: s * 0.28,
              borderTopRightRadius: s * 0.28,
              borderWidth: isPersonOutline ? 1.8 : 0,
              borderBottomWidth: 0,
              backgroundColor: isPersonOutline ? 'transparent' : color,
              borderColor: color,
            }}
          />
        </View>
      );
    }

    // --- PEOPLE / DOCTORS ---
    case 'people':
    case 'people-outline': {
      const isPeopleOutline = name === 'people-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: s * 0.28, height: s * 0.28, borderRadius: 7, borderWidth: isPeopleOutline ? 1.6 : 0, backgroundColor: isPeopleOutline ? 'transparent' : color, borderColor: color, marginRight: -4 }} />
            <View style={{ width: s * 0.32, height: s * 0.32, borderRadius: 8, borderWidth: isPeopleOutline ? 1.8 : 0, backgroundColor: isPeopleOutline ? 'transparent' : color, borderColor: color }} />
          </View>
          <View style={{ width: s * 0.72, height: s * 0.24, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: isPeopleOutline ? 1.6 : 0, borderBottomWidth: 0, backgroundColor: isPeopleOutline ? 'transparent' : color, borderColor: color, marginTop: 1 }} />
        </View>
      );
    }

    // --- STATS / OVERVIEW ---
    case 'stats-chart':
    case 'stats-chart-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: s * 0.65, gap: 2.5 }}>
            <View style={{ width: s * 0.16, height: s * 0.35, backgroundColor: color, borderRadius: 1 }} />
            <View style={{ width: s * 0.16, height: s * 0.65, backgroundColor: color, borderRadius: 1 }} />
            <View style={{ width: s * 0.16, height: s * 0.48, backgroundColor: color, borderRadius: 1 }} />
          </View>
        </View>
      );

    // --- ID CARD / STAFF ---
    case 'id-card':
    case 'id-card-outline': {
      const isIdOutline = name === 'id-card-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.85,
              height: s * 0.65,
              borderRadius: 3.5,
              borderWidth: isIdOutline ? 1.8 : 0,
              backgroundColor: isIdOutline ? 'transparent' : color,
              borderColor: color,
              padding: 2,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <View
              style={{
                width: s * 0.24,
                height: s * 0.24,
                borderRadius: 12,
                borderWidth: 1.2,
                borderColor: isIdOutline ? color : '#FFFFFF',
                backgroundColor: isIdOutline ? 'transparent' : '#FFFFFF',
              }}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ width: '80%', height: 1.5, backgroundColor: isIdOutline ? color : '#FFFFFF' }} />
              <View style={{ width: '60%', height: 1.5, backgroundColor: isIdOutline ? color : '#FFFFFF' }} />
            </View>
          </View>
        </View>
      );
    }

    // --- CASH / REVENUE ---
    case 'cash':
    case 'cash-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.88,
              height: s * 0.58,
              borderRadius: 3,
              borderWidth: 1.8,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: s * 0.22, height: s * 0.22, borderRadius: 11, borderWidth: 1.5, borderColor: color }} />
          </View>
        </View>
      );

    // --- WATER / BLOOD LAB ---
    case 'water-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.55,
              height: s * 0.55,
              borderTopLeftRadius: s * 0.55,
              borderBottomRightRadius: s * 0.55,
              borderBottomLeftRadius: s * 0.55,
              borderWidth: 1.8,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    // --- RADIO / ULTRASOUND ---
    case 'radio-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View style={{ width: s * 0.3, height: s * 0.3, borderRadius: (s * 0.3) / 2, backgroundColor: color }} />
          <View style={{ position: 'absolute', width: s * 0.65, height: s * 0.65, borderRadius: (s * 0.65) / 2, borderWidth: 1.6, borderColor: color }} />
          <View style={{ position: 'absolute', width: s * 0.9, height: s * 0.9, borderRadius: (s * 0.9) / 2, borderWidth: 1.4, borderColor: color, opacity: 0.6 }} />
        </View>
      );

    // --- FLASHLIGHT ---
    case 'flash':
    case 'flash-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: s * 0.25,
              borderRightWidth: s * 0.25,
              borderBottomWidth: s * 0.45,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
              transform: [{ rotate: '20deg' }],
            }}
          />
        </View>
      );

    // --- SETTINGS ---
    case 'settings-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.72,
              height: s * 0.72,
              borderRadius: (s * 0.72) / 2,
              borderWidth: 2,
              borderColor: color,
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.28,
                height: s * 0.28,
                borderRadius: (s * 0.28) / 2,
                borderWidth: 1.8,
                borderColor: color,
              }}
            />
          </View>
        </View>
      );

    // --- LOCATION PIN ---
    case 'location':
    case 'location-outline': {
      const isLocOutline = name === 'location-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.62,
              height: s * 0.62,
              borderTopLeftRadius: (s * 0.62) / 2,
              borderTopRightRadius: (s * 0.62) / 2,
              borderBottomLeftRadius: 1,
              borderBottomRightRadius: (s * 0.62) / 2,
              borderWidth: isLocOutline ? 1.8 : 0,
              backgroundColor: isLocOutline ? 'transparent' : color,
              borderColor: color,
              transform: [{ rotate: '-45deg' }],
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -s * 0.1,
            }}
          >
            <View
              style={{
                width: s * 0.22,
                height: s * 0.22,
                borderRadius: (s * 0.22) / 2,
                backgroundColor: isLocOutline ? color : '#FFFFFF',
              }}
            />
          </View>
        </View>
      );
    }

    // --- PHONE / CALL ---
    case 'call':
    case 'call-outline': {
      const containerSize = s * 0.84;
      const barThickness = Math.max(2.4, s * 0.17);
      const cupLength = s * 0.38;
      const cupThickness = Math.max(2.8, s * 0.20);
      const cupRadius = cupThickness / 2;
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: containerSize,
              height: containerSize,
              transform: [{ rotate: '-45deg' }],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Handle - vertical connecting backbone on the outer edge */}
            <View
              style={{
                position: 'absolute',
                left: s * 0.04,
                top: s * 0.12,
                width: barThickness,
                height: containerSize * 0.65,
                backgroundColor: color,
                borderRadius: barThickness / 2,
              }}
            />
            {/* Top earpiece cup - angled inward */}
            <View
              style={{
                position: 'absolute',
                left: s * 0.04,
                top: s * 0.02,
                width: cupLength,
                height: cupThickness,
                backgroundColor: color,
                borderRadius: cupRadius,
                transform: [{ rotate: '15deg' }],
              }}
            />
            {/* Bottom mouthpiece cup - angled inward */}
            <View
              style={{
                position: 'absolute',
                left: s * 0.04,
                bottom: s * 0.02,
                width: cupLength,
                height: cupThickness,
                backgroundColor: color,
                borderRadius: cupRadius,
                transform: [{ rotate: '-15deg' }],
              }}
            />
          </View>
        </View>
      );
    }

    // --- HOME ---
    case 'home':
    case 'home-outline': {
      const isOutline = name === 'home-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          {/* Triangular roof */}
          <View
            style={{
              width: s * 0.52,
              height: s * 0.52,
              borderTopWidth: 2,
              borderLeftWidth: 2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginTop: -s * 0.1,
            }}
          />
          {/* House body */}
          <View
            style={{
              position: 'absolute',
              bottom: s * 0.12,
              width: s * 0.58,
              height: s * 0.44,
              borderWidth: 1.8,
              borderTopWidth: 0,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {/* Door */}
            <View
              style={{
                width: s * 0.22,
                height: s * 0.26,
                backgroundColor: isOutline ? 'transparent' : color,
                borderWidth: 1.5,
                borderBottomWidth: 0,
                borderColor: color,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
              }}
            />
          </View>
        </View>
      );
    }

    // --- QR CODE ---
    case 'qr-code':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.84,
              height: s * 0.84,
              borderWidth: 1.8,
              borderColor: color,
              borderRadius: 3,
              padding: 2,
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignContent: 'space-between',
            }}
          >
            {/* 3 Corner finder squares */}
            <View style={{ width: s * 0.28, height: s * 0.28, borderWidth: 1.8, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: s * 0.12, height: s * 0.12, backgroundColor: color }} />
            </View>
            <View style={{ width: s * 0.28, height: s * 0.28, borderWidth: 1.8, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: s * 0.12, height: s * 0.12, backgroundColor: color }} />
            </View>
            <View style={{ width: s * 0.28, height: s * 0.28, borderWidth: 1.8, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: s * 0.12, height: s * 0.12, backgroundColor: color }} />
            </View>
            <View style={{ width: s * 0.28, height: s * 0.28, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: s * 0.14, height: s * 0.14, backgroundColor: color }} />
            </View>
          </View>
        </View>
      );

    // --- CALENDAR ---
    case 'calendar':
    case 'calendar-outline': {
      const isCalOutline = name === 'calendar-outline';
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          {/* Top hanging binder pegs */}
          <View style={{ flexDirection: 'row', width: s * 0.52, justifyContent: 'space-between', marginBottom: -2 }}>
            <View style={{ width: 2, height: 4, backgroundColor: color, borderRadius: 1 }} />
            <View style={{ width: 2, height: 4, backgroundColor: color, borderRadius: 1 }} />
          </View>
          <View
            style={{
              width: s * 0.8,
              height: s * 0.7,
              borderRadius: 3,
              borderWidth: 1.8,
              borderColor: color,
              backgroundColor: isCalOutline ? 'transparent' : color,
              overflow: 'hidden',
            }}
          >
            <View style={{ width: '100%', height: s * 0.18, backgroundColor: isCalOutline ? color : 'rgba(255,255,255,0.3)' }} />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 2 }}>
              <View style={{ width: 2.5, height: 2.5, borderRadius: 1.25, backgroundColor: isCalOutline ? color : '#FFFFFF' }} />
              <View style={{ width: 2.5, height: 2.5, borderRadius: 1.25, backgroundColor: isCalOutline ? color : '#FFFFFF' }} />
              <View style={{ width: 2.5, height: 2.5, borderRadius: 1.25, backgroundColor: isCalOutline ? color : '#FFFFFF' }} />
            </View>
          </View>
        </View>
      );
    }

    // --- CHECKMARK ---
    case 'checkmark':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.32,
              height: s * 0.55,
              borderBottomWidth: 2.2,
              borderRightWidth: 2.2,
              borderColor: color,
              transform: [{ rotate: '42deg' }],
              marginTop: -s * 0.12,
            }}
          />
        </View>
      );

    // --- LOG OUT ---
    case 'log-out-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              position: 'absolute',
              left: 2,
              width: s * 0.45,
              height: s * 0.72,
              borderWidth: 1.8,
              borderRightWidth: 0,
              borderColor: color,
              borderRadius: 2,
            }}
          />
          {/* Arrow pointing out */}
          <View style={{ position: 'absolute', right: 2, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: s * 0.45, height: 1.8, backgroundColor: color }} />
            <View
              style={{
                width: s * 0.22,
                height: s * 0.22,
                borderTopWidth: 1.8,
                borderRightWidth: 1.8,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
                marginLeft: -s * 0.12,
              }}
            />
          </View>
        </View>
      );

    // --- PRINTER ---
    case 'print-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          {/* Top Paper */}
          <View
            style={{
              width: s * 0.45,
              height: s * 0.25,
              borderWidth: 1.6,
              borderBottomWidth: 0,
              borderColor: color,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
            }}
          />
          {/* Printer Body */}
          <View
            style={{
              width: s * 0.82,
              height: s * 0.45,
              borderRadius: 3,
              borderWidth: 1.8,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: s * 0.5, height: 2, backgroundColor: color }} />
          </View>
        </View>
      );

    // --- SHIELD ---
    case 'shield-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View
            style={{
              width: s * 0.7,
              height: s * 0.78,
              borderWidth: 1.8,
              borderColor: color,
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
              borderBottomLeftRadius: s * 0.35,
              borderBottomRightRadius: s * 0.35,
            }}
          />
        </View>
      );

    // --- BRIEFCASE ---
    case 'briefcase-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          {/* Handle */}
          <View
            style={{
              width: s * 0.35,
              height: s * 0.18,
              borderWidth: 1.6,
              borderBottomWidth: 0,
              borderColor: color,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            }}
          />
          {/* Case body */}
          <View
            style={{
              width: s * 0.84,
              height: s * 0.58,
              borderRadius: 3,
              borderWidth: 1.8,
              borderColor: color,
              alignItems: 'center',
            }}
          >
            <View style={{ width: '100%', height: 1.2, backgroundColor: color, marginTop: s * 0.18 }} />
            <View style={{ width: 4, height: 3, backgroundColor: color, marginTop: -2, borderRadius: 0.5 }} />
          </View>
        </View>
      );

    // --- DOWNLOAD ---
    case 'download-outline':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          {/* Vertical arrow pointing down */}
          <View style={{ width: 1.8, height: s * 0.48, backgroundColor: color }} />
          <View
            style={{
              width: s * 0.28,
              height: s * 0.28,
              borderBottomWidth: 1.8,
              borderRightWidth: 1.8,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginTop: -s * 0.22,
            }}
          />
          {/* Bottom tray line */}
          <View
            style={{
              width: s * 0.72,
              height: s * 0.22,
              borderBottomWidth: 1.8,
              borderLeftWidth: 1.8,
              borderRightWidth: 1.8,
              borderColor: color,
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
              marginTop: 3,
            }}
          />
        </View>
      );

    // --- NOTIFICATIONS / BELL ---
    case 'notifications':
    case 'notifications-outline':
    case 'bell':
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          {/* Bell dome */}
          <View
            style={{
              width: s * 0.62,
              height: s * 0.58,
              borderTopLeftRadius: s * 0.35,
              borderTopRightRadius: s * 0.35,
              borderWidth: 1.8,
              borderColor: color,
              borderBottomWidth: 0,
            }}
          />
          {/* Bell rim */}
          <View
            style={{
              width: s * 0.82,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          {/* Bell clapper / dot */}
          <View
            style={{
              width: s * 0.22,
              height: s * 0.14,
              backgroundColor: color,
              borderBottomLeftRadius: s * 0.1,
              borderBottomRightRadius: s * 0.1,
              marginTop: 1,
            }}
          />
        </View>
      );

    default:
      return (
        <View style={[styles.center, { width: s, height: s }, style]}>
          <View style={{ width: s * 0.5, height: s * 0.5, borderRadius: (s * 0.5) / 2, backgroundColor: color }} />
        </View>
      );
  }
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
