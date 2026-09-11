import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SelectedProperty } from '@/data/types';
import { searchSingaporeLocation, GeocodeResult } from '@/lib/onemap';
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
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SelectedProperty[]>([]);

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

  // Click outside to close dropdowns
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
          // Reverse geocode via Nominatim
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
      },
      (err) => {
        setIsLocatingUser(false);
        console.warn('Geolocation error:', err);
        alert('Could not retrieve your location. Please check your browser location permissions.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [onSelectLocation]);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FBF9F5]/95 backdrop-blur-xl border-b border-[#243324]/10 shadow-xs">
      {/* Top Main Navigation Bar */}
      <div className="w-full h-16 flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#243324] text-[#FBF9F5] flex items-center justify-center shadow-xs">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </div>
          <div>
            <div className="font-serif font-semibold text-base sm:text-lg tracking-tight text-[#243324] flex items-center gap-1.5">
              <span>SG Nearby</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-sans font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Explorer
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-[#5C695C] -mt-0.5">
              See what&apos;s around any Singapore postal code &amp; address
            </p>
          </div>
        </div>

        {/* Search Container */}
        <div className="flex-1 max-w-xl flex items-center gap-1.5 sm:gap-2 min-w-0 mx-1 sm:mx-3">
          <div ref={searchContainerRef} className="relative flex-1 min-w-0">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#5C695C] absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder="Postal code (570273), condo, or MRT..."
                className="w-full pl-8 pr-16 sm:pr-20 py-2 bg-white rounded-xl border border-[#243324]/15 text-xs text-[#243324] placeholder-[#5C695C]/70 shadow-xs focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 transition-all"
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
                    <span className="hidden sm:inline">Near Me</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown Results / Recent Searches */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-[#243324]/15 shadow-2xl overflow-hidden z-[100] max-h-84 overflow-y-auto">
                {/* Search query results */}
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

                {/* Loading state indicator */}
                {isSearching && (
                  <div className="p-4 text-center text-xs text-[#5C695C]">
                    Searching Singapore geocoder...
                  </div>
                )}

                {/* Recent Searches */}
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

        {/* Right Actions: HDB Resale + Compare + Google Live + Mobile Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* HDB Resale Button */}
          {onOpenResale && (
            <button
              onClick={onOpenResale}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-emerald-600/30 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="View Past 3 Years HDB Resale Transactions & Price Analytics"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">HDB Resale (3Y)</span>
            </button>
          )}

          {/* Compare Locations Button */}
          {onOpenCompare && (
            <button
              onClick={onOpenCompare}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-[#243324]/15 bg-white text-[#243324] hover:bg-[#F4EFE6] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Compare with another Singapore location"
            >
              <Scale className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Compare</span>
            </button>
          )}

          {/* Google Maps Live Sync */}
          {onOpenGoogleSync && (
            <button
              onClick={onOpenGoogleSync}
              className={`px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
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
              <span className="hidden md:inline">
                {isLiveSyncActive ? 'Google Live' : 'Google Sync'}
              </span>
            </button>
          )}

          {/* Toggle Sidebar Button (visible on mobile / tablet or when collapsed) */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`lg:hidden p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                isSidebarOpen
                  ? 'bg-[#243324] text-[#FBF9F5] border-[#243324]'
                  : 'bg-white text-[#243324] border-[#243324]/15'
              }`}
              title="Toggle Amenities List"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs" suppressHydrationWarning>{amenitiesCount}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}


