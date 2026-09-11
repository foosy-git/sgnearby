import { Amenity } from './types';

export const NEIGHBORHOOD_PLACES: Amenity[] = [
  // --- Popular Cafes & Fast Food (Bishan Area) ---
  { id: 'poi-mc-bishan-park', name: 'McDonald\'s (Bishan-Ang Mo Kio Park)', category: 'food', lat: 1.3618, lng: 103.8472, details: { cuisine: '⭐ 4.3 (2,400+ Google reviews) • Open 24h' } },
  { id: 'poi-torasho-ramen', name: 'Canopy Dining (Bishan Park)', category: 'food', lat: 1.3626, lng: 103.8468, details: { cuisine: '⭐ 4.2 (1,800+ Google reviews) • Pet-friendly Cafe & Brunch' } },
  { id: 'poi-grub-bishan', name: 'Aroma Gourmet Gelato & Cafe', category: 'food', lat: 1.3588, lng: 103.8446, address: 'Blk 284 Bishan St 22', details: { cuisine: '⭐ 4.7 (320+ Google reviews) • Artisanal Gelato' } },
  { id: 'poi-kopitiam-284', name: 'Kopitiam Food Court (Blk 284 Bishan)', category: 'food', lat: 1.3586, lng: 103.8442, address: '284 Bishan St 22', details: { cuisine: '⭐ 4.1 (650+ Google reviews) • Kway Chap, Ban Mian, Roasted Meats' } },
  { id: 'poi-kim-san-leng-bishan', name: 'Kim San Leng Coffeeshop (Bishan Blk 511)', category: 'food', lat: 1.3498, lng: 103.8492, address: '511 Bishan St 13', details: { cuisine: '⭐ 4.3 (1,200+ Google reviews) • Famous Ming Kee Chicken Rice' } },
  { id: 'poi-starbucks-j8', name: 'Starbucks (Junction 8)', category: 'food', lat: 1.3504, lng: 103.8485, address: '9 Bishan Place #01-44', details: { cuisine: '⭐ 4.2 (900+ Google reviews) • Coffee & Pastries' } },
  { id: 'poi-toastbox-j8', name: 'Toast Box (Junction 8)', category: 'food', lat: 1.3502, lng: 103.8488, details: { cuisine: '⭐ 4.0 (520+ Google reviews) • Traditional Kopi & Toast' } },
  { id: 'poi-yakun-amk', name: 'Ya Kun Kaya Toast (AMK Hub)', category: 'food', lat: 1.3692, lng: 103.8486, details: { cuisine: '⭐ 4.2 (480+ Google reviews) • Kaya Toast, Soft Boiled Eggs' } },

  // --- Convenience Stores & Daily Essentials ---
  { id: 'poi-7eleven-283', name: '7-Eleven (Bishan St 22 Blk 283)', category: 'shopping', lat: 1.3582, lng: 103.8449, address: 'Blk 283 Bishan St 22', details: { brand: '7-Eleven 24/7 Convenience Store' } },
  { id: 'poi-cheers-bishan', name: 'Cheers (Bishan MRT Station)', category: 'shopping', lat: 1.3510, lng: 103.8482, details: { brand: 'Cheers Convenience' } },
  { id: 'poi-guardian-bishan', name: 'Guardian Health & Beauty (Bishan North)', category: 'healthcare', lat: 1.3584, lng: 103.8454, address: 'Blk 282 Bishan St 22', details: { brand: 'Pharmacy & Health Supplies' } },
  { id: 'poi-watsons-j8', name: 'Watsons Personal Care Store (Junction 8)', category: 'healthcare', lat: 1.3506, lng: 103.8489, details: { brand: 'Watsons Pharmacy' } },

  // --- Community, Sports & Recreation ---
  { id: 'poi-bishan-cc', name: 'Bishan Community Club', category: 'sports', lat: 1.3512, lng: 103.8502, address: '51 Bishan St 13', details: { sportsType: 'Community Club & Sports Hall' } },
  { id: 'poi-bishan-stadium', name: 'Bishan Stadium & ActiveSG Swimming Complex', category: 'sports', lat: 1.3552, lng: 103.8516, address: 'Bishan St 14', details: { sportsType: 'Stadium & Swimming Complex' } },
  { id: 'poi-bishan-library', name: 'Bishan Public Library (National Library Board)', category: 'school', lat: 1.3496, lng: 103.8498, address: '6 Bishan Place', details: { schoolType: 'Public Library & Study Zones' } },

  // --- General Practice & Dental Clinics ---
  { id: 'poi-raffles-medical-bishan', name: 'Raffles Medical Clinic (Bishan North)', category: 'healthcare', lat: 1.3580, lng: 103.8450, address: '283 Bishan St 22', details: { hospitalType: 'Medical Centre' } },
  { id: 'poi-healthway-bishan', name: 'Healthway Medical Clinic (Bishan)', category: 'healthcare', lat: 1.3502, lng: 103.8478, address: '502 Bishan St 11', details: { hospitalType: 'Medical Centre' } },

  // --- Other High-Traffic SG Neighborhood Hubs ---
  { id: 'poi-tampines-hub-food', name: 'Hawker Centre @ Our Tampines Hub', category: 'food', lat: 1.3534, lng: 103.9405, details: { cuisine: '⭐ 4.2 (3,100+ Google reviews) • 40+ stalls, 24/7 dining' } },
  { id: 'poi-donki-tam', name: 'Don Don Donki (Tampines 1)', category: 'shopping', lat: 1.3542, lng: 103.9455, details: { brand: 'Japanese Grocery, Fresh Bento & Snacks' } },
  { id: 'poi-beauty-world-centre', name: 'Beauty World Food Centre (Rooftop)', category: 'food', lat: 1.3421, lng: 103.7762, details: { cuisine: '⭐ 4.3 (1,400+ Google reviews) • Top-floor open-air hawker' } },
  { id: 'poi-serangoon-nex-food', name: 'Food Republic (NEX Serangoon)', category: 'food', lat: 1.3508, lng: 103.8728, details: { cuisine: '⭐ 4.1 (1,100+ Google reviews) • Modern thematic food hall' } },
  { id: 'poi-jurong-food-street', name: 'Malaysia Boleh! (Jurong Point)', category: 'food', lat: 1.3404, lng: 103.7065, details: { cuisine: '⭐ 4.3 (2,800+ Google reviews) • Street food heritage kopitiam' } },
  { id: 'poi-punggol-oasis', name: 'Oasis Terraces Waterfront Mall', category: 'shopping', lat: 1.4050, lng: 103.9122, details: { brand: 'Community Plaza & Riverfront Dining' } },
  { id: 'poi-tiong-bahru-bakery', name: 'Tiong Bahru Bakery (Eng Hoon)', category: 'food', lat: 1.2846, lng: 103.8329, details: { cuisine: '⭐ 4.4 (3,600+ Google reviews) • Famous Croissants & Kouign Amann' } },
  { id: 'poi-tiong-bahru-plaza', name: 'Tiong Bahru Plaza', category: 'shopping', lat: 1.2865, lng: 103.8272, details: { brand: 'Suburban Mall with Golden Village Cinema' } },
];
