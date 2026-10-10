
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export const ADMIN_SESSION_COOKIE = "tpg-admin-session";

export async function getAdminSession() {
  const sessionCookie = (await cookies()).get(
    ADMIN_SESSION_COOKIE,
  )?.value;

  if (!sessionCookie) {
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

    return decoded;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}
