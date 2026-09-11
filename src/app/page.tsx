'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import MapWrapper from '@/components/map/MapWrapper';
import AmenitySidebar from '@/components/sidebar/AmenitySidebar';
import GoogleMapsSyncModal from '@/components/GoogleMapsSyncModal';
import LocationComparisonModal from '@/components/comparison/LocationComparisonModal';
import HdbResaleModal from '@/components/hdb/HdbResaleModal';
import { ALL_AMENITIES } from '@/data/allAmenities';
import { FEATURED_PROPERTIES } from '@/data/featuredProperties';
import {
  SelectedProperty,
  AmenityWithDistance,
  AmenityCategory,
  Amenity,
} from '@/data/types';
import {
  processAmenitiesWithDistance,
  calculateConvenienceScore,
} from '@/lib/geoUtils';
import { Compass } from 'lucide-react';

export default function Home() {
  // Initial selected location: Natura Loft (Bishan)
  const [selectedProperty, setSelectedProperty] = useState<SelectedProperty>(FEATURED_PROPERTIES[1]);

  // Walking radius filter in meters: 400 (5 min), 800 (10 min), 1200 (15 min)
  const [walkingRadius, setWalkingRadius] = useState<number>(800);

  // MOE Primary School 1km & 2km Priority Rings toggle (default: true per user request)
  const [showSchoolRings, setShowSchoolRings] = useState<boolean>(true);

  // Multi-select categories filter: array of active AmenityCategory items
  const [selectedCategories, setSelectedCategories] = useState<AmenityCategory[]>([
    'mrt',
    'bus',
    'mall',
    'supermarket',
    'shopping',
    'food',
    'school',
    'healthcare',
    'park',
    'sports',
  ]);

  // Currently focused / located amenity from sidebar click
  const [locateTarget, setLocateTarget] = useState<AmenityWithDistance | null>(null);
  const [highlightedAmenityId, setHighlightedAmenityId] = useState<string | undefined>(undefined);

  // Mobile sidebar open state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Comparison modal state
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Active sidebar tab: 'amenities' | 'resale'
  const [activeSidebarTab, setActiveSidebarTab] = useState<'amenities' | 'resale'>('amenities');

  // HDB Resale fullscreen modal open state
  const [isResaleModalOpen, setIsResaleModalOpen] = useState<boolean>(false);

  // Google Maps API Live Sync states
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [livePlaces, setLivePlaces] = useState<Amenity[]>([]);
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);

  const isLoaded = useRef(false);

  // Read URL search params on mount, and sync user state changes thereafter
  useEffect(() => {
    if (!isLoaded.current) {
      isLoaded.current = true;
      try {
        const params = new URLSearchParams(window.location.search);
        const latParam = params.get('lat');
        const lngParam = params.get('lng');
        const nameParam = params.get('name');
        const postalParam = params.get('postal');
        const radiusParam = params.get('radius');

        if (latParam && lngParam) {
          const lat = parseFloat(latParam);
          const lng = parseFloat(lngParam);
          if (!isNaN(lat) && !isNaN(lng)) {
            setSelectedProperty({
              id: `url-${Date.now()}`,
              name: nameParam || 'Shared Location',
              address: nameParam || `Singapore (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              lat,
              lng,
              postalCode: postalParam || undefined,
              propertyType: 'Custom Location',
            });
          }
        }
        if (radiusParam) {
          const r = parseInt(radiusParam, 10);
          if (r === 400 || r === 800 || r === 1200) {
            setWalkingRadius(r);
          }
        }
      } catch {}
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      params.set('name', selectedProperty.name);
      params.set('lat', selectedProperty.lat.toFixed(5));
      params.set('lng', selectedProperty.lng.toFixed(5));
      params.set('radius', String(walkingRadius));
      if (selectedProperty.postalCode) {
        params.set('postal', selectedProperty.postalCode);
      } else {
        params.delete('postal');
      }
      const newRelativePathQuery = window.location.pathname + '?' + params.toString();
      window.history.replaceState(null, '', newRelativePathQuery);
    } catch {}
  }, [selectedProperty, walkingRadius]);

  // Load saved Google Places API key from localStorage
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('sg_google_places_api_key');
      if (savedKey) {
        setGoogleApiKey(savedKey);
      }
    } catch {
      // ignore SSR / storage restrictions
    }
  }, []);


  // Save Google Places API key
  const handleSaveGoogleKey = useCallback((key: string) => {
    setGoogleApiKey(key);
    try {
      localStorage.setItem('sg_google_places_api_key', key);
    } catch {}
  }, []);

  // Clear Google Places API key
  const handleClearGoogleKey = useCallback(() => {
    setGoogleApiKey('');
    setLivePlaces([]);
    try {
      localStorage.removeItem('sg_google_places_api_key');
    } catch {}
  }, []);

  // Fetch live places from Google Places API endpoint
  const fetchLivePlaces = useCallback(
    async (lat: number, lng: number, radius: number, key?: string) => {
      const activeKey = key || googleApiKey;
      if (!activeKey) return;

      setIsFetchingLive(true);
      try {
        const res = await fetch('/api/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat,
            lng,
            radius,
            clientKey: activeKey,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.places && Array.isArray(data.places)) {
            setLivePlaces(data.places);
          }
        }
      } catch (err) {
        console.warn('Error fetching live Google Places:', err);
      } finally {
        setIsFetchingLive(false);
      }
    },
    [googleApiKey]
  );

  // Trigger live Google Places fetch whenever location, radius or key changes
  useEffect(() => {
    if (googleApiKey) {
      const timer = setTimeout(() => {
        fetchLivePlaces(selectedProperty.lat, selectedProperty.lng, walkingRadius);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedProperty.lat, selectedProperty.lng, walkingRadius, googleApiKey, fetchLivePlaces]);

  // Combine static official SG dataset with live Google Places (with safe category-aware deduplication)
  const combinedAmenities = useMemo(() => {
    if (livePlaces.length === 0) {
      return ALL_AMENITIES;
    }

    // Always prioritize verified official Singapore infrastructure (Hawker centres, MRT, schools, sports)
    const result: Amenity[] = [...ALL_AMENITIES];
    for (const live of livePlaces) {
      // Only add live place if not a duplicate of verified base amenities
      const isDuplicate = ALL_AMENITIES.some((base) => {
        if (base.category !== live.category) return false;
        const nameMatch =
          live.name.toLowerCase().trim() === base.name.toLowerCase().trim() ||
          live.name.toLowerCase().includes(base.name.toLowerCase().trim()) ||
          base.name.toLowerCase().includes(live.name.toLowerCase().trim());
        const closeProximity =
          Math.abs(live.lat - base.lat) < 0.00022 && Math.abs(live.lng - base.lng) < 0.00022;
        return nameMatch || closeProximity;
      });

      if (!isDuplicate) {
        result.push(live);
      }
    }
    return result;
  }, [livePlaces]);

  // Process amenities within the active walking radius (and up to 2km for schools) for map & sidebar display
  const amenitiesWithDistance = useMemo(() => {
    return processAmenitiesWithDistance(
      combinedAmenities,
      selectedProperty.lat,
      selectedProperty.lng,
      walkingRadius
    );
  }, [combinedAmenities, selectedProperty.lat, selectedProperty.lng, walkingRadius]);

  // Compute live convenience & walkability score across standard urban walkability range (2km)
  const convenienceScore = useMemo(() => {
    const scoringAmenities = processAmenitiesWithDistance(
      combinedAmenities,
      selectedProperty.lat,
      selectedProperty.lng,
      2000
    );
    return calculateConvenienceScore(scoringAmenities);
  }, [combinedAmenities, selectedProperty.lat, selectedProperty.lng]);

  // Handle clicking anywhere on map to drop a pin
  const handleMapCoordinateSelect = useCallback(async (lat: number, lng: number) => {
    setLocateTarget(null);
    setHighlightedAmenityId(undefined);

    // Initial placeholder location
    const fallbackName = `Selected Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    const newLocation: SelectedProperty = {
      id: `custom-pin-${Date.now()}`,
      name: fallbackName,
      address: `Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}`,
      lat,
      lng,
      propertyType: 'Custom Location',
    };
    setSelectedProperty(newLocation);

    // Attempt reverse geocoding via Nominatim to retrieve real Singapore street address
    try {
      const osmReverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(osmReverseUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'SGNearby/1.0' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const road = data.address?.road || data.address?.suburb || '';
          const postcode = data.address?.postcode || '';
          const displayName = road ? `${road}${postcode ? ` (S${postcode})` : ''}` : fallbackName;

          setSelectedProperty({
            id: `custom-pin-${Date.now()}`,
            name: displayName,
            address: data.display_name,
            lat,
            lng,
            postalCode: postcode || undefined,
            propertyType: 'Custom Location',
            town: data.address?.suburb || data.address?.city || 'Singapore',
          });
        }
      }
    } catch {
      // Quiet fallback if offline or timed out
    }
  }, []);

  // Handle selecting a property from search or featured hotspots
  const handleSelectLocation = useCallback((prop: SelectedProperty) => {
    setSelectedProperty(prop);
    setLocateTarget(null);
    setHighlightedAmenityId(undefined);
  }, []);

  // Handle clicking an amenity in the sidebar list to fly to & highlight on map
  const handleLocateAmenity = useCallback((amenity: AmenityWithDistance) => {
    setLocateTarget(amenity);
    setHighlightedAmenityId(amenity.id);
  }, []);

  // Handle clicking an amenity marker on the map
  const handleMarkerClick = useCallback((amenity: AmenityWithDistance) => {
    setHighlightedAmenityId(amenity.id);
  }, []);

  // Toggle individual category filter (used by floating map toolbar and sidebar)
  const handleToggleCategory = useCallback((catId: AmenityCategory) => {
    setSelectedCategories((prev) => {
      const isSupermarketToggle = catId === 'supermarket';
      const isCurrentlySelected =
        prev.includes(catId) || (isSupermarketToggle && prev.includes('shopping'));

      if (isCurrentlySelected) {
        return prev.filter(
          (c) => c !== catId && (!isSupermarketToggle || c !== 'shopping')
        );
      } else {
        return isSupermarketToggle
          ? [...prev, 'supermarket', 'shopping']
          : [...prev, catId];
      }
    });
  }, []);

  // Handle recentering map back to the selected location pin
  const handleRecenter = useCallback(() => {
    setLocateTarget(null);
    setHighlightedAmenityId(undefined);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#FBF9F5] text-[#243324]">
      {/* Sticky Top Navigation with Featured Hotspots & Geolocation */}
      <Navbar
        selectedProperty={selectedProperty}
        onSelectLocation={handleSelectLocation}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        amenitiesCount={amenitiesWithDistance.length}
        onOpenGoogleSync={() => setIsGoogleModalOpen(true)}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        onOpenResale={() => {
          setActiveSidebarTab('resale');
          setIsSidebarOpen(true);
        }}
        isLiveSyncActive={Boolean(googleApiKey)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Workspace: Interactive Map & Collapsible Amenities Sidebar */}
      <div className="flex-1 relative flex overflow-hidden w-full h-[calc(100vh-4rem)] sm:h-[calc(100vh-4rem)] min-h-0">
        {/* Map Viewport */}
        <main className="flex-1 relative h-full w-full min-h-0 min-w-0">
          <div className="absolute inset-0 w-full h-full">
            <MapWrapper
              selectedProperty={selectedProperty}
              amenities={amenitiesWithDistance}
              walkingRadius={walkingRadius}
              showSchoolRings={showSchoolRings}
              selectedCategories={selectedCategories}
              onToggleCategory={handleToggleCategory}
              onSelectCoordinate={handleMapCoordinateSelect}
              locateTarget={locateTarget}
              highlightedAmenityId={highlightedAmenityId}
              onMarkerClick={handleMarkerClick}
              onRecenter={handleRecenter}
              onViewResalePrices={() => {
                setActiveSidebarTab('resale');
                setIsSidebarOpen(true);
              }}
            />
          </div>

          {/* Floating Live Sync Status Indicator */}
          {isFetchingLive && (
            <div className="absolute top-4 left-16 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-emerald-600/30 flex items-center gap-2 text-xs font-semibold text-emerald-900 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Fetching live Google Places...</span>
            </div>
          )}

          {/* Floating Reopen Button when Sidebar is collapsed */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-4 right-4 z-[1000] bg-[#243324] text-[#FBF9F5] px-3.5 py-2.5 rounded-xl shadow-2xl border border-white/20 flex items-center gap-2 text-xs font-semibold hover:bg-emerald-950 transition-all hover:scale-105 animate-in fade-in duration-200"
              title="Open Neighborhood Explorer"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Neighborhood Explorer</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20">
                {amenitiesWithDistance.length}
              </span>
            </button>
          )}
        </main>

        {/* Right Drawer / Sidebar */}
        <AmenitySidebar
          selectedProperty={selectedProperty}
          amenities={amenitiesWithDistance}
          walkingRadius={walkingRadius}
          setWalkingRadius={setWalkingRadius}
          showSchoolRings={showSchoolRings}
          setShowSchoolRings={setShowSchoolRings}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          onLocateAmenity={handleLocateAmenity}
          highlightedAmenityId={highlightedAmenityId}
          convenienceScore={convenienceScore}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          activeSidebarTab={activeSidebarTab}
          setActiveSidebarTab={setActiveSidebarTab}
          onOpenResaleModal={() => setIsResaleModalOpen(true)}
        />
      </div>

      {/* Google Maps Live Sync Configuration Modal */}
      <GoogleMapsSyncModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        apiKey={googleApiKey}
        onSaveKey={handleSaveGoogleKey}
        onClearKey={handleClearGoogleKey}
        isLiveSyncActive={Boolean(googleApiKey)}
      />

      {/* Side-by-Side Location Comparison Modal */}
      <LocationComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        locationA={selectedProperty}
        allAmenities={combinedAmenities}
        onSwitchToLocation={handleSelectLocation}
      />

      {/* Full-Screen HDB Resale Analytics Modal */}
      <HdbResaleModal
        isOpen={isResaleModalOpen}
        onClose={() => setIsResaleModalOpen(false)}
        selectedProperty={selectedProperty}
      />
    </div>
  );
}

