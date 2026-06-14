import type { Href } from 'expo-router';
import { appRoutes } from '@/src/constants/navigation';
import { getStoredGuestCardId } from '@/src/services/guestSessionService';
import { AppUser } from '@/src/types/models';
import { getDashboardRoute } from '@/src/utils/authFlow';

type PostAuthOptions = {
  /** Where to route the user if they were in the middle of an action. */
  intent?: 'checkout' | 'connections';
};

/** Where to send the user immediately after sign-in or sign-up. */
export async function getPostAuthDestination(user: AppUser, options?: PostAuthOptions): Promise<Href> {
  if (user.isGuest || user.role !== 'customer') {
    return getDashboardRoute(user);
  }

  if (options?.intent === 'checkout') {
    const cardId = await getStoredGuestCardId();
    if (cardId) return `/checkout/${encodeURIComponent(cardId)}` as Href;
  }

  if (options?.intent === 'connections') {
    const cardId = await getStoredGuestCardId();
    if (cardId) return appRoutes.customerConnections as Href;
  }

  return getDashboardRoute(user);
}
