import { SeoHead } from '@/src/components/SeoHead';
import { QrCodeGeneratorScreen } from '@/src/features/customer/QrCodeGeneratorScreen';

export default function QrGeneratorRoute() {
  return (
    <>
      <SeoHead title="QR Generator" noIndex />
      <QrCodeGeneratorScreen />
    </>
  );
}
