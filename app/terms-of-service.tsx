import { SeoHead } from '@/src/components/SeoHead';
import TermsOfServiceScreen from '@/src/features/legal/screens/TermsOfServiceScreen';

export default function TermsOfServicePage() {
  return (
    <>
      <SeoHead
        title="Terms of Service"
        description="SiteHub Man terms of service for NFC digital business cards."
      />
      <TermsOfServiceScreen />
    </>
  );
}
