
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Photographer login required." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    // A count verifies the database connection without loading client records.
    await prisma.client.count();

    return NextResponse.json(
      { database: "connected" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // Deliberately avoid returning database or authentication error details.
    return NextResponse.json(
      { database: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
