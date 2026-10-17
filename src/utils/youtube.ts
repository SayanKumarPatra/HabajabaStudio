/**
 * YouTube Utility for Habajaba Studio LIVE
 * Handles extraction of Video IDs, HD thumbnails, and oEmbed metadata
 * Enables instant audio streaming from YouTube video links.
 */

export interface YouTubeDetails {
  videoId: string;
  title: string;
  author: string;
  thumbnailUrl: string;
}

/**
 * Extracts the 11-character YouTube video ID from various YouTube URL formats.
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // If already an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex covering standard watch, youtu.be shortlinks, embed, shorts, music.youtube, etc.
  const regex =
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(regex);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Checks if a given URL or string is a YouTube link.
 */
export function isYouTubeUrl(input: string): boolean {
  return extractYouTubeVideoId(input) !== null;
}

/**
 * Extracts optional start time offset in seconds from YouTube URL (e.g. ?t=120 or &t=1m30s).
 */
export function extractYouTubeStartTime(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  const match = input.match(/[?&]t=([0-9hms]+)/i);
  if (!match || !match[1]) return null;
  const raw = match[1].toLowerCase();
  if (/^\d+$/.test(raw)) {
    return parseInt(raw, 10);
  }
  let totalSeconds = 0;
  const hours = raw.match(/(\d+)h/i);
  const minutes = raw.match(/(\d+)m/i);
  const seconds = raw.match(/(\d+)s/i);
  if (hours) totalSeconds += parseInt(hours[1], 10) * 3600;
  if (minutes) totalSeconds += parseInt(minutes[1], 10) * 60;
  if (seconds) totalSeconds += parseInt(seconds[1], 10);
  return totalSeconds > 0 ? totalSeconds : null;
}

/**
 * Gets high-quality 16:9 thumbnail for a YouTube video.
 */
export function getYouTubeThumbnail(videoId: string, quality: 'maxres' | 'hq' | 'mq' = 'hq'): string {
  if (!videoId) return '/banner-default.svg';
  // maxresdefault is 1080p 16:9, hqdefault is reliable fallback
  if (quality === 'maxres') {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Fetches video title and channel/author name from public oEmbed API.
 * Uses noembed.com which allows CORS in browser seamlessly without an API key.
 */
export async function fetchYouTubeMetadata(videoIdOrUrl: string): Promise<YouTubeDetails | null> {
  const videoId = extractYouTubeVideoId(videoIdOrUrl);
  if (!videoId) return null;

  const defaultDetails: YouTubeDetails = {
    videoId,
    title: '',
    author: 'Habajaba Studio LIVE',
    thumbnailUrl: getYouTubeThumbnail(videoId, 'hq'),
  };

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        videoId,
        title: data.title || '',
        author: data.author_name || 'Habajaba Studio LIVE',
        thumbnailUrl: data.thumbnail_url || getYouTubeThumbnail(videoId, 'hq'),
      };
    }
  } catch (err) {
    console.warn('Could not fetch YouTube oEmbed info:', err);
  }

  return defaultDetails;
}
