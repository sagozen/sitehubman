import { uploadImageToCloudinary } from '@/src/services/cloudinaryService';

interface UploadProfilePhotoInput {
  uri: string;
  userId: string;
  fileName?: string | null;
  mimeType?: string | null;
}

interface UploadProfilePhotoResult {
  url: string;
  publicId: string;
}

/** Upload profile photo to Cloudinary — optimized delivery URL returned. */
export async function uploadProfilePhoto(input: UploadProfilePhotoInput): Promise<UploadProfilePhotoResult> {
  const result = await uploadImageToCloudinary({
    uri: input.uri,
    folder: `sitehub/profile-photos/${input.userId}`,
    fileName: input.fileName,
    mimeType: input.mimeType,
    tags: ['profile', 'avatar'],
  });
  return { url: result.url, publicId: result.publicId };
}
