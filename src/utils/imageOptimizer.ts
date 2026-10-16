/**
 * Utility to compress and optimize images before uploading to Firebase
 * Keeps payloads lightweight (< 100KB) to ensure instant synchronization
 * and avoid database size limits.
 */
export async function optimizeImageFile(
  file: File,
  maxWidth = 1280,
  maxHeight = 720,
  quality = 0.82,
  format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/webp'
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio preserving dimensions
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
          // Fallback to raw data url
          resolve(reader.result as string);
          return;
        }

        // Draw image onto canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // For transparent logos, prefer image/png or image/webp
        const outputFormat = file.type === 'image/png' || file.type === 'image/svg+xml' ? 'image/png' : format;
        try {
          const dataUrl = canvas.toDataURL(outputFormat, quality);
          resolve(dataUrl);
        } catch {
          resolve(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
