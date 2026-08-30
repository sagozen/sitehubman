import { Redirect } from 'expo-router';
import { SeoHead } from '@/src/components/SeoHead';

export default function SignUpAliasRoute() {
  return (
    <>
      <SeoHead title="Sign Up" noIndex />
      <Redirect href="/auth/register" />
    </>
  );
}
