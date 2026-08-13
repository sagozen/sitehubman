import { SeoHead } from '@/src/components/SeoHead';
import { LanguagePickerScreen } from '@/src/features/settings/LanguagePickerScreen';

export default function LanguagePickerRoute() {
  return (
    <>
      <SeoHead title="Language" noIndex />
      <LanguagePickerScreen />
    </>
  );
}
