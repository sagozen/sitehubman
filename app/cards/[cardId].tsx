import { useLocalSearchParams } from 'expo-router';
import { PublicBioScreen } from '@/src/features/bio/PublicBioScreen';

/** NFC tap opens https://sitehubman.vercel.app/c/{cardId}; chip stores only this URL. */
export default function PublicCardRoute() {
  const params = useLocalSearchParams<{ cardId: string }>();
  const cardId = typeof params.cardId === 'string' ? params.cardId : '';

  return <PublicBioScreen cardId={cardId} />;
}
