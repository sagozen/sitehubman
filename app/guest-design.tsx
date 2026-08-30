import { Redirect } from 'expo-router';
import { SeoHead } from '@/src/components/SeoHead';

export default function LegacyGuestDesignRedirect() {
  return (
    <>
      <SeoHead title="Design Card" noIndex />
      <Redirect href="/cards/design" />
    </>
  );
}
