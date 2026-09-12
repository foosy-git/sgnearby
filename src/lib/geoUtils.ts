import { Amenity, AmenityWithDistance, ConvenienceScore } from '@/data/types';
import { isTwoTrackSchool } from '@/data/schools';

/**
 * Calculates haversine distance between two coordinates in meters
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates estimated walking duration in minutes.
 * Standard urban walking pace: ~80 meters per minute (~4.8 km/h).
 * Added 1 minute base overhead for pedestrian crossings/intersections.
 */
export function calculateWalkingMinutes(meters: number): number {
  if (meters <= 50) return 1;
  const rawMinutes = Math.round(meters / 75);
  return Math.max(1, rawMinutes);
}

/**
 * Formats distance cleanly (e.g. "350 m" or "1.4 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Generates direct Google Maps walking directions deep-link
 */
export function getGoogleMapsWalkUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  destName?: string
): string {
  const queryParam = destName ? `&destination_place_id=${encodeURIComponent(destName)}` : '';
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=walking${queryParam}`;
}

/**
 * Calculates proximity metrics for all amenities relative to selected location
 */
export function processAmenitiesWithDistance(
  amenities: Amenity[],
  centerLat: number,
  centerLng: number,
  maxDistanceMeters?: number,
  showSchoolRings: boolean = true
): AmenityWithDistance[] {
  return amenities
    .map((item) => {
      const distanceMeters = calculateDistanceMeters(
        centerLat,
        centerLng,
        item.lat,
        item.lng
      );
      const walkingMinutes = calculateWalkingMinutes(distanceMeters);

      let schoolPriority: '1km' | '2km' | 'outside' | undefined;
      let isTwoTrackScheme: boolean | undefined;
      let twoTrackTrack: 'within-2km' | 'beyond-2km' | undefined;
      let schoolPriorityNote: string | undefined;

      if (item.category === 'school' && (item.details?.schoolLevel === 'Primary' || !item.details?.schoolLevel)) {
        if (distanceMeters <= 1000) {
          schoolPriority = '1km';
          schoolPriorityNote = 'Within 1km';
        } else if (distanceMeters <= 2000) {
          schoolPriority = '2km';
          schoolPriorityNote = '1km - 2km';
        } else {
          schoolPriority = 'outside';
          schoolPriorityNote = 'Outside 2km';
        }
      }

      return {
        ...item,
        distanceMeters,
        walkingMinutes,
        schoolPriority,
        isTwoTrackScheme,
        twoTrackTrack,
        schoolPriorityNote,
      };
    })
    .filter((item) => {
      if (maxDistanceMeters === undefined) return true;
      // When school rings are enabled, include schools up to 2km for Phase 2C priority analysis
      // When school rings are disabled, schools outside the selected walking radius disappear
      if (item.category === 'school') {
        if (showSchoolRings) {
          return item.distanceMeters <= Math.max(maxDistanceMeters, 2000);
        }
        return item.distanceMeters <= maxDistanceMeters;
      }
      return item.distanceMeters <= maxDistanceMeters;
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Smooth distance decay helper:
 * Returns 100 at <= minMeters, decaying smoothly to 0 at maxMeters.
 */
export function calculateDecayScore(
  distanceMeters: number,
  minMeters: number,
  maxMeters: number
): number {
  if (distanceMeters <= minMeters) return 100;
  if (distanceMeters >= maxMeters) return 0;
  const ratio = (maxMeters - distanceMeters) / (maxMeters - minMeters);
  return Math.round(Math.pow(ratio, 1.4) * 100);
}

/**
 * Computes a Singapore neighborhood convenience score (0-100)
 * Evaluates proximity and density across standard walking thresholds.
 * When no amenities are present, returns 0 without arbitrary base floors.
 */
export function calculateConvenienceScore(
  amenitiesWithDistance: AmenityWithDistance[]
): ConvenienceScore {
  const mrts = amenitiesWithDistance
    .filter((a) => a.category === 'mrt')
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
  const buses = amenitiesWithDistance
    .filter((a) => a.category === 'bus')
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
  const foods = amenitiesWithDistance
    .filter((a) => a.category === 'food')
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
  const groceries = amenitiesWithDistance
    .filter((a) => a.category === 'shopping' || a.category === 'supermarket' || a.category === 'mall')
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
  const schools = amenitiesWithDistance
    .filter((a) => a.category === 'school')
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
  const parks = amenitiesWithDistance
    .filter((a) => a.category === 'park')
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
  const sports = amenitiesWithDistance
    .filter((a) => a.category === 'sports')
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  // 1. Transit Score (25% weight)
  // MRT proximity (decay 350m -> 1400m) + Bus stop proximity (decay 150m -> 450m)
  let mrtScore = 0;
  if (mrts.length > 0 && mrts[0].distanceMeters <= 1400) {
    mrtScore = calculateDecayScore(mrts[0].distanceMeters, 350, 1400);
  }

  let busScore = 0;
  if (buses.length > 0 && buses[0].distanceMeters <= 500) {
    busScore = calculateDecayScore(buses[0].distanceMeters, 150, 500);
  }

  let transit = 0;
  if (mrtScore > 0 && busScore > 0) {
    transit = Math.min(100, Math.round(mrtScore * 0.75 + busScore * 0.25));
  } else if (mrtScore > 0) {
    transit = Math.round(mrtScore * 0.9);
  } else if (busScore > 0) {
    // Bus-only connectivity is capped at 50 without rail transit
    transit = Math.round(busScore * 0.5);
  }

  // 2. Hawker & Dining Score (25% weight)
  // Nearest food proximity (decay 300m -> 1200m) + density bonus within 800m
  let food = 0;
  if (foods.length > 0 && foods[0].distanceMeters <= 1200) {
    const proximity = calculateDecayScore(foods[0].distanceMeters, 300, 1200);
    const countWithin800m = foods.filter((f) => f.distanceMeters <= 800).length;
    const densityBonus = Math.min(40, countWithin800m * 10);
    food = Math.min(100, Math.round(proximity * 0.6 + densityBonus));
  }

  // 3. Groceries & Shopping (20% weight)
  // Supermarkets / malls proximity (decay 350m -> 1200m) + density within 800m
  let groc = 0;
  if (groceries.length > 0 && groceries[0].distanceMeters <= 1200) {
    const proximity = calculateDecayScore(groceries[0].distanceMeters, 350, 1200);
    const countWithin800m = groceries.filter((g) => g.distanceMeters <= 800).length;
    const densityBonus = Math.min(40, countWithin800m * 15);
    groc = Math.min(100, Math.round(proximity * 0.6 + densityBonus));
  }

  // 4. Primary Schools (15% weight)
  // Based on official Singapore MOE Phase 1/2 priority circles (<1km & 1-2km)
  let school = 0;
  const primarySchools = schools.filter(
    (s) => s.details?.schoolLevel === 'Primary' || !s.details?.schoolLevel
  );
  const schoolsWithin1km = primarySchools.filter((s) => s.distanceMeters <= 1000).length;
  const schoolsWithin2km = primarySchools.filter((s) => s.distanceMeters <= 2000).length;

  if (schoolsWithin1km >= 2) {
    school = 100;
  } else if (schoolsWithin1km === 1) {
    school = 85;
  } else if (schoolsWithin2km >= 2) {
    school = 65;
  } else if (schoolsWithin2km === 1) {
    school = 45;
  }

  // 5. Parks & Greenery (10% weight)
  // Proximity (decay 400m -> 1200m) + variety bonus within 1000m
  let park = 0;
  if (parks.length > 0 && parks[0].distanceMeters <= 1200) {
    const proximity = calculateDecayScore(parks[0].distanceMeters, 400, 1200);
    const countWithin1000m = parks.filter((p) => p.distanceMeters <= 1000).length;
    const densityBonus = Math.min(30, countWithin1000m * 10);
    park = Math.min(100, Math.round(proximity * 0.7 + densityBonus));
  }

  // 6. Sports & Recreation (5% weight)
  // ActiveSG sports halls, swimming complexes, gyms within 1500m
  let sportsScore = 0;
  if (sports.length > 0 && sports[0].distanceMeters <= 1600) {
    sportsScore = calculateDecayScore(sports[0].distanceMeters, 500, 1600);
  }

  // Weighted average: Transit (25%), Food (25%), Groceries (20%), Schools (15%), Parks (10%), Sports (5%)
  const overall = Math.round(
    transit * 0.25 +
      food * 0.25 +
      groc * 0.2 +
      school * 0.15 +
      park * 0.1 +
      sportsScore * 0.05
  );

  let summaryLabel = 'Car-Dependent / No Amenities';
  if (overall >= 90) summaryLabel = "Walker's Paradise";
  else if (overall >= 75) summaryLabel = 'Very Walkable';
  else if (overall >= 50) summaryLabel = 'Somewhat Walkable';
  else if (overall >= 25) summaryLabel = 'Mostly Car-Dependent';
  else if (overall > 0) summaryLabel = 'Car-Dependent / Few Amenities';

  return {
    overall,
    transit,
    food,
    groceries: groc,
    schools: school,
    parks: park,
    sports: sportsScore,
    summaryLabel,
  };
}
