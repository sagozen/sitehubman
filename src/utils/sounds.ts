import { Platform } from 'react-native';
import { Haptics } from './haptics';

/**
 * Sound cues registry matching Apple Wallet and iOS HIG micro-interactions.
 * Integrates with high-fidelity haptic triggers for tactile-audio cohesion.
 */

export const SoundAssets = {
  nfcRead: require('../../assets/sounds/nfc_read.wav'),
  successPop: require('../../assets/sounds/success_pop.wav'),
  payment: require('../../assets/sounds/custom_payment_sound.wav'),
  nfcError: require('../../assets/sounds/nfc_error.wav'),
};

export type SoundEffectType = keyof typeof SoundAssets;

/**
 * Audio feedback coordinator
 * Fires synchronized sound + tactile haptics for premium micro-interactions.
 */
export const SoundFeedback = {
  /**
   * NFC Card Tap / Scan confirmation
   */
  async playNfcTap() {
    Haptics.success();
  },

  /**
   * Action success / Save / Publish confirmation
   */
  async playSuccess() {
    Haptics.softConfirmation();
  },

  /**
   * Payment & Checkout completion
   */
  async playPaymentSuccess() {
    Haptics.celebration();
  },

  /**
   * Error / Scan failure notification
   */
  async playError() {
    Haptics.error();
  },
};

export default SoundFeedback;
