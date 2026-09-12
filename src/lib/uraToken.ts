/**
 * URA Data Service Daily Token Lifecycle Manager
 *
 * Official URA Data Service API Specification:
 * - Token Endpoint: https://eservice.ura.gov.sg/uraDataService/insertNewToken/v1
 * - Tokens are strictly valid for the Singapore calendar day (resetting at 00:00 SGT, UTC+8).
 * - "Token is valid for one day only. Your token exceed that. Please try for new token to access the URA data service"
 *   is returned whenever a token from a previous calendar day is used.
 */

interface TokenCacheEntry {
  token: string;
  expiresAt: number;
  sgtDateStr: string;
}

// In-memory token cache keyed by trimmed access key
const tokenCache = new Map<string, TokenCacheEntry>();

/**
 * Returns today's date in Singapore Time (SGT, UTC+8) in 'YYYY-MM-DD' format.
 */
export function getSgtDateString(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(d);
}

/**
 * Calculates milliseconds remaining until midnight Singapore Time (23:59:59 SGT).
 */
export function getMillisUntilSgtMidnight(now = new Date()): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Singapore',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  const second = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10);

  const secondsPassedToday = hour * 3600 + minute * 60 + second;
  const secondsLeftToday = 86400 - secondsPassedToday;
  return Math.max(0, secondsLeftToday * 1000);
}

/**
 * Checks if an error message from URA Data Service indicates token expiry or invalidation.
 */
export function isUraTokenError(message?: string): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes('token') &&
    (m.includes('valid for one day') ||
      m.includes('exceed') ||
      m.includes('expired') ||
      m.includes('invalid') ||
      m.includes('new token') ||
      m.includes('access the ura data service'))
  );
}

/**
 * Invalidate cached daily token for an access key (or all keys).
 */
export function invalidateUraDailyToken(accessKey?: string): void {
  if (!accessKey) {
    tokenCache.clear();
    return;
  }
  tokenCache.delete(accessKey.trim());
}

/**
 * Manually set or prime the daily token in cache.
 */
export function setUraDailyToken(accessKey: string, token: string): void {
  const key = accessKey.trim();
  const sgtDateStr = getSgtDateString();
  const millisUntilMidnight = getMillisUntilSgtMidnight();
  // Safe buffer 30 seconds before midnight SGT
  const ttlMs = Math.max(60 * 1000, millisUntilMidnight - 30 * 1000);

  tokenCache.set(key, {
    token,
    expiresAt: Date.now() + ttlMs,
    sgtDateStr,
  });
}

/**
 * Retrieves a valid daily token from URA Data Service.
 * Automatically verifies that the token belongs to the current Singapore calendar day.
 */
export async function getUraDailyToken(
  accessKey: string,
  forceRefresh = false
): Promise<string> {
  const key = accessKey.trim();
  const todaySgt = getSgtDateString();
  const cached = tokenCache.get(key);

  if (!forceRefresh && cached && cached.sgtDateStr === todaySgt && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  // Token is expired, invalid, from a different calendar day, or forced refresh
  tokenCache.delete(key);

  const uraTokenUrl = 'https://eservice.ura.gov.sg/uraDataService/insertNewToken/v1';
  const res = await fetch(uraTokenUrl, {
    method: 'GET',
    headers: {
      AccessKey: key,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`URA Token Service error (HTTP ${res.status}): ${text || 'Unknown Error'}`);
  }

  const data = await res.json();
  if (data.Status === 'Success' && data.Result) {
    setUraDailyToken(key, data.Result);
    return data.Result;
  }

  throw new Error(data.Message || 'Failed to obtain URA daily token with provided Access Key');
}
