import { SeoHead } from '@/src/components/SeoHead';
import { HelpCenterScreen } from '@/src/features/help/HelpCenterScreen';

export default function HelpRoute() {
  return (
    <>
      <SeoHead
        title="Help & Support"
        description="AVIO support for NFC card tapping, card activation, profile setup, and orders."
      />
      <HelpCenterScreen />
    </>
  );
}
