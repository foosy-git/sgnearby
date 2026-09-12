'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import MapWrapper from '@/components/map/MapWrapper';
import AmenitySidebar from '@/components/sidebar/AmenitySidebar';
import MobileBottomSheet, { SheetSnapState } from '@/components/mobile/MobileBottomSheet';
import MobilePoiPeekCard from '@/components/mobile/MobilePoiPeekCard';
import LocationComparisonModal from '@/components/comparison/LocationComparisonModal';
import HdbResaleModal from '@/components/hdb/HdbResaleModal';
import UraResaleModal from '@/components/ura/UraResaleModal';
import { ALL_AMENITIES } from '@/data/allAmenities';
import { FEATURED_PROPERTIES } from '@/data/featuredProperties';
import { inferPropertyType, isPrivateProperty } from '@/lib/onemap';
import { HdbResaleAnalysis } from '@/lib/hdbResale';
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

  // Mobile POI peek card state (when a marker is tapped on mobile)
  const [selectedPoi, setSelectedPoi] = useState<AmenityWithDistance | null>(null);

  // Mobile multi-snap bottom sheet state: 'peek' (105px) | 'half' (48dvh) | 'full' (90dvh)
  const [mobileSheetState, setMobileSheetState] = useState<SheetSnapState>('peek');

  // Desktop sidebar open state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Comparison modal state
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Active sidebar tab: 'amenities' | 'hdb' | 'ura' | 'living'
  const [activeSidebarTab, setActiveSidebarTab] = useState<'amenities' | 'hdb' | 'ura' | 'living'>('amenities');

  // HDB Resale fullscreen modal open state
  const [isResaleModalOpen, setIsResaleModalOpen] = useState<boolean>(false);
  const [modalHdbData, setModalHdbData] = useState<HdbResaleAnalysis | null>(null);

  // URA Private Property fullscreen modal
  const [isUraResaleModalOpen, setIsUraResaleModalOpen] = useState<boolean>(false);

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
            const matchedFeatured = FEATURED_PROPERTIES.find(
              (p) =>
                (nameParam && p.name.toLowerCase() === nameParam.toLowerCase()) ||
                (postalParam && p.postalCode === postalParam) ||
                (Math.abs(p.lat - lat) < 0.0005 && Math.abs(p.lng - lng) < 0.0005)
            );

            if (matchedFeatured) {
              setSelectedProperty(matchedFeatured);
            } else {
              const inferred = inferPropertyType(nameParam || undefined, undefined, undefined);
              setSelectedProperty({
                id: `url-${Date.now()}`,
                name: nameParam || 'Shared Location',
                address: nameParam || `Singapore (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                lat,
                lng,
                postalCode: postalParam || undefined,
                propertyType: inferred,
              });
            }
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

  // Live Google Places state (on-demand scanning)
  const [livePlaces, setLivePlaces] = useState<Amenity[]>([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [googleQuotaError, setGoogleQuotaError] = useState<string | null>(null);
  const [googleSuccessMsg, setGoogleSuccessMsg] = useState<string | null>(null);

  // Combine static official SG dataset with live Google Places (with safe category-aware deduplication)
  const combinedAmenities = useMemo(() => {
    if (livePlaces.length === 0) {
      return ALL_AMENITIES;
    }

    const result: Amenity[] = [...ALL_AMENITIES];
    for (const live of livePlaces) {
      const isDuplicate = ALL_AMENITIES.some((base) => {
        if (base.category !== live.category) return false;
        const nameMatch =
          live.name.toLowerCase().trim() === base.name.toLowerCase().trim() ||
          live.name.toLowerCase().includes(base.name.toLowerCase().trim()) ||
          base.name.toLowerCase().includes(live.name.toLowerCase().trim());
        const closeProximity =
          Math.abs(live.lat - base.lat) < 0.00025 && Math.abs(live.lng - base.lng) < 0.00025;
        return nameMatch || closeProximity;
      });

      if (!isDuplicate) {
        result.push(live);
      }
    }
    return result;
  }, [livePlaces]);

  // On-demand handler to query Google Places for nearby spots within the walking radius
  const handleSearchLiveGoogle = useCallback(async () => {
    setIsSearchingGoogle(true);
    setGoogleQuotaError(null);
    setGoogleSuccessMsg(null);

    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: selectedProperty.lat,
          lng: selectedProperty.lng,
          radius: walkingRadius,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'QUOTA_EXCEEDED' || res.status === 429) {
          setGoogleQuotaError(
            data.message ||
              'Daily Google Cloud quota limit reached. Your Google Cloud hard quota cap has been triggered to prevent billing charges. Official Singapore open data (OneMap, LTA, MOE, NEA, HDB, URA) remains fully active.'
          );
        } else if (data.error === 'NO_API_KEY') {
          setGoogleQuotaError(
            'Google Places API key is not configured in .env.local (GOOGLE_PLACES_API_KEY). Please add your key to enable live Google scanning.'
          );
        } else {
          setGoogleQuotaError(data.message || 'Google Places live search could not be completed.');
        }
        return;
      }

      if (data.places && Array.isArray(data.places)) {
        if (data.places.length === 0) {
          setGoogleSuccessMsg(`Google Places found no additional new places within ${walkingRadius}m.`);
          setTimeout(() => setGoogleSuccessMsg(null), 4000);
          return;
        }

        setLivePlaces((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = data.places.filter((p: Amenity) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });

        setGoogleSuccessMsg(`Discovered ${data.places.length} live places via Google Places!`);
        setTimeout(() => setGoogleSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      setGoogleQuotaError('Network error connecting to Google Places API.');
    } finally {
      setIsSearchingGoogle(false);
    }
  }, [selectedProperty.lat, selectedProperty.lng, walkingRadius]);

  // Process amenities within active walking radius
  const amenitiesWithDistance = useMemo(() => {
    return processAmenitiesWithDistance(
      combinedAmenities,
      selectedProperty.lat,
      selectedProperty.lng,
      walkingRadius,
      showSchoolRings
    );
  }, [combinedAmenities, selectedProperty.lat, selectedProperty.lng, walkingRadius, showSchoolRings]);

  // Compute live convenience & walkability score
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
    setSelectedPoi(null);

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

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.displayName) {
          setSelectedProperty({
            id: `custom-pin-${Date.now()}`,
            name: data.displayName,
            address: data.address,
            lat,
            lng,
            postalCode: data.postalCode || undefined,
            propertyType: 'Custom Location',
            town: data.town || 'Singapore',
          });
        }
      }
    } catch {}
  }, []);

  // Handle selecting a property from search or featured hotspots
  const handleSelectLocation = useCallback((prop: SelectedProperty) => {
    setSelectedProperty(prop);
    setModalHdbData(null);
    setLocateTarget(null);
    setHighlightedAmenityId(undefined);
    setSelectedPoi(null);
    // If currently viewing a price analytics tab, auto-switch to the corresponding housing dataset
    setActiveSidebarTab((prev) => {
      if (prev === 'hdb' || prev === 'ura') {
        return isPrivateProperty(prop) ? 'ura' : 'hdb';
      }
      return prev;
    });
  }, []);

  // Handle clicking an amenity in sidebar / bottom sheet to fly to & highlight on map
  const handleLocateAmenity = useCallback((amenity: AmenityWithDistance) => {
    setLocateTarget(amenity);
    setHighlightedAmenityId(amenity.id);
    setSelectedPoi(amenity);
    setMobileSheetState((prev) => (prev === 'full' ? 'half' : prev));
  }, []);

  // Handle clicking an amenity marker on the map
  const handleMarkerClick = useCallback((amenity: AmenityWithDistance) => {
    setHighlightedAmenityId(amenity.id);
    setSelectedPoi(amenity);
    // On mobile devices, automatically snap bottom sheet to peek so marker and peek card are completely visible
    setMobileSheetState('peek');
  }, []);

  // Toggle individual category filter
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

  // Handle recentering map back to selected location pin
  const handleRecenter = useCallback(() => {
    setLocateTarget(null);
    setHighlightedAmenityId(undefined);
    setSelectedPoi(null);
  }, []);

  return (
    <div className="h-screen h-[100dvh] w-screen flex flex-col overflow-hidden bg-[#FBF9F5] text-[#243324]">
      {/* Top Navigation: Full desktop bar on >= lg, streamlined + quick-filter rail on < lg */}
      <Navbar
        selectedProperty={selectedProperty}
        onSelectLocation={handleSelectLocation}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        amenitiesCount={amenitiesWithDistance.length}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        isSidebarOpen={isSidebarOpen}
        walkingRadius={walkingRadius}
        setWalkingRadius={setWalkingRadius}
        showSchoolRings={showSchoolRings}
        setShowSchoolRings={setShowSchoolRings}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        amenities={amenitiesWithDistance}
      />

      {/* Main Workspace: Interactive Map & Collapsible Desktop Sidebar / Mobile Sheet */}
      <div className="flex-1 relative flex overflow-hidden w-full h-[calc(100vh-4rem)] sm:h-[calc(100vh-4rem)] min-h-0">
        {/* Map Viewport */}
        <main className="flex-1 relative h-full w-full min-h-0 min-w-0">
          <div className="absolute inset-0 w-full h-full">
            <MapWrapper
              selectedProperty={selectedProperty}
              amenities={amenitiesWithDistance}
              walkingRadius={walkingRadius}
              onSelectWalkingRadius={setWalkingRadius}
              showSchoolRings={showSchoolRings}
              onToggleSchoolRings={() => setShowSchoolRings(!showSchoolRings)}
              selectedCategories={selectedCategories}
              onToggleCategory={handleToggleCategory}
              onSelectCoordinate={handleMapCoordinateSelect}
              locateTarget={locateTarget}
              highlightedAmenityId={highlightedAmenityId}
              onMarkerClick={handleMarkerClick}
              onRecenter={handleRecenter}
              isPoiActive={!!selectedPoi}
              mobileSheetState={mobileSheetState}
              isSidebarOpen={isSidebarOpen}
              onViewResalePrices={() => {
                const targetTab = isPrivateProperty(selectedProperty) ? 'ura' : 'hdb';
                setActiveSidebarTab(targetTab);
                setIsSidebarOpen(true);
                setMobileSheetState('half');
              }}
            />
          </div>

          {/* Desktop-only Reopen Button when Sidebar is collapsed */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="hidden lg:flex absolute top-4 right-4 z-[1000] h-10 bg-[#243324] text-[#FBF9F5] px-3.5 rounded-xl shadow-xl border border-white/20 items-center gap-2 text-xs font-semibold hover:bg-emerald-950 transition-all hover:scale-105 active:scale-95 animate-in fade-in duration-200 cursor-pointer"
              title="Open Neighborhood Explorer"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Neighborhood Explorer</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20">
                {amenitiesWithDistance.length}
              </span>
            </button>
          )}

          {/* Mobile POI Peek Card (Tapped Marker Action Sheet on < lg) */}
          <MobilePoiPeekCard
            poi={selectedPoi}
            selectedProperty={selectedProperty}
            onClose={() => setSelectedPoi(null)}
            onExpandSheet={() => setMobileSheetState('half')}
          />
        </main>

        {/* Desktop-Only Right Sidebar (Hidden on < lg) */}
        <AmenitySidebar
          selectedProperty={selectedProperty}
          amenities={amenitiesWithDistance}
          walkingRadius={walkingRadius}
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
          onOpenResaleModal={(passedData?: HdbResaleAnalysis | null) => {
            if (passedData) setModalHdbData(passedData);
            setIsResaleModalOpen(true);
          }}
          onOpenUraResaleModal={() => setIsUraResaleModalOpen(true)}
          onSearchLiveGoogle={handleSearchLiveGoogle}
          isSearchingGoogle={isSearchingGoogle}
          googleQuotaError={googleQuotaError}
          onClearGoogleError={() => setGoogleQuotaError(null)}
          googleSuccessMsg={googleSuccessMsg}
        />

        {/* Mobile Multi-Snap Bottom Sheet (Hidden on >= lg) */}
        <MobileBottomSheet
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
          onOpenResaleModal={(passedData?: HdbResaleAnalysis | null) => {
            if (passedData) setModalHdbData(passedData);
            setIsResaleModalOpen(true);
          }}
          onOpenUraResaleModal={() => setIsUraResaleModalOpen(true)}
          sheetState={mobileSheetState}
          setSheetState={setMobileSheetState}
          activeTab={activeSidebarTab}
          setActiveTab={setActiveSidebarTab}
          onSearchLiveGoogle={handleSearchLiveGoogle}
          isSearchingGoogle={isSearchingGoogle}
          googleQuotaError={googleQuotaError}
          onClearGoogleError={() => setGoogleQuotaError(null)}
          googleSuccessMsg={googleSuccessMsg}
        />
      </div>

      {/* Full-Screen URA Private Property Analytics Modal */}
      <UraResaleModal
        isOpen={isUraResaleModalOpen}
        onClose={() => setIsUraResaleModalOpen(false)}
        selectedProperty={selectedProperty}
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
        data={modalHdbData}
      />
    </div>
  );
}
