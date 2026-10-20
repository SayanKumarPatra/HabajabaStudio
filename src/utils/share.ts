import { Track, Album } from '../types/music';

export interface ShareResult {
  success: boolean;
  method: 'web-share' | 'clipboard' | 'cancelled' | 'error';
  message: string;
}

// Global custom event for displaying share notification toasts
export const SHARE_TOAST_EVENT = 'habajaba_share_toast';

export function emitShareToast(message: string, type: 'success' | 'info' | 'error' = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(SHARE_TOAST_EVENT, {
        detail: { message, type },
      })
    );
  }
}

/**
 * Share an individual music track using the Web Share API.
 * Falls back to clipboard copying if Web Share API is unsupported or declined.
 */
export async function shareTrack(track: Track): Promise<ShareResult> {
  if (typeof window === 'undefined') {
    return { success: false, method: 'error', message: 'Window not available' };
  }

  const shareUrl = `${window.location.origin}/#song-${track.id}`;
  const shareTitle = `${track.title} - ${track.artist}`;
  const shareText = `🎵 "${track.title}" by ${track.artist} on Habajaba Studio LIVE`;

  // 1. Try native Web Share API first (Mobile Chrome, Safari, Android, iOS)
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      emitShareToast('সফলভাবে শেয়ার করা হয়েছে!', 'success');
      return { success: true, method: 'web-share', message: 'Shared successfully' };
    } catch (err: any) {
      // User tapped cancel on native share sheet - don't show error
      if (err.name === 'AbortError') {
        return { success: false, method: 'cancelled', message: 'Share cancelled by user' };
      }
      // If Web Share API encountered a technical error, continue to clipboard fallback
      console.warn('Web Share API error, falling back to clipboard:', err);
    }
  }

  // 2. High-reliability Clipboard Fallback (Desktop or unsupported browsers)
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      emitShareToast(`"${track.title}" গানের লিঙ্ক কপি করা হয়েছে!`, 'success');
      return { success: true, method: 'clipboard', message: 'Link copied to clipboard' };
    } else {
      // Legacy document.execCommand fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        emitShareToast(`"${track.title}" গানের লিঙ্ক কপি করা হয়েছে!`, 'success');
        return { success: true, method: 'clipboard', message: 'Link copied to clipboard' };
      }
    }
  } catch (clipErr) {
    console.error('Clipboard copy failed:', clipErr);
  }

  emitShareToast('শেয়ার লিঙ্ক কপি করা সম্ভব হয়নি।', 'error');
  return { success: false, method: 'error', message: 'Failed to share track' };
}

/**
 * Share an album using the Web Share API.
 * Falls back to clipboard copying if Web Share API is unsupported.
 */
export async function shareAlbum(album: Album): Promise<ShareResult> {
  if (typeof window === 'undefined') {
    return { success: false, method: 'error', message: 'Window not available' };
  }

  const albumSlug = album.id || `album-${album.title.toLowerCase().replace(/\s+/g, '-')}`;
  const shareUrl = `${window.location.origin}/#${albumSlug.startsWith('album-') ? albumSlug : `album-${albumSlug}`}`;
  const shareTitle = `${album.title} - ${album.artist} (Album)`;
  const shareText = `💿 Listen to the album "${album.title}" by ${album.artist} on Habajaba Studio LIVE`;

  // 1. Try native Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      emitShareToast('অ্যালবামটি সফলভাবে শেয়ার করা হয়েছে!', 'success');
      return { success: true, method: 'web-share', message: 'Shared successfully' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'cancelled', message: 'Share cancelled by user' };
      }
      console.warn('Web Share API error, falling back to clipboard:', err);
    }
  }

  // 2. Clipboard Fallback
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      emitShareToast(`"${album.title}" অ্যালবামের লিঙ্ক কপি করা হয়েছে!`, 'success');
      return { success: true, method: 'clipboard', message: 'Album link copied to clipboard' };
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        emitShareToast(`"${album.title}" অ্যালবামের লিঙ্ক কপি করা হয়েছে!`, 'success');
        return { success: true, method: 'clipboard', message: 'Album link copied to clipboard' };
      }
    }
  } catch (clipErr) {
    console.error('Clipboard copy failed:', clipErr);
  }

  emitShareToast('অ্যালবামের লিঙ্ক কপি করা সম্ভব হয়নি।', 'error');
  return { success: false, method: 'error', message: 'Failed to share album' };
}
