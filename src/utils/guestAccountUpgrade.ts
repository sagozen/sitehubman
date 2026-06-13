import { ensureCustomerTrialOnSignup } from '@/src/services/customerTrialService';
import { convertGuestCardToUser } from '@/src/services/guestCardDraftService';
import { getStoredGuestCardId } from '@/src/services/guestSessionService';
import type { AppUser } from '@/src/types/models';

/** Attach cloud guest card / order to the new customer account after sign-up or sign-in. */
export async function finalizeGuestAccountUpgrade(
  user: AppUser,
  cardId?: string | null
): Promise<void> {
  const resolvedCardId = cardId?.trim() || (await getStoredGuestCardId());
  try {
    if (resolvedCardId) {
      await convertGuestCardToUser(user, resolvedCardId);
    }
    await ensureCustomerTrialOnSignup(user, resolvedCardId);
  } catch (error) {
    // Account auth + profile are already created — don't block login on optional guest attach.
    if (__DEV__) {
      console.warn('[guestAccountUpgrade] post-signup attach failed', error);
    }
  }
}
