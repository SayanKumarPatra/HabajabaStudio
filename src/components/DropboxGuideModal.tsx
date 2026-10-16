import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Play,
  Loader2,
  ExternalLink,
  Music,
} from 'lucide-react';
import { analyzeAudioUrl, testAudioStreamability } from '../utils/dropbox';

interface DropboxGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DropboxGuideModal: React.FC<DropboxGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [testUrl, setTestUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    duration?: number;
    convertedUrl?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!testUrl.trim()) return;
    setIsTesting(true);
    setTestResult(null);

    const analysis = analyzeAudioUrl(testUrl);
    const result = await testAudioStreamability(testUrl);

    setIsTesting(false);
    setTestResult({
      success: result.success,
      message: result.message,
      duration: result.duration,
      convertedUrl: analysis.streamableUrl,
    });
  };

  const handleCopyConverted = () => {
    if (testResult?.convertedUrl) {
      navigator.clipboard?.writeText(testResult.convertedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Dropbox Music Guide and URL Validator"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#EAEAEA] overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ED1025]/10 flex items-center justify-center text-[#ED1025]">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171717]">
                Dropbox Audio Integration & Music Management Guide
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Habajaba Studio LIVE Centralized Music Configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-200/80 flex items-center justify-center text-[#6B7280] hover:text-[#171717] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-[#171717]">
          {/* Section 1: Live Interactive Dropbox URL Tester */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-[#EAEAEA] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
              <span>Test & Convert Your Dropbox Audio URL</span>
            </h4>
            <p className="text-xs text-[#6B7280]">
              Paste any Dropbox share link (e.g.{' '}
              <code className="text-[#171717] bg-white px-1 py-0.5 rounded border border-[#EAEAEA]">
                https://www.dropbox.com/s/.../song.mp3?dl=0
              </code>
              ). This tool converts it into a browser streamable URL and checks HTML5 audio compatibility.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://www.dropbox.com/scl/fi/... or direct audio link"
                className="flex-1 text-xs px-3 py-2.5 rounded-lg border border-[#EAEAEA] focus:border-[#ED1025] focus:outline-hidden bg-white"
              />
              <button
                onClick={handleTest}
                disabled={isTesting || !testUrl.trim()}
                className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#ED1025] hover:bg-[#D90D20] text-white flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shrink-0"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Test Audio Stream</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Results Display */}
            {testResult && (
              <div
                className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                  testResult.success
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.duration && (
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Detected Duration: {Math.floor(testResult.duration / 60)}m{' '}
                        {Math.floor(testResult.duration % 60)}s
                      </p>
                    )}
                  </div>
                </div>

                {testResult.convertedUrl && (
                  <div className="pt-2 border-t border-black/10 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] truncate max-w-[80%] text-neutral-700 bg-white/70 px-2 py-1 rounded">
                      {testResult.convertedUrl}
                    </span>
                    <button
                      onClick={handleCopyConverted}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-black/10 rounded hover:bg-neutral-100 flex items-center gap-1 shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy for music.json</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: 8-Step Release Workflow */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
              Step-by-Step Music Publishing Workflow
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-lg border border-[#EAEAEA] bg-white">
                <span className="font-bold text-[#ED1025] block mb-1">01. Upload to Dropbox</span>
                <p className="text-[#6B7280]">
                  Upload your authorized MP3/WAV file into your Dropbox account.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#EAEAEA] bg-white">
                <span className="font-bold text-[#ED1025] block mb-1">02. Create Shared Link</span>
                <p className="text-[#6B7280]">
                  Right-click the file &rarr; Share &rarr; Set permissions to "Anyone with the link can view".
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#EAEAEA] bg-white">
                <span className="font-bold text-[#ED1025] block mb-1">03. Convert / Verify Link</span>
                <p className="text-[#6B7280]">
                  Use the validator above or replace <code className="text-[#ED1025]">dl=0</code> with <code className="text-[#ED1025]">raw=1</code>.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#EAEAEA] bg-white">
                <span className="font-bold text-[#ED1025] block mb-1">04. Update music.json</span>
                <p className="text-[#6B7280]">
                  Add track entry with title, artist, album, and playable audio URL to <code className="text-[#171717]">src/data/music.json</code>.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#EAEAEA] bg-white">
                <span className="font-bold text-[#ED1025] block mb-1">05. Add Artwork</span>
                <p className="text-[#6B7280]">
                  Place artwork in <code className="text-[#171717]">public/covers/</code> or provide a direct image URL.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#EAEAEA] bg-white">
                <span className="font-bold text-[#ED1025] block mb-1">06. Add to Album / Playlist</span>
                <p className="text-[#6B7280]">
                  Include the track id in the corresponding album or playlist <code className="text-[#171717]">trackIds</code> array.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#EAEAEA] bg-white">
                <span className="font-bold text-[#ED1025] block mb-1">07. Set Published</span>
                <p className="text-[#6B7280]">
                  Ensure <code className="text-[#171717]">"published": true</code> so it appears across all sections.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#EAEAEA] bg-white">
                <span className="font-bold text-[#ED1025] block mb-1">08. Deploy to Vercel</span>
                <p className="text-[#6B7280]">
                  Run <code className="text-[#171717]">git push</code>. Vercel automatically redeploys your updated catalog!
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Technical Note on Dropbox Streaming */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <span>Why Dropbox Links Require Formatting</span>
            </p>
            <p className="text-blue-800 leading-relaxed">
              Standard Dropbox shared links return an interactive web preview page rather than the raw MP3 audio stream. The Habajaba Studio player automatically converts Dropbox URLs using the direct content server (<code className="font-mono">dl.dropboxusercontent.com</code>) with <code className="font-mono">raw=1</code>.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#EAEAEA] bg-neutral-50/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#171717] text-white hover:bg-neutral-800 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
