# SG Nearby 🇸🇬
### See What's Around Any Singapore Postal Code & Neighborhood

An interactive, high-performance web application designed for homebuyers, renters, and residents to inspect any address, postal code, or custom dropped pin in Singapore and see what's nearby within walking distance.

Designed with the exact visual language, warm editorial typography, and styling of **`sgdataviz`** (`#FBF9F5` canvas, `#243324` forest charcoal text, `Fraunces` serif headings, `Plus Jakarta Sans` sans-serif UI).

---

## 🌟 Key Features

1. **Interactive Singapore Map (CartoDB Voyager Tiles)**:
   - High-contrast, clean vector basemap tailored to match Singapore's urban landscape.
   - **Click Anywhere on Map**: Drop a pin anywhere in Singapore to instantly recalculate all nearby amenities with reverse geocoding.
   - **Beacon Pulse Pin**: Animated location pin with radar beacon effect.

2. **Walking Radius & Duration Control**:
   - Quick toggles: **5 mins (400m)**, **10 mins (800m)**, and **15 mins (1.2km)**.
   - Real-time animated walking isochrone boundary ring showing the exact pedestrian perimeter.

3. **Dedicated Primary School 1km & 2km Priority Rings**:
   - Built specifically for Singapore property buyers navigating MOE Phase 2C school registration.
   - Distinct green dashed 1km circle (highest ballot priority) and amber dashed 2km circle.
   - Instant categorization and badging of all ~180 MOE Primary Schools.

4. **Multi-Category Singapore Amenities**:
   - **MRT & LRT Stations**: 160+ stations across NSL, EWL, NEL, CCL, DTL, TEL, and LRT networks with official line color badges and station codes.
   - **Hawker Centres & Food Markets**: 110+ NEA hawker centres with specialty cuisine notes and stall counts.
   - **Shopping Malls & Supermarkets**: FairPrice, FairPrice Xtra/Finest, Cold Storage, Sheng Siong, Don Don Donki, and major suburban malls.
   - **Healthcare**: SingHealth/NHG/NUHS Polyclinics and General Hospitals.
   - **Parks & Nature**: NParks regional parks, nature reserves, PCN connectors, and reservoirs.

5. **Walkability & Convenience Score Gauge**:
   - Algorithm-driven score (0–100) factoring in transit proximity, dining density, grocery access, school options, and green spaces.

6. **Instant Google Maps Walking Directions**:
   - Every amenity card and map popup features a direct shortcut to open turn-by-turn walking routes in Google Maps.

7. **Search & Featured Hotspots**:
   - Real-time search with autocomplete supporting Singapore 6-digit postal codes, condominium names, HDB estates, and landmarks.
   - One-click **Featured Hotspots** quick selector (Pinnacle@Duxton, Natura Loft Bishan, SkyVille@Dawson, Marina One, The Interlace, Tampines GreenVerge, Waterway Terraces, etc.).

8. **Official Property Price Analytics (HDB Resale & URA Private Properties)**:
   - **HDB Resale (Data.gov.sg)**: 3-year rolling transaction history, block-level walking distance calculations, flat type breakdowns, and price trends.
   - **Private Residential Properties (Official URA API)**: 5-year historical transactions from URA (`PMI_Resi_Transaction`), quarterly PSF/price charts, unit configuration breakdowns, market segment badges (CCR/RCR/OCR), and nearby condominium cluster comparisons.
   - **Seamless Dataset Switching**: Automatically detects whether a location is an HDB or Condominium, with an in-card toggle to switch between HDB and URA Private datasets anywhere in Singapore.
   - **Centralized Server-Side API**: Configure `URA_ACCESS_KEY` in `.env.local` so all users query the official URA dataset automatically without needing to input a key on the frontend.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) with your browser.
