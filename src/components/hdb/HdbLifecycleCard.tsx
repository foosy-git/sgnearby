'use client';

import React from 'react';
import { evaluateHdbLifecycle } from '@/lib/hdbLifecycle';
import { Clock } from 'lucide-react';

interface Props {
  leaseCommenceYear: number;
}

export default function HdbLifecycleCard({ leaseCommenceYear }: Props) {
  const lifecycle = evaluateHdbLifecycle(leaseCommenceYear, 32);

  return (
    <div className="bg-white/95 rounded-2xl p-4 border border-[#243324]/10 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              Building Health
            </span>
            <span className="text-[11px] font-semibold text-[#5C695C]">
              99-Year Lease
            </span>
          </div>
          <h4 className="font-serif font-bold text-sm sm:text-base text-[#243324] mt-1">
            Remaining Lease &amp; Building Age
          </h4>
        </div>
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 ${lifecycle.exitResaleLiquidity.badgeClass}`}
        >
          {lifecycle.exitResaleLiquidity.tier} Liquidity
        </span>
      </div>

      {/* Remaining Lease Progress Bar */}
      <div className="space-y-1.5 p-3 rounded-xl bg-[#F4EFE6]/60 border border-[#243324]/5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#5C695C] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-800" />
            Remaining 99-Year Lease
          </span>
          <span className="font-bold text-[#243324]">
            {lifecycle.remainingLeaseYears} years left ({lifecycle.leasePercentageRemaining}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#243324]/10 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              lifecycle.remainingLeaseYears > 80
                ? 'bg-emerald-600'
                : lifecycle.remainingLeaseYears > 60
                ? 'bg-teal-600'
                : 'bg-amber-600'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, lifecycle.leasePercentageRemaining))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#5C695C] pt-0.5">
          <span>Built: {lifecycle.leaseCommenceYear} ({lifecycle.flatAgeYears} yrs old)</span>
          <span>Lease Expiry: ~{lifecycle.leaseCommenceYear + 99}</span>
        </div>
      </div>
    </div>
  );
}
