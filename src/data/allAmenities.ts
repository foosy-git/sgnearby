// Consolidated Singapore Amenities Dataset
// Automatically maintained by scripts/sync-amenities.mjs
import { Amenity } from './types';
import { MRT_STATIONS } from './mrtStations';
import { ALL_SCHOOLS, PRIMARY_SCHOOLS } from './schools';
import { ALL_FOOD_PLACES, HAWKER_CENTRES } from './foodPlaces';
import { SUPERMARKETS_MALLS } from './supermarketsMalls';
import { HEALTHCARE_FACILITIES, PARKS_AND_NATURE } from './healthcareParks';
import { SPORTS_FACILITIES } from './sportsFacilities';
import { SINGAPORE_BUS_STOPS } from './busStops';
import { NEIGHBORHOOD_PLACES } from './neighborhoodPlaces';

export const ALL_AMENITIES: Amenity[] = [
  ...MRT_STATIONS,
  ...ALL_SCHOOLS,
  ...ALL_FOOD_PLACES,
  ...SUPERMARKETS_MALLS,
  ...HEALTHCARE_FACILITIES,
  ...PARKS_AND_NATURE,
  ...SPORTS_FACILITIES,
  ...SINGAPORE_BUS_STOPS,
  ...NEIGHBORHOOD_PLACES,
];

export {
  MRT_STATIONS,
  ALL_SCHOOLS,
  PRIMARY_SCHOOLS,
  ALL_FOOD_PLACES,
  HAWKER_CENTRES,
  SUPERMARKETS_MALLS,
  HEALTHCARE_FACILITIES,
  PARKS_AND_NATURE,
  SPORTS_FACILITIES,
  SINGAPORE_BUS_STOPS,
  NEIGHBORHOOD_PLACES,
};
