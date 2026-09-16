'use client';

import React, { useEffect } from 'react';
import { MapPinOff, Info, X } from 'lucide-react';

export interface LocationToastProps {
  message: string | null;
  onClose: () => void;
  type?: 'info' | 'warning';
  duration?: number;
}

export default function LocationToast({
  message,
  onClose,
  type = 'info',
  duration = 6000,
}: LocationToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[1100] max-w-[92vw] sm:max-w-md w-full px-2 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300"
    >
      <div className="pointer-events-auto bg-[#243324]/95 backdrop-blur-md text-[#FBF9F5] rounded-2xl p-3.5 shadow-2xl border border-white/15 flex items-start gap-3 text-xs leading-relaxed">
        <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
          {type === 'warning' ? (
            <MapPinOff className="w-4 h-4" />
          ) : (
            <Info className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <p className="font-semibold text-emerald-200 mb-0.5">Location Update</p>
          <p className="text-[#FBF9F5]/90 text-[11px] sm:text-xs">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
