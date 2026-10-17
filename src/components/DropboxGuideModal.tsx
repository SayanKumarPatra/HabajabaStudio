import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Play,
  Loader2,
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Dropbox Music Guide and URL Validator"
    >
      <div className="bg-[#10121A]/95 backdrop-blur-2xl rounded-2xl max-w-xl w-full shadow-2xl border border-white/15 overflow-hidden my-4 text-white">
        {/* Modal Header - Compact & Tight */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#ED1025]/20 flex items-center justify-center text-[#ED1025]">
              <Music className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Dropbox Audio &amp; Music Guide
              </h3>
              <p className="text-[10px] text-neutral-400">
                Habajaba Studio Centralized Audio Stream Validator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Tight Spacing & Glass Style */}
        <div className="p-3.5 sm:p-4 space-y-3 max-h-[75vh] overflow-y-auto text-xs">
          {/* Section 1: Live Interactive Dropbox URL Tester */}
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#ED1025] flex items-center gap-1.5">
              <span>Test &amp; Convert Dropbox Audio URL</span>
            </h4>

            <p className="text-[11px] text-neutral-300 leading-snug">
              Paste your Dropbox share link (e.g.{' '}
              <code className="text-white bg-black/40 px-1 py-0.5 rounded border border-white/10 font-mono text-[10px]">
                https://www.dropbox.com/s/.../song.mp3?dl=0
              </code>
              ). We will convert and test HTML5 direct streamability.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
              <input
                type="url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="Paste Dropbox audio link..."
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-white/15 focus:border-[#ED1025] focus:outline-hidden bg-black/50 text-white placeholder-neutral-500"
              />
              <button
                onClick={handleTest}
                disabled={isTesting || !testUrl.trim()}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#ED1025] hover:bg-[#D90D20] text-white flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Validate Stream</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Results */}
            {testResult && (
              <div
                className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-xs">{testResult.message}</p>
                    {testResult.duration && (
                      <p className="text-[10px] opacity-80 mt-0.5">
                        Duration: {Math.floor(testResult.duration / 60)}m{' '}
                        {Math.floor(testResult.duration % 60)}s
                      </p>
                    )}
                  </div>
                </div>

                {testResult.convertedUrl && (
                  <div className="pt-1.5 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] truncate max-w-[70%] text-neutral-300 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                      {testResult.convertedUrl}
                    </span>
                    <button
                      onClick={handleCopyConverted}
                      className="px-2 py-1 text-[10px] font-semibold bg-white/10 hover:bg-white/20 border border-white/15 rounded flex items-center gap-1 shrink-0 text-white cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Step-by-Step Music Publishing - Compact Grid */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
              Quick Publishing Steps
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
              <div className="p-2 rounded-lg border border-white/10 bg-white/[0.03]">
                <span className="font-bold text-[#ED1025] block mb-0.5">01. Upload to Dropbox</span>
                <p className="text-neutral-400">Upload your authorized audio file (MP3/WAV).</p>
              </div>

              <div className="p-2 rounded-lg border border-white/10 bg-white/[0.03]">
                <span className="font-bold text-[#ED1025] block mb-0.5">02. Shareable Link</span>
                <p className="text-neutral-400">Right click &rarr; Share &rarr; Anyone with link can view.</p>
              </div>

              <div className="p-2 rounded-lg border border-white/10 bg-white/[0.03]">
                <span className="font-bold text-[#ED1025] block mb-0.5">03. Convert Link</span>
                <p className="text-neutral-400">Replace <code className="text-[#ED1025]">dl=0</code> with <code className="text-[#ED1025]">raw=1</code> or test above.</p>
              </div>

              <div className="p-2 rounded-lg border border-white/10 bg-white/[0.03]">
                <span className="font-bold text-[#ED1025] block mb-0.5">04. Update Catalog</span>
                <p className="text-neutral-400">Use Admin Songs tab to add song details &amp; audio link.</p>
              </div>
            </div>
          </div>

          {/* Technical Note */}
          <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/20 text-[11px] text-blue-200">
            <p className="leading-snug">
              <span className="font-bold text-white">Direct Stream Info:</span> Habajaba Studio player automatically rewrites Dropbox URLs using <code className="text-white font-mono">dl.dropboxusercontent.com</code> with <code className="text-white font-mono">raw=1</code> for seamless background playback.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
