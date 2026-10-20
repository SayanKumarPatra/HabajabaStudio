import React, { useState, useEffect } from 'react';
import { Activity, Eye, Users, Radio, Save, RotateCcw, Youtube, ExternalLink, Check } from 'lucide-react';
import { VisitorService, VisitorStats } from '../services/visitorService';

export const VisitorsAdminSection: React.FC = () => {
  const [stats, setStats] = useState<VisitorStats>(() => VisitorService.getStats());
  const [customTotalInput, setCustomTotalInput] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const unsub = VisitorService.subscribe((newStats) => {
      setStats(newStats);
      if (!customTotalInput) {
        setCustomTotalInput(String(newStats.totalVisits));
      }
    });
    return unsub;
  }, []);

  const handleUpdateTotal = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customTotalInput, 10);
    if (isNaN(parsed) || parsed < 0) {
      alert('অনুগ্রহ করে সঠিক সংখ্যা লিখুন!');
      return;
    }

    setIsUpdating(true);
    try {
      await VisitorService.setTotalVisits(parsed);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update visitor count:', err);
      alert('কাউন্টার আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ED1025]/20 text-[#ED1025] flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>ওয়েবসাইট লাইভ ভিজিটর ও ইউটিউব মেট্রিক্স</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                রিয়েল-টাইম লাইভ
              </span>
            </h2>
            <p className="text-xs text-neutral-400 font-bengali">
              ওয়েবসাইটের ভিজিটর ট্র্যাকিং এবং ইউটিউব চ্যানেলের লাইভ সাবস্ক্রাইবার পর্যবেক্ষণ ও পরিচালনা।
            </p>
          </div>
        </div>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Online Listeners */}
        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-bengali">
            <span>বর্তমানে অনলাইন</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tabular-nums">
            {stats.activeOnline} জন
          </div>
          <p className="text-[11px] text-neutral-400 font-bengali">
            এই মুহূর্তে ওয়েবসাইটে সক্রিয় শ্রোতা
          </p>
        </div>

        {/* Today's Visits */}
        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-bengali">
            <span>আজকের ভিজিট</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tabular-nums">
            {formatNumber(stats.todayVisits)}
          </div>
          <p className="text-[11px] text-neutral-400 font-bengali">
            আজ সর্বমোট পেজভিউ ও সেশন
          </p>
        </div>

        {/* Total Lifetime Visits */}
        <div className="p-4 rounded-2xl bg-black/50 border border-[#ED1025]/40 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-bengali">
            <span>মোট ওয়েবসাইট ভিজিটর</span>
            <Eye className="w-4 h-4 text-[#ED1025]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#ED1025] font-mono tabular-nums">
            {formatNumber(stats.totalVisits)}
          </div>
          <p className="text-[11px] text-neutral-400 font-bengali">
            শুরু থেকে আজ পর্যন্ত সর্বমোট ভিজিট
          </p>
        </div>

        {/* Live Sync Status */}
        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-bengali">
            <span>ক্লাউড সিঙ্ক স্ট্যাটাস</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Active</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-bengali">
            Firebase Realtime DB / LocalStorage
          </p>
        </div>
      </div>

      {/* Two Column Section: Counter Adjuster + YouTube Live Widget Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Adjust / Seed Counter Form */}
        <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Eye className="w-4 h-4 text-[#ED1025]" />
            <h3 className="text-sm font-bold text-white font-bengali">
              ভিজিটর কাউন্টার সংখ্যা এডিট / সিড (Seed) করুন
            </h3>
          </div>

          <p className="text-xs text-neutral-300 font-bengali leading-relaxed">
            যদি আপনি পূর্ববর্তী ওয়েবসাইট থেকে ভিজিটর কাউন্ট যোগ করতে চান বা কোনো নির্দিষ্ট সংখ্যা দিয়ে শুরু করতে চান, তাহলে নিচে মোট সংখ্যাটি লিখে সেভ করুন। এরপর থেকে প্রতি ভিজিটে এটি স্বয়ংক্রিয়ভাবে লাইভ বাড়বে।
          </p>

          <form onSubmit={handleUpdateTotal} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1 font-bengali">
                সর্বমোট ভিজিটর কাউন্টার (Current: {formatNumber(stats.totalVisits)})
              </label>
              <input
                type="number"
                min="0"
                value={customTotalInput}
                onChange={(e) => setCustomTotalInput(e.target.value)}
                placeholder="যেমন: 5000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/60 text-white font-mono text-sm focus:border-[#ED1025] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'সংরক্ষণ হচ্ছে...' : 'কাউন্টার আপডেট করুন'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomTotalInput(String(stats.totalVisits))}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>রিসেট</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ভিজিটর কাউন্টার সফলভাবে আপডেট হয়েছে!</span>
              </div>
            )}
          </form>
        </div>

        {/* Right: YouTube Live Subscriber Widget Preview */}
        <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-white font-bengali">
                ইউটিউব লাইভ সাবস্ক্রাইবার উইজেট প্রিভিউ
              </h3>
            </div>
            <a
              href="https://www.youtube.com/@HabajabaStudioLive"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <span>চ্যানেলে যান</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-neutral-300 font-bengali">
            হোমপেজে প্রদর্শিত অফিশিয়াল ইউটিউব সাবস্ক্রাইবার কাউন্টার উইজেট:
          </p>

          <div className="w-full flex items-center justify-center p-3 rounded-xl bg-black/60 border border-white/10">
            <iframe
              height="80px"
              width="300px"
              frameBorder="0"
              src="https://livecounts.io/embed/youtube-live-subscriber-counter/UCduw6YMUc_SHf1sQV6SW_nw"
              style={{ border: 0, width: '300px', height: '80px', maxWidth: '100%' }}
              title="Habajaba Studio Live YouTube Subscribers Counter Preview"
              loading="lazy"
            />
          </div>

          <div className="text-[11px] text-neutral-400 font-mono bg-black/40 p-2.5 rounded-lg border border-white/5 break-all">
            Channel ID: UCduw6YMUc_SHf1sQV6SW_nw (@HabajabaStudioLive)
          </div>
        </div>
      </div>
    </div>
  );
};
