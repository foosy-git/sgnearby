export interface HdbLifecycleInfo {
  leaseCommenceYear: number;
  flatAgeYears: number;
  remainingLeaseYears: number;
  leasePercentageRemaining: number;
  hipStatus: {
    category: 'HIP 1 (Pre-1987)' | 'Extended HIP (1987-1997)' | 'Modern Flat (Post-1997)';
    badgeClass: string;
    headline: string;
    description: string;
    checklist: string[];
  };
  cpfFinancingStatus: {
    isFullyFinanceable: boolean;
    badgeClass: string;
    title: string;
    advice: string;
  };
  exitResaleLiquidity: {
    tier: 'High' | 'Healthy' | 'Caution (Decay)';
    badgeClass: string;
    note: string;
  };
}

export function evaluateHdbLifecycle(
  leaseCommenceYear: number,
  buyerAge: number = 32
): HdbLifecycleInfo {
  const currentYear = new Date().getFullYear();
  const safeYear = leaseCommenceYear > 1950 && leaseCommenceYear <= currentYear ? leaseCommenceYear : 1995;
  const flatAge = currentYear - safeYear;
  const remainingLease = Math.max(0, 99 - flatAge);
  const leasePercent = Math.round((remainingLease / 99) * 100);

  // 1. HIP Analysis
  let hipCategory: HdbLifecycleInfo['hipStatus']['category'] = 'Modern Flat (Post-1997)';
  let hipBadgeClass = 'bg-blue-100 text-blue-900 border-blue-300';
  let hipHeadline = 'Modern Pre-Cast Construction';
  let hipDescription =
    'Built after 1997 with centralized refuse chutes and modern waterproofing. Does not require HIP structural overhauls in the near term.';
  let hipChecklist = [
    'Centralized rubbish chutes (minimal pest intrusion)',
    'Modern electrical load capacity (40A / 63A main switchboard)',
    'Low structural maintenance overhead',
  ];

  if (safeYear <= 1986) {
    hipCategory = 'HIP 1 (Pre-1987)';
    hipBadgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
    hipHeadline = 'Eligible / Completed HIP 1';
    hipDescription =
      'Flats built up to 1986 qualify for HDB Home Improvement Programme (HIP) covering essential spalling concrete repairs, pipe replacements, and optional toilet upgrading (subsidised up to 95%).';
    hipChecklist = [
      'Verify if seller has completed and paid for HIP upgrading billing',
      'Refurbished modern bathrooms with new waterproofing membrane',
      'Check for any individual refuse hopper odor seals inside the unit',
    ];
  } else if (safeYear <= 1997) {
    hipCategory = 'Extended HIP (1987-1997)';
    hipBadgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
    hipHeadline = 'Eligible for Extended HIP Phase';
    hipDescription =
      'Announced under MND Extended HIP to refresh middle-aged blocks approaching their 30-year mark. Major structural and cosmetic upgrades covered.';
    hipChecklist = [
      'Eligible for government-subsidized spalling concrete & structural repairs',
      'Potential upcoming toilet and entrance door rejuvenation',
      'Spacious floorplans typical of 1990s Model A / 4A layouts',
    ];
  }

  // 2. CPF Age 95 Rule Analysis
  const requiredLeaseToCoverAge95 = Math.max(0, 95 - buyerAge);
  const isFullyFinanceable = remainingLease >= requiredLeaseToCoverAge95;

  let cpfBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let cpfTitle = 'Full CPF Usage & Maximum Loan LTV Allowed';
  let cpfAdvice = `At age ${buyerAge}, this flat's ${remainingLease} years remaining lease comfortably covers you past age 95. You can use 100% of your CPF Ordinary Account up to the Valuation Limit and obtain the maximum loan tenure.`;

  if (!isFullyFinanceable) {
    cpfBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
    cpfTitle = 'Pro-Rated CPF & Loan Restrictions Apply';
    cpfAdvice = `Under CPF Board rules, because the remaining lease (${remainingLease} yrs) does not cover a ${buyerAge}-year-old buyer to age 95 (needs ${requiredLeaseToCoverAge95} yrs), CPF OA usage and loan LTV will be pro-rated. You must prepare extra cash for the downpayment.`;
  }

  // 3. Resale Exit Liquidity
  let exitTier: HdbLifecycleInfo['exitResaleLiquidity']['tier'] = 'Healthy';
  let exitBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let exitNote = 'Healthy 60–80 years remaining lease. High buyer demand and steady transaction volume.';

  if (remainingLease > 80) {
    exitTier = 'High';
    exitBadgeClass = 'bg-teal-100 text-teal-800 border-teal-300';
    exitNote = 'Prime lease (>80 yrs). Highest capital preservation and easily financeable by young couples with 30-year mortgages.';
  } else if (remainingLease < 60) {
    exitTier = 'Caution (Decay)';
    exitBadgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
    exitNote = 'Sub-60-year lease decay window. Bank loan tenures are shortened and future buyer pool skews towards older buyers and cash-rich downsizers.';
  }

  return {
    leaseCommenceYear: safeYear,
    flatAgeYears: flatAge,
    remainingLeaseYears: remainingLease,
    leasePercentageRemaining: leasePercent,
    hipStatus: {
      category: hipCategory,
      badgeClass: hipBadgeClass,
      headline: hipHeadline,
      description: hipDescription,
      checklist: hipChecklist,
    },
    cpfFinancingStatus: {
      isFullyFinanceable,
      badgeClass: cpfBadgeClass,
      title: cpfTitle,
      advice: cpfAdvice,
    },
    exitResaleLiquidity: {
      tier: exitTier,
      badgeClass: exitBadgeClass,
      note: exitNote,
    },
  };
}
