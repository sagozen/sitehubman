// Simple referral service - in production, implement with backend storage and validation
import { analytics } from '@/src/utils/analytics';

// In a real app, these would be stored in a database and validated against existing users
const usedCodes = new Set<string>();

/**
 * Generate a referral code for a user
 * @param userId The user's ID
 * @returns A referral code string
 */
export function generateReferralCode(userId: string): string {
  // Simple implementation: hash the userId and take first 6 chars
  // In reality, use a proper random string generator and check for uniqueness
  const code = btoa(String(userId)).substring(0, 6).toUpperCase();
  return code;
}

/**
 * Validate a referral code
 * @param code The referral code to validate
 * @returns True if the code is valid and not already used
 */
export function isValidReferralCode(code: string): boolean {
  // Basic validation: 6 uppercase alphanumeric characters
  const codeRegex = /^[A-Z0-9]{6}$/;
  if (!codeRegex.test(code)) return false;
  // Check if already used (in-memory only for demo)
  return !usedCodes.has(code);
}

/**
 * Mark a referral code as used
 * @param code The referral code that was used
 */
export function markReferralCodeUsed(code: string): void {
  usedCodes.add(code);
}

/**
 * Track a successful referral when a new user signs up with a referral code
 * @param referrerId The ID of the user who referred
 * @param refereeId The ID of the new user who used the code
 * @param referralCode The code that was used
 */
export function trackReferralSignup(referrerId: string, refereeId: string, referralCode: string): void {
  // Mark code as used
  markReferralCodeUsed(referralCode);

  // Track via analytics
  analytics.track('referral_signup', {
    referrerId,
    refereeId,
    referralCode,
    timestamp: Date.now()
  });

  // In a real app, you would also:
  // - Award incentives to both parties (e.g., add credits, unlock features)
  // - Update user records in database
  // - Send notification emails

  console.log(`Referral processed: ${referrerId} referred ${refereeId} using code ${referralCode}`);
}

/**
 * Get the referral stats for a user (mock implementation)
 * @param userId The user's ID
 * @returns Object with referral counts
 */
export function getReferralStats(userId: string): {
  successfulReferrals: number;
  pendingReferrals: number;
} {
  // Mock data - in real app, query database
  return {
    successfulReferrals: Math.floor(Math.random() * 10),
    pendingReferrals: Math.floor(Math.random() * 5)
  };
}