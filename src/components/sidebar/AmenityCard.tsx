import React from 'react';
import { AmenityWithDistance, SelectedProperty } from '@/data/types';
import { MRT_LINES } from '@/data/mrtStations';
import { getGoogleMapsWalkUrl, formatDistance } from '@/lib/geoUtils';
import {
  Train,
  Bus,
  Utensils,
  Building2,
  ShoppingCart,
  GraduationCap,
  HeartPulse,
  Trees,
  Dumbbell,
  Navigation,
  ExternalLink,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface Props {
  amenity: AmenityWithDistance;
  selectedProperty: SelectedProperty;
  onLocate: (amenity: AmenityWithDistance) => void;
  isHighlighted?: boolean;
}

export default function AmenityCard({
  amenity,
  selectedProperty,
  onLocate,
  isHighlighted = false,
}: Props) {
  const getIcon = () => {
    switch (amenity.category) {
      case 'mrt':
        return <Train className="w-4 h-4 text-blue-600" />;
      case 'bus':
        return <Bus className="w-4 h-4 text-sky-600" />;
      case 'food':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'mall':
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case 'supermarket':
      case 'shopping':
        return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
      case 'school':
        return <GraduationCap className="w-4 h-4 text-indigo-600" />;
      case 'healthcare':
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
      case 'park':
        return <Trees className="w-4 h-4 text-emerald-700" />;
      case 'sports':
        return <Dumbbell className="w-4 h-4 text-orange-600" />;
      default:
        return <MapPin className="w-4 h-4 text-[#5C695C]" />;
    }
  };

  const getCategoryBadgeClass = () => {
    switch (amenity.category) {
      case 'mrt':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'bus':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'food':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'mall':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'supermarket':
      case 'shopping':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'school':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'healthcare':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'park':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'sports':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const gmapsUrl = getGoogleMapsWalkUrl(
    selectedProperty.lat,
    selectedProperty.lng,
    amenity.lat,
    amenity.lng,
    amenity.name
  );

  return (
    <div
      onClick={() => onLocate(amenity)}
      className={`group relative p-3.5 rounded-xl border transition-all duration-200 cursor-pointer bg-white/80 hover:bg-white shadow-xs hover:shadow-md ${
        isHighlighted
          ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-white'
          : 'border-[#243324]/10 hover:border-[#243324]/25'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-[#F4EFE6] border border-[#243324]/5 mt-0.5 shrink-0 group-hover:scale-105 transition-transform">
            {getIcon()}
          </div>
          <div>
            <div className="font-semibold text-sm text-[#243324] leading-snug group-hover:text-emerald-900">
              {amenity.name}
            </div>

            {/* Subtitle / Details */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-[#5C695C]">
              {amenity.details?.lines && (
                <div className="flex flex-wrap items-center gap-1">
                  {amenity.category === 'bus' ? (
                    <>
                      {amenity.details.stationCode && (
                        <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                          #{amenity.details.stationCode}
                        </span>
                      )}
                      <span className="text-[10px] text-[#5C695C]">Buses:</span>
                      {amenity.details.lines.slice(0, 5).map((busNo) => (
                        <span
                          key={busNo}
                          className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-200"
                        >
                          {busNo}
                        </span>
                      ))}
                      {amenity.details.lines.length > 5 && (
                        <span className="text-[10px] text-sky-700 font-medium">
                          +{amenity.details.lines.length - 5}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {amenity.details.lines.map((line) => {
                        const lineInfo = MRT_LINES[line];
                        return (
                          <span
                            key={line}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                              lineInfo ? lineInfo.bgClass : 'bg-slate-700 text-white'
                            }`}
                          >
                            {line}
                          </span>
                        );
                      })}
                      {amenity.details.stationCode && (
                        <span className="text-[11px] font-medium text-slate-500">
                          ({amenity.details.stationCode})
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}

              {amenity.id.startsWith('gplace-') && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                  Google Maps Live
                </span>
              )}

              {amenity.details?.hawkerType ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                  <Utensils className="w-3 h-3 text-amber-700" />
                  <span>{amenity.details.hawkerType}</span>
                  {amenity.details.stallsCount ? (
                    <span className="text-amber-700 font-normal">({amenity.details.stallsCount} stalls)</span>
                  ) : null}
                </span>
              ) : amenity.details?.foodType && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {amenity.details.foodType}
                </span>
              )}

              {amenity.details?.cuisine && (
                <span className="line-clamp-1">{amenity.details.cuisine}</span>
              )}

              {amenity.category === 'mall' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                  <Building2 className="w-3 h-3 text-purple-700" />
                  <span>{amenity.details?.mallType || 'Shopping Mall'}</span>
                </span>
              )}

              {(amenity.category === 'supermarket' || (amenity.category === 'shopping' && !amenity.name.toLowerCase().includes('mall'))) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShoppingCart className="w-3 h-3 text-emerald-600" />
                  <span>Supermarket / Groceries</span>
                </span>
              )}

              {amenity.details?.brand && (
                <span className="font-medium text-slate-700">{amenity.details.brand}</span>
              )}

              {amenity.details?.schoolLevel && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                  <GraduationCap className="w-3 h-3 text-indigo-700" />
                  <span>{amenity.details.schoolLevel}</span>
                </span>
              )}

              {amenity.details?.schoolType && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-50/80 text-indigo-700 font-medium">
                  {amenity.details.schoolType}
                </span>
              )}

              {amenity.details?.schoolGender && amenity.details.schoolGender !== 'Co-ed' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium border border-purple-200">
                  {amenity.details.schoolGender}
                </span>
              )}

              {amenity.details?.hospitalType && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-medium">
                  {amenity.details.hospitalType}
                </span>
              )}

              {amenity.details?.parkType && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                  {amenity.details.parkType}
                </span>
              )}

              {amenity.details?.sportsType && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 font-medium border border-orange-200">
                  {amenity.details.sportsType}
                </span>
              )}
            </div>

            {/* School 1km / 2km Priority & Phase 2C Balloting Risk */}
            {amenity.category === 'school' && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {amenity.schoolPriority === '1km' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
                    ★ Within 1km (Priority Phase 2C)
                  </span>
                ) : amenity.schoolPriority === '2km' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                    1km - 2km Range
                  </span>
                ) : null}

                {amenity.details?.ballotingRisk && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      amenity.details.ballotingRisk === 'High'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : amenity.details.ballotingRisk === 'Moderate'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                    title={amenity.details.ballotingNote || undefined}
                  >
                    {amenity.details.ballotingRisk === 'High'
                      ? '🔥 High 2C Ballot Risk'
                      : amenity.details.ballotingRisk === 'Moderate'
                      ? '⚖️ Moderate 2C Demand'
                      : '✅ High Placement Chance'}
                  </span>
                )}
              </div>
            )}

            {amenity.details?.ballotingNote && amenity.schoolPriority === '1km' && (
              <div className="text-[10px] text-[#5C695C] italic mt-1 line-clamp-1">
                {amenity.details.ballotingNote}
              </div>
            )}
          </div>
        </div>

        {/* Distance & Walking Duration Badge */}
        <div className="text-right shrink-0 flex flex-col items-end">
          <div className="font-bold text-xs text-[#243324]">
            {formatDistance(amenity.distanceMeters)}
          </div>
          <div className="text-[11px] text-[#5C695C] font-medium flex items-center gap-0.5 mt-0.5">
            <Navigation className="w-2.5 h-2.5" />
            ~{amenity.walkingMinutes} min walk
          </div>
        </div>
      </div>

      {/* Action Strip: Google Maps Directions link */}
      <div className="mt-2.5 pt-2 border-t border-[#243324]/5 flex items-center justify-between text-xs">
        <span className="text-[11px] text-[#5C695C] group-hover:text-emerald-700 font-medium flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Click to view on map
        </span>
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 hover:underline bg-emerald-50/60 px-2 py-1 rounded-md transition-colors"
          title="Open walking directions in Google Maps"
        >
          <span>Google Maps route</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
