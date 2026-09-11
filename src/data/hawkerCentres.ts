import { Amenity } from './types';

export const HAWKER_CENTRES: Amenity[] = [
  // =========================================================================
  // --- 1. DOWNTOWN, CHINATOWN, MARINA BAY & CENTRAL ---
  // =========================================================================
  {
    id: 'hawk-maxwell',
    name: 'Maxwell Food Centre',
    category: 'food',
    lat: 1.2803,
    lng: 103.8447,
    address: '1 Kadayanallur St, Singapore 069184',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Tian Tian Chicken Rice, Zhen Zhen Porridge, Fuzhou Oyster Cake', stallsCount: 102 }
  },
  {
    id: 'hawk-amoy',
    name: 'Amoy Street Food Centre',
    category: 'food',
    lat: 1.2793,
    lng: 103.8466,
    address: '7 Maxwell Rd, Singapore 069111',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Michelin Bib Gourmand A Noodle Story, J2 Famous Crispy Curry Puff, Han Kee Fish Soup', stallsCount: 135 }
  },
  {
    id: 'hawk-chinatown-complex',
    name: 'Chinatown Complex Market & Food Centre',
    category: 'food',
    lat: 1.2824,
    lng: 103.8432,
    address: '335 Smith St, Singapore 050335',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Largest hawker centre in Singapore (220+ stalls), Liao Fan Hawker Chan, Lian He Ben Ji Claypot', stallsCount: 226 }
  },
  {
    id: 'hawk-tanjong-pagar-plaza',
    name: 'Tanjong Pagar Plaza Market & Food Centre',
    category: 'food',
    lat: 1.2764,
    lng: 103.8431,
    address: '6 Tanjong Pagar Plaza, Singapore 081006',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Famous Nasi Lemak, Traditional Hakka Thunder Tea Rice, Wanton Mee', stallsCount: 54 }
  },
  {
    id: 'hawk-hong-lim',
    name: 'Hong Lim Market & Food Centre',
    category: 'food',
    lat: 1.2853,
    lng: 103.8458,
    address: '531A Upper Cross St, Singapore 051531',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Outram Park Fried Kway Teow, Tai Wah Pork Noodle, Famous Sungei Road Trishaw Laksa', stallsCount: 112 }
  },
  {
    id: 'hawk-peoples-park',
    name: 'People\'s Park Food Centre',
    category: 'food',
    lat: 1.2848,
    lng: 103.8427,
    address: '32 New Market Rd, Singapore 050032',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Authentic Sichuan Mala Hotpot, Handmade Dumplings, Roast Meats', stallsCount: 88 }
  },
  {
    id: 'hawk-lau-pa-sat',
    name: 'Lau Pa Sat (Telok Ayer Market)',
    category: 'food',
    lat: 1.2806,
    lng: 103.8504,
    address: '18 Raffles Quay, Singapore 048582',
    details: { hawkerType: 'Heritage Food Market', cuisine: 'Outdoor Satay Street, Seng Kee Bak Chor Mee, Indian & Peranakan Delights', stallsCount: 84 }
  },
  {
    id: 'hawk-capitaspring',
    name: 'Market Street Hawker Centre (CapitaSpring)',
    category: 'food',
    lat: 1.2849,
    lng: 103.8502,
    address: '88 Market St Levels 2 & 3, Singapore 048948',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'CBD Golden Mile Curry Rice, Ah Heng Curry Chicken Bee Hoon, Tong Heng Coffee', stallsCount: 56 }
  },
  {
    id: 'hawk-albert-centre',
    name: 'Albert Centre Market & Food Centre',
    category: 'food',
    lat: 1.3008,
    lng: 103.8546,
    address: '270 Queen St, Singapore 180270',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Bai Nian Niang Dou Fu, Hock Lee Fishball Noodle, Traditional Herbal Mutton Soup', stallsCount: 132 }
  },
  {
    id: 'hawk-tekka',
    name: 'Tekka Centre',
    category: 'food',
    lat: 1.3063,
    lng: 103.8497,
    address: '665 Buffalo Rd, Singapore 210665',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Allauddin\'s Briyani, Prata Saga Sambal Belacan, Indian Rojak & Fresh Wet Market', stallsCount: 119 }
  },
  {
    id: 'hawk-golden-mile',
    name: 'Golden Mile Food Centre (Army Market)',
    category: 'food',
    lat: 1.3031,
    lng: 103.8639,
    address: '505 Beach Rd, Singapore 199583',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Chung Cheng Chilli Mee, 91 Fried Kway Teow, Hainanese Boneless Mutton Soup', stallsCount: 80 }
  },
  {
    id: 'hawk-berseh',
    name: 'Berseh Food Centre',
    category: 'food',
    lat: 1.3075,
    lng: 103.8568,
    address: '166 Jalan Besar, Singapore 208877',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Fu Zhou Poh Hwa Oyster Cake, Sheng Seng Fried Prawn Noodle, Turtle Soup', stallsCount: 66 }
  },
  {
    id: 'hawk-north-bridge',
    name: 'North Bridge Road Market & Food Centre',
    category: 'food',
    lat: 1.3057,
    lng: 103.8619,
    address: '861 North Bridge Rd, Singapore 198783',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'An Ji Famous Fish Head Noodles, Seng Huat Coffee Stall', stallsCount: 36 }
  },
  {
    id: 'hawk-jalan-kukoh',
    name: 'Jalan Kukoh Food Centre',
    category: 'food',
    lat: 1.2882,
    lng: 103.8399,
    address: '1 Jalan Kukoh, Singapore 161001',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Traditional Teochew Kway Chap, Handmade Fishball Noodles', stallsCount: 22 }
  },
  {
    id: 'hawk-zion-riverside',
    name: 'Zion Riverside Food Centre',
    category: 'food',
    lat: 1.2926,
    lng: 103.8340,
    address: '70 Zion Rd, Singapore 247792',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'No. 18 Zion Road Fried Kway Teow, Boon Tong Kee Chicken Rice, Big Prawn Noodle', stallsCount: 32 }
  },
  {
    id: 'hawk-pekkio',
    name: 'Pek Kio Market & Food Centre',
    category: 'food',
    lat: 1.3161,
    lng: 103.8502,
    address: '41 Cambridge Rd, Singapore 210041',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Wah Kee Big Prawn Noodle, Pin Wei Chee Cheong Fun, Sheng Seng Prawn Noodles', stallsCount: 44 }
  },
  {
    id: 'hawk-newton',
    name: 'Newton Food Centre',
    category: 'food',
    lat: 1.3125,
    lng: 103.8395,
    address: '500 Clemenceau Ave North, Singapore 229495',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'BBQ Sambal Stingray, Chili Crab, Alliance Seafood, Hup Kee Fried Oyster Omelette', stallsCount: 83 }
  },

  // =========================================================================
  // --- 2. QUEENSTOWN, BUKIT MERAH, TIONG BAHRU & PASIR PANJANG ---
  // =========================================================================
  {
    id: 'hawk-tiong-bahru',
    name: 'Tiong Bahru Market & Food Centre',
    category: 'food',
    lat: 1.2853,
    lng: 103.8322,
    address: '30 Seng Poh Rd, Singapore 168898',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Jian Bo Shui Kueh, Tiong Bahru Hainanese Boneless Chicken Rice, Lor Mee 178', stallsCount: 83 }
  },
  {
    id: 'hawk-abc-brickworks',
    name: 'ABC Brickworks Market & Food Centre',
    category: 'food',
    lat: 1.2870,
    lng: 103.8080,
    address: '6 Jalan Bukit Merah, Singapore 150006',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Ah Er Soup Herbal Soups, Fatty Cheong Roast Meats, Wow Wow West Genuine Western', stallsCount: 96 }
  },
  {
    id: 'hawk-alexandra-village',
    name: 'Alexandra Village Food Centre',
    category: 'food',
    lat: 1.2862,
    lng: 103.8043,
    address: '120 Bukit Merah Lane 1, Singapore 150120',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'King Avocado Shake, Depot Road Zhen Shan Mei Claypot Laksa, Shanghai Tiang Xin Dumplings', stallsCount: 84 }
  },
  {
    id: 'hawk-redhill-food',
    name: 'Redhill Food Centre',
    category: 'food',
    lat: 1.2875,
    lng: 103.8184,
    address: '85 Redhill Lane, Singapore 150085',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Yan Fried Chicken Wings, Hua Kee Chicken Rice, Hong Seng Curry Rice', stallsCount: 75 }
  },
  {
    id: 'hawk-redhill-market',
    name: 'Redhill Market (Blk 79)',
    category: 'food',
    lat: 1.2882,
    lng: 103.8172,
    address: '79 Redhill Lane, Singapore 150079',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Fresh produce market & heritage coffeeshop breakfast stalls', stallsCount: 40 }
  },
  {
    id: 'hawk-bukit-merah-view',
    name: 'Bukit Merah View Market & Hawker Centre',
    category: 'food',
    lat: 1.2858,
    lng: 103.8218,
    address: '115 Bukit Merah View, Singapore 151115',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Chai Chuan Tou Mutton Soup, R&D Famous Fried Carrot Cake, 783 Bak Chor Mee', stallsCount: 84 }
  },
  {
    id: 'hawk-bukit-merah-central',
    name: 'Bukit Merah Central Food Centre',
    category: 'food',
    lat: 1.2835,
    lng: 103.8168,
    address: '163 Bukit Merah Central, Singapore 150163',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Choon Seng Teochew Minced Meat Noodle, Ban Mian, Economical Mixed Rice', stallsCount: 52 }
  },
  {
    id: 'hawk-beo-crescent',
    name: 'Beo Crescent Market & Food Centre',
    category: 'food',
    lat: 1.2888,
    lng: 103.8275,
    address: '38A Beo Crescent, Singapore 169982',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Famous Crispy Hainanese Curry Rice, Nan Yuan Fishball Noodles, Cantonese Porridge', stallsCount: 36 }
  },
  {
    id: 'hawk-havelock',
    name: 'Havelock Road Cooked Food Centre',
    category: 'food',
    lat: 1.2880,
    lng: 103.8298,
    address: '22A Havelock Rd, Singapore 161022',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Tan\'s Tutu Coconut Cake, Guang Jin Wanton Noodle, Meng Kee Char Kway Teow', stallsCount: 32 }
  },
  {
    id: 'hawk-mei-ling',
    name: 'Mei Ling Market & Food Centre',
    category: 'food',
    lat: 1.2936,
    lng: 103.8031,
    address: '159 Mei Chin Rd, Singapore 140159',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Shi Hui Yuan Braised Duck Hor Fun, Xin Lu Teochew Fishball Noodle, Sin Kee Poultry Chicken Rice', stallsCount: 40 }
  },
  {
    id: 'hawk-telok-blangah-crescent',
    name: 'Telok Blangah Crescent Market & Food Centre',
    category: 'food',
    lat: 1.2778,
    lng: 103.8188,
    address: '11 Telok Blangah Cres, Singapore 090011',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Song Heng Fishball Noodle, Guan Seng Carrot Cake, Hai Kee Teochew Cha Kway Teow', stallsCount: 56 }
  },
  {
    id: 'hawk-telok-blangah-drive',
    name: 'Telok Blangah Drive Food Centre (Blk 79)',
    category: 'food',
    lat: 1.2731,
    lng: 103.8082,
    address: '79 Telok Blangah Dr, Singapore 100079',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Supper Western, Teochew Porridge, Wanton Noodle', stallsCount: 38 }
  },
  {
    id: 'hawk-telok-blangah-rise',
    name: 'Telok Blangah Rise Market & Food Centre',
    category: 'food',
    lat: 1.2725,
    lng: 103.8212,
    address: '36 Telok Blangah Rise, Singapore 090036',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Traditional Curry Rice, Lor Mee, Prawn Noodle', stallsCount: 30 }
  },
  {
    id: 'hawk-pasir-panjang',
    name: 'Pasir Panjang Food Centre',
    category: 'food',
    lat: 1.2758,
    lng: 103.7915,
    address: '121 Pasir Panjang Rd, Singapore 118543',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Yusoff Rojak, Meng Kee BBQ Seafood, Traditional Fried Hokkien Prawn Mee', stallsCount: 45 }
  },
  {
    id: 'hawk-commonwealth-cres',
    name: 'Commonwealth Crescent Market & Food Centre',
    category: 'food',
    lat: 1.3068,
    lng: 103.8002,
    address: '31 Commonwealth Cres, Singapore 149644',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Eng Kee Chicken Wings, Two Chefs Eating Place, Western Delights', stallsCount: 42 }
  },
  {
    id: 'hawk-tanglin-halt',
    name: 'Tanglin Halt Market (Blk 48A)',
    category: 'food',
    lat: 1.2995,
    lng: 103.7982,
    address: '48A Tanglin Halt Rd, Singapore 148813',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Heritage peanut pancake, Chef Hainanese Western food', stallsCount: 32 }
  },

  // =========================================================================
  // --- 3. TOA PAYOH, BALESTIER, WHAMPOA & KALLANG ---
  // =========================================================================
  {
    id: 'hawk-whampoa',
    name: 'Whampoa Makan Place (Blk 91 & 90)',
    category: 'food',
    lat: 1.3232,
    lng: 103.8540,
    address: '91 Whampoa Dr, Singapore 320091',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Balestier Road Hoover Rojak, Beach Road Fish Head Bee Hoon, Liang Zhao Steamboat', stallsCount: 120 }
  },
  {
    id: 'hawk-toa-payoh-west',
    name: 'Toa Payoh West Market & Food Centre (Blk 127)',
    category: 'food',
    lat: 1.3349,
    lng: 103.8447,
    address: '127 Lor 1 Toa Payoh, Singapore 310127',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Chey Sua Carrot Cake, Da Jie Niang Dou Fu, Traditional Lor Mee', stallsCount: 40 }
  },
  {
    id: 'hawk-toa-payoh-vista',
    name: 'Toa Payoh Vista Market (Blk 74 Lorong 4)',
    category: 'food',
    lat: 1.3355,
    lng: 103.8512,
    address: '74 Lor 4 Toa Payoh, Singapore 310074',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Ban Mian, Gen Shu Cantonese Delicacies, Traditional Nasi Lemak', stallsCount: 42 }
  },
  {
    id: 'hawk-toa-payoh-lor8',
    name: 'Toa Payoh Lorong 8 Market & Food Centre',
    category: 'food',
    lat: 1.3377,
    lng: 103.8587,
    address: '210 Lor 8 Toa Payoh, Singapore 310210',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Seow Choon Hua Restaurant Fuzhou Noodles, Dim Sum, Traditional Kway Chap', stallsCount: 68 }
  },
  {
    id: 'hawk-toa-payoh-lor7',
    name: 'Kim Keat Palm Market & Food Centre (Blk 22 Lor 7)',
    category: 'food',
    lat: 1.3352,
    lng: 103.8575,
    address: '22 Lor 7 Toa Payoh, Singapore 310022',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Old Long Xu Teochew Fishball, Ah Hwee BBQ Chicken Wing, Oyster Omelette', stallsCount: 68 }
  },
  {
    id: 'hawk-toa-payoh-lor5',
    name: 'Toa Payoh Lorong 5 Food Centre (Blk 75)',
    category: 'food',
    lat: 1.3361,
    lng: 103.8532,
    address: '75 Lor 5 Toa Payoh, Singapore 310075',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Hokkien Mee, Lor Mee, Claypot Rice', stallsCount: 38 }
  },
  {
    id: 'hawk-old-airport-road',
    name: 'Old Airport Road Food Centre',
    category: 'food',
    lat: 1.3082,
    lng: 103.8858,
    address: '51 Old Airport Rd, Singapore 390051',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Legendary SG Food Paradise: Nam Sing Hokkien Mee, Xin Mei Xiang Lor Mee, Lao Ban Soya Beancurd', stallsCount: 168 }
  },
  {
    id: 'hawk-kallang-estate',
    name: 'Kallang Estate Fresh Market & Food Centre',
    category: 'food',
    lat: 1.3073,
    lng: 103.8840,
    address: '17 Old Airport Rd, Singapore 397972',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Fried Carrot Cake, Traditional Roast Duck, Fish Soup', stallsCount: 36 }
  },
  {
    id: 'hawk-bendemeer',
    name: 'Bendemeer Market & Food Centre',
    category: 'food',
    lat: 1.3192,
    lng: 103.8630,
    address: '29 Bendemeer Rd, Singapore 330029',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Heng Kee Curry Chicken Noodle, Yong Xiang Carrot Cake, Ban Mian', stallsCount: 78 }
  },
  {
    id: 'hawk-geylang-bahru',
    name: 'Geylang Bahru Market & Food Centre',
    category: 'food',
    lat: 1.3215,
    lng: 103.8700,
    address: '69 Geylang Bahru, Singapore 330069',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Toa Payoh Fried Kway Teow, Cheok Kee Boneless Braised Duck, Hui Wei Chilli Ban Mian', stallsCount: 84 }
  },
  {
    id: 'hawk-upper-boon-keng',
    name: 'Upper Boon Keng Market & Food Centre',
    category: 'food',
    lat: 1.3148,
    lng: 103.8715,
    address: '17 Upper Boon Keng Rd, Singapore 380017',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Cheok Kee Duck Rice, Roti Prata, Traditional Mutton Soup', stallsCount: 64 }
  },
  {
    id: 'hawk-circuit-road-80',
    name: 'Circuit Road Market & Food Centre (Blk 80)',
    category: 'food',
    lat: 1.3278,
    lng: 103.8871,
    address: '80 Circuit Rd, Singapore 370080',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Vegetarian Paradise, Traditional Teochew Porridge, Oyster Omelette', stallsCount: 68 }
  },
  {
    id: 'hawk-circuit-road-79',
    name: 'Circuit Road Food Centre (Blk 79 & 79A)',
    category: 'food',
    lat: 1.3262,
    lng: 103.8855,
    address: '79 Circuit Rd, Singapore 370079',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Supper destination, BBQ Chicken Wings, Claypot Rice, Kway Chap', stallsCount: 74 }
  },
  {
    id: 'hawk-macpherson',
    name: 'MacPherson Market & Food Centre (Blk 89)',
    category: 'food',
    lat: 1.3255,
    lng: 103.8838,
    address: '89 Circuit Rd, Singapore 370089',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Traditional Bak Chor Mee, Fishball Noodles, Economical Rice', stallsCount: 36 }
  },
  {
    id: 'hawk-sims-vista',
    name: 'Sims Vista Market & Food Centre',
    category: 'food',
    lat: 1.3175,
    lng: 103.8795,
    address: '49 Sims Place, Singapore 380049',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Hao Hao Noodle House, Traditional Nasi Padang, Kueh Tu Tu', stallsCount: 68 }
  },
  {
    id: 'hawk-aljunied',
    name: 'Aljunied Market & Food Centre (Blk 117)',
    category: 'food',
    lat: 1.3208,
    lng: 103.8828,
    address: '117 Aljunied Ave 2, Singapore 380117',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Fried Hokkien Prawn Mee, Herbal Bak Kut Teh, Wanton Noodle', stallsCount: 52 }
  },

  // =========================================================================
  // --- 4. BISHAN, ANG MO KIO, SERANGOON & HOUGANG ---
  // =========================================================================
  {
    id: 'hawk-shunfu-mart',
    name: 'Shunfu Mart Food Centre (Shunfu Hawker)',
    category: 'food',
    lat: 1.3518,
    lng: 103.8378,
    address: '93 Shunfu Rd, Singapore 570093',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Chocolat N\' Spice Muffins, Lai Heng Ba Chor Mee, Leong Hainanese Chicken Rice', stallsCount: 30 }
  },
  {
    id: 'hawk-bishan-284',
    name: 'Blk 284 Bishan Hawker Coffeeshop (284 Kway Chap)',
    category: 'food',
    lat: 1.3586,
    lng: 103.8442,
    address: '284 Bishan St 22, Singapore 570284',
    details: { hawkerType: 'Food Court & Hawker Hub', cuisine: 'Legendary 284 Kway Chap, Ban Mian, Roasted Delights', stallsCount: 14 }
  },
  {
    id: 'hawk-bishan-511',
    name: 'Kim San Leng Food Centre (Bishan Blk 511)',
    category: 'food',
    lat: 1.3498,
    lng: 103.8492,
    address: '511 Bishan St 13, Singapore 570511',
    details: { hawkerType: 'Food Court & Hawker Hub', cuisine: 'Famous Ming Kee Chicken Rice, Zi Char, Roasted Delights', stallsCount: 16 }
  },
  {
    id: 'hawk-bishan-150',
    name: 'Bishan Cafeteria Food Centre (Blk 150)',
    category: 'food',
    lat: 1.3512,
    lng: 103.8522,
    address: '150 Bishan St 11, Singapore 570150',
    details: { hawkerType: 'Food Court & Hawker Hub', cuisine: 'Traditional Fish Soup, Minced Meat Noodles, Economical Bee Hoon', stallsCount: 14 }
  },
  {
    id: 'hawk-amk-724',
    name: 'Ang Mo Kio Central Market & Food Centre (Blk 724)',
    category: 'food',
    lat: 1.3720,
    lng: 103.8475,
    address: '724 Ang Mo Kio Ave 6, Singapore 560724',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Fried Hokkien Prawn Noodle, Xi Xiang Feng Yong Tau Foo, Traditional Duck Rice', stallsCount: 45 }
  },
  {
    id: 'hawk-amk-628',
    name: 'Ang Mo Kio Blk 628 Market & Food Centre',
    category: 'food',
    lat: 1.3813,
    lng: 103.8407,
    address: '628 Ang Mo Kio Ave 4, Singapore 560628',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Bedok Chwee Kueh, Fried Carrot Cake, Authentic Fish Soup', stallsCount: 60 }
  },
  {
    id: 'hawk-chong-boon',
    name: 'Chong Boon Market & Food Centre (Blk 453A AMK)',
    category: 'food',
    lat: 1.3682,
    lng: 103.8564,
    address: '453A Ang Mo Kio Ave 10, Singapore 561453',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Hong Heng Beef Noodles, Traditional Wanton Mee, Chai Pao', stallsCount: 78 }
  },
  {
    id: 'hawk-cheng-san',
    name: 'Cheng San Market & Cooked Food Centre (Blk 527 AMK)',
    category: 'food',
    lat: 1.3728,
    lng: 103.8545,
    address: '527 Ang Mo Kio Ave 10, Singapore 560527',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Traditional Hainanese Curry Rice, Fish Head Steamboat, Popiah', stallsCount: 54 }
  },
  {
    id: 'hawk-teck-ghee-square',
    name: 'Teck Ghee Square Market & Food Centre (Blk 409 AMK)',
    category: 'food',
    lat: 1.3628,
    lng: 103.8552,
    address: '409 Ang Mo Kio Ave 10, Singapore 560409',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Eng Ho Fried Hokkien Prawn Mee, Fishball Noodles, Rojak', stallsCount: 64 }
  },
  {
    id: 'hawk-teck-ghee-court',
    name: 'Teck Ghee Court Market & Food Centre (Blk 341 AMK)',
    category: 'food',
    lat: 1.3638,
    lng: 103.8485,
    address: '341 Ang Mo Kio Ave 1, Singapore 560341',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Zhen Jie Famous Desserts, Chicken Rice, Nasi Lemak', stallsCount: 48 }
  },
  {
    id: 'hawk-kebun-baru',
    name: 'Kebun Baru Market & Food Centre (Blk 226H AMK)',
    category: 'food',
    lat: 1.3782,
    lng: 103.8388,
    address: '226H Ang Mo Kio Ave 1, Singapore 568226',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Claypot Rice, Roasted Delights, Hokkien Mee', stallsCount: 42 }
  },
  {
    id: 'hawk-chomp-chomp',
    name: 'Chomp Chomp Food Centre',
    category: 'food',
    lat: 1.3643,
    lng: 103.8664,
    address: '20 Kensington Park Rd, Singapore 557269',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Supper BBQ Sambal Stingray, Fried Carrot Cake, Hokkien Mee, Sugar Cane towers', stallsCount: 36 }
  },
  {
    id: 'hawk-serangoon-gardens',
    name: 'Serangoon Garden Market & Food Centre',
    category: 'food',
    lat: 1.3630,
    lng: 103.8668,
    address: '49A Serangoon Garden Way, Singapore 555945',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Seng Kee Bak Chor Mee, Garden Bakery Traditional Cakes, Pancake Tradisi', stallsCount: 48 }
  },
  {
    id: 'hawk-kovan-209',
    name: 'Kovan 209 Market & Food Centre',
    category: 'food',
    lat: 1.3592,
    lng: 103.8858,
    address: '209 Hougang St 21, Singapore 530209',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Fa Ji Minced Meat Noodle, Kovan Fried Carrot Cake, Bedok Chwee Kueh', stallsCount: 72 }
  },
  {
    id: 'hawk-hougang-105',
    name: 'Hainanese Village Centre (Hougang 105)',
    category: 'food',
    lat: 1.3538,
    lng: 103.8905,
    address: '105 Hougang Ave 1, Singapore 530105',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Lor Mee 105, Famous Prawn Noodle, Nasi Lemak, Carrot Cake', stallsCount: 52 }
  },
  {
    id: 'hawk-ci-yuan',
    name: 'Ci Yuan Hawker Centre',
    category: 'food',
    lat: 1.3752,
    lng: 103.8824,
    address: '51 Hougang Ave 9, Singapore 538776',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Modern smart tray return, Ah Tan Wings, Lor Mee, Halal Western', stallsCount: 40 }
  },
  {
    id: 'hawk-buangkok',
    name: 'Buangkok Hawker Centre',
    category: 'food',
    lat: 1.3828,
    lng: 103.8925,
    address: '70 Compassvale Bow, Singapore 544692',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Connected to Buangkok MRT, Michelin-rated stalls, Halal certified variety', stallsCount: 38 }
  },

  // =========================================================================
  // --- 5. EAST: BEDOK, TAMPINES, PASIR RIS & MARINE PARADE ---
  // =========================================================================
  {
    id: 'hawk-bedok-interchange',
    name: 'Bedok Interchange Hawker Centre',
    category: 'food',
    lat: 1.3244,
    lng: 103.9304,
    address: '208B New Upper Changi Rd, Singapore 462208',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Song Zhou Carrot Cake, Bedok Chwee Kueh, Inspirasi Mee Rebus, Chris Prawn Noodle', stallsCount: 70 }
  },
  {
    id: 'hawk-fengshan-85',
    name: 'Fengshan Market & Food Centre (Bedok 85)',
    category: 'food',
    lat: 1.3320,
    lng: 103.9386,
    address: '85 Bedok North St 4, Singapore 460085',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Legendary late-night Bak Chor Mee soup, Xing Ji Rou Cuo Mian, Sin Bedok Chai Chee Porridge, BBQ Wings', stallsCount: 88 }
  },
  {
    id: 'hawk-bedok-216',
    name: 'Bedok North Street 1 Food Centre (Blk 216)',
    category: 'food',
    lat: 1.3262,
    lng: 103.9332,
    address: '216 Bedok North St 1, Singapore 460216',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Famous Carrot Cake, Prawn Fritters, Wanton Mee, Economic Bee Hoon', stallsCount: 82 }
  },
  {
    id: 'hawk-bedok-511',
    name: 'Kaki Bukit 511 Market & Food Centre',
    category: 'food',
    lat: 1.3332,
    lng: 103.9306,
    address: '511 Bedok North St 3, Singapore 460511',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Supper hotspot: Fried Hokkien Mee, Carrot Cake, Duck Rice, BBQ Stingray', stallsCount: 64 }
  },
  {
    id: 'hawk-bedok-58',
    name: 'Bedok South Horizon Food Centre (Blk 58)',
    category: 'food',
    lat: 1.3218,
    lng: 103.9355,
    address: '58 New Upper Changi Rd, Singapore 461058',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Famous Chee Cheong Fun, Prawn Mee, Fishball Noodle', stallsCount: 38 }
  },
  {
    id: 'hawk-bedok-16',
    name: 'Bedok South Market & Food Centre (Blk 16)',
    category: 'food',
    lat: 1.3195,
    lng: 103.9328,
    address: '16 Bedok South Rd, Singapore 460016',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Traditional Malay Cuisine, Wanton Mee, Teochew Porridge', stallsCount: 36 }
  },
  {
    id: 'hawk-marine-parade',
    name: 'Marine Parade Central Market & Food Centre',
    category: 'food',
    lat: 1.3023,
    lng: 103.9066,
    address: '84 Marine Parade Central, Singapore 440084',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Apollo Fresh Fried Kway Teow, Tip Top Curry Puff, Katong Laksa', stallsCount: 120 }
  },
  {
    id: 'hawk-marine-terrace',
    name: 'Marine Terrace Market & Food Centre (Blk 50A)',
    category: 'food',
    lat: 1.3058,
    lng: 103.9152,
    address: '50A Marine Terrace, Singapore 441050',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Bedok Chwee Kueh, Traditional Fishball Noodles, Roasted Delights', stallsCount: 32 }
  },
  {
    id: 'hawk-haig-road',
    name: 'Haig Road Market & Cooked Food Centre',
    category: 'food',
    lat: 1.3151,
    lng: 103.8960,
    address: '14 Haig Rd, Singapore 430014',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Traditional Haig Road Putu Piring, Afandi Hawa Mee Rebus, Rosy & Nora Vadai', stallsCount: 72 }
  },
  {
    id: 'hawk-geylang-serai',
    name: 'Geylang Serai Market and Food Centre',
    category: 'food',
    lat: 1.3168,
    lng: 103.8981,
    address: '1 Geylang Serai, Singapore 402001',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Authentic Malay & Indonesian Gastronomy: Hajjah Mona Nasi Padang, Sinar Pagi, Otah Otah', stallsCount: 63 }
  },
  {
    id: 'hawk-dunman',
    name: 'Dunman Food Centre',
    category: 'food',
    lat: 1.3092,
    lng: 103.9018,
    address: '271 Onan Rd, Singapore 424768',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Dunman Wanton Mee, Traditional Tau Kwa Pau, Rojak', stallsCount: 30 }
  },
  {
    id: 'hawk-tampines-round',
    name: 'Tampines Round Market & Food Centre',
    category: 'food',
    lat: 1.3458,
    lng: 103.9446,
    address: '137 Tampines St 11, Singapore 521137',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Iconic Circular Hawker: 137 Lor Mee, Xing Ji Wanton Mee, Hai Chang Fried Hokkien Mee', stallsCount: 46 }
  },
  {
    id: 'hawk-oth',
    name: 'Hawker Centre @ Our Tampines Hub',
    category: 'food',
    lat: 1.3534,
    lng: 103.9405,
    address: '1 Tampines Walk, Singapore 528523',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: '24/7 dining, 40+ stalls, modern tray return, wide halal offerings & family dining', stallsCount: 42 }
  },
  {
    id: 'hawk-pasir-ris-central',
    name: 'Pasir Ris Central Hawker Centre',
    category: 'food',
    lat: 1.3725,
    lng: 103.9530,
    address: '110 Pasir Ris Central, Singapore 519641',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Dual-concept: Ground floor traditional hawkers + Level 2 hipster fusion fare (Pork Bowls, Wagyu)', stallsCount: 42 }
  },

  // =========================================================================
  // --- 6. WEST: CLEMENTI, GHIM MOH, JURONG & BUKIT TIMAH ---
  // =========================================================================
  {
    id: 'hawk-ghim-moh',
    name: 'Ghim Moh Market and Food Centre',
    category: 'food',
    lat: 1.3113,
    lng: 103.7884,
    address: '20 Ghim Moh Rd, Singapore 270020',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Chuan Kee Boneless Braised Duck, Li Lao San Appam, Thye Moh Chan Carrot Cake', stallsCount: 72 }
  },
  {
    id: 'hawk-holland-village',
    name: 'Holland Village Market & Food Centre',
    category: 'food',
    lat: 1.3112,
    lng: 103.7954,
    address: '1 Lor Mambong, Singapore 277700',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Traditional Lor Mee, Western Food, Nasi Lemak, Chicken Rice', stallsCount: 44 }
  },
  {
    id: 'hawk-holland-drive',
    name: 'Holland Drive Market & Food Centre (Blk 44)',
    category: 'food',
    lat: 1.3081,
    lng: 103.7928,
    address: '44 Holland Dr, Singapore 270044',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Ru Ji Kitchen Fishball Noodles, Traditional Claypot Rice, Wanton Mee', stallsCount: 48 }
  },
  {
    id: 'hawk-empress-road',
    name: 'Empress Road Market & Food Centre (Blk 7)',
    category: 'food',
    lat: 1.3162,
    lng: 103.8056,
    address: '7 Empress Rd, Singapore 260007',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Farrer Road famous Roast Duck, Ah Wing Wanton Noodle, Curry Puffs', stallsCount: 32 }
  },
  {
    id: 'hawk-clementi-448',
    name: 'Clementi 448 Market & Food Centre',
    category: 'food',
    lat: 1.3134,
    lng: 103.7646,
    address: '448 Clementi Ave 3, Singapore 120448',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Fried Carrot Cake, Boon Kee Wanton Mee, Song Fish Soup, Whampoa Soya Bean', stallsCount: 52 }
  },
  {
    id: 'hawk-clementi-353',
    name: 'Clementi Ave 2 Market & Cooked Food Centre',
    category: 'food',
    lat: 1.3144,
    lng: 103.7708,
    address: '353 Clementi Ave 2, Singapore 120353',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Authentic Teochew Fish Soup, Fried Kway Teow, Claypot Chicken Rice', stallsCount: 48 }
  },
  {
    id: 'hawk-ayer-rajah',
    name: 'Ayer Rajah Food Centre',
    category: 'food',
    lat: 1.3085,
    lng: 103.7595,
    address: '503 West Coast Dr, Singapore 120503',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Mee Goreng & Mamak Indian Rojak hotspot, Habib\'s Rojak, Silver Coin Carrot Cake', stallsCount: 80 }
  },
  {
    id: 'hawk-west-coast',
    name: 'West Coast Market Square (Blk 726)',
    category: 'food',
    lat: 1.3035,
    lng: 103.7658,
    address: '726 West Coast Rd, Singapore 120726',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Ah Hua Teochew Fishball Noodle, Fried Carrot Cake, Duck Rice', stallsCount: 68 }
  },
  {
    id: 'hawk-yuhua-village',
    name: 'Yuhua Village Market and Food Centre (Blk 254 Jurong)',
    category: 'food',
    lat: 1.3435,
    lng: 103.7397,
    address: '254 Jurong East St 24, Singapore 600254',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Famous Carrot Cake, Jing Jing Fish Head Bee Hoon, Fei Fei Roasted Noodle', stallsCount: 56 }
  },
  {
    id: 'hawk-yuhua-market-347',
    name: 'Yuhua Market & Hawker Centre (Blk 347 Jurong)',
    category: 'food',
    lat: 1.3495,
    lng: 103.7312,
    address: '347 Jurong East Ave 1, Singapore 600347',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Lai Heng Handmade Teochew Kueh, Fried Kway Teow, Bak Chor Mee', stallsCount: 58 }
  },
  {
    id: 'hawk-taman-jurong',
    name: 'Taman Jurong Market & Food Centre',
    category: 'food',
    lat: 1.3348,
    lng: 103.7215,
    address: '3 Yung Sheng Rd, Singapore 618499',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: '5-storey mega market: Tien Lai Tien Scented Roast Duck, Feng Zhen Lor Mee, Tom\'s Palette', stallsCount: 122 }
  },
  {
    id: 'hawk-jurong-west-505',
    name: 'Jurong West 505 Market & Food Centre',
    category: 'food',
    lat: 1.3496,
    lng: 103.7180,
    address: '505 Jurong West St 52, Singapore 640505',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Traditional Minced Pork Noodle, Braised Duck Rice, Ban Mian, Popiah', stallsCount: 72 }
  },
  {
    id: 'hawk-boon-lay-place',
    name: 'Boon Lay Place Food Village',
    category: 'food',
    lat: 1.3456,
    lng: 103.7126,
    address: '221B Boon Lay Pl, Singapore 642221',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Famous Boon Lay Power Nasi Lemak, Xin Sheng Gor Hiong Prawn Cracker, Roti Prata', stallsCount: 110 }
  },
  {
    id: 'hawk-bukit-timah',
    name: 'Bukit Timah Market & Food Centre',
    category: 'food',
    lat: 1.3396,
    lng: 103.7760,
    address: '51 Upper Bukit Timah Rd, Singapore 588215',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'He Zhong White Carrot Cake, Sin Chew Satay Bee Hoon, Xie Kee Hokkien Mee', stallsCount: 84 }
  },
  {
    id: 'hawk-adam-road',
    name: 'Adam Food Centre',
    category: 'food',
    lat: 1.3241,
    lng: 103.8142,
    address: '2 Adam Rd, Singapore 289876',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Selera Rasa Nasi Lemak, No. 1 Adam\'s Nasi Lemak, Bahrakath Mutton Soup', stallsCount: 32 }
  },

  // =========================================================================
  // --- 7. NORTH & NORTH-WEST: WOODLANDS, YISHUN, SEMBAWANG & BUKIT PANJANG ---
  // =========================================================================
  {
    id: 'hawk-chong-pang',
    name: 'Chong Pang Market & Food Centre',
    category: 'food',
    lat: 1.4312,
    lng: 103.8284,
    address: '105 Yishun Ring Rd, Singapore 760105',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Chong Pang Nasi Lemak, Famous Boneless Braised Duck, Lu Zhou Ji Chicken Rice', stallsCount: 56 }
  },
  {
    id: 'hawk-yishun-park',
    name: 'Yishun Park Hawker Centre',
    category: 'food',
    lat: 1.4246,
    lng: 103.8450,
    address: '51 Yishun Ave 11, Singapore 768867',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Tuck Kee Ipoh Sah Hor Fun, Smokin\' Joe Western, Hakka Tofu Bowls', stallsCount: 45 }
  },
  {
    id: 'hawk-bukit-canberra',
    name: 'Bukit Canberra Hawker Centre',
    category: 'food',
    lat: 1.4533,
    lng: 103.8214,
    address: '21 Canberra Link, Singapore 756973',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: '800-seat nature-integrated food centre, healthy eating options, local delights', stallsCount: 44 }
  },
  {
    id: 'hawk-marsiling-mall',
    name: 'Marsiling Mall Hawker Centre',
    category: 'food',
    lat: 1.4344,
    lng: 103.7773,
    address: '4 Woodlands St 12, Singapore 738623',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Yan Ji Gourmet Seafood Soup, Ah Chuan Oyster Omelette, Wanton Noodles', stallsCount: 70 }
  },
  {
    id: 'hawk-marsiling-lane',
    name: 'Marsiling Lane Market & Cooked Food Centre (Blk 20)',
    category: 'food',
    lat: 1.4435,
    lng: 103.7782,
    address: '20 Marsiling Lane, Singapore 730020',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Traditional Malay Cuisine, Fish Head Curry, Ban Mian', stallsCount: 42 }
  },
  {
    id: 'hawk-senja',
    name: 'Senja Hawker Centre',
    category: 'food',
    lat: 1.3838,
    lng: 103.7621,
    address: '2 Senja Cl, Singapore 677632',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Hengji Chicken Rice, Munchi Pancakes, Onigirazu, Halal certified variety', stallsCount: 28 }
  },
  {
    id: 'hawk-bukit-panjang',
    name: 'Bukit Panjang Hawker Centre & Market',
    category: 'food',
    lat: 1.3776,
    lng: 103.7725,
    address: '2 Bukit Panjang Ring Rd, Singapore 679947',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Zhen San Mei Claypot Laksa, Lor Mee, Halal Western', stallsCount: 28 }
  },

  // =========================================================================
  // --- 8. PUNGGOL & SENGKANG ---
  // =========================================================================
  {
    id: 'hawk-one-punggol',
    name: 'One Punggol Hawker Centre',
    category: 'food',
    lat: 1.4069,
    lng: 103.9022,
    address: '1 Punggol Dr, Singapore 828629',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Eng Kee Chicken Wings, Michelin guide stalls, Fei Zhuang Braised Duck', stallsCount: 34 }
  },
  {
    id: 'hawk-fernvale',
    name: 'Fernvale Hawker Centre & CC',
    category: 'food',
    lat: 1.3918,
    lng: 103.8765,
    address: '21 Sengkang West Ave, Singapore 797650',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Whampoa Keng Fish Head, Japanese Rice Bowls, Traditional Prata', stallsCount: 28 }
  },
  {
    id: 'hawk-anchorvale-village',
    name: 'Anchorvale Village Hawker Centre',
    category: 'food',
    lat: 1.3972,
    lng: 103.8862,
    address: '339 Anchorvale Rd, Singapore 540339',
    details: { hawkerType: 'NEA Hawker Centre', cuisine: 'Newly opened riverside hawker centre, artisanal coffee, traditional breakfast', stallsCount: 36 }
  }
];
