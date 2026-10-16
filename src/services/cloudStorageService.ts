import { getFirebaseStorage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { optimizeImageFile } from '../utils/imageOptimizer';

export interface UploadResult {
  url: string;
  isCloudStorage: boolean;
  message?: string;
}

/**
 * Upload an image file directly to Firebase Cloud Storage,
 * with fallback to ultra-compact high-res data URL.
 */
export async function uploadImageToCloud(
  file: File,
  folder = 'images',
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'image/jpeg' | 'image/png' | 'image/webp';
  }
): Promise<UploadResult> {
  const isLogo = folder === 'branding' || file.type === 'image/png' || file.type === 'image/svg+xml';
  const format = options?.format || (isLogo ? 'image/png' : 'image/jpeg');
  const maxWidth = options?.maxWidth || (isLogo ? 600 : 1280);
  const maxHeight = options?.maxHeight || (isLogo ? 240 : 720);
  const quality = options?.quality || (isLogo ? 0.95 : 0.85);

  // 1. Optimize image first
  const optimizedDataUrl = await optimizeImageFile(file, maxWidth, maxHeight, quality, format);

  // 2. Try Firebase Storage
  const storageInstance = getFirebaseStorage();
  if (storageInstance) {
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `habajaba_${folder}/${Date.now()}_${cleanName}`;
      const fileRef = ref(storageInstance.storage, filename);

      // Convert optimized data URL to blob
      const res = await fetch(optimizedDataUrl);
      const blob = await res.blob();

      await uploadBytes(fileRef, blob, {
        contentType: blob.type || (format === 'image/png' ? 'image/png' : 'image/jpeg'),
        cacheControl: 'public, max-age=31536000',
      });

      const downloadUrl = await getDownloadURL(fileRef);
      if (downloadUrl) {
        return {
          url: downloadUrl,
          isCloudStorage: true,
          message: 'Firebase Cloud Storage-এ সফলভাবে আপলোড সম্পন্ন হয়েছে।',
        };
      }
    } catch (storageErr: any) {
      console.warn('Firebase Storage direct upload skipped/failed, falling back to data URL:', storageErr);
    }
  }

  // Fallback to optimized inline data URL
  return {
    url: optimizedDataUrl,
    isCloudStorage: false,
    message: 'অপ্টিমাইজড হাই-ডেফিনিশন ইমেজ হিসেবে সংরক্ষিত হয়েছে।',
  };
}
