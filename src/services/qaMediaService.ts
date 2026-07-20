import { uploadVideoToCloudinary } from '@/src/services/cloudinaryService';

/** Upload floor QA video to Cloudinary via optimized upload function. */
export async function uploadQaVideo(jobId: string, localUri: string): Promise<string> {
  const trimmedJob = jobId.trim();
  if (!trimmedJob) throw new Error('Printer job ID is required.');
  if (!localUri?.trim()) throw new Error('QA video file is required.');

  const result = await uploadVideoToCloudinary({
    uri: localUri,
    folder: `sitehub/qa-videos/${trimmedJob}`,
  });

  return result.url;
}
