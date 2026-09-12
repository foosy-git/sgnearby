'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SelectedProperty } from '@/data/types';
import {
  HdbResaleAnalysis,
  HdbTransaction,
  BlockProximityInfo,
  calculateBlockProximity,
  formatSgd,
  formatShortPrice,
  formatTransactionMonth,
  HDB_DATASET_URL,
  extractHdbStreetAndBlock,
  fetchHdbResale,
} from '@/lib/hdbResale';
import LivePortalSearchCard from './LivePortalSearchCard';
import HdbLifecycleCard from './HdbLifecycleCard';
import {
  X,
  TrendingUp,
  Download,
  Building,
  Layers,
  ArrowUpDown,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Footprints,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedProperty: SelectedProperty;
  data?: HdbResaleAnalysis | null;
}

export default function HdbResaleModal({ isOpen, onClose, selectedProperty, data: propData }: Props) {
  const [internalData, setInternalData] = useState<HdbResaleAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const data = propData || internalData;

  const [selectedBlock, setSelectedBlock] = useState<string>('WALK_5MIN');
  const [selectedFlatType, setSelectedFlatType] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [sortField, setSortField] = useState<'month' | 'resalePrice' | 'pricePerSqft' | 'floorAreaSqm'>('month');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Self-fetch if opened without data
  useEffect(() => {
    if (!isOpen || propData) return;
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const { block, streetName, postalCode } = extractHdbStreetAndBlock(selectedProperty);
        const res = await fetchHdbResale({
          street: streetName,
          block: block,
          address: selectedProperty.address,
          name: selectedProperty.name,
          postalCode: postalCode || selectedProperty.postalCode,
        });
        if (isMounted) {
          setInternalData(res);
        }
      } catch (err) {
        console.warn('Error fetching resale in modal:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [isOpen, propData, selectedProperty]);

  const { block: originBlock } = useMemo(
    () => extractHdbStreetAndBlock(selectedProperty),
    [selectedProperty]
  );

  const availableBlocks = useMemo(() => {
    if (!data) return [];
    if (data.availableBlocksWithProximity && data.availableBlocksWithProximity.length > 0) {
      return data.availableBlocksWithProximity;
    }
    return (data.availableBlocks || []).map((b) => {
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

  const walk5MinCount = useMemo(() => {
    if (!data) return 0;
    if (typeof data.walk5MinCount === 'number') return data.walk5MinCount;
    return availableBlocks
      .filter((b) => b.isWithin5MinWalk)
      .reduce((acc, b) => acc + b.count, 0);
  }, [data, availableBlocks]);

  const hasOutsideBlocks = useMemo(() => {
    return availableBlocks.some((b) => !b.isWithin5MinWalk);
  }, [availableBlocks]);

  const leaseCommenceYear = useMemo(() => {
    if (!data) return 1995;
    const targetBlock = originBlock || (selectedBlock !== 'all' && !selectedBlock.startsWith('WALK_') ? selectedBlock : undefined);
    if (targetBlock && data.transactions) {
      const exactMatch = data.transactions.find(
        (t) => t.block.toUpperCase() === targetBlock.toUpperCase() && t.leaseCommenceDate && t.leaseCommenceDate > 1950
      );
      if (exactMatch) return exactMatch.leaseCommenceDate;
    }
    if (data.transactions && data.transactions.length > 0) {
      const match = data.transactions.find((t) => t.leaseCommenceDate && t.leaseCommenceDate > 1950);
      if (match) return match.leaseCommenceDate;
    }
    return 1995;
  }, [data, originBlock, selectedBlock]);

  // Filter transactions
  const filtered = useMemo(() => {
    if (!data || !data.transactions) return [];
    return data.transactions.filter((t) => {
      let matchBlock = false;
      if (selectedBlock === 'WALK_5MIN') {
        matchBlock = t.isWithin5MinWalk !== false;
      } else if (selectedBlock === 'ALL') {
        matchBlock = true;
      } else {
        matchBlock = t.block.toUpperCase() === selectedBlock.toUpperCase();
      }

      const matchType = selectedFlatType === 'ALL' || t.flatType.toUpperCase() === selectedFlatType.toUpperCase();
      if (!matchBlock || !matchType) return false;

      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const str = `${t.block} ${t.flatType} ${t.flatModel} ${t.storeyRange} ${t.resalePrice}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [data, selectedBlock, selectedFlatType, searchFilter]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let diff = 0;
      if (sortField === 'month') {
        diff = a.month.localeCompare(b.month);
      } else {
        diff = (a[sortField] as number) - (b[sortField] as number);
      }
      return sortAsc ? diff : -diff;
    });
  }, [filtered, sortField, sortAsc]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  if (!isOpen) return null;

  if (isLoading && !data) {
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-[#FBF9F5] p-8 rounded-2xl shadow-xl flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-[#243324]">Loading HDB resale transactions...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.hasTransactions) {
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-[#FBF9F5] p-6 rounded-2xl shadow-xl max-w-md w-full text-center space-y-3">
          <div className="font-serif font-bold text-base text-[#243324]">No HDB Resale Transactions</div>
          <p className="text-xs text-[#5C695C]">
            {data?.message || 'No HDB transactions were recorded for this address in the past 5 years. This location may be a private property.'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#243324] text-white rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // CSV Export handler
  const handleExportCsv = () => {
    if (!sorted.length) return;
    const headers = [
      'Month',
      'Town',
      'Flat Type',
      'Block',
      'Street Name',
      'Storey Range',
      'Floor Area Sqm',
      'Floor Area Sqft',
      'Flat Model',
      'Remaining Lease',
      'Resale Price SGD',
      'Price Per Sqft',
    ];

    const rows = sorted.map((t) => [
      t.month,
      `"${t.town}"`,
      `"${t.flatType}"`,
      `"${t.block}"`,
      `"${t.streetName}"`,
      `"${t.storeyRange}"`,
      t.floorAreaSqm,
      t.floorAreaSqft,
      `"${t.flatModel}"`,
      `"${t.remainingLease}"`,
      t.resalePrice,
      t.pricePerSqft,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `hdb_resale_${data.streetName.replace(/\s+/g, '_')}_5years.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FBF9F5] border border-[#243324]/20 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#243324]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#243324]/10 bg-white/90 backdrop-blur-md flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Official HDB Transactions
              </span>
              <span className="text-xs text-[#5C695C] font-semibold">
                Past 5 Years ({data.timeframe.startMonth} to {data.timeframe.endMonth}) • Within 5 Mins Walk (~400m)
              </span>
            </div>
            <h2 className="font-serif font-bold text-xl text-[#243324] mt-1">
              {data.streetName} {data.town ? `(${data.town})` : ''}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#5C695C] hover:text-[#243324] hover:bg-[#F4EFE6] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Filter Bar */}
        <div className="p-4 bg-white/60 border-b border-[#243324]/10 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Block Selector */}
          {availableBlocks.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#5C695C]">Scope / Block:</span>
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                aria-label="Filter by block or walk radius"
                className="bg-white border border-[#243324]/20 rounded-lg px-2.5 py-1 text-xs font-semibold"
              >
                <option value="WALK_5MIN">
                  🚶 Within 5 Mins Walk (~400m) ({walk5MinCount} sales)
                </option>
                {availableBlocks.map((b) => (
                  <option key={b.block} value={b.block}>
                    Blk {b.block} {b.isOrigin ? '(Selected)' : b.walkingMinutes ? `(~${b.walkingMinutes}m walk)` : ''} ({b.count} sales)
                  </option>
                ))}
                {hasOutsideBlocks && (
                  <option value="ALL">Entire Street ({data.totalTransactions} sales)</option>
                )}
              </select>
            </div>
          )}

          {/* Flat Type Selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#5C695C]">Flat Type:</span>
            <select
              value={selectedFlatType}
              onChange={(e) => setSelectedFlatType(e.target.value)}
              aria-label="Filter by flat type"
              className="bg-white border border-[#243324]/20 rounded-lg px-2.5 py-1 text-xs font-semibold"
            >
              <option value="ALL">All Flat Types</option>
              {data.flatTypeSummaries.map((ft) => (
                <option key={ft.flatType} value={ft.flatType}>
                  {ft.flatType} ({ft.count})
                </option>
              ))}
            </select>
          </div>

          {/* Quick In-Table Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#5C695C] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search storey, flat model..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-white border border-[#243324]/20 rounded-lg pl-8 pr-3 py-1 text-xs focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="text-[11px] text-[#5C695C] font-semibold">
            Showing {sorted.length} of {data.totalTransactions} records
          </div>
        </div>

        {/* Scrollable Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LivePortalSearchCard
              selectedProperty={selectedProperty}
              selectedFlatType={selectedFlatType}
              medianPrice={data.medianResalePrice}
            />
            <HdbLifecycleCard leaseCommenceYear={leaseCommenceYear} />
          </div>

          <div className="bg-white rounded-2xl border border-[#243324]/10 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F4EFE6]/80 border-b border-[#243324]/10 text-[#5C695C] uppercase text-[10px] font-bold tracking-wider">
                  <th
                    onClick={() => handleSort('month')}
                    className="p-3 cursor-pointer hover:text-[#243324]"
                  >
                    Month {sortField === 'month' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th className="p-3">Block</th>
                  <th className="p-3">Flat Type & Model</th>
                  <th className="p-3">Storey</th>
                  <th
                    onClick={() => handleSort('floorAreaSqm')}
                    className="p-3 cursor-pointer hover:text-[#243324]"
                  >
                    Floor Area {sortField === 'floorAreaSqm' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('pricePerSqft')}
                    className="p-3 cursor-pointer hover:text-[#243324]"
                  >
                    Price (PSF) {sortField === 'pricePerSqft' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('resalePrice')}
                    className="p-3 cursor-pointer hover:text-[#243324] text-right"
                  >
                    Resale Price {sortField === 'resalePrice' && (sortAsc ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243324]/5">
                {sorted.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FBF9F5] transition-colors">
                    <td className="p-3 font-semibold text-[#243324] whitespace-nowrap">
                      {formatTransactionMonth(t.month)}
                    </td>
                    <td className="p-3 font-bold text-[#243324] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>Blk {t.block}</span>
                        {t.isOriginBlock ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Selected
                          </span>
                        ) : t.walkingMinutes ? (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#F4EFE6] text-[#5C695C] border border-[#243324]/10">
                            ~{t.walkingMinutes}m
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-semibold text-emerald-950">{t.flatType}</span>
                      {t.flatModel && (
                        <span className="text-[11px] text-[#5C695C] ml-1">({t.flatModel})</span>
                      )}
                    </td>
                    <td className="p-3 text-[#5C695C] whitespace-nowrap">{t.storeyRange}</td>
                    <td className="p-3 text-[#243324] whitespace-nowrap">
                      {t.floorAreaSqm} sqm <span className="text-[#5C695C]">({t.floorAreaSqft} sqft)</span>
                    </td>
                    <td className="p-3 font-semibold text-emerald-800 whitespace-nowrap">
                      ${t.pricePerSqft.toLocaleString()} psf
                    </td>
                    <td className="p-3 font-serif font-bold text-[#243324] text-right whitespace-nowrap">
                      {formatSgd(t.resalePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#243324]/10 bg-[#F4EFE6]/60 flex items-center justify-between text-xs text-[#5C695C] shrink-0">
          <span>
            Source: Housing &amp; Development Board (HDB)
          </span>
          <a
            href={HDB_DATASET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-800 hover:text-emerald-950 font-bold inline-flex items-center gap-1"
          >
            <span>View dataset on data.gov.sg</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
