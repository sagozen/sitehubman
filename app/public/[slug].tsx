import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyPublicSlugRedirect2() {
  const { slug } = useLocalSearchParams();
  return <Redirect href={`/u/${slug}`} />;
}
