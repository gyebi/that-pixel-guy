
import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

const SESSION_DURATION = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
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

    const { idToken } = await request.json();

    if (typeof idToken !== "string" || !idToken) {
      return NextResponse.json(
        { error: "Missing Firebase ID token." },
        { status: 400 },
      );
    }

    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(idToken, true);

    const approvedUid = process.env.FIREBASE_ADMIN_UID;

    if (!approvedUid || decoded.uid !== approvedUid) {
      return NextResponse.json(
        { error: "Not authorized as photographer." },
        { status: 403 },
      );
    }

    // Require a recent Firebase sign-in.
    const signedInAt = decoded.auth_time * 1000;

    if (Date.now() - signedInAt > 5 * 60 * 1000) {
      return NextResponse.json(
        { error: "Please sign in again." },
        { status: 401 },
      );
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION,
    });

    const response = NextResponse.json({ success: true });

    response.cookies.set(ADMIN_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION / 1000,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to establish admin session." },
      { status: 401 },
    );
  }
}
