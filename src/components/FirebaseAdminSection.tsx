import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Key,
  Copy,
  ExternalLink,
  Zap,
} from 'lucide-react';
import {
  getActiveFirebaseConfig,
  saveFirebaseConfig,
  testFirebaseConnection,
  getEffectiveConfigSource,
  FirebaseConfigParams,
} from '../services/firebaseConfig';
import { MusicService } from '../services/musicService';

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

      if (extractedApiKey || extractedProjectId) {
        setConfig((prev) => ({
          ...prev,
          apiKey: extractedApiKey || prev.apiKey,
          authDomain: extractedAuthDomain || prev.authDomain,
          projectId: extractedProjectId || prev.projectId,
          storageBucket: extractedStorageBucket || prev.storageBucket,
          messagingSenderId: extractedMessagingSenderId || prev.messagingSenderId,
          appId: extractedAppId || prev.appId,
        }));
        setStatusMessage({
          type: 'info',
          text: 'Firebase কনফিগ কোড থেকে কী-সমূহ শনাক্ত ও পূরণ করা হয়েছে। এবার "সেভ ও কানেক্ট" এ ক্লিক করুন।',
        });
      }
    } catch {
      // ignore parse errors
    }
  };

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.apiKey || !config.projectId) {
      alert('অনুগ্রহ করে অন্তত apiKey এবং projectId পূরণ করুন।');
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    try {
      // 1. Save config to local storage
      saveFirebaseConfig(config);

      // 2. Test live connection to Firestore
      const testResult = await testFirebaseConnection(config);

      if (testResult.success) {
        // 3. Reconnect MusicService with new credentials
        MusicService.reconnectFirebase();
        setStatusMessage({
          type: 'success',
          text: 'ফায়ারবেস ক্লাউড ডেটাবেস সফলভাবে সংযুক্ত হয়েছে! গান ও ব্যানার এখন লাইভ সিঙ্ক হচ্ছে।',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `কানেকশন ব্যর্থ হয়েছে: ${testResult.message}`,
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
        text: `অসাধারণ! মোট ${result.count} টি গান ও ব্যানার রিয়েল-টাইমে ফায়ারবেস ক্লাউডে সিঙ্ক করা হয়েছে।`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: `সিঙ্ক ব্যর্থ হয়েছে: ${result.error}`,
      });
    }
  };

  const handleCopyConfigJson = () => {
    const json = JSON.stringify(config, null, 2);
    navigator.clipboard?.writeText(json);
    setConfigCopied(true);
    setTimeout(() => setConfigCopied(false), 2000);
  };

  const configSource = getEffectiveConfigSource();

  return (
    <div className="space-y-6 text-white">
      {/* 1. Connection Status Banner */}
      <div
        className={`p-5 rounded-2xl border backdrop-blur-xl transition-all ${
          isConnected
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
            : 'bg-amber-950/80 border-amber-500/40 text-amber-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isConnected ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40' : 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
              }`}
            >
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  {isConnected
                    ? '🟢 ফায়ারবেস ক্লাউড লাইভ সংযুক্ত (Firebase Live Active)'
                    : '🟡 লোকাল মোড (Local Offline Mode)'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    isConnected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'
                  }`}
                >
                  {isConnected ? 'Real-Time Sync' : 'Standby'}
                </span>
                {configSource === 'bundled' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    কোডবেস ডিফল্ট (সবার জন্য লাইভ)
                  </span>
                )}
                {configSource === 'env' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Environment Variables (সবার জন্য লাইভ)
                  </span>
                )}
                {configSource === 'localStorage' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    এই ব্রাউজারে সংরক্ষিত
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-300 mt-0.5 font-bengali">
                {isConnected
                  ? `প্রজেক্ট: ${config.projectId || 'Active'} · যেকোনো ডিভাইস থেকে গান বা ব্যানার যোগ করলে স্বয়ংক্রিয়ভাবে লাইভ আপডেট হবে।`
                  : 'বর্তমানে সমস্ত পরিবর্তন আপনার ব্রাউজারে সংরক্ষিত হচ্ছে। নিচে ফায়ারবেস ক্রেডেনশিয়াল দিলে এটি সবার জন্য লাইভ সিঙ্ক হবে।'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {config.projectId && (
              <button
                onClick={handleCopyConfigJson}
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy configuration JSON"
              >
                <Copy className="w-3.5 h-3.5 text-[#ED1025]" />
                <span>{configCopied ? 'কপি হয়েছে!' : 'কনফিগ কপি করুন'}</span>
              </button>
            )}

            {isConnected && (
              <button
                onClick={handleSyncLocalToCloud}
                disabled={isSyncing}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>সব গান ক্লাউডে আপলোড করুন</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2.5 animate-in fade-in ${
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

      {/* 2. Step-by-Step Bengali Instructions */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#ED1025]" />
            <h3 className="font-extrabold text-white text-sm sm:text-base font-bengali">
              ফায়ারবেস (Firebase) থেকে কী কী লাগবে এবং কীভাবে পাবেন?
            </h3>
          </div>
          <a
            href="https://console.firebase.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#ED1025] hover:underline font-bold flex items-center gap-1"
          >
            <span>Firebase Console খুলুন</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-bengali">
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
            <span className="w-6 h-6 rounded-full bg-[#ED1025] text-white font-bold flex items-center justify-center text-xs">
              ১
            </span>
            <h4 className="font-bold text-white text-sm pt-1">প্রজেক্ট তৈরি ও Web App</h4>
            <p className="text-neutral-400 leading-relaxed">
              Firebase Console-এ গিয়ে একটি নতুন প্রজেক্ট তৈরি করুন। এরপর প্রজেক্ট ড্যাশবোর্ডে <strong>Web App (`&lt;/&gt;`)</strong> আইকনে ক্লিক করে যেকোনো একটি নাম দিয়ে Register App করুন।
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
            <span className="w-6 h-6 rounded-full bg-[#ED1025] text-white font-bold flex items-center justify-center text-xs">
              ২
            </span>
            <h4 className="font-bold text-white text-sm pt-1">Firebase SDK কোড কপি</h4>
            <p className="text-neutral-400 leading-relaxed">
              স্ক্রিনে <code>firebaseConfig</code> এর কোড দেখতে পাবেন যেখানে <strong>apiKey, authDomain, projectId, storageBucket, appId</strong> থাকবে। পুরো কোডটি কপি করে নিচের বক্সে পেস্ট করুন।
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
            <span className="w-6 h-6 rounded-full bg-[#ED1025] text-white font-bold flex items-center justify-center text-xs">
              ৩
            </span>
            <h4 className="font-bold text-white text-sm pt-1">Firestore Database চালু</h4>
            <p className="text-neutral-400 leading-relaxed">
              Firebase এর বামদিকের মেনু থেকে <strong>Firestore Database</strong> &gt; <strong>Create database</strong> এ ক্লিক করে <strong>Start in Test mode</strong> বেছে নিন যাতে সবার গান দেখার অধিকার থাকে।
            </p>
          </div>
        </div>
      </div>

      {/* 3. Quick Snippet Paste Area */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#ED1025]" />
          <h4 className="font-bold text-white text-sm font-bengali">
            সহজ পদ্ধতি: সম্পূর্ণ Firebase Config কোডটি এখানে পেস্ট করুন (Auto-Fill)
          </h4>
        </div>
        <textarea
          value={rawSnippet}
          onChange={(e) => handleParseSnippet(e.target.value)}
          placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "habajaba-studio.firebaseapp.com",\n  projectId: "habajaba-studio",\n  storageBucket: "habajaba-studio.appspot.com",\n  messagingSenderId: "123456789",\n  appId: "1:123456789:web:abcdef"\n};`}
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 font-mono text-xs focus:border-[#ED1025] focus:outline-hidden bg-black/60 text-white placeholder-neutral-500"
        />
        <p className="text-[11px] text-neutral-400 font-bengali">
          টিপস: উপরের বক্সে কোড পেস্ট করলেই নিচের ফিল্ডগুলো স্বয়ংক্রিয়ভাবে পূরণ হয়ে যাবে।
        </p>
      </div>

      {/* 4. Credentials Form */}
      <form onSubmit={handleSaveAndConnect} className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl space-y-4">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <Key className="w-4 h-4 text-[#ED1025]" />
          <span>প্রয়োজনীয় ফায়ারবেস কী-সমূহ (Firebase Credentials)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-200 mb-1">
              apiKey <span className="text-[#ED1025]">*</span>
            </label>
            <input
              type="text"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-200 mb-1">
              projectId <span className="text-[#ED1025]">*</span>
            </label>
            <input
              type="text"
              value={config.projectId}
              onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
              placeholder="habajaba-studio-live"
              className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-200 mb-1">authDomain</label>
            <input
              type="text"
              value={config.authDomain}
              onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
              placeholder="your-project.firebaseapp.com"
              className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-200 mb-1">storageBucket</label>
            <input
              type="text"
              value={config.storageBucket}
              onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
              placeholder="your-project.appspot.com"
              className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-200 mb-1">messagingSenderId</label>
            <input
              type="text"
              value={config.messagingSenderId}
              onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
              placeholder="123456789012"
              className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-200 mb-1">appId</label>
            <input
              type="text"
              value={config.appId}
              onChange={(e) => setConfig({ ...config, appId: e.target.value })}
              placeholder="1:123456789012:web:abcdef..."
              className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs font-mono focus:border-[#ED1025] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-neutral-400 font-bengali">
            * এটি সেভ করলে ডেটা সুরক্ষিত থাকবে এবং স্বয়ংক্রিয়ভাবে ক্লাউড সিঙ্ক চালু হবে।
          </p>

          <button
            type="submit"
            disabled={isTesting}
            className="px-6 py-2.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#ED1025]/30 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isTesting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>সেভ ও ফায়ারবেসে কানেক্ট করুন (Save &amp; Connect)</span>
          </button>
        </div>
      </form>
    </div>
  );
};
