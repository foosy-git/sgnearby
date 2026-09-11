import { Amenity } from './types';

export const HEALTHCARE_FACILITIES: Amenity[] = [
  // --- Major Hospitals ---
  { id: 'health-sgh', name: 'Singapore General Hospital (SGH)', category: 'healthcare', lat: 1.2798, lng: 103.8347, address: 'Outram Rd', details: { hospitalType: 'Hospital' } },
  { id: 'health-ttsh', name: 'Tan Tock Seng Hospital (TTSH)', category: 'healthcare', lat: 1.3214, lng: 103.8458, address: '11 Jalan Tan Tock Seng', details: { hospitalType: 'Hospital' } },
  { id: 'health-nuh', name: 'National University Hospital (NUH)', category: 'healthcare', lat: 1.2938, lng: 103.7831, address: '5 Lower Kent Ridge Rd', details: { hospitalType: 'Hospital' } },
  { id: 'health-cgh', name: 'Changi General Hospital (CGH)', category: 'healthcare', lat: 1.3404, lng: 103.9618, address: '2 Simei St 3', details: { hospitalType: 'Hospital' } },
  { id: 'health-ktph', name: 'Khoo Teck Puat Hospital (KTPH)', category: 'healthcare', lat: 1.4246, lng: 103.8382, address: '90 Yishun Central', details: { hospitalType: 'Hospital' } },
  { id: 'health-skh', name: 'Sengkang General Hospital (SKH)', category: 'healthcare', lat: 1.3952, lng: 103.8931, address: '110 Sengkang East Way', details: { hospitalType: 'Hospital' } },
  { id: 'health-ntfgh', name: 'Ng Teng Fong General Hospital', category: 'healthcare', lat: 1.3337, lng: 103.7454, address: '1 Jurong East St 21', details: { hospitalType: 'Hospital' } },
  { id: 'health-whc', name: 'Woodlands Health Campus', category: 'healthcare', lat: 1.4262, lng: 103.7915, address: '2 Woodlands Drive 17', details: { hospitalType: 'Hospital' } },

  // --- Polyclinics across Singapore ---
  { id: 'poly-outram', name: 'Outram Polyclinic', category: 'healthcare', lat: 1.2801, lng: 103.8385, address: '3 Second Hospital Ave', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-queenstown', name: 'Queenstown Polyclinic', category: 'healthcare', lat: 1.2996, lng: 103.8016, address: '580 Stirling Rd', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-bukit-merah', name: 'Bukit Merah Polyclinic', category: 'healthcare', lat: 1.2828, lng: 103.8166, address: '162 Bukit Merah Central', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-toa-payoh', name: 'Toa Payoh Polyclinic', category: 'healthcare', lat: 1.3340, lng: 103.8505, address: '2003 Lor 8 Toa Payoh', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-ang-mo-kio', name: 'Ang Mo Kio Polyclinic', category: 'healthcare', lat: 1.3694, lng: 103.8437, address: '21 Ang Mo Kio Central 2', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-bedok', name: 'Bedok Polyclinic (Heartbeat@Bedok)', category: 'healthcare', lat: 1.3271, lng: 103.9324, address: '11 Bedok North St 1', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-tampines', name: 'Tampines Polyclinic (Our Tampines Hub)', category: 'healthcare', lat: 1.3532, lng: 103.9407, address: '1 Tampines Walk', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-marine-parade', name: 'Marine Parade Polyclinic', category: 'healthcare', lat: 1.3021, lng: 103.9079, address: '80 Marine Parade Central', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-pasir-ris', name: 'Pasir Ris Polyclinic', category: 'healthcare', lat: 1.3727, lng: 103.9498, address: '1 Pasir Ris Dr 4', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-clementi', name: 'Clementi Polyclinic', category: 'healthcare', lat: 1.3149, lng: 103.7667, address: '451 Clementi Ave 3', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-jurong', name: 'Jurong Polyclinic', category: 'healthcare', lat: 1.3496, lng: 103.7383, address: '190 Jurong East Ave 1', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-bukit-batok', name: 'Bukit Batok Polyclinic', category: 'healthcare', lat: 1.3512, lng: 103.7486, address: '50 Bukit Batok West Ave 3', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-woodlands', name: 'Woodlands Polyclinic', category: 'healthcare', lat: 1.4428, lng: 103.7912, address: '10 Woodlands St 31', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-yishun', name: 'Yishun Polyclinic', category: 'healthcare', lat: 1.4299, lng: 103.8427, address: '30 Yishun Central 1', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-sengkang', name: 'Sengkang Community Hospital & Polyclinic', category: 'healthcare', lat: 1.3948, lng: 103.8926, address: '110 Sengkang East Way', details: { hospitalType: 'Polyclinic' } },
  { id: 'poly-punggol', name: 'Punggol Polyclinic (Oasis Terraces)', category: 'healthcare', lat: 1.4053, lng: 103.9125, address: '681 Punggol Dr', details: { hospitalType: 'Polyclinic' } },
];

export const PARKS_AND_NATURE: Amenity[] = [
  // --- Central & Downtown ---
  { id: 'park-botanic-gardens', name: 'Singapore Botanic Gardens (UNESCO)', category: 'park', lat: 1.3138, lng: 103.8159, details: { parkType: 'Nature Reserve' } },
  { id: 'park-gardens-by-the-bay', name: 'Gardens by the Bay & Bay South', category: 'park', lat: 1.2816, lng: 103.8636, details: { parkType: 'Regional Park' } },
  { id: 'park-fort-canning', name: 'Fort Canning Park & Spice Garden', category: 'park', lat: 1.2949, lng: 103.8465, details: { parkType: 'Regional Park' } },
  { id: 'park-pearls-hill', name: 'Pearl\'s Hill City Park (Chinatown)', category: 'park', lat: 1.2858, lng: 103.8402, details: { parkType: 'Neighborhood Park' } },
  { id: 'park-duxton-plain', name: 'Duxton Plain Park', category: 'park', lat: 1.2788, lng: 103.8418, details: { parkType: 'Neighborhood Park' } },
  { id: 'park-marina-promenade', name: 'Marina Promenade & Bay East Garden', category: 'park', lat: 1.2925, lng: 103.8632, details: { parkType: 'Regional Park' } },

  // --- Bishan & Marymount ---
  { id: 'park-bishan-amk', name: 'Bishan-Ang Mo Kio Park (River Plains & Pond Gardens)', category: 'park', lat: 1.3625, lng: 103.8450, details: { parkType: 'Regional Park' } },
  { id: 'park-bishan-harmony', name: 'Bishan Harmony Park (Skate Park & Fitness)', category: 'park', lat: 1.3453, lng: 103.8473, details: { parkType: 'Neighborhood Park' } },
  { id: 'park-bishan-active', name: 'Bishan Active Park (Bishan St 23)', category: 'park', lat: 1.3565, lng: 103.8470, details: { parkType: 'Neighborhood Park' } },
  { id: 'park-clover-way', name: 'Clover Way Playground & Park', category: 'park', lat: 1.3499, lng: 103.8461, details: { parkType: 'Neighborhood Park' } },
  { id: 'park-macritchie', name: 'MacRitchie Reservoir & TreeTop Walk', category: 'park', lat: 1.3444, lng: 103.8345, details: { parkType: 'Nature Reserve' } },

  // --- Toa Payoh & Novena ---
  { id: 'park-toa-payoh-town', name: 'Toa Payoh Town Park (Willow Lake & Pagoda)', category: 'park', lat: 1.3312, lng: 103.8498, details: { parkType: 'Regional Park' } },
  { id: 'park-toa-payoh-sensory', name: 'Toa Payoh Sensory Park (Lorong 5)', category: 'park', lat: 1.3365, lng: 103.8542, details: { parkType: 'Neighborhood Park' } },
  { id: 'park-lor-1-park', name: 'Toa Payoh Lorong 1 Neighborhood Park', category: 'park', lat: 1.3392, lng: 103.8482, details: { parkType: 'Neighborhood Park' } },

  // --- Ang Mo Kio & Serangoon ---
  { id: 'park-amk-town-east', name: 'Ang Mo Kio Town Garden East', category: 'park', lat: 1.3711, lng: 103.8508, details: { parkType: 'Regional Park' } },
  { id: 'park-amk-town-west', name: 'Ang Mo Kio Town Garden West', category: 'park', lat: 1.3745, lng: 103.8427, details: { parkType: 'Regional Park' } },
  { id: 'park-serangoon-comm', name: 'Serangoon Community Park', category: 'park', lat: 1.3566, lng: 103.8721, details: { parkType: 'Neighborhood Park' } },
  { id: 'park-tavistock', name: 'Tavistock Park & Serangoon Garden Green', category: 'park', lat: 1.3648, lng: 103.8645, details: { parkType: 'Neighborhood Park' } },

  // --- Tampines & Pasir Ris ---
  { id: 'park-sun-plaza-tamp', name: 'Sun Plaza Park (Tampines)', category: 'park', lat: 1.3582, lng: 103.9452, details: { parkType: 'Regional Park' } },
  { id: 'park-tampines-eco', name: 'Tampines Eco Green', category: 'park', lat: 1.3637, lng: 103.9482, details: { parkType: 'Nature Reserve' } },
  { id: 'park-tampines-central-p', name: 'Tampines Central Park', category: 'park', lat: 1.3537, lng: 103.9370, details: { parkType: 'Neighborhood Park' } },
  { id: 'park-pasir-ris', name: 'Pasir Ris Park & Mangrove Boardwalk', category: 'park', lat: 1.3789, lng: 103.9515, details: { parkType: 'Regional Park' } },
  { id: 'park-pasir-ris-town', name: 'Pasir Ris Town Park (Fishing Pond)', category: 'park', lat: 1.3722, lng: 103.9523, details: { parkType: 'Regional Park' } },

  // --- Bedok & Marine Parade ---
  { id: 'park-bedok-town', name: 'Bedok Town Park (Bedok North Ave 3)', category: 'park', lat: 1.3347, lng: 103.9229, details: { parkType: 'Regional Park' } },
  { id: 'park-bedok-reservoir', name: 'Bedok Reservoir Park & Waterfront Promenade', category: 'park', lat: 1.3418, lng: 103.9312, details: { parkType: 'Regional Park' } },
  { id: 'park-east-coast-park', name: 'East Coast Park (Coastal Parkway)', category: 'park', lat: 1.3012, lng: 103.9123, details: { parkType: 'Regional Park' } },
  { id: 'park-katong-park', name: 'Katong Park (Meyer Rd)', category: 'park', lat: 1.2978, lng: 103.8865, details: { parkType: 'Neighborhood Park' } },

  // --- Jurong East, Jurong West & Clementi ---
  { id: 'park-jurong-lake', name: 'Jurong Lake Gardens & Chinese Garden', category: 'park', lat: 1.3364, lng: 103.7291, details: { parkType: 'Regional Park' } },
  { id: 'park-jurong-central', name: 'Jurong Central Park', category: 'park', lat: 1.3379, lng: 103.7077, details: { parkType: 'Regional Park' } },
  { id: 'park-pandan-reservoir', name: 'Pandan Reservoir Fitness Park', category: 'park', lat: 1.3168, lng: 103.7485, details: { parkType: 'Neighborhood Park' } },
  { id: 'park-clementi-woods', name: 'Clementi Woods Park', category: 'park', lat: 1.2987, lng: 103.7675, details: { parkType: 'Regional Park' } },
  { id: 'park-west-coast', name: 'West Coast Park & Adventure Playground', category: 'park', lat: 1.2942, lng: 103.7667, details: { parkType: 'Regional Park' } },

  // --- Queenstown, Bukit Merah & Southern Ridges ---
  { id: 'park-southern-ridges', name: 'Southern Ridges (Henderson Waves & Mount Faber)', category: 'park', lat: 1.2821, lng: 103.8173, details: { parkType: 'Regional Park' } },
  { id: 'park-hort-park', name: 'HortPark (The Gardening Hub)', category: 'park', lat: 1.2791, lng: 103.7991, details: { parkType: 'Regional Park' } },
  { id: 'park-kent-ridge', name: 'Kent Ridge Park & Canopy Walk', category: 'park', lat: 1.2858, lng: 103.7915, details: { parkType: 'Nature Reserve' } },
  { id: 'park-labrador-reserve', name: 'Labrador Nature Reserve', category: 'park', lat: 1.2662, lng: 103.8027, details: { parkType: 'Nature Reserve' } },
  { id: 'park-tiong-bahru-p', name: 'Tiong Bahru Park (Train Playground)', category: 'park', lat: 1.2875, lng: 103.8245, details: { parkType: 'Neighborhood Park' } },
  { id: 'park-alexandra-canal', name: 'Alexandra Canal Linear Park', category: 'park', lat: 1.2939, lng: 103.8141, details: { parkType: 'PCN' } },

  // --- Punggol, Sengkang & Hougang ---
  { id: 'park-punggol-waterway', name: 'Punggol Waterway Park', category: 'park', lat: 1.4089, lng: 103.9067, details: { parkType: 'Regional Park' } },
  { id: 'park-coney-island', name: 'Coney Island Park', category: 'park', lat: 1.4116, lng: 103.9214, details: { parkType: 'Nature Reserve' } },
  { id: 'park-sengkang-riverside', name: 'Sengkang Riverside Park & Floating Wetland', category: 'park', lat: 1.3968, lng: 103.8862, details: { parkType: 'Regional Park' } },
  { id: 'park-sengkang-sculpture', name: 'Sengkang Sculpture Park', category: 'park', lat: 1.3966, lng: 103.8977, details: { parkType: 'Neighborhood Park' } },
  { id: 'park-hougang-neigh', name: 'Hougang Neighborhood Park (Ave 8)', category: 'park', lat: 1.3745, lng: 103.8872, details: { parkType: 'Neighborhood Park' } },

  // --- Woodlands, Yishun & Sembawang ---
  { id: 'park-woodlands-town-east', name: 'Woodlands Town Park East', category: 'park', lat: 1.4370, lng: 103.7795, address: 'Woodlands St 13 / Ave 2', details: { parkType: 'Regional Park', brand: 'Scenic Hilltop Tower, Forest Trails & Fitness Corners' } },
  { id: 'park-marsiling-park', name: 'Marsiling Park (Woodlands Town Garden)', category: 'park', lat: 1.4373, lng: 103.7700, address: 'Woodlands Centre Rd', details: { parkType: 'Regional Park', brand: 'Lakeside Boardwalk, Mangroves & Chinese Pavilions' } },
  { id: 'park-woodlands-waterfront', name: 'Woodlands Waterfront Park & Jetty', category: 'park', lat: 1.4531, lng: 103.7805, address: '6A Admiralty Rd W', details: { parkType: 'Regional Park', brand: 'Coastal Promenade & 400m Jetty' } },
  { id: 'park-admiralty', name: 'Admiralty Park (Woodlands Playground)', category: 'park', lat: 1.4464, lng: 103.7806, address: '31 Woodlands Ave 9', details: { parkType: 'Regional Park', brand: 'Singapore Largest Nature Area & 26 Slides Playground' } },
  { id: 'park-mandai-tekong', name: 'Mandai Tekong Park', category: 'park', lat: 1.4353, lng: 103.7934, address: 'Woodlands Ave 5 (near Blk 895C)', details: { parkType: 'Neighborhood Park', brand: 'Kampong-Themed Adventure Playground & Courts' } },
  { id: 'park-fushan-garden', name: 'Fu Shan Garden (Dinosaur Park)', category: 'park', lat: 1.4376, lng: 103.7876, address: '81 Woodlands St 81', details: { parkType: 'Neighborhood Park', brand: 'Famous Prehistoric Dinosaur Sculptures & Play Zone' } },
  { id: 'park-greenwood-sanctuary', name: 'Greenwood Sanctuary Park', category: 'park', lat: 1.4404, lng: 103.7858, address: 'Woodlands Dr 62 / Ave 9', details: { parkType: 'Neighborhood Park', brand: 'Scenic Lake, Pavilion & Green Corridors' } },
  { id: 'park-circle-green', name: 'Circle Green Park', category: 'park', lat: 1.4433, lng: 103.7976, address: 'Woodlands Circle (Blk 733/738)', details: { parkType: 'Neighborhood Park' } },
  { id: 'park-woodlands-crescent', name: 'Woodlands Crescent Park', category: 'park', lat: 1.4450, lng: 103.8041, address: 'Woodlands Crescent (Blk 775)', details: { parkType: 'Neighborhood Park' } },
  { id: 'park-vista-park', name: 'Vista Park', category: 'park', lat: 1.4298, lng: 103.7957, address: 'Woodlands Dr 53 / Dr 44', details: { parkType: 'Neighborhood Park' } },
  { id: 'park-yishun-park', name: 'Yishun Park (SAFRA Yishun)', category: 'park', lat: 1.4248, lng: 103.8428, address: 'Yishun Central / SAFRA', details: { parkType: 'Regional Park' } },
  { id: 'park-yishun-pond', name: 'Yishun Pond Park (Khoo Teck Puat)', category: 'park', lat: 1.4267, lng: 103.8397, address: 'Yishun Central (opp KTPH)', details: { parkType: 'Neighborhood Park' } },
  { id: 'park-yishun-neigh', name: 'Yishun Neighborhood Park', category: 'park', lat: 1.4377, lng: 103.8352, address: 'Yishun Ave 2 & Ave 7', details: { parkType: 'Neighborhood Park' } },
  { id: 'park-lower-seletar', name: 'Lower Seletar Reservoir Park & Water Play', category: 'park', lat: 1.4096, lng: 103.8312, address: 'Yishun Ave 1', details: { parkType: 'Regional Park' } },
  { id: 'park-sembawang-park', name: 'Sembawang Park & Battleship Playground', category: 'park', lat: 1.4614, lng: 103.8361, address: 'Sembawang Rd (Seafront)', details: { parkType: 'Regional Park' } },
  { id: 'park-canberra-park', name: 'Canberra Park', category: 'park', lat: 1.4435, lng: 103.8179, address: 'Canberra Link / Sembawang Cres', details: { parkType: 'Neighborhood Park', brand: 'Inclusive Playground & Swing Sets' } },
  { id: 'park-montreal-green', name: 'Montreal Green', category: 'park', lat: 1.4491, lng: 103.8260, address: 'Montreal Drive', details: { parkType: 'Neighborhood Park' } },

  // --- Bukit Batok, Bukit Panjang & CCK ---
  { id: 'park-bukit-timah-reserve', name: 'Bukit Timah Nature Reserve & Summit', category: 'park', lat: 1.3547, lng: 103.7764, details: { parkType: 'Nature Reserve' } },
  { id: 'park-dairy-farm-nature', name: 'Dairy Farm Nature Park & Singapore Quarry', category: 'park', lat: 1.3627, lng: 103.7741, details: { parkType: 'Nature Reserve' } },
  { id: 'park-chestnut-nature', name: 'Chestnut Nature Park', category: 'park', lat: 1.3769, lng: 103.7794, details: { parkType: 'Nature Reserve' } },
  { id: 'park-bukit-batok-nature', name: 'Bukit Batok Nature Park (Quarry Pool)', category: 'park', lat: 1.3501, lng: 103.7642, details: { parkType: 'Nature Reserve' } },
  { id: 'park-little-guilin', name: 'Bukit Batok Town Park (Little Guilin)', category: 'park', lat: 1.3576, lng: 103.7557, details: { parkType: 'Regional Park' } },
  { id: 'park-cck-park', name: 'Choa Chu Kang Park', category: 'park', lat: 1.3870, lng: 103.7473, details: { parkType: 'Regional Park' } },
  { id: 'park-limbang-park', name: 'Limbang Park', category: 'park', lat: 1.3906, lng: 103.7446, address: 'Choa Chu Kang St 51', details: { parkType: 'Neighborhood Park' } },
  { id: 'park-yew-tee-park', name: 'Yew Tee Park', category: 'park', lat: 1.3974, lng: 103.7437, address: 'Choa Chu Kang St 62', details: { parkType: 'Neighborhood Park' } },
  { id: 'park-zhengghua', name: 'Zhenghua Nature Park (Bukit Panjang)', category: 'park', lat: 1.3830, lng: 103.7750, details: { parkType: 'Regional Park' } },

  // --- Queenstown, Mount Faber & South ---
  { id: 'park-telok-blangah-hill', name: 'Telok Blangah Hill Park & Forest Walk', category: 'park', lat: 1.2785, lng: 103.8115, details: { parkType: 'Regional Park' } },
  { id: 'park-mount-faber', name: 'Mount Faber Park & Peak', category: 'park', lat: 1.2735, lng: 103.8185, details: { parkType: 'Regional Park' } },

  // --- East & North-East ---
  { id: 'park-punggol-park', name: 'Punggol Park (Hougang)', category: 'park', lat: 1.3771, lng: 103.8985, address: 'Hougang Ave 8 & 10', details: { parkType: 'Regional Park' } },
  { id: 'park-compassvale-ancilla', name: 'Compassvale Ancilla Park', category: 'park', lat: 1.3848, lng: 103.8927, address: 'Compassvale Bow', details: { parkType: 'Neighborhood Park' } },
  { id: 'park-tampines-north', name: 'Tampines North Park', category: 'park', lat: 1.3568, lng: 103.9527, address: 'Tampines Ave 7 / Ave 9', details: { parkType: 'Neighborhood Park' } },
  { id: 'park-siglap-linear', name: 'Siglap Linear Park', category: 'park', lat: 1.3174, lng: 103.9260, details: { parkType: 'PCN' } },
];
