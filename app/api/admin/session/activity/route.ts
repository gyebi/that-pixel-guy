import { NextRequest, NextResponse } from "next/server";
import { renewAdminSession } from "@/lib/auth/require-admin";
import { hasSameOrigin } from "@/lib/auth/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const session = await renewAdminSession();

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
