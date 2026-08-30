/**
 * /preview — web-only world-class monochrome preview.
 * Bypasses AuthGate/router/tour logic and renders MonoDemoScreen directly.
 * Visit http://localhost:8081/preview while Expo dev server is running.
 */
import { SeoHead } from '@/src/components/SeoHead';
import { MonoDemoScreen } from '@/src/components/MonoDemoScreen';

export default function PreviewRoute() {
  return (
    <>
      <SeoHead title="Preview" noIndex />
      <MonoDemoScreen />
    </>
  );
}
