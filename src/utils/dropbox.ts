/**
 * Dropbox Audio URL Helper and Streaming Utility
 * 
 * Standard Dropbox share URLs (e.g. https://www.dropbox.com/s/xyz/song.mp3?dl=0)
 * return an HTML preview page rather than the raw audio stream.
 * 
 * This utility converts shared links to direct content endpoints (dl=1 or dl.dropboxusercontent.com)
 * while explaining CORS, direct playback limits, and format requirements honestly.
 */

export interface DropboxUrlAnalysis {
  originalUrl: string;
  streamableUrl: string;
  isDropbox: boolean;
  isValid: boolean;
  warning?: string;
  notes?: string;
}

/**
 * Converts a Dropbox share link to a direct streaming audio URL
 */
export function getDirectAudioUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If already a direct mp3/wav/ogg stream
  if (!trimmed.includes('dropbox.com')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);

    // If it's a dropbox link with dl=0, replace dl=0 with dl=1
    if (parsed.hostname.includes('dropbox.com')) {
      // Modern Dropbox share links (dropbox.com/scl/fi/... or dropbox.com/s/...)
      parsed.searchParams.set('dl', '1');
      parsed.searchParams.delete('preview');
      
      // Also dropbox raw parameter
      parsed.searchParams.set('raw', '1');

      // Use dl.dropboxusercontent.com if it's www.dropbox.com for better direct media serving
      if (parsed.hostname === 'www.dropbox.com') {
        parsed.hostname = 'dl.dropboxusercontent.com';
      }

      return parsed.toString();
    }
  } catch (err) {
    console.warn('Invalid URL passed to getDirectAudioUrl:', url, err);
  }

  return trimmed;
}

/**
 * Validates and analyzes an audio URL for Dropbox streaming compatibility
 */
export function analyzeAudioUrl(url: string): DropboxUrlAnalysis {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      originalUrl: '',
      streamableUrl: '',
      isDropbox: false,
      isValid: false,
      warning: 'URL is empty',
    };
  }

  const trimmed = url.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      originalUrl: trimmed,
      streamableUrl: trimmed,
      isDropbox: false,
      isValid: false,
      warning: 'Invalid URL format. Please provide a full URL including https://',
    };
  }

  const isDropbox = parsed.hostname.includes('dropbox.com');
  const streamable = getDirectAudioUrl(trimmed);

  if (isDropbox) {
    return {
      originalUrl: trimmed,
      streamableUrl: streamable,
      isDropbox: true,
      isValid: true,
      notes: 'Direct streaming link generated via dl.dropboxusercontent.com with raw=1.',
      warning: 'Ensure the file in Dropbox has public link-sharing enabled ("Anyone with this link can view"). Private or restricted files cannot be streamed in the browser without authentication.',
    };
  }

  return {
    originalUrl: trimmed,
    streamableUrl: streamable,
    isDropbox: false,
    isValid: true,
    notes: 'Direct web audio resource.',
  };
}

/**
 * Tests direct browser audio playback capability by probing with an Audio element
 */
export async function testAudioStreamability(url: string): Promise<{ success: boolean; message: string; duration?: number }> {
  const directUrl = getDirectAudioUrl(url);

  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';

    const timer = setTimeout(() => {
      audio.src = '';
      resolve({
        success: false,
        message: 'Timeout: Audio resource took too long to load metadata. Check your network or URL accessibility.',
      });
    }, 10000);

    audio.onloadedmetadata = () => {
      clearTimeout(timer);
      const dur = audio.duration;
      audio.src = '';
      resolve({
        success: true,
        message: 'Audio resource is directly playable in browser HTML5 Audio!',
        duration: isFinite(dur) ? dur : undefined,
      });
    };

    audio.onerror = () => {
      clearTimeout(timer);
      const code = audio.error?.code;
      let errorMsg = 'Could not load audio file.';
      if (code === 4) {
        errorMsg = 'Format not supported or server prohibited cross-origin / direct streaming access (CORS).';
      } else if (code === 2) {
        errorMsg = 'Network error while attempting to fetch audio file.';
      }
      audio.src = '';
      resolve({
        success: false,
        message: errorMsg,
      });
    };

    try {
      audio.src = directUrl;
      audio.load();
    } catch (err: unknown) {
      clearTimeout(timer);
      resolve({
        success: false,
        message: err instanceof Error ? err.message : 'Unknown audio error',
      });
    }
  });
}
