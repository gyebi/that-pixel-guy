import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_ID_COOKIE,
} from "@/lib/auth/require-admin";
import {
  ADMIN_ABSOLUTE_TIMEOUT_MS,
  createAdminSessionService,
} from "@/lib/auth/admin-session-service";
import { hasSameOrigin } from "@/lib/auth/same-origin";
import { adminSessionRepository } from "@/lib/repositories/admin-session-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ID_TOKEN_LENGTH = 16 * 1024;

function noStoreJson(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function setSessionCookies(
  response: NextResponse,
  firebaseSessionCookie: string,
  sessionId: string,
) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ADMIN_ABSOLUTE_TIMEOUT_MS / 1000,
  };

  response.cookies.set(ADMIN_SESSION_COOKIE, firebaseSessionCookie, options);
  response.cookies.set(ADMIN_SESSION_ID_COOKIE, sessionId, options);
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return noStoreJson({ error: "Invalid request origin." }, 403);
  }

  try {
    const body: unknown = await request.json();
    const idToken =
      body && typeof body === "object" && "idToken" in body
        ? (body as { idToken?: unknown }).idToken
        : null;

    if (
      typeof idToken !== "string" ||
      idToken.length === 0 ||
      idToken.length > MAX_ID_TOKEN_LENGTH
    ) {
      return noStoreJson({ error: "Unable to establish Admin session." }, 400);
    }

    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(idToken, true);
    const approvedUid = process.env.FIREBASE_ADMIN_UID;

    if (!approvedUid || decoded.uid !== approvedUid) {
      return noStoreJson({ error: "Not authorized as photographer." }, 403);
    }

    const signedInAt = decoded.auth_time * 1000;
    if (!Number.isFinite(signedInAt) || Date.now() - signedInAt > 5 * 60 * 1000) {
      return noStoreJson({ error: "Please sign in again." }, 401);
    }

    const firebaseSessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: ADMIN_ABSOLUTE_TIMEOUT_MS,
    });
    const created = await createAdminSessionService(adminSessionRepository).create(
      decoded.uid,
    );
    const response = noStoreJson({
      success: true,
      session: {
        idleExpiresAt: created.session.idleExpiresAt.toISOString(),
        absoluteExpiresAt: created.session.absoluteExpiresAt.toISOString(),
      },
    });

    setSessionCookies(response, firebaseSessionCookie, created.sessionId);
    return response;
  } catch {
    // Do not log ID tokens, session identifiers, or provider error details.
    return noStoreJson({ error: "Unable to establish Admin session." }, 401);
  }
}
