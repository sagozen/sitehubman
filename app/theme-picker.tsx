import { SeoHead } from '@/src/components/SeoHead';
import { ThemePickerScreen } from '@/src/features/bio/ThemePickerScreen';

export default function ThemePickerRoute() {
  return (
    <>
      <SeoHead title="Theme" noIndex />
      <ThemePickerScreen />
    </>
  );
}
