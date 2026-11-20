import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_ID_COOKIE,
  revokeAdminSession,
} from "@/lib/auth/require-admin";
import { hasSameOrigin } from "@/lib/auth/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clearSessionCookies(response: NextResponse) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set(ADMIN_SESSION_COOKIE, "", options);
  response.cookies.set(ADMIN_SESSION_ID_COOKIE, "", options);
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await revokeAdminSession();
  } catch {
    return NextResponse.json(
      { error: "Unable to sign out securely. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const response = NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  clearSessionCookies(response);
  return response;
}
