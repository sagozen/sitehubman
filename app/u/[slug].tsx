import { useLocalSearchParams } from 'expo-router';
import { PublicBioScreen } from '@/src/features/bio/PublicBioScreen';
import { DemoBioScreen } from '@/src/features/bio/DemoBioScreen';

/** Vanity profile URL: https://sitehubman.vercel.app/u/{slug}. */
export default function PublicSlugRoute() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  // Static demo profile — always works, no Firestore needed
  if (slug === 'demo') return <DemoBioScreen />;

  return <PublicBioScreen slug={slug} />;
}
