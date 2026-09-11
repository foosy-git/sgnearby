'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  AmenityWithDistance,
  SelectedProperty,
  AmenityCategory,
  ConvenienceScore,
} from '@/data/types';
import ConvenienceScoreCard from '@/components/sidebar/ConvenienceScoreCard';
import AmenityCard from '@/components/sidebar/AmenityCard';
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
  ChevronDown,
  ChevronUp,
  School,
  Share2,
  Search,
  ArrowUpDown,
  Sparkles,
  TrendingUp,
  Sun,
  X,
  SlidersHorizontal,
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
  { id: 'supermarket', label: 'Supermarkets', icon: ShoppingCart, color: 'text-emerald-600', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'food', label: 'Hawkers & Food', icon: Utensils, color: 'text-amber-600', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'school', label: 'Schools', icon: GraduationCap, color: 'text-indigo-600', badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'healthcare', label: 'Healthcare', icon: HeartPulse, color: 'text-rose-600', badgeBg: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'park', label: 'Parks & Nature', icon: Trees, color: 'text-emerald-800', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'sports', label: 'Sports & ActiveSG', icon: Dumbbell, color: 'text-orange-600', badgeBg: 'bg-orange-50 text-orange-700 border-orange-200' },
];

export type SheetSnapState = 'peek' | 'half' | 'full';

interface Props {
  selectedProperty: SelectedProperty;
  amenities: AmenityWithDistance[];
  walkingRadius: number;
  setWalkingRadius: (val: number) => void;
  showSchoolRings: boolean;
  setShowSchoolRings: (val: boolean) => void;
  selectedCategories: AmenityCategory[];
  setSelectedCategories: (cats: AmenityCategory[]) => void;
  onLocateAmenity: (amenity: AmenityWithDistance) => void;
  highlightedAmenityId?: string;
  convenienceScore: ConvenienceScore;
  onOpenResaleModal?: () => void;
  sheetState: SheetSnapState;
  setSheetState: (state: SheetSnapState) => void;
}

export default function MobileBottomSheet({
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
  onOpenResaleModal,
  sheetState,
  setSheetState,
}: Props) {
  const [activeTab, setActiveTab] = useState<'amenities' | 'resale' | 'living'>('amenities');
  const [copiedToast, setCopiedToast] = useState(false);

  // In-list search & sort
  const [listSearch, setListSearch] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'time' | 'name'>('distance');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Touch gesture handling for drag
  const touchStartY = useRef<number | null>(null);
  const touchDeltaY = useRef<number>(0);
  const isDraggingHandle = useRef<boolean>(false);

  // Auto-expand category when an amenity is highlighted
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const cycleSheetState = () => {
    if (sheetState === 'peek') {
      setSheetState('half');
    } else if (sheetState === 'half') {
      setSheetState('full');
    } else {
      setSheetState('peek');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
    isDraggingHandle.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingHandle.current || touchStartY.current === null) return;
    touchDeltaY.current = e.touches[0].clientY - touchStartY.current;
  };

  const handleTouchEnd = () => {
    if (!isDraggingHandle.current) return;
    isDraggingHandle.current = false;
    const delta = touchDeltaY.current;

    // Dragged UP by more than 40px
    if (delta < -40) {
      if (sheetState === 'peek') setSheetState('half');
      else if (sheetState === 'half') setSheetState('full');
    }
    // Dragged DOWN by more than 40px
    else if (delta > 40) {
      if (sheetState === 'full') setSheetState('half');
      else if (sheetState === 'half') setSheetState('peek');
    }
    touchStartY.current = null;
    touchDeltaY.current = 0;
  };

  // Neighborhood Key Highlights
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
    return {
      nearestMrt,
      schools1kmCount: schools1km.length,
      highRiskSchools1kmCount,
      hawkersCount: hawkers.length,
      supermarketsCount: supermarkets.length,
    };
  }, [amenities]);

  // Filter & sort amenities
  const filteredAmenities = useMemo(() => {
    return amenities
      .filter((a) => {
        const isSelected =
          selectedCategories.includes(a.category) ||
          (a.category === 'supermarket' && selectedCategories.includes('shopping')) ||
          (a.category === 'shopping' && selectedCategories.includes('supermarket'));
        if (!isSelected) return false;

        if (listSearch.trim()) {
          const q = listSearch.toLowerCase().trim();
          const nameMatch = a.name.toLowerCase().includes(q);
          const detailMatch =
            a.details?.cuisine?.toLowerCase().includes(q) ||
            a.details?.hawkerType?.toLowerCase().includes(q) ||
            a.details?.mallType?.toLowerCase().includes(q) ||
            a.details?.schoolLevel?.toLowerCase().includes(q);
          if (!nameMatch && !detailMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'time') return a.walkingMinutes - b.walkingMinutes;
        return a.distanceMeters - b.distanceMeters;
      });
  }, [amenities, selectedCategories, listSearch, sortBy]);

  // Group by category
  const amenitiesGrouped = useMemo(() => {
    const groups = new Map<string, AmenityWithDistance[]>();
    for (const a of filteredAmenities) {
      const catKey = a.category === 'shopping' ? 'supermarket' : a.category;
      if (!groups.has(catKey)) groups.set(catKey, []);
      groups.get(catKey)!.push(a);
    }
    return groups;
  }, [filteredAmenities]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Compute height class / style based on snap state
  const sheetHeightClass = useMemo(() => {
    switch (sheetState) {
      case 'peek':
        return 'h-[105px]';
      case 'half':
        return 'h-[48dvh]';
      case 'full':
      default:
        return 'h-[90dvh]';
    }
  }, [sheetState]);

  return (
    <div
      className={`lg:hidden fixed left-0 right-0 bottom-0 z-40 bg-[#FBF9F5] rounded-t-[32px] border-t border-[#243324]/15 shadow-2xl transition-all duration-300 ease-out flex flex-col ${sheetHeightClass}`}
    >
      {/* Gesture Drag Handle Area */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={cycleSheetState}
        className="pt-2.5 pb-1 flex flex-col items-center cursor-pointer shrink-0 select-none"
      >
        <div className="w-12 h-1.5 rounded-full bg-[#243324]/25 hover:bg-[#243324]/40 active:scale-95 transition-all" />
      </div>

      {/* Persistent Sheet Header (Visible in Peek Mode) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={cycleSheetState}
        className="px-4 py-1.5 flex items-center justify-between cursor-pointer shrink-0 select-none"
      >
        <div className="min-w-0 flex-1 mr-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm text-[#243324] truncate">
              {selectedProperty.name}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#243324] text-white shrink-0">
              {amenities.length} nearby
            </span>
          </div>
          <div className="text-[11px] text-[#5C695C] truncate flex items-center gap-1.5 mt-0.5">
            <span>Score: <strong className="text-emerald-800 font-bold">{convenienceScore.overall}/100</strong></span>
            <span>•</span>
            <span>Within {walkingRadius}m ({walkingRadius / 80}m walk)</span>
          </div>
        </div>

        {/* Right Actions: Share & Toggle Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-xl bg-white border border-[#243324]/10 text-[#5C695C] active:scale-95 transition-all"
              title="Share Location"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            {copiedToast && (
              <div className="absolute right-0 bottom-full mb-1.5 px-2 py-0.5 bg-[#243324] text-white text-[10px] font-bold rounded-lg whitespace-nowrap shadow-md">
                Link Copied!
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleSheetState();
            }}
            className="py-1.5 px-2.5 rounded-xl bg-[#F4EFE6] text-[#243324] text-xs font-bold flex items-center gap-1 border border-[#243324]/10 active:scale-95 transition-all"
          >
            <span>{sheetState === 'peek' ? 'Expand' : sheetState === 'half' ? 'Full' : 'Collapse'}</span>
            {sheetState === 'full' ? (
              <ChevronDown className="w-3.5 h-3.5 text-emerald-800" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-emerald-800" />
            )}
          </button>
        </div>
      </div>

      {/* Segmented Sub-Tabs (Visible when sheet is in 'half' or 'full' state) */}
      {sheetState !== 'peek' && (
        <div className="px-4 py-2 border-b border-[#243324]/10 bg-[#FBF9F5] shrink-0 animate-in fade-in duration-150">
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#F4EFE6] rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('amenities')}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'amenities'
                  ? 'bg-[#243324] text-white shadow-xs'
                  : 'text-[#5C695C] hover:text-[#243324]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Amenities</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('resale')}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'resale'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-[#5C695C] hover:text-[#243324]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resale 3Y</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('living')}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'living'
                  ? 'bg-[#243324] text-white shadow-xs'
                  : 'text-[#5C695C] hover:text-[#243324]'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Living</span>
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Sheet Content */}
      {sheetState !== 'peek' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-8 no-scrollbar">
          {/* Tab 1: Amenities */}
          {activeTab === 'amenities' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Score Gauge Card */}
              <ConvenienceScoreCard score={convenienceScore} />

              {/* MOE Primary School 1km & 2km Rings Toggle Card */}
              <div className="bg-indigo-50/80 rounded-2xl p-3 border border-indigo-200/80 flex items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                    <span>MOE School Priority Rings</span>
                  </div>
                  <p className="text-[10px] text-indigo-800 leading-tight">
                    Draw 1km (Blue) &amp; 2km (Orange) Phase 2C priority circles on map
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSchoolRings(!showSchoolRings)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showSchoolRings ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      showSchoolRings ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Estate Snapshot Grid */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#243324]/10 shadow-xs space-y-2.5">
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

                  {/* 1km MOE Schools */}
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
                        ? `🔥 ${neighborhoodHighlights.highRiskSchools1kmCount} High Ballot Risk`
                        : 'Phase 2C Priority'}
                    </div>
                  </div>

                  {/* Hawkers */}
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex flex-col justify-between">
                    <div className="text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Hawkers Nearby</span>
                    </div>
                    <div className="mt-1 font-bold text-amber-950 text-xs truncate">
                      {neighborhoodHighlights.hawkersCount} Hawker {neighborhoodHighlights.hawkersCount === 1 ? 'Centre' : 'Centres'}
                    </div>
                    <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                      Authentic SG Dining
                    </div>
                  </div>

                  {/* Groceries */}
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex flex-col justify-between">
                    <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Supermarkets</span>
                    </div>
                    <div className="mt-1 font-bold text-emerald-950 text-xs truncate">
                      {neighborhoodHighlights.supermarketsCount} {neighborhoodHighlights.supermarketsCount === 1 ? 'Store' : 'Stores'}
                    </div>
                    <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                      FairPrice / Groceries
                    </div>
                  </div>
                </div>
              </div>

              {/* In-List Search & Sort Bar */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-[#5C695C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Search amenities (e.g. FairPrice, Catholic)..."
                    className="w-full pl-8 pr-7 py-2 bg-white rounded-xl border border-[#243324]/15 text-xs text-[#243324] placeholder-[#5C695C]/60 focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />
                  {listSearch && (
                    <button
                      type="button"
                      onClick={() => setListSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#5C695C]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-white px-2 py-2 rounded-xl border border-[#243324]/15 shadow-2xs shrink-0">
                  <ArrowUpDown className="w-3 h-3 text-[#5C695C] shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    aria-label="Sort facilities by"
                    className="bg-transparent text-xs font-semibold text-[#243324] focus:outline-none"
                  >
                    <option value="distance">Distance</option>
                    <option value="time">Walk Time</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Amenity Accordion Categories */}
              <div className="space-y-2">
                {CATEGORIES_CONFIG.map((cat) => {
                  const items = amenitiesGrouped.get(cat.id);
                  if (!items || items.length === 0) return null;

                  const isSearching = listSearch.trim().length > 0;
                  const isExpanded = isSearching || expandedCategories.has(cat.id);
                  const Icon = cat.icon;

                  return (
                    <div
                      key={cat.id}
                      className="bg-white rounded-2xl border border-[#243324]/10 shadow-xs overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
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
                        <div className="p-3 pt-0 space-y-2 border-t border-[#243324]/5">
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
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: HDB Resale (3Y) */}
          {activeTab === 'resale' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <HdbResaleSection
                selectedProperty={selectedProperty}
                onOpenModal={onOpenResaleModal}
              />
            </div>
          )}

          {/* Tab 3: Living & Sun */}
          {activeTab === 'living' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <CommuteMatrixCard
                propertyLat={selectedProperty.lat}
                propertyLng={selectedProperty.lng}
                nearestMrt={neighborhoodHighlights.nearestMrt}
              />
              <SunOrientationCard />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
