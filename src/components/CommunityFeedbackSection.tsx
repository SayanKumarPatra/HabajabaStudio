import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Heart, Star, Sparkles, CheckCircle2, User } from 'lucide-react';
import { feedbackService, ListenerComment } from '../services/feedbackService';

export const CommunityFeedbackSection: React.FC = () => {
  const [comments, setComments] = useState<ListenerComment[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsub = feedbackService.subscribe((list) => {
      setComments(list);
    });
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await feedbackService.addComment(authorName, message, rating);
      setMessage('');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    feedbackService.likeComment(id);
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'এইমাত্র';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} মিনিট আগে`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ঘণ্টা আগে`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays} দিন আগে`;
  };

  return (
    <section className="w-full rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-xl border border-red-500/15 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header Prompt */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-neutral-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ED1025]"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#ED1025] font-mono">
              শ্রোতাদের লাইভ মন্তব্য
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-[#171717] font-bengali leading-snug">
            আমাদের ওয়েব অ্যাপ্লিকেশন আপনাদের কেমন লেগেছে? আপনার মূল্যবান মন্তব্য জানান
          </h3>
          <p className="text-xs text-[#6B7280] font-bengali">
            এখানে আপনার মন্তব্য লিখলে তা সাথে সাথেই সরাসরি লাইভ হয়ে যাবে এবং সবাই দেখতে পাবে।
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#ED1025] text-xs font-bold shrink-0 self-start sm:self-center">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{comments.length} টি মন্তব্য</span>
        </div>
      </div>

      {/* Comment Input Form Box */}
      <form onSubmit={handleSubmit} className="space-y-3 bg-neutral-50/70 p-3 sm:p-4 rounded-2xl border border-neutral-200/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-[#4B5563] block mb-1 font-bengali">
              আপনার নাম (Name):
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="যেমন: অনিক রায় / সঙ্গীতপ্রেমী"
                maxLength={40}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-neutral-200 bg-white focus:border-[#ED1025] focus:outline-hidden font-bengali"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#4B5563] block mb-1 font-bengali">
              অ্যাপ রেটিং দিন (Rating):
            </label>
            <div className="flex items-center gap-1 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  title={`${star} Star`}
                >
                  <Star
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-mono font-bold text-amber-600 ml-1.5">
                {rating}.0
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#4B5563] block mb-1 font-bengali">
            আপনার অনুভূতি বা পরামর্শ (Comment):
          </label>
          <textarea
            required
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="ওয়েবসাইটের গান, প্লেয়ার ও ডিজাইন সম্পর্কে আপনার মতামত লিখুন..."
            maxLength={400}
            className="w-full text-xs p-3 rounded-xl border border-neutral-200 bg-white focus:border-[#ED1025] focus:outline-hidden font-bengali resize-none"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[10px] text-[#9CA3AF] font-bengali">
            ⚡ সেন্ড করার সাথে সাথেই রিয়েল-টাইমে লাইভ হবে
          </span>

          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="px-4 py-2 rounded-xl bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'পোস্ট হচ্ছে...' : 'সেন্ড করুন (Post Live)'}</span>
          </button>
        </div>

        {showSuccessToast && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bengali">আপনার মন্তব্য সফলভাবে লাইভ প্রকাশিত হয়েছে! ধন্যবাদ।</span>
          </div>
        )}
      </form>

      {/* Real-time Comments Live Feed */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <span className="font-bold text-[#171717] font-bengali">সাম্প্রতিক মন্তব্যসমূহ (Recent Live Feed):</span>
          {comments.length > 3 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[#ED1025] hover:underline font-semibold font-bengali cursor-pointer"
            >
              {isExpanded ? 'সংক্ষিপ্ত করুন' : `সবগুলো দেখুন (${comments.length})`}
            </button>
          )}
        </div>

        <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto pr-1 space-y-2">
          {(isExpanded ? comments : comments.slice(0, 3)).map((item) => (
            <div key={item.id} className="pt-2.5 first:pt-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#ED1025]/10 text-[#ED1025] font-bold text-[10px] flex items-center justify-center shrink-0">
                    {item.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#171717] font-bengali block leading-tight">
                      {item.authorName}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] font-mono">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                </div>

                {item.rating && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-[#4B5563] font-bengali mt-1 pl-8 leading-relaxed">
                {item.message}
              </p>

              <div className="flex items-center justify-end gap-1.5 pl-8 mt-1">
                <button
                  type="button"
                  onClick={(e) => handleLike(item.id, e)}
                  className="flex items-center gap-1 text-[11px] text-[#6B7280] hover:text-[#ED1025] transition-colors p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
                >
                  <Heart className="w-3 h-3 text-[#ED1025] fill-[#ED1025]/20" />
                  <span className="font-mono tabular-nums">{item.likes || 1}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
