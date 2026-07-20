import { convertGuestToCustomer, clearGuestSession } from '@/src/services/guestConversionService';
import type { AppUser } from '@/src/types/models';

/**
 * Attach cloud guest card / order to the new customer account after sign-up or sign-in.
 *
 * This is now a thin wrapper around `convertGuestToCustomer()` which handles:
 *   - Finding all guest-owned cards and orders
 *   - Transferring ownership to customerId
 *   - Marking guest status as 'converted'
 *   - Ensuring customer trial
 *   - Preserving all IDs (cardId, orderId, orderNumber, publicSlug)
 */
export async function finalizeGuestAccountUpgrade(
  user: AppUser,
  cardId?: string | null
): Promise<void> {
  try {
    const result = await convertGuestToCustomer(user, cardId);

    if (result.success) {
      // Clear local guest session storage after successful conversion
      await clearGuestSession();
    }

    if (__DEV__ && result.errors.length > 0) {
      console.warn('[guestAccountUpgrade] conversion had partial errors:', result.errors);
    }
  } catch (error) {
    // Account auth + profile are already created — don't block login on optional guest attach.
    if (__DEV__) {
      console.warn('[guestAccountUpgrade] post-signup attach failed', error);
    }
  }
}
