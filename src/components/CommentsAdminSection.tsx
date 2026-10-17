import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Trash2, Heart, Search, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { feedbackService, ListenerComment } from '../services/feedbackService';

export const CommentsAdminSection: React.FC = () => {
  const [comments, setComments] = useState<ListenerComment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [commentToDelete, setCommentToDelete] = useState<ListenerComment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = feedbackService.subscribe((list) => {
      setComments(Array.isArray(list) ? list : []);
    });
    return unsub;
  }, []);

  const filteredComments = comments.filter((c) => {
    if (!c) return false;
    const matchSearch =
      (c.authorName && c.authorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.message && c.message.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    if (selectedRating !== 'all') {
      return Number(c.rating) === selectedRating;
    }
    return true;
  });

  const handleDeleteConfirm = async () => {
    if (!commentToDelete) return;
    const targetId = commentToDelete.id;
    const author = commentToDelete.authorName;
    setCommentToDelete(null);

    try {
      await feedbackService.deleteComment(targetId);
      setToastMessage(`"${author}" এর মন্তব্য সফলভাবে মুছে ফেলা হয়েছে!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e) {
      console.warn('Failed to delete comment:', e);
    }
  };

  const handleClearAll = async () => {
    if (confirm('আপনি কি সকল মন্তব্য মুছে ফেলতে চান? এটি ফিরিয়ে আনা যাবে না।')) {
      for (const c of comments) {
        await feedbackService.deleteComment(c.id);
      }
      setToastMessage('সকল মন্তব্য সফলভাবে মুছে ফেলা হয়েছে।');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Stats
  const totalComments = comments.length;
  const ratedComments = comments.filter((c) => c && Number(c.rating) > 0);
  const avgRating = ratedComments.length > 0
    ? (ratedComments.reduce((acc, c) => acc + (Number(c.rating) || 0), 0) / ratedComments.length).toFixed(1)
    : '0.0';

  return (
    <div className="w-full space-y-5 text-white">
      {/* Header and Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-[#ED1025] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{totalComments}</div>
            <div className="text-xs text-neutral-400 font-bengali">মোট শ্রোতাদের মন্তব্য</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{avgRating} <span className="text-xs font-normal text-neutral-400">/ 5.0</span></div>
            <div className="text-xs text-neutral-400 font-bengali">গড় শ্রোতা রেটিং ({ratedComments.length} জন)</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white font-bengali">লাইভ ক্লাউড সিঙ্ক</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Realtime Active</span>
            </div>
          </div>
          {comments.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition-colors cursor-pointer"
            >
              সব মুছুন
            </button>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="মন্তব্য বা নাম দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/15 bg-black/60 text-white text-xs focus:border-[#ED1025] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <span className="text-xs text-neutral-400 shrink-0 mr-1">রেটিং:</span>
          {(['all', 5, 4, 3, 2, 1] as const).map((r) => (
            <button
              key={String(r)}
              type="button"
              onClick={() => setSelectedRating(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedRating === r
                  ? 'bg-[#ED1025] text-white shadow-xs'
                  : 'bg-white/10 text-neutral-300 hover:bg-white/15'
              }`}
            >
              {r === 'all' ? 'সকল' : `${r} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white font-bengali flex items-center justify-between">
          <span>মন্তব্য তালিকা ({filteredComments.length})</span>
          <span className="text-xs text-neutral-400 font-normal">শ্রোতারা হোমপেজ থেকে মন্তব্য প্রদান করেন</span>
        </h3>

        {filteredComments.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/10 text-neutral-400 text-xs font-bengali">
            {searchQuery ? 'খোঁজার ফলাফলে কোনো মন্তব্য মেলেনি।' : 'এখনও কোনো মন্তব্য জমা পড়েনি।'}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredComments.map((c) => {
              const safeAuthor = String(c.authorName || 'সঙ্গীতপ্রেমী শ্রোতা');
              const initial = safeAuthor.charAt(0).toUpperCase() || 'S';
              const rawRating = Number(c.rating) || 0;
              const dateStr = c.timestamp ? new Date(c.timestamp).toLocaleString('bn-BD') : '';

              return (
                <div key={c.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#ED1025]/20 text-[#ED1025] font-bold text-xs flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <span className="text-xs font-bold text-white font-bengali">{safeAuthor}</span>
                      {rawRating > 0 && (
                        <div className="flex items-center gap-0.5 ml-1">
                          {[1, 2, 3, 4, 5].slice(0, rawRating).map((star) => (
                            <Star key={star} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                      <span className="text-[10px] text-neutral-400 font-mono">
                        · {dateStr}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-200 font-bengali pl-8 leading-relaxed break-words">
                      {c.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                      <Heart className="w-3 h-3 text-[#ED1025] fill-[#ED1025]/30" />
                      <span>{c.likes || 0}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setCommentToDelete(c)}
                      className="p-1.5 rounded-lg bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white transition-colors cursor-pointer"
                      title="মন্তব্য মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* In-Page Delete Confirmation (NO POPUP) */}
      {commentToDelete && (
        <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 text-red-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white font-bengali">
                আপনি কি "{commentToDelete.authorName}" এর মন্তব্য মুছে ফেলতে চান?
              </div>
              <div className="text-xs text-neutral-300 font-bengali mt-0.5 line-clamp-1">
                "{commentToDelete.message}"
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setCommentToDelete(null)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-300 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-colors cursor-pointer shadow-md"
            >
              হ্যাঁ, মুছে ফেলুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
