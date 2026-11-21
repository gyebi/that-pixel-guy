/**
 * Returns an exact, canonical HTTPS origin suitable for the production
 * allowlist. `URL#origin` canonicalizes host casing and default ports, so the
 * input must already equal it rather than merely normalizing to it.
 */
function canonicalHttpsOrigin(value: string): string | null {
  if (!value || value.includes("*") || value.includes(",")) {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      value !== url.origin
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Parses the comma-separated production allowlist without accepting a partly
 * valid configuration. A duplicate indicates an ambiguous configuration, so
 * fail closed instead of silently de-duplicating it.
 */
function trustedProductionOrigins(value = process.env.ADMIN_TRUSTED_ORIGINS) {
  if (!value) return null;

  const entries = value.split(",");
  const origins = entries.map(canonicalHttpsOrigin);

  if (origins.some((origin) => origin === null)) return null;

  const trustedOrigins = origins as string[];
  return new Set(trustedOrigins).size === trustedOrigins.length
    ? new Set(trustedOrigins)
    : null;
}

/**
 * Protects cookie-authenticated admin mutations from cross-site requests.
 *
 * App Hosting sends the browser's hosted.app request to Cloud Run, where the
 * internal request URL uses a run.app hostname. In production the browser's
 * Origin is therefore checked against an explicit server-side allowlist, never
 * against request URL, Host, or X-Forwarded-* headers. Development keeps the
 * original same-origin comparison so local HTTP origins continue to work.
 */
export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  if (process.env.NODE_ENV === "production") {
    const canonicalOrigin = canonicalHttpsOrigin(origin);
    const trustedOrigins = trustedProductionOrigins();
    return canonicalOrigin !== null && trustedOrigins?.has(canonicalOrigin) === true;
  }

  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
