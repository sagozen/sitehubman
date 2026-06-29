import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyCardPreviewRedirect() {
  const { cardId } = useLocalSearchParams();
  return <Redirect href={`/cards/preview/${cardId}`} />;
}
