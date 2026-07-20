export const appRoutes = {
  login: '/(auth)/login',
  register: '/(auth)/register',
  customerTabs: '/',
  accountOrders: '/orders/track',
  customerConnections: '/connections',
  customerAnalysis: '/profile',
  customerSettings: '/settings',
  customerShare: '/share',
  /** @deprecated Use customerConnections — kept for cached guest routes */
  customerConnectionsLegacy: '/attendance',
  scan: '/scan',
  nfcDemo: '/nfc-demo',
  qrGenerator: '/qr-generator',
  studio: '/studio',
  guestAnalytics: '/guest-analytics',
  guestDesign: '/cards/design',
  guestCardPreview: '/cards/preview/[cardId]',
  /** @deprecated Deep links only — redirects to guestDesign */
  guestChooseCard: '/guest-choose-card',
  guestCheckout: '/payments/checkout/[cardId]', // redirect to unified checkout
  guestCardCheckout: '/payments/checkout/[cardId]',
  guestTrackOrder: '/orders/track',
  guestPostLoginChoice: '/guest-post-login-choice',
  newOrder: '/sales/new-order', // Sales custom checkout
  orderDetail: '/orders/detail/[orderId]',
  editBio: '/edit-bio',
  themePicker: '/theme-picker',
  customer: {
    root: '/',
    orders: '/orders/track',
    templates: '/cards/templates',
    profile: '/profile',
    notifications: '/customer/notifications',
  },
  sales: {
    root: '/sales/dashboard',
    orders: '/orders/track',
    newOrder: '/sales/new-order',
    payouts: '/sales/payouts',
    notifications: '/customer/notifications', // shared
    settings: '/settings', // shared settings
    customers: '/sales/customers',
    me: '/profile', // shared profile
  },
} as const;
