import { useState } from 'react';
import { ConvenienceScore } from '@/data/types';
import {
  Train,
  Utensils,
  ShoppingCart,
  GraduationCap,
  Trees,
  Dumbbell,
  ShieldCheck,
  Info,
  X,
} from 'lucide-react';

interface Props {
  score: ConvenienceScore;
}

export default function ConvenienceScoreCard({ score }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (val >= 70) return 'text-amber-800 bg-amber-50 border-amber-200';
    if (val >= 45) return 'text-slate-700 bg-slate-50 border-slate-200';
    return 'text-rose-800 bg-rose-50 border-rose-200';
  };

  const getProgressColor = (val: number) => {
    if (val >= 85) return 'bg-emerald-600';
    if (val >= 70) return 'bg-amber-600';
    if (val >= 45) return 'bg-slate-500';
    return 'bg-rose-500';
  };

  const categories = [
    { label: 'Public Transit', val: score.transit, icon: Train },
    { label: 'Hawker & Dining', val: score.food, icon: Utensils },
    { label: 'Groceries & Malls', val: score.groceries, icon: ShoppingCart },
    { label: 'MOE Schools', val: score.schools, icon: GraduationCap },
    { label: 'Parks & Greenery', val: score.parks, icon: Trees },
    ...(score.sports !== undefined
      ? [{ label: 'Sports & ActiveSG', val: score.sports, icon: Dumbbell }]
      : []),
  ];

  return (
    <div
      style={{ zIndex: showTooltip ? 50 : 1 }}
      className="bg-[#FFFFFF]/90 backdrop-blur-md rounded-2xl p-4 border border-[#243324]/10 shadow-sm relative transition-all"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5C695C]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Walkability & Convenience</span>

            {/* Info Button with Hover Tooltip */}
            <div
              className="inline-flex items-center"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className="w-4 h-4 rounded-full bg-[#243324]/10 hover:bg-[#243324]/20 text-[#243324] flex items-center justify-center text-[10px] font-bold transition-colors cursor-help ml-0.5"
                aria-label="How score is calculated"
              >
                i
              </button>

              {/* Tooltip Content Popover (Anchored cleanly to the card) */}
              {showTooltip && (
                <div className="absolute left-2 right-2 sm:left-3 sm:right-3 top-12 z-[100] p-4 bg-[#243324] text-[#FBF9F5] rounded-2xl shadow-2xl border border-white/20 text-xs normal-case font-normal space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-2">
                    <div className="flex items-center gap-1.5 font-serif font-bold text-sm text-emerald-300">
                      <Info className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>How This Score Is Calculated</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTooltip(false);
                      }}
                      className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="Close tooltip"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] leading-relaxed text-white/90">
                    Scores are computed using an objective Singapore-specific walkability model (distance decay + amenity variety):
                  </p>

                  <div className="space-y-1.5 text-[11px] pt-1">
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-emerald-400 shrink-0">Transit (25%):</span>
                      <span className="text-white/80">
                        Proximity to nearest MRT/LRT (decay up to 1.4km) + bus stops within 500m.
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-amber-300 shrink-0">Food (25%):</span>
                      <span className="text-white/80">
                        Proximity and density of hawker centres, food courts, and coffeeshops within 800m.
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-emerald-300 shrink-0">Groceries (20%):</span>
                      <span className="text-white/80">
                        Proximity and density of supermarkets (FairPrice, Cold Storage, Sheng Siong) & malls.
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-indigo-300 shrink-0">Schools (15%):</span>
                      <span className="text-white/80">
                        MOE Primary Schools within the official 1km & 2km ballot priority zones.
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-teal-300 shrink-0">Greenery (10%):</span>
                      <span className="text-white/80">
                        Proximity to neighborhood parks, nature reserves, and PCN park connectors.
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-orange-300 shrink-0">Sports (5%):</span>
                      <span className="text-white/80">
                        Access to ActiveSG swimming complexes, sports halls, gyms & stadiums within 1.6km.
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-emerald-200/75 border-t border-white/10 pt-1.5 italic">
                    ★ 90+ Walker's Paradise • 75-89 Very Walkable • 50-74 Somewhat Walkable • 25-49 Mostly Car-Dependent • &lt;25 Car-Dependent
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="font-serif text-base font-medium text-[#243324] mt-0.5">
            {score.summaryLabel}
          </div>
        </div>
        <div
          className={`px-3 py-1.5 rounded-xl border font-serif text-xl font-bold flex flex-col items-center justify-center leading-none ${getScoreColor(
            score.overall
          )}`}
        >
          <span>{score.overall}</span>
          <span className="text-[10px] font-sans font-normal opacity-75">/100</span>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-[#243324]/5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[#243324]/80 font-medium">
                  <Icon className="w-3.5 h-3.5 text-[#5C695C]" />
                  {cat.label}
                </span>
                <span className="font-semibold text-[#243324]">{cat.val}</span>
              </div>
              <div className="h-1.5 w-full bg-[#243324]/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                    cat.val
                  )}`}
                  style={{ width: `${cat.val}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
