'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  SelectedProperty,
  Amenity,
  ConvenienceScore,
} from '@/data/types';
import { FEATURED_PROPERTIES } from '@/data/featuredProperties';
import {
  processAmenitiesWithDistance,
  calculateConvenienceScore,
  formatDistance,
} from '@/lib/geoUtils';
import { calculateCommuteMatrix } from '@/lib/commuteMatrix';
import { generatePortalLinks } from '@/lib/portalLinks';
import { searchSingaporeLocation, GeocodeResult } from '@/lib/onemap';
import { isLrtStation } from '@/data/mrtStations';
import {
  X,
  Scale,
  Train,
  School,
  Utensils,
  ShoppingCart,
  Trees,
  ArrowRight,
  Search,
  Trophy,
  MapPin,
  Loader2,
  Briefcase,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  locationA: SelectedProperty;
  allAmenities: Amenity[];
  onSwitchToLocation: (prop: SelectedProperty) => void;
}

export default function LocationComparisonModal({
  isOpen,
  onClose,
  locationA,
  allAmenities,
  onSwitchToLocation,
}: Props) {
  // Default location B: Pick a contrasting featured property (e.g. Pinnacle @ Duxton if A is Natura Loft, or vice versa)
  const defaultLocationB = useMemo(() => {
    return (
      FEATURED_PROPERTIES.find((p) => p.name !== locationA.name) ||
      FEATURED_PROPERTIES[0]
    );
  }, [locationA.name]);

  const [locationB, setLocationB] = useState<SelectedProperty>(defaultLocationB);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search results dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute 2km amenities and convenience score for Location A
  const metricsA = useMemo(() => {
    const amenities = processAmenitiesWithDistance(
      allAmenities,
      locationA.lat,
      locationA.lng,
      2000
    );
    const score = calculateConvenienceScore(amenities);
    const nearestMrt = amenities.find((a) => a.category === 'mrt');
    const schools1km = amenities.filter(
      (a) => a.category === 'school' && a.schoolPriority === '1km'
    );
    const nearestHawker = amenities.find(
      (a) => a.category === 'food' && (!!a.details?.hawkerType || a.details?.foodType === 'Hawker Centre')
    );
    const nearestSupermarket = amenities.find(
      (a) => a.category === 'supermarket' || a.category === 'shopping'
    );
    const nearestPark = amenities.find((a) => a.category === 'park');
    const highRiskSchools1kmCount = schools1km.filter((a) => a.details?.ballotingRisk === 'High').length;
    const twoTrackSchools2km = amenities.filter(
      (a) => a.category === 'school' && a.isTwoTrackScheme && a.twoTrackTrack === 'within-2km'
    );
    const commuteList = calculateCommuteMatrix(locationA.lat, locationA.lng, nearestMrt);
    const cbdCommute = commuteList.find((c) => c.hub.id === 'cbd-raffles');
    const oneNorthCommute = commuteList.find((c) => c.hub.id === 'one-north');
    const portalLinks = generatePortalLinks(locationA);

    return {
      score,
      nearestMrt,
      schools1kmCount: schools1km.length,
      highRiskSchools1kmCount,
      twoTrackSchools2kmCount: twoTrackSchools2km.length,
      nearestHawker,
      nearestSupermarket,
      nearestPark,
      cbdCommute,
      oneNorthCommute,
      portalLinks,
    };
  }, [allAmenities, locationA]);

  // Compute 2km amenities and convenience score for Location B
  const metricsB = useMemo(() => {
    const amenities = processAmenitiesWithDistance(
      allAmenities,
      locationB.lat,
      locationB.lng,
      2000
    );
    const score = calculateConvenienceScore(amenities);
    const nearestMrt = amenities.find((a) => a.category === 'mrt');
    const schools1km = amenities.filter(
      (a) => a.category === 'school' && a.schoolPriority === '1km'
    );
    const nearestHawker = amenities.find(
      (a) => a.category === 'food' && (!!a.details?.hawkerType || a.details?.foodType === 'Hawker Centre')
    );
    const nearestSupermarket = amenities.find(
      (a) => a.category === 'supermarket' || a.category === 'shopping'
    );
    const nearestPark = amenities.find((a) => a.category === 'park');
    const highRiskSchools1kmCount = schools1km.filter((a) => a.details?.ballotingRisk === 'High').length;
    const twoTrackSchools2km = amenities.filter(
      (a) => a.category === 'school' && a.isTwoTrackScheme && a.twoTrackTrack === 'within-2km'
    );
    const commuteList = calculateCommuteMatrix(locationB.lat, locationB.lng, nearestMrt);
    const cbdCommute = commuteList.find((c) => c.hub.id === 'cbd-raffles');
    const oneNorthCommute = commuteList.find((c) => c.hub.id === 'one-north');
    const portalLinks = generatePortalLinks(locationB);

    return {
      score,
      nearestMrt,
      schools1kmCount: schools1km.length,
      highRiskSchools1kmCount,
      twoTrackSchools2kmCount: twoTrackSchools2km.length,
      nearestHawker,
      nearestSupermarket,
      nearestPark,
      cbdCommute,
      oneNorthCommute,
      portalLinks,
    };
  }, [allAmenities, locationB]);

  // Search handler for Location B
  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim() || val.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const res = await searchSingaporeLocation(val);
    setSearchResults(res);
    setIsSearching(false);
  };

  const handleSelectResultB = (res: GeocodeResult) => {
    setLocationB({
      id: `compare-${Date.now()}`,
      name: res.buildingName || res.address.split(',')[0],
      address: res.address,
      lat: res.lat,
      lng: res.lng,
      postalCode: res.postalCode,
      propertyType: 'Custom Location',
    });

    setSearchQuery('');
    setSearchResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-[#243324]/15 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#243324]/10 bg-[#FBF9F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#243324] text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-[#243324]">
                Side-by-Side Location Comparison
              </h3>
              <p className="text-xs text-[#5C695C]">
                Compare walkability, transit, primary schools &amp; amenities between two Singapore locations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#5C695C] hover:bg-[#243324]/5 hover:text-[#243324] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 no-scrollbar">
          {/* Select / Search Location B Toolbar */}
          <div
            ref={searchContainerRef}
            className="p-3 sm:p-4 bg-[#F4EFE6]/70 rounded-2xl border border-[#243324]/10 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs"
          >
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-bold text-[#243324] whitespace-nowrap flex items-center gap-1.5 text-xs sm:text-sm">
                <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Compare against:</span>
              </span>
            </div>

            {/* Custom Search for Location B */}
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-[#5C695C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Enter address, building name, or 6-digit postal code (e.g. 570531)..."
                className="w-full pl-10 pr-9 py-2 bg-white rounded-xl border border-[#243324]/15 text-xs text-[#243324] placeholder:text-[#5C695C]/60 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
              />
              {isSearching ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                </div>
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C695C] hover:text-[#243324] p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}

              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#243324]/15 shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-[#243324]/5">
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectResultB(res)}
                      className="w-full text-left p-2.5 hover:bg-[#F4EFE6] transition-colors text-xs flex items-start gap-2.5 group cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#243324] truncate">
                          {res.buildingName || res.address.split(',')[0]}
                        </div>
                        <div className="text-[10px] text-[#5C695C] truncate">
                          {res.address} {res.postalCode ? `• S(${res.postalCode})` : ''}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location A Column */}
            <div className="bg-[#FBF9F5] rounded-3xl p-5 border-2 border-emerald-600/30 space-y-4 relative">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-800 text-white">
                    Current Location A
                  </span>
                  <h4 className="font-serif font-bold text-base sm:text-lg text-[#243324] mt-2">
                    {locationA.name}
                  </h4>
                  <p className="text-xs text-[#5C695C] line-clamp-1">{locationA.address}</p>
                </div>
                <div className="text-center p-3 rounded-2xl bg-white border border-[#243324]/10 shadow-xs shrink-0">
                  <div className="font-serif font-bold text-2xl text-emerald-800">
                    {metricsA.score.overall}
                  </div>
                  <div className="text-[9px] font-bold text-[#5C695C] uppercase">Convenience</div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2 pt-2 border-t border-[#243324]/10 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#243324]/5">
                  <span className="flex items-center gap-1.5 text-[#5C695C]">
                    <Train className="w-3.5 h-3.5 text-blue-600" />
                    <span>Transit Score</span>
                  </span>
                  <span className="font-bold text-[#243324]">{metricsA.score.transit}/100</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#243324]/5">
                  <span className="flex items-center gap-1.5 text-[#5C695C]">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    <span>Hawker &amp; Dining</span>
                  </span>
                  <span className="font-bold text-[#243324]">{metricsA.score.food}/100</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#243324]/5">
                  <span className="flex items-center gap-1.5 text-[#5C695C]">
                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Groceries &amp; Malls</span>
                  </span>
                  <span className="font-bold text-[#243324]">{metricsA.score.groceries}/100</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#243324]/5">
                  <span className="flex items-center gap-1.5 text-[#5C695C]">
                    <School className="w-3.5 h-3.5 text-indigo-600" />
                    <span>MOE Schools</span>
                  </span>
                  <span className="font-bold text-[#243324]">{metricsA.score.schools}/100</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#243324]/5">
                  <span className="flex items-center gap-1.5 text-[#5C695C]">
                    <Trees className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Parks &amp; Nature</span>
                  </span>
                  <span className="font-bold text-[#243324]">{metricsA.score.parks}/100</span>
                </div>
              </div>

              {/* Milestones */}
              <div className="pt-2 border-t border-[#243324]/10 space-y-1.5 text-xs">
                <div className="text-[11px] font-bold text-[#5C695C] uppercase tracking-wider">
                  Proximity &amp; Commute Milestones
                </div>
                <div className="text-xs text-[#243324]">
                  🚆 <strong>{isLrtStation(metricsA.nearestMrt) ? 'Nearest LRT:' : 'Nearest MRT:'}</strong>{' '}
                  {metricsA.nearestMrt
                    ? `${metricsA.nearestMrt.name} (${formatDistance(metricsA.nearestMrt.distanceMeters)}, ~${metricsA.nearestMrt.walkingMinutes} min)`
                    : 'None within 2km'}
                </div>
                {metricsA.cbdCommute && (
                  <div className="text-xs text-[#243324]">
                    💼 <strong>CBD Commute (Raffles Pl):</strong>{' '}
                    <span className="font-bold text-emerald-800">~{metricsA.cbdCommute.transitMinutes} min</span> ({metricsA.cbdCommute.distanceKm} km)
                  </div>
                )}
                {metricsA.oneNorthCommute && (
                  <div className="text-xs text-[#243324]">
                    🔬 <strong>One-North Hub:</strong>{' '}
                    <span className="font-bold text-emerald-800">~{metricsA.oneNorthCommute.transitMinutes} min</span> transit
                  </div>
                )}
                <div className="text-xs text-[#243324]">
                  🏫 <strong>MOE Schools:</strong>{' '}
                  <span className="font-bold text-indigo-900">{metricsA.schools1kmCount} in 1km</span>{' '}
                  {metricsA.twoTrackSchools2kmCount > 0 && (
                    <span className="text-[10px] text-purple-900 font-bold bg-purple-100 px-1.5 py-0.5 rounded border border-purple-300 ml-1">
                      🏛️ {metricsA.twoTrackSchools2kmCount} Two-Track (2km)
                    </span>
                  )}
                  {metricsA.highRiskSchools1kmCount > 0 && (
                    <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1 rounded border border-rose-200 ml-1">
                      🔥 {metricsA.highRiskSchools1kmCount} High 2C Risk
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#243324]">
                  🍲 <strong>Nearest Hawker:</strong>{' '}
                  {metricsA.nearestHawker
                    ? `${metricsA.nearestHawker.name} (${formatDistance(metricsA.nearestHawker.distanceMeters)})`
                    : 'None nearby'}
                </div>
              </div>

              {/* Portal Search Shortcuts */}
              <div className="pt-2 border-t border-[#243324]/10 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-[#5C695C] uppercase tracking-wider">Live Listings:</span>
                <div className="flex items-center gap-1.5">
                  {metricsA.portalLinks.map((portal) => (
                    <a
                      key={portal.id}
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${portal.badgeBg}`}
                    >
                      <span>{portal.name}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Location B Column */}
            <div className="bg-[#FBF9F5] rounded-3xl p-5 border-2 border-blue-600/30 space-y-4 relative">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-800 text-white">
                    Comparison Location B
                  </span>
                  <h4 className="font-serif font-bold text-base sm:text-lg text-[#243324] mt-2">
                    {locationB.name}
                  </h4>
                  <p className="text-xs text-[#5C695C] line-clamp-1">{locationB.address}</p>
                </div>
                <div className="text-center p-3 rounded-2xl bg-white border border-[#243324]/10 shadow-xs shrink-0">
                  <div className="font-serif font-bold text-2xl text-blue-800">
                    {metricsB.score.overall}
                  </div>
                  <div className="text-[9px] font-bold text-[#5C695C] uppercase">Convenience</div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2 pt-2 border-t border-[#243324]/10 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#243324]/5">
                  <span className="flex items-center gap-1.5 text-[#5C695C]">
                    <Train className="w-3.5 h-3.5 text-blue-600" />
                    <span>Transit Score</span>
                  </span>
                  <span className="font-bold text-[#243324]">{metricsB.score.transit}/100</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#243324]/5">
                  <span className="flex items-center gap-1.5 text-[#5C695C]">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    <span>Hawker &amp; Dining</span>
                  </span>
                  <span className="font-bold text-[#243324]">{metricsB.score.food}/100</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#243324]/5">
                  <span className="flex items-center gap-1.5 text-[#5C695C]">
                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Groceries &amp; Malls</span>
                  </span>
                  <span className="font-bold text-[#243324]">{metricsB.score.groceries}/100</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#243324]/5">
                  <span className="flex items-center gap-1.5 text-[#5C695C]">
                    <School className="w-3.5 h-3.5 text-indigo-600" />
                    <span>MOE Schools</span>
                  </span>
                  <span className="font-bold text-[#243324]">{metricsB.score.schools}/100</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#243324]/5">
                  <span className="flex items-center gap-1.5 text-[#5C695C]">
                    <Trees className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Parks &amp; Nature</span>
                  </span>
                  <span className="font-bold text-[#243324]">{metricsB.score.parks}/100</span>
                </div>
              </div>

              {/* Milestones */}
              <div className="pt-2 border-t border-[#243324]/10 space-y-1.5 text-xs">
                <div className="text-[11px] font-bold text-[#5C695C] uppercase tracking-wider">
                  Proximity &amp; Commute Milestones
                </div>
                <div className="text-xs text-[#243324]">
                  🚆 <strong>{isLrtStation(metricsB.nearestMrt) ? 'Nearest LRT:' : 'Nearest MRT:'}</strong>{' '}
                  {metricsB.nearestMrt
                    ? `${metricsB.nearestMrt.name} (${formatDistance(metricsB.nearestMrt.distanceMeters)}, ~${metricsB.nearestMrt.walkingMinutes} min)`
                    : 'None within 2km'}
                </div>
                {metricsB.cbdCommute && (
                  <div className="text-xs text-[#243324]">
                    💼 <strong>CBD Commute (Raffles Pl):</strong>{' '}
                    <span className="font-bold text-blue-800">~{metricsB.cbdCommute.transitMinutes} min</span> ({metricsB.cbdCommute.distanceKm} km)
                  </div>
                )}
                {metricsB.oneNorthCommute && (
                  <div className="text-xs text-[#243324]">
                    🔬 <strong>One-North Hub:</strong>{' '}
                    <span className="font-bold text-blue-800">~{metricsB.oneNorthCommute.transitMinutes} min</span> transit
                  </div>
                )}
                <div className="text-xs text-[#243324]">
                  🏫 <strong>MOE Schools:</strong>{' '}
                  <span className="font-bold text-indigo-900">{metricsB.schools1kmCount} in 1km</span>{' '}
                  {metricsB.twoTrackSchools2kmCount > 0 && (
                    <span className="text-[10px] text-purple-900 font-bold bg-purple-100 px-1.5 py-0.5 rounded border border-purple-300 ml-1">
                      🏛️ {metricsB.twoTrackSchools2kmCount} Two-Track (2km)
                    </span>
                  )}
                  {metricsB.highRiskSchools1kmCount > 0 && (
                    <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1 rounded border border-rose-200 ml-1">
                      🔥 {metricsB.highRiskSchools1kmCount} High 2C Risk
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#243324]">
                  🍲 <strong>Nearest Hawker:</strong>{' '}
                  {metricsB.nearestHawker
                    ? `${metricsB.nearestHawker.name} (${formatDistance(metricsB.nearestHawker.distanceMeters)})`
                    : 'None nearby'}
                </div>
              </div>

              {/* Portal Search Shortcuts */}
              <div className="pt-2 border-t border-[#243324]/10 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-[#5C695C] uppercase tracking-wider">Live Listings:</span>
                <div className="flex items-center gap-1.5">
                  {metricsB.portalLinks.map((portal) => (
                    <a
                      key={portal.id}
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${portal.badgeBg}`}
                    >
                      <span>{portal.name}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Switch to B Button */}
              <div className="pt-3 border-t border-[#243324]/10">
                <button
                  type="button"
                  onClick={() => {
                    onSwitchToLocation(locationB);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <span>Switch Map to {locationB.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FBF9F5] border-t border-[#243324]/10 flex items-center justify-between text-xs text-[#5C695C]">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>
              {metricsA.score.overall > metricsB.score.overall
                ? `${locationA.name} leads overall by +${metricsA.score.overall - metricsB.score.overall} points.`
                : metricsB.score.overall > metricsA.score.overall
                ? `${locationB.name} leads overall by +${metricsB.score.overall - metricsA.score.overall} points.`
                : 'Both locations are tied in overall convenience!'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#243324] text-white rounded-xl font-semibold hover:bg-black transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
