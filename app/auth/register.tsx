import { Redirect } from 'expo-router';
import { SeoHead } from '@/src/components/SeoHead';

export default function LegacyRegisterRedirect() {
  return (
    <>
      <SeoHead title="Register" noIndex />
      <Redirect href="/(auth)/register" />
    </>
  );
}
