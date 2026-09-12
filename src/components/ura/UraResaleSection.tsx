'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SelectedProperty } from '@/data/types';
import {
  UraResaleAnalysis,
  UraTransaction,
  NearbyPrivateProject,
  fetchUraTransactions,
} from '@/lib/uraProperty';
import { getPortalLinksWithMetadata } from '@/lib/portalLinks';
import {
  TrendingUp,
  Building,
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
  Key,
  ShieldCheck,
  Tag,
  MapPin,
} from 'lucide-react';

interface Props {
  selectedProperty: SelectedProperty;
  onOpenModal?: () => void;
}

export function formatSgd(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortPrice(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${Math.round(amount / 1_000)}K`;
  }
  return `$${amount}`;
}

export default function UraResaleSection({
  selectedProperty,
  onOpenModal,
}: Props) {
  const [data, setData] = useState<UraResaleAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active project selection (if user picks a nearby condominium)
  const [activeProjectOverride, setActiveProjectOverride] = useState<string | null>(null);

  // Filters
  const [selectedSaleTypes, setSelectedSaleTypes] = useState<string[]>([]);
  const [selectedUnitCategory, setSelectedUnitCategory] = useState<string>('ALL');
  const [trendMetric, setTrendMetric] = useState<'psf' | 'price'>('psf');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'price_desc' | 'price_asc' | 'psf_desc' | 'psf_asc'>('date_desc');

  // Expand states
  const [isTransactionsExpanded, setIsTransactionsExpanded] = useState<boolean>(false);
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [isNearbyDropdownOpen, setIsNearbyDropdownOpen] = useState<boolean>(false);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  const handleRetry = useCallback(() => {
    setReloadTrigger((v) => v + 1);
  }, []);

  const nearbyDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (nearbyDropdownRef.current && !nearbyDropdownRef.current.contains(event.target as Node)) {
        setIsNearbyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset override when selected property changes
  useEffect(() => {
    setActiveProjectOverride(null);
  }, [selectedProperty.id, selectedProperty.name]);

  // Load URA transactions
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const queryProject = activeProjectOverride || selectedProperty.name;
        const result = await fetchUraTransactions({
          project: queryProject,
          street: selectedProperty.streetName || selectedProperty.address?.split(',')[0],
          postalCode: selectedProperty.postalCode,
          lat: selectedProperty.lat,
          lng: selectedProperty.lng,
        });

        if (isMounted) {
          setData(result);
          setIsTransactionsExpanded(false);
          setShowAllTransactions(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load URA transaction data');
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
  }, [selectedProperty, activeProjectOverride, reloadTrigger]);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    if (!data || !data.transactions) return [];

    return data.transactions
      .filter((tx) => {
        if (selectedSaleTypes.length > 0 && !selectedSaleTypes.includes(tx.typeOfSale)) {
          return false;
        }
        if (selectedUnitCategory !== 'ALL') {
          if (selectedUnitCategory === '1_BED' && tx.areaSqft > 520) return false;
          if (selectedUnitCategory === '2_BED' && (tx.areaSqft <= 520 || tx.areaSqft > 820)) return false;
          if (selectedUnitCategory === '3_BED' && (tx.areaSqft <= 820 || tx.areaSqft > 1250)) return false;
          if (selectedUnitCategory === '4_BED' && (tx.areaSqft <= 1250 || tx.areaSqft > 1700)) return false;
          if (selectedUnitCategory === '5_BED' && tx.areaSqft <= 1700) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.month.localeCompare(a.month);
        if (sortBy === 'date_asc') return a.month.localeCompare(b.month);
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'psf_desc') return b.pricePerSqft - a.pricePerSqft;
        if (sortBy === 'psf_asc') return a.pricePerSqft - b.pricePerSqft;
        return 0;
      });
  }, [data, selectedSaleTypes, selectedUnitCategory, sortBy]);

  // Derived filtered metrics
  const displayMetrics = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return {
        avgPrice: data?.avgPrice || 0,
        medianPrice: data?.medianPrice || 0,
        avgPsf: data?.avgPsf || 0,
        medianPsf: data?.medianPsf || 0,
        count: data?.totalTransactions || 0,
      };
    }

    const prices = filteredTransactions.map((t) => t.price).sort((a, b) => a - b);
    const psfs = filteredTransactions.map((t) => t.pricePerSqft).sort((a, b) => a - b);
    const count = filteredTransactions.length;
    const avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / count);
    const medianPrice = prices[Math.floor(count / 2)];
    const avgPsf = Math.round(psfs.reduce((s, p) => s + p, 0) / count);
    const medianPsf = psfs[Math.floor(count / 2)];

    return { avgPrice, medianPrice, avgPsf, medianPsf, count };
  }, [filteredTransactions, data]);

  // Count unit categories for quick filters
  const unitCategoryCounts = useMemo(() => {
    if (!data?.transactions) return {};
    const counts: Record<string, number> = {
      ALL: data.transactions.length,
      '1_BED': 0,
      '2_BED': 0,
      '3_BED': 0,
      '4_BED': 0,
      '5_BED': 0,
    };
    for (const t of data.transactions) {
      if (t.areaSqft <= 520) counts['1_BED']++;
      else if (t.areaSqft <= 820) counts['2_BED']++;
      else if (t.areaSqft <= 1250) counts['3_BED']++;
      else if (t.areaSqft <= 1700) counts['4_BED']++;
      else counts['5_BED']++;
    }
    return counts;
  }, [data?.transactions]);

  // Dynamic quarterly trends based on filtered transactions
  const currentQuarterlyTrends = useMemo(() => {
    const list = filteredTransactions && filteredTransactions.length > 0
      ? filteredTransactions
      : (data?.transactions || []);

    if (!list || list.length === 0) {
      return data?.quarterlyTrends || [];
    }

    const trendGroups = new Map<string, UraTransaction[]>();
    for (const t of list) {
      if (!trendGroups.has(t.quarter)) trendGroups.set(t.quarter, []);
      trendGroups.get(t.quarter)!.push(t);
    }

    const quarters = Array.from(trendGroups.keys()).sort();
    if (quarters.length === 0) return data?.quarterlyTrends || [];

    return quarters.map((q) => {
      const qList = trendGroups.get(q)!;
      const avgPrice = Math.round(qList.reduce((s, t) => s + t.price, 0) / qList.length);
      const avgPsf = Math.round(qList.reduce((s, t) => s + t.pricePerSqft, 0) / qList.length);
      const [year, qNum] = q.split('-');
      return {
        period: q,
        label: `${qNum} '${year.slice(2)}`,
        avgPrice,
        avgPsf,
        count: qList.length,
      };
    });
  }, [filteredTransactions, data?.transactions, data?.quarterlyTrends]);

  // SVG Chart Dimensions & Coordinates (matching HDB Resale price trend chart)
  const chartHeight = 110;
  const chartWidth = 360;
  const paddingLeft = 56;
  const paddingRight = 14;
  const paddingY = 16;

  const activeValues = useMemo(() => {
    return currentQuarterlyTrends.map((t) => (trendMetric === 'price' ? t.avgPrice : t.avgPsf));
  }, [currentQuarterlyTrends, trendMetric]);

  const actualMinVal = activeValues.length > 0 ? Math.min(...activeValues) : 0;
  const actualMaxVal = activeValues.length > 0 ? Math.max(...activeValues) : 0;
  const isFlat = actualMaxVal === actualMinVal;
  const minTrendVal = isFlat ? Math.round(actualMinVal * 0.95) : actualMinVal;
  const maxTrendVal = isFlat ? Math.round(actualMaxVal * 1.05) : actualMaxVal;
  const midTrendVal = Math.round((minTrendVal + maxTrendVal) / 2);
  const valRange = maxTrendVal - minTrendVal || 1;

  const trendPoints = useMemo(() => {
    return currentQuarterlyTrends.map((point, index) => {
      const val = trendMetric === 'price' ? point.avgPrice : point.avgPsf;
      const x =
        paddingLeft +
        (index / Math.max(currentQuarterlyTrends.length - 1, 1)) *
          (chartWidth - paddingLeft - paddingRight);
      const y =
        chartHeight -
        paddingY -
        ((val - minTrendVal) / valRange) * (chartHeight - paddingY * 2);
      return { x, y, val, ...point };
    });
  }, [currentQuarterlyTrends, trendMetric, minTrendVal, valRange]);

  const svgPath = useMemo(() => {
    return trendPoints.reduce((acc, curr, index) => {
      return index === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  }, [trendPoints]);

  const areaPath = useMemo(() => {
    return trendPoints.length > 0
      ? `${svgPath} L ${trendPoints[trendPoints.length - 1].x} ${chartHeight - paddingY} L ${trendPoints[0].x} ${chartHeight - paddingY} Z`
      : '';
  }, [svgPath, trendPoints]);

  const formatTrendVal = useCallback((val: number) => {
    if (trendMetric === 'price') {
      return formatShortPrice(val);
    }
    return `$${Math.round(val).toLocaleString()}`;
  }, [trendMetric]);

  const currentProjectName = data?.projectName || activeProjectOverride || selectedProperty.name;
  const portalData = useMemo(
    () => getPortalLinksWithMetadata(selectedProperty, undefined, currentProjectName),
    [selectedProperty, currentProjectName]
  );

  if (isLoading) {
    return (
      <div className="p-5 bg-white/95 rounded-2xl border border-[#243324]/10 shadow-xs space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-[#243324]/10 rounded-md"></div>
          <div className="h-5 w-24 bg-[#243324]/10 rounded-md"></div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-16 bg-[#243324]/5 rounded-xl"></div>
          <div className="h-16 bg-[#243324]/5 rounded-xl"></div>
        </div>
        <div className="h-36 bg-[#243324]/5 rounded-xl"></div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="p-5 bg-white/95 rounded-2xl border border-[#243324]/10 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-amber-700">
          <Info className="w-5 h-5 shrink-0" />
          <h4 className="font-serif font-bold text-sm text-[#243324]">
            Private Property Transaction Analytics
          </h4>
        </div>
        <p className="text-xs text-[#5C695C] leading-relaxed">
          {error || 'Unable to retrieve private residential records for this location.'}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="flex-1 py-2 px-3 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>

        {/* Live Property Portals Card (PropertyGuru & 99.co) */}
        <div className="pt-2 border-t border-[#243324]/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#5C695C]">
              Live Market Listings & Portals
            </span>
            {portalData.isPostalCode && (
              <span className="text-[10px] font-semibold text-[#5C695C]">
                Postal: S({portalData.searchTerm})
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {portalData.links.map((portal) => (
              <a
                key={portal.id}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all group ${portal.badgeBg}`}
              >
                <div className="min-w-0 pr-1">
                  <div className="font-semibold group-hover:underline truncate">
                    {portal.name}
                  </div>
                  <div className="text-[10px] opacity-75 truncate">{portal.tagline}</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 rounded-2xl p-4 border border-[#243324]/10 shadow-xs space-y-4">
      {/* Header with Project Name & Badges */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                URA Private Property
              </span>
              {data.marketSegment && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {data.marketSegment}
                </span>
              )}
              {data.district && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  District {data.district}
                </span>
              )}
            </div>
            <h3 className="font-serif font-bold text-lg text-[#243324] mt-1 tracking-tight">
              {data.projectName}
            </h3>
            <p className="text-xs text-[#5C695C] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#5C695C]" />
              <span>{data.streetName}</span>
              {data.tenure && <span>• {data.tenure}</span>}
            </p>
          </div>

          {onOpenModal && (
            <button
              type="button"
              onClick={onOpenModal}
              title="Expand Full Analytics Modal"
              className="p-1.5 text-[#5C695C] hover:text-[#243324] hover:bg-[#243324]/5 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nearby Projects Switcher if cluster has other developments */}
        {data.nearbyProjects && data.nearbyProjects.length > 1 && (
          <div className="relative pt-1" ref={nearbyDropdownRef}>
            <button
              type="button"
              onClick={() => setIsNearbyDropdownOpen(!isNearbyDropdownOpen)}
              className="w-full flex items-center justify-between text-xs py-1.5 px-2.5 bg-[#FBF9F5] hover:bg-[#F3EFE6] rounded-xl border border-[#243324]/10 transition-colors cursor-pointer text-[#243324]"
            >
              <span className="flex items-center gap-1.5 font-medium truncate">
                <Building className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="text-[#5C695C]">Compare Nearby:</span>
                <span className="font-bold truncate">{data.projectName}</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#5C695C] shrink-0 ml-1" />
            </button>

            {isNearbyDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-xl shadow-lg border border-[#243324]/15 py-1 max-h-56 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold text-[#5C695C] uppercase tracking-wider border-b border-[#243324]/5">
                  Private Condominiums Nearby
                </div>
                {data.nearbyProjects.map((p) => (
                  <button
                    key={p.projectName}
                    type="button"
                    onClick={() => {
                      setActiveProjectOverride(p.projectName);
                      setIsNearbyDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50/70 transition-colors cursor-pointer ${
                      p.projectName === data.projectName ? 'bg-amber-50 font-bold text-amber-900' : 'text-[#243324]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate">{p.projectName}</div>
                      <div className="text-[10px] text-[#5C695C] font-normal">
                        {p.street} {p.distanceMeters > 0 && `• ${p.distanceMeters}m away`}
                      </div>
                    </div>
                    {p.latestPsf && (
                      <span className="text-[11px] font-semibold text-amber-800 shrink-0">
                        ${p.latestPsf.toLocaleString()} psf
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Avg PSF */}
        <div className="p-2.5 bg-[#FBF9F5] rounded-xl border border-[#243324]/10 space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#5C695C]">
            Avg PSF
          </span>
          <div className="text-base font-serif font-bold text-[#243324]">
            ${displayMetrics.avgPsf.toLocaleString()}
          </div>
          <span className="text-[10px] text-[#5C695C]">
            Med: ${displayMetrics.medianPsf.toLocaleString()} psf
          </span>
        </div>

        {/* Avg Transacted Price */}
        <div className="p-2.5 bg-[#FBF9F5] rounded-xl border border-[#243324]/10 space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#5C695C]">
            Avg Price
          </span>
          <div className="text-base font-serif font-bold text-[#243324]">
            {formatShortPrice(displayMetrics.avgPrice)}
          </div>
          <span className="text-[10px] text-[#5C695C]">
            Med: {formatShortPrice(displayMetrics.medianPrice)}
          </span>
        </div>

        {/* Historical Transactions Volume */}
        <div className="p-2.5 bg-[#FBF9F5] rounded-xl border border-[#243324]/10 space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#5C695C]">
            5Y Volume
          </span>
          <div className="text-base font-serif font-bold text-amber-800">
            {displayMetrics.count} units
          </div>
          <span className="text-[10px] text-[#5C695C]">
            {data.timeframe.startPeriod} – {data.timeframe.endPeriod}
          </span>
        </div>

        {/* Price Range */}
        <div className="p-2.5 bg-[#FBF9F5] rounded-xl border border-[#243324]/10 space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#5C695C]">
            Price Range
          </span>
          <div className="text-sm font-bold text-[#243324] truncate">
            {formatShortPrice(data.minPrice)} - {formatShortPrice(data.maxPrice)}
          </div>
          <span className="text-[10px] text-[#5C695C]">
            ${data.minPsf} - ${data.maxPsf} psf
          </span>
        </div>
      </div>

      {/* Unit Type Filter Pills */}
      {data.transactions && data.transactions.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#5C695C]">
                Filter by Unit Type
              </span>
              <span className="text-[9px] text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded font-medium border border-amber-200" title="URA transactions only record floor area; unit layouts are estimated by Singapore market benchmarks">
                Estimated by area (sqft)
              </span>
            </div>
            {selectedUnitCategory !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedUnitCategory('ALL')}
                className="text-[10px] text-amber-800 font-semibold hover:underline cursor-pointer"
              >
                Reset to All
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: 'All Units' },
              { id: '1_BED', label: '1-Bed (<520 sqft)' },
              { id: '2_BED', label: '2-Bed (520–820 sqft)' },
              { id: '3_BED', label: '3-Bed (820–1,250 sqft)' },
              { id: '4_BED', label: '4-Bed (1,250–1,700 sqft)' },
              { id: '5_BED', label: '5-Bed+ (>1,700 sqft)' },
            ]
              .filter((f) => f.id === 'ALL' || (unitCategoryCounts[f.id] ?? 0) > 0)
              .map((filter) => {
                const count = unitCategoryCounts[filter.id] ?? 0;
                const isSelected = selectedUnitCategory === filter.id;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setSelectedUnitCategory(filter.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-800 text-white shadow-2xs'
                        : 'bg-[#F4EFE6] text-[#243324] hover:bg-amber-100/80 border border-[#243324]/5'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded-full ${
                        isSelected ? 'bg-amber-900/60 text-amber-200' : 'bg-black/5 text-[#5C695C]'
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

      {/* Price & PSF Trend SVG Line Chart */}
      {currentQuarterlyTrends && currentQuarterlyTrends.length > 0 && (
        <div className="bg-white/95 rounded-2xl p-4 border border-[#243324]/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#243324] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                <span>5-Year Price & PSF Trend</span>
              </span>
              {/* Metric Toggle: PSF vs Price */}
              <div className="flex items-center bg-[#F4EFE6] rounded-md p-0.5 border border-[#243324]/10 text-[10px]">
                <button
                  type="button"
                  onClick={() => setTrendMetric('psf')}
                  className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    trendMetric === 'psf'
                      ? 'bg-white text-amber-900 shadow-2xs'
                      : 'text-[#5C695C] hover:text-[#243324]'
                  }`}
                >
                  PSF
                </button>
                <button
                  type="button"
                  onClick={() => setTrendMetric('price')}
                  className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    trendMetric === 'price'
                      ? 'bg-white text-amber-900 shadow-2xs'
                      : 'text-[#5C695C] hover:text-[#243324]'
                  }`}
                >
                  Price
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[#5C695C] font-semibold border border-slate-200">
                Min: <strong className="text-[#243324]">{formatTrendVal(actualMinVal)}{trendMetric === 'psf' ? ' psf' : ''}</strong>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                Max: <strong className="text-amber-950">{formatTrendVal(actualMaxVal)}{trendMetric === 'psf' ? ' psf' : ''}</strong>
              </span>
            </div>
          </div>

          {/* SVG Price/PSF Line Graph */}
          <div className="relative pt-1">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-28 overflow-visible"
            >
              {/* Amber background gradient */}
              <defs>
                <linearGradient id="uraTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0.0" />
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
                {formatTrendVal(maxTrendVal)}
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
                {formatTrendVal(midTrendVal)}
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
                {formatTrendVal(minTrendVal)}
              </text>

              {/* Shaded Area */}
              {areaPath && <path d={areaPath} fill="url(#uraTrendGradient)" />}

              {/* Trend Line */}
              {svgPath && (
                <path
                  d={svgPath}
                  fill="none"
                  stroke="#B45309"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points */}
              {trendPoints.map((p, i) => (
                <g key={p.period}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredTrendIndex === i ? 5 : 3}
                    className="cursor-pointer transition-all duration-150"
                    fill={hoveredTrendIndex === i ? '#92400E' : '#D97706'}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    onMouseEnter={() => setHoveredTrendIndex(i)}
                    onMouseLeave={() => setHoveredTrendIndex(null)}
                  />
                </g>
              ))}
            </svg>

            {/* X-Axis Quarter Range Footer */}
            <div className="flex items-center justify-between text-[10px] text-[#5C695C] px-1 pt-1 font-medium">
              <span>{currentQuarterlyTrends[0]?.label}</span>
              <span className="text-[9px] text-[#5C695C]/60 italic">
                Quarterly Average {trendMetric === 'price' ? 'Price' : 'PSF'}
              </span>
              <span>{currentQuarterlyTrends[currentQuarterlyTrends.length - 1]?.label}</span>
            </div>

            {/* Hover Tooltip display */}
            {hoveredTrendIndex !== null && trendPoints[hoveredTrendIndex] && (
              <div className="text-center mt-1.5 py-1 px-2.5 bg-[#243324] text-white text-[11px] rounded-lg shadow-md flex items-center justify-between">
                <span>{trendPoints[hoveredTrendIndex].label}</span>
                <span className="font-bold">
                  ${trendPoints[hoveredTrendIndex].avgPsf.toLocaleString()} psf ({formatShortPrice(trendPoints[hoveredTrendIndex].avgPrice)})
                </span>
                <span className="text-[10px] text-amber-300">
                  ({trendPoints[hoveredTrendIndex].count} {trendPoints[hoveredTrendIndex].count === 1 ? 'sale' : 'sales'})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters & Transaction Table */}
      <div className="space-y-2.5 pt-2 border-t border-[#243324]/10">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsTransactionsExpanded(!isTransactionsExpanded)}
            className="text-xs font-bold text-[#243324] flex items-center gap-1.5 hover:text-amber-800 transition-colors cursor-pointer"
          >
            <span>Transaction History ({filteredTransactions.length})</span>
            {isTransactionsExpanded ? (
              <ChevronUp className="w-4 h-4 text-[#5C695C]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#5C695C]" />
            )}
          </button>

          <div className="flex items-center gap-1">
            {/* Sale Type Pills */}
            <button
              type="button"
              onClick={() =>
                setSelectedSaleTypes((prev) =>
                  prev.includes('Resale') ? prev.filter((s) => s !== 'Resale') : [...prev, 'Resale']
                )
              }
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                selectedSaleTypes.includes('Resale')
                  ? 'bg-amber-800 text-white shadow-2xs'
                  : 'bg-[#FBF9F5] text-[#5C695C] hover:text-[#243324] border border-[#243324]/10'
              }`}
            >
              Resale
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedSaleTypes((prev) =>
                  prev.includes('New Sale') ? prev.filter((s) => s !== 'New Sale') : [...prev, 'New Sale']
                )
              }
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                selectedSaleTypes.includes('New Sale')
                  ? 'bg-amber-800 text-white shadow-2xs'
                  : 'bg-[#FBF9F5] text-[#5C695C] hover:text-[#243324] border border-[#243324]/10'
              }`}
            >
              New Sale
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedSaleTypes((prev) =>
                  prev.includes('Sub Sale') ? prev.filter((s) => s !== 'Sub Sale') : [...prev, 'Sub Sale']
                )
              }
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                selectedSaleTypes.includes('Sub Sale')
                  ? 'bg-amber-800 text-white shadow-2xs'
                  : 'bg-[#FBF9F5] text-[#5C695C] hover:text-[#243324] border border-[#243324]/10'
              }`}
            >
              Sub Sale
            </button>
          </div>
        </div>

        {/* Collapsible Transactions List */}
        {isTransactionsExpanded && (
          <div className="space-y-2 animate-in fade-in duration-150">
            <div className="divide-y divide-[#243324]/5 border border-[#243324]/10 rounded-xl overflow-hidden bg-white text-xs">
              {filteredTransactions
                .slice(0, showAllTransactions ? 50 : 6)
                .map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 flex items-center justify-between hover:bg-[#FBF9F5] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#243324]">
                          {tx.areaSqft.toLocaleString()} sqft
                        </span>
                        <span className="text-[10px] text-[#5C695C]">
                          ({tx.areaSqm} sqm)
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm ${
                            tx.typeOfSale === 'New Sale'
                              ? 'bg-emerald-50 text-emerald-800'
                              : tx.typeOfSale === 'Sub Sale'
                              ? 'bg-purple-50 text-purple-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {tx.typeOfSale}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#5C695C] mt-0.5">
                        {tx.contractDateFormatted} • Floor {tx.floorRange}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-[#243324]">
                        {formatSgd(tx.price)}
                      </div>
                      <div className="text-[10px] text-amber-800 font-semibold">
                        ${tx.pricePerSqft.toLocaleString()} psf
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {filteredTransactions.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="w-full py-1.5 text-center text-xs font-bold text-amber-800 hover:text-amber-900 bg-[#FBF9F5] hover:bg-[#F3EFE6] rounded-xl border border-[#243324]/10 transition-colors cursor-pointer"
              >
                {showAllTransactions
                  ? 'Show Fewer Records'
                  : `View All ${filteredTransactions.length} Transactions`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Live Property Portals Card (PropertyGuru & 99.co) */}
      <div className="pt-2 border-t border-[#243324]/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5C695C]">
            Live Market Listings & Portals
          </span>
          {portalData.isPostalCode && (
            <span className="text-[10px] font-semibold text-[#5C695C]">
              Postal: S({portalData.searchTerm})
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {portalData.links.map((portal) => (
            <a
              key={portal.id}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all group ${portal.badgeBg}`}
            >
              <div className="min-w-0 pr-1">
                <div className="font-semibold group-hover:underline truncate">
                  {portal.name}
                </div>
                <div className="text-[10px] opacity-75 truncate">{portal.tagline}</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
