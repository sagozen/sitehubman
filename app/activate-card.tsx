import { SeoHead } from '@/src/components/SeoHead';
import { ActivateCardScreen } from '@/src/features/bio/ActivateCardScreen';

export default function ActivateCardRoute() {
  return (
    <>
      <SeoHead title="Activate Card" noIndex />
      <ActivateCardScreen />
    </>
  );
}
