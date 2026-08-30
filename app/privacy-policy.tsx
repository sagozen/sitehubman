import { SeoHead } from '@/src/components/SeoHead';
import PrivacyPolicyScreen from '@/src/features/legal/screens/PrivacyPolicyScreen';

export default function PrivacyPolicyPage() {
  return (
    <>
      <SeoHead
        title="Privacy Policy"
        description="Read how SiteHub Man protects your data and NFC card information."
      />
      <PrivacyPolicyScreen />
    </>
  );
}
