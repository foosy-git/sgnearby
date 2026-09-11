'use client';

import React, { useState } from 'react';
import { CardinalDirection } from '@/data/types';
import { getSunOrientation } from '@/lib/sunOrientation';
import {
  Sun,
  Compass,
  Wind,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Sparkles,
} from 'lucide-react';

interface Props {
  initialDirection?: CardinalDirection;
}

const DIRECTIONS: { key: CardinalDirection; label: string; angle: number }[] = [
  { key: 'N', label: 'North', angle: 0 },
  { key: 'NE', label: 'North-East', angle: 45 },
  { key: 'E', label: 'East', angle: 90 },
  { key: 'SE', label: 'South-East', angle: 135 },
  { key: 'S', label: 'South', angle: 180 },
  { key: 'SW', label: 'South-West', angle: 225 },
  { key: 'W', label: 'West', angle: 270 },
  { key: 'NW', label: 'North-West', angle: 315 },
];

export default function SunOrientationCard({ initialDirection = 'N' }: Props) {
  const [selectedDirection, setSelectedDirection] = useState<CardinalDirection>(initialDirection);
  const analysis = getSunOrientation(selectedDirection);

  const isWestAlert = ['W', 'NW', 'SW'].includes(selectedDirection);
  const isOptimalNorthSouth = ['N', 'S'].includes(selectedDirection);

  return (
    <div className="bg-white/95 rounded-2xl p-4 border border-[#243324]/10 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
              The Living Experience
            </span>
            <span className="text-[11px] font-semibold text-[#5C695C]">
              Solar Path &amp; Breeze
            </span>
          </div>
          <h4 className="font-serif font-bold text-sm sm:text-base text-[#243324] mt-1">
            Afternoon Sun &amp; Unit Facing Inspector
          </h4>
        </div>
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 ${analysis.heatBadgeClass}`}
        >
          {analysis.heatLevel}
        </span>
      </div>

      <p className="text-xs text-[#5C695C] leading-relaxed">
        Select the main living room or bedroom window facing to assess afternoon heat traps and natural cross-ventilation:
      </p>

      {/* Interactive Compass Direction Selector Pills */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
        {DIRECTIONS.map((dir) => {
          const isSelected = selectedDirection === dir.key;
          const isWest = ['W', 'NW', 'SW'].includes(dir.key);
          const isNorthSouth = ['N', 'S'].includes(dir.key);

          return (
            <button
              key={dir.key}
              type="button"
              onClick={() => setSelectedDirection(dir.key)}
              className={`p-1.5 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center ${
                isSelected
                  ? 'bg-[#243324] text-white border-[#243324] shadow-xs'
                  : isNorthSouth
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  : isWest
                  ? 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100'
                  : 'bg-[#F4EFE6]/70 text-[#243324] border-[#243324]/10 hover:bg-[#F4EFE6]'
              }`}
            >
              <span className="font-bold text-xs">{dir.key}</span>
              <span className="text-[9px] opacity-75">{dir.key === 'N' || dir.key === 'S' ? 'Cool' : isWest ? 'Sun' : 'Morn'}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Direction Analysis Panel */}
      <div className="p-3 rounded-xl bg-[#FBF9F5] border border-[#243324]/10 space-y-2.5 text-xs">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold text-xs text-[#243324] flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{analysis.label}</span>
              {isOptimalNorthSouth && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  ★ Gold Standard
                </span>
              )}
              {isWestAlert && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                  ⚠️ Heat Trap Alert
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#5C695C] mt-0.5">
              {analysis.sunExposureHours}
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#5C695C] shrink-0">
            <Wind className="w-3.5 h-3.5 text-blue-600" />
            <span>Ventilation: <strong className="text-[#243324]">{analysis.crossVentilation}</strong></span>
          </div>
        </div>

        <p className="text-[11px] text-[#243324] leading-relaxed">
          {analysis.description}
        </p>

        {/* Practical Buyer Tips */}
        <div className="pt-2 border-t border-[#243324]/10 space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#5C695C] flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-600" />
            <span>Singapore Homebuyer Guidance:</span>
          </div>
          <ul className="space-y-1 text-[11px] text-[#5C695C]">
            {analysis.buyerTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-700 font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
