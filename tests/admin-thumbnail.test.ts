import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminSessionService,
  hashAdminSessionId,
  type AdminSessionRecord,
  type AdminSessionStore,
} from "@/lib/auth/admin-session-service";
import { createAdminThumbnailHandler } from "@/lib/media/admin-thumbnail-handler";
import { isApprovedPhotoMediaKey } from "@/lib/media/photo-media-key";

const photoId = "photo-1";
const mediaKey = "tpg/shoots/shoot-1/photo-1";
const thumbnailUrl = "https://res.cloudinary.com/example/image/authenticated/s--signature--/c_fill,f_webp,h_400,q_auto,w_400/tpg/shoots/shoot-1/photo-1.webp";

function createHarness(options?: {
  admin?: unknown | null;
  photo?: { mediaKey: string } | null;
  url?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
  logFailure?: (stage: string, details: Record<string, number | string>) => void;
}) {
  const calls = { photoLookups: 0, urlRequests: 0, fetches: 0 };
  const handler = createAdminThumbnailHandler({
    getAdminSession: async () => options?.admin === undefined ? { uid: "approved" } : options.admin,
    getPhotoById: async () => {
      calls.photoLookups += 1;
      return options?.photo === undefined ? { mediaKey } : options.photo;
    },
    getThumbnailUrl: async () => {
      calls.urlRequests += 1;
      return options?.url ?? thumbnailUrl;
    },
    fetch: async (...args) => {
      calls.fetches += 1;
      return options?.fetch ? options.fetch(...args) : new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "image/webp" },
      });
    },
    timeoutMs: options?.timeoutMs,
    maxBytes: options?.maxBytes,
    logFailure: options?.logFailure ?? (() => undefined),
  });
  return { calls, handler };
}

test("proxies only a bounded authenticated WebP thumbnail with private security headers", async () => {
  const { handler } = createHarness();
  const response = await handler(photoId);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/webp");
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("location"), null);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([1, 2, 3]));
});

test("rejects anonymous, expired, and revoked sessions before database lookup", async () => {
  for (const session of [null, null, null]) {
    const { calls, handler } = createHarness({ admin: session });
    const response = await handler(photoId);

    assert.equal(response.status, 401);
    assert.equal(calls.photoLookups, 0);
  }
});

test("GET authorization does not request session renewal", async () => {
  const now = new Date("2026-11-17T12:00:00.000Z");
  const sessionId = "thumbnail-session";
  const record: AdminSessionRecord = {
    sessionIdHash: hashAdminSessionId(sessionId),
    uid: "approved",
    createdAt: now,
    lastActivityAt: now,
    absoluteExpiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    revokedAt: null,
  };
  let renewalCalls = 0;
  const store: AdminSessionStore = {
    create: async () => undefined,
    findByHash: async (sessionIdHash) => sessionIdHash === record.sessionIdHash ? record : null,
    renew: async () => {
      renewalCalls += 1;
      return true;
    },
    revoke: async () => undefined,
  };
  const sessionService = createAdminSessionService(store);
  const handler = createAdminThumbnailHandler({
    getAdminSession: () => sessionService.validate(sessionId, "approved", now),
    getPhotoById: async () => ({ mediaKey }),
    getThumbnailUrl: async () => thumbnailUrl,
    fetch: async () => new Response(new Uint8Array([1]), { headers: { "content-type": "image/webp" } }),
  });

  const response = await handler(photoId);
  assert.equal(response.status, 200);
  assert.equal(renewalCalls, 0);
  assert.equal(record.lastActivityAt.getTime(), now.getTime());
});

test("rejects traversal-style media keys before accessing Cloudinary", async () => {
  assert.equal(isApprovedPhotoMediaKey("tpg/shoots/shoot-1/../original"), false);
  assert.equal(isApprovedPhotoMediaKey(mediaKey), true);
});

test("rejects invalid identifiers and missing photographs without provider access", async () => {
  const invalid = createHarness();
  assert.equal((await invalid.handler("../original")).status, 400);
  assert.equal(invalid.calls.photoLookups, 0);

  const missing = createHarness({ photo: null });
  assert.equal((await missing.handler(photoId)).status, 404);
  assert.equal(missing.calls.urlRequests, 0);
  assert.equal(missing.calls.fetches, 0);
});

test("rejects non-Cloudinary and non-authenticated targets without fetching", async () => {
  const attacker = createHarness({ url: "https://attacker.example/private-image.webp" });
  assert.equal((await attacker.handler(photoId)).status, 502);
  assert.equal(attacker.calls.fetches, 0);

  const original = createHarness({
    url: "https://res.cloudinary.com/example/image/upload/tpg/shoots/shoot-1/photo-1.webp",
  });
  assert.equal((await original.handler(photoId)).status, 502);
  assert.equal(original.calls.fetches, 0);
});

test("rejects unexpected PNG provider content and responses over the thumbnail limit", async () => {
  const diagnostics: Array<{ stage: string; details: Record<string, number | string> }> = [];
  const invalidType = createHarness({
    fetch: async () => new Response(new Uint8Array([137, 80, 78, 71]), { headers: { "content-type": "image/png" } }),
    logFailure: (stage, details) => diagnostics.push({ stage, details }),
  });
  assert.equal((await invalidType.handler(photoId)).status, 502);
  assert.deepEqual(diagnostics, [{
    stage: "thumbnail_invalid_content_type",
    details: {
      responseStatus: 502,
      upstreamStatus: 200,
      contentType: "image/png",
    },
  }]);

  const tooLarge = createHarness({
    maxBytes: 2,
    fetch: async () => new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/webp" } }),
  });
  assert.equal((await tooLarge.handler(photoId)).status, 502);
});

test("returns a safe timeout response without provider details", async () => {
  const { handler } = createHarness({
    timeoutMs: 10,
    fetch: async (_url, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    }),
  });

  const response = await handler(photoId);
  assert.equal(response.status, 504);
  assert.deepEqual(await response.json(), { error: "Thumbnail is unavailable." });
});

test("keeps the abort timeout active while reading the upstream response body", async () => {
  let aborted = false;
  const { handler } = createHarness({
    timeoutMs: 10,
    fetch: async (_url, init) => {
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          init?.signal?.addEventListener("abort", () => {
            aborted = true;
            controller.error(new DOMException("aborted", "AbortError"));
          });
        },
        pull: () => new Promise<void>(() => undefined),
      });
      return new Response(body, { headers: { "content-type": "image/webp" } });
    },
  });

  const response = await handler(photoId);
  assert.equal(response.status, 504);
  assert.equal(aborted, true);
});

test("emits only a fixed stage code and numeric details for failures", async () => {
  const diagnostics: Array<{ stage: string; details: Record<string, number | string> }> = [];
  const { handler } = createHarness({
    url: "https://attacker.example/not-a-thumbnail.webp",
    logFailure: (stage, details) => diagnostics.push({ stage, details }),
  });

  assert.equal((await handler(photoId)).status, 502);
  assert.deepEqual(diagnostics, [{
    stage: "thumbnail_url_allowlist_rejected",
    details: { responseStatus: 502 },
  }]);
});
