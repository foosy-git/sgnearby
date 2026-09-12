'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Database,
  X,
  ExternalLink,
  Building2,
  Train,
  Search,
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const CONSOLIDATED_SOURCES: DataSource[] = [
  {
    id: 'data-gov-sg',
    name: 'Data.gov.sg',
    description:
      'Official HDB resale flat transaction history (via live API), NEA hawker centres registry, NParks nature spaces & MOE school directories',
    url: 'https://data.gov.sg/',
    icon: Database,
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconColor: 'text-emerald-700',
  },
  {
    id: 'sla-onemap',
    name: 'Singapore Land Authority (SLA) / OneMap',
    description: 'Base map tiles, geocoding & address verification',
    url: 'https://www.onemap.gov.sg/',
    icon: Search,
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    iconColor: 'text-blue-700',
  },
  {
    id: 'lta-datamall',
    name: 'Land Transport Authority (LTA) DataMall',
    description: 'Comprehensive bus stop network & MRT/LRT rail lines',
    url: 'https://datamall.lta.gov.sg/',
    icon: Train,
    iconBg: 'bg-teal-500/10 border-teal-500/20',
    iconColor: 'text-teal-700',
  },
  {
    id: 'ura',
    name: 'Urban Redevelopment Authority (URA)',
    description: 'Private property transaction and PSF history',
    url: 'https://www.ura.gov.sg/maps/api/',
    icon: Building2,
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    iconColor: 'text-amber-700',
  },
];

interface Props {
  isMobile?: boolean;
}

export default function DataSourcesPopover({ isMobile = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Mouse hover handlers with slight grace period
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Database Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-1 sm:p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-emerald-200/80 text-emerald-950 ring-2 ring-emerald-600/30'
            : 'text-[#5C695C] hover:text-[#243324] hover:bg-[#243324]/5'
        }`}
        title="View Data Source Reference &amp; APIs"
        aria-label="View Data Source Reference"
        aria-expanded={isOpen}
      >
        <Database
          className={`${
            isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
          } text-emerald-700 transition-transform ${isOpen ? 'scale-110' : ''}`}
        />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className={`absolute ${
            isMobile ? 'left-[-40px] top-full mt-2' : 'left-0 top-full mt-2.5'
          } w-[92vw] max-w-[500px] sm:w-[480px] bg-white rounded-2xl border border-[#243324]/15 shadow-2xl overflow-hidden z-[200] animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header Banner */}
          <div className="bg-[#243324] text-[#FBF9F5] p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-sm sm:text-base tracking-tight text-white">
                Data Source Reference
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Consolidated Data Sources List */}
          <div className="p-3 bg-[#FBF9F5]/40 space-y-2.5 max-h-[60vh] sm:max-h-[440px] overflow-y-auto">
            {CONSOLIDATED_SOURCES.map((source) => {
              const IconComp = source.icon;
              return (
                <div
                  key={source.id}
                  className="p-3 bg-white rounded-xl border border-[#243324]/10 shadow-2xs hover:border-[#243324]/20 transition-all flex items-start gap-3"
                >
                  <div
                    className={`w-7 h-7 rounded-lg ${source.iconBg} border flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${source.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="font-bold text-xs text-[#243324]">
                        {source.name}
                      </h4>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-emerald-700 transition-colors inline-flex p-0.5"
                        title="Visit official portal"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-[#5C695C] mt-1 leading-relaxed">
                      {source.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
