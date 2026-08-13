import { SeoHead } from '@/src/components/SeoHead';
import { EditBioScreen } from '@/src/features/bio/EditBioScreen';

export default function EditBioRoute() {
  return (
    <>
      <SeoHead title="Edit Bio" noIndex />
      <EditBioScreen />
    </>
  );
}
