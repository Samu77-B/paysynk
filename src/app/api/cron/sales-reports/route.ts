import { NextResponse } from "next/server";
import { sendDueSalesReports } from "@/lib/email/sales-report";

export const runtime = "nodejs";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendDueSalesReports();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("sales-reports cron failed", err);
    return NextResponse.json({ error: "Report failed" }, { status: 500 });
  }
}
