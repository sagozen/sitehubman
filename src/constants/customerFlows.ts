import type { ImageSourcePropType } from 'react-native';
import type { Href } from 'expo-router';
import type { AppIconName } from '@/src/components/AppIcon';
import type { FlowRealIconId } from '@/src/constants/flowRealIcons';
import { actionPhotos } from '@/src/constants/actionPhotos';
import { appRoutes } from '@/src/constants/navigation';

/** Canonical customer journey steps — single source for icons, routes, and storage keys. */
export type CustomerFlowId =
  | 'ecard'
  | 'profile'
  | 'preview'
  | 'order'
  | 'track'
  | 'nfc'
  | 'connections'
  | 'orders';

export type CustomerFlowDefinition = {
  id: CustomerFlowId;
  /** AsyncStorage key segment — stable across app versions. */
  storageKey: string;
  label: string;
  subtitle: string;
  realIcon: FlowRealIconId;
  fallbackIcon: AppIconName;
  tint: string;
  photo?: ImageSourcePropType;
  route: Href;
  /** Shown in the primary 2×2 home grid. */
  primary: boolean;
  /** Shown in the metrics strip with live counts when available. */
  metric: boolean;
};

export const CUSTOMER_FLOW_ORDER: CustomerFlowId[] = [
  'ecard',
  'profile',
  'preview',
  'order',
  'track',
  'nfc',
  'connections',
  'orders',
];

export const CUSTOMER_FLOWS: Record<CustomerFlowId, CustomerFlowDefinition> = {
  ecard: {
    id: 'ecard',
    storageKey: 'customer_flow_ecard',
    label: 'E-Card',
    subtitle: 'Design NFC identity',
    realIcon: 'ecard',
    fallbackIcon: 'CreditCard',
    tint: '#2596BE',
    photo: actionPhotos.design,
    route: appRoutes.guestDesign,
    primary: false,
    metric: false,
  },
  profile: {
    id: 'profile',
    storageKey: 'customer_flow_profile',
    label: 'Profile',
    subtitle: 'Edit public bio page',
    realIcon: 'profile',
    fallbackIcon: 'UserRound',
    tint: '#5856D6',
    photo: actionPhotos.profile,
    route: '/edit-bio',
    primary: true,
    metric: false,
  },
  preview: {
    id: 'preview',
    storageKey: 'customer_flow_preview',
    label: 'Live preview',
    subtitle: 'See your public page',
    realIcon: 'preview',
    fallbackIcon: 'Eye',
    tint: '#34C759',
    photo: actionPhotos.preview,
    route: appRoutes.guestDesign,
    primary: false,
    metric: true,
  },
  order: {
    id: 'order',
    storageKey: 'customer_flow_order',
    label: 'My card',
    subtitle: 'Design · save · order physical',
    realIcon: 'order',
    fallbackIcon: 'CreditCard',
    tint: '#FF9500',
    photo: actionPhotos.order,
    route: appRoutes.guestDesign,
    primary: true,
    metric: true,
  },
  track: {
    id: 'track',
    storageKey: 'customer_flow_track',
    label: 'Track',
    subtitle: 'Production status',
    realIcon: 'track',
    fallbackIcon: 'Truck',
    tint: '#007AFF',
    photo: actionPhotos.order,
    route: appRoutes.guestTrackOrder,
    primary: true,
    metric: true,
  },
  nfc: {
    id: 'nfc',
    storageKey: 'customer_flow_nfc',
    label: 'NFC',
    subtitle: 'Tap & activate card',
    realIcon: 'nfc',
    fallbackIcon: 'Nfc',
    tint: '#30B0C7',
    route: appRoutes.scan,
    primary: true,
    metric: false,
  },
  connections: {
    id: 'connections',
    storageKey: 'customer_flow_connections',
    label: 'Connections',
    subtitle: 'Cards, links & security',
    realIcon: 'connections',
    fallbackIcon: 'Users',
    tint: '#AF52DE',
    photo: actionPhotos.connections,
    route: appRoutes.customerConnections,
    primary: false,
    metric: true,
  },
  orders: {
    id: 'orders',
    storageKey: 'customer_flow_orders',
    label: 'My orders',
    subtitle: 'History & payments',
    realIcon: 'orders',
    fallbackIcon: 'Package',
    tint: '#FF3B30',
    photo: actionPhotos.order,
    route: appRoutes.customer.orders,
    primary: false,
    metric: false,
  },
};

export function getCustomerFlow(id: CustomerFlowId): CustomerFlowDefinition {
  return CUSTOMER_FLOWS[id];
}

export const CUSTOMER_PRIMARY_FLOWS = CUSTOMER_FLOW_ORDER
  .map((id) => CUSTOMER_FLOWS[id])
  .filter((flow) => flow.primary);

export const CUSTOMER_METRIC_FLOWS = CUSTOMER_FLOW_ORDER
  .map((id) => CUSTOMER_FLOWS[id])
  .filter((flow) => flow.metric);
