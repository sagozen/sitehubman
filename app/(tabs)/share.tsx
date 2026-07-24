import { PublicBioScreen } from '@/src/features/bio/PublicBioScreen';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { Platform } from 'react-native';
import Head from 'expo-router/head';

export default function ShareTabRoute() {
  const { user } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');

  return (
    <>
      {Platform.OS === 'web' && (
        <Head>
          <title>Digital Bio Profile | Snap Tap NFC</title>
          <meta name="description" content="Live digital NFC profile and contact links." />
        </Head>
      )}
      <PublicBioScreen slug={bioPage?.slug || 'guest-demo'} />
    </>
  );
}

