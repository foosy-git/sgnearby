'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  AmenityWithDistance,
  SelectedProperty,
  AmenityCategory,
  ConvenienceScore,
} from '@/data/types';
import ConvenienceScoreCard from './ConvenienceScoreCard';
import AmenityCard from './AmenityCard';
import HdbResaleSection from '@/components/hdb/HdbResaleSection';
import CommuteMatrixCard from '@/components/living/CommuteMatrixCard';
import SunOrientationCard from '@/components/living/SunOrientationCard';
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
  Clock,
  Compass,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCheck,
  X,
  SlidersHorizontal,
  School,
  RotateCcw,
  Share2,
  Search,
  ArrowUpDown,
  Flame,
  Sparkles,
  MapPin,
  TrendingUp,
  Sun,
} from 'lucide-react';

interface CategoryConfig {
  id: AmenityCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
}


const CATEGORIES_CONFIG: CategoryConfig[] = [
  { id: 'mrt', label: 'MRT Stations', icon: Train, color: 'text-blue-600', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'bus', label: 'Bus Stops', icon: Bus, color: 'text-sky-600', badgeBg: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'mall', label: 'Shopping Malls', icon: Building2, color: 'text-purple-600', badgeBg: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'supermarket', label: 'Supermarkets & Groceries', icon: ShoppingCart, color: 'text-emerald-600', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'food', label: 'Hawker Centres & Food', icon: Utensils, color: 'text-amber-600', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'school', label: 'Schools & Education', icon: GraduationCap, color: 'text-indigo-600', badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'healthcare', label: 'Healthcare', icon: HeartPulse, color: 'text-rose-600', badgeBg: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'park', label: 'Parks & Nature', icon: Trees, color: 'text-emerald-800', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'sports', label: 'Sports & ActiveSG', icon: Dumbbell, color: 'text-orange-600', badgeBg: 'bg-orange-50 text-orange-700 border-orange-200' },
];

interface Props {
  selectedProperty: SelectedProperty;
  amenities: AmenityWithDistance[];
  walkingRadius: number; // meters
  setWalkingRadius: (val: number) => void;
  showSchoolRings: boolean;
  setShowSchoolRings: (val: boolean) => void;
  selectedCategories: AmenityCategory[];
  setSelectedCategories: (cats: AmenityCategory[]) => void;
  onLocateAmenity: (amenity: AmenityWithDistance) => void;
  highlightedAmenityId?: string;
  convenienceScore: ConvenienceScore;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeSidebarTab?: 'amenities' | 'resale';
  setActiveSidebarTab?: (tab: 'amenities' | 'resale') => void;
  onOpenResaleModal?: () => void;
}

export default function AmenitySidebar({
  selectedProperty,
  amenities,
  walkingRadius,
  setWalkingRadius,
  showSchoolRings,
  setShowSchoolRings,
  selectedCategories,
  setSelectedCategories,
  onLocateAmenity,
  highlightedAmenityId,
  convenienceScore,
  isOpen,
  setIsOpen,
  activeSidebarTab,
  setActiveSidebarTab,
  onOpenResaleModal,
}: Props) {
  // Active Tab state (controlled or uncontrolled fallback)
  const [internalTab, setInternalTab] = useState<'amenities' | 'resale'>('amenities');
  const currentTab = activeSidebarTab !== undefined ? activeSidebarTab : internalTab;
  const setCurrentTab = setActiveSidebarTab || setInternalTab;

  // Toggle for Living Experience (Commute & Sun Orientation)
  const [showLivingExperience, setShowLivingExperience] = useState(false);

  // Dropdown open state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Resizable sidebar states
  const [sidebarWidth, setSidebarWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);

  // Load saved sidebar width from localStorage
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem('sg_sidebar_width');
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (parsed >= 360 && parsed <= 760) {
          setSidebarWidth(parsed);
        }
      }
    } catch {}
  }, []);

  // Handle dragging resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 360 && newWidth <= 760) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem('sg_sidebar_width', String(sidebarWidth));
      } catch {}
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  // Click outside listener for category dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Multi-select actions
  const isAllSelected = CATEGORIES_CONFIG.every((c) =>
    selectedCategories.includes(c.id) || (c.id === 'supermarket' && selectedCategories.includes('shopping'))
  );
  const isNoneSelected = selectedCategories.length === 0;

  const handleSelectAll = () => {
    setSelectedCategories([...CATEGORIES_CONFIG.map((c) => c.id), 'shopping']);
  };

  const handleDeselectAll = () => {
    setSelectedCategories([]);
  };

  const handleToggleCategory = (catId: AmenityCategory) => {
    const isSupermarketToggle = catId === 'supermarket';
    const isCurrentlySelected = selectedCategories.includes(catId) || (isSupermarketToggle && selectedCategories.includes('shopping'));

    if (isCurrentlySelected) {
      setSelectedCategories(
        selectedCategories.filter(
          (c) => c !== catId && (!isSupermarketToggle || c !== 'shopping')
        )
      );
    } else {
      setSelectedCategories(
        isSupermarketToggle
          ? [...selectedCategories, 'supermarket', 'shopping']
          : [...selectedCategories, catId]
      );
    }
  };

  const [showAllBusStops, setShowAllBusStops] = useState(false);
  const [showAllFood, setShowAllFood] = useState(false);
  const [foodFilter, setFoodFilter] = useState<'all' | 'hawkers' | 'coffeeshops' | 'restaurants'>('all');
  const [schoolFilter, setSchoolFilter] = useState<'all' | 'primary' | 'secondary' | 'tertiary'>('all');

  // In-list search query & sorting mode
  const [listSearch, setListSearch] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'time' | 'name'>('distance');
  const [copiedToast, setCopiedToast] = useState(false);

  const handleShare = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('name', selectedProperty.name);
      url.searchParams.set('lat', selectedProperty.lat.toFixed(5));
      url.searchParams.set('lng', selectedProperty.lng.toFixed(5));
      if (selectedProperty.postalCode) {
        url.searchParams.set('postal', selectedProperty.postalCode);
      }
      navigator.clipboard.writeText(url.toString());
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch {}
  };

  // Neighborhood Key Highlights Memo
  const neighborhoodHighlights = useMemo(() => {
    const nearestMrt = amenities.find((a) => a.category === 'mrt');
    const schools1km = amenities.filter((a) => a.category === 'school' && a.schoolPriority === '1km');
    const highRiskSchools1kmCount = schools1km.filter((a) => a.details?.ballotingRisk === 'High').length;
    const hawkers = amenities.filter(
      (a) => a.category === 'food' && (!!a.details?.hawkerType || a.details?.foodType === 'Hawker Centre')
    );
    const supermarkets = amenities.filter(
      (a) => a.category === 'supermarket' || a.category === 'shopping'
    );
    const nearestPark = amenities.find((a) => a.category === 'park');

    return {
      nearestMrt,
      schools1kmCount: schools1km.length,
      highRiskSchools1kmCount,
      hawkersCount: hawkers.length,
      supermarketsCount: supermarkets.length,
      nearestPark,
    };
  }, [amenities]);

  // Filter amenities by active selectedCategories, foodFilter, schoolFilter & listSearch
  const allFilteredAmenities = useMemo(() => {
    return amenities
      .filter((a) => {
        const isSelected =
          selectedCategories.includes(a.category) ||
          (a.category === 'supermarket' && selectedCategories.includes('shopping')) ||
          (a.category === 'shopping' && selectedCategories.includes('supermarket'));
        if (!isSelected) return false;

        // In-list keyword search
        if (listSearch.trim()) {
          const q = listSearch.toLowerCase().trim();
          const nameMatch = a.name.toLowerCase().includes(q);
          const detailMatch =
            a.details?.cuisine?.toLowerCase().includes(q) ||
            a.details?.hawkerType?.toLowerCase().includes(q) ||
            a.details?.mallType?.toLowerCase().includes(q) ||
            a.details?.schoolLevel?.toLowerCase().includes(q) ||
            a.details?.schoolType?.toLowerCase().includes(q);
          if (!nameMatch && !detailMatch) return false;
        }

        // Food sub-filtering
        if (a.category === 'food') {
          const isHawker = !!a.details?.hawkerType || a.details?.foodType === 'Hawker Centre';
          const isCoffeeshop = a.details?.foodType === 'Coffeeshop / Food Court' || /coffeeshop|kopitiam|food court|food park/i.test(a.name);
          const isRestaurant = a.details?.foodType === 'Restaurant / Eatery' || a.details?.foodType === 'Cafe & Bakery';

          if (foodFilter === 'hawkers' && !isHawker) return false;
          if (foodFilter === 'coffeeshops' && !isCoffeeshop) return false;
          if (foodFilter === 'restaurants' && !isRestaurant) return false;
        }

        // School sub-filtering
        if (a.category === 'school') {
          const level = a.details?.schoolLevel || 'Primary';
          if (schoolFilter === 'primary' && level !== 'Primary') return false;
          if (schoolFilter === 'secondary' && level !== 'Secondary') return false;
          if (schoolFilter === 'tertiary' && level !== 'Junior College' && level !== 'Tertiary') return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'time') {
          return a.walkingMinutes - b.walkingMinutes || a.distanceMeters - b.distanceMeters;
        }

        // Default 'distance' sorting: prioritize authentic Hawker Centres for food
        if (a.category === 'food' && b.category === 'food') {
          const aHawker = !!a.details?.hawkerType || a.details?.foodType === 'Hawker Centre';
          const bHawker = !!b.details?.hawkerType || b.details?.foodType === 'Hawker Centre';
          if (aHawker && !bHawker) return -1;
          if (!aHawker && bHawker) return 1;

          const aCourt = a.details?.foodType === 'Coffeeshop / Food Court';
          const bCourt = b.details?.foodType === 'Coffeeshop / Food Court';
          if (aCourt && !bCourt) return -1;
          if (!aCourt && bCourt) return 1;
        }
        return a.distanceMeters - b.distanceMeters;
      });
  }, [amenities, selectedCategories, foodFilter, schoolFilter, listSearch, sortBy]);

  const totalBusStops = allFilteredAmenities.filter((a) => a.category === 'bus').length;
  const totalFoodPlaces = allFilteredAmenities.filter((a) => a.category === 'food').length;

  // Keep top 12 bus stops and top 15 food places unless user expands them or searches
  const displayedAmenities = useMemo(() => {
    if (listSearch.trim()) return allFilteredAmenities;

    let busCount = 0;
    let foodCount = 0;
    return allFilteredAmenities.filter((a) => {
      if (a.category === 'bus') {
        busCount++;
        if (!showAllBusStops && totalBusStops > 12 && busCount > 12) {
          return false;
        }
      }
      if (a.category === 'food') {
        foodCount++;
        if (!showAllFood && totalFoodPlaces > 15 && foodCount > 15) {
          return false;
        }
      }
      return true;
    });
  }, [allFilteredAmenities, showAllBusStops, totalBusStops, showAllFood, totalFoodPlaces, listSearch]);

  // Categories accordion state: empty Set means all collapsed by default!
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Auto-expand category when an amenity pin is clicked on map
  useEffect(() => {
    if (highlightedAmenityId) {
      const found = amenities.find((a) => a.id === highlightedAmenityId);
      if (found) {
        const catKey = found.category === 'shopping' ? 'supermarket' : found.category;
        setExpandedCategories((prev) => {
          const next = new Set(prev);
          next.add(catKey);
          return next;
        });
      }
    }
  }, [highlightedAmenityId, amenities]);

  // Group displayed amenities by category
  const amenitiesGroupedByCategory = useMemo(() => {
    const groups = new Map<string, AmenityWithDistance[]>();
    for (const a of displayedAmenities) {
      const catKey = a.category === 'shopping' ? 'supermarket' : a.category;
      if (!groups.has(catKey)) {
        groups.set(catKey, []);
      }
      groups.get(catKey)!.push(a);
    }
    return groups;
  }, [displayedAmenities]);

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const handleExpandAllCategories = () => {
    setExpandedCategories(new Set(CATEGORIES_CONFIG.map((c) => c.id)));
  };

  const handleCollapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

  const walkingOptions = [
    { meters: 400, label: '5 min', desc: '400m' },
    { meters: 800, label: '10 min', desc: '800m' },
    { meters: 1200, label: '15 min', desc: '1.2km' },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className="hidden lg:flex relative top-0 right-0 z-40 h-full bg-[#FBF9F5] border-l border-[#243324]/10 shadow-none flex-col transition-all duration-150 ease-out select-auto shrink-0"
    >
      {/* Resizable Left Edge Drag Handle (Desktop only) */}
      <div
        onMouseDown={handleMouseDown}
        className={`hidden lg:flex absolute -left-1 top-0 bottom-0 w-2.5 cursor-col-resize z-50 items-center justify-center group select-none transition-colors ${
          isResizing ? 'bg-emerald-600/30' : 'hover:bg-emerald-500/25'
        }`}
        title="Drag horizontally to resize panel width"
      >
        <div
          className={`w-0.5 h-12 rounded-full transition-colors ${
            isResizing ? 'bg-emerald-700' : 'bg-[#243324]/20 group-hover:bg-emerald-600'
          }`}
        />
      </div>

      {/* Header bar */}
      <div className="p-4 border-b border-[#243324]/10 bg-[#FBF9F5]/90 backdrop-blur-md shrink-0 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#243324] text-[#FBF9F5]">
              {selectedProperty.propertyType || 'Location'}
            </span>
            {selectedProperty.postalCode && (
              <span className="text-xs font-semibold text-[#5C695C]">
                S({selectedProperty.postalCode})
              </span>
            )}
          </div>
          <h2 className="font-serif font-bold text-lg sm:text-xl text-[#243324] mt-1.5 leading-snug break-words">
            {selectedProperty.name}
          </h2>
          <p className="text-xs text-[#5C695C] mt-1 break-words leading-relaxed">{selectedProperty.address}</p>
        </div>

        {/* Action Buttons: Share, Collapse */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Share Link Button */}
          <div className="relative">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl bg-white border border-[#243324]/10 text-[#5C695C] hover:text-[#243324] hover:bg-[#F4EFE6] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
              title="Copy shareable link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {copiedToast && (
              <div className="absolute right-0 top-full mt-1.5 px-2.5 py-1 bg-[#243324] text-white text-[10px] font-bold rounded-lg shadow-xl whitespace-nowrap z-50 animate-in fade-in">
                Link Copied!
              </div>
            )}
          </div>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl text-[#243324] hover:bg-[#243324]/10 border border-[#243324]/10 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            title="Collapse explorer panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Navigation Tabs: Amenities vs HDB Resale */}
      <div className="px-4 py-2.5 bg-[#FBF9F5] border-b border-[#243324]/10 shrink-0">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F4EFE6] rounded-xl border border-[#243324]/10">
          <button
            type="button"
            onClick={() => setCurrentTab('amenities')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentTab === 'amenities'
                ? 'bg-[#243324] text-white shadow-xs'
                : 'text-[#5C695C] hover:text-[#243324]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Amenities ({amenities.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('resale')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentTab === 'resale'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-[#5C695C] hover:text-[#243324]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>HDB Resale (3Y)</span>
          </button>
        </div>
      </div>

      {/* Conditional Content based on active tab */}
      {currentTab === 'resale' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          <HdbResaleSection
            selectedProperty={selectedProperty}
            onOpenModal={onOpenResaleModal}
          />
        </div>
      ) : (
        /* Scrollable Amenities Content */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Walkability & Convenience Score Gauge */}
          <ConvenienceScoreCard score={convenienceScore} />

          {/* Neighborhood Key Highlights / Estate Snapshot Card */}
          <div className="bg-white/95 rounded-2xl p-3.5 border border-[#243324]/10 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C695C] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Estate Snapshot</span>
            </span>
            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Within {walkingRadius}m
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Nearest MRT */}
            <div className="p-2.5 rounded-xl bg-[#F4EFE6]/70 border border-[#243324]/5 flex flex-col justify-between">
              <div className="text-[10px] text-[#5C695C] font-semibold flex items-center gap-1">
                <Train className="w-3 h-3 text-blue-600 shrink-0" />
                <span>Nearest MRT</span>
              </div>
              <div className="mt-1 font-bold text-[#243324] text-xs truncate">
                {neighborhoodHighlights.nearestMrt ? neighborhoodHighlights.nearestMrt.name : 'None in radius'}
              </div>
              <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
                {neighborhoodHighlights.nearestMrt ? `~${neighborhoodHighlights.nearestMrt.walkingMinutes} min walk` : 'Expand radius'}
              </div>
            </div>

            {/* MOE Primary Schools in 1km */}
            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 flex flex-col justify-between">
              <div className="text-[10px] text-indigo-700 font-semibold flex items-center gap-1">
                <School className="w-3 h-3 text-indigo-600 shrink-0" />
                <span>Schools in 1km</span>
              </div>
              <div className="mt-1 font-bold text-indigo-950 text-xs">
                {neighborhoodHighlights.schools1kmCount} MOE {neighborhoodHighlights.schools1kmCount === 1 ? 'School' : 'Schools'}
              </div>
              <div className="text-[10px] text-indigo-800 font-semibold mt-0.5 truncate">
                {neighborhoodHighlights.highRiskSchools1kmCount > 0
                  ? `🔥 ${neighborhoodHighlights.highRiskSchools1kmCount} High 2C Ballot Risk`
                  : neighborhoodHighlights.schools1kmCount > 0
                  ? 'Phase 2C Priority'
                  : 'Outside 1km'}
              </div>
            </div>

            {/* Hawker & Dining */}
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex flex-col justify-between">
              <div className="text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                <Utensils className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Hawkers Nearby</span>
              </div>
              <div className="mt-1 font-bold text-amber-950 text-xs truncate">
                {neighborhoodHighlights.hawkersCount} Hawker {neighborhoodHighlights.hawkersCount === 1 ? 'Centre' : 'Centres'}
              </div>
              <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                {neighborhoodHighlights.hawkersCount > 0 ? 'Authentic SG Dining' : 'See food courts'}
              </div>
            </div>

            {/* Groceries & Supermarkets */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex flex-col justify-between">
              <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                <ShoppingCart className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Supermarkets</span>
              </div>
              <div className="mt-1 font-bold text-emerald-950 text-xs truncate">
                {neighborhoodHighlights.supermarketsCount} {neighborhoodHighlights.supermarketsCount === 1 ? 'Store' : 'Stores'}
              </div>
              <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                {neighborhoodHighlights.supermarketsCount > 0 ? 'FairPrice / Malls' : 'Nearby groceries'}
              </div>
            </div>

            {/* Quick HDB Resale Banner in Estate Snapshot */}
            <div
              onClick={() => setCurrentTab('resale')}
              className="col-span-2 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between cursor-pointer hover:bg-emerald-100/80 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-700 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-[10px] text-emerald-900 font-bold uppercase tracking-wider">
                    HDB Resale Prices (Within 5 Mins Walk)
                  </div>
                  <div className="text-[11px] text-emerald-800 font-medium">
                    View official resale transactions, PSF & 36-month trends within 400m
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          </div>
        </div>

        {/* The Living Experience: Commute Matrix & Afternoon Sun Inspector */}
        <div className="bg-white/95 rounded-2xl border border-[#243324]/10 shadow-xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowLivingExperience(!showLivingExperience)}
            className="w-full p-3.5 flex items-center justify-between hover:bg-[#F4EFE6]/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-900 shrink-0">
                <Sun className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#243324] flex items-center gap-1.5 flex-wrap">
                  <span>The Living Experience</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 text-blue-900 border border-blue-200">
                    Commute &amp; Sun Facing
                  </span>
                </div>
                <div className="text-[11px] text-[#5C695C] mt-0.5">
                  Door-to-door transit to 5 employment hubs &amp; afternoon heat test
                </div>
              </div>
            </div>
            <div className="p-1 rounded-lg text-[#5C695C] hover:bg-[#243324]/5">
              {showLivingExperience ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {showLivingExperience && (
            <div className="p-3.5 pt-0 space-y-3.5 border-t border-[#243324]/5 animate-in fade-in">
              <CommuteMatrixCard
                propertyLat={selectedProperty.lat}
                propertyLng={selectedProperty.lng}
                nearestMrt={neighborhoodHighlights.nearestMrt}
              />
              <SunOrientationCard />
            </div>
          )}
        </div>

        {/* Walking Radius & School Rings Filters */}
        <div className="bg-[#FFFFFF]/90 backdrop-blur-md rounded-2xl p-4 border border-[#243324]/10 shadow-xs space-y-3">
          {/* Walking Radius Selector */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#5C695C] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                Walking Radius
              </span>
              <span className="font-bold text-[#243324]">
                {walkingRadius}m ({walkingRadius / 80} min)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {walkingOptions.map((opt) => (
                <button
                  key={opt.meters}
                  onClick={() => setWalkingRadius(opt.meters)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                    walkingRadius === opt.meters
                      ? 'bg-[#243324] text-[#FBF9F5] border-[#243324] shadow-xs'
                      : 'bg-[#F4EFE6]/70 text-[#243324] border-[#243324]/10 hover:bg-[#F4EFE6]'
                  }`}
                >
                  <div>{opt.label}</div>
                  <div className="text-[10px] opacity-75">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* School Rings Toggle */}
          <div className="pt-3 border-t border-[#243324]/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-[#243324] flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-blue-600" />
                <span>MOE Primary School Rings</span>
              </div>
              <p className="text-[11px] text-[#5C695C]">
                Draw 1km (Blue) & 2km (Orange) ballot priority zones
              </p>
            </div>
            <button
              onClick={() => setShowSchoolRings(!showSchoolRings)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showSchoolRings ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  showSchoolRings ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Nearby Facilities Multi-Select Dropdown Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5C695C] uppercase tracking-wider">
            <span>Nearby Facilities ({displayedAmenities.length} of {amenities.length})</span>
            {selectedCategories.length < CATEGORIES_CONFIG.length && (
              <button
                onClick={handleSelectAll}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold normal-case flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to All</span>
              </button>
            )}
          </div>

          {/* Multi-Select Category Dropdown Container */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full p-2.5 bg-white rounded-xl border border-[#243324]/15 text-xs text-[#243324] font-medium flex items-center justify-between shadow-xs hover:border-[#243324]/30 transition-all"
            >
              <div className="flex items-center gap-2 truncate">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-semibold text-[#243324]">Categories:</span>
                <span className="text-[#5C695C] truncate">
                  {isAllSelected
                    ? `All Categories Selected (${CATEGORIES_CONFIG.length}/${CATEGORIES_CONFIG.length})`
                    : isNoneSelected
                    ? `None Selected (0/${CATEGORIES_CONFIG.length})`
                    : `${selectedCategories.length} of ${CATEGORIES_CONFIG.length} selected`}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#5C695C] shrink-0 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-emerald-700' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Panel */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-[#243324]/15 shadow-2xl z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                {/* Action Bar: Select All / Deselect All */}
                <div className="flex items-center justify-between pb-2 border-b border-[#243324]/10 text-xs">
                  <span className="font-semibold text-[#243324] text-[11px] uppercase tracking-wider">
                    Filter Amenities
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSelectAll}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck className="w-3 h-3 text-emerald-600" />
                      <span>Select All</span>
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-800 hover:bg-rose-100 flex items-center gap-1 transition-colors"
                    >
                      <X className="w-3 h-3 text-rose-600" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                {/* Categories Checkbox Rows */}
                <div className="space-y-1 max-h-64 overflow-y-auto no-scrollbar">
                  {CATEGORIES_CONFIG.map((cat) => {
                    const Icon = cat.icon;
                    const isChecked =
                      selectedCategories.includes(cat.id) ||
                      (cat.id === 'supermarket' && selectedCategories.includes('shopping'));
                    const count = amenities.filter((a) => {
                      if (cat.id === 'supermarket' || cat.id === 'shopping') {
                        return a.category === 'supermarket' || a.category === 'shopping';
                      }
                      return a.category === cat.id;
                    }).length;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleToggleCategory(cat.id)}
                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                          isChecked ? 'bg-[#F4EFE6]/70 hover:bg-[#F4EFE6]' : 'hover:bg-slate-50 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Custom Checkbox */}
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              isChecked
                                ? 'bg-[#243324] border-[#243324] text-white'
                                : 'border-[#243324]/30 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          {/* Icon & Label */}
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${cat.color}`} />
                            <span className={`font-semibold ${isChecked ? 'text-[#243324]' : 'text-[#5C695C]'}`}>
                              {cat.label}
                            </span>
                          </div>
                        </div>

                        {/* Count Pill */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isChecked
                              ? 'bg-[#243324]/10 text-[#243324]'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Active Filter Chips (Only shown when user customized categories) */}
          {!isAllSelected && !isNoneSelected && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {CATEGORIES_CONFIG.map((cat) => {
                const isSelected =
                  selectedCategories.includes(cat.id) ||
                  (cat.id === 'supermarket' && selectedCategories.includes('shopping'));
                const count = amenities.filter((a) => {
                  if (cat.id === 'supermarket' || cat.id === 'shopping') {
                    return a.category === 'supermarket' || a.category === 'shopping';
                  }
                  return a.category === cat.id;
                }).length;
                const Icon = cat.icon;

                if (!isSelected) return null;

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleToggleCategory(cat.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 transition-colors group ${cat.badgeBg}`}
                    title={`Click to remove ${cat.label} filter`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat.label}</span>
                    <span className="font-bold">({count})</span>
                    <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Food Sub-Filter */}
          {selectedCategories.includes('food') && (
            <div className="p-1.5 bg-[#F4EFE6]/80 rounded-xl border border-[#243324]/10 text-xs space-y-1">
              <div className="text-[11px] font-semibold text-[#5C695C] px-1 flex items-center justify-between">
                <span>Food & Dining Filter:</span>
                <span className="font-bold text-[#243324]">{amenities.filter((a) => a.category === 'food').length} nearby</span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFoodFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    foodFilter === 'all'
                      ? 'bg-[#243324] text-white shadow-2xs'
                      : 'text-[#5C695C] hover:text-[#243324] hover:bg-white/60'
                  }`}
                >
                  All Food
                </button>
                <button
                  type="button"
                  onClick={() => setFoodFilter('hawkers')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    foodFilter === 'hawkers'
                      ? 'bg-amber-700 text-white shadow-2xs'
                      : 'text-amber-800 hover:text-amber-950 hover:bg-amber-100/60'
                  }`}
                >
                  <span>⭐ Hawkers</span>
                  <span className="font-bold">
                    ({amenities.filter((a) => a.category === 'food' && (!!a.details?.hawkerType || a.details?.foodType === 'Hawker Centre')).length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFoodFilter('coffeeshops')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    foodFilter === 'coffeeshops'
                      ? 'bg-orange-700 text-white shadow-2xs'
                      : 'text-orange-800 hover:text-orange-950 hover:bg-orange-100/60'
                  }`}
                >
                  <span>☕ Courts & Coffeeshops</span>
                  <span className="font-bold">
                    ({amenities.filter((a) => a.category === 'food' && (a.details?.foodType === 'Coffeeshop / Food Court' || /coffeeshop|kopitiam|food court|food park/i.test(a.name))).length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFoodFilter('restaurants')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    foodFilter === 'restaurants'
                      ? 'bg-stone-700 text-white shadow-2xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                  }`}
                >
                  <span>🍽️ Restaurants & Cafes</span>
                  <span className="font-bold">
                    ({amenities.filter((a) => a.category === 'food' && (a.details?.foodType === 'Restaurant / Eatery' || a.details?.foodType === 'Cafe & Bakery')).length})
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* School Sub-Filter */}
          {selectedCategories.includes('school') && (
            <div className="p-1.5 bg-indigo-50/70 rounded-xl border border-indigo-200/60 text-xs space-y-1">
              <div className="text-[11px] font-semibold text-indigo-800 px-1 flex items-center justify-between">
                <span>Education Level:</span>
                <span className="font-bold text-indigo-950">{amenities.filter((a) => a.category === 'school').length} schools</span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSchoolFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    schoolFilter === 'all'
                      ? 'bg-indigo-700 text-white shadow-2xs'
                      : 'text-indigo-800 hover:text-indigo-950 hover:bg-white/60'
                  }`}
                >
                  All ({amenities.filter((a) => a.category === 'school').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSchoolFilter('primary')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    schoolFilter === 'primary'
                      ? 'bg-indigo-700 text-white shadow-2xs'
                      : 'text-indigo-800 hover:text-indigo-950 hover:bg-white/60'
                  }`}
                >
                  Primary ({amenities.filter((a) => a.category === 'school' && (a.details?.schoolLevel === 'Primary' || !a.details?.schoolLevel)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSchoolFilter('secondary')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    schoolFilter === 'secondary'
                      ? 'bg-indigo-700 text-white shadow-2xs'
                      : 'text-indigo-800 hover:text-indigo-950 hover:bg-white/60'
                  }`}
                >
                  Secondary ({amenities.filter((a) => a.category === 'school' && a.details?.schoolLevel === 'Secondary').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSchoolFilter('tertiary')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    schoolFilter === 'tertiary'
                      ? 'bg-indigo-700 text-white shadow-2xs'
                      : 'text-indigo-800 hover:text-indigo-950 hover:bg-white/60'
                  }`}
                >
                  JC / Poly / Uni ({amenities.filter((a) => a.category === 'school' && (a.details?.schoolLevel === 'Junior College' || a.details?.schoolLevel === 'Tertiary')).length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* In-List Search & Sorting Controls */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#5C695C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Search facilities (e.g. FairPrice, Catholic)..."
              className="w-full pl-8 pr-7 py-1.5 bg-white rounded-xl border border-[#243324]/15 text-xs text-[#243324] placeholder-[#5C695C]/60 focus:outline-none focus:border-emerald-600 shadow-2xs transition-all"
            />
            {listSearch && (
              <button
                type="button"
                onClick={() => setListSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#5C695C] hover:text-[#243324]"
                title="Clear filter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-xl border border-[#243324]/15 shadow-2xs shrink-0">
            <ArrowUpDown className="w-3 h-3 text-[#5C695C] shrink-0" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              aria-label="Sort facilities by"
              className="bg-transparent text-xs font-semibold text-[#243324] focus:outline-none cursor-pointer"
            >
              <option value="distance">Distance</option>
              <option value="time">Walk Time</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Amenity Category Accordions: Collapsed by Default */}
        <div className="space-y-2 pb-6">
          {displayedAmenities.length > 0 ? (
            <>
              {/* Expand All / Collapse All Controls */}
              <div className="flex items-center justify-between pb-1 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C695C]">
                  {CATEGORIES_CONFIG.filter((c) => (amenitiesGroupedByCategory.get(c.id)?.length || 0) > 0).length} Facility Categories
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExpandAllCategories}
                    className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                  >
                    Expand All
                  </button>
                  <span className="text-[#5C695C]/40">•</span>
                  <button
                    type="button"
                    onClick={handleCollapseAllCategories}
                    className="text-[11px] font-semibold text-[#5C695C] hover:text-[#243324] cursor-pointer"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {CATEGORIES_CONFIG.map((cat) => {
                const items = amenitiesGroupedByCategory.get(cat.id);
                if (!items || items.length === 0) return null;

                const isSearching = listSearch.trim().length > 0;
                const isExpanded = isSearching || expandedCategories.has(cat.id);
                const Icon = cat.icon;

                return (
                  <div
                    key={cat.id}
                    className="bg-white/95 rounded-2xl border border-[#243324]/10 shadow-xs overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpand(cat.id)}
                      className="w-full p-3 flex items-center justify-between hover:bg-[#F4EFE6]/50 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-[#F4EFE6] ${cat.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-[#243324]">{cat.label}</span>
                        <span className="text-[10px] font-bold text-[#5C695C] bg-[#F4EFE6] px-2 py-0.5 rounded-full border border-[#243324]/10">
                          {items.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-semibold text-[#5C695C]">
                        <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 pt-0 space-y-2 border-t border-[#243324]/5 animate-in fade-in">
                        <div className="space-y-2 pt-2">
                          {items.map((amenity) => (
                            <AmenityCard
                              key={amenity.id}
                              amenity={amenity}
                              selectedProperty={selectedProperty}
                              onLocate={onLocateAmenity}
                              isHighlighted={highlightedAmenityId === amenity.id}
                            />
                          ))}

                          {cat.id === 'food' && totalFoodPlaces > 15 && (
                            <button
                              type="button"
                              onClick={() => setShowAllFood(!showAllFood)}
                              className="w-full py-2 px-3 text-[11px] font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Utensils className="w-3 h-3" />
                              <span>
                                {showAllFood
                                  ? 'Show closest 15 food places only'
                                  : `Show all ${totalFoodPlaces} food places (+${totalFoodPlaces - 15} more)`}
                              </span>
                            </button>
                          )}

                          {cat.id === 'bus' && totalBusStops > 12 && (
                            <button
                              type="button"
                              onClick={() => setShowAllBusStops(!showAllBusStops)}
                              className="w-full py-2 px-3 text-[11px] font-semibold rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Bus className="w-3 h-3" />
                              <span>
                                {showAllBusStops
                                  ? 'Show closest 12 bus stops only'
                                  : `Show all ${totalBusStops} bus stops (+${totalBusStops - 12} more)`}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-[#243324]/20 space-y-2">
              <Compass className="w-8 h-8 text-[#5C695C] mx-auto opacity-50" />
              <div className="font-serif font-medium text-sm text-[#243324]">
                {isNoneSelected
                  ? 'No categories selected'
                  : 'No matching facilities found'}
              </div>
              <p className="text-xs text-[#5C695C]">
                {isNoneSelected
                  ? 'Please select one or more categories in the dropdown above.'
                  : 'Try expanding the walking radius to 15 mins (1.2km) or check other facility categories.'}
              </p>
              {isNoneSelected && (
                <button
                  onClick={handleSelectAll}
                  className="mt-2 px-3 py-1.5 bg-[#243324] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Select All Categories</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </aside>
  );
}
