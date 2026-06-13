import { uploadImageToCloudinary } from '@/src/services/cloudinaryService';

interface UploadOrderArtworkInput {
  uri: string;
  salesUserId: string;
  fileName?: string | null;
  mimeType?: string | null;
}

interface UploadOrderArtworkResult {
  url: string;
  path: string;
}

/** Upload order card artwork to Cloudinary. */
export async function uploadOrderArtwork(input: UploadOrderArtworkInput): Promise<UploadOrderArtworkResult> {
  const result = await uploadImageToCloudinary({
    uri: input.uri,
    folder: `sitehub/order-artwork/${input.salesUserId}`,
    fileName: input.fileName,
    mimeType: input.mimeType,
    tags: ['order', 'artwork', 'nfc-card'],
  });
  return { url: result.url, path: result.publicId };
}
