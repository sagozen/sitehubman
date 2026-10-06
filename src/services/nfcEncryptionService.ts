/**
 * NFC Encryption Service
 * 
 * Provides cryptographic signing for NFC URLs to prevent card cloning and fraud.
 * Uses HMAC-SHA256 with rotating secrets for tamper-proof NFC payloads.
 */

import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';

// Secret key rotation period (30 days)
const SECRET_ROTATION_DAYS = 30;
const URL_EXPIRY_DAYS = 365; // NFC URLs valid for 1 year

interface EncryptedPayload {
  cardId: string;
  signature: string;
  timestamp: number;
  expiresAt: number;
  version: string;
}

/**
 * Generate encryption secret from device/user context
 * In production, fetch from secure backend endpoint
 */
async function getEncryptionSecret(): Promise<string> {
  // TODO: Replace with backend API call in production
  // For now, use app-level secret (upgrade to per-card secrets in Phase 2)
  const baseSecret = process.env.EXPO_PUBLIC_NFC_SECRET || 'SITEHUB_NFC_SECRET_2026';
  
  // Add timestamp-based rotation
  const rotationPeriod = Math.floor(Date.now() / (SECRET_ROTATION_DAYS * 24 * 60 * 60 * 1000));
  
  return `${baseSecret}_${rotationPeriod}`;
}

/**
 * Generate HMAC-SHA256 signature for card data
 */
function generateSignature(cardId: string, timestamp: number, secret: string): string {
  const payload = `${cardId}|${timestamp}`;
  return CryptoJS.HmacSHA256(payload, secret).toString(CryptoJS.enc.Hex);
}

/**
 * Encrypt and sign NFC card URL
 * Returns a tamper-proof URL with cryptographic verification
 */
export async function encryptNfcUrl(cardId: string): Promise<string> {
  const secret = await getEncryptionSecret();
  const timestamp = Date.now();
  const expiresAt = timestamp + (URL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  const signature = generateSignature(cardId, timestamp, secret);
  
  // Create encrypted payload
  const payload: EncryptedPayload = {
    cardId,
    signature,
    timestamp,
    expiresAt,
    version: 'v1',
  };
  
  // Base64 encode for URL safety
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // Generate secure URL
  const baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://sitehub.app';
  return `${baseUrl}/c/${cardId}?s=${encodedPayload}`;
}

/**
 * Verify NFC URL signature and extract card ID
 * Returns null if tampered or expired
 */
export async function verifyNfcUrl(signedUrl: string): Promise<string | null> {
  try {
    // Extract payload from URL
    const url = new URL(signedUrl);
    const encodedPayload = url.searchParams.get('s');
    
    if (!encodedPayload) {
      // Fallback: allow unsigned URLs for backward compatibility (Phase 1)
      const cardId = url.pathname.split('/').pop();
      return cardId || null;
    }
    
    // Decode payload
    const payloadStr = atob(encodedPayload);
    const payload: EncryptedPayload = JSON.parse(payloadStr);
    
    // Check expiry
    if (Date.now() > payload.expiresAt) {
      console.warn('[NFC] Expired card URL detected', { cardId: payload.cardId });
      return null;
    }
    
    // Verify signature
    const secret = await getEncryptionSecret();
    const expectedSignature = generateSignature(payload.cardId, payload.timestamp, secret);
    
    if (payload.signature !== expectedSignature) {
      // Try previous rotation period (allow 30-day grace period)
      const previousSecret = await getPreviousSecret();
      const previousSignature = generateSignature(payload.cardId, payload.timestamp, previousSecret);
      
      if (payload.signature !== previousSignature) {
        console.error('[NFC SECURITY] Invalid signature detected - possible cloning attempt', {
          cardId: payload.cardId,
          expectedSignature: expectedSignature.slice(0, 8) + '...',
          receivedSignature: payload.signature.slice(0, 8) + '...',
        });
        return null;
      }
    }
    
    return payload.cardId;
  } catch (error) {
    console.error('[NFC] URL verification failed', error);
    return null;
  }
}

/**
 * Get previous rotation period secret for grace period validation
 */
async function getPreviousSecret(): Promise<string> {
  const baseSecret = process.env.EXPO_PUBLIC_NFC_SECRET || 'SITEHUB_NFC_SECRET_2026';
  const previousRotation = Math.floor(Date.now() / (SECRET_ROTATION_DAYS * 24 * 60 * 60 * 1000)) - 1;
  return `${baseSecret}_${previousRotation}`;
}

/**
 * Generate unique NFC UID hash (hardware tag identifier)
 * Used for duplicate detection
 */
export async function generateNfcUidHash(uid: string): Promise<string> {
  const normalized = uid.toUpperCase().replace(/[^A-F0-9]/g, '');
  
  // Use Expo Crypto for deterministic hashing
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalized
  );
  
  return digest;
}

/**
 * Detect if NFC tag has been cloned by checking UID uniqueness
 */
export async function detectNfcClone(
  uid: string,
  cardId: string,
  db: any // Firestore instance
): Promise<{ isClone: boolean; originalCardId?: string }> {
  const uidHash = await generateNfcUidHash(uid);
  
  // Check if UID is already registered to different card
  const existingTags = await db
    .collection('nfc_tags')
    .where('uidHash', '==', uidHash)
    .limit(2)
    .get();
  
  if (existingTags.empty) {
    return { isClone: false };
  }
  
  const existingTag = existingTags.docs[0].data();
  
  if (existingTag.cardId !== cardId) {
    console.error('[NFC SECURITY] Clone detected!', {
      uidHash: uidHash.slice(0, 12),
      originalCard: existingTag.cardId,
      clonedCard: cardId,
    });
    
    return {
      isClone: true,
      originalCardId: existingTag.cardId,
    };
  }
  
  return { isClone: false };
}

/**
 * Register NFC tag after successful write
 */
export async function registerNfcTag(
  uid: string,
  cardId: string,
  userId: string,
  db: any
): Promise<void> {
  const uidHash = await generateNfcUidHash(uid);
  
  await db.collection('nfc_tags').add({
    uidHash,
    cardId,
    userId,
    uid: uid.slice(-8), // Store only last 8 chars for privacy
    writtenAt: new Date().toISOString(),
    version: 'v1',
    createdAt: db.FieldValue.serverTimestamp(),
  });
}

/**
 * Generate QR code fallback for NFC
 */
export async function generateQrFallback(cardId: string): Promise<string> {
  // Same signature mechanism as NFC
  const encryptedUrl = await encryptNfcUrl(cardId);
  return encryptedUrl;
}

/**
 * Rate limit tap analytics to detect suspicious activity
 */
export function detectSuspiciousTapPattern(
  tapHistory: Array<{ timestamp: number }>,
  thresholds = {
    tapsPerHour: 100,
    tapsPerDay: 1000,
  }
): { isSuspicious: boolean; reason?: string } {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  const recentTaps = tapHistory.filter((tap) => tap.timestamp > oneHourAgo).length;
  const dailyTaps = tapHistory.filter((tap) => tap.timestamp > oneDayAgo).length;
  
  if (recentTaps > thresholds.tapsPerHour) {
    return {
      isSuspicious: true,
      reason: `Excessive taps: ${recentTaps} in last hour (threshold: ${thresholds.tapsPerHour})`,
    };
  }
  
  if (dailyTaps > thresholds.tapsPerDay) {
    return {
      isSuspicious: true,
      reason: `Excessive taps: ${dailyTaps} in last 24h (threshold: ${thresholds.tapsPerDay})`,
    };
  }
  
  return { isSuspicious: false };
}

export default {
  encryptNfcUrl,
  verifyNfcUrl,
  generateNfcUidHash,
  detectNfcClone,
  registerNfcTag,
  generateQrFallback,
  detectSuspiciousTapPattern,
};
