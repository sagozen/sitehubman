import { LegacyCheckoutRedirect } from '@/src/features/guest/LegacyCheckoutRedirect';
import { SeoHead } from '@/src/components/SeoHead';

export default function GuestPostLoginChoiceRoute() {
  return (
    <>
      <SeoHead noIndex />
      <LegacyCheckoutRedirect />
    </>
  );
}
