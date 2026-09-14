import { NextRequest, NextResponse } from 'next/server';
import { Amenity, AmenityCategory } from '@/data/types';

function mapGoogleTypeToCategory(
  types?: string[],
  primaryType?: string,
  name: string = ''
): AmenityCategory {
  const allTypes = [...(types || []), primaryType || ''].map((t) => t.toLowerCase());
  const nameLower = name.toLowerCase();

  // Transit
  if (
    allTypes.some((t) =>
      ['subway_station', 'light_rail_station', 'train_station'].includes(t)
    ) ||
    nameLower.includes('mrt')
  ) {
    return 'mrt';
  }
  if (
    allTypes.some((t) =>
      ['bus_stop', 'bus_station', 'transit_station'].includes(t)
    )
  ) {
    return 'bus';
  }

  // Shopping / Mall
  if (
    allTypes.some((t) =>
      ['shopping_mall', 'department_store'].includes(t)
    ) ||
    nameLower.includes('mall') ||
    nameLower.includes('plaza')
  ) {
    return 'mall';
  }

  // Food Centre / Hawker / Coffeeshop (prioritize over market)
  if (
    nameLower.includes('food centre') ||
    nameLower.includes('hawker') ||
    nameLower.includes('coffeeshop') ||
    nameLower.includes('kopitiam') ||
    nameLower.includes('foodhouse') ||
    nameLower.includes('food house') ||
    nameLower.includes('eating house') ||
    nameLower.includes('market & food') ||
    nameLower.includes('market and food') ||
    nameLower.includes('pasar makan') ||
    allTypes.some((t) =>
      ['restaurant', 'cafe', 'food_court', 'coffee_shop', 'bakery', 'meal_takeaway', 'fast_food_restaurant'].includes(t)
    )
  ) {
    return 'food';
  }

  // Supermarket & Groceries
  if (
    nameLower.includes('supermarket') ||
    nameLower.includes('sheng siong') ||
    nameLower.includes('fairprice') ||
    nameLower.includes('cold storage') ||
    nameLower.includes('don don donki') ||
    nameLower.includes('giant hypermarket') ||
    nameLower.includes('prime supermarket') ||
    nameLower.includes('scarlett') ||
    allTypes.some((t) =>
      ['supermarket', 'grocery_store', 'convenience_store', 'market'].includes(t)
    )
  ) {
    return 'supermarket';
  }

  // Schools & Education
  if (
    allTypes.some((t) =>
      [
        'school',
        'primary_school',
        'secondary_school',
        'preschool',
        'university',
      ].includes(t)
    )
  ) {
    return 'school';
  }

  // Healthcare
  if (
    allTypes.some((t) =>
      [
        'hospital',
        'doctor',
        'pharmacy',
        'medical_clinic',
        'dentist',
      ].includes(t)
    )
  ) {
    return 'healthcare';
  }

  // Parks & Nature
  if (
    allTypes.some((t) =>
      ['park', 'garden', 'national_park', 'hiking_area'].includes(t)
    )
  ) {
    return 'park';
  }

  // Sports
  if (
    allTypes.some((t) =>
      [
        'gym',
        'fitness_center',
        'sports_complex',
        'swimming_pool',
      ].includes(t)
    )
  ) {
    return 'sports';
  }

  // Default to Food (hawker, coffeeshop, restaurant, cafe, bakery, etc.)
  return 'food';
}

// In-memory rate limiting: max 30 requests per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Periodic cleanup if map grows
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

// In-memory caching for places requests (30-minute TTL)
interface PlacesCacheEntry {
  timestamp: number;
  data: Amenity[];
}
const placesCache = new Map<string, PlacesCacheEntry>();
const PLACES_CACHE_TTL_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    // 1. Origin / Referer verification
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const host = req.headers.get('host') || '';

    const isAllowedHost = (urlStr: string | null) => {
      if (!urlStr) return false;
      try {
        const parsed = new URL(urlStr);
        return (
          parsed.hostname === 'sgnearby.fsyhub.com' ||
          parsed.hostname === 'localhost' ||
          parsed.hostname === '127.0.0.1' ||
          (host && parsed.host === host)
        );
      } catch {
        return false;
      }
    };

    if (
      (origin && !isAllowedHost(origin)) ||
      (referer && !isAllowedHost(referer)) ||
      (!origin && !referer && process.env.NODE_ENV === 'production')
    ) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Unauthorized origin.' },
        { status: 403 }
      );
    }

    // 2. IP Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many requests. Please wait a few minutes before scanning again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { lat, lng, radius = 800 } = body;

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'MISSING_COORDINATES', message: 'Missing property coordinates.' },
        { status: 400 }
      );
    }

    const safeRadius = Math.min(Math.max(radius, 100), 2000);

    // 3. Coordinate caching (~110m grid)
    const cacheKey = `${Number(lat).toFixed(3)}_${Number(lng).toFixed(3)}_${safeRadius}`;
    const cached = placesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < PLACES_CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        count: cached.data.length,
        places: cached.data,
      });
    }

    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'NO_API_KEY',
          message:
            'Google Places API key is not configured in .env.local (GOOGLE_PLACES_API_KEY). Please add your key to enable live Google scanning.',
        },
        { status: 401 }
      );
    }

    const collectedPlaces = new Map<string, Amenity>();

    // 1. Primary: Google Places API (New) Nearby Search
    const newPlacesUrl = 'https://places.googleapis.com/v1/places:searchNearby';
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.location',
      'places.types',
      'places.primaryType',
      'places.rating',
      'places.userRatingCount',
      'places.currentOpeningHours.openNow',
    ].join(',');

    try {
      const [gResponseGroc, gResponseDining] = await Promise.all([
        // Dedicated groceries & supermarket scan (ensures supermarkets are never crowded out)
        fetch(newPlacesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': fieldMask,
          },
          body: JSON.stringify({
            includedTypes: ['supermarket', 'grocery_store', 'market', 'convenience_store'],
            maxResultCount: 15,
            locationRestriction: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: safeRadius,
              },
            },
          }),
        }),
        // Dedicated dining & eateries scan
        fetch(newPlacesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': fieldMask,
          },
          body: JSON.stringify({
            includedTypes: ['restaurant', 'cafe', 'coffee_shop', 'bakery', 'food_court', 'meal_takeaway'],
            maxResultCount: 20,
            locationRestriction: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: safeRadius,
              },
            },
          }),
        }),
      ]);

      // Explicit quota limit check for Places API (New)
      if (gResponseGroc.status === 429 || gResponseDining.status === 429) {
        return NextResponse.json(
          {
            error: 'QUOTA_EXCEEDED',
            message:
              'Daily Google Cloud quota limit reached. Your Google Cloud hard quota cap has been triggered to prevent billing charges. Official Singapore open data (OneMap, LTA Bus, MRT, MOE Schools, NEA Hawkers, HDB/URA resale) remains fully active.',
          },
          { status: 429 }
        );
      }

      const rawPlaces: any[] = [];
      if (gResponseGroc.ok) {
        const grocData = await gResponseGroc.json();
        if (Array.isArray(grocData.places)) rawPlaces.push(...grocData.places);
      }
      if (gResponseDining.ok) {
        const diningData = await gResponseDining.json();
        if (Array.isArray(diningData.places)) rawPlaces.push(...diningData.places);
      }

      if (rawPlaces.length > 0) {
        for (const p of rawPlaces) {
          if (!p.id || !p.location?.latitude || !p.location?.longitude) continue;
          if (collectedPlaces.has(p.id)) continue;
          const name = p.displayName?.text || 'Unnamed Place';
          const category = mapGoogleTypeToCategory(p.types, p.primaryType, name);

          const isCoffeeshop =
            p.primaryType === 'coffee_shop' ||
            p.primaryType === 'food_court' ||
            /coffeeshop|kopitiam|food court|foodhouse|food house|eating house/i.test(name);

          const isHawker =
            /hawker|food centre|pasar makan/i.test(name) ||
            p.primaryType === 'hawker_centre';

          let foodType:
            | 'Hawker Centre'
            | 'Coffeeshop / Food Court'
            | 'Restaurant / Eatery'
            | 'Cafe & Bakery'
            | undefined = undefined;
          let hawkerType: string | undefined = undefined;

          if (category === 'food') {
            if (isHawker) {
              foodType = 'Hawker Centre';
              hawkerType = 'Hawker Centre';
            } else if (isCoffeeshop) {
              foodType = 'Coffeeshop / Food Court';
              hawkerType = 'Food Centre & Coffeeshop';
            } else {
              foodType = 'Restaurant / Eatery';
            }
          }

          let cuisineLabel = p.rating
            ? `⭐ ${p.rating.toFixed(1)} (${p.userRatingCount || 0} Google reviews)${
                p.currentOpeningHours?.openNow !== undefined
                  ? p.currentOpeningHours.openNow
                    ? ' • Open Now'
                    : ' • Closed'
                  : ''
              }`
            : 'Google Places Verified';

          const supermarketBrand =
            category === 'supermarket'
              ? /sheng siong/i.test(name)
                ? 'Sheng Siong Supermarket'
                : /fairprice/i.test(name)
                ? 'FairPrice Supermarket'
                : /don don donki/i.test(name)
                ? 'Don Don Donki'
                : /cold storage|cs fresh/i.test(name)
                ? 'Cold Storage CS Fresh'
                : /giant/i.test(name)
                ? 'Giant Supermarket'
                : /prime/i.test(name)
                ? 'Prime Supermarket'
                : /scarlett/i.test(name)
                ? 'Scarlett Supermarket'
                : 'Supermarket & Groceries'
              : undefined;

          collectedPlaces.set(p.id, {
            id: `gplace-${p.id}`,
            name,
            category,
            lat: p.location.latitude,
            lng: p.location.longitude,
            address: p.formattedAddress || 'Singapore',
            details: {
              foodType,
              hawkerType,
              cuisine: cuisineLabel,
              mallType: category === 'mall' ? 'Shopping Mall' : undefined,
              brand: supermarketBrand,
            },
          });
        }
      } else {
        const errJson = await gResponseGroc.json().catch(() => ({}));
        const status = errJson?.error?.status;
        const code = errJson?.error?.code;

        if (status === 'RESOURCE_EXHAUSTED' || code === 429) {
          return NextResponse.json(
            {
              error: 'QUOTA_EXCEEDED',
              message:
                'Daily Google Cloud quota limit reached. Your Google Cloud hard quota cap has been triggered to prevent billing charges. Official Singapore open data (OneMap, LTA Bus, MRT, MOE Schools, NEA Hawkers, HDB/URA resale) remains fully active.',
            },
            { status: 429 }
          );
        }

        if (status === 'PERMISSION_DENIED' || status === 'REQUEST_DENIED') {
          return NextResponse.json(
            {
              error: 'REQUEST_DENIED',
              message:
                'Google Places API request denied. Ensure Places API (New) is enabled on your API key in Google Cloud Console.',
            },
            { status: 403 }
          );
        }
      }
    } catch (newErr) {
      console.warn('Google Places (New) fetch error, attempting fallback:', newErr);
    }

    // 2. Fallback: Google Places API (Legacy) Nearby Search if New API returned nothing
    if (collectedPlaces.size === 0) {
      try {
        const legacyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${safeRadius}&type=restaurant&key=${apiKey}`;
        const legRes = await fetch(legacyUrl);
        if (legRes.ok) {
          const legData = await legRes.json();

          if (legData.status === 'OVER_QUERY_LIMIT') {
            return NextResponse.json(
              {
                error: 'QUOTA_EXCEEDED',
                message:
                  'Daily Google Cloud quota limit reached. Your Google Cloud hard quota cap has been triggered to prevent billing charges. Official Singapore open data (OneMap, LTA Bus, MRT, MOE Schools, NEA Hawkers, HDB/URA resale) remains fully active.',
              },
              { status: 429 }
            );
          }

          if (legData.status === 'REQUEST_DENIED') {
            return NextResponse.json(
              {
                error: 'REQUEST_DENIED',
                message:
                  'Google Places API request denied. Ensure Places API is enabled on your key.',
              },
              { status: 403 }
            );
          }

          if (legData.status === 'OK' && Array.isArray(legData.results)) {
            for (const p of legData.results) {
              if (!p.place_id || !p.geometry?.location) continue;
              const name = p.name || 'Unnamed Place';
              const category = mapGoogleTypeToCategory(p.types, undefined, name);

              const isCoffeeshop =
                /coffeeshop|kopitiam|food court|foodhouse|food house|eating house/i.test(name);

              collectedPlaces.set(p.place_id, {
                id: `gplace-${p.place_id}`,
                name,
                category,
                lat: p.geometry.location.lat,
                lng: p.geometry.location.lng,
                address: p.vicinity || 'Singapore',
                details: {
                  foodType: isCoffeeshop ? 'Coffeeshop / Food Court' : 'Restaurant / Eatery',
                  hawkerType: isCoffeeshop ? 'Food Centre & Coffeeshop' : undefined,
                  cuisine: p.rating
                    ? `⭐ ${p.rating.toFixed(1)} (${p.user_ratings_total || 0} Google reviews)`
                    : 'Google Places Verified',
                },
              });
            }
          }
        }
      } catch (legErr) {
        console.warn('Google Places Legacy query failed:', legErr);
      }
    }

    const placesArray = Array.from(collectedPlaces.values());

    if (placesArray.length > 0) {
      placesCache.set(cacheKey, { timestamp: Date.now(), data: placesArray });
    }

    return NextResponse.json({
      success: true,
      count: placesArray.length,
      places: placesArray,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
