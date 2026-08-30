import { CustomerShareScreen } from '@/src/features/customer/CustomerShareScreen';
import { SeoHead } from '@/src/components/SeoHead';

export default function ShareTabRoute() {
  return (
    <>
      <SeoHead title="Share Your Card" description="Share your NFC digital business card via QR code, link, or NFC tap." noIndex />
      <CustomerShareScreen />
    </>
  );
}

