import { SelectedProperty } from '@/data/types';
import { extractHdbStreetAndBlock } from './hdbResale';
import { isPrivateProperty } from './onemap';

export interface PortalLinkItem {
  id: 'propertyguru' | '99co';
  name: string;
  tagline: string;
  badgeBg: string;
  badgeText: string;
  url: string;
  googleIndexUrl?: string;
  isDirectFilterSupported: boolean;
  logoColor: string;
}

export interface PortalLinksResult {
  searchTerm: string;
  isPostalCode: boolean;
  links: PortalLinkItem[];
}

const SG_HDB_TOWN_SLUGS: Record<string, string> = {
  'ANG MO KIO': 'ang-mo-kio',
  'BEDOK': 'bedok',
  'BISHAN': 'bishan',
  'BUKIT BATOK': 'bukit-batok',
  'BUKIT MERAH': 'bukit-merah',
  'BUKIT PANJANG': 'bukit-panjang',
  'BUKIT TIMAH': 'bukit-timah',
  'CENTRAL AREA': 'central-area',
  'TANJONG PAGAR': 'central-area',
  'CHOA CHU KANG': 'choa-chu-kang',
  'CLEMENTI': 'clementi',
  'GEYLANG': 'geylang',
  'HOUGANG': 'hougang',
  'JURONG EAST': 'jurong-east',
  'JURONG WEST': 'jurong-west',
  'KALLANG/WHAMPOA': 'kallang-whampoa',
  'MARINE PARADE': 'marine-parade',
  'PASIR RIS': 'pasir-ris',
  'PUNGGOL': 'punggol',
  'QUEENSTOWN': 'queenstown',
  'SEMBAWANG': 'sembawang',
  'SENGKANG': 'sengkang',
  'SERANGOON': 'serangoon',
  'TAMPINES': 'tampines',
  'TOA PAYOH': 'toa-payoh',
  'WOODLANDS': 'woodlands',
  'YISHUN': 'yishun',
};

function getTownSlug(town?: string): string | undefined {
  if (!town) return undefined;
  const upper = town.toUpperCase();
  for (const [key, slug] of Object.entries(SG_HDB_TOWN_SLUGS)) {
    if (upper.includes(key)) return slug;
  }
  return undefined;
}

/**
 * Extracts 6-digit Singapore postal code from property or its address
 */
export function resolvePropertyPostalCode(property: SelectedProperty): string | undefined {
  if (property.postalCode && /^\d{6}$/.test(property.postalCode.trim())) {
    return property.postalCode.trim();
  }

  const { postalCode: extractedPostal } = extractHdbStreetAndBlock(property);
  if (extractedPostal && /^\d{6}$/.test(extractedPostal.trim())) {
    return extractedPostal.trim();
  }

  const match = (property.address || '').match(/\b(?:Singapore\s*)?(\d{6})\b/i);
  return match?.[1];
}

/**
 * Normalizes project and condo names into 99.co-compatible URL slug format.
 * Examples:
 *   "FOREST WOODS" -> "forest-woods"
 *   "D'LEEDON" -> "dleedon"
 *   "THE SAIL @ MARINA BAY" -> "the-sail-at-marina-bay"
 *   "TREASURE AT TAMPINES" -> "treasure-at-tampines"
 */
export function slugifyProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/@/g, 'at')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Builds smart, targeted search queries for Singapore real estate portals:
 * - PropertyGuru: https://www.propertyguru.com.sg/property-for-sale?freetext=<query>&market=residential
 * - 99.co:
 *   - Private Condos: https://www.99.co/singapore/sale/condos-apartments/<project-slug>
 *   - Landed Houses: https://www.99.co/singapore/sale/houses/<project-slug>
 *   - HDB: https://www.99.co/singapore/sale/hdb/<postal-or-slug>
 */
export function generatePortalLinks(
  property: SelectedProperty,
  flatType?: string,
  overrideProjectName?: string
): PortalLinkItem[] {
  const result = getPortalLinksWithMetadata(property, flatType, overrideProjectName);
  return result.links;
}

export function getPortalLinksWithMetadata(
  property: SelectedProperty,
  flatType?: string,
  overrideProjectName?: string
): PortalLinksResult {
  const isPrivate =
    isPrivateProperty(property) ||
    property.propertyType === 'Condo' ||
    property.propertyType === 'Landed';
  const isLanded = property.propertyType === 'Landed';

  const postalCode = resolvePropertyPostalCode(property);
  const { block, streetName } = extractHdbStreetAndBlock(property);
  const townSlug = getTownSlug(property.town);

  const rawProjectName = (overrideProjectName || (isPrivate ? property.name : '') || '').trim();
  const projectSlug = rawProjectName ? slugifyProjectName(rawProjectName) : '';

  let searchTerm = '';
  let isPostalCode = false;

  if (postalCode) {
    searchTerm = postalCode;
    isPostalCode = true;
  } else if (rawProjectName) {
    searchTerm = rawProjectName;
    isPostalCode = false;
  } else {
    const parts: string[] = [];
    if (block) parts.push(`Block ${block}`);
    if (streetName) parts.push(streetName);
    else if (property.name) parts.push(property.name);
    searchTerm = parts.join(' ').trim() || property.address;
    isPostalCode = false;
  }

  const encodedTerm = encodeURIComponent(searchTerm);

  // 99.co deeplink structure:
  // - Condos: https://www.99.co/singapore/sale/condos-apartments/<slug>
  // - Landed: https://www.99.co/singapore/sale/houses/<slug>
  // - HDB: https://www.99.co/singapore/sale/hdb/<postal code | townSlug | searchTerm>
  let ninetynineUrl = '';
  if (isPrivate) {
    const categoryPath = isLanded ? 'houses' : 'condos-apartments';
    if (projectSlug) {
      ninetynineUrl = `https://www.99.co/singapore/sale/${categoryPath}/${projectSlug}`;
    } else if (isPostalCode) {
      ninetynineUrl = `https://www.99.co/singapore/sale/${categoryPath}?query_text=${searchTerm}`;
    } else {
      ninetynineUrl = `https://www.99.co/singapore/sale/${categoryPath}`;
    }
  } else {
    ninetynineUrl = isPostalCode
      ? `https://www.99.co/singapore/sale/hdb/${searchTerm}`
      : townSlug
      ? `https://www.99.co/singapore/sale/hdb/${townSlug}`
      : `https://www.99.co/singapore/sale/hdb/${encodedTerm}`;
  }

  // PropertyGuru deeplink structure: https://www.propertyguru.com.sg/property-for-sale?freetext=<postal code | project name>&market=residential
  const pgQuery = rawProjectName || (isPostalCode ? searchTerm : property.address || searchTerm);
  const propertyGuruUrl = `https://www.propertyguru.com.sg/property-for-sale?freetext=${encodeURIComponent(pgQuery)}&market=residential`;

  const tagline = rawProjectName
    ? `${rawProjectName} • Active Sale`
    : isPostalCode
    ? `S(${searchTerm}) • Postal Search`
    : 'Active Sale Listings';

  const links: PortalLinkItem[] = [
    {
      id: 'propertyguru',
      name: 'PropertyGuru',
      tagline,
      badgeBg: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700',
      badgeText: 'text-red-700',
      url: propertyGuruUrl,
      isDirectFilterSupported: true,
      logoColor: '#E03C31',
    },
    {
      id: '99co',
      name: '99.co',
      tagline,
      badgeBg: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
      badgeText: 'text-blue-700',
      url: ninetynineUrl,
      isDirectFilterSupported: true,
      logoColor: '#1E60F2',
    },
  ];

  return {
    searchTerm,
    isPostalCode,
    links,
  };
}

export interface CovAnalysis {
  medianTransactedPrice: number;
  askingPriceBenchmark: number;
  potentialCovRange: {
    low: number;
    high: number;
  };
  explanation: string;
}

/**
 * Calculates an educational Cash-Over-Valuation (COV) guidance based on historical median price.
 * Clarifies that HDB does not publish valuation data and many resale transactions close at $0 COV.
 */
export function estimateCovGuidance(medianPrice: number): CovAnalysis {
  const lowCov = Math.round((medianPrice * 0.02) / 1000) * 1000;
  const highCov = Math.round((medianPrice * 0.06) / 1000) * 1000;
  const askingBenchmark = medianPrice + Math.round((lowCov + highCov) / 2);

  return {
    medianTransactedPrice: medianPrice,
    askingPriceBenchmark: askingBenchmark,
    potentialCovRange: {
      low: Math.max(0, lowCov),
      high: Math.max(20000, highCov),
    },
    explanation:
      'HDB loans and bank mortgages are strictly capped at official HDB valuation. Note: Official valuation is only determined by HDB after Option-to-Purchase (OTP) is granted. While competitive listings may ask for a premium, many transactions across Singapore close at $0 COV (at or below valuation). Any actual COV must be paid in cash (cannot use CPF OA or housing loan).',
  };
}
