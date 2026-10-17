import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Key,
  Zap,
} from 'lucide-react';
import {
  getActiveFirebaseConfig,
  saveFirebaseConfig,
  testFirebaseConnection,
  FirebaseConfigParams,
} from '../services/firebaseConfig';
import { MusicService } from '../services/musicService';
import { feedbackService } from '../services/feedbackService';

export const FirebaseAdminSection: React.FC = () => {
  const [configCopied, setConfigCopied] = useState(false);
  const [config, setConfig] = useState<FirebaseConfigParams>(() => {
    const active = getActiveFirebaseConfig();
    return (
      active || {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
      }
    );
  });

  const [rawSnippet, setRawSnippet] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const isConnected = MusicService.isFirebaseLive();

  // Smart Parser for pasting Firebase console snippet
  const handleParseSnippet = (snippet: string) => {
    setRawSnippet(snippet);
    if (!snippet.trim()) return;

    try {
      const extract = (key: string) => {
        const regex = new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i');
        const match = snippet.match(regex);
        return match ? match[1].trim() : '';
      };

      const extractedApiKey = extract('apiKey');
      const extractedAuthDomain = extract('authDomain');
      const extractedProjectId = extract('projectId');
      const extractedStorageBucket = extract('storageBucket');
      const extractedMessagingSenderId = extract('messagingSenderId');
      const extractedAppId = extract('appId');
      const extractedDatabaseURL = extract('databaseURL');

      if (extractedApiKey || extractedProjectId) {
        setConfig((prev) => ({
          ...prev,
          apiKey: extractedApiKey || prev.apiKey,
          authDomain: extractedAuthDomain || prev.authDomain,
          projectId: extractedProjectId || prev.projectId,
          storageBucket: extractedStorageBucket || prev.storageBucket,
          messagingSenderId: extractedMessagingSenderId || prev.messagingSenderId,
          appId: extractedAppId || prev.appId,
          databaseURL: extractedDatabaseURL || prev.databaseURL,
        }));
        setStatusMessage({
          type: 'info',
          text: 'Firebase কনফিগ শনাক্ত হয়েছে। "সেভ ও কানেক্ট করুন" বাটনে চাপুন।',
        });
      }
    } catch {}
  };

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.apiKey || !config.projectId) {
      alert('অনুগ্রহ করে apiKey এবং projectId দিন।');
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    try {
      saveFirebaseConfig(config);
      const testResult = await testFirebaseConnection(config);

      if (testResult.success) {
        MusicService.reconnectFirebase();
        feedbackService.initFirebaseSync();
        setStatusMessage({
          type: 'success',
          text: 'Firebase সার্ভার সফলভাবে সংযুক্ত ও লাইভ হয়েছে!',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `সংযোগ ত্রুটি: ${testResult.message}`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `ত্রুটি: ${err.message || 'অজানা সমস্যা'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncLocalToCloud = async () => {
    setIsSyncing(true);
    const result = await MusicService.syncAllLocalToFirestore();
    setIsSyncing(false);
    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: `মোট ${result.count} টি গান ও ব্যানার রিয়েল-টাইমে লাইভ সার্ভারে সিঙ্ক করা হয়েছে।`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: `সিঙ্ক ত্রুটি: ${result.error}`,
      });
    }
  };

  const handleCopyConfigJson = () => {
    const json = JSON.stringify(config, null, 2);
    navigator.clipboard?.writeText(json);
    setConfigCopied(true);
    setTimeout(() => setConfigCopied(false), 2000);
  };

  return (
    <div className="space-y-4 text-white">
      {/* 1. Connection Status Banner */}
      <div
        className={`p-4 rounded-2xl border backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isConnected
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
            : 'bg-amber-950/80 border-amber-500/40 text-amber-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isConnected
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                : 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
            }`}
          >
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">
                {isConnected ? '🟢 Firebase Live Server সক্রিয়' : '🟡 লোকাল মোড (অফলাইন)'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white">
                {config.projectId || 'habajaba-studio'}
              </span>
            </div>
            <p className="text-xs text-neutral-300 font-bengali mt-0.5">
              {isConnected
                ? 'গান, ব্যানার ও শ্রোতাদের মন্তব্য সরাসরি লাইভ সার্ভারের সাথে সংযুক্ত।'
                : 'লাইভ সংযোগ করতে নিচে কনফিগ সেভ করুন।'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {config.projectId && (
            <button
              onClick={handleCopyConfigJson}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#ED1025]" />
              <span>{configCopied ? 'কপি হয়েছে' : 'কপি কনফিগ'}</span>
            </button>
          )}

          {isConnected && (
            <button
              onClick={handleSyncLocalToCloud}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>লাইভ সিঙ্ক করুন</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : statusMessage.type === 'info'
              ? 'bg-blue-950/80 border-blue-500/40 text-blue-200'
              : 'bg-red-950/80 border-red-500/40 text-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. Fast Snippet Paste Box */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl space-y-2">
        <label className="text-xs font-bold text-white flex items-center gap-1.5 font-bengali">
          <Zap className="w-3.5 h-3.5 text-[#ED1025]" />
          <span>Firebase Console কোড সরাসরি এখানে পেস্ট করুন (Auto-Fill):</span>
        </label>
        <textarea
          value={rawSnippet}
          onChange={(e) => handleParseSnippet(e.target.value)}
          placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "habajaba-studio-19379"\n};`}
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-white/15 font-mono text-xs focus:border-[#ED1025] focus:outline-hidden bg-black/60 text-white"
        />
      </div>

      {/* 3. Clean Credentials Form */}
      <form onSubmit={handleSaveAndConnect} className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Key className="w-4 h-4 text-[#ED1025]" />
          <h4 className="font-bold text-white text-xs sm:text-sm">
            ফায়ারবেস ক্রেডেনশিয়াল (Firebase Credentials)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1">
              apiKey *
            </label>
            <input
              type="text"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full px-3 py-1.5 rounded-lg border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1">
              projectId *
            </label>
            <input
              type="text"
              value={config.projectId}
              onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
              placeholder="habajaba-studio-19379"
              className="w-full px-3 py-1.5 rounded-lg border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1">authDomain</label>
            <input
              type="text"
              value={config.authDomain}
              onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
              placeholder="your-project.firebaseapp.com"
              className="w-full px-3 py-1.5 rounded-lg border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1">storageBucket</label>
            <input
              type="text"
              value={config.storageBucket}
              onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
              placeholder="your-project.firebasestorage.app"
              className="w-full px-3 py-1.5 rounded-lg border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isTesting}
            className="px-5 py-2 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#ED1025]/30 disabled:opacity-50 cursor-pointer transition-colors active:scale-95"
          >
            {isTesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>সেভ ও কানেক্ট করুন</span>
          </button>
        </div>
      </form>
    </div>
  );
};
