import { NextResponse } from "next/server";

// Authentication remains in each page, route handler, and mutation. This only
// prevents authenticated HTML and API responses from being stored in shared
// caches before application code runs.
export function proxy() {
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/clients/:path*",
    "/api/db-test",
    "/api/galleries/:path*",
    "/api/shoots/:path*",
  ],
};
