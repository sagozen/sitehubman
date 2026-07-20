import type { ImageSourcePropType } from 'react-native';
import type { AppIconName } from '@/src/components/AppIcon';
import type { FlowRealIconId } from '@/src/constants/flowRealIcons';

export type ConnectionsHubId =
  | 'nfc'
  | 'profiles'
  | 'social'
  | 'devices'
  | 'analytics'
  | 'security';

export type ConnectionsQuickId =
  | 'connect'
  | 'qr'
  | 'share'
  | 'export'
  | 'digital'
  | 'orders';

export type ConnectionsFlowIconDef = {
  id: ConnectionsHubId | ConnectionsQuickId;
  label: string;
  subtitle: string;
  tint: string;
  image: ImageSourcePropType;
  realIcon: FlowRealIconId;
  fallbackIcon: AppIconName;
};

const CONNECTION_IMAGES: Record<ConnectionsHubId, ImageSourcePropType> = {
  nfc: require('@/assets/images/connections/connections-nfc.png') as ImageSourcePropType,
  profiles: require('@/assets/images/connections/connections-profile.png') as ImageSourcePropType,
  social: require('@/assets/images/connections/connections-social.png') as ImageSourcePropType,
  devices: require('@/assets/images/connections/connections-devices.png') as ImageSourcePropType,
  analytics: require('@/assets/images/connections/connections-analytics.png') as ImageSourcePropType,
  security: require('@/assets/images/connections/connections-security.png') as ImageSourcePropType,
};

export const CONNECTIONS_HUB_SECTIONS: ConnectionsFlowIconDef[] = [
  {
    id: 'nfc',
    label: 'NFC cards',
    subtitle: 'Physical & digital chips',
    tint: '#30B0C7',
    image: CONNECTION_IMAGES.nfc,
    realIcon: 'nfc',
    fallbackIcon: 'Nfc',
  },
  {
    id: 'profiles',
    label: 'Profiles',
    subtitle: 'Personal & business pages',
    tint: '#5856D6',
    image: CONNECTION_IMAGES.profiles,
    realIcon: 'profile',
    fallbackIcon: 'UserRound',
  },
  {
    id: 'social',
    label: 'Social',
    subtitle: 'Channels on your bio',
    tint: '#AF52DE',
    image: CONNECTION_IMAGES.social,
    realIcon: 'connections',
    fallbackIcon: 'Share',
  },
  {
    id: 'devices',
    label: 'Devices',
    subtitle: 'Signed-in sessions',
    tint: '#007AFF',
    image: CONNECTION_IMAGES.devices,
    realIcon: 'preview',
    fallbackIcon: 'ScanLine',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    subtitle: 'Taps, scans & views',
    tint: '#34C759',
    image: CONNECTION_IMAGES.analytics,
    realIcon: 'preview',
    fallbackIcon: 'Eye',
  },
  {
    id: 'security',
    label: 'Security',
    subtitle: 'Password & sessions',
    tint: '#FF9500',
    image: CONNECTION_IMAGES.security,
    realIcon: 'orders',
    fallbackIcon: 'Shield',
  },
];

export const CONNECTIONS_QUICK_ACTIONS: ConnectionsFlowIconDef[] = [
  {
    id: 'connect',
    label: 'Connect',
    subtitle: 'Link NFC chip',
    tint: '#30B0C7',
    image: CONNECTION_IMAGES.nfc,
    realIcon: 'nfc',
    fallbackIcon: 'Nfc',
  },
  {
    id: 'qr',
    label: 'QR',
    subtitle: 'Public profile',
    tint: '#5856D6',
    image: CONNECTION_IMAGES.profiles,
    realIcon: 'preview',
    fallbackIcon: 'QrCode',
  },
  {
    id: 'share',
    label: 'Share',
    subtitle: 'Send profile link',
    tint: '#2596BE',
    image: CONNECTION_IMAGES.social,
    realIcon: 'share',
    fallbackIcon: 'Share',
  },
  {
    id: 'export',
    label: 'Export',
    subtitle: 'vCard contact',
    tint: '#34C759',
    image: CONNECTION_IMAGES.analytics,
    realIcon: 'mail',
    fallbackIcon: 'Download',
  },
  {
    id: 'digital',
    label: 'E-card',
    subtitle: 'Design card',
    tint: '#FF9500',
    image: CONNECTION_IMAGES.nfc,
    realIcon: 'ecard',
    fallbackIcon: 'CreditCard',
  },
  {
    id: 'orders',
    label: 'Orders',
    subtitle: 'Track production',
    tint: '#FF3B30',
    image: CONNECTION_IMAGES.security,
    realIcon: 'orders',
    fallbackIcon: 'Package',
  },
];

export function getConnectionsHubIcon(id: ConnectionsHubId): ImageSourcePropType {
  return CONNECTION_IMAGES[id];
}

/** Short labels for tab pills — guest-design style. */
export const CONNECTIONS_TAB_SHORT_LABEL: Record<ConnectionsHubId, string> = {
  nfc: 'NFC',
  profiles: 'Profile',
  social: 'Social',
  devices: 'Devices',
  analytics: 'Stats',
  security: 'Secure',
};
