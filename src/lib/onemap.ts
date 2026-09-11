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
        const onemapResults: GeocodeResult[] = data.results.slice(0, 6).map((r: any) => ({
          address: r.ADDRESS || `${r.ROAD_NAME} Singapore ${r.POSTAL || ''}`,
          lat: parseFloat(r.LATITUDE),
          lng: parseFloat(r.LONGITUDE),
          buildingName: r.BUILDING !== 'NIL' ? r.BUILDING : r.ROAD_NAME,
          postalCode: r.POSTAL !== 'NIL' ? r.POSTAL : undefined,
          block: r.BLK_NO !== 'NIL' ? r.BLK_NO : undefined,
          roadName: r.ROAD_NAME !== 'NIL' ? r.ROAD_NAME : undefined,
        }));

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
