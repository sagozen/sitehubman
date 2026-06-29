import type { Href } from 'expo-router';
import { AppUser, UserRole } from '@/src/types/models';

export const AUTH_ROLES: UserRole[] = [
  'guest',
  'customer',
  'sales',
  'super_admin',
];

export const STAFF_ROLES: UserRole[] = ['sales'];

export function normalizeRole(role: unknown): UserRole {
  if (role === 'super_admin') return 'super_admin';
  if (role === 'sales' || role === 'sales_rep' || role === 'agent' || role === 'sales_agent') return 'sales';
  if (role === 'customer' || role === 'user') return 'customer';
  return 'guest';
}

export function getDashboardRoute(user: AppUser | null): Href {
  if (!user) return '/(auth)/login';
  if (user.role === 'super_admin') return '/admin/dashboard';
  if (user.role === 'sales') return '/sales/dashboard';
  return '/(tabs)';
}

export function canAccessRole(user: AppUser | null, allowedRoles?: UserRole[]) {
  if (!allowedRoles || allowedRoles.length === 0) return Boolean(user);
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export function isGuestUser(user: AppUser | null) {
  return (
    !user
    || user.isGuest === true
    || user.role === 'guest'
    || user.authType === 'anonymous'
    || user.authProvider === 'anonymous'
    || user.plan === 'guest_trial'
  );
}

export function isStaffRole(role: UserRole) {
  return STAFF_ROLES.includes(role);
}
