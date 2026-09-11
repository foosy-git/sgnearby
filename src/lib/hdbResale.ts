import { SelectedProperty } from '@/data/types';

export const HDB_DATASET_ID = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';
export const HDB_DATASET_URL =
  'https://data.gov.sg/datasets?topics=housing&resultId=d_8b84c4ee58e3cfc0ece0d773c8ca6abc';

export interface HdbTransaction {
  id: string | number;
  month: string; // '2026-08'
  town: string;
  flatType: string; // '4 ROOM', '5 ROOM', etc.
  block: string;
  streetName: string;
  storeyRange: string; // '31 TO 33'
  floorAreaSqm: number;
  floorAreaSqft: number;
  flatModel: string; // 'DBSS', 'Type S2', 'Model A', etc.
  leaseCommenceDate: number;
  remainingLease: string;
  resalePrice: number;
  pricePerSqft: number;
  pricePerSqm: number;
  distanceMeters?: number;
  walkingMinutes?: number;
  isWithin5MinWalk?: boolean;
  isOriginBlock?: boolean;
}

export interface FlatTypeSummary {
  flatType: string;
  count: number;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPsf: number;
  avgPsqm: number;
  avgFloorAreaSqm: number;
}

export interface MonthlyTrend {
  period: string; // '2024-03' or '2024-Q1'
  label: string; // 'Mar 24' or 'Q1 24'
  avgPrice: number;
  avgPsf: number;
  count: number;
}

export interface BlockCount {
  block: string;
  count: number;
}

export interface BlockProximityInfo {
  block: string;
  count: number;
  distanceMeters: number;
  walkingMinutes: number;
  isWithin5MinWalk: boolean;
  isOrigin: boolean;
}

export interface HdbResaleAnalysis {
  streetName: string;
  queryBlock?: string;
  selectedBlockFilter?: string; // '5MIN_WALK', 'ALL', or specific block like '273A'
  town?: string;
  datasetId: string;
  datasetUrl: string;
  timeframe: {
    startMonth: string;
    endMonth: string;
    monthsCovered: number;
  };
  totalTransactions: number;
  walk5MinCount?: number;
  avgResalePrice: number;
  medianResalePrice: number;
  minPrice: number;
  maxPrice: number;
  avgPsf: number;
  avgPsqm: number;
  flatTypeSummaries: FlatTypeSummary[];
  monthlyTrends: MonthlyTrend[];
  availableBlocks: BlockCount[];
  availableBlocksWithProximity?: BlockProximityInfo[];
  transactions: HdbTransaction[];
  hasTransactions: boolean;
  message?: string;
}

/**
 * Normalizes Singapore road/street names into official HDB dataset abbreviations.
 * e.g., "Bishan Street 24" -> "BISHAN ST 24"
 *       "Cantonment Road" -> "CANTONMENT RD"
 */
export function normalizeStreetName(road: string): string {
  if (!road) return '';
  let s = road.toUpperCase().trim();

  // Strip Singapore country suffix or postal codes
  s = s.replace(/,?\s*SINGAPORE\s*\d*/gi, '').trim();
  s = s.replace(/^[,\s]+|[,\s]+$/g, '');

  const replacements: [RegExp, string][] = [
    [/\bSTREET\b/g, 'ST'],
    [/\bAVENUE\b/g, 'AVE'],
    [/\bROAD\b/g, 'RD'],
    [/\bDRIVE\b/g, 'DR'],
    [/\bCRESCENT\b/g, 'CRES'],
    [/\bCLOSE\b/g, 'CL'],
    [/\bPLACE\b/g, 'PL'],
    [/\bLANE\b/g, 'LN'],
    [/\bTERRACE\b/g, 'TER'],
    [/\bBUKIT\b/g, 'BT'],
    [/\bLORONG\b/g, 'LOR'],
    [/\bNORTH\b/g, 'NTH'],
    [/\bSOUTH\b/g, 'STH'],
    [/\bUPPER\b/g, 'UPP'],
    [/\bCENTRAL\b/g, 'CTRL'],
    [/\bJALAN\b/g, 'JLN'],
  ];

  for (const [regex, rep] of replacements) {
    s = s.replace(regex, rep);
  }

  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Calculates estimated walking distance and time between HDB blocks in an estate cluster.
 * Standard Singapore urban walking speed: ~80 meters per minute (~4.8 km/h).
 * Standard 5-minute walk threshold: <= 400 meters.
 */
export function calculateBlockProximity(
  targetBlock: string,
  originBlock?: string
): {
  distanceMeters: number;
  walkingMinutes: number;
  isWithin5MinWalk: boolean;
  isOrigin: boolean;
} {
  const cleanTarget = (targetBlock || '').trim().toUpperCase();
  const cleanOrigin = (originBlock || '').trim().toUpperCase();

  if (!cleanOrigin || cleanTarget === cleanOrigin) {
    return {
      distanceMeters: 0,
      walkingMinutes: 0,
      isWithin5MinWalk: true,
      isOrigin: cleanTarget === cleanOrigin && Boolean(cleanOrigin),
    };
  }

  // Parse numeric and suffix parts
  // e.g., '273A' -> num: 273, suffix: 'A'
  //       '1G'   -> num: 1,   suffix: 'G'
  //       '88'   -> num: 88,  suffix: ''
  const parseBlock = (b: string) => {
    const match = b.match(/^([0-9]{1,4})\s*([A-Z])?$/i);
    if (!match) return { num: 0, suffix: '' };
    return {
      num: parseInt(match[1], 10),
      suffix: match[2] || '',
    };
  };

  const t = parseBlock(cleanTarget);
  const o = parseBlock(cleanOrigin);

  if (t.num === 0 || o.num === 0) {
    // If block format cannot be parsed numerically, treat as immediate precinct cluster
    return {
      distanceMeters: 120,
      walkingMinutes: 1,
      isWithin5MinWalk: true,
      isOrigin: false,
    };
  }

  let distanceMeters = 0;

  if (t.num === o.num) {
    // Same block number, different tower/letter (e.g. 273A vs 273B, or 1A vs 1G)
    const codeDiff = Math.abs((t.suffix.charCodeAt(0) || 65) - (o.suffix.charCodeAt(0) || 65));
    distanceMeters = Math.max(50, Math.min(200, 50 + codeDiff * 25));
  } else {
    const numDiff = Math.abs(t.num - o.num);
    const sameDecade = Math.floor(t.num / 10) === Math.floor(o.num / 10);
    const sameHundred = Math.floor(t.num / 100) === Math.floor(o.num / 100);

    if (numDiff <= 3) {
      // Immediate adjacent building in the same cluster (e.g. 273 vs 275)
      distanceMeters = 70 + numDiff * 30; // 100m - 160m
    } else if (sameDecade) {
      // Same neighborhood precinct (e.g. 270 - 279)
      distanceMeters = 120 + numDiff * 20; // 140m - 280m
    } else if (sameHundred && numDiff <= 20) {
      // Adjacent precinct in the same neighborhood (e.g. 264 to 273 is diff 9)
      distanceMeters = 200 + (numDiff - 4) * 15; // 240m - 380m
    } else if (numDiff <= 25) {
      distanceMeters = 280 + (numDiff - 10) * 12; // 300m - 460m
    } else {
      // Far precinct along a long avenue/street
      distanceMeters = 450 + numDiff * 10;
    }
  }

  // 5 mins walk is 400 meters
  const isWithin5MinWalk = distanceMeters <= 400;
  const walkingMinutes = Math.max(1, Math.round(distanceMeters / 80));

  return {
    distanceMeters,
    walkingMinutes,
    isWithin5MinWalk,
    isOrigin: false,
  };
}

/**
 * Extracts block and normalized street name from a selected property or raw address string.
 */
export function extractHdbStreetAndBlock(prop: SelectedProperty): {
  block?: string;
  streetName?: string;
  postalCode?: string;
} {
  if (prop.block && prop.streetName) {
    return {
      block: prop.block.toUpperCase(),
      streetName: normalizeStreetName(prop.streetName),
      postalCode: prop.postalCode,
    };
  }

  const fullStr = `${prop.name || ''} ${prop.address || ''}`;

  // 1. Extract postal code if not explicitly given
  const postalCode = prop.postalCode || fullStr.match(/\b(?:Singapore\s*)?(\d{6})\b/i)?.[1];

  // 2. Clean address string: strip postal code, Singapore, #unit
  let cleaned = (prop.address || '')
    .replace(/,\s*Singapore\s*\d*/gi, '')
    .replace(/#\d+-\d+/g, '')
    .trim();

  // 3. Extract block (e.g. 1G, 273A, 623A, 88, 308A, Blk 123)
  let block = prop.block;
  if (!block) {
    const blkMatch = cleaned.match(/^(?:blk|block)?\s*([0-9]{1,4}[a-z]?)\b/i);
    if (blkMatch) {
      block = blkMatch[1].toUpperCase();
      cleaned = cleaned.replace(/^(?:blk|block)?\s*[0-9]{1,4}[a-z]?\s*,?\s*/i, '');
    }
  }

  // 4. Extract road name from remaining string
  let road = prop.streetName;
  if (!road) {
    road = cleaned.split(',')[0].trim();
  }

  const streetName = normalizeStreetName(road);

  return {
    block: block ? block.toUpperCase() : undefined,
    streetName: streetName || undefined,
    postalCode,
  };
}

/**
 * Client-side fetcher for the HDB Resale API.
 */
export async function fetchHdbResale(params: {
  street?: string;
  block?: string;
  address?: string;
  name?: string;
  postalCode?: string;
}): Promise<HdbResaleAnalysis> {
  const query = new URLSearchParams();
  if (params.street) query.set('street', params.street);
  if (params.block) query.set('block', params.block);
  if (params.address) query.set('address', params.address);
  if (params.name) query.set('name', params.name);
  if (params.postalCode) query.set('postal', params.postalCode);

  const res = await fetch(`/api/hdb-resale?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch HDB resale data (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Format currency in Singapore Dollars (e.g. $1,348,000)
 */
export function formatSgd(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format short price (e.g. $1.35M or $680K)
 */
export function formatShortPrice(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${Math.round(amount / 1_000)}K`;
  }
  return `$${amount}`;
}

/**
 * Format date string (e.g. "2026-08" -> "Aug 2026")
 */
export function formatTransactionMonth(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const idx = parseInt(month, 10) - 1;
  return `${monthNames[idx] || month} ${year}`;
}
