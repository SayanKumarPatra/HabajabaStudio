/**
 * High-speed image compressor and optimizer.
 * Uses native createImageBitmap and URL.createObjectURL for near-instant decoding
 * even on large 10MB+ smartphone camera photos.
 */
export async function optimizeImageFile(
  file: File,
  maxWidth = 1280,
  maxHeight = 720,
  quality = 0.82,
  format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/webp'
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image');
  }

  const outputFormat =
    file.type === 'image/png' || file.type === 'image/svg+xml'
      ? 'image/png'
      : format;

  // 1. Ultra-fast path: native createImageBitmap (GPU/multi-threaded)
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      let { width, height } = bitmap;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();
        return canvas.toDataURL(outputFormat, quality);
      }
      bitmap.close();
    } catch {
      // Fall through to object URL path if bitmap creation fails
    }
  }

  // 2. High-speed fallback: URL.createObjectURL (avoids huge FileReader string allocation)
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image element'));
    };

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(objectUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const dataUrl = canvas.toDataURL(outputFormat, quality);
        resolve(dataUrl);
      } catch {
        resolve(objectUrl);
      }
    };

    img.src = objectUrl;
  });
}

