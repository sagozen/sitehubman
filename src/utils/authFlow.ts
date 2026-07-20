import type { Href } from 'expo-router';
import { AppUser, UserRole } from '@/src/types/models';

export const AUTH_ROLES: UserRole[] = [
  'guest',
  'customer',
  'sales',
  'agent',
  'printer',
  'printer_operator',
  'qa_inspector',
  'shipping',
  'finance',
  'admin',
  'super_admin',
];

export const STAFF_ROLES: UserRole[] = [
  'sales',
  'agent',
  'printer',
  'printer_operator',
  'qa_inspector',
  'shipping',
  'finance',
  'admin',
  'super_admin',
];

export function normalizeRole(role: unknown): UserRole {
  if (typeof role !== 'string') return 'guest';
  const r = role.toLowerCase().trim();

  if (r === 'super_admin') return 'super_admin';
  if (r === 'admin') return 'admin';
  if (r === 'sales' || r === 'sales_rep' || r === 'agent' || r === 'sales_agent') return 'sales';
  if (r === 'customer' || r === 'user') return 'customer';
  if (r === 'printer') return 'printer';
  if (r === 'printer_operator') return 'printer_operator';
  if (r === 'qa_inspector') return 'qa_inspector';
  if (r === 'shipping') return 'shipping';
  if (r === 'finance') return 'finance';
  if (r === 'guest') return 'guest';
  return 'guest';
}

export function getDashboardRoute(user: AppUser | null): Href {
  if (!user) return '/auth/login';
  const role = normalizeRole(user.role);
  if (role === 'super_admin' || role === 'admin') return '/admin' as any;
  if (role === 'sales') return '/sales';
  if (role === 'printer' || role === 'printer_operator' || role === 'qa_inspector') return '/production/queue' as any;
  return '/(tabs)';
}

export function canAccessRole(user: AppUser | null, allowedRoles?: UserRole[]) {
  if (!allowedRoles || allowedRoles.length === 0) return Boolean(user);
  if (!user) return false;
  return allowedRoles.includes(normalizeRole(user.role));
}

export function isGuestUser(user: AppUser | null) {
  return (
    !user ||
    user.isGuest === true ||
    user.role === 'guest' ||
    user.authType === 'anonymous' ||
    user.authProvider === 'anonymous' ||
    user.plan === 'guest_trial'
  );
}

export function isStaffRole(role: UserRole) {
  return STAFF_ROLES.includes(role);
}

// ---------------------------------------------------------------------------
// Route access helpers
// ---------------------------------------------------------------------------

/** Routes that guests can access (design, preview, checkout start). */
export const GUEST_ALLOWED_ROUTES: string[] = [
  '/(auth)/login',
  '/(auth)/register',
  '/cards/design',
  '/cards/preview',
  '/payments/checkout',
  '/guest-design',
  '/guest-checkout',
  '/guest-choose-card',
  '/guest-track-order',
  '/guest-post-login-choice',
  '/guest-analytics',
  '/card-preview',
  '/checkout',
  '/u',
  '/p',
  '/c',
];

/** Routes that require a real customer account (not guest). */
export const CUSTOMER_ONLY_ROUTES: string[] = [
  '/customer',
  '/(tabs)',
  '/orders/track',
  '/orders/detail',
  '/profile',
  '/settings',
  '/edit-bio',
  '/activate-card',
];

/** Check if a route path is accessible by guests. */
export function isGuestAllowedRoute(path: string): boolean {
  return GUEST_ALLOWED_ROUTES.some((route) => path.startsWith(route));
}

/** Check if a route path requires a real customer account. */
export function isCustomerOnlyRoute(path: string): boolean {
  return CUSTOMER_ONLY_ROUTES.some((route) => path.startsWith(route));
}
