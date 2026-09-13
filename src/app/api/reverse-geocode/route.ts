import { NextRequest, NextResponse } from 'next/server';
import { mapCoordinatesToDistrict } from '@/lib/uraProperty';

export const dynamic = 'force-dynamic';

export interface ReverseGeocodeResponse {
  displayName: string;
  address: string;
  road?: string;
  postalCode?: string;
  town?: string;
  district?: string;
  districtName?: string;
  lat: number;
  lng: number;
}

// In-memory rate limiting: max 30 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (rateLimitMap.size > 1000) {
    rateLimitMap.forEach((val, key) => {
      if (now > val.resetTime) rateLimitMap.delete(key);
    });
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

// In-memory caching for reverse geocode coordinates (1 hour TTL)
interface GeoCacheEntry {
  timestamp: number;
  data: ReverseGeocodeResponse;
}
const geoCache = new Map<string, GeoCacheEntry>();
const GEO_CACHE_TTL_MS = 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many reverse geocode requests. Please slow down.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: 'Missing lat or lng parameter' }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid coordinate numbers' }, { status: 400 });
  }

  // Check cache by rounded coordinates (~110m grid)
  const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
  const cached = geoCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < GEO_CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  // Get district from coordinates
  const districtInfo = mapCoordinatesToDistrict(lat, lng);
  const fallbackName = `Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

  let displayName = fallbackName;
  let address = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)} (${districtInfo.districtName})`;
  let road: string | undefined;
  let postalCode: string | undefined;
  let town = districtInfo.districtName;

  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(osmUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SGNearby-PropertyMap/1.0 (https://github.com/sgpropertymap)',
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        road = data.address.road || data.address.residential || data.address.suburb || '';
        postalCode = data.address.postcode;
        town = data.address.suburb || data.address.city || districtInfo.districtName;
        address = data.display_name || address;

        if (road) {
          displayName = postalCode ? `${road} (S${postalCode})` : road;
        } else if (data.name) {
          displayName = data.name;
        }
      }
    }
  } catch (err) {
    // Graceful fallback to coordinate label and district
  }

  const result: ReverseGeocodeResponse = {
    displayName,
    address,
    road,
    postalCode,
    town,
    district: `D${districtInfo.district}`,
    districtName: districtInfo.districtName,
    lat,
    lng,
  };

  geoCache.set(cacheKey, { timestamp: Date.now(), data: result });

  return NextResponse.json(result);
}
