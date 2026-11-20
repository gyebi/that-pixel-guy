type RejectedOriginDiagnostic = {
  stage: "admin_origin_rejected";
  requestUrlOriginValid: boolean;
  originMatchesRequestUrl: boolean;
  forwardedHostPresent: boolean;
  forwardedProtoPresent: boolean;
  forwardedOriginValid: boolean;
  forwardedOriginMatchesOrigin: boolean;
};

function getForwardedOrigin(request: Request) {
  const host = request.headers.get("x-forwarded-host");
  const protocol = request.headers.get("x-forwarded-proto");

  if (!host || !protocol || host.includes(",") || protocol.includes(",")) {
    return null;
  }

  try {
    const url = new URL(`${protocol.toLowerCase()}://${host}`);
    return !url.username && !url.password ? url.origin : null;
  } catch {
    return null;
  }
}

function reportRejectedOrigin(diagnostic: RejectedOriginDiagnostic) {
  if (process.env.ADMIN_ORIGIN_DIAGNOSTICS === "1") {
    // Intentionally log only fixed stages and booleans: no origins, URLs,
    // raw headers, cookies, credentials, request bodies, or provider details.
    console.warn("[Admin Origin]", diagnostic);
  }
}

/**
 * This diagnostic-stage guard intentionally preserves the original acceptance
 * rule. Forwarded headers are observed only for diagnostics and never used to
 * authorize an admin mutation.
 */
export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const forwardedOrigin = getForwardedOrigin(request);
  let requestUrlOrigin: string | null = null;

  try {
    requestUrlOrigin = new URL(request.url).origin;
  } catch {
    // Keep the original fail-closed behavior for malformed request URLs.
  }

  const accepted = origin !== null && origin === requestUrlOrigin;

  if (!accepted) {
    reportRejectedOrigin({
      stage: "admin_origin_rejected",
      requestUrlOriginValid: requestUrlOrigin !== null,
      originMatchesRequestUrl: origin !== null && origin === requestUrlOrigin,
      forwardedHostPresent: request.headers.has("x-forwarded-host"),
      forwardedProtoPresent: request.headers.has("x-forwarded-proto"),
      forwardedOriginValid: forwardedOrigin !== null,
      forwardedOriginMatchesOrigin: origin !== null && origin === forwardedOrigin,
    });
  }

  return accepted;
}
