import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { runCleanup } from "@/lib/cleanup";

export const maxDuration = 60;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

async function handle(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runCleanup();
    if (result.failed > 0) console.error("[cleanup] failures", result.errors);
    return NextResponse.json(
      { ok: true, ranAt: new Date().toISOString(), ...result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cleanup] run failed", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// Vercel Cron sends GET, Supabase Cron (pg_net) sends POST.
export const GET = handle;
export const POST = handle;
