import { svy21ToWgs84, wgs84ToSvy21, svy21DistanceMeters } from './svy21';

export interface UraTransactionRaw {
  contractDate: string; // '0723' for Jul 2023
  area: string; // '120' in sqm
  price: string; // '2150000'
  nettPrice?: string;
  propertyType: string; // 'Condominium', 'Apartment', 'Executive Condominium', etc.
  typeOfArea: string; // 'Strata', 'Land'
  tenure: string; // 'Freehold', '99 yrs lease commencing from 2010'
  floorRange: string; // '06-10', '11-15'
  typeOfSale: string; // '1' (New Sale), '2' (Sub Sale), '3' (Resale)
  district: string; // '04'
  noOfUnits: string; // '1'
}

export interface UraProjectRaw {
  project: string;
  street: string;
  marketSegment: string; // 'CCR', 'RCR', 'OCR'
  x: string; // SVY21 Easting
  y: string; // SVY21 Northing
  transaction?: UraTransactionRaw[];
}

export interface UraTransaction {
  id: string;
  contractDate: string; // '0723'
  contractDateFormatted: string; // 'Jul 2023'
  month: string; // '2023-07'
  quarter: string; // '2023-Q3'
  areaSqm: number;
  areaSqft: number;
  price: number;
  nettPrice?: number;
  pricePerSqft: number;
  pricePerSqm: number;
  propertyType: string;
  typeOfSale: 'New Sale' | 'Sub Sale' | 'Resale';
  typeOfSaleCode: string;
  floorRange: string;
  tenure: string;
  district: string;
  noOfUnits: number;
}

export interface UraTrendPoint {
  period: string; // '2023-Q3'
  label: string; // 'Q3 2023'
  avgPrice: number;
  avgPsf: number;
  count: number;
}

export interface UraUnitTypeSummary {
  category: string; // 'Studio / 1-Bed (<500 sqft)', '2-Bed (500-800 sqft)', etc.
  count: number;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPsf: number;
  avgFloorAreaSqft: number;
}

export interface NearbyPrivateProject {
  projectName: string;
  street: string;
  district: string;
  marketSegment: string;
  distanceMeters: number;
  walkingMinutes: number;
  transactionCount: number;
  latestPrice?: number;
  latestPsf?: number;
  isCurrent?: boolean;
}

export interface UraResaleAnalysis {
  projectName: string;
  streetName: string;
  marketSegment: string; // 'CCR' | 'RCR' | 'OCR'
  tenure: string;
  district: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  totalTransactions: number;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPsf: number;
  medianPsf: number;
  minPsf: number;
  maxPsf: number;
  timeframe: {
    startPeriod: string;
    endPeriod: string;
    yearsCovered: number;
  };
  unitTypeSummaries: UraUnitTypeSummary[];
  quarterlyTrends: UraTrendPoint[];
  transactions: UraTransaction[];
  nearbyProjects: NearbyPrivateProject[];
  hasTransactions: boolean;
  hasApiKey: boolean;
  message?: string;
}

/**
 * Maps Singapore 2-digit postal sector (first 2 digits of 6-digit postal code)
 * to official Singapore Postal District (01-28) and URA API Batch (1-4).
 */
export function mapPostalToDistrict(postalCode?: string): {
  district: string;
  batch: number;
  districtName: string;
} {
  if (!postalCode) {
    return { district: '01', batch: 1, districtName: 'Central Singapore' };
  }

  const cleaned = postalCode.trim().replace(/\D/g, '').padStart(6, '0');
  const sector = parseInt(cleaned.slice(0, 2), 10);

  // Sector to District & Batch mapping
  if (sector >= 1 && sector <= 6) return { district: '01', batch: 1, districtName: 'Raffles Place / Marina Bay / Cecil' };
  if (sector >= 7 && sector <= 8) return { district: '02', batch: 1, districtName: 'Anson / Tanjong Pagar' };
  if (sector >= 14 && sector <= 16) return { district: '03', batch: 1, districtName: 'Queenstown / Tiong Bahru' };
  if (sector >= 9 && sector <= 10) return { district: '04', batch: 1, districtName: 'Telok Blangah / Harbourfront' };
  if (sector >= 11 && sector <= 13) return { district: '05', batch: 1, districtName: 'Pasir Panjang / Clementi' };
  if (sector === 17) return { district: '06', batch: 1, districtName: 'City Hall / Beach Road' };
  if (sector >= 18 && sector <= 19) return { district: '07', batch: 1, districtName: 'Middle Road / Bugis' };

  if (sector >= 20 && sector <= 21) return { district: '08', batch: 2, districtName: 'Little India / Farrer Park' };
  if (sector >= 22 && sector <= 23) return { district: '09', batch: 2, districtName: 'Orchard / River Valley' };
  if (sector >= 24 && sector <= 27) return { district: '10', batch: 2, districtName: 'Bukit Timah / Holland / Tanglin' };
  if (sector >= 28 && sector <= 30) return { district: '11', batch: 2, districtName: 'Novena / Thomson / Watten' };
  if (sector >= 31 && sector <= 33) return { district: '12', batch: 2, districtName: 'Balestier / Toa Payoh' };
  if (sector >= 34 && sector <= 37) return { district: '13', batch: 2, districtName: 'Macpherson / Braddell' };
  if (sector >= 38 && sector <= 41) return { district: '14', batch: 2, districtName: 'Geylang / Eunos' };

  if (sector >= 42 && sector <= 45) return { district: '15', batch: 3, districtName: 'Katong / Joo Chiat / Marine Parade' };
  if (sector >= 46 && sector <= 48) return { district: '16', batch: 3, districtName: 'Bedok / Upper East Coast' };
  if (sector >= 49 && sector <= 50 || sector === 81) return { district: '17', batch: 3, districtName: 'Loyang / Changi' };
  if (sector >= 51 && sector <= 52) return { district: '18', batch: 3, districtName: 'Tampines / Pasir Ris' };
  if (sector >= 53 && sector <= 55 || sector === 82) return { district: '19', batch: 3, districtName: 'Serangoon / Hougang / Punggol' };
  if (sector >= 56 && sector <= 57) return { district: '20', batch: 3, districtName: 'Bishan / Ang Mo Kio' };
  if (sector >= 58 && sector <= 59) return { district: '21', batch: 3, districtName: 'Upper Bukit Timah / Clementi Park' };

  if (sector >= 60 && sector <= 64) return { district: '22', batch: 4, districtName: 'Jurong / Boon Lay' };
  if (sector >= 65 && sector <= 68) return { district: '23', batch: 4, districtName: 'Hillview / Bukit Panjang / CCK' };
  if (sector >= 69 && sector <= 71) return { district: '24', batch: 4, districtName: 'Lim Chu Kang / Tengah' };
  if (sector >= 72 && sector <= 73) return { district: '25', batch: 4, districtName: 'Kranji / Woodlands' };
  if (sector >= 77 && sector <= 78) return { district: '26', batch: 4, districtName: 'Upper Thomson / Springleaf' };
  if (sector >= 75 && sector <= 76) return { district: '27', batch: 4, districtName: 'Yishun / Sembawang' };
  if (sector >= 79 && sector <= 80) return { district: '28', batch: 4, districtName: 'Seletar / Yio Chu Kang' };

  return { district: '01', batch: 1, districtName: 'Singapore' };
}

const DISTRICT_CENTROIDS: Array<{
  district: string;
  batch: number;
  districtName: string;
  lat: number;
  lng: number;
}> = [
  { district: '01', batch: 1, districtName: 'Raffles Place / Marina Bay / Cecil', lat: 1.282, lng: 103.852 },
  { district: '02', batch: 1, districtName: 'Anson / Tanjong Pagar', lat: 1.275, lng: 103.844 },
  { district: '03', batch: 1, districtName: 'Queenstown / Tiong Bahru', lat: 1.291, lng: 103.816 },
  { district: '04', batch: 1, districtName: 'Telok Blangah / Harbourfront', lat: 1.271, lng: 103.818 },
  { district: '05', batch: 1, districtName: 'Pasir Panjang / Clementi', lat: 1.300, lng: 103.771 },
  { district: '06', batch: 1, districtName: 'City Hall / Beach Road', lat: 1.293, lng: 103.853 },
  { district: '07', batch: 1, districtName: 'Middle Road / Bugis', lat: 1.300, lng: 103.856 },

  { district: '08', batch: 2, districtName: 'Little India / Farrer Park', lat: 1.311, lng: 103.853 },
  { district: '09', batch: 2, districtName: 'Orchard / River Valley', lat: 1.303, lng: 103.835 },
  { district: '10', batch: 2, districtName: 'Bukit Timah / Holland / Tanglin', lat: 1.314, lng: 103.805 },
  { district: '11', batch: 2, districtName: 'Novena / Thomson / Watten', lat: 1.325, lng: 103.838 },
  { district: '12', batch: 2, districtName: 'Balestier / Toa Payoh', lat: 1.332, lng: 103.852 },
  { district: '13', batch: 2, districtName: 'Macpherson / Braddell', lat: 1.338, lng: 103.876 },
  { district: '14', batch: 2, districtName: 'Geylang / Eunos', lat: 1.319, lng: 103.898 },

  { district: '15', batch: 3, districtName: 'Katong / Joo Chiat / Marine Parade', lat: 1.304, lng: 103.905 },
  { district: '16', batch: 3, districtName: 'Bedok / Upper East Coast', lat: 1.321, lng: 103.935 },
  { district: '17', batch: 3, districtName: 'Loyang / Changi', lat: 1.355, lng: 103.978 },
  { district: '18', batch: 3, districtName: 'Tampines / Pasir Ris', lat: 1.360, lng: 103.949 },
  { district: '19', batch: 3, districtName: 'Serangoon / Hougang / Punggol', lat: 1.378, lng: 103.892 },
  { district: '20', batch: 3, districtName: 'Bishan / Ang Mo Kio', lat: 1.362, lng: 103.848 },
  { district: '21', batch: 3, districtName: 'Upper Bukit Timah / Clementi Park', lat: 1.341, lng: 103.776 },

  { district: '22', batch: 4, districtName: 'Jurong / Boon Lay', lat: 1.338, lng: 103.705 },
  { district: '23', batch: 4, districtName: 'Hillview / Bukit Panjang / CCK', lat: 1.376, lng: 103.755 },
  { district: '24', batch: 4, districtName: 'Lim Chu Kang / Tengah', lat: 1.375, lng: 103.715 },
  { district: '25', batch: 4, districtName: 'Kranji / Woodlands', lat: 1.436, lng: 103.786 },
  { district: '26', batch: 4, districtName: 'Upper Thomson / Springleaf', lat: 1.398, lng: 103.818 },
  { district: '27', batch: 4, districtName: 'Yishun / Sembawang', lat: 1.435, lng: 103.832 },
  { district: '28', batch: 4, districtName: 'Seletar / Yio Chu Kang', lat: 1.405, lng: 103.868 },
];

/**
 * Maps Singapore geographical coordinates (lat, lng) to nearest Postal District and URA Batch (1-4).
 * Used when a user drops a custom pin or searches a location without a 6-digit postal code.
 */
export function mapCoordinatesToDistrict(
  lat: number,
  lng: number
): {
  district: string;
  batch: number;
  districtName: string;
} {
  let closest = DISTRICT_CENTROIDS[0];
  let minDistanceSq = Infinity;

  for (const c of DISTRICT_CENTROIDS) {
    const dLat = c.lat - lat;
    const dLng = c.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closest = c;
    }
  }

  return {
    district: closest.district,
    batch: closest.batch,
    districtName: closest.districtName,
  };
}

/**
 * Formats URA contractDate (MMYY e.g. '0723') into readable strings.
 */
export function formatUraContractDate(mmyy: string): {
  formatted: string; // 'Jul 2023'
  month: string; // '2023-07'
  quarter: string; // '2023-Q3'
} {
  if (!mmyy || mmyy.length < 4) {
    return { formatted: mmyy, month: '2023-01', quarter: '2023-Q1' };
  }

  const mm = parseInt(mmyy.slice(0, 2), 10);
  const yy = parseInt(mmyy.slice(2, 4), 10);
  const fullYear = yy >= 50 ? 1900 + yy : 2000 + yy;

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthName = monthNames[mm - 1] || 'Jan';
  const qNum = Math.ceil(mm / 3);

  const monthStr = `${fullYear}-${String(mm).padStart(2, '0')}`;
  const quarterStr = `${fullYear}-Q${qNum}`;

  return {
    formatted: `${monthName} ${fullYear}`,
    month: monthStr,
    quarter: quarterStr,
  };
}

/**
 * Normalizes project names for flexible matching against URA dataset.
 * e.g. "Marina One Residences" -> "MARINA ONE RESIDENCES"
 *      "d'Leedon" -> "D'LEEDON"
 *      "The Interlace" -> "THE INTERLACE"
 */
export function normalizeProjectName(name: string): string {
  if (!name) return '';
  return name
    .toUpperCase()
    .replace(/[.,'’"-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Classifies unit area (sqft) into intuitive bedroom / layout buckets.
 */
export function classifyUnitCategory(sqft: number): string {
  if (sqft <= 520) return 'Studio / 1-Bed (<520 sqft)';
  if (sqft <= 820) return '2-Bedroom (520–820 sqft)';
  if (sqft <= 1250) return '3-Bedroom (820–1,250 sqft)';
  if (sqft <= 1700) return '4-Bedroom (1,250–1,700 sqft)';
  return '5-Bed+ / Penthouse (>1,700 sqft)';
}

/**
 * Client-side fetcher for the URA private property transactions API.
 */
export async function fetchUraTransactions(params: {
  project?: string;
  street?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  accessKey?: string;
}): Promise<UraResaleAnalysis> {
  const query = new URLSearchParams();
  if (params.project) query.set('project', params.project);
  if (params.street) query.set('street', params.street);
  if (params.postalCode) query.set('postal', params.postalCode);
  if (params.lat !== undefined) query.set('lat', params.lat.toString());
  if (params.lng !== undefined) query.set('lng', params.lng.toString());

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (params.accessKey) {
    headers['x-ura-accesskey'] = params.accessKey;
  }

  const res = await fetch(`/api/ura-transactions?${query.toString()}`, {
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to fetch URA transactions (HTTP ${res.status})`);
  }

  return res.json();
}
