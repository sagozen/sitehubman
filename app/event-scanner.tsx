import { SeoHead } from '@/src/components/SeoHead';
import { EventScannerScreen } from '@/src/features/customer/EventScannerScreen';

export default function EventScannerRoute() {
  return (
    <>
      <SeoHead title="Event Scanner" description="High-speed lead retrieval and badge scanner" noIndex />
      <EventScannerScreen />
    </>
  );
}
