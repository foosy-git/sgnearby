import { CommuteEstimate, EmploymentHub, AmenityWithDistance } from '@/data/types';
import { EMPLOYMENT_HUBS } from '@/data/employmentHubs';
import { calculateDistanceMeters } from './geoUtils';

/**
 * Calculates door-to-door commute estimates to the 5 major Singapore employment clusters.
 * Factors in:
 * - Walking time to nearest MRT station
 * - Train in-vehicle travel time (~30-38 km/h effective speed including stops)
 * - Average transfer wait and dwell time (4-6 min penalty per line interchange)
 * - Peak-hour driving estimates (~30 km/h expressway/arterial road with morning traffic)
 */
export function calculateCommuteMatrix(
  propertyLat: number,
  propertyLng: number,
  nearestMrt?: AmenityWithDistance
): CommuteEstimate[] {
  const walkToMrtMin = nearestMrt ? nearestMrt.walkingMinutes : 8;

  return EMPLOYMENT_HUBS.map((hub) => {
    const distMeters = calculateDistanceMeters(propertyLat, propertyLng, hub.lat, hub.lng);
    const distKm = Math.max(0.5, Math.round((distMeters / 1000) * 10) / 10);

    // Estimate MRT in-vehicle ride time based on distance in Singapore urban network
    // Average MRT speed: ~35 km/h -> ~1.7 min per straight-line km
    // Add transit wait time: 3-4 min
    let inTrainMinutes = Math.round(distKm * 2.1) + 3;

    // Line interchange penalty if nearest MRT doesn't share a direct line with destination hub
    let lineMatch = false;
    let availableMrtLines: string[] = [];
    if (nearestMrt?.details?.lines) {
      availableMrtLines = nearestMrt.details.lines;
      lineMatch = nearestMrt.details.lines.some((line) => hub.lines.includes(line));
    }

    // If no direct line, add transfer penalty (walking through interchange station + waiting for next train)
    const transferPenalty = lineMatch ? 0 : 5;

    // Total Door-to-door transit minutes
    let totalTransit = walkToMrtMin + inTrainMinutes + transferPenalty;
    // Cap minimum transit time to 12 minutes if very close
    totalTransit = Math.max(12, totalTransit);

    // Peak-hour driving/taxi time: 3-4 min pickup + ~25-35 km/h peak traffic
    let drivingMinutes = Math.max(8, Math.round(distKm * 1.6) + 4);

    // Formulate a smart route summary string
    let recommendedRoute = 'MRT Train';
    if (lineMatch && availableMrtLines.length > 0) {
      const shared = availableMrtLines.find((l) => hub.lines.includes(l));
      recommendedRoute = `Direct via ${shared} Line`;
    } else if (nearestMrt) {
      recommendedRoute = `Via ${nearestMrt.name} (1 transfer)`;
    } else {
      recommendedRoute = `Bus / MRT (~${distKm}km)`;
    }

    return {
      hub,
      distanceKm: distKm,
      transitMinutes: totalTransit,
      drivingMinutes,
      recommendedRoute,
      mrtLines: hub.lines,
    };
  });
}
