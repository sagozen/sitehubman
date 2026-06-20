/**
 * Tab icons aligned with the shared SiteHub mobile scale.
 * @see C:\Users\DELL\Downloads\Gen_Book-main\Gen_Book-main\App.tsx
 */
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Gen_Book tab names → icon pairs (copied from App.tsx). */
const genBookTabIcons: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Explore: { active: 'compass', inactive: 'compass-outline' },
  Library: { active: 'library', inactive: 'library-outline' },
  Search: { active: 'search', inactive: 'search-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

/**
 * SITEHUB routes mapped to the same Gen_Book icon families.
 */
const sitehubTabIcons: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  index: genBookTabIcons.Home,
  connections: { active: 'people-circle', inactive: 'people-circle-outline' },
  attendance: { active: 'people-circle', inactive: 'people-circle-outline' },
  share: { active: 'qr-code', inactive: 'qr-code-outline' },
  profile: { active: 'analytics', inactive: 'analytics-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
  orders: genBookTabIcons.Library,
  payouts: { active: 'wallet', inactive: 'wallet-outline' },
  queue: genBookTabIcons.Library,
  scan: genBookTabIcons.Search,
  wages: { active: 'wallet', inactive: 'wallet-outline' },
  me: genBookTabIcons.Profile,
  'new-order': { active: 'add', inactive: 'add-outline' },
};

const fallback: { active: IoniconName; inactive: IoniconName } = {
  active: 'home',
  inactive: 'home-outline',
};

/** Same contract as Gen_Book: `focused ? filled : outline`. */
export function getLiquidTabIcon(routeName: string, focused: boolean): IoniconName {
  const pair = sitehubTabIcons[routeName] ?? genBookTabIcons[routeName] ?? fallback;
  return focused ? pair.active : pair.inactive;
}

/** Premium mobile tab icon size. */
export const LIQUID_TAB_ICON_SIZE = 28;
