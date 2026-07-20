import type { ImageSourcePropType } from 'react-native';

/**
 * Static requires for Metro — relative paths (not @/ alias) so the bundler
 * resolves assets/images/marketing/*.png reliably on all platforms.
 */
export const MARKETING_SCENE_ASSETS = {
  splash: require('../../assets/images/marketing/splash.png'),
  welcome: require('../../assets/images/marketing/welcome.png'),
  'create-profile': require('../../assets/images/marketing/create-profile.png'),
  'design-card': require('../../assets/images/marketing/design-card.png'),
  'nfc-tap-demo': require('../../assets/images/marketing/nfc-tap-demo.png'),
  'qr-nfc-benefits': require('../../assets/images/marketing/qr-nfc-benefits.png'),
  'business-use-case': require('../../assets/images/marketing/business-use-case.png'),
  'team-enterprise': require('../../assets/images/marketing/team-enterprise.png'),
  'production-tracking': require('../../assets/images/marketing/production-tracking.png'),
  'shipping-success': require('../../assets/images/marketing/shipping-success.png'),
  'profile-preview': require('../../assets/images/marketing/profile-preview.png'),
  'analytics-dashboard': require('../../assets/images/marketing/analytics-dashboard.png'),
  verification: require('../../assets/images/marketing/verification.png'),
  'premium-membership': require('../../assets/images/marketing/premium-membership.png'),
  'hero-home': require('../../assets/images/marketing/hero-home.png'),
} as const satisfies Record<string, ImageSourcePropType>;
