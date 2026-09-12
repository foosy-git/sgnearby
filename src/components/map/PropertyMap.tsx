'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AmenityWithDistance,
  SelectedProperty,
  AmenityCategory,
} from '@/data/types';
import { MRT_LINES, isLrtStation } from '@/data/mrtStations';
import { getGoogleMapsWalkUrl, formatDistance } from '@/lib/geoUtils';
import {
  Navigation,
  ExternalLink,
  LocateFixed,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Train,
  Bus,
  Utensils,
  Building2,
  Building,
  ShoppingCart,
  GraduationCap,
  Trees,
  SlidersHorizontal,
  Check,
  TrendingUp,
  Clock,
  Info,
} from 'lucide-react';
import { isPrivateProperty } from '@/lib/onemap';

// Custom Map Controller to smoothly fly/pan when selectedProperty or locateAmenity changes
function MapViewController({
  selectedProperty,
  locateTarget,
  showSchoolRings,
  walkingRadius,
}: {
  selectedProperty: SelectedProperty;
  locateTarget?: AmenityWithDistance | null;
  showSchoolRings?: boolean;
  walkingRadius?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (locateTarget) {
      map.flyTo([locateTarget.lat, locateTarget.lng], 16, { duration: 0.8 });
    } else {
      const isMobile = map.getSize().x < 768;
      // At zoom 13.7 on mobile, the 4,000m diameter (2km radius) ring fits within the viewport with margin
      let targetZoom = showSchoolRings ? (isMobile ? 13.7 : 14.2) : 15;
      if (!showSchoolRings && walkingRadius) {
        if (walkingRadius <= 400) targetZoom = isMobile ? 15.3 : 15.7;
        else if (walkingRadius <= 800) targetZoom = isMobile ? 14.7 : 15.1;
        else targetZoom = isMobile ? 14.1 : 14.5;
      }
      map.flyTo([selectedProperty.lat, selectedProperty.lng], targetZoom, { duration: 0.8 });
    }
  }, [selectedProperty, locateTarget, showSchoolRings, walkingRadius, map]);

  return null;
}

// Interactive Recenter Button directly integrated with Leaflet map instance
function RecenterMapButton({
  targetLat,
  targetLng,
  onRecenter,
  isSidebarOpen = true,
}: {
  targetLat: number;
  targetLng: number;
  onRecenter?: () => void;
  isSidebarOpen?: boolean;
}) {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onRecenter) {
      onRecenter();
    }
    map.flyTo([targetLat, targetLng], 15, { duration: 0.8 });
  };

  return (
    <div
      ref={containerRef}
      style={{ pointerEvents: 'auto' }}
      className={`custom-map-overlay absolute ${
        !isSidebarOpen
          ? 'top-3 right-3 sm:top-4 sm:right-4 lg:top-[4.75rem] lg:right-4'
          : 'top-3 right-3 sm:top-4 sm:right-4'
      } z-[1000] transition-all duration-200 animate-in fade-in`}
    >
      <button
        type="button"
        onClick={handleClick}
        className="h-10 bg-white/95 backdrop-blur-md px-3 rounded-xl shadow-md border border-[#243324]/15 hover:bg-[#F4EFE6] text-[#243324] transition-all flex items-center gap-1.5 text-xs font-semibold hover:scale-105 active:scale-95 cursor-pointer"
        title="Recenter map on selected home pin"
      >
        <LocateFixed className="w-3.5 h-3.5 text-emerald-700" />
        <span className="hidden sm:inline">Center Pin</span>
      </button>
    </div>
  );
}

// Automatically invalidate map size when container is ready or resized
function MapSizeInvalidator() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const container = map.getContainer();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [map]);
  return null;
}

// Click listener to drop pin anywhere on map (guarded against clicks on buttons & overlays)
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const originalTarget = e.originalEvent?.target as HTMLElement | null;
      if (
        originalTarget &&
        (originalTarget.closest('button') ||
          originalTarget.closest('.custom-map-overlay') ||
          originalTarget.closest('.leaflet-popup') ||
          originalTarget.closest('.leaflet-control'))
      ) {
        return;
      }
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}


// Modern, Representative Category Icon Generator for Leaflet DivIcon
function createAmenityIcon(category: AmenityCategory, isHighlighted: boolean, isTwoTrack?: boolean) {
  let gradient = 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)';
  let svgContent = '';

  switch (category) {
    case 'mrt':
      gradient = 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)';
      // Modern front-facing metro/subway train with headlights and rails
      svgContent = `
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="3" width="16" height="15" rx="3" fill="white" fill-opacity="0.18"></rect>
          <line x1="4" y1="10" x2="20" y2="10"></line>
          <circle cx="8" cy="14" r="1.3" fill="white"></circle>
          <circle cx="16" cy="14" r="1.3" fill="white"></circle>
          <path d="M6 18l-2 3M18 18l2 3M9 18h6"></path>
        </svg>`;
      break;

    case 'bus':
      gradient = 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)';
      // Double-decker / transit bus with destination display and dual windows
      svgContent = `
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="3" width="16" height="16" rx="2.5" fill="white" fill-opacity="0.15"></rect>
          <line x1="4" y1="8" x2="20" y2="8"></line>
          <line x1="4" y1="13" x2="20" y2="13"></line>
          <circle cx="8" cy="16" r="1.2" fill="white"></circle>
          <circle cx="16" cy="16" r="1.2" fill="white"></circle>
          <path d="M6 19v2M18 19v2"></path>
        </svg>`;
      break;

    case 'food':
      gradient = 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)';
      // Fork and Spoon side-by-side
      svgContent = `
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"></path>
          <path d="M15 2v18"></path>
          <path d="M6 2v20"></path>
          <path d="M3 2v6a3 3 0 0 0 6 0V2"></path>
        </svg>`;
      break;

    case 'mall':
      gradient = 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)';
      // Modern Multi-Storey Shopping Mall Building with Entrance Arch
      svgContent = `
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"></path>
          <path d="M5 21V7l7-4 7 4v14" fill="white" fill-opacity="0.15"></path>
          <path d="M9 21v-5a3 3 0 0 1 6 0v5"></path>
          <path d="M9 10h.01M15 10h.01M9 13h.01M15 13h.01" stroke-width="2.5"></path>
        </svg>`;
      break;

    case 'supermarket':
    case 'shopping':
      gradient = 'linear-gradient(135deg, #10B981 0%, #0D9488 100%)';
      // Shopping trolley / cart
      svgContent = `
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="8" cy="21" r="1.5"></circle>
          <circle cx="19" cy="21" r="1.5"></circle>
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
        </svg>`;
      break;

    case 'school':
      gradient = isTwoTrack
        ? 'linear-gradient(135deg, #9333EA 0%, #6B21A8 100%)'
        : 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)';
      // Academic graduation mortarboard cap with tassel
      svgContent = `
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" fill="white" fill-opacity="0.15"></path>
          <path d="M6 12.5v4.5c3 3 9 3 12 0v-4.5"></path>
        </svg>`;
      break;

    case 'healthcare':
      gradient = 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)';
      // Medical first-aid cross with rounded geometry
      svgContent = `
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" fill="white" fill-opacity="0.15"></rect>
          <path d="M12 7.5v9M7.5 12h9" stroke-width="2.6"></path>
        </svg>`;
      break;

    case 'park':
      gradient = 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)';
      // Twin evergreen park trees
      svgContent = `
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 3L5 12h3v6h6v-6h3L11 3z" fill="white" fill-opacity="0.15"></path>
          <path d="M16 11l4 5h-2.5v3H16v-3h-2l3-5z" opacity="0.85"></path>
        </svg>`;
      break;

    case 'sports':
      gradient = 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
      // Athletic Dumbbell / Weights
      svgContent = `
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6.5 6.5h11M6.5 17.5h11M6 4v16M18 4v16M3 8v8M21 8v8M6 12h12"></path>
        </svg>`;
      break;
  }

  const ringStyle = isHighlighted
    ? 'border: 3px solid #064E3B; box-shadow: 0 0 0 7px rgba(16, 185, 129, 0.45), 0 8px 16px rgba(0,0,0,0.3); transform: scale(1.25);'
    : isTwoTrack
    ? 'border: 2.5px solid #F3E8FF; box-shadow: 0 0 0 2px #A855F7, 0 4px 10px rgba(0, 0, 0, 0.22);'
    : 'border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.22), 0 2px 4px rgba(0, 0, 0, 0.1);';

  const html = `
    <div style="
      background: ${gradient};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      ${ringStyle}
    ">
      ${svgContent}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-amenity-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

// In-memory icon cache to eliminate DOM recreation churn during pan/zoom/filter
const amenityIconCache = new Map<string, L.DivIcon>();

export function getOrCreateAmenityIcon(
  category: AmenityCategory,
  isHighlighted = false,
  isTwoTrack = false
): L.DivIcon {
  const key = `${category}-${isHighlighted ? 1 : 0}-${isTwoTrack ? 1 : 0}`;
  let icon = amenityIconCache.get(key);
  if (!icon) {
    icon = createAmenityIcon(category, isHighlighted, isTwoTrack);
    amenityIconCache.set(key, icon);
  }
  return icon;
}

// Selected Location Marker: Teardrop Pin with Pulsing Radar Beacon
function createPropertyPinIcon(name: string) {
  const html = `
    <div style="position: relative; width: 44px; height: 56px; display: flex; align-items: center; justify-content: center;">
      <!-- Ground Radar Pulse Ring -->
      <div class="beacon-ring" style="
        position: absolute;
        bottom: 2px;
        left: 2px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: rgba(16, 185, 129, 0.4);
      "></div>
      
      <!-- Modern Teardrop Pin -->
      <div style="position: relative; z-index: 10; width: 40px; height: 50px; filter: drop-shadow(0 6px 12px rgba(23, 34, 23, 0.35));">
        <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pinDarkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2D3F2D" />
              <stop offset="100%" stop-color="#141E14" />
            </linearGradient>
          </defs>
          <!-- Pin Body -->
          <path d="M20 0C8.954 0 0 8.954 0 20C0 32.5 20 50 20 50C20 50 40 32.5 40 20C40 8.954 31.046 0 20 0Z" fill="url(#pinDarkGrad)" stroke="#FFFFFF" stroke-width="2.5" />
          <!-- Inner Circle -->
          <circle cx="20" cy="19" r="13" fill="#1C271C" />
          <!-- House Icon -->
          <path d="M14 21.5L20 15.5L26 21.5V25H22.5V21H17.5V25H14V21.5Z" fill="#34D399" />
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'property-pin-marker',
    iconSize: [44, 56],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
  });
}

interface Props {
  selectedProperty: SelectedProperty;
  amenities: AmenityWithDistance[];
  walkingRadius: number; // meters
  onSelectWalkingRadius?: (radius: number) => void;
  showSchoolRings: boolean;
  selectedCategory?: 'all' | AmenityCategory;
  selectedCategories?: AmenityCategory[];
  onToggleCategory?: (cat: AmenityCategory) => void;
  onSelectCoordinate: (lat: number, lng: number) => void;
  locateTarget?: AmenityWithDistance | null;
  highlightedAmenityId?: string;
  onMarkerClick: (amenity: AmenityWithDistance) => void;
  onRecenter?: () => void;
  onViewResalePrices?: () => void;
  onToggleSchoolRings?: () => void;
  isPoiActive?: boolean;
  mobileSheetState?: 'peek' | 'half' | 'full';
  isSidebarOpen?: boolean;
}

export default function PropertyMap({
  selectedProperty,
  amenities,
  walkingRadius,
  onSelectWalkingRadius,
  showSchoolRings,
  selectedCategory,
  selectedCategories,
  onToggleCategory,
  onSelectCoordinate,
  locateTarget,
  highlightedAmenityId,
  onMarkerClick,
  onRecenter,
  onViewResalePrices,
  onToggleSchoolRings,
  isPoiActive,
  mobileSheetState,
  isSidebarOpen = true,
}: Props) {
  const propertyPinIcon = useMemo(
    () => createPropertyPinIcon(selectedProperty.name),
    [selectedProperty.name]
  );

  // Find currently highlighted amenity to draw direct line
  const highlightedAmenity = useMemo(() => {
    return amenities.find((a) => a.id === highlightedAmenityId);
  }, [amenities, highlightedAmenityId]);

  // Filter amenities to display on map based on category selection
  const visibleAmenities = useMemo(() => {
    if (selectedCategories && Array.isArray(selectedCategories)) {
      if (selectedCategories.length === 0) return [];
      return amenities.filter((a) => {
        if (selectedCategories.includes(a.category)) return true;
        if (a.category === 'shopping' && (selectedCategories.includes('supermarket') || selectedCategories.includes('mall'))) return true;
        return false;
      });
    }
    if (selectedCategory && selectedCategory !== 'all') {
      return amenities.filter((a) => a.category === selectedCategory);
    }
    return amenities;
  }, [amenities, selectedCategories, selectedCategory]);

  const [mapStyle, setMapStyle] = React.useState<'onemap' | 'onemap-grey' | 'osm'>('osm');
  const [isLegendOpen, setIsLegendOpen] = React.useState(false);
  const [isMapStyleOpen, setIsMapStyleOpen] = React.useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = React.useState(false);
  const [isRadiusOpen, setIsRadiusOpen] = React.useState(false);
  const [isSchoolInfoOpen, setIsSchoolInfoOpen] = React.useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setIsMapStyleOpen(false);
        setIsCategoryOpen(false);
        setIsRadiusOpen(false);
        setIsSchoolInfoOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent Leaflet map click events when interacting with dropdown toolbar
  useEffect(() => {
    if (toolbarRef.current) {
      L.DomEvent.disableClickPropagation(toolbarRef.current);
      L.DomEvent.disableScrollPropagation(toolbarRef.current);
    }
  }, []);

  const tileConfig = useMemo(() => {
    switch (mapStyle) {
      case 'onemap-grey':
        return {
          url: 'https://www.onemap.gov.sg/maps/tiles/Grey/{z}/{x}/{y}.png',
          attribution: '&copy; OneMap | Singapore Land Authority',
          maxZoom: 19,
        };
      case 'osm':
        return {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        };
      case 'onemap':
      default:
        return {
          url: 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png',
          attribution: '&copy; OneMap | Singapore Land Authority',
          maxZoom: 19,
        };
    }
  }, [mapStyle]);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={[selectedProperty.lat, selectedProperty.lng]}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: '100%', width: '100%' }}
      >
        {/* Singapore Official OneMap / OSM Tiles */}
        <TileLayer
          key={mapStyle}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          maxZoom={tileConfig.maxZoom}
        />

        {/* Dynamic map events & camera controller */}
        <MapViewController
          selectedProperty={selectedProperty}
          locateTarget={locateTarget}
          showSchoolRings={showSchoolRings}
          walkingRadius={walkingRadius}
        />
        <MapSizeInvalidator />
        <MapClickHandler onMapClick={onSelectCoordinate} />

        {/* Floating Center Pin Button */}
        <RecenterMapButton
          targetLat={selectedProperty.lat}
          targetLng={selectedProperty.lng}
          onRecenter={onRecenter}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Selected Property Pin */}
        <Marker
          position={[selectedProperty.lat, selectedProperty.lng]}
          icon={propertyPinIcon}
          zIndexOffset={1000}
        >
          <Popup>
            <div className="p-3 max-w-xs space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#243324] text-[#FBF9F5]">
                  {selectedProperty.propertyType || 'Location'}
                </span>
                {selectedProperty.postalCode && (
                  <span className="text-[11px] font-semibold text-[#5C695C]">
                    S({selectedProperty.postalCode})
                  </span>
                )}
              </div>
              <div className="font-serif font-bold text-sm text-[#243324] leading-snug break-words">
                {selectedProperty.name}
              </div>
              <p className="text-xs text-[#5C695C] break-words leading-relaxed">{selectedProperty.address}</p>
              {onViewResalePrices && (() => {
                const isPrivate = isPrivateProperty(selectedProperty);
                return (
                  <div className="pt-2 mt-1 border-t border-[#243324]/10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewResalePrices();
                      }}
                      className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                        isPrivate
                          ? 'bg-amber-700 hover:bg-amber-800 !text-white'
                          : 'bg-emerald-800 hover:bg-emerald-900 !text-white'
                      }`}
                    >
                      {isPrivate ? (
                        <>
                          <Building2 className="w-3.5 h-3.5 !text-amber-200" />
                          <span className="!text-white font-medium">View Private Property Prices</span>
                        </>
                      ) : (
                        <>
                          <Building className="w-3.5 h-3.5 !text-emerald-200" />
                          <span className="!text-white font-medium">View Past 5Y HDB Resale Prices</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })()}
            </div>
          </Popup>
        </Marker>

        {/* Dynamic Walking Radius Isochrone Circle */}
        <Circle
          center={[selectedProperty.lat, selectedProperty.lng]}
          radius={walkingRadius}
          pathOptions={{
            color: '#059669',
            fillColor: '#10B981',
            fillOpacity: 0.08,
            weight: 2,
            dashArray: '5, 5',
          }}
        />

        {/* Visual Walking Connector Ray between Selected Property and Highlighted Amenity */}
        {highlightedAmenity && (
          <Polyline
            positions={[
              [selectedProperty.lat, selectedProperty.lng],
              [highlightedAmenity.lat, highlightedAmenity.lng],
            ]}
            pathOptions={{
              color: '#059669',
              weight: 3.5,
              dashArray: '6, 8',
              opacity: 0.9,
            }}
          />
        )}


        {/* Dedicated MOE Primary School 1km & 2km Priority Rings (Clean outlines, zero fill) */}
        {showSchoolRings && (
          <>
            {/* 1km Ring (Strict Priority Zone) - Clean High-Contrast Blue */}
            <Circle
              center={[selectedProperty.lat, selectedProperty.lng]}
              radius={1000}
              pathOptions={{
                color: '#2563EB',
                fill: false,
                weight: 2,
                dashArray: '6, 6',
                opacity: 0.85,
              }}
            />
            {/* 2km Ring (Secondary Priority Zone) - Vivid High-Contrast Orange */}
            <Circle
              center={[selectedProperty.lat, selectedProperty.lng]}
              radius={2000}
              pathOptions={{
                color: '#EA580C',
                fill: false,
                weight: 2,
                dashArray: '6, 6',
                opacity: 0.85,
              }}
            />
          </>
        )}

        {/* Highlighted Two-Track School 2km Catchment Ring */}
        {highlightedAmenity &&
          highlightedAmenity.category === 'school' &&
          highlightedAmenity.isTwoTrackScheme && (
            <Circle
              center={[highlightedAmenity.lat, highlightedAmenity.lng]}
              radius={2000}
              pathOptions={{
                color: '#9333EA',
                fillColor: '#A855F7',
                fillOpacity: 0.08,
                weight: 2.5,
                dashArray: '8, 6',
                opacity: 0.95,
              }}
            />
          )}

        {/* Amenity POI Markers */}
        {visibleAmenities.map((amenity) => {
          const isHighlighted = highlightedAmenityId === amenity.id;
          const icon = getOrCreateAmenityIcon(amenity.category, isHighlighted, amenity.isTwoTrackScheme);
          const gmapsUrl = getGoogleMapsWalkUrl(
            selectedProperty.lat,
            selectedProperty.lng,
            amenity.lat,
            amenity.lng,
            amenity.name
          );

          return (
            <Marker
              key={amenity.id}
              position={[amenity.lat, amenity.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick(amenity),
              }}
            >
              <Popup autoPan={false}>
                <div className="p-3 space-y-2 min-w-[220px]">
                  {/* Category & Distance Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C695C]">
                      {amenity.category.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ~{formatDistance(amenity.distanceMeters)} (~{amenity.walkingMinutes} min)
                    </span>
                  </div>

                  {/* Amenity Name */}
                  <div className="font-serif font-bold text-sm text-[#243324] leading-snug">
                    {amenity.name}
                  </div>

                  {/* Details */}
                  {amenity.details?.lines && (
                    <div className="flex flex-wrap items-center gap-1">
                      {amenity.category === 'bus' ? (
                        <>
                          {amenity.details.stationCode && (
                            <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                              Stop #{amenity.details.stationCode}
                            </span>
                          )}
                          <span className="text-[10px] text-[#5C695C] mr-0.5 font-medium">Buses:</span>
                          {amenity.details.lines.map((busNo) => (
                            <span
                              key={busNo}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-200"
                            >
                              {busNo}
                            </span>
                          ))}
                        </>
                      ) : (
                        <>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold mr-1 border ${
                              isLrtStation(amenity)
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            {isLrtStation(amenity) ? 'LRT' : 'MRT'}
                          </span>
                          {amenity.details.lines.map((line) => {
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
                          })}
                          {amenity.details.stationCode && (
                            <span className="text-xs text-slate-500 font-medium ml-1">
                              ({amenity.details.stationCode})
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {amenity.category === 'food' && amenity.details?.cuisine && (
                    <div className="text-xs text-[#5C695C]">{amenity.details.cuisine}</div>
                  )}

                  {amenity.details?.schoolLevel && (
                    <div className="text-xs text-indigo-800 font-semibold flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                        {amenity.details.schoolLevel} School
                      </span>
                      {amenity.details.schoolType && (
                        <span className="text-[11px] text-indigo-700">({amenity.details.schoolType})</span>
                      )}
                    </div>
                  )}

                  {amenity.details?.schoolGender && amenity.details.schoolGender !== 'Co-ed' && (
                    <div className="text-[10px] text-purple-700 font-medium">
                      {amenity.details.schoolGender} School
                    </div>
                  )}

                  {!amenity.details?.schoolLevel && amenity.details?.schoolType && (
                    <div className="text-xs text-indigo-700 font-medium">
                      {amenity.details.schoolType}
                    </div>
                  )}

                  {amenity.details?.sportsType && (
                    <div className="text-xs text-orange-700 font-medium">
                      {amenity.details.sportsType}
                    </div>
                  )}

                  {amenity.details?.hawkerType ? (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        ⭐ {amenity.details.hawkerType} {amenity.details.stallsCount ? `(${amenity.details.stallsCount} stalls)` : ''}
                      </span>
                    </div>
                  ) : amenity.details?.foodType && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        {amenity.details.foodType}
                      </span>
                    </div>
                  )}

                  {amenity.category === 'mall' && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                        🏬 {amenity.details?.mallType || 'Shopping Mall'}
                      </span>
                    </div>
                  )}

                  {(amenity.category === 'supermarket' || amenity.category === 'shopping') && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        🛒 Supermarket / Groceries
                      </span>
                    </div>
                  )}

                  {amenity.category === 'school' && (amenity.details?.schoolLevel === 'Primary' || !amenity.details?.schoolLevel) && (
                    <div className="mt-1.5 flex items-center gap-1">
                      {(amenity.schoolPriority === '1km' || amenity.distanceMeters <= 1000) ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-300">
                          Within 1km
                        </span>
                      ) : (amenity.schoolPriority === '2km' || amenity.distanceMeters <= 2000) ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                          1km - 2km
                        </span>
                      ) : null}
                    </div>
                  )}

                  {/* Directions Button (Google Maps Walking directions) */}
                  <div className="pt-2 mt-1 border-t border-[#243324]/10">
                    <a
                      href={gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#FFFFFF', textDecoration: 'none' }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-800 hover:bg-emerald-900 !text-white rounded-xl text-xs font-semibold transition-all shadow-xs hover:shadow-md active:scale-[0.99] border border-emerald-900/30 group"
                    >
                      <Navigation className="w-3.5 h-3.5 !text-emerald-200 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="!text-white font-medium tracking-wide">Walking route on Google Maps</span>
                      <ExternalLink className="w-3 h-3 !text-emerald-200 shrink-0 ml-0.5 opacity-90" />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Top Map Action Toolbar: Basemap Style Dropdown & Category Filter Dropdown */}
      <div
        ref={toolbarRef}
        className="custom-map-overlay absolute top-3 left-12 sm:top-4 sm:left-16 z-[1000] flex items-center gap-1.5 sm:gap-2 max-w-[calc(100vw-110px)] sm:max-w-none overflow-visible no-scrollbar py-0.5"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Basemap Style Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMapStyleOpen((prev) => !prev);
              setIsCategoryOpen(false);
              setIsRadiusOpen(false);
            }}
            className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-[#243324]/15 hover:bg-[#F4EFE6] text-[#243324] transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Select basemap layer style"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="hidden sm:inline">
              {mapStyle === 'osm' ? 'OpenStreetMap' : mapStyle === 'onemap' ? 'OneMap Color' : 'OneMap Minimal'}
            </span>
            <span className="sm:hidden">
              {mapStyle === 'osm' ? 'OSM' : 'OneMap'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#5C695C] transition-transform duration-200 ${isMapStyleOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMapStyleOpen && (
            <div className="absolute left-0 mt-1.5 w-48 bg-white/98 backdrop-blur-md rounded-xl shadow-xl border border-[#243324]/15 py-1 z-[1100] animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5C695C] border-b border-[#243324]/10">
                Basemap Layer
              </div>
              {[
                { id: 'osm' as const, label: 'OpenStreetMap', desc: 'Global Street Map', emoji: '🗺️' },
                { id: 'onemap' as const, label: 'OneMap Color', desc: 'Official SLA Detailed', emoji: '🇸🇬' },
                { id: 'onemap-grey' as const, label: 'OneMap Minimal', desc: 'Monochrome Grayscale', emoji: '⚪' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMapStyle(style.id);
                    setIsMapStyleOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#F4EFE6] transition-colors ${
                    mapStyle === style.id ? 'bg-emerald-50/80 font-bold text-[#243324]' : 'text-[#243324]/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{style.emoji}</span>
                    <div>
                      <div className="text-xs">{style.label}</div>
                      <div className="text-[10px] text-[#5C695C]">{style.desc}</div>
                    </div>
                  </div>
                  {mapStyle === style.id && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Walking Radius Dropdown Selector (Hidden on < sm because mobile navbar already has permanent segmented controls) */}
        {onSelectWalkingRadius && (
          <div className="relative hidden sm:block shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsRadiusOpen((prev) => !prev);
                setIsMapStyleOpen(false);
                setIsCategoryOpen(false);
              }}
              className={`bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                isRadiusOpen
                  ? 'border-emerald-700/40 bg-[#F4EFE6] text-[#243324]'
                  : 'border-[#243324]/15 hover:bg-[#F4EFE6] text-[#243324]'
              }`}
              title="Select walking radius threshold"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="hidden sm:inline">
                {walkingRadius === 400
                  ? '5 mins (400m)'
                  : walkingRadius === 800
                  ? '10 mins (800m)'
                  : '15 mins (1.2km)'}
              </span>
              <span className="sm:hidden">
                {walkingRadius === 400
                  ? '5 mins'
                  : walkingRadius === 800
                  ? '10 mins'
                  : '15 mins'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#5C695C] transition-transform duration-200 ${
                  isRadiusOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isRadiusOpen && (
              <div className="absolute left-0 mt-1.5 w-52 bg-white/98 backdrop-blur-md rounded-xl shadow-xl border border-[#243324]/15 py-1 z-[1100] animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5C695C] border-b border-[#243324]/10">
                  Walking Radius
                </div>
                {[
                  { meters: 400, label: '5 mins', distance: '400m', desc: 'Quick stroll' },
                  { meters: 800, label: '10 mins', distance: '800m', desc: 'Standard walk' },
                  { meters: 1200, label: '15 mins', distance: '1.2km', desc: 'Extended range' },
                ].map((opt) => (
                  <button
                    key={opt.meters}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectWalkingRadius(opt.meters);
                      setIsRadiusOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#F4EFE6] transition-colors cursor-pointer ${
                      walkingRadius === opt.meters
                        ? 'bg-emerald-50/80 font-bold text-[#243324]'
                        : 'text-[#243324]/80'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">
                        {opt.label}{' '}
                        <span className="text-[11px] font-normal text-[#5C695C]">
                          ({opt.distance})
                        </span>
                      </div>
                      <div className="text-[10px] text-[#5C695C]">{opt.desc}</div>
                    </div>
                    {walkingRadius === opt.meters && (
                      <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Filter Dropdown */}
        {selectedCategories && onToggleCategory && (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCategoryOpen((prev) => !prev);
                setIsMapStyleOpen(false);
                setIsRadiusOpen(false);
              }}
              className={`bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                isCategoryOpen || selectedCategories.length > 0
                  ? 'border-emerald-700/30 text-[#243324]'
                  : 'border-[#243324]/15 text-[#5C695C]'
              } hover:bg-[#F4EFE6]`}
              title="Filter visible amenity categories on map"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Categories</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {selectedCategories.filter((c) => c !== 'shopping').length}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#5C695C] transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoryOpen && (
              <div className="absolute left-0 mt-1.5 w-56 bg-white/98 backdrop-blur-md rounded-xl shadow-xl border border-[#243324]/15 py-1.5 z-[1100] animate-in fade-in slide-in-from-top-2 duration-150 max-h-[70vh] overflow-y-auto">
                <div className="px-3 py-1 flex items-center justify-between border-b border-[#243324]/10 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C695C]">
                    Filter Categories
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Select all
                        (['mrt', 'bus', 'food', 'mall', 'supermarket', 'school', 'park'] as AmenityCategory[]).forEach((cat) => {
                          if (!selectedCategories.includes(cat)) {
                            onToggleCategory(cat);
                          }
                        });
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Deselect all
                        selectedCategories.forEach((cat) => {
                          onToggleCategory(cat);
                        });
                      }}
                      className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="py-1">
                  {[
                    { id: 'mrt' as AmenityCategory, label: 'MRT Stations', icon: Train },
                    { id: 'bus' as AmenityCategory, label: 'Bus Stops', icon: Bus },
                    { id: 'food' as AmenityCategory, label: 'Hawker & Food', icon: Utensils },
                    { id: 'mall' as AmenityCategory, label: 'Shopping Malls', icon: Building2 },
                    { id: 'supermarket' as AmenityCategory, label: 'Supermarkets', icon: ShoppingCart },
                    { id: 'school' as AmenityCategory, label: 'Schools', icon: GraduationCap },
                    { id: 'park' as AmenityCategory, label: 'Parks & Nature', icon: Trees },
                  ].map((item) => {
                    const isCatSelected =
                      selectedCategories.includes(item.id) ||
                      (item.id === 'supermarket' && selectedCategories.includes('shopping'));
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCategory(item.id);
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#F4EFE6] transition-colors cursor-pointer ${
                          isCatSelected ? 'text-[#243324] font-medium' : 'text-[#5C695C] opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${isCatSelected ? 'text-emerald-700' : 'text-gray-400'}`} />
                          <span className="text-xs">{item.label}</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isCatSelected
                              ? 'bg-emerald-700 border-emerald-800 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isCatSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1km & 2km School Priority Rings Toggle Button */}
        {onToggleSchoolRings && (
          <div className="relative flex items-center shrink-0">
            <div
              className={`bg-white/95 backdrop-blur-md px-2.5 sm:px-3 py-2 rounded-xl shadow-md border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                showSchoolRings
                  ? 'border-blue-600/40 bg-blue-50/90 text-blue-950'
                  : 'border-[#243324]/15 text-[#5C695C] hover:bg-[#F4EFE6]'
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSchoolRings();
                }}
                className="flex items-center gap-1.5 cursor-pointer"
                title="Toggle 1km & 2km MOE Primary School Priority Rings (Updated for 2027 Two-Track Framework)"
              >
                <span className="text-xs">🏫</span>
                <span className="hidden sm:inline">School Rings</span>
                <span className="sm:hidden">1k &amp; 2k</span>
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    showSchoolRings ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                />
              </button>

              {/* Info 'i' Button with Hover & Tap Tooltip */}
              <div
                className="relative inline-flex items-center"
                onMouseEnter={() => setIsSchoolInfoOpen(true)}
                onMouseLeave={() => setIsSchoolInfoOpen(false)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSchoolInfoOpen((prev) => !prev);
                  }}
                  className="text-blue-700/80 hover:text-blue-950 p-0.5 rounded-full hover:bg-blue-100/70 transition-colors cursor-pointer inline-flex items-center ml-0.5"
                  aria-label="MOE Primary School Rings Reference Notice"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>

                {/* Hover & Tap Popover Tooltip */}
                {isSchoolInfoOpen && (
                  <div
                    className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full pt-2 z-[1500]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-64 sm:w-72 p-3 bg-[#243324] text-white text-[11px] font-normal leading-relaxed rounded-xl shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between gap-1.5 border-b border-white/15 pb-1.5 mb-1.5">
                        <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>For reference only</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSchoolInfoOpen(false);
                          }}
                          className="text-white/60 hover:text-white p-0.5 rounded hover:bg-white/10 cursor-pointer text-sm font-bold leading-none"
                          aria-label="Close notice"
                        >
                          &times;
                        </button>
                      </div>
                      <p className="text-white/90 leading-snug">
                        This is for reference only. Please refer to official MOE data for the most accurate information.
                      </p>
                      {/* Pointer arrow pointing up to the info icon */}
                      <div className="absolute top-1 right-2 sm:left-1/2 sm:-translate-x-1/2 border-4 border-transparent border-b-[#243324]" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Interactive Guide Pill (Bottom Left) - Suppressed when POI card is active or sheet expanded */}
      {!isPoiActive && (!mobileSheetState || mobileSheetState === 'peek') && (
        <div className="absolute bottom-28 lg:bottom-4 left-3 sm:left-4 z-[900] bg-white/95 backdrop-blur-md px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl shadow-md border border-[#243324]/10 text-[11px] sm:text-xs text-[#243324] flex items-center gap-2 pointer-events-none animate-in fade-in duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span className="font-medium">
            Click <span className="font-bold underline">anywhere</span> on map to drop a pin
          </span>
        </div>
      )}

      {/* Floating Collapsible Legend (Bottom Right) */}
      <div
        className={`custom-map-overlay absolute z-[1000] hidden sm:block ${
          mobileSheetState && mobileSheetState !== 'peek'
            ? 'hidden'
            : 'bottom-[120px] lg:bottom-4 right-3 sm:right-4'
        }`}
      >
        {isLegendOpen ? (
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-[#243324]/10 text-xs flex flex-col gap-1.5 min-w-[175px] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2 border-b border-[#243324]/10 pb-1.5 mb-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5C695C]">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>Map Legend</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLegendOpen(false);
                }}
                className="p-1 rounded-lg hover:bg-[#243324]/10 text-[#5C695C] hover:text-[#243324] transition-colors cursor-pointer"
                title="Collapse legend"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-[#243324]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#2563EB] shadow-xs" />
                <span>MRT Station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#0284C7] shadow-xs" />
                <span>Bus Stop</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#EA580C] shadow-xs" />
                <span>Hawker & Dining</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#7E22CE] shadow-xs" />
                <span>Shopping Malls</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#059669] shadow-xs" />
                <span>Supermarkets & Groceries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#4F46E5] shadow-xs" />
                <span>Schools & Education</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#E11D48] shadow-xs" />
                <span>Healthcare</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#15803D] shadow-xs" />
                <span>Park & Nature</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#D97706] shadow-xs" />
                <span>Sports & ActiveSG</span>
              </div>
            </div>

            {/* Walking Radius & School Rings Legend */}
            <div className="pt-2 mt-1 border-t border-[#243324]/10 text-[11px] space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-600 shrink-0" />
                <span>
                  {walkingRadius / 80} mins ({walkingRadius >= 1000 ? `${(walkingRadius / 1000).toFixed(1)}km` : `${walkingRadius}m`}) Walking Isochrone
                </span>
              </div>
              {showSchoolRings && (
                <>
                  <div className="flex items-center gap-2 text-blue-700 font-semibold">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-blue-600 shrink-0" />
                    <span>Within 1km School Boundary</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-800 font-semibold">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-600 shrink-0" />
                    <span>1km - 2km School Boundary</span>
                  </div>
                  <div className="pt-1 mt-1 border-t border-[#243324]/10 text-[10px] text-[#5C695C] flex items-center gap-1">
                    <Info className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>For reference only. Refer to official MOE data for most accurate info.</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLegendOpen(true);
            }}
            className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-[#243324]/10 text-xs font-semibold text-[#243324] flex items-center gap-2 hover:bg-[#F4EFE6] transition-all hover:scale-105 cursor-pointer"
            title="Expand map legend"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>Map Legend</span>
            <ChevronUp className="w-3.5 h-3.5 text-[#5C695C]" />
          </button>
        )}
      </div>
    </div>
  );
}
