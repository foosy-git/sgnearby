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

export async function GET(request: NextRequest) {
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

  return NextResponse.json(result);
}
