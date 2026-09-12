'use client';

import React, { useState } from 'react';
import { SelectedProperty } from '@/data/types';
import { getPortalLinksWithMetadata } from '@/lib/portalLinks';
import {
  ExternalLink,
  Check,
  Copy,
} from 'lucide-react';

interface Props {
  selectedProperty: SelectedProperty;
  selectedFlatType?: string;
  medianPrice?: number;
  overrideProjectName?: string;
}

export default function LivePortalSearchCard({
  selectedProperty,
  selectedFlatType,
  overrideProjectName,
}: Props) {
  const [copiedPostal, setCopiedPostal] = useState(false);
  const portalData = getPortalLinksWithMetadata(selectedProperty, selectedFlatType, overrideProjectName);
  const portalLinks = portalData.links;

  const handleCopyPostal = () => {
    if (portalData.searchTerm) {
      navigator.clipboard.writeText(portalData.searchTerm);
      setCopiedPostal(true);
      setTimeout(() => setCopiedPostal(false), 2500);
    }
  };

  return (
    <div className="bg-white/95 rounded-2xl p-4 border border-[#243324]/10 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              Live Market Portals
            </span>
            <span className="text-[11px] font-semibold text-[#5C695C]">
              Active Listings for Sale
            </span>
            {portalData.isPostalCode && (
              <button
                type="button"
                onClick={handleCopyPostal}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors cursor-pointer"
                title="Click to copy postal code"
              >
                {copiedPostal ? (
                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                ) : (
                  <Copy className="w-2.5 h-2.5 text-blue-600" />
                )}
                <span>Postal S({portalData.searchTerm})</span>
                {copiedPostal && <span className="text-[9px] text-emerald-700 font-semibold">(Copied!)</span>}
              </button>
            )}
          </div>
          <h4 className="font-serif font-bold text-sm sm:text-base text-[#243324] mt-1">
            Search Available Units on Portals
          </h4>
        </div>
      </div>

      <p className="text-xs text-[#5C695C] leading-relaxed">
        {portalData.isPostalCode ? (
          <>
            Click any portal below to open active listings directly filtered to postal code <strong>S({portalData.searchTerm})</strong>:
          </>
        ) : (
          <>
            Historical data shows past transacted prices. Click any portal below to open active listings:
          </>
        )}
      </p>

      {/* Portal Shortcut Buttons Grid (PropertyGuru & 99.co) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {portalLinks.map((portal) => (
          <a
            key={portal.id}
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group p-3 rounded-xl border transition-all flex flex-col justify-between ${portal.badgeBg}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs group-hover:underline flex items-center gap-1">
                {portal.name}
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-[11px] opacity-80 mt-1 line-clamp-1">
              {portal.tagline}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
