import { SeoHead } from '@/src/components/SeoHead';
import { GuestScanScreen } from '@/src/features/guest/GuestScanScreen';

export default function ScanRoute() {
  return (
    <>
      <SeoHead title="Scan" noIndex />
      <GuestScanScreen />
    </>
  );
}
