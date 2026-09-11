'use client';

import React from 'react';
import { AmenityWithDistance, SelectedProperty } from '@/data/types';
import { getGoogleMapsWalkUrl, formatDistance } from '@/lib/geoUtils';
import { MRT_LINES } from '@/data/mrtStations';
import { Navigation, ExternalLink, X, ChevronUp } from 'lucide-react';

interface Props {
  poi: AmenityWithDistance | null;
  selectedProperty: SelectedProperty;
  onClose: () => void;
  onExpandSheet?: () => void;
}

export default function MobilePoiPeekCard({
  poi,
  selectedProperty,
  onClose,
  onExpandSheet,
}: Props) {
  if (!poi) return null;

  const gmapsUrl = getGoogleMapsWalkUrl(
    selectedProperty.lat,
    selectedProperty.lng,
    poi.lat,
    poi.lng,
    poi.name
  );

  const getCategoryBadge = () => {
    switch (poi.category) {
      case 'mrt':
        return { label: 'MRT Station', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'bus':
        return { label: 'Bus Stop', bg: 'bg-sky-100 text-sky-900 border-sky-300' };
      case 'food':
        return {
          label: poi.details?.hawkerType ? `⭐ ${poi.details.hawkerType}` : 'Food & Dining',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
        };
      case 'mall':
        return { label: 'Shopping Mall', bg: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'supermarket':
      case 'shopping':
        return { label: 'Groceries', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'school':
        return {
          label: poi.schoolPriority === '1km' ? '★ 1km School Priority' : 'School',
          bg: poi.schoolPriority === '1km' ? 'bg-indigo-100 text-indigo-950 border-indigo-300' : 'bg-blue-100 text-blue-900 border-blue-200',
        };
      case 'healthcare':
        return { label: 'Healthcare', bg: 'bg-rose-100 text-rose-900 border-rose-300' };
      case 'park':
        return { label: 'Park & Nature', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'sports':
        return { label: 'Sports & ActiveSG', bg: 'bg-orange-100 text-orange-900 border-orange-300' };
      default:
        return { label: String(poi.category || 'AMENITY').toUpperCase(), bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const badge = getCategoryBadge();

  return (
    <div className="lg:hidden absolute left-3 right-3 bottom-[115px] z-30 bg-[#FBF9F5]/98 backdrop-blur-xl rounded-2xl p-3.5 border border-[#243324]/15 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badge.bg}`}>
              {badge.label}
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {formatDistance(poi.distanceMeters)} (~{poi.walkingMinutes} min)
            </span>
          </div>

          <h4 className="font-serif font-bold text-sm text-[#243324] mt-1.5 leading-snug break-words">
            {poi.name}
          </h4>

          {/* Subtitle / Details */}
          {poi.details?.lines && (
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {poi.category === 'bus' ? (
                <>
                  {poi.details.stationCode && (
                    <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                      Stop #{poi.details.stationCode}
                    </span>
                  )}
                  <span className="text-[10px] text-[#5C695C] mr-0.5 font-medium">Buses:</span>
                  {poi.details.lines.slice(0, 7).map((busNo) => (
                    <span
                      key={busNo}
                      className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 text-sky-900 border border-sky-200"
                    >
                      {busNo}
                    </span>
                  ))}
                  {poi.details.lines.length > 7 && (
                    <span className="text-[9px] text-[#5C695C] font-semibold">
                      +{poi.details.lines.length - 7} more
                    </span>
                  )}
                </>
              ) : (
                poi.details.lines.map((line) => {
                  const lineInfo = MRT_LINES[line];
                  return (
                    <span
                      key={line}
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        lineInfo ? lineInfo.bgClass : 'bg-slate-700 text-white'
                      }`}
                    >
                      {line}
                    </span>
                  );
                })
              )}
            </div>
          )}

          {poi.details?.ballotingRisk === 'High' && (
            <div className="mt-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block">
              🔥 High 2C Ballot Risk (Singapore Citizen Within 1km)
            </div>
          )}

          {poi.details?.stallsCount && (
            <div className="mt-1 text-[11px] text-amber-800 font-medium">
              {poi.details.stallsCount} Food Stalls • {poi.details.cuisine || 'Authentic SG Fare'}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl text-[#5C695C] hover:text-[#243324] hover:bg-[#243324]/5 active:scale-95 transition-all cursor-pointer"
          title="Close card"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mt-2.5 pt-2 border-t border-[#243324]/10 flex items-center gap-2">
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-200" />
          <span>Walking Directions</span>
          <ExternalLink className="w-3 h-3 text-emerald-200 ml-0.5 opacity-80" />
        </a>

        {onExpandSheet && (
          <button
            type="button"
            onClick={onExpandSheet}
            className="py-2 px-3 rounded-xl bg-[#F4EFE6] text-[#243324] text-xs font-semibold hover:bg-[#E8DCC4] active:scale-95 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>All Nearby</span>
            <ChevronUp className="w-3.5 h-3.5 text-emerald-700" />
          </button>
        )}
      </div>
    </div>
  );
}
