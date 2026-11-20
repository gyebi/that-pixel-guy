
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { createAdminSessionService } from "@/lib/auth/admin-session-service";
import { adminSessionRepository } from "@/lib/repositories/admin-session-repository";

export const ADMIN_SESSION_COOKIE = "tpg-admin-session";
export const ADMIN_SESSION_ID_COOKIE = "tpg-admin-session-id";

export async function getAdminSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const sessionId = cookieStore.get(ADMIN_SESSION_ID_COOKIE)?.value;

  // Firebase-only cookies created before AdminSession was introduced are not
  // sufficient. The photographer must sign in again to receive a durable,
  // revocable server-side session.
  if (!sessionCookie || !sessionId) {
    return null;
  }

  const approvedUid = process.env.FIREBASE_ADMIN_UID;

  if (!approvedUid) {
    throw new Error("FIREBASE_ADMIN_UID is not configured.");
  }

  try {
    const decoded = await getFirebaseAdminAuth()
      .verifySessionCookie(sessionCookie, true);

    if (decoded.uid !== approvedUid) {
      return null;
    }

    return await createAdminSessionService(adminSessionRepository).validate(
      sessionId,
      decoded.uid,
    );
  } catch {
    return null;
  }
}

export async function renewAdminSession() {
  const session = await getAdminSession();
  const sessionId = (await cookies()).get(ADMIN_SESSION_ID_COOKIE)?.value;

  if (!session || !sessionId) {
    return null;
  }

  try {
    return await createAdminSessionService(adminSessionRepository).renew(
      sessionId,
      session.uid,
    );
  } catch {
    return null;
  }
}

export async function revokeAdminSession() {
  const sessionId = (await cookies()).get(ADMIN_SESSION_ID_COOKIE)?.value;

  if (!sessionId) {
    return;
  }

  await createAdminSessionService(adminSessionRepository).revoke(sessionId);
}

export async function requireAdmin() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}
