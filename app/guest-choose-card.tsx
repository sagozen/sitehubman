import { Redirect } from 'expo-router';
import { appRoutes } from '@/src/constants/navigation';
import { SeoHead } from '@/src/components/SeoHead';

/** Legacy route — choose + design are one screen at guest-design. */
export default function GuestChooseCardRoute() {
  return (
    <>
      <SeoHead title="Choose Card" noIndex />
      <Redirect href={appRoutes.guestDesign} />
    </>
  );
}
