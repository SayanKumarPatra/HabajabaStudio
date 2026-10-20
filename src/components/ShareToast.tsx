import React, { useState, useEffect } from 'react';
import { Share2, Check, AlertCircle } from 'lucide-react';
import { SHARE_TOAST_EVENT } from '../utils/share';

export const ShareToast: React.FC = () => {
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    const handleShareToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: 'success' | 'info' | 'error' }>;
      if (customEvent.detail) {
        setToast({
          show: true,
          message: customEvent.detail.message,
          type: customEvent.detail.type || 'success',
        });

        const timer = setTimeout(() => {
          setToast((prev) => ({ ...prev, show: false }));
        }, 3200);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener(SHARE_TOAST_EVENT, handleShareToast);
    return () => window.removeEventListener(SHARE_TOAST_EVENT, handleShareToast);
  }, []);

  if (!toast.show) return null;

  return (
    <div className="fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div
        className={`px-4 py-2 rounded-full backdrop-blur-xl shadow-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold select-none ${
          toast.type === 'success'
            ? 'bg-black/85 text-white border-emerald-500/40 shadow-emerald-950/40'
            : toast.type === 'error'
            ? 'bg-red-950/90 text-red-200 border-red-500/50 shadow-red-950/40'
            : 'bg-black/85 text-white border-white/20'
        }`}
      >
        {toast.type === 'success' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
        {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
        {toast.type === 'info' && <Share2 className="w-4 h-4 text-[#ED1025] shrink-0" />}
        <span className="font-bengali">{toast.message}</span>
      </div>
    </div>
  );
};
