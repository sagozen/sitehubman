import { SeoHead } from '@/src/components/SeoHead';
import { GuestNfcDemoScreen } from '@/src/features/guest/GuestNfcDemoScreen';

export default function NfcDemoRoute() {
  return (
    <>
      <SeoHead title="NFC Demo" description="Experience how NFC digital business cards work with a live demo." noIndex />
      <GuestNfcDemoScreen />
    </>
  );
}
