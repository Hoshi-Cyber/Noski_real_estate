import type { APIRoute } from "astro";

const { SHEETS_WEBHOOK } = import.meta.env as Record<string, string | undefined>;

function getIP(req: Request, fallback?: string) {
  const h = req.headers;
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || fallback || "";
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    // required fields
    const reqd = ["firstName","lastName","phone","email","preferredContact","context"];
    const missing = reqd.filter(k => !String((body as any)[k] || "").trim());
    if (missing.length) {
      return new Response(JSON.stringify({ error: `Missing: ${missing.join(", ")}` }), { status: 422 });
    }
    // KE phone after normalization must be +2547XXXXXXXX
    if (!/^\+2547\d{8}$/.test(String((body as any).phone))) {
      return new Response(JSON.stringify({ error: "Phone must be +2547XXXXXXXX" }), { status: 422 });
    }
    // email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String((body as any).email))) {
      return new Response(JSON.stringify({ error: "Invalid email" }), { status: 422 });
    }

    const id = crypto.randomUUID();
    const ip = getIP(request, clientAddress);

    // Forward to Google Sheets if configured
    if (SHEETS_WEBHOOK) {
      const payload = {
        id,
        ...body,
        ip,
        ts: new Date().toISOString(),
      };
      await fetch(SHEETS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ ok: true, id }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Server error" }), { status: 500 });
  }
};
