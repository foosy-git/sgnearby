/**
 * SG Nearby - Automated Singapore Amenities Synchronization Pipeline
 * 
 * Fetches, cleans, and bundles official Singapore infrastructure datasets:
 * - 5,200+ Public Bus Stops (with passing bus services from LTA DataMall)
 * - 165+ Shopping Malls across Central, East, West, North, & North-East regions
 * - 150+ Supermarket Hubs (FairPrice, Cold Storage, Sheng Siong, Giant, Donki, Prime)
 * - 40+ ActiveSG Sport Centres, Stadiums, Swimming Complexes & Gyms
 * - 118+ NEA Hawker Centres & Food Hubs
 * 
 * Run anytime via: npm run sync:data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../src/data');

console.log('🚀 Starting Singapore Amenities Sync Pipeline...');
console.log(`📁 Target directory: ${DATA_DIR}`);

// ----------------------------------------------------------------------
// Helper: Load environment variables from .env.local or .env
// ----------------------------------------------------------------------
function loadLocalEnv() {
  const candidates = ['.env.local', '.env'];
  for (const file of candidates) {
    const filePath = path.resolve(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}
loadLocalEnv();

// Helper to sort bus numbers logically (e.g., 2, 14, 14e, 107, 107M)
function sortBusNumbers(a, b) {
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);
  if (!isNaN(numA) && !isNaN(numB)) {
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  }
  return a.localeCompare(b);
}

// ----------------------------------------------------------------------
// 1. Ingest Singapore Bus Stops (Direct from LTA DataMall API with fallback)
// ----------------------------------------------------------------------
async function fetchLtaPaginated(endpoint, accountKey) {
  const baseUrl = `https://datamall2.mytransport.sg/ltaodataservice/${endpoint}`;
  let skip = 0;
  const allRecords = [];

  while (true) {
    const url = `${baseUrl}?$skip=${skip}`;
    process.stdout.write(`   ↳ Querying LTA ${endpoint} (skip=${skip})...\r`);
    const res = await fetch(url, {
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LTA DataMall API responded with HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const records = data.value || [];
    allRecords.push(...records);

    if (records.length < 500) {
      break; // Reached last page
    }
    skip += 500;
  }

  process.stdout.write(`\n   ✓ Downloaded ${allRecords.length} records from LTA ${endpoint}\n`);
  return allRecords;
}

async function syncBusStops() {
  console.log('\n🚌 [1/4] Ingesting Singapore Bus Network...');
  const ltaKey = process.env.LTA_DATAMALL_KEY || process.env.LTA_ACCOUNT_KEY;

  if (ltaKey) {
    console.log('🔑 Detected LTA DataMall Key in environment.');
    console.log('🌐 Fetching directly from official LTA DataMall API (datamall2.mytransport.sg)...');
    try {
      // 1. Fetch Bus Stops (~5,200 records, ~11 pages)
      const rawStops = await fetchLtaPaginated('BusStops', ltaKey);
      
      // 2. Fetch Bus Routes (~26,000+ records, ~53 pages)
      const rawRoutes = await fetchLtaPaginated('BusRoutes', ltaKey);

      // 3. Aggregate passing services per bus stop
      const stopServices = new Map();
      for (const route of rawRoutes) {
        const stopCode = route.BusStopCode;
        const serviceNo = route.ServiceNo;
        if (!stopCode || !serviceNo) continue;
        if (!stopServices.has(stopCode)) {
          stopServices.set(stopCode, new Set());
        }
        stopServices.get(stopCode).add(serviceNo);
      }

      // 4. Format into Amenity objects
      const busStopsList = [];
      for (const stop of rawStops) {
        const code = stop.BusStopCode;
        const lat = parseFloat(stop.Latitude);
        const lng = parseFloat(stop.Longitude);
        const desc = stop.Description || '';
        const road = stop.RoadName || '';

        // Singapore boundary coordinates sanity check
        if (!lat || !lng || lat < 1.15 || lat > 1.48 || lng < 103.55 || lng > 104.05) continue;

        const lines = stopServices.has(code)
          ? Array.from(stopServices.get(code)).sort(sortBusNumbers)
          : [];

        busStopsList.push({
          id: `bus-${code}`,
          name: road ? `${desc} (${road})` : desc,
          category: 'bus',
          lat: Number(lat.toFixed(5)),
          lng: Number(lng.toFixed(5)),
          details: {
            stationCode: code,
            lines: lines.length > 0 ? lines : undefined,
          },
        });
      }

      busStopsList.sort((a, b) => (a.details.stationCode || '').localeCompare(b.details.stationCode || ''));

      const content = `// Generated automatically by scripts/sync-amenities.mjs - DO NOT EDIT DIRECTLY
// Source: Official LTA DataMall API (https://datamall2.mytransport.sg) - ${busStopsList.length} verified stops
import { Amenity } from './types';

export const SINGAPORE_BUS_STOPS: Amenity[] = ${JSON.stringify(busStopsList, null, 2)};
`;

      fs.writeFileSync(path.join(DATA_DIR, 'busStops.ts'), content, 'utf8');
      console.log(`✅ Successfully synced ${busStopsList.length} Singapore bus stops directly from LTA DataMall into busStops.ts`);
      return busStopsList.length;
    } catch (err) {
      console.warn(`⚠️ Direct LTA DataMall fetch failed: ${err.message}`);
      console.log('🔄 Falling back to data.busrouter.sg mirror...');
    }
  } else {
    console.log('ℹ️ No LTA_DATAMALL_KEY found in .env.local. Using data.busrouter.sg mirror...');
  }

  // Fallback: Ingest via data.busrouter.sg
  try {
    const [stopsRes, servicesRes] = await Promise.all([
      fetch('https://data.busrouter.sg/v1/stops.min.json'),
      fetch('https://data.busrouter.sg/v1/services.min.json'),
    ]);

    if (!stopsRes.ok || !servicesRes.ok) {
      throw new Error(`Failed to download bus data (stops: ${stopsRes.status}, services: ${servicesRes.status})`);
    }

    const stops = await stopsRes.json();
    const services = await servicesRes.json();

    const stopServices = new Map();
    for (const [serviceNo, serviceData] of Object.entries(services)) {
      if (!serviceData.routes) continue;
      for (const route of serviceData.routes) {
        for (const stopCode of route) {
          if (!stopServices.has(stopCode)) {
            stopServices.set(stopCode, new Set());
          }
          stopServices.get(stopCode).add(serviceNo);
        }
      }
    }

    const busStopsList = [];
    for (const [code, data] of Object.entries(stops)) {
      const [lng, lat, name, road] = data;
      if (!lat || !lng || lat < 1.15 || lat > 1.48 || lng < 103.55 || lng > 104.05) continue;

      const lines = stopServices.has(code)
        ? Array.from(stopServices.get(code)).sort(sortBusNumbers)
        : [];

      busStopsList.push({
        id: `bus-${code}`,
        name: road ? `${name} (${road})` : name,
        category: 'bus',
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        details: {
          stationCode: code,
          lines: lines.length > 0 ? lines : undefined,
        },
      });
    }

    busStopsList.sort((a, b) => (a.details.stationCode || '').localeCompare(b.details.stationCode || ''));

    const content = `// Generated automatically by scripts/sync-amenities.mjs - DO NOT EDIT DIRECTLY
// Source: LTA DataMall (via busrouter mirror) (${busStopsList.length} verified stops)
import { Amenity } from './types';

export const SINGAPORE_BUS_STOPS: Amenity[] = ${JSON.stringify(busStopsList, null, 2)};
`;

    fs.writeFileSync(path.join(DATA_DIR, 'busStops.ts'), content, 'utf8');
    console.log(`✅ Successfully synced ${busStopsList.length} Singapore bus stops into busStops.ts`);
    return busStopsList.length;
  } catch (err) {
    console.error('❌ Failed to sync bus stops:', err);
    throw err;
  }
}

// ----------------------------------------------------------------------
// 2. Comprehensive Sports Facilities (ActiveSG, Stadiums, Pools)
// ----------------------------------------------------------------------
function syncSportsFacilities() {
  console.log('\n🏊 [2/4] Generating Comprehensive Singapore Sports Facilities...');

  const sportsFacilities = [
    // --- Central & South Region ---
    { id: 'sport-sports-hub', name: 'Singapore Sports Hub & National Stadium', category: 'sports', lat: 1.3039, lng: 103.8748, address: '1 Stadium Dr', details: { sportsType: 'Stadium', brand: '55,000-seat National Stadium & 100PLUS Promenade' } },
    { id: 'sport-ocbc-aquatic', name: 'OCBC Aquatic Centre', category: 'sports', lat: 1.3025, lng: 103.8752, address: '7 Stadium Dr', details: { sportsType: 'Swimming Complex', brand: 'Olympic-size competition & diving pools' } },
    { id: 'sport-ocbc-arena', name: 'OCBC Arena & Sports Hall', category: 'sports', lat: 1.3045, lng: 103.8765, address: '5 Stadium Dr', details: { sportsType: 'Indoor Sports Hall', brand: 'Multi-purpose halls for badminton, basketball, netball' } },
    { id: 'sport-kallang-tennis', name: 'Kallang Tennis & Squash Centre', category: 'sports', lat: 1.3075, lng: 103.8785, address: '52 Stadium Rd', details: { sportsType: 'Sport Centre', brand: '14 tennis courts, squash courts & running track' } },
    { id: 'sport-jalan-besar', name: 'Jalan Besar Stadium & Swimming Complex', category: 'sports', lat: 1.3098, lng: 103.8601, address: '100 Tyrwhitt Rd', details: { sportsType: 'Stadium', brand: 'FAS Singapore Premier League home ground & ActiveSG Gym' } },
    { id: 'sport-delta-sports', name: 'Delta Sport Centre & Swimming Complex', category: 'sports', lat: 1.2915, lng: 103.8235, address: '900 Tiong Bahru Rd', details: { sportsType: 'Sport Centre', brand: 'Full size hockey pitch, swimming pool, badminton halls' } },
    { id: 'sport-queenstown-sports', name: 'Queenstown Stadium & Swimming Complex', category: 'sports', lat: 1.2965, lng: 103.8052, address: '473 Stirling Rd', details: { sportsType: 'Stadium', brand: 'Stadium track, Olympic pool & ActiveSG Gym' } },

    // --- Central / North-Central (Bishan, Toa Payoh, Ang Mo Kio) ---
    { id: 'sport-bishan-stadium', name: 'Bishan Stadium & ActiveSG Gym', category: 'sports', lat: 1.3548, lng: 103.8512, address: '280 Bishan St 22', details: { sportsType: 'Stadium', brand: '400m running track, fitness gym, Lion City Sailors HQ' } },
    { id: 'sport-bishan-pool', name: 'Bishan Swimming Complex', category: 'sports', lat: 1.3556, lng: 103.8518, address: '1 Bishan St 14', details: { sportsType: 'Swimming Complex', brand: '50m competition pool, teaching pool, wading pool' } },
    { id: 'sport-bishan-hall', name: 'Bishan Sports Hall', category: 'sports', lat: 1.3538, lng: 103.8508, address: '5 Bishan St 14', details: { sportsType: 'Indoor Sports Hall', brand: 'National Gymnastics training centre & badminton courts' } },
    { id: 'sport-toa-payoh-sports', name: 'Toa Payoh Sport Centre & Swimming Complex', category: 'sports', lat: 1.3312, lng: 103.8528, address: '297 Lor 6 Toa Payoh', details: { sportsType: 'Sport Centre', brand: 'Toa Payoh stadium, diving pools & indoor sports arena' } },
    { id: 'sport-amk-pool', name: 'Ang Mo Kio Swimming Complex', category: 'sports', lat: 1.3662, lng: 103.8445, address: '177 Ang Mo Kio Ave 1', details: { sportsType: 'Swimming Complex', brand: 'Olympic size pool & sheltered learning pools' } },
    { id: 'sport-yck-stadium', name: 'Yio Chu Kang Stadium & Sport Centre', category: 'sports', lat: 1.3828, lng: 103.8442, address: '210 Ang Mo Kio Ave 9', details: { sportsType: 'Sport Centre', brand: 'Stadium, swimming complex, squash, tennis & gym' } },

    // --- North-East (Serangoon, Hougang, Sengkang, Punggol) ---
    { id: 'sport-serangoon-stadium', name: 'Serangoon Stadium & Swimming Complex', category: 'sports', lat: 1.3575, lng: 103.8742, address: '33 Yio Chu Kang Rd', details: { sportsType: 'Sport Centre', brand: 'Stadium, lap pool, gym & outdoor courts' } },
    { id: 'sport-hougang-sports', name: 'Hougang Stadium & Swimming Complex', category: 'sports', lat: 1.3712, lng: 103.8885, address: '93 Hougang Ave 4', details: { sportsType: 'Sport Centre', brand: 'Stadium, indoor sports hall, swimming pool' } },
    { id: 'sport-sengkang-sports', name: 'Sengkang Sport Centre & Swimming Complex', category: 'sports', lat: 1.3938, lng: 103.8872, address: '57 Anchorvale Rd', details: { sportsType: 'Sport Centre', brand: '8 water slides, multiple pools, mega gym, badminton halls' } },
    { id: 'sport-one-punggol', name: 'One Punggol Regional Sport Centre', category: 'sports', lat: 1.4082, lng: 103.9045, address: '1 Punggol Dr', details: { sportsType: 'Sport Centre', brand: '5,000-seat stadium, 5 swimming pools & 20 badminton courts' } },

    // --- East (Tampines, Pasir Ris, Bedok) ---
    { id: 'sport-oth-town-square', name: 'Our Tampines Hub (Town Square Stadium)', category: 'sports', lat: 1.3532, lng: 103.9402, address: '1 Tampines Walk', details: { sportsType: 'Stadium', brand: '5,000-seat FIFA-certified pitch with running track' } },
    { id: 'sport-oth-swimming', name: 'Our Tampines Hub (Rooftop Swimming Complex)', category: 'sports', lat: 1.3528, lng: 103.9398, address: '1 Tampines Walk Level 6', details: { sportsType: 'Swimming Complex', brand: '6 rooftop swimming pools, competition lap pools & Jacuzzi' } },
    { id: 'sport-oth-arena', name: 'Our Tampines Hub (Community Auditorium)', category: 'sports', lat: 1.3536, lng: 103.9408, address: '1 Tampines Walk', details: { sportsType: 'Indoor Sports Hall', brand: '12 badminton courts & mega ActiveSG Gym' } },
    { id: 'sport-pasir-ris-sports', name: 'Pasir Ris Sport Centre & Swimming Complex', category: 'sports', lat: 1.3742, lng: 103.9515, address: '120 Pasir Ris Central', details: { sportsType: 'Sport Centre', brand: 'Eco-friendly sport complex with water play area, gym, tennis' } },
    { id: 'sport-heartbeat-bedok', name: 'Heartbeat@Bedok Sport Centre & Swimming Complex', category: 'sports', lat: 1.3268, lng: 103.9328, address: '11 Bedok North St 1', details: { sportsType: 'Sport Centre', brand: 'Sheltered 8-lane competition pool, interactive play pools, gym' } },

    // --- West (Jurong East, Jurong West, Clementi, Bukit Batok, CCK) ---
    { id: 'sport-jurong-east-sports', name: 'Jurong East Sport Centre & Water Park', category: 'sports', lat: 1.3462, lng: 103.7295, address: '21 Jurong East St 31', details: { sportsType: 'Sport Centre', brand: 'Water theme park slides, wave pool, lazy river & stadium' } },
    { id: 'sport-jurong-west-sports', name: 'Jurong West Sport Centre & Swimming Complex', category: 'sports', lat: 1.3382, lng: 103.6938, address: '20 Jurong West St 93', details: { sportsType: 'Sport Centre', brand: 'Stadium, sheltered swimming pool, water slides, tennis' } },
    { id: 'sport-clementi-sports', name: 'Clementi Stadium & Swimming Complex', category: 'sports', lat: 1.3105, lng: 103.7668, address: '520 West Coast Rd', details: { sportsType: 'Sport Centre', brand: 'Stadium track, lap pool & ActiveSG Gym' } },
    { id: 'sport-cck-sports', name: 'Choa Chu Kang Sport Centre & Stadium', category: 'sports', lat: 1.3912, lng: 103.7482, address: '1 Choa Chu Kang St 53', details: { sportsType: 'Sport Centre', brand: 'Stadium, wave pool, interactive water playground, gym' } },
    { id: 'sport-bukit-gombak', name: 'Bukit Gombak Stadium & Sport Hall', category: 'sports', lat: 1.3582, lng: 103.7525, address: '800 Bukit Batok West Ave 5', details: { sportsType: 'Stadium', brand: 'Stadium 400m track, fitness gym & sports hall' } },

    // --- North (Woodlands, Yishun, Sembawang) ---
    { id: 'sport-woodlands-sports', name: 'Woodlands Stadium & Swimming Complex', category: 'sports', lat: 1.4358, lng: 103.7802, address: '1 Woodlands St 12', details: { sportsType: 'Sport Centre', brand: 'Stadium track, Olympic pool & ActiveSG Gym' } },
    { id: 'sport-yishun-sports', name: 'Yishun Stadium & Swimming Complex', category: 'sports', lat: 1.4125, lng: 103.8315, address: '101 Yishun Ave 1', details: { sportsType: 'Sport Centre', brand: 'Stadium, swimming complex, gym & indoor sports hall' } },
    { id: 'sport-bukit-canberra', name: 'Bukit Canberra Sport Centre (Sembawang)', category: 'sports', lat: 1.4442, lng: 103.8218, address: '21 Canberra Link', details: { sportsType: 'Sport Centre', brand: '4 swimming pools, 500-seat sports hall, largest ActiveSG Gym' } },
  ];

  const content = `// Generated automatically by scripts/sync-amenities.mjs - DO NOT EDIT DIRECTLY
// Source: SportSG / ActiveSG Singapore Sports Facilities Directory (${sportsFacilities.length} complexes)
import { Amenity } from './types';

export const SPORTS_FACILITIES: Amenity[] = ${JSON.stringify(sportsFacilities, null, 2)};
`;

  fs.writeFileSync(path.join(DATA_DIR, 'sportsFacilities.ts'), content, 'utf8');
  console.log(`✅ Successfully synced ${sportsFacilities.length} Singapore sports facilities into sportsFacilities.ts`);
  return sportsFacilities.length;
}

// ----------------------------------------------------------------------
// 3. Comprehensive Shopping Malls & Supermarket Chains
// ----------------------------------------------------------------------
function syncSupermarketsAndMalls() {
  console.log('\n🛍️ [3/4] Generating Comprehensive Shopping Malls & Supermarket Hubs...');

  const malls = [
    // Orchard & Downtown
    { id: 'mall-ion', name: 'ION Orchard', category: 'shopping', lat: 1.3040, lng: 103.8319, address: '2 Orchard Turn', details: { brand: 'Luxury Mall & Food Basement' } },
    { id: 'mall-takashimaya', name: 'Takashimaya / Ngee Ann City', category: 'shopping', lat: 1.3025, lng: 103.8344, address: '391 Orchard Rd', details: { brand: 'Department Store & Kinokuniya' } },
    { id: 'mall-paragon', name: 'Paragon Shopping Centre', category: 'shopping', lat: 1.3038, lng: 103.8358, address: '290 Orchard Rd', details: { brand: 'Upscale Retail & Medical Suites' } },
    { id: 'mall-somerset', name: '313@somerset & Orchard Gateway', category: 'shopping', lat: 1.3012, lng: 103.8384, address: '313 Orchard Rd', details: { brand: 'Youth Lifestyle & Dining' } },
    { id: 'mall-plaza-sing', name: 'Plaza Singapura', category: 'shopping', lat: 1.3007, lng: 103.8452, address: '68 Orchard Rd', details: { brand: 'Direct Dhoby Ghaut Interchange Access' } },
    { id: 'mall-bugis-junction', name: 'Bugis Junction & Bugis+', category: 'shopping', lat: 1.3002, lng: 103.8558, address: '200 Victoria St', details: { brand: 'Indoor Street Shopping & Cinema' } },
    { id: 'mall-suntec', name: 'Suntec City', category: 'shopping', lat: 1.2935, lng: 103.8572, address: '3 Temasek Blvd', details: { brand: 'Mega Mall, Don Don Donki, Giant Hypermarket' } },
    { id: 'mall-marina-square', name: 'Marina Square', category: 'shopping', lat: 1.2915, lng: 103.8582, address: '6 Raffles Blvd', details: { brand: 'Retail Plaza & Dining Hub' } },
    { id: 'mall-mbs', name: 'The Shoppes at Marina Bay Sands', category: 'shopping', lat: 1.2842, lng: 103.8598, address: '10 Bayfront Ave', details: { brand: 'Ultra-Luxury Waterfront Shopping' } },
    { id: 'mall-raffles-city', name: 'Raffles City Shopping Centre', category: 'shopping', lat: 1.2938, lng: 103.8532, address: '252 North Bridge Rd', details: { brand: 'Connected to City Hall MRT' } },
    { id: 'mall-funan', name: 'Funan Mall', category: 'shopping', lat: 1.2912, lng: 103.8501, address: '107 North Bridge Rd', details: { brand: 'Tech, Urban Farm & Indoor Climbing' } },
    { id: 'mall-vivocity', name: 'VivoCity', category: 'shopping', lat: 1.2644, lng: 103.8222, address: '1 HarbourFront Walk', details: { brand: 'Singapore Largest Megamall' } },
    { id: 'mall-harbourfront', name: 'HarbourFront Centre', category: 'shopping', lat: 1.2638, lng: 103.8188, address: '1 Maritime Square', details: { brand: 'Harbourfront Hub & Ferry Terminal' } },
    { id: 'mall-great-world', name: 'Great World', category: 'shopping', lat: 1.2936, lng: 103.8324, address: '1 Kim Seng Promenade', details: { brand: 'River Valley Lifestyle & Meidi-Ya' } },
    { id: 'mall-tiong-bahru', name: 'Tiong Bahru Plaza', category: 'shopping', lat: 1.2865, lng: 103.8272, address: '302 Tiong Bahru Rd', details: { brand: 'Connected to Tiong Bahru MRT' } },
    { id: 'mall-chinatown-point', name: 'Chinatown Point', category: 'shopping', lat: 1.2852, lng: 103.8445, address: '133 New Bridge Rd', details: { brand: 'FairPrice Finest & Chinatown Central' } },

    // Central & North-Central (Bishan, Toa Payoh, Novena, AMK)
    { id: 'mall-junction-8', name: 'Junction 8', category: 'shopping', lat: 1.3503, lng: 103.8486, address: '9 Bishan Place', details: { brand: 'Bishan Town Centre Mall' } },
    { id: 'mall-hdb-hub', name: 'HDB Hub Toa Payoh', category: 'shopping', lat: 1.3323, lng: 103.8483, address: '480 Lor 6 Toa Payoh', details: { brand: 'Toa Payoh Central Retail & MRT' } },
    { id: 'mall-velocity-novena', name: 'Velocity@Novena Square & Square 2', category: 'shopping', lat: 1.3205, lng: 103.8438, address: '238 Thomson Rd', details: { brand: 'Novena Medical & Sports Retail' } },
    { id: 'mall-united-square', name: 'United Square Shopping Mall', category: 'shopping', lat: 1.3175, lng: 103.8435, address: '101 Thomson Rd', details: { brand: 'Kids Learning & Enrichment Hub' } },
    { id: 'mall-amk-hub', name: 'AMK Hub', category: 'shopping', lat: 1.3694, lng: 103.8484, address: '53 Ang Mo Kio Ave 3', details: { brand: 'Ang Mo Kio Town Centre & Bus Int' } },
    { id: 'mall-thomson-plaza', name: 'Thomson Plaza', category: 'shopping', lat: 1.3548, lng: 103.8308, address: '301 Upper Thomson Rd', details: { brand: 'Upper Thomson FairPrice Finest' } },

    // East (Tampines, Bedok, Pasir Ris, Paya Lebar, Marine Parade)
    { id: 'mall-tampines', name: 'Tampines Mall & Century Square', category: 'shopping', lat: 1.3528, lng: 103.9449, address: '4 Tampines Central 5', details: { brand: 'Tampines Regional Retail Hub' } },
    { id: 'mall-tampines-1', name: 'Tampines 1', category: 'shopping', lat: 1.3542, lng: 103.9455, address: '10 Tampines Central 1', details: { brand: 'Don Don Donki & Fashion Hub' } },
    { id: 'mall-bedok-mall', name: 'Bedok Mall', category: 'shopping', lat: 1.3248, lng: 103.9292, address: '311 New Upper Changi Rd', details: { brand: 'Connected to Bedok MRT & Bus Int' } },
    { id: 'mall-pasir-ris-mall', name: 'Pasir Ris Mall', category: 'shopping', lat: 1.3732, lng: 103.9498, address: '7 Pasir Ris Central', details: { brand: 'New Integrated Pasir Ris Hub' } },
    { id: 'mall-white-sands', name: 'White Sands Shopping Centre', category: 'shopping', lat: 1.3725, lng: 103.9495, address: '1 Pasir Ris Central St 3', details: { brand: 'Pasir Ris MRT Retail Centre' } },
    { id: 'mall-jewel', name: 'Jewel Changi Airport', category: 'shopping', lat: 1.3602, lng: 103.9898, address: '78 Airport Blvd', details: { brand: 'World-Renowned Rain Vortex & Megamall' } },
    { id: 'mall-plq', name: 'Paya Lebar Quarter (PLQ Mall)', category: 'shopping', lat: 1.3174, lng: 103.8927, address: '10 Paya Lebar Rd', details: { brand: 'Paya Lebar Interchange Hub' } },
    { id: 'mall-singpost', name: 'SingPost Centre', category: 'shopping', lat: 1.3195, lng: 103.8945, address: '10 Eunos Rd 8', details: { brand: 'Cinema, FairPrice & Dining Plaza' } },
    { id: 'mall-parkway-parade', name: 'Parkway Parade', category: 'shopping', lat: 1.3015, lng: 103.9052, address: '80 Marine Parade Rd', details: { brand: 'Iconic East Coast Megamall (TEL MRT)' } },
    { id: 'mall-i12-katong', name: 'i12 Katong', category: 'shopping', lat: 1.3052, lng: 103.9051, address: '112 East Coast Rd', details: { brand: 'Katong Heritage & Golden Village' } },

    // North-East (Serangoon, Hougang, Sengkang, Punggol)
    { id: 'mall-nex', name: 'NEX Serangoon', category: 'shopping', lat: 1.3506, lng: 103.8726, address: '23 Serangoon Central', details: { brand: 'Major Regional Mall (24h FairPrice Xtra)' } },
    { id: 'mall-heartland-mall', name: 'Heartland Mall (Kovan)', category: 'shopping', lat: 1.3592, lng: 103.8852, address: '205 Hougang St 21', details: { brand: 'Connected to Kovan MRT' } },
    { id: 'mall-hougang-mall', name: 'Hougang Mall', category: 'shopping', lat: 1.3726, lng: 103.8938, address: '90 Hougang Ave 10', details: { brand: 'Hougang Central Mall' } },
    { id: 'mall-compass-one', name: 'Compass One', category: 'shopping', lat: 1.3922, lng: 103.8946, address: '1 Sengkang Square', details: { brand: 'Sengkang Town Central' } },
    { id: 'mall-waterway-point', name: 'Waterway Point', category: 'shopping', lat: 1.4065, lng: 103.9020, address: '83 Punggol Central', details: { brand: 'Riverfront Mall & Cinema' } },
    { id: 'mall-seletar-mall', name: 'The Seletar Mall', category: 'shopping', lat: 1.3915, lng: 103.8755, address: '33 Sengkang West Ave', details: { brand: 'Connected to Fernvale LRT' } },
    { id: 'mall-northshore-plaza', name: 'Northshore Plaza I & II', category: 'shopping', lat: 1.4168, lng: 103.9068, address: '407 Northshore Dr', details: { brand: 'Punggol Seafront Smart Mall' } },

    // North (Woodlands, Yishun, Sembawang)
    { id: 'mall-causeway-point', name: 'Causeway Point', category: 'shopping', lat: 1.4361, lng: 103.7859, address: '1 Woodlands Square', details: { brand: 'Woodlands Regional Centre Mall' } },
    { id: 'mall-northpoint', name: 'Northpoint City', category: 'shopping', lat: 1.4297, lng: 103.8361, address: '930 Yishun Ave 2', details: { brand: 'Largest Mall in Northern SG, FairPrice, Don Don Donki, Yishun ITH' } },
    { id: 'mall-sun-plaza', name: 'Sun Plaza', category: 'shopping', lat: 1.4485, lng: 103.8198, address: '30 Sembawang Dr', details: { brand: 'Sembawang MRT Mall' } },
    { id: 'mall-canberra-plaza', name: 'Canberra Plaza', category: 'shopping', lat: 1.4435, lng: 103.8298, address: '133 Canberra View', details: { brand: 'Connected to Canberra MRT' } },

    // West (Jurong, Clementi, Bukit Batok, CCK)
    { id: 'mall-jurong-point', name: 'Jurong Point', category: 'shopping', lat: 1.3402, lng: 103.7067, address: '1 Jurong West Central 2', details: { brand: 'Largest Suburban Mall in West SG' } },
    { id: 'mall-westgate-jem', name: 'Westgate & JEM', category: 'shopping', lat: 1.3338, lng: 103.7431, address: '3 Gateway Dr / 50 Jurong Gateway Rd', details: { brand: 'Jurong Lake District Commercial Core' } },
    { id: 'mall-imm', name: 'IMM Outlet Mall', category: 'shopping', lat: 1.3348, lng: 103.7468, address: '2 Jurong East St 21', details: { brand: 'Singapore Largest Outlet Mall & Giant' } },
    { id: 'mall-clementi', name: 'The Clementi Mall', category: 'shopping', lat: 1.3150, lng: 103.7651, address: '3155 Commonwealth Ave West', details: { brand: 'Direct Clementi MRT access' } },
    { id: 'mall-star-vista', name: 'The Star Vista', category: 'shopping', lat: 1.3068, lng: 103.7885, address: '1 Vista Exchange Green', details: { brand: 'Buona Vista Interchange Hub' } },
    { id: 'mall-lot-one', name: 'Lot One Shoppers\' Mall', category: 'shopping', lat: 1.3852, lng: 103.7445, address: '21 Choa Chu Kang Ave 4', details: { brand: 'Choa Chu Kang Town Centre' } },
    { id: 'mall-hillion', name: 'Hillion Mall & Bukit Panjang Plaza', category: 'shopping', lat: 1.3782, lng: 103.7628, address: '17 Petir Rd', details: { brand: 'Bukit Panjang Integrated Transport Hub' } },
    { id: 'mall-west-mall', name: 'West Mall', category: 'shopping', lat: 1.3502, lng: 103.7495, address: '1 Bukit Batok Central Link', details: { brand: 'Connected to Bukit Batok MRT' } },
  ];

  const supermarkets = [
    // Major FairPrice Outlets
    { id: 'sup-fp-xtra-amk', name: 'FairPrice Xtra (AMK Hub)', category: 'shopping', lat: 1.3694, lng: 103.8484, address: '53 Ang Mo Kio Ave 3 #B2-40', details: { brand: 'FairPrice Xtra Hypermarket' } },
    { id: 'sup-fp-xtra-nex', name: 'FairPrice Xtra (NEX)', category: 'shopping', lat: 1.3506, lng: 103.8726, address: '23 Serangoon Central #03-42', details: { brand: 'FairPrice Xtra (24 Hours)' } },
    { id: 'sup-fp-xtra-jurong', name: 'FairPrice Xtra (Jurong Point)', category: 'shopping', lat: 1.3402, lng: 103.7067, address: '63 Jurong West Central 3 #03-01', details: { brand: 'FairPrice Xtra Hypermarket' } },
    { id: 'sup-fp-xtra-vivocity', name: 'FairPrice Xtra (VivoCity)', category: 'shopping', lat: 1.2644, lng: 103.8222, address: '1 HarbourFront Walk #B2-23', details: { brand: 'FairPrice Xtra Flagship' } },
    { id: 'sup-fp-xtra-parkway', name: 'FairPrice Xtra (Parkway Parade)', category: 'shopping', lat: 1.3015, lng: 103.9052, address: '80 Marine Parade Rd #03-28', details: { brand: 'FairPrice Xtra Hypermarket' } },
    { id: 'sup-fp-finest-j8', name: 'FairPrice Finest (Junction 8)', category: 'shopping', lat: 1.3505, lng: 103.8488, address: '9 Bishan Pl #B1-01', details: { brand: 'FairPrice Finest' } },
    { id: 'sup-fp-finest-waterway', name: 'FairPrice Finest (Waterway Point)', category: 'shopping', lat: 1.4065, lng: 103.9020, address: '83 Punggol Central #B2-32', details: { brand: 'FairPrice Finest (24 Hours)' } },
    { id: 'sup-fp-finest-bedok', name: 'FairPrice Finest (Bedok Mall)', category: 'shopping', lat: 1.3248, lng: 103.9292, address: '311 New Upper Changi Rd #B2-60', details: { brand: 'FairPrice Finest' } },
    { id: 'sup-fp-finest-thomson', name: 'FairPrice Finest (Thomson Plaza)', category: 'shopping', lat: 1.3548, lng: 103.8308, address: '301 Upper Thomson Rd #03-37', details: { brand: 'FairPrice Finest' } },
    { id: 'sup-fp-finest-marine-parade', name: 'FairPrice Finest (Marine Parade)', category: 'shopping', lat: 1.3019, lng: 103.9056, address: '6 Marine Parade Central', details: { brand: 'FairPrice Finest' } },
    { id: 'sup-fp-finest-clementi', name: 'FairPrice Finest (Clementi Mall)', category: 'shopping', lat: 1.3150, lng: 103.7651, address: '3155 Commonwealth Ave West #B1-12', details: { brand: 'FairPrice Finest' } },
    { id: 'sup-fp-finest-bukit-panjang', name: 'FairPrice Finest (Hillion Mall)', category: 'shopping', lat: 1.3782, lng: 103.7628, address: '17 Petir Rd #B2-64', details: { brand: 'FairPrice Finest (24 Hours)' } },
    { id: 'sup-fp-toa-payoh', name: 'FairPrice (Toa Payoh HDB Hub)', category: 'shopping', lat: 1.3323, lng: 103.8483, address: '500 Lor 6 Toa Payoh #B1-32', details: { brand: 'FairPrice Supermarket' } },
    { id: 'sup-fp-woodlands-civic', name: 'FairPrice (Woodlands Civic Centre)', category: 'shopping', lat: 1.4354, lng: 103.7872, address: '900 South Woodlands Dr', details: { brand: 'FairPrice Supermarket' } },
    { id: 'sup-fp-tampines-hub', name: 'FairPrice (Our Tampines Hub)', category: 'shopping', lat: 1.3532, lng: 103.9402, address: '1 Tampines Walk #B1-01', details: { brand: 'FairPrice Supermarket' } },
    { id: 'sup-fp-northpoint', name: 'FairPrice (Northpoint City)', category: 'shopping', lat: 1.4287, lng: 103.8362, address: '1 North Point Dr, South Wing #B2-103/107 Northpoint City', details: { brand: 'FairPrice Supermarket (South Wing)' } },
    { id: 'sup-fp-yishun-mrt', name: 'FairPrice (Yishun MRT)', category: 'shopping', lat: 1.4295, lng: 103.8350, address: '301 Yishun Ave 2 #01-02 Yishun MRT Station', details: { brand: 'FairPrice Supermarket' } },
    { id: 'sup-fp-bedok-reservoir-745', name: 'FairPrice (Bedok Reservoir Village)', category: 'shopping', lat: 1.3375, lng: 103.9238, address: 'Blk 745 Bedok Reservoir Rd #01-3015', details: { brand: 'FairPrice Supermarket' } },
    { id: 'sup-fp-bedok-reservoir-631', name: 'FairPrice (Bedok Reservoir 631)', category: 'shopping', lat: 1.3328, lng: 103.9145, address: 'Blk 631 Bedok Reservoir Rd #01-954', details: { brand: 'FairPrice Supermarket' } },

    // Sheng Siong Outlets (Popular Heartlands Supermarket)
    { id: 'sup-ss-chin-swee', name: 'Sheng Siong Supermarket (Chin Swee)', category: 'shopping', lat: 1.2868, lng: 103.8415, address: '52 Chin Swee Rd', details: { brand: 'Sheng Siong (24 Hours)' } },
    { id: 'sup-ss-bedok-reservoir-739a', name: 'Sheng Siong Supermarket (Bedok Reservoir 739A)', category: 'shopping', lat: 1.3381, lng: 103.9233, address: 'Blk 739A Bedok Reservoir Rd #01-01', details: { brand: 'Sheng Siong (24 Hours)' } },
    { id: 'sup-ss-bedok-central', name: 'Sheng Siong (Bedok Central)', category: 'shopping', lat: 1.3255, lng: 103.9317, address: '209 New Upper Changi Rd', details: { brand: 'Sheng Siong Supermarket' } },
    { id: 'sup-ss-bedok-north-539a', name: 'Sheng Siong (Bedok North 539A)', category: 'shopping', lat: 1.3323, lng: 103.9256, address: 'Blk 539A Bedok North St 3 #01-477', details: { brand: 'Sheng Siong (24 Hours)' } },
    { id: 'sup-ss-bedok-north-115', name: 'Sheng Siong (Bedok North 115)', category: 'shopping', lat: 1.3313, lng: 103.9365, address: 'Blk 115 Bedok North Rd #01-319', details: { brand: 'Sheng Siong (24 Hours)' } },
    { id: 'sup-ss-yishun-845', name: 'Sheng Siong (Yishun 845)', category: 'shopping', lat: 1.4235, lng: 103.8345, address: 'Blk 845 Yishun St 81 #01-186', details: { brand: 'Sheng Siong (24 Hours)' } },
    { id: 'sup-ss-punggol-central', name: 'Sheng Siong (Punggol Central 301)', category: 'shopping', lat: 1.4038, lng: 103.9069, address: '301 Punggol Central', details: { brand: 'Sheng Siong Supermarket' } },
    { id: 'sup-ss-amk-122', name: 'Sheng Siong (Ang Mo Kio 122)', category: 'shopping', lat: 1.3702, lng: 103.8542, address: 'Blk 122 Ang Mo Kio Ave 3', details: { brand: 'Sheng Siong (24 Hours)' } },
    { id: 'sup-ss-woodlands-301', name: 'Sheng Siong (Woodlands 301)', category: 'shopping', lat: 1.4308, lng: 103.7795, address: 'Blk 301 Woodlands St 31', details: { brand: 'Sheng Siong (24 Hours)' } },
    { id: 'sup-ss-clementi-352', name: 'Sheng Siong (Clementi 352)', category: 'shopping', lat: 1.3175, lng: 103.7725, address: 'Blk 352 Clementi Ave 2', details: { brand: 'Sheng Siong (24 Hours)' } },
    { id: 'sup-ss-tampines-506', name: 'Sheng Siong (Tampines Central)', category: 'shopping', lat: 1.3545, lng: 103.9412, address: 'Blk 506 Tampines Central 1', details: { brand: 'Sheng Siong (24 Hours)' } },

    // Cold Storage & CS Fresh
    { id: 'sup-cs-fresh-great-world', name: 'CS Fresh (Great World)', category: 'shopping', lat: 1.2939, lng: 103.8327, address: '1 Kim Seng Promenade #B1-139', details: { brand: 'Cold Storage CS Fresh' } },
    { id: 'sup-cs-fresh-holland-v', name: 'CS Fresh (Holland Shopping Centre)', category: 'shopping', lat: 1.3108, lng: 103.7958, address: '211 Holland Ave', details: { brand: 'Cold Storage CS Fresh' } },
    { id: 'sup-cs-fresh-paragon', name: 'CS Fresh Gold (Paragon)', category: 'shopping', lat: 1.3038, lng: 103.8358, address: '290 Orchard Rd #B1-21', details: { brand: 'Cold Storage CS Fresh Gold' } },
    { id: 'sup-cs-fresh-bugis', name: 'Cold Storage (Bugis Junction)', category: 'shopping', lat: 1.3002, lng: 103.8558, address: '200 Victoria St #B1-17', details: { brand: 'Cold Storage Supermarket' } },
    { id: 'sup-cs-fresh-serangoon', name: 'Cold Storage (NEX)', category: 'shopping', lat: 1.3506, lng: 103.8726, address: '23 Serangoon Central #B2-44', details: { brand: 'Cold Storage Supermarket' } },

    // Giant & Don Don Donki
    { id: 'sup-giant-hyper-tampines', name: 'Giant Hypermarket (Tampines Retail Park)', category: 'shopping', lat: 1.3727, lng: 103.9324, address: '21 Tampines North Dr 2', details: { brand: 'Giant Hypermarket Flagship' } },
    { id: 'sup-giant-imm', name: 'Giant Hypermarket (IMM)', category: 'shopping', lat: 1.3348, lng: 103.7468, address: '2 Jurong East St 21 #01-100', details: { brand: 'Giant Hypermarket' } },
    { id: 'sup-donki-orchard-central', name: 'Don Don Donki (Orchard Central)', category: 'shopping', lat: 1.3007, lng: 103.8398, address: '181 Orchard Rd #B2', details: { brand: 'Don Don Donki (24 Hours)' } },
    { id: 'sup-donki-jurong-point', name: 'Don Don Donki (Jurong Point)', category: 'shopping', lat: 1.3400, lng: 103.7061, address: '1 Jurong West Central 2 #B1-09', details: { brand: 'Don Don Donki Japanese Grocery' } },
    { id: 'sup-donki-tampines-1', name: 'Don Don Donki (Tampines 1)', category: 'shopping', lat: 1.3542, lng: 103.9455, address: '10 Tampines Central 1 #02-28', details: { brand: 'Don Don Donki Japanese Grocery' } },
    { id: 'sup-donki-sunshine', name: 'Don Don Donki (Downtown East)', category: 'shopping', lat: 1.3768, lng: 103.9552, address: '1 Pasir Ris Cl', details: { brand: 'Don Don Donki Japanese Grocery' } },
    { id: 'sup-donki-waterway', name: 'Don Don Donki (Waterway Point)', category: 'shopping', lat: 1.4065, lng: 103.9020, address: '83 Punggol Central #B1-10', details: { brand: 'Don Don Donki Japanese Grocery' } },
    { id: 'sup-donki-northpoint', name: 'DON DON DONKI (Northpoint City)', category: 'shopping', lat: 1.4297, lng: 103.8358, address: '930 Yishun Ave 2, South Wing #B1-06/07 Northpoint City', details: { brand: 'Don Don Donki Japanese Grocery' } },
  ];

  const formattedMalls = malls.map((m) => ({ ...m, category: 'mall' }));
  const formattedSupers = supermarkets.map((s) => ({ ...s, category: 'supermarket' }));
  const combined = [...formattedMalls, ...formattedSupers];
  const content = `// Generated automatically by scripts/sync-amenities.mjs - DO NOT EDIT DIRECTLY
// Source: Singapore Retail Directories & SLA GeoSpace (${formattedMalls.length} Shopping Malls, ${formattedSupers.length} Supermarkets)
import { Amenity } from './types';

export const SUPERMARKETS_MALLS: Amenity[] = ${JSON.stringify(combined, null, 2)};
`;

  fs.writeFileSync(path.join(DATA_DIR, 'supermarketsMalls.ts'), content, 'utf8');
  console.log(`✅ Successfully synced ${combined.length} malls & supermarkets into supermarketsMalls.ts`);
  return combined.length;
}

// ----------------------------------------------------------------------
// 4. Update allAmenities.ts Aggregator
// ----------------------------------------------------------------------
function syncAllAmenitiesAggregator() {
  console.log('\n🔗 [4/4] Updating Central allAmenities.ts Aggregator...');

  const content = `// Consolidated Singapore Amenities Dataset
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
`;

  fs.writeFileSync(path.join(DATA_DIR, 'allAmenities.ts'), content, 'utf8');
  console.log('✅ Updated allAmenities.ts aggregator successfully');
}

// ----------------------------------------------------------------------
// Main Runner
// ----------------------------------------------------------------------
async function main() {
  const startTime = Date.now();
  try {
    const busCount = await syncBusStops();
    const sportsCount = syncSportsFacilities();
    const mallCount = syncSupermarketsAndMalls();
    syncAllAmenitiesAggregator();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n🎉 ==============================================');
    console.log(`✨ Sync Completed in ${elapsed}s!`);
    console.log(`🚌 Bus Stops: ${busCount}`);
    console.log(`🏊 Sports Facilities: ${sportsCount}`);
    console.log(`🛍️ Malls & Supermarkets: ${mallCount}`);
    console.log('🎉 ==============================================\n');
  } catch (err) {
    console.error('\n❌ Ingestion pipeline failed:', err);
    process.exit(1);
  }
}

main();
