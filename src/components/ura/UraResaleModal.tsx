'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SelectedProperty } from '@/data/types';
import {
  UraResaleAnalysis,
  UraTransaction,
  fetchUraTransactions,
} from '@/lib/uraProperty';
import { formatSgd, formatShortPrice } from './UraResaleSection';
import {
  X,
  TrendingUp,
  Building,
  Calendar,
  ArrowUpDown,
  ExternalLink,
  Search,
  Filter,
  Download,
  Building2,
  Sparkles,
  MapPin,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedProperty: SelectedProperty;
}

export default function UraResaleModal({
  isOpen,
  onClose,
  selectedProperty,
}: Props) {
  const [data, setData] = useState<UraResaleAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedSaleType, setSelectedSaleType] = useState<string>('ALL');
  const [selectedUnitCategory, setSelectedUnitCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'price_desc' | 'price_asc' | 'psf_desc' | 'psf_asc'>('date_desc');
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchUraTransactions({
          project: selectedProperty.name,
          street: selectedProperty.streetName || selectedProperty.address?.split(',')[0],
          postalCode: selectedProperty.postalCode,
          lat: selectedProperty.lat,
          lng: selectedProperty.lng,
        });

        if (isMounted) {
          setData(result);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load URA transactions');
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
  }, [isOpen, selectedProperty]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!data || !data.transactions) return [];

    return data.transactions
      .filter((tx) => {
        if (selectedSaleType !== 'ALL' && tx.typeOfSale !== selectedSaleType) {
          return false;
        }
        if (selectedUnitCategory !== 'ALL') {
          if (selectedUnitCategory === '1_BED' && tx.areaSqft > 520) return false;
          if (selectedUnitCategory === '2_BED' && (tx.areaSqft <= 520 || tx.areaSqft > 820)) return false;
          if (selectedUnitCategory === '3_BED' && (tx.areaSqft <= 820 || tx.areaSqft > 1250)) return false;
          if (selectedUnitCategory === '4_BED' && (tx.areaSqft <= 1250 || tx.areaSqft > 1700)) return false;
          if (selectedUnitCategory === '5_BED' && tx.areaSqft <= 1700) return false;
        }
        if (searchFilter.trim()) {
          const q = searchFilter.toLowerCase().trim();
          const matchFloor = tx.floorRange.toLowerCase().includes(q);
          const matchDate = tx.contractDateFormatted.toLowerCase().includes(q);
          const matchType = tx.propertyType.toLowerCase().includes(q);
          const matchPrice = String(tx.price).includes(q) || String(tx.pricePerSqft).includes(q);
          if (!matchFloor && !matchDate && !matchType && !matchPrice) return false;
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
  }, [data, selectedSaleType, selectedUnitCategory, searchFilter, sortBy]);

  // Export transactions to CSV
  const handleExportCsv = () => {
    if (!filteredTransactions.length) return;

    const headers = ['Contract Date', 'Area (Sqft)', 'Area (Sqm)', 'Price (SGD)', 'PSF (SGD)', 'Floor Range', 'Type of Sale', 'Property Type', 'Tenure'];
    const rows = filteredTransactions.map((t) => [
      t.contractDateFormatted,
      t.areaSqft,
      t.areaSqm,
      t.price,
      t.pricePerSqft,
      t.floorRange,
      t.typeOfSale,
      t.propertyType,
      t.tenure,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `ura_${(data?.projectName || 'condo').toLowerCase().replace(/\s+/g, '_')}_transactions.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const maxTrendPsf = Math.max(...(data?.quarterlyTrends.map((t) => t.avgPsf) || [2000]), 1000);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-[#243324]/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-[#FBF9F5] border-b border-[#243324]/10 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Official URA Private Property History
              </span>
              {data?.marketSegment && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {data.marketSegment}
                </span>
              )}
              {data?.district && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  Postal District {data.district}
                </span>
              )}
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#243324] mt-1 tracking-tight">
              {data?.projectName || selectedProperty.name}
            </h2>
            <p className="text-xs text-[#5C695C] mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{data?.streetName || selectedProperty.address}</span>
              {data?.tenure && <span>• {data.tenure}</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!filteredTransactions.length}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#243324] hover:text-amber-800 bg-white hover:bg-[#F3EFE6] px-3 py-2 rounded-xl border border-[#243324]/15 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#5C695C] hover:text-[#243324] hover:bg-[#243324]/5 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {isLoading ? (
            <div className="p-12 text-center text-[#5C695C] space-y-3">
              <div className="w-8 h-8 border-3 border-amber-700 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium">Loading URA transaction records...</p>
            </div>
          ) : error || !data ? (
            <div className="p-8 text-center text-[#5C695C] space-y-2 bg-[#FBF9F5] rounded-2xl border border-[#243324]/10">
              <p className="text-sm font-bold text-[#243324]">Transaction Records Not Found</p>
              <p className="text-xs">{error || 'No records available for this private property.'}</p>
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#243324]/10 space-y-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#5C695C]">
                    Average PSF
                  </span>
                  <div className="text-2xl font-serif font-bold text-[#243324]">
                    ${data.avgPsf.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#5C695C]">
                    Median: ${data.medianPsf.toLocaleString()} psf
                  </div>
                </div>

                <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#243324]/10 space-y-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#5C695C]">
                    Average Transacted Price
                  </span>
                  <div className="text-2xl font-serif font-bold text-[#243324]">
                    {formatShortPrice(data.avgPrice)}
                  </div>
                  <div className="text-xs text-[#5C695C]">
                    Median: {formatShortPrice(data.medianPrice)}
                  </div>
                </div>

                <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#243324]/10 space-y-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#5C695C]">
                    5-Year Total Volume
                  </span>
                  <div className="text-2xl font-serif font-bold text-amber-800">
                    {data.totalTransactions} units
                  </div>
                  <div className="text-xs text-[#5C695C]">
                    {data.timeframe.startPeriod} – {data.timeframe.endPeriod}
                  </div>
                </div>

                <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#243324]/10 space-y-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#5C695C]">
                    Price Range
                  </span>
                  <div className="text-lg font-serif font-bold text-[#243324] truncate">
                    {formatShortPrice(data.minPrice)} – {formatShortPrice(data.maxPrice)}
                  </div>
                  <div className="text-xs text-[#5C695C]">
                    ${data.minPsf.toLocaleString()} – ${data.maxPsf.toLocaleString()} psf
                  </div>
                </div>
              </div>

              {/* Price & PSF Trend Chart */}
              {data.quarterlyTrends && data.quarterlyTrends.length > 0 && (
                <div className="p-5 bg-[#FBF9F5] rounded-2xl border border-[#243324]/10 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5C695C] flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-amber-700" />
                      <span>5-Year Quarterly Price & PSF Trend (URA Records)</span>
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white text-[#5C695C] font-semibold border border-[#243324]/10">
                        Min: <strong className="text-[#243324]">${Math.min(...data.quarterlyTrends.map((t) => t.avgPsf)).toLocaleString()} psf</strong>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-900 font-semibold border border-amber-200">
                        Max: <strong className="text-amber-950">${Math.max(...data.quarterlyTrends.map((t) => t.avgPsf)).toLocaleString()} psf</strong>
                      </span>
                      {hoveredTrendIndex !== null && data.quarterlyTrends[hoveredTrendIndex] && (
                        <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          {data.quarterlyTrends[hoveredTrendIndex].label}: $
                          {data.quarterlyTrends[hoveredTrendIndex].avgPsf.toLocaleString()} psf (
                          {data.quarterlyTrends[hoveredTrendIndex].count} transactions)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-44 w-full bg-white rounded-xl p-4 border border-[#243324]/10 flex items-end gap-2 relative">
                    {data.quarterlyTrends.map((trend, idx) => {
                      const heightPct = Math.max(14, Math.round((trend.avgPsf / maxTrendPsf) * 100));
                      const isHovered = hoveredTrendIndex === idx;

                      return (
                        <div
                          key={trend.period}
                          onMouseEnter={() => setHoveredTrendIndex(idx)}
                          onMouseLeave={() => setHoveredTrendIndex(null)}
                          className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                        >
                          <div className="w-full h-32 relative flex items-end justify-center">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full max-w-[28px] min-h-[14px] rounded-t-sm transition-all duration-200 ${
                                isHovered
                                  ? 'bg-amber-700 shadow-md scale-y-105 origin-bottom'
                                  : 'bg-gradient-to-t from-amber-700 to-amber-500/80 group-hover:from-amber-600 group-hover:to-amber-400'
                              }`}
                            />
                          </div>
                          <span className="text-[10px] text-[#5C695C] mt-2 shrink-0 font-medium">
                            {trend.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Transactions Table Section with Filters */}
              <div className="space-y-4 pt-2 border-t border-[#243324]/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-lg text-[#243324]">
                      Historical Transactions ({filteredTransactions.length})
                    </h3>
                  </div>

                  {/* Filter Controls */}
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    {/* Search box */}
                    <div className="relative flex-1 sm:w-56">
                      <Search className="w-3.5 h-3.5 text-[#5C695C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search floor, date, sqft..."
                        className="w-full pl-8 pr-3 py-1.5 bg-[#FBF9F5] border border-[#243324]/15 rounded-xl text-xs text-[#243324] focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                      />
                    </div>

                    {/* Sale Type Selector */}
                    <select
                      value={selectedSaleType}
                      onChange={(e) => setSelectedSaleType(e.target.value)}
                      className="text-xs py-1.5 px-3 bg-[#FBF9F5] border border-[#243324]/15 rounded-xl text-[#243324] cursor-pointer"
                    >
                      <option value="ALL">All Sale Types</option>
                      <option value="Resale">Resale</option>
                      <option value="New Sale">New Sale</option>
                      <option value="Sub Sale">Sub Sale</option>
                    </select>

                    {/* Unit Size Selector */}
                    <select
                      value={selectedUnitCategory}
                      onChange={(e) => setSelectedUnitCategory(e.target.value)}
                      className="text-xs py-1.5 px-3 bg-[#FBF9F5] border border-[#243324]/15 rounded-xl text-[#243324] cursor-pointer"
                    >
                      <option value="ALL">All Unit Sizes</option>
                      <option value="1_BED">Studio / 1-Bed (&lt;520 sqft)</option>
                      <option value="2_BED">2-Bed (520–820 sqft)</option>
                      <option value="3_BED">3-Bed (820–1,250 sqft)</option>
                      <option value="4_BED">4-Bed (1,250–1,700 sqft)</option>
                      <option value="5_BED">5-Bed+ (&gt;1,700 sqft)</option>
                    </select>

                    {/* Sort Selector */}
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="text-xs py-1.5 px-3 bg-[#FBF9F5] border border-[#243324]/15 rounded-xl text-[#243324] cursor-pointer"
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

                {/* Table */}
                <div className="border border-[#243324]/10 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#FBF9F5] text-[#5C695C] uppercase text-[10px] font-bold border-b border-[#243324]/10">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Area (Sqft / Sqm)</th>
                          <th className="py-3 px-4">Floor Range</th>
                          <th className="py-3 px-4">Sale Type</th>
                          <th className="py-3 px-4">Property Type</th>
                          <th className="py-3 px-4 text-right">Price (SGD)</th>
                          <th className="py-3 px-4 text-right">PSF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#243324]/5 bg-white">
                        {filteredTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-[#FBF9F5]/70 transition-colors">
                            <td className="py-3 px-4 font-semibold text-[#243324]">
                              {tx.contractDateFormatted}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-[#243324]">
                                {tx.areaSqft.toLocaleString()} sqft
                              </span>{' '}
                              <span className="text-[11px] text-[#5C695C]">({tx.areaSqm} sqm)</span>
                            </td>
                            <td className="py-3 px-4 text-[#5C695C]">{tx.floorRange}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  tx.typeOfSale === 'New Sale'
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : tx.typeOfSale === 'Sub Sale'
                                    ? 'bg-purple-50 text-purple-800'
                                    : 'bg-amber-50 text-amber-800'
                                }`}
                              >
                                {tx.typeOfSale}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#5C695C]">{tx.propertyType}</td>
                            <td className="py-3 px-4 font-bold text-[#243324] text-right">
                              {formatSgd(tx.price)}
                            </td>
                            <td className="py-3 px-4 font-semibold text-amber-800 text-right">
                              ${tx.pricePerSqft.toLocaleString()} psf
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
