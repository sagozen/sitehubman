import { SeoHead } from '@/src/components/SeoHead';
import { HelpCenterScreen } from '@/src/features/help/HelpCenterScreen';

export default function HelpRoute() {
  return (
    <>
      <SeoHead
        title="Help & Support"
        description="AVIO Customer Support Desk — NFC card tapping guides, card activation help, profile customizer, and 24/7 VIP assistance."
      />
      <HelpCenterScreen />
    </>
  );
}
