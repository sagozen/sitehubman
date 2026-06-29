import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyCardIdRedirect() {
  const { cardId } = useLocalSearchParams();
  return <Redirect href={`/cards/${cardId}`} />;
}
