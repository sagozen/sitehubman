export type NfcCardConnectionStatus = 'active' | 'inactive' | 'lost';

export type ConnectedNfcCard = {
  id: string;
  name: string;
  cardId: string;
  status: NfcCardConnectionStatus;
  lastTapAt: string | null;
  publicSlug?: string;
  orderId?: string;
};

export type ConnectedProfile = {
  id: string;
  type: 'personal' | 'business' | 'team';
  title: string;
  subtitle: string;
  slug: string | null;
  isPublished: boolean;
  views: number;
};

export type SocialChannelId =
  | 'phone'
  | 'email'
  | 'website'
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'telegram';

export type SocialChannel = {
  id: SocialChannelId;
  label: string;
  value: string;
  enabled: boolean;
  icon: 'Phone' | 'Mail' | 'Link' | 'Share' | 'Users' | 'ExternalLink';
};

export type DeviceSession = {
  id: string;
  label: string;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  kind: 'mobile' | 'browser';
  lastActiveAt: string;
  isCurrent: boolean;
};

export type ConnectionAnalytics = {
  totalNfcTaps: number;
  totalQrScans: number;
  totalProfileViews: number;
  uniqueVisitors: number;
  lastActivityAt: string | null;
};

export type LoginHistoryEntry = {
  id: string;
  device: string;
  location: string;
  at: string;
  success: boolean;
};

export type CustomerConnectionsData = {
  cards: ConnectedNfcCard[];
  profiles: ConnectedProfile[];
  socialChannels: SocialChannel[];
  devices: DeviceSession[];
  analytics: ConnectionAnalytics;
  loginHistory: LoginHistoryEntry[];
  trialEndsAt: string | null;
  hiddenChannels: SocialChannelId[];
};
