import { SeoHead } from '@/src/components/SeoHead';
import { RegisterScreen } from '@/src/features/auth/RegisterScreen';

export default function RegisterRoute() {
  return (
    <>
      <SeoHead title="Create Account" description="Create your SiteHub Man account and start designing NFC digital business cards." noIndex />
      <RegisterScreen />
    </>
  );
}
