import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Session expired. Please sign in again." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      session: {
        idleExpiresAt: session.idleExpiresAt.toISOString(),
        absoluteExpiresAt: session.absoluteExpiresAt.toISOString(),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
