# Habajaba Studio LIVE — Premium Music Streaming Website

Official music streaming web application for **Habajaba Studio LIVE** (হবজব স্টুডিও লাইভ), dedicated to original Bengali acoustic music, live studio sessions, albums, and curated playlists.

Built with React 19, TypeScript, Tailwind CSS, Lucide icons, and HTML5 Audio API. Ready for deployment on **Vercel**.

---

## 🎵 Features

1. **Brand Identity & Aesthetic**
   - Brand color palette: Primary Red (`#ED1025`), White (`#FFFFFF`), Text Dark (`#171717`), Secondary Muted (`#6B7280`), and Subtle Borders (`#EAEAEA`).
   - Authentic typography pairing: **Hind Siliguri** for Bengali script and **Inter** for English.
   - Clean, uncluttered UI inspired by premium mobile streaming apps.

2. **Responsive Layout & Mobile-First Navigation**
   - Fixed 5-tab mobile bottom bar (`Home`, `All Songs`, `Artists`, `Search`, `Playlists`) with safe-area padding (`env(safe-area-inset-bottom)`).
   - Desktop 3-zone header compliant with the Top Bar Contract.
   - Zero layout clipping, generous whitespace, and mobile thumb-zone ergonomics.

3. **Persistent Audio Player**
   - Single shared HTML5 playback controller (`AudioContext`).
   - Persistent mini player anchored above bottom navigation on mobile, docked cleanly on desktop.
   - Expandable full player with seek scrubber, volume control, shuffle, repeat mode ('off', 'all', 'one'), track queue manager, and lockscreen/MediaSession controls.
   - Keyboard shortcuts: `Space` (Play/Pause), `M` (Mute/Unmute), `Ctrl/Alt + ArrowRight` (Next), `Ctrl/Alt + ArrowLeft` (Previous).

4. **Centralized Music Catalog (`src/data/music.json`)**
   - Clean data-driven architecture.
   - Adding a new song or album requires only editing `src/data/music.json` without any UI redesign.
   - Supports tracks, albums, artists, genres, release dates, and lyrics.

5. **Dropbox Audio Streaming Integration & Live Tester**
   - Dedicated Dropbox audio streaming converter (`src/utils/dropbox.ts`) that handles conversion of Dropbox links (`dl=0` &rarr; `dl=1` or `dl.dropboxusercontent.com` with `raw=1`).
   - Built-in interactive **Dropbox Link Tester & Validator** modal for checking direct browser playback and CORS accessibility before publishing.

6. **Favorites (No Login Required)**
   - LocalStorage persistence (`habajaba_favorites_v1`).
   - Instant heart toggles across all cards, track rows, and players.
   - Dedicated Favorites view with clear explanation of local browser persistence.

7. **Artists & Curated Playlists**
   - Dynamic artist profiles generated from track metadata.
   - Curated studio playlists + user-created playlists saved in localStorage.

---

## 📁 Music Data Structure (`src/data/music.json`)

To add a new song, add an entry to the `tracks` array:

```json
{
  "id": "habajaba-track-09",
  "title": "নতুন গানের নাম (Song Title)",
  "artist": "Habajaba Studio LIVE ft. Artist",
  "album": "Album Name",
  "coverUrl": "/covers/song-cover.jpg",
  "audioUrl": "https://www.dropbox.com/scl/fi/xyz123/my-song.mp3?dl=0",
  "duration": "03:45",
  "language": "Bengali",
  "releaseDate": "2026-10-16",
  "genre": "Acoustic Live",
  "featured": true,
  "published": true,
  "description": "Recorded live at Habajaba Studio."
}
```

---

## 🛠️ Step-by-Step Dropbox Audio Workflow

1. **Upload**: Upload your authorized MP3/WAV file into Dropbox.
2. **Share Link**: Right-click the file &rarr; select **Share** &rarr; set link permissions to **"Anyone with this link can view"**.
3. **Verify**: Use the built-in **Dropbox Audio Help** modal in the website header to paste and test your link.
4. **Configure**: Paste the link into `src/data/music.json`.
5. **Add Artwork**: Place artwork inside `public/covers/` or provide a valid image URL.
6. **Deploy**: Push changes to GitHub/Vercel.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build for production
npm run build

# Run TypeScript typecheck / lint
npm run lint
```

---

## 🚀 Deployment to Vercel

1. Push this repository to GitHub or GitLab.
2. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Click **Deploy**. The included `vercel.json` ensures direct URL routing and client-side page refreshes work smoothly without 404 errors.
