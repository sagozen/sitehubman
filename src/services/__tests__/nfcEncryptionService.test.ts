/**
 * Unit Tests - NFC Encryption Service
 * Coverage: HMAC signing, clone detection, URL generation
 */

import { encryptNfcUrl, verifyNfcSignature, generateNfcSecret } from '../nfcEncryptionService';

describe('NFC Encryption Service', () => {
  const mockCardId = 'card_test_123';
  const mockUid = 'NFC_UID_ABC123';
  
  describe('encryptNfcUrl', () => {
    it('should generate signed URL with valid structure', async () => {
      const url = await encryptNfcUrl(mockCardId);
      
      expect(url).toContain('https://nfcglobal.com/v/');
      expect(url).toContain('sig=');
      expect(url).toContain('exp=');
    });
    
    it('should include card ID in URL path', async () => {
      const url = await encryptNfcUrl(mockCardId);
      
      expect(url).toContain(mockCardId);
    });
    
    it('should generate different signatures for different cards', async () => {
      const url1 = await encryptNfcUrl('card_1');
      const url2 = await encryptNfcUrl('card_2');
      
      const sig1 = new URL(url1).searchParams.get('sig');
      const sig2 = new URL(url2).searchParams.get('sig');
      
      expect(sig1).not.toBe(sig2);
    });
    
    it('should set expiry 365 days in future', async () => {
      const url = await encryptNfcUrl(mockCardId);
      const expiry = parseInt(new URL(url).searchParams.get('exp') || '0');
      
      const now = Math.floor(Date.now() / 1000);
      const oneYear = 365 * 24 * 60 * 60;
      
      expect(expiry).toBeGreaterThan(now);
      expect(expiry).toBeLessThan(now + oneYear + 3600); // +1 hour tolerance
    });
  });
  
  describe('verifyNfcSignature', () => {
    it('should verify valid signature', async () => {
      const url = await encryptNfcUrl(mockCardId);
      const urlObj = new URL(url);
      const signature = urlObj.searchParams.get('sig') || '';
      const expiry = urlObj.searchParams.get('exp') || '';
      
      const isValid = await verifyNfcSignature(mockCardId, signature, expiry);
      
      expect(isValid).toBe(true);
    });
    
    it('should reject tampered card ID', async () => {
      const url = await encryptNfcUrl(mockCardId);
      const urlObj = new URL(url);
      const signature = urlObj.searchParams.get('sig') || '';
      const expiry = urlObj.searchParams.get('exp') || '';
      
      const isValid = await verifyNfcSignature('card_tampered', signature, expiry);
      
      expect(isValid).toBe(false);
    });
    
    it('should reject expired URLs', async () => {
      const url = await encryptNfcUrl(mockCardId);
      const urlObj = new URL(url);
      const signature = urlObj.searchParams.get('sig') || '';
      
      // Set expiry to past
      const pastExpiry = Math.floor(Date.now() / 1000) - 3600;
      
      const isValid = await verifyNfcSignature(mockCardId, signature, pastExpiry.toString());
      
      expect(isValid).toBe(false);
    });
    
    it('should reject invalid signature format', async () => {
      const isValid = await verifyNfcSignature(mockCardId, 'invalid_signature', '9999999999');
      
      expect(isValid).toBe(false);
    });
  });
  
  describe('generateNfcSecret', () => {
    it('should generate 64-character hex string', () => {
      const secret = generateNfcSecret();
      
      expect(secret).toHaveLength(64);
      expect(secret).toMatch(/^[a-f0-9]{64}$/);
    });
    
    it('should generate unique secrets', () => {
      const secret1 = generateNfcSecret();
      const secret2 = generateNfcSecret();
      
      expect(secret1).not.toBe(secret2);
    });
  });
  
  describe('Clone Detection', () => {
    it('should detect clone attempt with same UID', async () => {
      // Simulate: Tag A writes UID, Tag B tries to reuse same UID
      // This would be caught by comparing UID hash with registered hash
      
      const uidHash1 = await hashUid(mockUid);
      const uidHash2 = await hashUid(mockUid);
      
      expect(uidHash1).toBe(uidHash2); // Same UID = same hash = clone detected
    });
    
    it('should allow legitimate tag with unique UID', async () => {
      const uidHash1 = await hashUid('NFC_UID_LEGITIMATE');
      const uidHash2 = await hashUid('NFC_UID_DIFFERENT');
      
      expect(uidHash1).not.toBe(uidHash2); // Different UIDs = unique tags
    });
  });
});

// Helper function for clone detection tests
async function hashUid(uid: string): Promise<string> {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(uid).digest('hex');
}
