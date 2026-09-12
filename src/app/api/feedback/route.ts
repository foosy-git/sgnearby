import { NextResponse } from 'next/server';

// In-memory rate limiting: max 5 requests per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Periodic cleanup of stale entries if map gets large
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

// Neutralize spreadsheet formula injection characters
function sanitizeForSpreadsheet(val: string): string {
  if (!val) return '';
  return /^[=+\-@\t\r]/.test(val) ? `'${val}` : val;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { type, email, message, website } = body;

    // Honeypot check: If the hidden 'website' field is populated, silently drop the bot submission
    if (website) {
      return NextResponse.json({ success: true });
    }

    // Input validation
    const validTypes = ['Enhancement', 'Bug', 'Data Issue', 'Others'];
    const sanitizedType = validTypes.includes(type) ? type : 'Enhancement';

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message cannot exceed 2,000 characters.' }, { status: 400 });
    }

    if (email && (typeof email !== 'string' || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const webhookUrl = process.env.GOOGLE_FEEDBACK_WEBHOOK_URL;

    // If webhook isn't configured, fallback to client-side mailto
    if (!webhookUrl) {
      console.warn('GOOGLE_FEEDBACK_WEBHOOK_URL is not set. Falling back to client-side mailto.');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 501 });
    }

    // Forward sanitized data with an 8-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          type: sanitizedType,
          email: email ? sanitizeForSpreadsheet(email.trim()) : 'Anonymous',
          message: sanitizeForSpreadsheet(message.trim()),
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Apps Script responded with ${response.status}`);
      }

      return NextResponse.json({ success: true });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
