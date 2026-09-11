import { CardinalDirection, SunOrientationAnalysis } from '@/data/types';

export const ORIENTATION_DATA: Record<CardinalDirection, SunOrientationAnalysis> = {
  N: {
    direction: 'N',
    label: 'North Facing',
    heatLevel: 'Low (Cool)',
    heatBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    sunExposureHours: 'Indirect daylight, minimal direct beam',
    crossVentilation: 'High (Breezy)',
    description:
      'Highly desirable Singapore orientation. Avoids scorching afternoon sun year-round while capturing cool prevailing Northeast monsoon winds (Dec–Mar).',
    buyerTips: [
      'Minimal aircon electricity bills compared to West-facing units',
      'Gentle indirect light throughout the day, ideal for home offices',
      'Commands a steady 3% to 5% resale price premium among savvy buyers',
    ],
  },
  S: {
    direction: 'S',
    label: 'South Facing',
    heatLevel: 'Low (Cool)',
    heatBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    sunExposureHours: 'Indirect soft light, virtually no afternoon heat',
    crossVentilation: 'High (Breezy)',
    description:
      'Equally prized as North-facing. Receives cool Southwest monsoon breezes (Jun–Sep) with no direct western sun exposure.',
    buyerTips: [
      'Very comfortable indoor ambient temperature in the late afternoon and evening',
      'Great natural ventilation if living room and service yard have unblocked openings',
      'Consistent resale liquidity when exiting in the open market',
    ],
  },
  NE: {
    direction: 'NE',
    label: 'North-East Facing',
    heatLevel: 'Mild (Morning Sun)',
    heatBadgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    sunExposureHours: '7:30 AM – 10:30 AM (Gentle morning glow)',
    crossVentilation: 'High (Breezy)',
    description:
      'Popular choice for early risers. Gentle morning sunshine that warms the home without overheating it, transitioning to cool shade by noon.',
    buyerTips: [
      'Natural morning alarm clock without unbearable heat',
      'House is already cooled down by the time you return home from work',
      'Catches the cool Northeast monsoon corridor',
    ],
  },
  SE: {
    direction: 'SE',
    label: 'South-East Facing',
    heatLevel: 'Mild (Morning Sun)',
    heatBadgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    sunExposureHours: '8:00 AM – 11:30 AM (Bright morning rays)',
    crossVentilation: 'Moderate',
    description:
      'Pleasant morning brightness. Escapes the intense late afternoon heat trap, maintaining a pleasant temperature in the evenings.',
    buyerTips: [
      'Great for drying laundry on service yard balconies in the morning',
      'Rooms stay cool for comfortable evening dinners and sleep',
      'Standard roller blinds are sufficient',
    ],
  },
  E: {
    direction: 'E',
    label: 'East Facing',
    heatLevel: 'Mild (Morning Sun)',
    heatBadgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    sunExposureHours: '7:00 AM – 11:00 AM (Direct morning sun)',
    crossVentilation: 'Moderate',
    description:
      'Direct morning sun that energizes the flat early in the day. Complete shade after 1:00 PM when Singapore temperatures peak.',
    buyerTips: [
      'Good daylight for plants and indoor gardens',
      'Zero heat retention in walls at night',
      'Consider light day-curtains if bedroom windows face directly east',
    ],
  },
  NW: {
    direction: 'NW',
    label: 'North-West Facing',
    heatLevel: 'High (Afternoon Sun Alert)',
    heatBadgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    sunExposureHours: '2:30 PM – 6:30 PM (Mid-year afternoon sun)',
    crossVentilation: 'Moderate',
    description:
      'Receives slanted afternoon sun, especially between May and August when the sun tilts slightly north. Walls can stay warm into the evening.',
    buyerTips: [
      'Budget for 99% UV-blocking solar film for living room windows (~$800–$1,200)',
      'Consider blackout / dim-out honeycomb curtains to block midday heat',
      'Leverage this as a negotiation point to offer below asking price',
    ],
  },
  SW: {
    direction: 'SW',
    label: 'South-West Facing',
    heatLevel: 'High (Afternoon Sun Alert)',
    heatBadgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    sunExposureHours: '2:30 PM – 6:30 PM (End-year afternoon sun)',
    crossVentilation: 'Moderate',
    description:
      'Exposed to intense afternoon sun between October and February as the solar path tilts south. Evening air conditioning is frequently necessary.',
    buyerTips: [
      'Look for heavy curtains and high BTU inverter air-conditioners',
      'Check if neighboring blocks cast a shadow across your floor level during 3 PM – 5 PM',
      'Common reason some units stay longer on property portals',
    ],
  },
  W: {
    direction: 'W',
    label: 'West Facing (Direct Sun)',
    heatLevel: 'High (Afternoon Sun Alert)',
    heatBadgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    sunExposureHours: '1:30 PM – 6:45 PM (Direct scorching western heat)',
    crossVentilation: 'Low',
    description:
      'The classic Singapore "Western Sun" (太阳西晒). Direct solar radiation penetrates all afternoon, turning concrete walls into thermal heat-sinks that radiate heat until 10 PM.',
    buyerTips: [
      'Must install high-grade ceramic solar films and thermal-backed blackout drapes',
      'Aircon electricity consumption can be 20%–35% higher each month',
      'Significant resale discount: use this to negotiate $20,000–$40,000 off seller’s asking price',
    ],
  },
};

export function getSunOrientation(direction: CardinalDirection): SunOrientationAnalysis {
  return ORIENTATION_DATA[direction] || ORIENTATION_DATA.N;
}
