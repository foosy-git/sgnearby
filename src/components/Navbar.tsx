import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SelectedProperty, AmenityCategory, AmenityWithDistance } from '@/data/types';
import { searchSingaporeLocation, GeocodeResult } from '@/lib/onemap';
import { FEATURED_PROPERTIES } from '@/data/featuredProperties';
import {
  MapPin,
  Search,
  Building2,
  X,
  Crosshair,
  History,
  Scale,
  Compass,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Train,
  Utensils,
  GraduationCap,
  ShoppingCart,
  Trees,
  Bus,
} from 'lucide-react';

interface Props {
  selectedProperty?: SelectedProperty;
  onSelectLocation: (property: SelectedProperty) => void;
  onToggleSidebar?: () => void;
  amenitiesCount?: number;
  onOpenGoogleSync?: () => void;
  onOpenCompare?: () => void;
  onOpenResale?: () => void;
  isLiveSyncActive?: boolean;
  isSidebarOpen?: boolean;
  // Mobile Quick Filter props
  walkingRadius?: number;
  setWalkingRadius?: (val: number) => void;
  showSchoolRings?: boolean;
  setShowSchoolRings?: (val: boolean) => void;
  selectedCategories?: AmenityCategory[];
  onToggleCategory?: (cat: AmenityCategory) => void;
  amenities?: AmenityWithDistance[];
}

export default function Navbar({
  selectedProperty,
  onSelectLocation,
  onToggleSidebar,
  amenitiesCount = 0,
  onOpenGoogleSync,
  onOpenCompare,
  onOpenResale,
  isLiveSyncActive = false,
  isSidebarOpen = true,
  walkingRadius = 800,
  setWalkingRadius,
  showSchoolRings = true,
  setShowSchoolRings,
  selectedCategories = [],
  onToggleCategory,
  amenities = [],
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SelectedProperty[]>([]);

  // Mobile dedicated full-screen search modal state
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sg_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch {}
  }, []);

  const saveRecentSearch = (item: SelectedProperty) => {
    try {
      const updated = [item, ...recentSearches.filter((s) => s.name !== item.name)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('sg_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('sg_recent_searches');
    } catch {}
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchSingaporeLocation(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
      setShowDropdown(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close desktop dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (res: GeocodeResult) => {
    const newProp: SelectedProperty = {
      id: `loc-${Date.now()}`,
      name: res.buildingName || res.address.split(',')[0],
      address: res.address,
      lat: res.lat,
      lng: res.lng,
      postalCode: res.postalCode,
      propertyType: res.propertyType || (res.block ? 'HDB' : 'Custom Location'),
      block: res.block,
      streetName: res.roadName,
    };
    saveRecentSearch(newProp);
    onSelectLocation(newProp);
    setSearchQuery('');
    setShowDropdown(false);
    setIsMobileSearchOpen(false);
  };

  // GPS "Near Me" Geolocation handler
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let displayName = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        let address = `Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}`;
        let postalCode: string | undefined;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'User-Agent': 'SGNearby/1.0' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              const road = data.address?.road || data.address?.suburb || '';
              postalCode = data.address?.postcode;
              displayName = road ? `${road}${postalCode ? ` (S${postalCode})` : ''}` : 'My Current Location';
              address = data.display_name;
            }
          }
        } catch {}

        const userProp: SelectedProperty = {
          id: `gps-${Date.now()}`,
          name: displayName,
          address,
          lat,
          lng,
          postalCode,
          propertyType: 'Custom Location',
        };

        saveRecentSearch(userProp);
        onSelectLocation(userProp);
        setIsLocatingUser(false);
        setShowDropdown(false);
        setIsMobileSearchOpen(false);
      },
      (err) => {
        setIsLocatingUser(false);
        console.warn('Geolocation error:', err);
        alert('Could not retrieve your location. Please check your browser location permissions.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [onSelectLocation]);

  // Focus input when mobile search opens
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 100);
    }
  }, [isMobileSearchOpen]);

  // Helper counts for mobile filter chips
  const mrtCount = amenities.filter((a) => a.category === 'mrt').length;
  const foodCount = amenities.filter((a) => a.category === 'food').length;
  const schoolCount = amenities.filter((a) => a.category === 'school').length;
  const superCount = amenities.filter((a) => a.category === 'supermarket' || a.category === 'shopping').length;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FBF9F5]/95 backdrop-blur-xl border-b border-[#243324]/10 shadow-xs">
      {/* ========================================================================= */}
      {/* 1. DESKTOP MAIN NAVIGATION BAR (>= lg: 1024px) - 100% UNTOUCHED           */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex w-full h-16 items-center justify-between gap-3 px-6">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#243324] text-[#FBF9F5] flex items-center justify-center shadow-xs">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="font-serif font-semibold text-lg tracking-tight text-[#243324] flex items-center gap-1.5">
              <span>SG Nearby</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Explorer
              </span>
            </div>
            <p className="text-[11px] text-[#5C695C] -mt-0.5">
              See what&apos;s around any Singapore postal code &amp; address
            </p>
          </div>
        </div>

        {/* Search Container */}
        <div className="flex-1 max-w-xl flex items-center gap-2 min-w-0 mx-3">
          <div ref={searchContainerRef} className="relative flex-1 min-w-0">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#5C695C] absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder="Postal code (570273), condo, or MRT..."
                className="w-full pl-8 pr-20 py-2 bg-white rounded-xl border border-[#243324]/15 text-xs text-[#243324] placeholder-[#5C695C]/70 shadow-xs focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 transition-all"
              />

              {/* Right Search Input Icons */}
              <div className="absolute right-1.5 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-[#5C695C] hover:text-[#243324] rounded-lg cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleLocateMe}
                    disabled={isLocatingUser}
                    className="px-1.5 py-1 text-[#5C695C] hover:text-emerald-800 hover:bg-emerald-50 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Use current GPS location"
                  >
                    <Crosshair className={`w-3.5 h-3.5 text-emerald-700 ${isLocatingUser ? 'animate-spin' : ''}`} />
                    <span>Near Me</span>
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Dropdown Results */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-[#243324]/15 shadow-2xl overflow-hidden z-[100] max-h-84 overflow-y-auto">
                {searchResults.length > 0 && (
                  <div>
                    <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-[#5C695C] bg-[#F4EFE6]/50 border-b border-[#243324]/5">
                      Locations Found
                    </div>
                    {searchResults.map((res, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectResult(res)}
                        className="w-full text-left p-3 hover:bg-[#F4EFE6]/70 border-b border-[#243324]/5 last:border-none flex items-start gap-2.5 transition-colors cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-xs text-[#243324]">
                            {res.buildingName || res.address}
                          </div>
                          <div className="text-[11px] text-[#5C695C] line-clamp-1">{res.address}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {isSearching && (
                  <div className="p-4 text-center text-xs text-[#5C695C]">
                    Searching Singapore geocoder...
                  </div>
                )}

                {!searchQuery && recentSearches.length > 0 && (
                  <div>
                    <div className="p-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[#5C695C] bg-[#F4EFE6]/50 border-b border-[#243324]/5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <History className="w-3 h-3 text-[#5C695C]" />
                        <span>Recent Searches</span>
                      </span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-[10px] font-semibold text-rose-600 hover:underline capitalize cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => {
                          onSelectLocation(rec);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left p-2.5 px-3 hover:bg-[#F4EFE6]/70 border-b border-[#243324]/5 last:border-none flex items-center justify-between gap-2 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs font-medium text-[#243324] truncate">{rec.name}</span>
                        </div>
                        {rec.postalCode && (
                          <span className="text-[10px] text-[#5C695C] font-mono shrink-0">
                            S({rec.postalCode})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Right Actions: HDB Resale + Compare + Google Live */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenResale && (
            <button
              onClick={onOpenResale}
              className="px-3 py-2 rounded-xl border border-emerald-600/30 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="View Past 3 Years HDB Resale Transactions & Price Analytics"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span>HDB Resale (3Y)</span>
            </button>
          )}

          {onOpenCompare && (
            <button
              onClick={onOpenCompare}
              className="px-3 py-2 rounded-xl border border-[#243324]/15 bg-white text-[#243324] hover:bg-[#F4EFE6] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Compare with another Singapore location"
            >
              <Scale className="w-3.5 h-3.5 text-emerald-700" />
              <span>Compare</span>
            </button>
          )}

          {onOpenGoogleSync && (
            <button
              onClick={onOpenGoogleSync}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                isLiveSyncActive
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                  : 'bg-[#F4EFE6] border-[#243324]/10 text-[#243324] hover:bg-[#E8DCC4]'
              }`}
              title="Configure Google Maps API Live Sync"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isLiveSyncActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{isLiveSyncActive ? 'Google Live' : 'Google Sync'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE STREAMLINED NAVBAR (< lg: < 1024px)                             */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex flex-col w-full bg-[#FBF9F5]/98 border-b border-[#243324]/10">
        {/* Top Header Row */}
        <div className="h-14 px-3.5 flex items-center justify-between gap-2">
          {/* Brand & Selected Location Pill */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-[#243324] text-[#FBF9F5] flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-sm tracking-tight text-[#243324]">SG Nearby</span>
                <span className="px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  SG
                </span>
              </div>
              <div className="text-[11px] text-[#5C695C] truncate font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span className="truncate">{selectedProperty?.name || 'Singapore'}</span>
              </div>
            </div>
          </div>

          {/* Mobile Right Actions: Compare + Resale + GPS + Search */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenCompare && (
              <button
                type="button"
                onClick={onOpenCompare}
                className="p-2 rounded-xl bg-white border border-[#243324]/15 text-[#243324] hover:bg-[#F4EFE6] active:scale-95 transition-all shadow-xs"
                title="Compare Locations"
              >
                <Scale className="w-3.5 h-3.5 text-emerald-700" />
              </button>
            )}

            {onOpenResale && (
              <button
                type="button"
                onClick={onOpenResale}
                className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 active:scale-95 transition-all shadow-xs"
                title="HDB Resale (3Y)"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              </button>
            )}

            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocatingUser}
              className="p-2 rounded-xl bg-white border border-[#243324]/15 text-[#243324] hover:bg-[#F4EFE6] active:scale-95 transition-all shadow-xs"
              title="Use GPS Location"
            >
              <Crosshair className={`w-3.5 h-3.5 text-emerald-700 ${isLocatingUser ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-2 rounded-xl bg-[#243324] text-white hover:bg-emerald-950 active:scale-95 transition-all shadow-xs flex items-center gap-1"
              title="Search Address or Postal Code"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Walking Radius Segmented Control (Clean, Full-Width, Zero Truncation) */}
        {setWalkingRadius && (
          <div className="px-3.5 pb-2.5 pt-0.5">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F4EFE6] rounded-xl border border-[#243324]/10">
              {[
                { m: 400, label: '5 min', desc: '400m' },
                { m: 800, label: '10 min', desc: '800m' },
                { m: 1200, label: '15 min', desc: '1.2km' },
              ].map((r) => (
                <button
                  key={r.m}
                  type="button"
                  onClick={() => setWalkingRadius(r.m)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                    walkingRadius === r.m
                      ? 'bg-[#243324] text-white shadow-xs'
                      : 'text-[#5C695C] hover:text-[#243324]'
                  }`}
                >
                  <span>🚶 {r.label}</span>
                  <span className={`text-[10px] font-normal ${walkingRadius === r.m ? 'text-white/80' : 'text-[#5C695C]/75'}`}>
                    ({r.desc})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE FULL-SCREEN SEARCH OVERLAY (< lg: < 1024px)                     */}
      {/* ========================================================================= */}
      {isMobileSearchOpen && (
        <div className="lg:hidden fixed inset-0 z-[9999] bg-[#FBF9F5] flex flex-col animate-in fade-in duration-200">
          {/* Top Search Input Bar */}
          <div className="p-3.5 border-b border-[#243324]/10 bg-white/95 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#5C695C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Postal code (570273), condo, MRT..."
                className="w-full pl-9 pr-8 py-2.5 bg-[#F4EFE6]/60 rounded-xl border border-[#243324]/15 text-xs text-[#243324] placeholder-[#5C695C]/60 focus:outline-none focus:border-emerald-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#5C695C]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchQuery('');
              }}
              className="px-2.5 py-2 text-xs font-bold text-[#243324]"
            >
              Cancel
            </button>
          </div>

          {/* Search Content & Results */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {/* GPS Quick Location Button */}
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocatingUser}
              className="w-full p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center gap-2.5 active:scale-98 transition-all"
            >
              <Crosshair className={`w-4 h-4 text-emerald-700 ${isLocatingUser ? 'animate-spin' : ''}`} />
              <div className="text-left">
                <div className="font-bold">Use Current GPS Location</div>
                <div className="text-[10px] text-emerald-800">Find amenities near where you stand right now</div>
              </div>
            </button>

            {/* Live Search Geocoder Results */}
            {searchResults.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C695C] mb-1.5">
                  Locations Found ({searchResults.length})
                </div>
                <div className="bg-white rounded-2xl border border-[#243324]/10 shadow-xs divide-y divide-[#243324]/5 overflow-hidden">
                  {searchResults.map((res, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectResult(res)}
                      className="w-full text-left p-3 hover:bg-[#F4EFE6]/70 flex items-start gap-2.5 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-xs text-[#243324]">
                          {res.buildingName || res.address}
                        </div>
                        <div className="text-[11px] text-[#5C695C] line-clamp-1">{res.address}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isSearching && (
              <div className="p-4 text-center text-xs text-[#5C695C]">
                Searching Singapore geocoder...
              </div>
            )}

            {/* Recent Searches */}
            {!searchQuery && recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C695C]">
                    Recent Searches
                  </span>
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-[10px] font-semibold text-rose-600 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-[#243324]/10 shadow-xs divide-y divide-[#243324]/5 overflow-hidden">
                  {recentSearches.map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => {
                        onSelectLocation(rec);
                        setIsMobileSearchOpen(false);
                      }}
                      className="w-full text-left p-3 hover:bg-[#F4EFE6]/70 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-medium text-[#243324] truncate">{rec.name}</span>
                      </div>
                      {rec.postalCode && (
                        <span className="text-[10px] text-[#5C695C] font-mono shrink-0">
                          S({rec.postalCode})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Singapore Hotspots */}
            {!searchQuery && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C695C] mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Featured Hotspots</span>
                </div>
                <div className="bg-white rounded-2xl border border-[#243324]/10 shadow-xs divide-y divide-[#243324]/5 overflow-hidden">
                  {FEATURED_PROPERTIES.slice(0, 6).map((prop) => (
                    <button
                      key={prop.id}
                      type="button"
                      onClick={() => {
                        onSelectLocation(prop);
                        setIsMobileSearchOpen(false);
                      }}
                      className="w-full text-left p-3 hover:bg-[#F4EFE6]/70 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-[#243324]">{prop.name}</div>
                        <div className="text-[10px] text-[#5C695C] truncate">{prop.town || prop.address}</div>
                      </div>
                      {prop.postalCode && (
                        <span className="text-[10px] text-emerald-800 font-mono font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                          S({prop.postalCode})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
