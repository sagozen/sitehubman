import { GuestTrackOrderScreen } from '@/src/features/guest/GuestTrackOrderScreen';
import { SeoHead } from '@/src/components/SeoHead';

export default function GuestTrackOrderRoute() {
  return (
    <>
      <SeoHead title="Track Order" noIndex />
      <GuestTrackOrderScreen />
    </>
  );
}
