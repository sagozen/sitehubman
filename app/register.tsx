import { Redirect } from 'expo-router';
import { SeoHead } from '@/src/components/SeoHead';

export default function RegisterAliasRoute() {
  return (
    <>
      <SeoHead title="Register" noIndex />
      <Redirect href="/auth/register" />
    </>
  );
}
