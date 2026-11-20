const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024;
const THUMBNAIL_TIMEOUT_MS = 8_000;
const validPhotoId = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

type ThumbnailPhoto = {
  mediaKey: string;
};

type Dependencies = {
  getAdminSession: () => Promise<unknown | null>;
  getPhotoById: (id: string) => Promise<ThumbnailPhoto | null>;
  getThumbnailUrl: (mediaKey: string) => Promise<string>;
  fetch?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
  logFailure?: (stage: ThumbnailFailureStage, details: ThumbnailFailureDetails) => void;
};

type ThumbnailFailureStage =
  | "thumbnail_url_generation_exception"
  | "thumbnail_url_allowlist_rejected"
  | "thumbnail_upstream_fetch_exception"
  | "thumbnail_upstream_http_error"
  | "thumbnail_invalid_content_type"
  | "thumbnail_response_oversized"
  | "thumbnail_response_body_failure";

type UpstreamContentType =
  | "image/webp"
  | "image/jpeg"
  | "image/png"
  | "image/avif"
  | "text/html"
  | "application/json"
  | "missing"
  | "other";

type ThumbnailFailureDetails = Record<string, number | UpstreamContentType>;

function securityHeaders(contentType?: string) {
  const headers = new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  });

  if (contentType) headers.set("Content-Type", contentType);
  return headers;
}

function errorResponse(status: 400 | 401 | 404 | 502 | 503 | 504, message: string) {
  return Response.json({ error: message }, { status, headers: securityHeaders("application/json") });
}

function isApprovedAuthenticatedCloudinaryUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      /^\/[a-z0-9_-]+\/image\/authenticated\//i.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function contentLength(response: Response) {
  const value = response.headers.get("content-length");
  if (!value) return null;

  const size = Number(value);
  return Number.isSafeInteger(size) && size >= 0 ? size : null;
}

function classifyUpstreamContentType(value: string | null): UpstreamContentType {
  const normalized = value?.split(";", 1)[0]?.trim().toLowerCase();

  switch (normalized) {
    case "image/webp":
    case "image/jpeg":
    case "image/png":
    case "image/avif":
    case "text/html":
    case "application/json":
      return normalized;
    case undefined:
    case "":
      return "missing";
    default:
      return "other";
  }
}

async function readBoundedImage(response: Response, maxBytes: number) {
  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const image = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    image.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return image;
}

export function createAdminThumbnailHandler(dependencies: Dependencies) {
  const fetchImage = dependencies.fetch ?? fetch;
  const timeoutMs = dependencies.timeoutMs ?? THUMBNAIL_TIMEOUT_MS;
  const maxBytes = dependencies.maxBytes ?? MAX_THUMBNAIL_BYTES;
  const logFailure = dependencies.logFailure ?? ((stage, details) => {
    console.warn("[Admin Thumbnail]", { stage, ...details });
  });

  return async function getThumbnail(photoId: string) {
    let admin: unknown | null;
    try {
      // getAdminSession validates Firebase and persisted AdminSession state only.
      // It deliberately does not call renewAdminSession for thumbnail GET requests.
      admin = await dependencies.getAdminSession();
    } catch {
      return errorResponse(503, "Thumbnail service is unavailable.");
    }

    if (!admin) {
      return errorResponse(401, "Unauthorized. Photographer login required.");
    }

    if (!validPhotoId.test(photoId)) {
      return errorResponse(400, "Invalid photograph ID.");
    }

    let photo: ThumbnailPhoto | null;
    try {
      photo = await dependencies.getPhotoById(photoId);
    } catch {
      return errorResponse(503, "Thumbnail service is unavailable.");
    }

    if (!photo) {
      return errorResponse(404, "Photograph not found.");
    }

    let thumbnailUrl: string;
    try {
      thumbnailUrl = await dependencies.getThumbnailUrl(photo.mediaKey);
    } catch {
      logFailure("thumbnail_url_generation_exception", { responseStatus: 502 });
      return errorResponse(502, "Thumbnail is unavailable.");
    }

    if (!isApprovedAuthenticatedCloudinaryUrl(thumbnailUrl)) {
      logFailure("thumbnail_url_allowlist_rejected", { responseStatus: 502 });
      return errorResponse(502, "Thumbnail is unavailable.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let upstream: Response;
      try {
        upstream = await fetchImage(thumbnailUrl, {
          signal: controller.signal,
          redirect: "error",
          headers: { Accept: "image/webp" },
        });
      } catch {
        const responseStatus = controller.signal.aborted ? 504 : 502;
        logFailure("thumbnail_upstream_fetch_exception", {
          responseStatus,
          timedOut: controller.signal.aborted ? 1 : 0,
          timeoutMs,
        });
        return errorResponse(responseStatus, "Thumbnail is unavailable.");
      }

      if (!upstream.ok) {
        logFailure("thumbnail_upstream_http_error", {
          responseStatus: 502,
          upstreamStatus: upstream.status,
        });
        return errorResponse(502, "Thumbnail is unavailable.");
      }

      const contentType = classifyUpstreamContentType(upstream.headers.get("content-type"));
      if (contentType !== "image/webp") {
        logFailure("thumbnail_invalid_content_type", {
          responseStatus: 502,
          upstreamStatus: upstream.status,
          contentType,
        });
        return errorResponse(502, "Thumbnail is unavailable.");
      }

      const declaredLength = contentLength(upstream);
      if (declaredLength !== null && declaredLength > maxBytes) {
        logFailure("thumbnail_response_oversized", {
          responseStatus: 502,
          upstreamStatus: upstream.status,
          declaredBytes: declaredLength,
          maxBytes,
        });
        return errorResponse(502, "Thumbnail is unavailable.");
      }

      let image: Uint8Array | null;
      try {
        image = await readBoundedImage(upstream, maxBytes);
      } catch {
        const responseStatus = controller.signal.aborted ? 504 : 502;
        logFailure("thumbnail_response_body_failure", {
          responseStatus,
          upstreamStatus: upstream.status,
          timedOut: controller.signal.aborted ? 1 : 0,
        });
        return errorResponse(responseStatus, "Thumbnail is unavailable.");
      }
      if (!image) {
        logFailure("thumbnail_response_oversized", {
          responseStatus: 502,
          upstreamStatus: upstream.status,
          maxBytes,
        });
        return errorResponse(502, "Thumbnail is unavailable.");
      }

      const body = new ArrayBuffer(image.byteLength);
      new Uint8Array(body).set(image);

      return new Response(body, {
        status: 200,
        headers: securityHeaders("image/webp"),
      });
    } finally {
      clearTimeout(timeout);
    }
  };
}
