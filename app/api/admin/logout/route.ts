import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  const allowedOrigins = new Set([
    "http://localhost:3000",
    "https://that-pixel-guy--itconferencegh.us-east4.hosted.app",
  ]);

  if (!origin || !allowedOrigins.has(origin)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}