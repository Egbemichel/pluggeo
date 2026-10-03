import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin-auth";
import { runDailyReport } from "@/lib/daily-report";

export const dynamic = "force-dynamic";

// Admin-only manual trigger: visit /pluggeo/report while signed in to send the
// daily analytics card to Telegram right now (same card the midnight cron sends).
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return new NextResponse("Not found", { status: 404 });

  try {
    await runDailyReport();
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Manual daily report failed:", error);
    return NextResponse.json(
      { sent: false, error: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}
