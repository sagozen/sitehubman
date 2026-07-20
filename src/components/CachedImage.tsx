import { CloudinaryImage } from '@/src/components/CloudinaryImage';
import type { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof CloudinaryImage>, 'uri'> & {
  uri: string | null | undefined;
};

/** Remote image display — Cloudinary-optimized URLs, lazy-loaded, URL cache only. */
export function CachedImage(props: Props) {
  return <CloudinaryImage {...props} lazy />;
}
