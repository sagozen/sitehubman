import type { AppUser } from '@/src/types/models';

/** Device-only guest with no Firebase session (id === 'guest'). */
export function isLocalOnlyGuest(user: AppUser | null | undefined): boolean {
  if (!user) return true;
  if (user.id === 'guest') return true;
  if (user.authType === 'anonymous' || user.authProvider === 'anonymous') return false;
  return user.isGuest === true || user.role === 'guest' || user.plan === 'guest_trial';
}

/** Firebase anonymous or signed-in customer — can read own orders when createdBy matches. */
export function canTrackOwnOrders(user: AppUser | null | undefined, hasFirebaseUser: boolean): boolean {
  if (hasFirebaseUser) return true;
  return Boolean(user && user.id !== 'guest' && !user.isGuest);
}
