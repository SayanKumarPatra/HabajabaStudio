import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Heart, Star, ChevronDown, ChevronUp, User, CheckCircle2 } from 'lucide-react';
import { feedbackService, ListenerComment } from '../services/feedbackService';

export const CommunityFeedbackSection: React.FC = () => {
  const [comments, setComments] = useState<ListenerComment[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(0); // 0 = empty / unselected by default per user request
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

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
      await feedbackService.addComment(
        authorName,
        message,
        rating > 0 ? rating : undefined
      );
      setMessage('');
      setRating(0); // reset back to empty
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
    <div className="w-full rounded-xl sm:rounded-2xl border border-red-500/30 bg-black/45 backdrop-blur-xl shadow-lg transition-all overflow-hidden">
      {/* 1. Compact Single-Line Strip (পাতি ভাবে করা হেডার) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2.5 text-left cursor-pointer hover:bg-white/5 transition-colors select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-500/15 text-[#ED1025] flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs sm:text-sm font-bold text-white font-bengali truncate">
              শ্রোতাদের লাইভ মন্তব্য ও মতামত
            </span>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-[#ED1025] font-bold font-mono shrink-0">
              {comments.length}
            </span>
          </div>
        </div>

        {/* Action Toggle with Arrow Indicator */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-[#ED1025]">
          <span className="hidden sm:inline font-bengali text-xs">
            {isOpen ? 'বন্ধ করুন' : 'মন্তব্য দিন ও দেখুন'}
          </span>
          <div className="w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center">
            {isOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </button>

      {/* 2. Expandable Dropdown Content (টাচ করলে নিচের দিকে ওপেন হয়ে যাবে) */}
      {isOpen && (
        <div className="p-3 sm:p-3.5 pt-1.5 border-t border-white/10 space-y-2.5 animate-in slide-in-from-top-1 duration-150">
          <p className="text-[11px] sm:text-xs text-neutral-300 font-bengali">
            আমাদের ওয়েব অ্যাপ্লিকেশন আপনাদের কেমন লেগেছে? আপনার মতামত ও অনুভূতি লিখুন:
          </p>

          {/* Comment Form - Compact, zero-waste spacing */}
          <form onSubmit={handleSubmit} className="space-y-2 bg-white/[0.04] p-2.5 rounded-xl border border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-neutral-300 block mb-0.5 font-bengali">
                  আপনার নাম (Name):
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="শ্রোতার নাম লিখুন"
                    maxLength={35}
                    className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden font-bengali"
                  />
                </div>
              </div>

              {/* Star Rating — Compact row */}
              <div>
                <label className="text-[10px] font-bold text-neutral-300 block mb-0.5 font-bengali">
                  রেটিং (ঐচ্ছিক): {rating > 0 ? `${rating} Star` : '(স্টার নির্বাচন করুন)'}
                </label>
                <div className="flex items-center gap-1 py-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star === rating ? 0 : star)}
                      className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                      title={`${star} Star`}
                    >
                      <Star
                        className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-600 fill-transparent'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <button
                      type="button"
                      onClick={() => setRating(0)}
                      className="text-[10px] text-neutral-400 hover:text-white underline ml-1 cursor-pointer"
                    >
                      ক্লিয়ার
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-300 block mb-0.5 font-bengali">
                আপনার মন্তব্য ও শহর/দেশ (Comment &amp; Location):
              </label>
              <textarea
                required
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="গান কেমন লেগেছে এবং কোথা থেকে শুনছেন লিখুন..."
                maxLength={400}
                className="w-full text-xs p-2 rounded-lg border border-white/15 bg-black/60 text-white focus:border-[#ED1025] focus:outline-hidden font-bengali resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-[10px] text-neutral-400 font-bengali">
                ⚡ সেন্ড করলেই সরাসরি লাইভ হবে
              </span>

              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#ED1025] hover:bg-[#D90D20] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>{isSubmitting ? 'পোস্ট হচ্ছে...' : 'সেন্ড করুন'}</span>
              </button>
            </div>

            {showSuccessToast && (
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bengali">আপনার মন্তব্য সফলভাবে লাইভ প্রকাশিত হয়েছে!</span>
              </div>
            )}
          </form>

          {/* Genuine User Comments Feed - Compact, tight list */}
          <div className="space-y-1.5 pt-0.5">
            <span className="text-[11px] font-bold text-white font-bengali block">
              শ্রোতাদের মন্তব্য ({comments.length}):
            </span>

            {comments.length === 0 ? (
              <div className="p-3.5 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/10 text-neutral-400 text-xs font-bengali">
                এখনও কোনো মন্তব্য জমা পড়েনি। প্রথম মন্তব্যটি আপনিই করুন!
              </div>
            ) : (
              <div className="divide-y divide-white/10 max-h-56 overflow-y-auto pr-1 space-y-1.5">
                {comments.map((item) => (
                  <div key={item.id} className="pt-1.5 first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#ED1025]/20 text-[#ED1025] font-bold text-[10px] flex items-center justify-center shrink-0">
                          {item.authorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-white font-bengali leading-tight">
                          {item.authorName}
                        </span>
                        <span className="text-[9px] text-neutral-400 font-mono">
                          · {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.rating && item.rating > 0 && (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: item.rating }).map((_, i) => (
                              <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleLike(item.id, e)}
                          className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-[#ED1025] transition-colors px-1 py-0.5 rounded hover:bg-white/10 cursor-pointer"
                          title="Like comment"
                        >
                          <Heart className="w-3 h-3 text-[#ED1025] fill-[#ED1025]/30" />
                          <span className="font-mono text-[10px] tabular-nums">{item.likes || 0}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-200 font-bengali mt-0.5 pl-6.5 leading-snug">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
