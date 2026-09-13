import { NextRequest, NextResponse } from 'next/server';
import {
  HDB_DATASET_ID,
  HDB_DATASET_URL,
  normalizeStreetName,
  calculateBlockProximity,
  HdbTransaction,
  FlatTypeSummary,
  MonthlyTrend,
  BlockCount,
  BlockProximityInfo,
  HdbResaleAnalysis,
} from '@/lib/hdbResale';

export const dynamic = 'force-dynamic';

// In-memory cache to prevent data.gov.sg rate limits
interface CacheEntry {
  timestamp: number;
  records: any[];
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory rate limiting: max 60 requests per IP per 5 minutes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (rateLimitMap.size > 1000) {
    rateLimitMap.forEach((val, key) => {
      if (now > val.resetTime) rateLimitMap.delete(key);
    });
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }
    const { searchParams } = new URL(request.url);
    let street = searchParams.get('street') || '';
    let block = searchParams.get('block') || '';
    const postal = searchParams.get('postal') || '';
    const address = searchParams.get('address') || '';
    const name = searchParams.get('name') || '';

    // If street is missing but postal or address exists, attempt OneMap resolution
    if (!street && (postal || address)) {
      const searchVal = postal || address.split(',')[0];
      try {
        const onemapRes = await fetch(
          `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
            searchVal
          )}&returnGeom=N&getAddrDetails=Y&pageNum=1`,
          { headers: { Accept: 'application/json' } }
        );
        if (onemapRes.ok) {
          const onemapData = await onemapRes.json();
          if (onemapData.results && onemapData.results.length > 0) {
            const first = onemapData.results[0];
            if (first.ROAD_NAME && first.ROAD_NAME !== 'NIL') {
              street = first.ROAD_NAME;
            }
            if (!block && first.BLK_NO && first.BLK_NO !== 'NIL') {
              block = first.BLK_NO;
            }
          }
        }
      } catch (err) {
        console.warn('OneMap resolve error in hdb-resale route:', err);
      }
    }

    // Fallback: extract from address string if still empty
    if (!street && address) {
      let cleaned = address.replace(/,\s*Singapore\s*\d*/gi, '').trim();
      const blkMatch = cleaned.match(/^(?:blk|block)?\s*([0-9]{1,4}[a-z]?)\b/i);
      if (blkMatch) {
        if (!block) block = blkMatch[1].toUpperCase();
        cleaned = cleaned.replace(/^(?:blk|block)?\s*[0-9]{1,4}[a-z]?\s*,?\s*/i, '');
      }
      street = cleaned.split(',')[0].trim();
    }

    const normalizedStreet = normalizeStreetName(street);

    if (!normalizedStreet) {
      return NextResponse.json<HdbResaleAnalysis>({
        streetName: '',
        datasetId: HDB_DATASET_ID,
        datasetUrl: HDB_DATASET_URL,
        timeframe: { startMonth: '', endMonth: '', monthsCovered: 0 },
        totalTransactions: 0,
        avgResalePrice: 0,
        medianResalePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgPsf: 0,
        avgPsqm: 0,
        flatTypeSummaries: [],
        monthlyTrends: [],
        availableBlocks: [],
        transactions: [],
        hasTransactions: false,
        message: 'No street name could be identified for this location.',
      });
    }

    // Check cache
    const cacheKey = normalizedStreet.toUpperCase();
    let rawRecords: any[] = [];
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      rawRecords = cached.records;
    } else {
      // Query data.gov.sg datastore_search for this street
      // We query up to 3000 recent transactions sorted newest first, with pagination support
      const queryParams = new URLSearchParams({
        resource_id: HDB_DATASET_ID,
        filters: JSON.stringify({ street_name: normalizedStreet }),
        sort: 'month desc',
        limit: '3000',
      });

      const dataGovUrl = `https://data.gov.sg/api/action/datastore_search?${queryParams.toString()}`;
      const apiRes = await fetch(dataGovUrl, {
        headers: { Accept: 'application/json' },
      });

      if (!apiRes.ok) {
        const errorText = await apiRes.text();
        console.error('Data.gov.sg API error:', apiRes.status, errorText);
        throw new Error(`Data.gov.sg returned HTTP ${apiRes.status}`);
      }

      const json = await apiRes.json();
      if (json.success && json.result && Array.isArray(json.result.records)) {
        rawRecords = json.result.records;
        const total = json.result.total ?? rawRecords.length;

        // If road exceeds 3000 records, fetch second page to ensure complete street history
        if (total > rawRecords.length && rawRecords.length === 3000) {
          try {
            const p2Params = new URLSearchParams({
              resource_id: HDB_DATASET_ID,
              filters: JSON.stringify({ street_name: normalizedStreet }),
              sort: 'month desc',
              limit: '3000',
              offset: '3000',
            });
            const p2Res = await fetch(
              `https://data.gov.sg/api/action/datastore_search?${p2Params.toString()}`,
              { headers: { Accept: 'application/json' } }
            );
            if (p2Res.ok) {
              const p2Json = await p2Res.json();
              if (p2Json.success && p2Json.result && Array.isArray(p2Json.result.records)) {
                rawRecords = rawRecords.concat(p2Json.result.records);
              }
            }
          } catch (p2Err) {
            console.warn('Failed to fetch page 2 of HDB resale data:', p2Err);
          }
        }

        cache.set(cacheKey, { timestamp: Date.now(), records: rawRecords });
      }
    }

    if (!rawRecords || rawRecords.length === 0) {
      return NextResponse.json<HdbResaleAnalysis>({
        streetName: normalizedStreet,
        queryBlock: block,
        datasetId: HDB_DATASET_ID,
        datasetUrl: HDB_DATASET_URL,
        timeframe: { startMonth: '', endMonth: '', monthsCovered: 0 },
        totalTransactions: 0,
        avgResalePrice: 0,
        medianResalePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgPsf: 0,
        avgPsqm: 0,
        flatTypeSummaries: [],
        monthlyTrends: [],
        availableBlocks: [],
        transactions: [],
        hasTransactions: false,
        message: `No HDB resale transactions found for "${normalizedStreet}". This address may be a private residential property, condominium, or commercial development.`,
      });
    }

    // Determine the latest transaction month in the dataset
    const latestMonth = rawRecords[0]?.month || '2026-09';
    const [latestYear, latestMonthNum] = latestMonth.split('-').map(Number);

    // Calculate rolling 5-year cutoff (60 months prior)
    const cutoffYear = latestYear - 5;
    const cutoffMonth = `${cutoffYear}-${String(latestMonthNum).padStart(2, '0')}`;

    // Filter to strictly the past 5 years (60 months)
    const past5YearsRecords = rawRecords.filter((r) => r.month >= cutoffMonth);

    if (past5YearsRecords.length === 0) {
      return NextResponse.json<HdbResaleAnalysis>({
        streetName: normalizedStreet,
        queryBlock: block,
        town: rawRecords[0]?.town,
        datasetId: HDB_DATASET_ID,
        datasetUrl: HDB_DATASET_URL,
        timeframe: { startMonth: cutoffMonth, endMonth: latestMonth, monthsCovered: 60 },
        totalTransactions: 0,
        avgResalePrice: 0,
        medianResalePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgPsf: 0,
        avgPsqm: 0,
        flatTypeSummaries: [],
        monthlyTrends: [],
        availableBlocks: [],
        transactions: [],
        hasTransactions: false,
        message: `No transactions recorded on ${normalizedStreet} in the past 5 years (${cutoffMonth} to ${latestMonth}).`,
      });
    }

    // Collect all available blocks and compute walking proximity relative to the selected block
    const blockCountMap = new Map<string, number>();
    for (const r of past5YearsRecords) {
      blockCountMap.set(r.block, (blockCountMap.get(r.block) || 0) + 1);
    }

    const availableBlocksWithProximity: BlockProximityInfo[] = Array.from(blockCountMap.entries())
      .map(([blk, count]) => {
        const prox = calculateBlockProximity(blk, block);
        return {
          block: blk,
          count,
          distanceMeters: prox.distanceMeters,
          walkingMinutes: prox.walkingMinutes,
          isWithin5MinWalk: prox.isWithin5MinWalk,
          isOrigin: prox.isOrigin,
        };
      })
      .sort((a, b) => {
        // Sort origin block first, then by distance ascending, then by count descending
        if (a.isOrigin && !b.isOrigin) return -1;
        if (!a.isOrigin && b.isOrigin) return 1;
        if (a.distanceMeters !== b.distanceMeters) return a.distanceMeters - b.distanceMeters;
        return b.count - a.count;
      });

    const availableBlocks: BlockCount[] = availableBlocksWithProximity.map((b) => ({
      block: b.block,
      count: b.count,
    }));

    // Map raw records into formatted HdbTransaction models with walking distance
    // 1 sqm = 10.7639 sq ft
    const mappedTransactions: HdbTransaction[] = past5YearsRecords.map((r) => {
      const sqm = parseFloat(r.floor_area_sqm) || 0;
      const price = parseFloat(r.resale_price) || 0;
      const sqft = sqm * 10.7639;
      const psf = sqft > 0 ? Math.round(price / sqft) : 0;
      const psqm = sqm > 0 ? Math.round(price / sqm) : 0;
      const prox = calculateBlockProximity(r.block, block);

      return {
        id: r._id,
        month: r.month,
        town: r.town,
        flatType: r.flat_type,
        block: r.block,
        streetName: r.street_name,
        storeyRange: r.storey_range,
        floorAreaSqm: sqm,
        floorAreaSqft: Math.round(sqft),
        flatModel: r.flat_model,
        leaseCommenceDate: parseInt(r.lease_commence_date, 10) || 0,
        remainingLease: r.remaining_lease || '',
        resalePrice: price,
        pricePerSqft: psf,
        pricePerSqm: psqm,
        distanceMeters: prox.distanceMeters,
        walkingMinutes: prox.walkingMinutes,
        isWithin5MinWalk: prox.isWithin5MinWalk,
        isOriginBlock: prox.isOrigin,
      };
    });

    // Transactions strictly within 5 mins walk (400m)
    const walk5MinRecords = mappedTransactions.filter((t) => t.isWithin5MinWalk);
    const walk5MinCount = walk5MinRecords.length;

    // Helper to calculate statistics over a subset of transactions
    const computeStats = (txList: HdbTransaction[]) => {
      if (txList.length === 0) {
        return {
          total: 0,
          avgPrice: 0,
          medianPrice: 0,
          minPrice: 0,
          maxPrice: 0,
          avgPsf: 0,
          avgPsqm: 0,
        };
      }
      const prices = txList.map((t) => t.resalePrice).sort((a, b) => a - b);
      const total = txList.length;
      const sumPrice = prices.reduce((acc, p) => acc + p, 0);
      const avgPrice = Math.round(sumPrice / total);
      const medianPrice =
        total % 2 === 1
          ? prices[Math.floor(total / 2)]
          : Math.round((prices[total / 2 - 1] + prices[total / 2]) / 2);
      const minPrice = prices[0];
      const maxPrice = prices[prices.length - 1];

      const sumPsf = txList.reduce((acc, t) => acc + t.pricePerSqft, 0);
      const sumPsqm = txList.reduce((acc, t) => acc + t.pricePerSqm, 0);
      const avgPsf = Math.round(sumPsf / total);
      const avgPsqm = Math.round(sumPsqm / total);

      return { total, avgPrice, medianPrice, minPrice, maxPrice, avgPsf, avgPsqm };
    };

    const overallStats = computeStats(mappedTransactions);

    // Compute Flat Type Summaries
    const flatTypeMap = new Map<string, HdbTransaction[]>();
    for (const t of mappedTransactions) {
      if (!flatTypeMap.has(t.flatType)) {
        flatTypeMap.set(t.flatType, []);
      }
      flatTypeMap.get(t.flatType)!.push(t);
    }

    // Standard ordering of flat types
    const flatOrder = ['1 ROOM', '2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE', 'MULTI-GENERATION'];
    const flatTypeSummaries: FlatTypeSummary[] = Array.from(flatTypeMap.entries())
      .map(([fType, list]) => {
        const stats = computeStats(list);
        const avgSqm = Math.round(
          list.reduce((acc, t) => acc + t.floorAreaSqm, 0) / list.length
        );
        return {
          flatType: fType,
          count: stats.total,
          avgPrice: stats.avgPrice,
          medianPrice: stats.medianPrice,
          minPrice: stats.minPrice,
          maxPrice: stats.maxPrice,
          avgPsf: stats.avgPsf,
          avgPsqm: stats.avgPsqm,
          avgFloorAreaSqm: avgSqm,
        };
      })
      .sort((a, b) => {
        const idxA = flatOrder.indexOf(a.flatType.toUpperCase());
        const idxB = flatOrder.indexOf(b.flatType.toUpperCase());
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.flatType.localeCompare(b.flatType);
      });

    // Compute Monthly/Quarterly Trends for 3-year chart
    // Group transactions by month (YYYY-MM)
    const monthGroups = new Map<string, HdbTransaction[]>();
    for (const t of mappedTransactions) {
      if (!monthGroups.has(t.month)) {
        monthGroups.set(t.month, []);
      }
      monthGroups.get(t.month)!.push(t);
    }

    // Sort chronologically ascending for the chart
    const sortedMonths = Array.from(monthGroups.keys()).sort();
    const monthlyTrends: MonthlyTrend[] = sortedMonths.map((m) => {
      const list = monthGroups.get(m)!;
      const stats = computeStats(list);
      const [year, month] = m.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const shortMonth = monthNames[parseInt(month, 10) - 1] || month;
      return {
        period: m,
        label: `${shortMonth} '${year.slice(2)}`,
        avgPrice: stats.avgPrice,
        avgPsf: stats.avgPsf,
        count: stats.total,
      };
    });

    const responseData: HdbResaleAnalysis = {
      streetName: normalizedStreet,
      queryBlock: block || undefined,
      town: mappedTransactions[0]?.town,
      datasetId: HDB_DATASET_ID,
      datasetUrl: HDB_DATASET_URL,
      timeframe: {
        startMonth: cutoffMonth,
        endMonth: latestMonth,
        monthsCovered: 60,
      },
      totalTransactions: overallStats.total,
      walk5MinCount,
      avgResalePrice: overallStats.avgPrice,
      medianResalePrice: overallStats.medianPrice,
      minPrice: overallStats.minPrice,
      maxPrice: overallStats.maxPrice,
      avgPsf: overallStats.avgPsf,
      avgPsqm: overallStats.avgPsqm,
      flatTypeSummaries,
      monthlyTrends,
      availableBlocks,
      availableBlocksWithProximity,
      transactions: mappedTransactions,
      hasTransactions: true,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error handling /api/hdb-resale:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve HDB resale data',
        message: error?.message || 'Unknown server error',
      },
      { status: 500 }
    );
  }
}
