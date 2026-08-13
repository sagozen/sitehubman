import { GuestAnalyticsScreen } from '@/src/features/guest/GuestAnalyticsScreen';
import { SeoHead } from '@/src/components/SeoHead';

export default function GuestAnalyticsRoute() {
  return (
    <>
      <SeoHead title="Card Analytics" description="Track who taps your NFC card, view analytics, and measure your networking impact." noIndex />
      <GuestAnalyticsScreen />
    </>
  );
}
