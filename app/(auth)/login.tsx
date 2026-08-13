import { SeoHead } from '@/src/components/SeoHead';
import { LoginScreen } from '@/src/features/auth/LoginScreen';

export default function LoginRoute() {
  return (
    <>
      <SeoHead title="Sign In" description="Sign in to your SiteHub Man account to manage your NFC business cards." noIndex />
      <LoginScreen />
    </>
  );
}
