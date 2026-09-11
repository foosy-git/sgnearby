import { NextRequest, NextResponse } from 'next/server';
import { Amenity, AmenityCategory } from '@/data/types';

// Map Google Place types and names to our application AmenityCategory
function mapGoogleTypeToCategory(
  types: string[] = [],
  primaryType?: string,
  name: string = ''
): AmenityCategory {
  const lowerName = name.toLowerCase();

  // 1. Explicit name heuristics for Singapore landmarks
  if (
    lowerName.includes('bus stop') ||
    lowerName.includes('bus int') ||
    lowerName.includes('bus interchange') ||
    lowerName.includes('opp blk') ||
    lowerName.includes('aft blk') ||
    lowerName.includes('bef blk')
  ) {
    return 'bus';
  }
  if (
    lowerName.includes('mrt') ||
    lowerName.includes('lrt') ||
    lowerName.includes('subway')
  ) {
    return 'mrt';
  }
  if (
    lowerName.includes('park') ||
    lowerName.includes('garden') ||
    lowerName.includes('playground') ||
    lowerName.includes('nature reserve') ||
    lowerName.includes('park connector') ||
    lowerName.includes('reservoir') ||
    lowerName.includes('fitness corner')
  ) {
    return 'park';
  }
  if (
    lowerName.includes('hawker') ||
    lowerName.includes('food centre') ||
    lowerName.includes('market & food') ||
    lowerName.includes('kopitiam') ||
    lowerName.includes('coffeeshop') ||
    lowerName.includes('coffee shop') ||
    lowerName.includes('eating house') ||
    lowerName.includes('food court')
  ) {
    return 'food';
  }

  const allTypes = [primaryType, ...types].filter(Boolean) as string[];

  // 2. Bus stops & stations first (do NOT let generic transit_station override bus)
  if (allTypes.some((t) => ['bus_stop', 'bus_station'].includes(t))) {
    return 'bus';
  }

  // 3. MRT & Rail
  if (
    allTypes.some((t) =>
      ['subway_station', 'light_rail_station', 'train_station'].includes(t)
    )
  ) {
    return 'mrt';
  }

  if (allTypes.includes('transit_station')) {
    return lowerName.includes('bus') ? 'bus' : 'mrt';
  }

  // 4. Parks & Nature
  if (
    allTypes.some((t) =>
      ['park', 'national_park', 'garden', 'hiking_area', 'playground', 'campground'].includes(t)
    ) ||
    lowerName.includes('town park') ||
    lowerName.includes('waterfront park') ||
    lowerName.includes('nature reserve') ||
    lowerName.includes('nature park') ||
    lowerName.includes('community park') ||
    lowerName.includes('linear park') ||
    lowerName.includes('active park') ||
    (lowerName.includes(' park') &&
      !lowerName.includes('car park') &&
      !lowerName.includes('business park') &&
      !lowerName.includes('industrial park') &&
      !lowerName.includes('tech park') &&
      !lowerName.includes('science park') &&
      !lowerName.includes('food park') &&
      !lowerName.includes('parkway') &&
      !lowerName.includes('parklane') &&
      !lowerName.includes('park bench')) ||
    (lowerName.includes('garden') &&
      !lowerName.includes('kindergarten') &&
      !lowerName.includes('beer garden') &&
      !lowerName.includes('restaurant') &&
      !lowerName.includes('cafe'))
  ) {
    return 'park';
  }

  // 5. Food & Hawker
  if (
    allTypes.some((t) =>
      [
        'food_court',
        'restaurant',
        'cafe',
        'bakery',
        'bar',
        'meal_takeaway',
        'coffee_shop',
        'meal_delivery',
        'fast_food_restaurant',
      ].includes(t)
    )
  ) {
    return 'food';
  }

  // 6. Shopping Malls
  if (
    allTypes.some((t) => ['shopping_mall', 'department_store'].includes(t)) ||
    lowerName.includes(' mall') ||
    lowerName.includes('shopping centre') ||
    lowerName.includes('shopping center')
  ) {
    return 'mall';
  }


  // 7. Supermarkets & Groceries
  if (
    allTypes.some((t) =>
      [
        'supermarket',
        'grocery_store',
        'convenience_store',
        'store',
        'clothing_store',
      ].includes(t)
    )
  ) {
    return 'supermarket';
  }

  // 7. Schools
  if (
    allTypes.some((t) =>
      ['primary_school', 'school', 'secondary_school', 'university', 'preschool'].includes(t)
    )
  ) {
    return 'school';
  }

  // 8. Healthcare
  if (
    allTypes.some((t) =>
      ['hospital', 'doctor', 'pharmacy', 'medical_clinic', 'dentist', 'physiotherapist'].includes(t)
    )
  ) {
    return 'healthcare';
  }

  return 'food';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lng, radius = 800, clientKey } = body;

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const apiKey =
      clientKey || process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'NO_API_KEY',
          message:
            'Google Places API Key is not configured. Please add your key in Settings or .env.local',
        },
        { status: 401 }
      );
    }

    const safeRadius = Math.min(Math.max(radius, 100), 2000);
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
      'places.googleMapsUri',
      'places.priceLevel',
      'places.currentOpeningHours.openNow',
    ].join(',');

    // Category target bundles for Google Places API (New)
    // Running targeted queries ensures Google doesn't crowd out bus stops, parks, and hawkers
    const targetCategories = [
      // 1. Bus Stops & Transit Stations
      ['bus_stop', 'transit_station', 'subway_station'],
      // 2. Hawker Food, Cafes & Food Courts
      ['food_court', 'restaurant', 'cafe', 'bakery', 'meal_takeaway', 'fast_food_restaurant'],
      // 3. Parks, Gardens & Playgrounds
      ['park', 'national_park', 'garden', 'playground', 'hiking_area'],
      // 4. Supermarkets, Groceries & Healthcare
      ['supermarket', 'grocery_store', 'convenience_store', 'shopping_mall', 'pharmacy', 'medical_clinic'],
    ];

    const collectedPlaces = new Map<string, Amenity>();

    // 1. Attempt Google Places API (New) with targeted category queries
    const newApiPromises = targetCategories.map(async (includedTypes) => {
      try {
        const gResponse = await fetch(newPlacesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': fieldMask,
          },
          body: JSON.stringify({
            includedTypes,
            maxResultCount: 20,
            locationRestriction: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: safeRadius,
              },
            },
          }),
        });

        if (gResponse.ok) {
          const gData = await gResponse.json();
          const rawPlaces = gData.places || [];

          for (const p of rawPlaces) {
            if (!p.id || !p.location?.latitude || !p.location?.longitude) continue;
            const name = p.displayName?.text || 'Unnamed Place';
            const category = mapGoogleTypeToCategory(p.types, p.primaryType, name);

            // Extract bus lines or details if present
            const isBus = category === 'bus';
            const isFood = category === 'food';
            const isPark = category === 'park';
            const isMall = category === 'mall';

            // Auto-detect hawker cuisine or food court
            let cuisineLabel = p.rating
              ? `⭐ ${p.rating.toFixed(1)} (${p.userRatingCount || 0} reviews)${
                  p.currentOpeningHours?.openNow !== undefined
                    ? p.currentOpeningHours.openNow
                      ? ' • Open Now'
                      : ' • Closed'
                    : ''
                }`
              : undefined;

            if (isFood && (name.toLowerCase().includes('hawker') || name.toLowerCase().includes('food centre'))) {
              cuisineLabel = cuisineLabel ? `Hawker Centre • ${cuisineLabel}` : 'Hawker Centre / Local Delights';
            }

            collectedPlaces.set(p.id, {
              id: `gplace-${p.id}`,
              name,
              category,
              lat: p.location.latitude,
              lng: p.location.longitude,
              address: p.formattedAddress,
              details: {
                brand: isBus
                  ? 'Public Bus Stop'
                  : isMall
                  ? 'Shopping Mall'
                  : p.primaryType
                  ? p.primaryType.replace(/_/g, ' ')
                  : undefined,
                mallType: isMall ? 'Shopping Mall' : undefined,
                cuisine: cuisineLabel,
                parkType: isPark ? 'Neighborhood Park' : undefined,
              },
            });
          }
        }
      } catch (catErr) {
        console.warn('Google Places (New) category query failed:', catErr);
      }
    });

    await Promise.allSettled(newApiPromises);

    if (collectedPlaces.size > 0) {
      const placesArray = Array.from(collectedPlaces.values());
      return NextResponse.json({
        source: 'google_places_new',
        count: placesArray.length,
        places: placesArray,
      });
    }

    // 2. Fallback: Google Places API (Legacy) with multi-type search
    const legacyTypes = ['bus_stop', 'restaurant', 'park', 'supermarket'];
    const legacyPromises = legacyTypes.map(async (type) => {
      try {
        const legacyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${safeRadius}&type=${type}&key=${apiKey}`;
        const legRes = await fetch(legacyUrl);
        if (legRes.ok) {
          const legData = await legRes.json();
          if (legData.status === 'OK' && Array.isArray(legData.results)) {
            for (const p of legData.results) {
              if (!p.place_id || !p.geometry?.location) continue;
              const name = p.name || 'Unnamed Place';
              const category = mapGoogleTypeToCategory(p.types, undefined, name);

              collectedPlaces.set(p.place_id, {
                id: `gplace-${p.place_id}`,
                name,
                category,
                lat: p.geometry.location.lat,
                lng: p.geometry.location.lng,
                address: p.vicinity,
                details: {
                  cuisine: p.rating
                    ? `⭐ ${p.rating.toFixed(1)} (${p.user_ratings_total || 0} reviews)`
                    : undefined,
                  brand: category === 'bus' ? 'Public Bus Stop' : undefined,
                },
              });
            }
          }
        }
      } catch (legErr) {
        console.warn('Google Places Legacy query failed for type:', type, legErr);
      }
    });

    await Promise.allSettled(legacyPromises);

    if (collectedPlaces.size > 0) {
      const placesArray = Array.from(collectedPlaces.values());
      return NextResponse.json({
        source: 'google_places_legacy',
        count: placesArray.length,
        places: placesArray,
      });
    }

    return NextResponse.json(
      {
        error: 'GOOGLE_API_ERROR',
        message:
          'Google Places API request returned zero results or was rejected. Please ensure Places API is enabled on your key.',
      },
      { status: 403 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

