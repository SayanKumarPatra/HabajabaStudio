import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Key,
  Globe,
  Radio,
  Copy,
  ExternalLink,
  ShieldCheck,
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
          type: 'success',
          text: 'Firebase কনফিগ কোড থেকে সমস্ত ফিল্ড সফলভাবে নিষ্কাশন করা হয়েছে!',
        });
      }
    } catch (e) {
      console.warn('Snippet parsing error:', e);
    }
  };

  const handleSaveAndConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!config.apiKey.trim() || !config.projectId.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'অনুগ্রহ করে কমপক্ষে apiKey এবং projectId প্রদান করুন।',
      });
      return;
    }

    setIsTesting(true);
    setStatusMessage({ type: 'info', text: 'Firebase কানেকশন পরীক্ষা করা হচ্ছে...' });

    const result = await testFirebaseConnection(config);
    setIsTesting(false);

    if (result.success) {
      saveFirebaseConfig(config);
      MusicService.reconnectFirebase();
      setStatusMessage({
        type: 'success',
        text: `সফলভাবে ফায়ারবেসের সাথে সংযুক্ত হয়েছে! প্রজেক্ট: ${config.projectId} (Real-time Live Sync চালু)`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: `কানেকশন ব্যর্থ হয়েছে: ${result.message}`,
      });
    }
  };

  const handleDisconnect = () => {
    if (confirm('আপনি কি নিশ্চিত যে Firebase ডিসকানেক্ট করে লোকাল স্টোরেজ মোডে ফিরতে চান?')) {
      saveFirebaseConfig(null);
      MusicService.reconnectFirebase();
      setConfig({
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
      });
      setStatusMessage({
        type: 'info',
        text: 'Firebase সংযোগ বিচ্ছিন্ন করা হয়েছে। এখন লোকাল স্টোরেজ ব্যবহৃত হচ্ছে।',
      });
    }
  };

  const handleSyncLocalToCloud = async () => {
    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: 'লোকাল ডেটাবেসের গান ও ব্যানার ফায়ারবেসে আপলোড করা হচ্ছে...' });

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
    <div className="space-y-6">
      {/* 1. Connection Status Banner */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isConnected
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/80 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isConnected ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-base tracking-tight">
                  {isConnected
                    ? '🟢 ফায়ারবেস ক্লাউড লাইভ সংযুক্ত (Firebase Live Active)'
                    : '🟡 লোকাল মোড (Local Offline Mode)'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    isConnected ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                  }`}
                >
                  {isConnected ? 'Real-Time Sync' : 'Standby'}
                </span>
                {configSource === 'bundled' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    কোডবেস ডিফল্ট (সবার জন্য লাইভ)
                  </span>
                )}
                {configSource === 'env' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                    Environment Variables (সবার জন্য লাইভ)
                  </span>
                )}
                {configSource === 'localStorage' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                    এই ব্রাউজারে সংরক্ষিত
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-600 mt-0.5 font-bengali">
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
                className="px-3 py-2 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>সব গান ক্লাউডে আপলোড করুন</span>
              </button>
            )}

            {isConnected && (
              <button
                onClick={handleDisconnect}
                className="px-3 py-2 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status feedback alerts */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-red-100 text-red-900 border border-red-200'
              : 'bg-blue-100 text-blue-900 border border-blue-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. Step-by-Step Bengali Instructions: What is needed from Firebase */}
      <div className="bg-white rounded-2xl border border-[#EAEAEA] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#ED1025]" />
            <h3 className="font-extrabold text-[#171717] text-sm sm:text-base font-bengali">
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
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
            <span className="w-6 h-6 rounded-full bg-[#ED1025] text-white font-bold flex items-center justify-center text-xs">
              ১
            </span>
            <h4 className="font-bold text-[#171717] text-sm pt-1">প্রজেক্ট তৈরি ও Web App</h4>
            <p className="text-neutral-600 leading-relaxed">
              Firebase Console-এ গিয়ে একটি নতুন প্রজেক্ট তৈরি করুন। এরপর প্রজেক্ট ড্যাশবোর্ডে <strong>Web App (`&lt;/&gt;`)</strong> আইকনে ক্লিক করে যেকোনো একটি নাম দিয়ে Register App করুন।
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
            <span className="w-6 h-6 rounded-full bg-[#ED1025] text-white font-bold flex items-center justify-center text-xs">
              ২
            </span>
            <h4 className="font-bold text-[#171717] text-sm pt-1">Firebase SDK কোড কপি</h4>
            <p className="text-neutral-600 leading-relaxed">
              স্ক্রিনে <code>firebaseConfig</code> এর কোড দেখতে পাবেন যেখানে <strong>apiKey, authDomain, projectId, storageBucket, appId</strong> থাকবে। পুরো কোডটি কপি করে নিচের বক্সে পেস্ট করুন।
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
            <span className="w-6 h-6 rounded-full bg-[#ED1025] text-white font-bold flex items-center justify-center text-xs">
              ৩
            </span>
            <h4 className="font-bold text-[#171717] text-sm pt-1">Firestore Database চালু</h4>
            <p className="text-neutral-600 leading-relaxed">
              Firebase এর বামদিকের মেনু থেকে <strong>Firestore Database</strong> &gt; <strong>Create database</strong> এ ক্লিক করে <strong>Start in Test mode</strong> বেছে নিন যাতে সবার গান দেখার অধিকার থাকে।
            </p>
          </div>
        </div>
      </div>

      {/* 3. Quick Snippet Paste Area */}
      <div className="bg-white rounded-2xl border border-[#EAEAEA] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#ED1025]" />
          <h4 className="font-bold text-[#171717] text-sm font-bengali">
            সহজ পদ্ধতি: সম্পূর্ণ Firebase Config কোডটি এখানে পেস্ট করুন (Auto-Fill)
          </h4>
        </div>
        <textarea
          value={rawSnippet}
          onChange={(e) => handleParseSnippet(e.target.value)}
          placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "habajaba-studio.firebaseapp.com",\n  projectId: "habajaba-studio",\n  storageBucket: "habajaba-studio.appspot.com",\n  messagingSenderId: "123456789",\n  appId: "1:123456789:web:abcdef"\n};`}
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-mono text-xs focus:ring-2 focus:ring-[#ED1025] focus:outline-hidden bg-neutral-50"
        />
        <p className="text-[11px] text-neutral-500 font-bengali">
          টিপস: উপরের বক্সে কোড পেস্ট করলেই নিচের ফিল্ডগুলো স্বয়ংক্রিয়ভাবে পূরণ হয়ে যাবে।
        </p>
      </div>

      {/* 4. Credentials Form */}
      <form onSubmit={handleSaveAndConnect} className="bg-white rounded-2xl border border-[#EAEAEA] p-5 shadow-xs space-y-4">
        <h4 className="font-bold text-[#171717] text-sm flex items-center gap-2">
          <Key className="w-4 h-4 text-[#ED1025]" />
          <span>প্রয়োজনীয় ফায়ারবেস কী-সমূহ (Firebase Credentials)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">
              apiKey <span className="text-[#ED1025]">*</span>
            </label>
            <input
              type="text"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono focus:ring-2 focus:ring-[#ED1025] focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">
              projectId <span className="text-[#ED1025]">*</span>
            </label>
            <input
              type="text"
              value={config.projectId}
              onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
              placeholder="habajaba-studio-live"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono focus:ring-2 focus:ring-[#ED1025] focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">authDomain</label>
            <input
              type="text"
              value={config.authDomain}
              onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
              placeholder="your-project.firebaseapp.com"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono focus:ring-2 focus:ring-[#ED1025] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">storageBucket</label>
            <input
              type="text"
              value={config.storageBucket}
              onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
              placeholder="your-project.appspot.com"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono focus:ring-2 focus:ring-[#ED1025] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">messagingSenderId</label>
            <input
              type="text"
              value={config.messagingSenderId}
              onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
              placeholder="123456789012"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono focus:ring-2 focus:ring-[#ED1025] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">appId</label>
            <input
              type="text"
              value={config.appId}
              onChange={(e) => setConfig({ ...config, appId: e.target.value })}
              placeholder="1:123456789012:web:abcdef..."
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono focus:ring-2 focus:ring-[#ED1025] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-neutral-500 font-bengali">
            * এটি সেভ করলে ডেটা ব্রাউজারে সুরক্ষিত থাকবে এবং স্বয়ংক্রিয়ভাবে ক্লাউড সিঙ্ক চালু হবে।
          </p>

          <button
            type="submit"
            disabled={isTesting}
            className="px-6 py-2.5 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
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
