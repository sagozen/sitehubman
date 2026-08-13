import { SeoHead } from '@/src/components/SeoHead';
import { GuestStudioScreen } from '@/src/features/guest/GuestStudioScreen';

export default function StudioRoute() {
  return (
    <>
      <SeoHead title="Studio" description="Design and customize your NFC digital business card in the studio." noIndex />
      <GuestStudioScreen />
    </>
  );
}
