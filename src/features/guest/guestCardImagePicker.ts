import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '@/src/services/cloudinaryService';
import { isRemoteImageUrl } from '@/src/services/localImageStore';

export type GuestCardImagePickResult = {
  uri: string;
};

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [16, 10],
  quality: 0.85,
};

/** Pick or capture a photo, upload to Cloudinary, return optimized HTTPS URL. */
export async function pickAndUploadGuestCardImage(
  fromCamera: boolean,
  ownerKey: string,
): Promise<string | null> {
  try {
    if (fromCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera access needed',
          'Allow camera access in Settings to take a photo for your card design.',
        );
        return null;
      }
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photos access needed',
          'Allow photo library access in Settings to choose an image for your card design.',
        );
        return null;
      }
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    const uploaded = await uploadImageToCloudinary({
      uri: asset.uri,
      folder: `sitehub/guest-cards/${ownerKey}`,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      tags: ['guest', 'card-design', 'custom'],
    });
    return uploaded.url;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Try again or choose a different photo.';
    Alert.alert('Could not upload image', message);
    return null;
  }
}

/** @deprecated Use pickAndUploadGuestCardImage — only Cloudinary HTTPS URLs are kept. */
export async function pickGuestCardImage(fromCamera: boolean): Promise<GuestCardImagePickResult | null> {
  const url = await pickAndUploadGuestCardImage(fromCamera, 'legacy');
  return url ? { uri: url } : null;
}

/** Only Cloudinary / remote HTTPS URLs — no local files or base64. */
export function resolveGuestCustomImageUri(uri: string | undefined): string | null {
  if (!uri?.trim()) return null;
  const trimmed = uri.trim();
  if (isRemoteImageUrl(trimmed)) return trimmed;
  return null;
}
