'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SelectedProperty } from '@/data/types';
import {
  HdbResaleAnalysis,
  HdbTransaction,
  BlockProximityInfo,
  calculateBlockProximity,
  fetchHdbResale,
  extractHdbStreetAndBlock,
  formatSgd,
  formatShortPrice,
  formatTransactionMonth,
  HDB_DATASET_URL,
} from '@/lib/hdbResale';
import LivePortalSearchCard from './LivePortalSearchCard';
import HdbLifecycleCard from './HdbLifecycleCard';
import {
  TrendingUp,
  Building,
  Calendar,
  Layers,
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Maximize2,
  RefreshCw,
  Info,
  SlidersHorizontal,
  Check,
  Search,
  Sparkles,
  Footprints,
} from 'lucide-react';

interface Props {
  selectedProperty: SelectedProperty;
  onOpenModal?: () => void;
}

export default function HdbResaleSection({ selectedProperty, onOpenModal }: Props) {
  const [data, setData] = useState<HdbResaleAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active filters (Multi-select dropdowns)
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>(['WALK_5MIN']);
  const [selectedFlatTypes, setSelectedFlatTypes] = useState<string[]>([]);
  const [isBlockDropdownOpen, setIsBlockDropdownOpen] = useState<boolean>(false);
  const [isFlatTypeDropdownOpen, setIsFlatTypeDropdownOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'price_desc' | 'price_asc' | 'psf_desc' | 'psf_asc'>('date_desc');

  // Transactions list: Collapsed by default
  const [isTransactionsExpanded, setIsTransactionsExpanded] = useState<boolean>(false);
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false);

  // Hovered data point for chart
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  const blockDropdownRef = useRef<HTMLDivElement>(null);
  const flatTypeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (blockDropdownRef.current && !blockDropdownRef.current.contains(event.target as Node)) {
        setIsBlockDropdownOpen(false);
      }
      if (flatTypeDropdownRef.current && !flatTypeDropdownRef.current.contains(event.target as Node)) {
        setIsFlatTypeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch data when selectedProperty changes
  useEffect(() => {
    let isMounted = true;
    const { block, streetName, postalCode } = extractHdbStreetAndBlock(selectedProperty);

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchHdbResale({
          street: streetName,
          block: block,
          address: selectedProperty.address,
          name: selectedProperty.name,
          postalCode: postalCode || selectedProperty.postalCode,
        });

        if (isMounted) {
          setData(result);
          // If the property has a specific block that exists in available blocks, select it, otherwise default to 5-min walk
          if (block && result.availableBlocks.some((b) => b.block.toUpperCase() === block.toUpperCase())) {
            setSelectedBlocks([block.toUpperCase()]);
          } else if (
            block &&
            result.availableBlocks.some((b) => b.block.toUpperCase().startsWith(block.toUpperCase()))
          ) {
            // e.g. Natura Loft "273" matching "273A"
            const matching = result.availableBlocks.find((b) =>
              b.block.toUpperCase().startsWith(block.toUpperCase())
            );
            if (matching) {
              setSelectedBlocks([matching.block]);
            } else {
              setSelectedBlocks(['WALK_5MIN']);
            }
          } else {
            setSelectedBlocks(['WALK_5MIN']);
          }
          setSelectedFlatTypes([]);
          setShowAllTransactions(false);
          setIsTransactionsExpanded(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load resale data');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedProperty]);

  const { block: originBlock } = useMemo(
    () => extractHdbStreetAndBlock(selectedProperty),
    [selectedProperty]
  );

  // Available blocks with walking proximity metadata
  const availableBlocks = useMemo(() => {
    if (!data) return [];
    if (data.availableBlocksWithProximity && data.availableBlocksWithProximity.length > 0) {
      return data.availableBlocksWithProximity;
    }
    return data.availableBlocks.map((b) => {
      const prox = calculateBlockProximity(b.block, originBlock);
      return {
        block: b.block,
        count: b.count,
        distanceMeters: prox.distanceMeters,
        walkingMinutes: prox.walkingMinutes,
        isWithin5MinWalk: prox.isWithin5MinWalk,
        isOrigin: prox.isOrigin,
      };
    });
  }, [data, originBlock]);

  // Total sales strictly within 5 mins walk (400m)
  const walk5MinCount = useMemo(() => {
    if (!data) return 0;
    if (typeof data.walk5MinCount === 'number') return data.walk5MinCount;
    return availableBlocks
      .filter((b) => b.isWithin5MinWalk)
      .reduce((acc, b) => acc + b.count, 0);
  }, [data, availableBlocks]);

  // Check if there are blocks beyond 5 mins walk (>400m)
  const hasOutsideBlocks = useMemo(() => {
    return availableBlocks.some((b) => !b.isWithin5MinWalk);
  }, [availableBlocks]);

  // Filtered transactions based on active blocks and flat types
  const filteredTransactions = useMemo(() => {
    if (!data || !data.transactions) return [];

    return data.transactions.filter((t) => {
      let matchBlock = false;
      if (selectedBlocks.includes('WALK_5MIN')) {
        matchBlock = t.isWithin5MinWalk !== false;
      } else if (selectedBlocks.includes('ALL')) {
        matchBlock = true;
      } else {
        matchBlock = selectedBlocks.some((b) => b.toUpperCase() === t.block.toUpperCase());
      }

      const matchType =
        selectedFlatTypes.length === 0 ||
        selectedFlatTypes.some((ft) => ft.toUpperCase() === t.flatType.toUpperCase());
      return matchBlock && matchType;
    });
  }, [data, selectedBlocks, selectedFlatTypes]);

  const toggleBlock = (block: string) => {
    if (block === 'WALK_5MIN') {
      setSelectedBlocks(['WALK_5MIN']);
      return;
    }
    if (block === 'ALL') {
      setSelectedBlocks(['ALL']);
      return;
    }
    setSelectedBlocks((prev) => {
      const clean = prev.filter((b) => b !== 'WALK_5MIN' && b !== 'ALL');
      if (clean.includes(block)) {
        const next = clean.filter((b) => b !== block);
        return next.length === 0 ? ['WALK_5MIN'] : next;
      } else {
        return [...clean, block];
      }
    });
  };

  const toggleFlatType = (flatType: string) => {
    setSelectedFlatTypes((prev) => {
      if (prev.includes(flatType)) {
        return prev.filter((ft) => ft !== flatType);
      } else {
        return [...prev, flatType];
      }
    });
  };

  // Sorted transactions
  const sortedTransactions = useMemo(() => {
    const list = [...filteredTransactions];
    switch (sortBy) {
      case 'date_asc':
        return list.sort((a, b) => a.month.localeCompare(b.month));
      case 'price_desc':
        return list.sort((a, b) => b.resalePrice - a.resalePrice);
      case 'price_asc':
        return list.sort((a, b) => a.resalePrice - b.resalePrice);
      case 'psf_desc':
        return list.sort((a, b) => b.pricePerSqft - a.pricePerSqft);
      case 'psf_asc':
        return list.sort((a, b) => a.pricePerSqft - b.pricePerSqft);
      case 'date_desc':
      default:
        return list.sort((a, b) => b.month.localeCompare(a.month));
    }
  }, [filteredTransactions, sortBy]);

  // Paginated/clipped transactions (10 vs All)
  const displayedTransactions = useMemo(() => {
    if (showAllTransactions) return sortedTransactions;
    return sortedTransactions.slice(0, 10);
  }, [sortedTransactions, showAllTransactions]);

  // Dynamic statistics for currently filtered subset
  const currentStats = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return {
        count: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgPsf: 0,
        avgSqm: 0,
      };
    }
    const count = filteredTransactions.length;
    const sumPrice = filteredTransactions.reduce((acc, t) => acc + t.resalePrice, 0);
    const sumPsf = filteredTransactions.reduce((acc, t) => acc + t.pricePerSqft, 0);
    const sumSqm = filteredTransactions.reduce((acc, t) => acc + t.floorAreaSqm, 0);
    const prices = filteredTransactions.map((t) => t.resalePrice);

    return {
      count,
      avgPrice: Math.round(sumPrice / count),
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPsf: Math.round(sumPsf / count),
      avgSqm: Math.round(sumSqm / count),
    };
  }, [filteredTransactions]);

  // Extract representative lease commence year for the selected block/street
  const leaseCommenceYear = useMemo(() => {
    if (filteredTransactions.length > 0) {
      const match = filteredTransactions.find((t) => t.leaseCommenceDate && t.leaseCommenceDate > 1950);
      if (match) return match.leaseCommenceDate;
    }
    if (data?.transactions && data.transactions.length > 0) {
      const match = data.transactions.find((t) => t.leaseCommenceDate && t.leaseCommenceDate > 1950);
      if (match) return match.leaseCommenceDate;
    }
    return 1995;
  }, [filteredTransactions, data]);

  // Chart data from filtered transactions (grouped by month)
  const chartTrends = useMemo(() => {
    if (filteredTransactions.length === 0) return [];
    const monthMap = new Map<string, { total: number; sum: number }>();
    for (const t of filteredTransactions) {
      if (!monthMap.has(t.month)) {
        monthMap.set(t.month, { total: 0, sum: 0 });
      }
      const item = monthMap.get(t.month)!;
      item.total += 1;
      item.sum += t.resalePrice;
    }

    const months = Array.from(monthMap.keys()).sort();
    return months.map((m) => {
      const item = monthMap.get(m)!;
      const [y, mon] = m.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const shortMonth = monthNames[parseInt(mon, 10) - 1] || mon;
      return {
        month: m,
        label: `${shortMonth} '${y.slice(2)}`,
        avgPrice: Math.round(item.sum / item.total),
        count: item.total,
      };
    });
  }, [filteredTransactions]);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-md w-3/4" />
        <div className="h-4 bg-slate-200 rounded-md w-1/2" />
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="h-20 bg-slate-200 rounded-xl" />
          <div className="h-20 bg-slate-200 rounded-xl" />
          <div className="h-20 bg-slate-200 rounded-xl" />
          <div className="h-20 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-32 bg-slate-200 rounded-xl mt-4" />
        <div className="space-y-2 mt-4">
          <div className="h-16 bg-slate-200 rounded-xl" />
          <div className="h-16 bg-slate-200 rounded-xl" />
          <div className="h-16 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  // Error or Non-HDB State
  if (error || !data || !data.hasTransactions) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>No HDB Resale Transactions Found</span>
          </div>
          <p className="text-xs leading-relaxed text-amber-800">
            {data?.message ||
              error ||
              'This selected location is either a private property / condominium, or there are no recorded HDB resale records along this street in the past 3 years.'}
          </p>
          <div className="pt-2">
            <a
              href={HDB_DATASET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 underline"
            >
              <span>Verify on data.gov.sg dataset d_8b84c4ee58e3cfc0ece0d773c8ca6abc</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Calculate SVG Chart Dimensions & Coordinates (with space for Y-axis labels)
  const chartHeight = 110;
  const chartWidth = 360;
  const paddingLeft = 52;
  const paddingRight = 14;
  const paddingY = 16;

  const actualMinPrice = chartTrends.length > 0 ? Math.min(...chartTrends.map((c) => c.avgPrice)) : 0;
  const actualMaxPrice = chartTrends.length > 0 ? Math.max(...chartTrends.map((c) => c.avgPrice)) : 0;
  const isFlat = actualMaxPrice === actualMinPrice;
  const minPriceVal = isFlat ? Math.round(actualMinPrice * 0.95) : actualMinPrice;
  const maxPriceVal = isFlat ? Math.round(actualMaxPrice * 1.05) : actualMaxPrice;
  const midPriceVal = Math.round((minPriceVal + maxPriceVal) / 2);
  const priceRange = maxPriceVal - minPriceVal || 1;

  const points = chartTrends.map((point, index) => {
    const x =
      paddingLeft +
      (index / Math.max(chartTrends.length - 1, 1)) * (chartWidth - paddingLeft - paddingRight);
    const y =
      chartHeight -
      paddingY -
      ((point.avgPrice - minPriceVal) / priceRange) * (chartHeight - paddingY * 2);
    return { x, y, ...point };
  });

  const svgPath = points.reduce((acc, curr, index) => {
    return index === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaPath =
    points.length > 0
      ? `${svgPath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
      : '';

  return (
    <div className="space-y-4">
      {/* Header & Dataset Attribution */}
      <div className="bg-white/95 rounded-2xl p-4 border border-[#243324]/10 shadow-xs space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Official HDB Resale Data
              </span>
              <span className="text-[11px] font-semibold text-[#5C695C]">
                Past 3 Years ({data.timeframe.startMonth} to {data.timeframe.endMonth})
              </span>
            </div>
            <h3 className="font-serif font-bold text-base text-[#243324] mt-1">
              {data.streetName}
              {data.town && <span className="text-[#5C695C] font-normal text-xs ml-1">({data.town})</span>}
            </h3>
          </div>

          {onOpenModal && (
            <button
              onClick={onOpenModal}
              className="p-1.5 rounded-lg border border-[#243324]/10 hover:bg-[#F4EFE6] text-[#243324] transition-colors"
              title="Expand to Fullscreen Analysis"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dataset ID Link */}
        <div className="pt-1 text-[11px] text-[#5C695C] flex items-center justify-between">
          <span>
            Dataset: <code className="bg-[#F4EFE6] px-1 rounded text-[10px]">d_8b84c4ee58e3cfc0ece0d773c8ca6abc</code>
          </span>
          <a
            href={HDB_DATASET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1"
          >
            <span>data.gov.sg</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Dropdown Multi-Selection Filters Grid: Block & Flat Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Block Dropdown Multi-Selection */}
        <div ref={blockDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsBlockDropdownOpen(!isBlockDropdownOpen);
              setIsFlatTypeDropdownOpen(false);
            }}
            className="w-full p-2.5 bg-white/95 rounded-xl border border-[#243324]/15 text-xs text-[#243324] font-medium flex items-center justify-between shadow-xs hover:border-[#243324]/30 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Footprints className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="font-bold text-[#243324] shrink-0">Block:</span>
              <span className="text-[#5C695C] truncate">
                {selectedBlocks.includes('WALK_5MIN')
                  ? `5-Min Walk (${walk5MinCount})`
                  : selectedBlocks.includes('ALL')
                  ? `All Street (${data?.totalTransactions || 0})`
                  : selectedBlocks.length === 1
                  ? `Blk ${selectedBlocks[0]}`
                  : `${selectedBlocks.length} Blocks Selected`}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#5C695C] shrink-0 transition-transform duration-200 ${
                isBlockDropdownOpen ? 'rotate-180 text-emerald-700' : ''
              }`}
            />
          </button>

          {isBlockDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-[#243324]/15 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] uppercase font-bold text-[#5C695C] px-2 py-0.5 tracking-wider border-b border-[#243324]/5 flex items-center justify-between">
                <span>Filter by Block Proximity</span>
              </div>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBlocks(['WALK_5MIN']);
                    setIsBlockDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    selectedBlocks.includes('WALK_5MIN')
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'hover:bg-[#F4EFE6]/70 text-[#243324]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Footprints className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Within 5 Mins Walk (~400m)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100/80 px-1.5 py-0.5 rounded-full">
                    {walk5MinCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBlocks(['ALL']);
                    setIsBlockDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    selectedBlocks.includes('ALL')
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'hover:bg-[#F4EFE6]/70 text-[#243324]'
                  }`}
                >
                  <span>All Street Blocks</span>
                  <span className="text-[10px] bg-[#243324]/10 px-1.5 py-0.5 rounded-full">
                    {data?.totalTransactions || 0}
                  </span>
                </button>
              </div>

              {availableBlocks.length > 0 && (
                <div className="border-t border-[#243324]/10 pt-1">
                  <div className="text-[10px] font-semibold text-[#5C695C] px-2 py-0.5">
                    Select Specific Blocks (Multi-select):
                  </div>
                  <div className="max-h-48 overflow-y-auto no-scrollbar space-y-0.5 pt-0.5">
                    {availableBlocks.map((b) => {
                      const isChecked = selectedBlocks.includes(b.block);
                      return (
                        <button
                          key={b.block}
                          type="button"
                          onClick={() => toggleBlock(b.block)}
                          className={`w-full text-left p-1.5 px-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            isChecked ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'hover:bg-slate-50 text-[#5C695C]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                isChecked
                                  ? 'bg-emerald-800 border-emerald-800 text-white'
                                  : 'border-[#243324]/30 bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span>Blk {b.block}</span>
                            {b.isOrigin && (
                              <span className="text-[9px] text-emerald-800 bg-emerald-100 px-1 rounded">
                                Origin
                              </span>
                            )}
                            {b.walkingMinutes ? (
                              <span className="text-[10px] opacity-70">(~{b.walkingMinutes}m)</span>
                            ) : null}
                          </div>
                          <span className="text-[10px] opacity-75">({b.count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Flat Type Dropdown Multi-Selection */}
        <div ref={flatTypeDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsFlatTypeDropdownOpen(!isFlatTypeDropdownOpen);
              setIsBlockDropdownOpen(false);
            }}
            className="w-full p-2.5 bg-white/95 rounded-xl border border-[#243324]/15 text-xs text-[#243324] font-medium flex items-center justify-between shadow-xs hover:border-[#243324]/30 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Layers className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="font-bold text-[#243324] shrink-0">Flat Type:</span>
              <span className="text-[#5C695C] truncate">
                {selectedFlatTypes.length === 0
                  ? 'All Flat Types'
                  : selectedFlatTypes.length === 1
                  ? selectedFlatTypes[0]
                  : `${selectedFlatTypes.length} Types Selected`}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#5C695C] shrink-0 transition-transform duration-200 ${
                isFlatTypeDropdownOpen ? 'rotate-180 text-emerald-700' : ''
              }`}
            />
          </button>

          {isFlatTypeDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-[#243324]/15 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#243324]/5 px-1">
                <span className="text-[10px] uppercase font-bold text-[#5C695C] tracking-wider">
                  Flat Types
                </span>
                {selectedFlatTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedFlatTypes([])}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    Reset to All
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedFlatTypes([])}
                className={`w-full text-left p-1.5 px-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  selectedFlatTypes.length === 0
                    ? 'bg-emerald-50 text-emerald-900 font-bold'
                    : 'hover:bg-[#F4EFE6]/70 text-[#243324]'
                }`}
              >
                <span>All Flat Types</span>
                <span className="text-[10px] bg-emerald-100/80 px-1.5 py-0.5 rounded-full">
                  {filteredTransactions.length}
                </span>
              </button>

              <div className="max-h-48 overflow-y-auto no-scrollbar space-y-0.5 pt-0.5">
                {data?.flatTypeSummaries.map((ft) => {
                  const isChecked = selectedFlatTypes.includes(ft.flatType);
                  return (
                    <button
                      key={ft.flatType}
                      type="button"
                      onClick={() => toggleFlatType(ft.flatType)}
                      className={`w-full text-left p-1.5 px-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isChecked ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'hover:bg-slate-50 text-[#5C695C]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            isChecked
                              ? 'bg-emerald-800 border-emerald-800 text-white'
                              : 'border-[#243324]/30 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>{ft.flatType}</span>
                      </div>
                      <div className="text-[10px] text-right">
                        <span className="font-semibold text-emerald-800">{formatShortPrice(ft.avgPrice)}</span>
                        <span className="opacity-70 ml-1">({ft.count})</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Average Price */}
        <div className="p-3 rounded-2xl bg-white/95 border border-[#243324]/10 shadow-xs flex flex-col justify-between">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#5C695C]">
            Avg Resale Price (3Y)
          </div>
          <div className="font-serif font-bold text-lg text-[#243324] mt-1">
            {formatSgd(currentStats.avgPrice)}
          </div>
          <div className="text-[10px] text-[#5C695C] mt-0.5">
            Range: {formatShortPrice(currentStats.minPrice)} – {formatShortPrice(currentStats.maxPrice)}
          </div>
        </div>

        {/* Average PSF */}
        <div className="p-3 rounded-2xl bg-white/95 border border-[#243324]/10 shadow-xs flex flex-col justify-between">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#5C695C]">
            Avg Price Per Sqft
          </div>
          <div className="font-serif font-bold text-lg text-emerald-800 mt-1">
            ${currentStats.avgPsf.toLocaleString()} <span className="text-xs font-normal">psf</span>
          </div>
          <div className="text-[10px] text-[#5C695C] mt-0.5">
            ~${Math.round(currentStats.avgPsf * 10.7639).toLocaleString()} / sqm
          </div>
        </div>

        {/* Transaction Count */}
        <div className="p-3 rounded-2xl bg-[#F4EFE6]/70 border border-[#243324]/10 shadow-xs flex flex-col justify-between">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#5C695C]">
            Total Transacted
          </div>
          <div className="font-bold text-base text-[#243324] mt-1">
            {currentStats.count} {currentStats.count === 1 ? 'sale' : 'sales'}
          </div>
          <div className="text-[10px] text-[#5C695C] mt-0.5">
            {selectedBlocks.includes('WALK_5MIN')
              ? 'Within 5 mins walk (~400m)'
              : selectedBlocks.includes('ALL')
              ? 'Across entire street'
              : selectedBlocks.length === 1
              ? `Block ${selectedBlocks[0]} only`
              : `${selectedBlocks.length} blocks filtered`}
          </div>
        </div>

        {/* Average Floor Area */}
        <div className="p-3 rounded-2xl bg-[#F4EFE6]/70 border border-[#243324]/10 shadow-xs flex flex-col justify-between">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#5C695C]">
            Avg Unit Area
          </div>
          <div className="font-bold text-base text-[#243324] mt-1">
            {currentStats.avgSqm} sqm
          </div>
          <div className="text-[10px] text-[#5C695C] mt-0.5">
            ~{Math.round(currentStats.avgSqm * 10.7639)} sqft
          </div>
        </div>
      </div>

      {/* 3-Year Resale Price Trend Chart */}
      {chartTrends.length > 1 && (
        <div className="bg-white/95 rounded-2xl p-4 border border-[#243324]/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <span className="text-xs font-bold text-[#243324] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span>3-Year Resale Price Trend</span>
            </span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[#5C695C] font-semibold border border-slate-200">
                Min: <strong className="text-[#243324]">{formatShortPrice(actualMinPrice)}</strong>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                Max: <strong className="text-emerald-950">{formatShortPrice(actualMaxPrice)}</strong>
              </span>
            </div>
          </div>

          {/* SVG Price Line Graph */}
          <div className="relative pt-1">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-28 overflow-visible"
            >
              {/* Background gradient */}
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines with Y-Axis Values */}
              {/* Max Gridline & Label */}
              <line
                x1={paddingLeft}
                y1={paddingY}
                x2={chartWidth - paddingRight}
                y2={paddingY}
                stroke="#E2E8F0"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 6}
                y={paddingY + 3.5}
                textAnchor="end"
                fill="#475569"
                fontSize="9"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {formatShortPrice(maxPriceVal)}
              </text>

              {/* Mid Gridline & Label */}
              <line
                x1={paddingLeft}
                y1={chartHeight / 2}
                x2={chartWidth - paddingRight}
                y2={chartHeight / 2}
                stroke="#F1F5F9"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 6}
                y={chartHeight / 2 + 3.5}
                textAnchor="end"
                fill="#94A3B8"
                fontSize="8"
                fontWeight="500"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {formatShortPrice(midPriceVal)}
              </text>

              {/* Min Gridline & Label */}
              <line
                x1={paddingLeft}
                y1={chartHeight - paddingY}
                x2={chartWidth - paddingRight}
                y2={chartHeight - paddingY}
                stroke="#E2E8F0"
              />
              <text
                x={paddingLeft - 6}
                y={chartHeight - paddingY + 3.5}
                textAnchor="end"
                fill="#475569"
                fontSize="9"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {formatShortPrice(minPriceVal)}
              </text>

              {/* Shaded Area */}
              {areaPath && <path d={areaPath} fill="url(#priceGradient)" />}

              {/* Trend Line */}
              {svgPath && (
                <path
                  d={svgPath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points */}
              {points.map((p, i) => (
                <g key={p.month}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredTrendIndex === i ? 5 : 3}
                    className="cursor-pointer transition-all duration-150"
                    fill={hoveredTrendIndex === i ? '#047857' : '#10B981'}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    onMouseEnter={() => setHoveredTrendIndex(i)}
                    onMouseLeave={() => setHoveredTrendIndex(null)}
                  />
                </g>
              ))}
            </svg>

            {/* X-Axis Month Range Footer */}
            <div className="flex items-center justify-between text-[10px] text-[#5C695C] px-1 pt-1 font-medium">
              <span>{chartTrends[0]?.label}</span>
              <span className="text-[9px] text-[#5C695C]/60 italic">Monthly Average Resale Price</span>
              <span>{chartTrends[chartTrends.length - 1]?.label}</span>
            </div>

            {/* Hover Tooltip display */}
            {hoveredTrendIndex !== null && points[hoveredTrendIndex] && (
              <div className="text-center mt-1.5 py-1 px-2.5 bg-[#243324] text-white text-[11px] rounded-lg shadow-md flex items-center justify-between">
                <span>{points[hoveredTrendIndex].label}</span>
                <span className="font-bold">{formatSgd(points[hoveredTrendIndex].avgPrice)}</span>
                <span className="text-[10px] text-emerald-300">
                  ({points[hoveredTrendIndex].count} {points[hoveredTrendIndex].count === 1 ? 'deal' : 'deals'})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HDB Block Age & HIP Upgrading Lifecycle */}
      <HdbLifecycleCard leaseCommenceYear={leaseCommenceYear} />

      {/* Transactions Section: Collapsed by Default */}
      <div className="bg-white/95 rounded-2xl border border-[#243324]/10 shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsTransactionsExpanded(!isTransactionsExpanded)}
          className="w-full p-3.5 flex items-center justify-between hover:bg-[#F4EFE6]/50 transition-colors text-left cursor-pointer"
        >
          <div>
            <div className="text-xs font-bold text-[#243324] flex items-center gap-1.5 flex-wrap">
              <span>Past 3 Years Transactions</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">
                {sortedTransactions.length} recorded {sortedTransactions.length === 1 ? 'sale' : 'sales'}
              </span>
            </div>
            <div className="text-[10px] text-[#5C695C] mt-0.5">
              {selectedBlocks.includes('WALK_5MIN')
                ? 'Within 5 mins walk (~400m)'
                : selectedBlocks.includes('ALL')
                ? 'Street-wide transactions'
                : `Filtered blocks (${selectedBlocks.join(', ')})`}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-800">
            <span>{isTransactionsExpanded ? 'Hide List' : 'View List'}</span>
            {isTransactionsExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {isTransactionsExpanded && (
          <div className="p-4 pt-0 border-t border-[#243324]/10 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between gap-2 pt-3">
              <div className="text-xs font-semibold text-[#5C695C]">
                {showAllTransactions ? (
                  <span>All {sortedTransactions.length} transactions</span>
                ) : (
                  <span>
                    Showing latest 10 of {sortedTransactions.length} sales
                  </span>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label="Sort transactions by"
                  className="text-[11px] font-semibold bg-[#F4EFE6] text-[#243324] py-1 px-2 rounded-lg border border-[#243324]/15 focus:outline-none cursor-pointer"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="psf_desc">PSF: High to Low</option>
                  <option value="psf_asc">PSF: Low to High</option>
                </select>
              </div>
            </div>

            {/* Transactions List Cards */}
            <div className="space-y-2">
              {displayedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-[#FBF9F5] border border-[#243324]/10 hover:border-emerald-600/30 transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#243324] text-white">
                          Blk {tx.block}
                        </span>
                        {tx.isOriginBlock ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            Selected Block
                          </span>
                        ) : tx.walkingMinutes ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F4EFE6] text-[#243324] border border-[#243324]/10">
                            🚶 ~{tx.walkingMinutes}m walk ({tx.distanceMeters}m)
                          </span>
                        ) : null}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {tx.flatType}
                        </span>
                        {tx.flatModel && (
                          <span className="text-[10px] text-[#5C695C] font-medium">({tx.flatModel})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#5C695C] mt-1">
                        Storey: <span className="font-semibold text-[#243324]">{tx.storeyRange}</span> • Floor Area:{' '}
                        <span className="font-semibold text-[#243324]">
                          {tx.floorAreaSqm} sqm (~{tx.floorAreaSqft} sqft)
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-serif font-bold text-sm text-[#243324]">
                        {formatSgd(tx.resalePrice)}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-800">
                        ${tx.pricePerSqft.toLocaleString()} psf
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-[#243324]/5 flex items-center justify-between text-[10px] text-[#5C695C]">
                    <span>Registered: {formatTransactionMonth(tx.month)}</span>
                    <span>Remaining Lease: {tx.remainingLease || `${99 - (2026 - tx.leaseCommenceDate)} yrs`}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Toggle between Latest 10 and All Transactions */}
            {sortedTransactions.length > 10 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAllTransactions(!showAllTransactions)}
                  className="w-full py-2.5 px-3 bg-[#F4EFE6] hover:bg-[#EAE4D8] text-[#243324] rounded-xl text-xs font-bold transition-all border border-[#243324]/10 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {showAllTransactions ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Show Latest 10 Transactions Only</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>
                        Show All {sortedTransactions.length} Past 3 Years Transactions
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Market Portals Bridge: PropertyGuru, 99.co */}
      <LivePortalSearchCard
        selectedProperty={selectedProperty}
        selectedFlatType={selectedFlatTypes.length === 1 ? selectedFlatTypes[0] : undefined}
      />
    </div>
  );
}
