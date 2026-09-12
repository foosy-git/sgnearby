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
    <div className="bg-white/95 rounded-2xl p-4 border border-[#243324]/10 shadow-xs space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[#243324] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-800" />
          <span>Remaining 99-Year Lease</span>
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

      <div className="flex items-center justify-between text-[11px] text-[#5C695C] pt-0.5">
        <span>Built: {lifecycle.leaseCommenceYear} ({lifecycle.flatAgeYears} yrs old)</span>
        <span>Lease Expiry: ~{lifecycle.leaseCommenceYear + 99}</span>
      </div>

      {lifecycle.exitResaleLiquidity.note && (
        <p className="text-[11px] text-[#5C695C] leading-snug pt-1 border-t border-[#243324]/5">
          {lifecycle.exitResaleLiquidity.note}
        </p>
      )}
    </div>
  );
}

