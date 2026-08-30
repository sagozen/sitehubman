import { Redirect } from 'expo-router';
import { SeoHead } from '@/src/components/SeoHead';

export default function LegacyLoginRedirect() {
  return (
    <>
      <SeoHead title="Sign In" noIndex />
      <Redirect href="/(auth)/login" />
    </>
  );
}
