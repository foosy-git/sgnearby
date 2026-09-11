'use client';

import React, { useState, useMemo } from 'react';
import { AmenityWithDistance } from '@/data/types';
import { calculateCommuteMatrix } from '@/lib/commuteMatrix';
import { MRT_LINES } from '@/data/mrtStations';
import {
  Briefcase,
  Train,
  Car,
  Clock,
  Navigation,
  Umbrella,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface Props {
  propertyLat: number;
  propertyLng: number;
  nearestMrt?: AmenityWithDistance;
}

export default function CommuteMatrixCard({
  propertyLat,
  propertyLng,
  nearestMrt,
}: Props) {
  const [commuteMode, setCommuteMode] = useState<'transit' | 'driving'>('transit');

  const commuteList = useMemo(() => {
    return calculateCommuteMatrix(propertyLat, propertyLng, nearestMrt);
  }, [propertyLat, propertyLng, nearestMrt]);

  // Assess sheltered walking readiness based on nearest MRT walking distance
  const shelteredReadiness = useMemo(() => {
    if (!nearestMrt) return { level: 'Moderate', desc: 'No MRT within walking radius; rely on feeder bus link' };
    if (nearestMrt.walkingMinutes <= 5) {
      return { level: 'High', desc: `~${nearestMrt.walkingMinutes} min walk to ${nearestMrt.name} with standard covered linkways` };
    }
    if (nearestMrt.walkingMinutes <= 10) {
      return { level: 'Good', desc: `~${nearestMrt.walkingMinutes} min walk to ${nearestMrt.name}` };
    }
    return { level: 'Feeder Bus Required', desc: `~${nearestMrt.walkingMinutes} min walk; recommend feeder bus in rainy weather` };
  }, [nearestMrt]);

  return (
    <div className="bg-white/95 rounded-2xl p-4 border border-[#243324]/10 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
              Daily Living
            </span>
            <span className="text-[11px] font-semibold text-[#5C695C]">
              Workplace Commute Matrix
            </span>
          </div>
          <h4 className="font-serif font-bold text-sm sm:text-base text-[#243324] mt-1">
            Door-to-Door Commute to 5 Key Hubs
          </h4>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#F4EFE6] p-1 rounded-xl border border-[#243324]/10">
          <button
            type="button"
            onClick={() => setCommuteMode('transit')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              commuteMode === 'transit'
                ? 'bg-[#243324] text-white shadow-xs'
                : 'text-[#5C695C] hover:text-[#243324]'
            }`}
            title="Public Transit (MRT & Bus)"
          >
            <Train className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Transit</span>
          </button>
          <button
            type="button"
            onClick={() => setCommuteMode('driving')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              commuteMode === 'driving'
                ? 'bg-[#243324] text-white shadow-xs'
                : 'text-[#5C695C] hover:text-[#243324]'
            }`}
            title="Peak-Hour Driving / Taxi"
          >
            <Car className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Drive</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-[#5C695C]">
        Peak morning door-to-door travel times factoring in walking to transit, line transfers, and traffic:
      </p>

      {/* Hubs Grid */}
      <div className="space-y-2">
        {commuteList.map((item) => {
          const minutes = commuteMode === 'transit' ? item.transitMinutes : item.drivingMinutes;

          return (
            <div
              key={item.hub.id}
              className="p-2.5 rounded-xl bg-[#FBF9F5] border border-[#243324]/10 hover:border-[#243324]/20 transition-all flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[#243324] text-xs truncate">
                    {item.hub.name}
                  </span>
                  <span className="text-[10px] text-[#5C695C] font-normal">
                    ({item.hub.subtitle})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#5C695C] flex-wrap">
                  <span>{item.distanceKm} km</span>
                  <span>•</span>
                  <span className="text-emerald-800 font-medium">
                    {commuteMode === 'transit' ? item.recommendedRoute : 'Via Expressway'}
                  </span>
                  {commuteMode === 'transit' && (
                    <div className="flex items-center gap-1 ml-1">
                      {item.mrtLines.map((line) => {
                        const lineInfo = MRT_LINES[line];
                        return (
                          <span
                            key={line}
                            className={`px-1 rounded text-[9px] font-bold ${
                              lineInfo ? lineInfo.bgClass : 'bg-slate-700 text-white'
                            }`}
                          >
                            {line}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Duration Badge */}
              <div className="text-right shrink-0">
                <div className="font-serif font-bold text-sm text-[#243324] flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3 text-[#5C695C]" />
                  <span>~{minutes}m</span>
                </div>
                <div className="text-[10px] text-[#5C695C]">
                  {commuteMode === 'transit' ? 'door-to-door' : 'peak traffic'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sheltered Walkway / Weather Accessibility Strip */}
      <div className="pt-2 border-t border-[#243324]/10 flex items-start gap-2 text-xs text-[#5C695C]">
        <Umbrella className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-[11px] leading-relaxed">
          <span className="font-bold text-[#243324]">Weather Resilience:</span>{' '}
          {shelteredReadiness.desc}.
          <a
            href="https://www.onemap.gov.sg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-800 hover:text-emerald-950 font-semibold inline-flex items-center gap-0.5 ml-1"
          >
            <span>View OneMap Sheltered Linkways</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
