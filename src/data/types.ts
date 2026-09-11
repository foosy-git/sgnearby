export type AmenityCategory =
  | 'mrt'
  | 'bus'
  | 'food'
  | 'mall'
  | 'supermarket'
  | 'shopping'
  | 'school'
  | 'healthcare'
  | 'park'
  | 'sports';

export interface Amenity {
  id: string;
  name: string;
  category: AmenityCategory;
  lat: number;
  lng: number;
  address?: string;
  details?: {
    lines?: string[]; // For MRT lines: ['NS', 'EW'], or bus routes
    stationCode?: string; // e.g., 'NS1/EW24' or 5-digit bus stop code
    schoolType?: string; // e.g., 'Government', 'Autonomous', 'SAP'
    schoolLevel?: 'Primary' | 'Secondary' | 'Junior College' | 'Tertiary';
    schoolGender?: 'Co-ed' | 'Girls' | 'Boys';
    cuisine?: string;
    stallsCount?: number;
    hawkerType?: string; // e.g. 'NEA Hawker Centre', 'Food Court & Hawker Hub'
    foodType?: 'Hawker Centre' | 'Coffeeshop / Food Court' | 'Restaurant / Eatery' | 'Cafe & Bakery';
    mallType?: string; // e.g. 'Regional Shopping Mall', 'Neighborhood Shopping Centre', 'Lifestyle Mall'
    brand?: string; // For supermarkets: 'FairPrice', 'Cold Storage' or mall highlights
    hospitalType?: 'Polyclinic' | 'Hospital' | 'Medical Centre';
    parkType?: 'Regional Park' | 'Nature Reserve' | 'PCN' | 'Neighborhood Park';
    sportsType?: string; // e.g. 'Swimming Complex', 'Stadium', 'Community Club & Sports Hall'
    ballotingRisk?: 'High' | 'Moderate' | 'Low'; // Phase 2C Balloting Competitiveness
    ballotingNote?: string;
  };
}

export interface AmenityWithDistance extends Amenity {
  distanceMeters: number;
  walkingMinutes: number;
  schoolPriority?: '1km' | '2km' | 'outside';
}

export interface SelectedProperty {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  postalCode?: string;
  propertyType?: 'HDB' | 'Condo' | 'Landed' | 'Commercial' | 'Custom Location';
  town?: string;
  block?: string;
  streetName?: string;
}

export interface ConvenienceScore {
  overall: number; // 0 - 100
  transit: number; // 0 - 100
  food: number; // 0 - 100
  groceries: number; // 0 - 100
  schools: number; // 0 - 100
  parks: number; // 0 - 100
  sports?: number; // 0 - 100
  summaryLabel: string; // e.g. "Walker's Paradise", "Highly Convenient"
}

export interface EmploymentHub {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  lat: number;
  lng: number;
  nearestMrt: string;
  lines: string[];
}

export interface CommuteEstimate {
  hub: EmploymentHub;
  distanceKm: number;
  transitMinutes: number;
  drivingMinutes: number;
  recommendedRoute: string;
  mrtLines: string[];
}

export type CardinalDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface SunOrientationAnalysis {
  direction: CardinalDirection;
  label: string;
  heatLevel: 'Low (Cool)' | 'Mild (Morning Sun)' | 'Moderate' | 'High (Afternoon Sun Alert)';
  heatBadgeClass: string;
  sunExposureHours: string;
  crossVentilation: 'High (Breezy)' | 'Moderate' | 'Low';
  description: string;
  buyerTips: string[];
}
