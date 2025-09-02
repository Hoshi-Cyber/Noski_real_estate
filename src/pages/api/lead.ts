// src/pages/api/lead.ts
import type { APIRoute } from 'astro';

export const prerender = false;

/** Basic CORS */
const ORIGIN = import.meta.env.PUBLIC_CORS_ORIGIN || '*';
const CORS = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204, headers: CORS });

export const GET: APIRoute = async () =>
  json({ ok: true, ping: 'lead-endpoint' }, 200);

/** Accepts form-encoded, multipart, or JSON. Validates and forwards to webhook(s). */
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await readBody(request);
    const parsed = validateLead(data);
    const enriched = withContext(parsed, request);

    const forwarded = await forward(enriched);
    if (!forwarded.ok) {
      // Soft-fail: still 200 to avoid UX regressions, but include forward status
      console.warn('[lead] forward failed:', forwarded.errors);
    }

    return json({ ok: true }, 200);
  } catch (err: any) {
    return json(
      { ok: false, error: err?.message ?? 'Invalid Request' },
      400
    );
  }
};

/* ---------------- helpers ---------------- */

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS,
    },
  });
}

async function readBody(request: Request) {
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded')) {
    const fd = await request.formData();
    const obj: Record<string, string> = {};
    for (const [k, v] of fd.entries()) obj[k] = String(v);
    return obj;
  }
  if (ct.includes('application/json')) {
    return await request.json();
  }
  // Fallback: try text querystring
  const url = new URL(request.url);
  const obj: Record<string, string> = {};
  url.searchParams.forEach((v, k) => (obj[k] = v));
  return obj;
}

type LeadInput = {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  type?: string;
  source?: string;
  listingId?: string;
  pageUrl?: string;
  pageTitle?: string;
};

function validateLead(raw: Record<string, any>): LeadInput {
  const pick = (k: string) => (raw[k] != null ? String(raw[k]).trim() : '');
  const name = pick('name');
  const phone = pick('phone');
  const email = pick('email');
  const message = pick('message');
  const type = pick('type') || 'enquiry';
  const source = pick('source') || 'web';
  const listingId = pick('listingId') || '';
  const pageUrl = pick('pageUrl') || '';
  const pageTitle = pick('pageTitle') || '';

  if (!name || name.length < 2) throw new Error('Name is required');
  if (!isValidPhone(phone)) throw new Error('Valid phone is required');
  if (email && !isValidEmail(email)) throw new Error('Invalid email');

  return {
    name,
    phone: normalizePhone(phone),
    email: email || undefined,
    message: message || undefined,
    type,
    source,
    listingId: listingId || undefined,
    pageUrl: pageUrl || undefined,
    pageTitle: pageTitle || undefined,
  };
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function isValidPhone(p: string) {
  // allow +, digits, spaces, hyphens. Require at least 7 digits.
  const digits = p.replace(/[^\d]/g, '');
  return digits.length >= 7;
}
function normalizePhone(p: string) {
  const d = p.replace(/[^\d]/g, '');
  // Prefer E.164 without + for WhatsApp compatibility if country prefix provided
  return d;
}

function withContext(input: LeadInput, request: Request) {
  const now = new Date().toISOString();
  const url = new URL(request.url);
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    '';
  const ua = request.headers.get('user-agent') || '';
  return {
    ...input,
    receivedAt: now,
    ip,
    userAgent: ua,
    referer: request.headers.get('referer') || '',
    host: url.origin,
  };
}

async function forward(payload: Record<string, any>) {
  const results: { name: string; ok: boolean; status?: number; error?: string }[] = [];
  const targets = [
    { name: 'PRIMARY_WEBHOOK', url: import.meta.env.LEAD_WEBHOOK_URL as string | undefined },
    { name: 'SECONDARY_WEBHOOK', url: import.meta.env.LEAD_SECONDARY_WEBHOOK_URL as string | undefined },
  ].filter((t) => !!t.url) as { name: string; url: string }[];

  if (targets.length === 0) {
    console.log('[lead] payload (no webhook configured):', payload);
    return { ok: true, errors: [] as string[] };
  }

  for (const t of targets) {
    try {
      const res = await fetch(t.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'lead', payload }),
      });
      results.push({ name: t.name, ok: res.ok, status: res.status, error: res.ok ? undefined : await safeText(res) });
    } catch (e: any) {
      results.push({ name: t.name, ok: false, error: e?.message || 'network_error' });
    }
  }

  const ok = results.some((r) => r.ok);
  const errors = results.filter((r) => !r.ok).map((r) => `${r.name}:${r.status ?? ''} ${r.error ?? ''}`.trim());
  return { ok, errors };
}

async function safeText(res: Response) {
  try { return await res.text(); } catch { return ''; }
}
