import { SelectedProperty } from '@/data/types';
import { FEATURED_PROPERTIES } from '@/data/featuredProperties';

export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
  buildingName?: string;
  postalCode?: string;
  block?: string;
  roadName?: string;
  propertyType?: 'HDB' | 'Condo' | 'Landed' | 'Commercial' | 'Custom Location';
}

const CONDO_PATTERNS = [
  'CONDO',
  'CONDOMINIUM',
  'RESIDENCES',
  'RESIDENCE',
  'SUITES',
  'VILLAS',
  'MANSION',
  'MANSIONS',
  'APARTMENT',
  'APARTMENTS',
  'FOREST WOODS',
  'WOODS',
  'LEEDON',
  'INTERLACE',
  'PARC ESTA',
  'NORMANTON PARK',
  'TRE VER',
  'JADESCAPE',
  'PARC BOTANNIA',
  'STIRLING RESIDENCES',
  'AFFINITY AT SERANGOON',
  'THE FLORENCE',
  'AVENUE SOUTH',
  'RIVIERE',
  'MARINA ONE',
];

const LANDED_PATTERNS = [
  'BUNGALOW',
  'SEMI-DETACHED',
  'DETACHED',
  'TERRACE HOUSE',
  'CORNER TERRACE',
  'LANDED',
  'VILLA',
];

const HDB_TOWNS = [
  'ANG MO KIO', 'BEDOK', 'BISHAN', 'BUKIT BATOK', 'BUKIT MERAH',
  'BUKIT PANJANG', 'CHOA CHU KANG', 'CLEMENTI', 'GEYLANG', 'HOUGANG',
  'JURONG EAST', 'JURONG WEST', 'KALLANG', 'WHAMPOA', 'MARINE PARADE',
  'PASIR RIS', 'PUNGGOL', 'QUEENSTOWN', 'SEMBAWANG', 'SENGKANG',
  'SERANGOON', 'TAMPINES', 'TOA PAYOH', 'WOODLANDS', 'YISHUN'
];

const ROAD_SUFFIXES = [
  'ROAD', 'RD', 'STREET', 'ST', 'AVENUE', 'AVE', 'DRIVE', 'DR',
  'LANE', 'LN', 'WAY', 'CRESCENT', 'CRES', 'CLOSE', 'CL', 'WALK',
  'HILL', 'VIEW', 'SECTOR', 'PLACE', 'PL', 'LOOP', 'LINK', 'RISE',
  'CENTRAL', 'NORTH', 'SOUTH', 'EAST', 'WEST', 'RING', 'PARADE',
];

/**
 * Heuristically infers Singapore property type from building name, address, or block.
 */
export function inferPropertyType(
  buildingName?: string,
  address?: string,
  block?: string
): 'HDB' | 'Condo' | 'Landed' | 'Custom Location' {
  const bUpper = (buildingName || '').toUpperCase().trim();
  const aUpper = (address || '').toUpperCase().trim();
  const combined = `${bUpper} ${aUpper}`.trim();
  if (!combined) return block ? 'HDB' : 'Custom Location';

  // 1. Check explicit HDB names / indicators first
  if (
    combined.includes('PINNACLE @ DUXTON') ||
    combined.includes('NATURA LOFT') ||
    combined.includes('SKYVILLE') ||
    combined.includes('GREENVERGE') ||
    combined.includes('WATERWAY TERRACES') ||
    combined.includes('THE PEAK @ TOA PAYOH') ||
    combined.includes('HDB') ||
    combined.includes('HOUSING & DEVELOPMENT') ||
    combined.includes('HOUSING AND DEVELOPMENT') ||
    combined.includes('BTO') ||
    combined.includes('DBSS')
  ) {
    return 'HDB';
  }

  // 2. Check Landed keywords
  if (LANDED_PATTERNS.some((p) => combined.includes(p))) {
    return 'Landed';
  }

  // 3. Check Condo keywords
  if (CONDO_PATTERNS.some((p) => combined.includes(p))) {
    return 'Condo';
  }

  // 4. If there is an explicit block number and no condo keyword matched, it is HDB
  if (block && block !== 'NIL') {
    return 'HDB';
  }

  // 5. If combined string matches an HDB town name, default to HDB
  if (HDB_TOWNS.some((town) => combined.includes(town))) {
    return 'HDB';
  }

  // Check if building name is simply a road name
  const isLikelyRoad = ROAD_SUFFIXES.some(
    (s) => bUpper.endsWith(` ${s}`) || bUpper === s
  );

  if (
    bUpper &&
    bUpper !== 'NIL' &&
    !isLikelyRoad &&
    !bUpper.startsWith('BLK ') &&
    !bUpper.startsWith('BLOCK ')
  ) {
    return 'Condo';
  }

  if (block) {
    return 'HDB';
  }

  return 'Custom Location';
}

/**
 * Accurately determines if a property is a private residential property (Condo/Landed)
 * or non-private (HDB flat). Non-private / HDB properties strictly return false.
 */
export function isPrivateProperty(prop?: SelectedProperty | null): boolean {
  if (!prop) return false;
  // If propertyType is explicitly HDB, it's NEVER private
  if (prop.propertyType === 'HDB') return false;
  // If propertyType is explicitly Condo or Landed, it IS private
  if (prop.propertyType === 'Condo' || prop.propertyType === 'Landed') return true;

  const combined = `${prop.name || ''} ${prop.address || ''}`.toUpperCase();

  // If it has explicit condo keyword, it is private
  if (CONDO_PATTERNS.some((p) => combined.includes(p))) {
    return true;
  }
  if (LANDED_PATTERNS.some((p) => combined.includes(p))) {
    return true;
  }

  // If it has a block number, it is HDB
  if (prop.block && prop.block !== 'NIL') {
    return false;
  }

  // If name or address references an HDB town, it is HDB
  if (HDB_TOWNS.some((town) => combined.includes(town))) {
    return false;
  }

  // Otherwise infer based on name, address, block
  const inferred = inferPropertyType(prop.name, prop.address, prop.block);
  return inferred === 'Condo' || inferred === 'Landed';
}

/**
 * Searches Singapore locations via OneMap API or Nominatim OpenStreetMap.
 * Also checks local featured properties for instant zero-latency match.
 */
export async function searchSingaporeLocation(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  // Check local featured properties first
  const localMatches: GeocodeResult[] = FEATURED_PROPERTIES.filter(
    (p) =>
      p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
      p.address.toLowerCase().includes(trimmed.toLowerCase()) ||
      (p.postalCode && p.postalCode.includes(trimmed))
  ).map((p) => ({
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    buildingName: p.name,
    postalCode: p.postalCode,
    block: p.block,
    roadName: p.streetName,
    propertyType: p.propertyType,
  }));

  try {
    // 1. Try Singapore OneMap Search API
    const onemapUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
      trimmed
    )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(onemapUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.results && data.results.length > 0) {
        const onemapResults: GeocodeResult[] = data.results.slice(0, 6).map((r: any) => {
          const bName = r.BUILDING !== 'NIL' ? r.BUILDING : undefined;
          const road = r.ROAD_NAME !== 'NIL' ? r.ROAD_NAME : undefined;
          const blk = r.BLK_NO !== 'NIL' ? r.BLK_NO : undefined;
          const propType = inferPropertyType(bName || r.SEARCHVAL, r.ADDRESS, blk);

          return {
            address: r.ADDRESS || `${r.ROAD_NAME} Singapore ${r.POSTAL || ''}`,
            lat: parseFloat(r.LATITUDE),
            lng: parseFloat(r.LONGITUDE),
            buildingName: bName || (blk ? `Blk ${blk} ${road || ''}`.trim() : road),
            postalCode: r.POSTAL !== 'NIL' ? r.POSTAL : undefined,
            block: blk,
            roadName: road,
            propertyType: propType,
          };
        });

        // Deduplicate with local matches
        const combined: GeocodeResult[] = [...localMatches];
        for (const item of onemapResults) {
          if (!combined.some((c) => Math.abs(c.lat - item.lat) < 0.0001 && Math.abs(c.lng - item.lng) < 0.0001)) {
            combined.push(item);
          }
        }
        return combined.slice(0, 8);
      }
    }
  } catch (err) {
    console.warn('OneMap search error, falling back to OSM Nominatim', err);
  }

  // 2. Fallback to OpenStreetMap Nominatim restricted to Singapore
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed
    )}+Singapore&countrycodes=sg&format=json&limit=5`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(osmUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SGNearby/1.0' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const osmResults: GeocodeResult[] = data.map((r: any) => ({
        address: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        buildingName: r.name || r.display_name.split(',')[0],
        propertyType: inferPropertyType(r.name, r.display_name),
      }));

      const combined: GeocodeResult[] = [...localMatches];
      for (const item of osmResults) {
        if (!combined.some((c) => Math.abs(c.lat - item.lat) < 0.0001 && Math.abs(c.lng - item.lng) < 0.0001)) {
          combined.push(item);
        }
      }
      return combined.slice(0, 8);
    }
  } catch (err) {
    console.warn('OSM Nominatim search error', err);
  }

  return localMatches;
}
