import { LegacyCheckoutRedirect } from '@/src/features/guest/LegacyCheckoutRedirect';
import { SeoHead } from '@/src/components/SeoHead';

export default function GuestCheckoutRoute() {
  return (
    <>
      <SeoHead title="Checkout" noIndex />
      <LegacyCheckoutRedirect />
    </>
  );
}
