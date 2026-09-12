import { NextRequest, NextResponse } from 'next/server';
import {
  UraProjectRaw,
  UraTransactionRaw,
  UraTransaction,
  UraTrendPoint,
  UraUnitTypeSummary,
  NearbyPrivateProject,
  UraResaleAnalysis,
  mapPostalToDistrict,
  mapCoordinatesToDistrict,
  formatUraContractDate,
  normalizeProjectName,
  classifyUnitCategory,
} from '@/lib/uraProperty';
import { svy21ToWgs84, wgs84ToSvy21, svy21DistanceMeters } from '@/lib/svy21';

import {
  getUraDailyToken,
  invalidateUraDailyToken,
  isUraTokenError,
} from '@/lib/uraToken';

export const dynamic = 'force-dynamic';

// In-memory cache for URA batch payloads
interface BatchCache {
  timestamp: number;
  projects: UraProjectRaw[];
}

const batchCache = new Map<number, BatchCache>();
const BATCH_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Fetches and caches a specific URA PMI_Resi_Transaction batch (1 to 4).
 * If URA rejects with a token expiration/validity message, automatically refreshes the token and retries once.
 */
async function fetchUraBatch(
  batch: number,
  accessKey: string,
  token: string,
  isRetry = false
): Promise<UraProjectRaw[]> {
  const cached = batchCache.get(batch);
  if (!isRetry && cached && Date.now() - cached.timestamp < BATCH_CACHE_TTL_MS) {
    return cached.projects;
  }

  const url = `https://eservice.ura.gov.sg/uraDataService/invokeUraDS/v1?service=PMI_Resi_Transaction&batch=${batch}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      AccessKey: accessKey,
      Token: token,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`URA Batch ${batch} error (HTTP ${res.status}): ${text || 'Request failed'}`);
  }

  const data = await res.json();

  // If token is reported invalid or exceeded one day by URA, auto-refresh and retry once
  if (data.Status !== 'Success' && isUraTokenError(data.Message)) {
    if (!isRetry) {
      console.warn(
        `[URA API] Batch ${batch} token expired ("${data.Message}"). Invalidating token cache and retrying with fresh token...`
      );
      invalidateUraDailyToken(accessKey);
      const freshToken = await getUraDailyToken(accessKey, true);
      return fetchUraBatch(batch, accessKey, freshToken, true);
    }
  }

  if (data.Status === 'Success' && Array.isArray(data.Result)) {
    batchCache.set(batch, {
      timestamp: Date.now(),
      projects: data.Result,
    });
    return data.Result;
  }

  throw new Error(data.Message || `URA Batch ${batch} returned unsuccessful status`);
}

function getMarketSegmentFromDistrict(district: string): 'CCR' | 'RCR' | 'OCR' {
  const d = parseInt(district, 10);
  if ([1, 2, 6, 9, 10, 11].includes(d)) return 'CCR';
  if ([3, 4, 5, 7, 8, 12, 13, 14, 15, 20].includes(d)) return 'RCR';
  return 'OCR';
}

/**
 * Generates sample demonstration data for featured condominiums when no API key is provided.
 */
function getDemoAnalysis(projectName: string, streetName: string, postal?: string): UraResaleAnalysis {
  const norm = normalizeProjectName(projectName);
  let demoProject = 'MARINA ONE RESIDENCES';
  let demoStreet = 'MARINA WAY';
  let demoSegment = 'CCR';
  let demoTenure = '99 yrs lease commencing from 2011';
  let demoDistrict = '01';
  let basePrice = 2450000;
  let basePsf = 2650;
  let baseArea = 85;

  if (norm.includes('FOREST') || norm.includes('WOODS') || streetName.toUpperCase().includes('LEW LIAN') || postal === '533853') {
    demoProject = 'FOREST WOODS';
    demoStreet = 'LORONG LEW LIAN';
    demoSegment = 'OCR';
    demoTenure = '99 yrs lease commencing from 2016';
    demoDistrict = '19';
    basePrice = 1450000;
    basePsf = 1980;
    baseArea = 68;
  } else if (norm.includes('INTERLACE')) {
    demoProject = 'THE INTERLACE';
    demoStreet = 'DEPOT ROAD';
    demoSegment = 'RCR';
    demoTenure = '99 yrs lease commencing from 2009';
    demoDistrict = '04';
    basePrice = 2100000;
    basePsf = 1480;
    baseArea = 135;
  } else if (norm.includes('LEEDON')) {
    demoProject = "D'LEEDON";
    demoStreet = 'LEEDON HEIGHTS';
    demoSegment = 'CCR';
    demoTenure = '99 yrs lease commencing from 2010';
    demoDistrict = '10';
    basePrice = 2300000;
    basePsf = 1980;
    baseArea = 110;
  } else if (norm.includes('ESTA')) {
    demoProject = 'PARC ESTA';
    demoStreet = 'SIMS AVENUE';
    demoSegment = 'RCR';
    demoTenure = '99 yrs lease commencing from 2018';
    demoDistrict = '14';
    basePrice = 1650000;
    basePsf = 1850;
    baseArea = 85;
  }

  // Generate realistic 5-year sample transactions
  const quarters = [
    { q: '2021-Q1', m: '0221', psfMult: 0.86, priceMult: 0.86 },
    { q: '2021-Q2', m: '0521', psfMult: 0.88, priceMult: 0.87 },
    { q: '2021-Q3', m: '0821', psfMult: 0.89, priceMult: 0.88 },
    { q: '2021-Q4', m: '1121', psfMult: 0.90, priceMult: 0.90 },
    { q: '2022-Q1', m: '0222', psfMult: 0.91, priceMult: 0.91 },
    { q: '2022-Q2', m: '0522', psfMult: 0.92, priceMult: 0.92 },
    { q: '2022-Q3', m: '0822', psfMult: 0.94, priceMult: 0.93 },
    { q: '2022-Q4', m: '1122', psfMult: 0.95, priceMult: 0.95 },
    { q: '2023-Q1', m: '0223', psfMult: 0.96, priceMult: 0.96 },
    { q: '2023-Q2', m: '0523', psfMult: 0.98, priceMult: 0.98 },
    { q: '2023-Q3', m: '0823', psfMult: 1.00, priceMult: 1.00 },
    { q: '2023-Q4', m: '1123', psfMult: 1.01, priceMult: 1.02 },
    { q: '2024-Q1', m: '0224', psfMult: 1.03, priceMult: 1.03 },
    { q: '2024-Q2', m: '0524', psfMult: 1.05, priceMult: 1.05 },
    { q: '2024-Q3', m: '0824', psfMult: 1.06, priceMult: 1.06 },
    { q: '2024-Q4', m: '1124', psfMult: 1.07, priceMult: 1.08 },
    { q: '2025-Q1', m: '0225', psfMult: 1.08, priceMult: 1.09 },
    { q: '2025-Q2', m: '0525', psfMult: 1.10, priceMult: 1.11 },
    { q: '2025-Q3', m: '0825', psfMult: 1.12, priceMult: 1.13 },
  ];

  const transactions: UraTransaction[] = [];
  const floors = ['01-05', '06-10', '11-15', '16-20', '21-25', '26-30'];
  const unitSizes = [
    { sqm: baseArea * 0.55, type: 'Condominium' },
    { sqm: baseArea * 0.85, type: 'Condominium' },
    { sqm: baseArea * 1.15, type: 'Condominium' },
    { sqm: baseArea * 1.45, type: 'Condominium' },
  ];

  let idCounter = 1;
  for (const q of quarters) {
    for (const size of unitSizes) {
      const sqft = Math.round(size.sqm * 10.7639);
      const psf = Math.round(basePsf * q.psfMult * (0.95 + (idCounter % 10) * 0.01));
      const price = Math.round(sqft * psf);
      const dateInfo = formatUraContractDate(q.m);

      transactions.push({
        id: `demo-${idCounter++}`,
        contractDate: q.m,
        contractDateFormatted: dateInfo.formatted,
        month: dateInfo.month,
        quarter: q.q,
        areaSqm: Math.round(size.sqm),
        areaSqft: sqft,
        price,
        pricePerSqft: psf,
        pricePerSqm: Math.round(price / size.sqm),
        propertyType: size.type,
        typeOfSale: idCounter % 6 === 0 ? 'Sub Sale' : 'Resale',
        typeOfSaleCode: '3',
        floorRange: floors[idCounter % floors.length],
        tenure: demoTenure,
        district: demoDistrict,
        noOfUnits: 1,
      });
    }
  }

  // Sort newest first
  transactions.sort((a, b) => b.month.localeCompare(a.month));

  const prices = transactions.map((t) => t.price).sort((a, b) => a - b);
  const psfs = transactions.map((t) => t.pricePerSqft).sort((a, b) => a - b);
  const total = transactions.length;

  const avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / total);
  const medianPrice = prices[Math.floor(total / 2)];
  const avgPsf = Math.round(psfs.reduce((s, p) => s + p, 0) / total);
  const medianPsf = psfs[Math.floor(total / 2)];

  // Group trends
  const trendGroups = new Map<string, UraTransaction[]>();
  for (const t of transactions) {
    if (!trendGroups.has(t.quarter)) trendGroups.set(t.quarter, []);
    trendGroups.get(t.quarter)!.push(t);
  }

  const quarterlyTrends: UraTrendPoint[] = Array.from(trendGroups.keys())
    .sort()
    .map((q) => {
      const list = trendGroups.get(q)!;
      const qAvgPrice = Math.round(list.reduce((s, t) => s + t.price, 0) / list.length);
      const qAvgPsf = Math.round(list.reduce((s, t) => s + t.pricePerSqft, 0) / list.length);
      const [year, qNum] = q.split('-');
      return {
        period: q,
        label: `${qNum} '${year.slice(2)}`,
        avgPrice: qAvgPrice,
        avgPsf: qAvgPsf,
        count: list.length,
      };
    });

  // Group unit types
  const unitGroupMap = new Map<string, UraTransaction[]>();
  for (const t of transactions) {
    const cat = classifyUnitCategory(t.areaSqft);
    if (!unitGroupMap.has(cat)) unitGroupMap.set(cat, []);
    unitGroupMap.get(cat)!.push(t);
  }

  const unitTypeSummaries: UraUnitTypeSummary[] = Array.from(unitGroupMap.entries()).map(
    ([cat, list]) => {
      const uPrices = list.map((t) => t.price).sort((a, b) => a - b);
      const uPsfs = list.map((t) => t.pricePerSqft);
      const uSqft = list.map((t) => t.areaSqft);
      return {
        category: cat,
        count: list.length,
        avgPrice: Math.round(uPrices.reduce((s, p) => s + p, 0) / list.length),
        medianPrice: uPrices[Math.floor(list.length / 2)],
        minPrice: uPrices[0],
        maxPrice: uPrices[uPrices.length - 1],
        avgPsf: Math.round(uPsfs.reduce((s, p) => s + p, 0) / list.length),
        avgFloorAreaSqft: Math.round(uSqft.reduce((s, p) => s + p, 0) / list.length),
      };
    }
  );

  return {
    projectName: demoProject,
    streetName: demoStreet,
    marketSegment: demoSegment,
    tenure: demoTenure,
    district: demoDistrict,
    totalTransactions: total,
    avgPrice,
    medianPrice,
    minPrice: prices[0],
    maxPrice: prices[prices.length - 1],
    avgPsf,
    medianPsf,
    minPsf: psfs[0],
    maxPsf: psfs[psfs.length - 1],
    timeframe: {
      startPeriod: quarterlyTrends[0]?.label || 'Q1 \'21',
      endPeriod: quarterlyTrends[quarterlyTrends.length - 1]?.label || 'Q3 \'25',
      yearsCovered: 5,
    },
    unitTypeSummaries,
    quarterlyTrends,
    transactions,
    nearbyProjects: demoProject === 'FOREST WOODS' ? [
      {
        projectName: 'FOREST WOODS',
        street: 'LORONG LEW LIAN',
        district: '19',
        marketSegment: 'OCR',
        distanceMeters: 0,
        walkingMinutes: 0,
        transactionCount: total,
        latestPrice: transactions[0]?.price,
        latestPsf: transactions[0]?.pricePerSqft,
        isCurrent: true,
      },
      {
        projectName: 'THE LILIUM',
        street: 'LORONG HOW SUN',
        district: '19',
        marketSegment: 'OCR',
        distanceMeters: 420,
        walkingMinutes: 5,
        transactionCount: 80,
        latestPrice: 2150000,
        latestPsf: 2180,
      },
      {
        projectName: 'THE GAZANIA',
        street: 'SUNBIRD ROAD',
        district: '19',
        marketSegment: 'OCR',
        distanceMeters: 530,
        walkingMinutes: 7,
        transactionCount: 120,
        latestPrice: 2280000,
        latestPsf: 2230,
      },
      {
        projectName: 'BARTLEY RESIDENCES',
        street: 'LORONG HOW SUN',
        district: '19',
        marketSegment: 'OCR',
        distanceMeters: 750,
        walkingMinutes: 9,
        transactionCount: 210,
        latestPrice: 1750000,
        latestPsf: 1840,
      },
      {
        projectName: 'AFFINITY AT SERANGOON',
        street: 'SERANGOON NORTH AVE 1',
        district: '19',
        marketSegment: 'OCR',
        distanceMeters: 1400,
        walkingMinutes: 18,
        transactionCount: 340,
        latestPrice: 1680000,
        latestPsf: 1890,
      },
    ] : [
      {
        projectName: demoProject,
        street: demoStreet,
        district: demoDistrict,
        marketSegment: demoSegment,
        distanceMeters: 0,
        walkingMinutes: 0,
        transactionCount: total,
        latestPrice: transactions[0]?.price,
        latestPsf: transactions[0]?.pricePerSqft,
        isCurrent: true,
      },
    ],
    hasTransactions: true,
    hasApiKey: false,
    message: 'Displaying demonstration transaction data. Add your URA Access Key to query official live data across all Singapore private properties.',
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectNameQuery = searchParams.get('project') || searchParams.get('name') || '';
    const streetQuery = searchParams.get('street') || '';
    const postalQuery = searchParams.get('postal') || '';
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    const lat = latParam ? parseFloat(latParam) : undefined;
    const lng = lngParam ? parseFloat(lngParam) : undefined;

    // Determine AccessKey from server environment (primary), then header or query
    const accessKey =
      process.env.URA_ACCESS_KEY ||
      request.headers.get('x-ura-accesskey') ||
      searchParams.get('accessKey') ||
      '';

    // If no access key is provided, check if we can show demo data for featured condos or return friendly notice
    if (!accessKey.trim()) {
      const isFeatured =
        projectNameQuery.toLowerCase().includes('marina') ||
        projectNameQuery.toLowerCase().includes('interlace') ||
        projectNameQuery.toLowerCase().includes('leedon') ||
        projectNameQuery.toLowerCase().includes('esta') ||
        projectNameQuery.toLowerCase().includes('forest') ||
        projectNameQuery.toLowerCase().includes('woods') ||
        streetQuery.toLowerCase().includes('lew lian') ||
        streetQuery.toLowerCase().includes('depot') ||
        streetQuery.toLowerCase().includes('leedon') ||
        streetQuery.toLowerCase().includes('marina') ||
        streetQuery.toLowerCase().includes('sims') ||
        postalQuery === '533853';

      if (isFeatured || !projectNameQuery) {
        const demo = getDemoAnalysis(projectNameQuery, streetQuery, postalQuery);
        return NextResponse.json(demo);
      }

      const districtInfo = mapPostalToDistrict(postalQuery);
      const inferredSegment = getMarketSegmentFromDistrict(districtInfo.district);

      return NextResponse.json<UraResaleAnalysis>({
        projectName: projectNameQuery,
        streetName: streetQuery,
        marketSegment: inferredSegment,
        tenure: 'Freehold / 99-year Lease',
        district: `District ${districtInfo.district} - ${districtInfo.districtName}`,
        totalTransactions: 0,
        avgPrice: 0,
        medianPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgPsf: 0,
        medianPsf: 0,
        minPsf: 0,
        maxPsf: 0,
        timeframe: { startPeriod: '', endPeriod: '', yearsCovered: 5 },
        unitTypeSummaries: [],
        quarterlyTrends: [],
        transactions: [],
        nearbyProjects: [],
        hasTransactions: false,
        hasApiKey: false,
        message: 'Enter your URA Access Key to unlock official 5-year historical transaction records for private properties.',
      });
    }

    // Determine target batch based on postal code, district, or coordinates
    let districtInfo = mapPostalToDistrict(postalQuery);
    const cleanedPostalDigits = postalQuery ? postalQuery.trim().replace(/\D/g, '') : '';
    if ((!postalQuery || cleanedPostalDigits.length < 2) && lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      districtInfo = mapCoordinatesToDistrict(lat, lng);
    }
    let targetBatch = districtInfo.batch;

    // Convert query lat/lng to SVY21 coordinates if present
    let querySvy21: { easting: number; northing: number } | null = null;
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      querySvy21 = wgs84ToSvy21(lat, lng);
    }

    // 1. Obtain daily token
    const token = await getUraDailyToken(accessKey.trim());

    // 2. Fetch the appropriate batch
    let batchProjects = await fetchUraBatch(targetBatch, accessKey.trim(), token);

    // Normalize search terms
    const cleanProjectQuery = normalizeProjectName(projectNameQuery);
    const cleanStreetQuery = streetQuery.toUpperCase().trim();

    // 3. Match project in batch
    let matchedProject: UraProjectRaw | undefined;

    if (cleanProjectQuery) {
      matchedProject = batchProjects.find((p) => {
        const pNorm = normalizeProjectName(p.project);
        return (
          pNorm === cleanProjectQuery ||
          pNorm.includes(cleanProjectQuery) ||
          cleanProjectQuery.includes(pNorm)
        );
      });
    }

    // If not matched by project name, try matching by street name
    if (!matchedProject && cleanStreetQuery) {
      matchedProject = batchProjects.find((p) => {
        const pStreet = p.street.toUpperCase();
        return pStreet.includes(cleanStreetQuery) || cleanStreetQuery.includes(pStreet);
      });
    }

    // 4. If not matched by project name or street, check if coordinates exist.
    // In Singapore, URA batches are geographically grouped by postal district.
    // When a non-private location (HDB, school, park, custom dropped pin) is selected,
    // the nearest private property is overwhelmingly located in the current district batch!
    // Performing an in-memory proximity search takes < 1ms, completely eliminating the
    // 10-15s delay of sequentially downloading all 3 other batches over external HTTP.
    if (!matchedProject && querySvy21 && batchProjects.length > 0) {
      let minDistance = Infinity;
      let closest: UraProjectRaw | undefined;

      for (const p of batchProjects) {
        const px = parseFloat(p.x);
        const py = parseFloat(p.y);
        if (!isNaN(px) && !isNaN(py)) {
          const dist = svy21DistanceMeters(querySvy21.easting, querySvy21.northing, px, py);
          if (dist < minDistance && dist <= 2000) {
            // within 2.0km
            minDistance = dist;
            closest = p;
          }
        }
      }

      if (closest) {
        matchedProject = closest;
      }
    }

    // 5. If still not matched (e.g. user specifically searched for a condo in another district,
    // or coordinates were not provided, or no condo was within 2km in this batch):
    // Search other batches IN PARALLEL using Promise.allSettled.
    if (!matchedProject && cleanProjectQuery && cleanProjectQuery.length >= 3) {
      const otherBatches = [1, 2, 3, 4].filter((b) => b !== targetBatch);
      const results = await Promise.allSettled(
        otherBatches.map(async (b) => {
          const otherBatch = await fetchUraBatch(b, accessKey.trim(), token);
          const found = otherBatch.find((p) => {
            const pNorm = normalizeProjectName(p.project);
            return pNorm === cleanProjectQuery || pNorm.includes(cleanProjectQuery);
          });
          return { batch: b, projects: otherBatch, found };
        })
      );

      for (const res of results) {
        if (res.status === 'fulfilled' && res.value.found) {
          matchedProject = res.value.found;
          targetBatch = res.value.batch;
          batchProjects = res.value.projects;
          break;
        }
      }
    }

    // 6. Fallback if still not matched but coordinates exist: find closest project in batch
    if (!matchedProject && querySvy21 && batchProjects.length > 0) {
      let minDistance = Infinity;
      let closest: UraProjectRaw | undefined;

      for (const p of batchProjects) {
        const px = parseFloat(p.x);
        const py = parseFloat(p.y);
        if (!isNaN(px) && !isNaN(py)) {
          const dist = svy21DistanceMeters(querySvy21.easting, querySvy21.northing, px, py);
          if (dist < minDistance && dist <= 3500) {
            minDistance = dist;
            closest = p;
          }
        }
      }

      if (closest) {
        matchedProject = closest;
      }
    }

    // Collect nearby private projects with distances
    const nearbyProjects: NearbyPrivateProject[] = [];
    const originX = matchedProject ? parseFloat(matchedProject.x) : querySvy21?.easting;
    const originY = matchedProject ? parseFloat(matchedProject.y) : querySvy21?.northing;

    if (originX && originY && !isNaN(originX) && !isNaN(originY)) {
      for (const p of batchProjects) {
        const px = parseFloat(p.x);
        const py = parseFloat(p.y);
        if (!isNaN(px) && !isNaN(py)) {
          const distanceMeters = svy21DistanceMeters(originX, originY, px, py);
          if (distanceMeters <= 2000) {
            const txCount = p.transaction ? p.transaction.length : 0;
            const latestTx = p.transaction && p.transaction.length > 0 ? p.transaction[p.transaction.length - 1] : undefined;
            const latestPrice = latestTx ? parseFloat(latestTx.price) : undefined;
            const latestAreaSqm = latestTx ? parseFloat(latestTx.area) : undefined;
            const latestPsf =
              latestPrice && latestAreaSqm
                ? Math.round(latestPrice / (latestAreaSqm * 10.7639))
                : undefined;

            nearbyProjects.push({
              projectName: p.project,
              street: p.street,
              district: districtInfo.district,
              marketSegment: p.marketSegment || 'OCR',
              distanceMeters,
              walkingMinutes: Math.max(1, Math.round(distanceMeters / 80)),
              transactionCount: txCount,
              latestPrice,
              latestPsf,
              isCurrent: matchedProject ? p.project === matchedProject.project : false,
            });
          }
        }
      }
      nearbyProjects.sort((a, b) => a.distanceMeters - b.distanceMeters);
    }

    if (!matchedProject || !matchedProject.transaction || matchedProject.transaction.length === 0) {
      return NextResponse.json<UraResaleAnalysis>({
        projectName: projectNameQuery || matchedProject?.project || 'Private Residential Property',
        streetName: streetQuery || matchedProject?.street || '',
        marketSegment: matchedProject?.marketSegment || 'OCR',
        tenure: 'Private Residential',
        district: districtInfo.district,
        totalTransactions: 0,
        avgPrice: 0,
        medianPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgPsf: 0,
        medianPsf: 0,
        minPsf: 0,
        maxPsf: 0,
        timeframe: { startPeriod: '', endPeriod: '', yearsCovered: 5 },
        unitTypeSummaries: [],
        quarterlyTrends: [],
        transactions: [],
        nearbyProjects: nearbyProjects.slice(0, 10),
        hasTransactions: false,
        hasApiKey: true,
        message: `No URA private property transaction records found for "${projectNameQuery || streetQuery}" in Postal District ${districtInfo.district}.`,
      });
    }

    // Parse project coordinates
    const projX = parseFloat(matchedProject.x);
    const projY = parseFloat(matchedProject.y);
    const coordinates =
      !isNaN(projX) && !isNaN(projY) ? svy21ToWgs84(projX, projY) : undefined;

    // Map and calculate transaction details
    const mappedTransactions: UraTransaction[] = matchedProject.transaction.map((t, idx) => {
      const sqm = parseFloat(t.area) || 0;
      const price = parseFloat(t.price) || 0;
      const nettPrice = t.nettPrice ? parseFloat(t.nettPrice) : undefined;
      const sqft = Math.round(sqm * 10.7639);
      const psf = sqft > 0 ? Math.round(price / sqft) : 0;
      const psqm = sqm > 0 ? Math.round(price / sqm) : 0;
      const dateInfo = formatUraContractDate(t.contractDate);

      let saleLabel: 'New Sale' | 'Sub Sale' | 'Resale' = 'Resale';
      if (t.typeOfSale === '1') saleLabel = 'New Sale';
      else if (t.typeOfSale === '2') saleLabel = 'Sub Sale';

      return {
        id: `${matchedProject!.project}-${t.contractDate}-${idx}`,
        contractDate: t.contractDate,
        contractDateFormatted: dateInfo.formatted,
        month: dateInfo.month,
        quarter: dateInfo.quarter,
        areaSqm: Math.round(sqm),
        areaSqft: sqft,
        price,
        nettPrice,
        pricePerSqft: psf,
        pricePerSqm: psqm,
        propertyType: t.propertyType || 'Condominium',
        typeOfSale: saleLabel,
        typeOfSaleCode: t.typeOfSale,
        floorRange: t.floorRange || '-',
        tenure: t.tenure || '99-year Lease',
        district: t.district || districtInfo.district,
        noOfUnits: parseInt(t.noOfUnits, 10) || 1,
      };
    });

    // Sort newest first
    mappedTransactions.sort((a, b) => b.month.localeCompare(a.month));

    const prices = mappedTransactions.map((t) => t.price).sort((a, b) => a - b);
    const psfs = mappedTransactions.map((t) => t.pricePerSqft).sort((a, b) => a - b);
    const total = mappedTransactions.length;

    const avgPrice = total > 0 ? Math.round(prices.reduce((s, p) => s + p, 0) / total) : 0;
    const medianPrice =
      total === 0
        ? 0
        : total % 2 === 1
        ? prices[Math.floor(total / 2)]
        : Math.round((prices[total / 2 - 1] + prices[total / 2]) / 2);
    const avgPsf = total > 0 ? Math.round(psfs.reduce((s, p) => s + p, 0) / total) : 0;
    const medianPsf =
      total === 0
        ? 0
        : total % 2 === 1
        ? psfs[Math.floor(total / 2)]
        : Math.round((psfs[total / 2 - 1] + psfs[total / 2]) / 2);

    // Group trends quarterly
    const trendGroups = new Map<string, UraTransaction[]>();
    for (const t of mappedTransactions) {
      if (!trendGroups.has(t.quarter)) trendGroups.set(t.quarter, []);
      trendGroups.get(t.quarter)!.push(t);
    }

    const quarterlyTrends: UraTrendPoint[] = Array.from(trendGroups.keys())
      .sort()
      .map((q) => {
        const list = trendGroups.get(q)!;
        const qAvgPrice = Math.round(list.reduce((s, t) => s + t.price, 0) / list.length);
        const qAvgPsf = Math.round(list.reduce((s, t) => s + t.pricePerSqft, 0) / list.length);
        const [year, qNum] = q.split('-');
        return {
          period: q,
          label: `${qNum} '${year.slice(2)}`,
          avgPrice: qAvgPrice,
          avgPsf: qAvgPsf,
          count: list.length,
        };
      });

    // Group unit type summaries
    const unitGroupMap = new Map<string, UraTransaction[]>();
    for (const t of mappedTransactions) {
      const cat = classifyUnitCategory(t.areaSqft);
      if (!unitGroupMap.has(cat)) unitGroupMap.set(cat, []);
      unitGroupMap.get(cat)!.push(t);
    }

    const unitOrder = [
      'Studio / 1-Bed (<520 sqft)',
      '2-Bedroom (520–820 sqft)',
      '3-Bedroom (820–1,250 sqft)',
      '4-Bedroom (1,250–1,700 sqft)',
      '5-Bed+ / Penthouse (>1,700 sqft)',
    ];

    const unitTypeSummaries: UraUnitTypeSummary[] = Array.from(unitGroupMap.entries())
      .map(([cat, list]) => {
        const uPrices = list.map((t) => t.price).sort((a, b) => a - b);
        const uPsfs = list.map((t) => t.pricePerSqft);
        const uSqft = list.map((t) => t.areaSqft);
        return {
          category: cat,
          count: list.length,
          avgPrice: Math.round(uPrices.reduce((s, p) => s + p, 0) / list.length),
          medianPrice: uPrices[Math.floor(list.length / 2)],
          minPrice: uPrices[0],
          maxPrice: uPrices[uPrices.length - 1],
          avgPsf: Math.round(uPsfs.reduce((s, p) => s + p, 0) / list.length),
          avgFloorAreaSqft: Math.round(uSqft.reduce((s, p) => s + p, 0) / list.length),
        };
      })
      .sort((a, b) => unitOrder.indexOf(a.category) - unitOrder.indexOf(b.category));

    // Determine primary tenure
    const primaryTenure = mappedTransactions[0]?.tenure || 'Private Residential';

    const response: UraResaleAnalysis = {
      projectName: matchedProject.project,
      streetName: matchedProject.street,
      marketSegment: matchedProject.marketSegment || 'OCR',
      tenure: primaryTenure,
      district: districtInfo.district,
      coordinates,
      totalTransactions: total,
      avgPrice,
      medianPrice,
      minPrice: prices[0] || 0,
      maxPrice: prices[prices.length - 1] || 0,
      avgPsf,
      medianPsf,
      minPsf: psfs[0] || 0,
      maxPsf: psfs[psfs.length - 1] || 0,
      timeframe: {
        startPeriod: quarterlyTrends[0]?.label || '',
        endPeriod: quarterlyTrends[quarterlyTrends.length - 1]?.label || '',
        yearsCovered: 5,
      },
      unitTypeSummaries,
      quarterlyTrends,
      transactions: mappedTransactions,
      nearbyProjects: nearbyProjects.slice(0, 10),
      hasTransactions: true,
      hasApiKey: true,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Error handling /api/ura-transactions:', err);
    return NextResponse.json(
      {
        error: 'Failed to retrieve URA private property transactions',
        message: err?.message || 'Unknown server error',
      },
      { status: 500 }
    );
  }
}
