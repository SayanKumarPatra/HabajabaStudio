import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

function getYtDlpPath(): string {
  const localBin = path.resolve(__dirname, 'bin', 'yt-dlp');
  if (fs.existsSync(localBin)) return localBin;
  const tmpBin = '/tmp/yt-dlp';
  if (fs.existsSync(tmpBin)) return tmpBin;
  return 'yt-dlp';
}

// In-memory cache for resolved direct googlevideo audio stream URLs (valid ~4 hours)
interface CachedStream {
  url: string;
  cachedAt: number;
}
const streamCache = new Map<string, CachedStream>();
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

async function getYouTubeAudioStreamUrl(videoId: string): Promise<string> {
  const cached = streamCache.get(videoId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.url;
  }

  const ytDlp = getYtDlpPath();
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return new Promise((resolve, reject) => {
    // -g: get direct streaming url
    // -f "ba[ext=m4a]/ba": best audio preferring m4a (AAC) or any best audio (webm/opus)
    execFile(
      ytDlp,
      ['-g', '-f', 'ba[ext=m4a]/ba', videoUrl],
      { timeout: 15000 },
      (error, stdout, stderr) => {
        if (error) {
          console.warn(`[yt-dlp] Error resolving ${videoId}:`, error.message, stderr);
          return reject(new Error('Failed to resolve audio stream'));
        }
        const lines = stdout.trim().split('\n');
        const streamUrl = lines[0]?.trim();
        if (!streamUrl || !streamUrl.startsWith('http')) {
          return reject(new Error('Invalid stream URL resolved'));
        }

        streamCache.set(videoId, {
          url: streamUrl,
          cachedAt: Date.now(),
        });
        resolve(streamUrl);
      }
    );
  });
}

async function startServer() {
  const app = express();

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Direct Audio Streaming Proxy for YouTube Video IDs
  // Enables mobile devices to play YouTube audio in HTML5 <audio> with screen locked / power button off
  app.get('/api/yt-stream', async (req: Request, res: Response): Promise<void> => {
    const rawId = (req.query.id as string) || '';
    // Clean and validate video ID (11 standard YouTube characters)
    const match = rawId.match(/([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : '';

    if (!videoId) {
      res.status(400).json({ error: 'Valid YouTube video ID is required' });
      return;
    }

    try {
      const targetAudioUrl = await getYouTubeAudioStreamUrl(videoId);

      const clientRange = req.headers.range;
      const parsedUrl = new URL(targetAudioUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const proxyHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: '*/*',
      };

      if (clientRange) {
        proxyHeaders.Range = clientRange;
      }

      const proxyReq = client.request(
        targetAudioUrl,
        {
          method: 'GET',
          headers: proxyHeaders,
        },
        (proxyRes) => {
          const statusCode = proxyRes.statusCode || 200;

          // If upstream expired URL, clear cache and fail gracefully
          if (statusCode === 403 || statusCode === 410) {
            streamCache.delete(videoId);
            res.status(502).json({ error: 'Upstream stream link expired, please retry' });
            return;
          }

          const responseHeaders: Record<string, any> = {
            'Content-Type': proxyRes.headers['content-type'] || 'audio/mp4',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          };

          if (proxyRes.headers['content-length']) {
            responseHeaders['Content-Length'] = proxyRes.headers['content-length'];
          }
          if (proxyRes.headers['content-range']) {
            responseHeaders['Content-Range'] = proxyRes.headers['content-range'];
          }

          res.writeHead(statusCode, responseHeaders);
          proxyRes.pipe(res);
        }
      );

      proxyReq.on('error', (err) => {
        console.warn(`[Stream Proxy Error] ${videoId}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Failed to proxy audio stream' });
        }
      });

      // Cleanup upstream request if mobile client aborts connection (e.g. skip track)
      req.on('close', () => {
        proxyReq.destroy();
      });

      proxyReq.end();
    } catch (err: any) {
      console.warn(`[Stream Resolve Error] ${videoId}:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Could not resolve audio stream for this YouTube track' });
      }
    }
  });

  // Setup Vite in Dev or Static files in Production
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Habajaba Audio Server] Running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Server Startup Failure]:', err);
  process.exit(1);
});
