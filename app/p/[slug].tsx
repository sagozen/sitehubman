import { useLocalSearchParams } from 'expo-router';
import { PublicBioScreen } from '@/src/features/bio/PublicBioScreen';

/** Vanity profile URL: https://sitehubman.vercel.app/p/{slug}. */
export default function PublicSlugRoute() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  return <PublicBioScreen slug={slug} />;
}
