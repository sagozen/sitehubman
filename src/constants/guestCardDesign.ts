import type { CardDesign } from '@/src/types/models';
import type { ChooseCardGradient } from '@/src/features/guest/GuestChooseCardPreview';

/** Consumer card finishes — black, green-orange, or custom photo only. */
export const guestCardFinishOptions: { label: string; value: CardDesign }[] = [
  { label: 'Black', value: 'classic_black' },
  { label: 'Green Orange', value: 'green_orange' },
  { label: 'Custom', value: 'custom' },
];

export const GUEST_GREEN_ORANGE_GRADIENT: ChooseCardGradient = {
  colors: ['#15803D', '#22C55E', '#FB923C'],
  accent: '#FFFFFF',
};

export const GUEST_VIRTUAL_CARD_GRADIENTS: ChooseCardGradient[] = [
  { colors: ['#1C1C1E', '#2C2C2E', '#3A3A3C'], accent: '#FFFFFF' },
  GUEST_GREEN_ORANGE_GRADIENT,
];

export const GUEST_PHYSICAL_CARD_GRADIENTS: ChooseCardGradient[] = [
  { colors: ['#1C1C1E', '#2C2C2E', '#3A3A3C'], accent: '#FFFFFF' },
  GUEST_GREEN_ORANGE_GRADIENT,
];

/** Third carousel slide = custom photo. */
export const GUEST_CAROUSEL_CUSTOM_INDEX = 2;

export function guestDesignToCarouselIndex(design: CardDesign | undefined): number {
  if (design === 'custom') return GUEST_CAROUSEL_CUSTOM_INDEX;
  if (design === 'green_orange' || design === 'classic_white') return 1;
  return 0;
}

export function guestCarouselIndexToDesign(index: number): CardDesign {
  if (index >= GUEST_CAROUSEL_CUSTOM_INDEX) return 'custom';
  if (index === 1) return 'green_orange';
  return 'classic_black';
}

export function guestGradientsForSegment(segment: 'virtual' | 'physical'): ChooseCardGradient[] {
  return segment === 'physical' ? GUEST_PHYSICAL_CARD_GRADIENTS : GUEST_VIRTUAL_CARD_GRADIENTS;
}
