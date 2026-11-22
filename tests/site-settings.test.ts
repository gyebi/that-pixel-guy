import assert from "node:assert/strict";
import test from "node:test";
import {
  createSiteSettingsRepository,
  toPublicSiteSettings,
} from "@/lib/site-settings/site-settings-repository-core";
import {
  invalidatePublishedSiteSettings,
  siteSettingsPublicPaths,
} from "@/lib/site-settings/site-settings-publisher-core";
import { createSiteSettingsUpdateHandler } from "@/lib/site-settings/site-settings-update-handler";
import type { SiteSettingsInput, SiteSettingsRecord } from "@/lib/site-settings/site-settings-types";

const origin = "https://studio.example";

const validInput: SiteSettingsInput = {
  businessName: "That Pixel Guy",
  publicEmail: "hello@example.com",
  phoneNumber: "+233 24 000 0000",
  whatsAppNumber: "+233 24 000 0000",
  location: "Accra, Ghana",
  instagramUrl: "https://www.instagram.com/thatpixelguy/",
  facebookUrl: null,
  pinterestUrl: null,
  tikTokUrl: null,
  youTubeUrl: null,
};

function payload(overrides: Record<string, unknown> = {}) {
  return { ...validInput, revision: 1, ...overrides };
}

function request(
  body: unknown,
  options: { origin?: string | null; raw?: string; contentLength?: string } = {},
) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options.origin !== null) headers.set("Origin", options.origin ?? origin);
  if (options.contentLength) headers.set("Content-Length", options.contentLength);
  return new Request(`${origin}/api/admin/site-settings`, {
    method: "PATCH",
    headers,
    body: options.raw ?? JSON.stringify(body),
  });
}

test("site settings singleton initialization is race-safe and updates by expected revision", async () => {
  let current: SiteSettingsRecord | null = null;
  const repository = createSiteSettingsRepository({
    find: async () => current,
    initialize: async (input) => {
      current ??= { id: "site", revision: 1, ...input };
      return current;
    },
    update: async (expectedRevision, input) => {
      if (!current || current.revision !== expectedRevision) return { count: 0 };
      current = { id: "site", revision: current.revision + 1, ...input };
      return { count: 1 };
    },
  });

  const [first, second] = await Promise.all([
    repository.getOrInitialize(),
    repository.getOrInitialize(),
  ]);
  assert.equal(first.id, "site");
  assert.equal(first.revision, 1);
  assert.deepEqual(second, first);

  const updated = await repository.update({ ...validInput, businessName: "New name" }, 1);
  assert.equal(updated.kind, "updated");
  if (updated.kind === "updated") assert.equal(updated.settings.revision, 2);
  assert.equal((await repository.update(validInput, 1)).kind, "conflict");
});

test("site-settings mutations enforce session, origin, bounded JSON, strict fields, and values", async () => {
  let updates = 0;
  const anonymous = createSiteSettingsUpdateHandler({
    getAdminSession: async () => null,
    update: async () => {
      updates += 1;
      return { kind: "conflict" as const };
    },
    publish: () => undefined,
  });
  assert.equal((await anonymous(request(payload()))).status, 401);
  assert.equal(updates, 0);

  const handler = createSiteSettingsUpdateHandler({
    getAdminSession: async () => ({ uid: "approved" }),
    update: async () => ({ kind: "conflict" as const }),
    publish: () => undefined,
  });
  assert.equal((await handler(request(payload(), { origin: null }))).status, 403);
  assert.equal((await handler(request(payload(), { origin: "https://attacker.example" }))).status, 403);
  assert.equal((await handler(request(payload(), { raw: "{" }))).status, 400);
  assert.equal((await handler(request(payload({ unexpected: true })))).status, 400);
  assert.equal((await handler(request(payload(), { contentLength: "16385" }))).status, 413);
  assert.equal((await handler(request(payload({ publicEmail: "not-an-email" })))).status, 400);
  assert.equal((await handler(request(payload({ phoneNumber: "not a phone" })))).status, 400);
  assert.equal((await handler(request(payload({ whatsAppNumber: "123" })))).status, 400);
  assert.equal((await handler(request(payload({ instagramUrl: "http://instagram.com/profile" })))).status, 400);
  assert.equal((await handler(request(payload({ facebookUrl: "https://facebook.example/profile" })))).status, 400);
});

test("a valid settings update publishes only public-safe fields and conflicts do not publish", async () => {
  let received: { input: SiteSettingsInput; revision: number } | undefined;
  let publications = 0;
  const handler = createSiteSettingsUpdateHandler({
    getAdminSession: async () => ({ uid: "approved" }),
    update: async (input, revision) => {
      received = { input, revision };
      return { kind: "updated", settings: { revision: 2 } };
    },
    publish: () => {
      publications += 1;
    },
  });

  const response = await handler(request(payload({ publicEmail: "HELLO@EXAMPLE.COM", phoneNumber: null })));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { settings: { revision: 2 } });
  assert.deepEqual(received, {
    revision: 1,
    input: { ...validInput, publicEmail: "hello@example.com", phoneNumber: null },
  });
  assert.equal(publications, 1);

  const conflict = createSiteSettingsUpdateHandler({
    getAdminSession: async () => ({ uid: "approved" }),
    update: async () => ({ kind: "conflict" as const }),
    publish: () => {
      publications += 1;
    },
  });
  assert.equal((await conflict(request(payload()))).status, 409);
  assert.equal(publications, 1);
});

test("public settings use the static fallback only when no singleton record exists and never expose revisions", () => {
  const fallback = toPublicSiteSettings(null);
  assert.equal(fallback.businessName, "That Pixel Guy");
  assert.equal(fallback.publicEmail, "");
  assert.equal(fallback.phoneNumber, null);
  assert.equal(fallback.whatsAppNumber, null);
  assert.equal(fallback.location, null);
  assert.equal("revision" in fallback, false);
  assert.equal("id" in fallback, false);

  const publicSettings = toPublicSiteSettings({ id: "site", revision: 4, ...validInput });
  assert.deepEqual(publicSettings, validInput);
  assert.equal("mediaKey" in publicSettings, false);
});

test("successful saves invalidate the tagged public settings and affected routes", () => {
  const tags: Array<[string, { expire: number }]> = [];
  const paths: string[] = [];
  invalidatePublishedSiteSettings({
    revalidateTag: (tag, profile) => tags.push([tag, profile]),
    revalidatePath: (path) => paths.push(path),
  });
  assert.deepEqual(tags, [["site-settings", { expire: 0 }]]);
  assert.deepEqual(paths, [...siteSettingsPublicPaths]);
});
