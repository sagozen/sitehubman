import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyPublicSlugRedirect() {
  const { slug } = useLocalSearchParams();
  return <Redirect href={`/u/${slug}`} />;
}
