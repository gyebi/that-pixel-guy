import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { homepageContentFallback } from "@/lib/site-content";
import {
  createHomepageContentRepository,
  toPublicHomepageContent,
} from "@/lib/homepage/homepage-content-repository-core";
import { emptyHomepageImageFields } from "@/lib/homepage/homepage-image-types";
import {
  homepageContentPublicPaths,
  invalidatePublishedHomepageContent,
} from "@/lib/homepage/homepage-content-publisher-core";
import { createHomepageContentUpdateHandler } from "@/lib/homepage/homepage-content-update-handler";
import type {
  HomepageContentInput,
  HomepageContentRecord,
} from "@/lib/homepage/homepage-content-types";

const origin = "https://studio.example";
const validInput: HomepageContentInput = { ...homepageContentFallback };

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
  return new Request(`${origin}/api/admin/homepage-content`, {
    method: "PATCH",
    headers,
    body: options.raw ?? JSON.stringify(body),
  });
}

test("homepage singleton initializes once and updates atomically by revision", async () => {
  let current: HomepageContentRecord | null = null;
  const repository = createHomepageContentRepository({
    find: async () => current,
    initialize: async (input) => {
      current ??= { id: "homepage", revision: 1, ...input };
      return current;
    },
    update: async (expectedRevision, input) => {
      if (!current || current.revision !== expectedRevision) return { count: 0 };
      current = { ...current, revision: current.revision + 1, ...input };
      return { count: 1 };
    },
    updateImage: async (_slot, _imageUrl, _imageAlt, expectedRevision) => {
      if (!current || current.revision !== expectedRevision) return { count: 0 };
      return { count: 1 };
    },
  });

  const [first, second] = await Promise.all([
    repository.getOrInitialize(),
    repository.getOrInitialize(),
  ]);
  assert.deepEqual(first, second);
  assert.equal(first.id, "homepage");
  assert.equal(first.revision, 1);

  const updated = await repository.update({ ...validInput, heroCtaLabel: "Enquire now" }, 1);
  assert.equal(updated.kind, "updated");
  if (updated.kind === "updated") assert.equal(updated.settings.revision, 2);
  assert.equal((await repository.update(validInput, 1)).kind, "conflict");
});

test("concurrent homepage image replacements use the revision guard so only one can publish", async () => {
  let current: HomepageContentRecord = {
    id: "homepage",
    revision: 1,
    ...validInput,
    ...emptyHomepageImageFields(),
  };
  const repository = createHomepageContentRepository({
    find: async () => current,
    initialize: async () => current,
    update: async () => ({ count: 0 }),
    updateImage: async (_slot, imageUrl, imageAlt, expectedRevision) => {
      await Promise.resolve();
      if (current.revision !== expectedRevision) return { count: 0 };
      current = {
        ...current,
        heroImageUrl: imageUrl,
        heroImageAlt: imageAlt,
        revision: current.revision + 1,
      };
      return { count: 1 };
    },
  });

  const [first, second] = await Promise.all([
    repository.updateImage("hero", "https://images.example/one.jpg", "First replacement", 1),
    repository.updateImage("hero", "https://images.example/two.jpg", "Second replacement", 1),
  ]);

  assert.deepEqual([first.kind, second.kind].sort(), ["conflict", "updated"]);
  assert.equal(current.revision, 2);
  assert.equal(current.heroImageUrl, "https://images.example/one.jpg");
  assert.equal(current.heroImageAlt, "First replacement");
});

test("homepage mutations reject unauthenticated, cross-origin, malformed, oversized, and unexpected payloads", async () => {
  let updates = 0;
  const anonymous = createHomepageContentUpdateHandler({
    getAdminSession: async () => null,
    update: async () => {
      updates += 1;
      return { kind: "conflict" as const };
    },
    publish: () => undefined,
  });
  assert.equal((await anonymous(request(payload()))).status, 401);
  assert.equal(updates, 0);

  const handler = createHomepageContentUpdateHandler({
    getAdminSession: async () => ({ uid: "approved" }),
    update: async () => ({ kind: "conflict" as const }),
    publish: () => undefined,
  });
  assert.equal((await handler(request(payload(), { origin: null }))).status, 403);
  assert.equal((await handler(request(payload(), { origin: "https://attacker.example" }))).status, 403);
  assert.equal((await handler(request(payload(), { raw: "{" }))).status, 400);
  assert.equal((await handler(request(payload({ unexpected: true })))).status, 400);
  assert.equal((await handler(request(payload(), { contentLength: "16385" }))).status, 413);
  assert.equal((await handler(request(payload({ heroEyebrow: "x".repeat(121) })))).status, 400);
  assert.equal((await handler(request(payload({ heroIntro: "x".repeat(601) })))).status, 400);
  assert.equal((await handler(request(payload({ introBody: "One\ntwo" })))).status, 400);
  assert.equal((await handler(request(payload({ heroHeading: "one\ntwo\nthree\nfour" })))).status, 400);
  assert.equal((await handler(request(payload({ revision: 0 })))).status, 400);
});

test("homepage updates normalize permitted heading line breaks, publish once, and return conflicts safely", async () => {
  let received: { input: HomepageContentInput; revision: number } | undefined;
  let publications = 0;
  const handler = createHomepageContentUpdateHandler({
    getAdminSession: async () => ({ uid: "approved" }),
    update: async (input, revision) => {
      received = { input, revision };
      return { kind: "updated", settings: { revision: 2 } };
    },
    publish: () => {
      publications += 1;
    },
  });

  const response = await handler(request(payload({ heroHeading: "A line\r\nAnother line" })));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(received?.input.heroHeading, "A line\nAnother line");
  assert.equal(publications, 1);

  const conflict = createHomepageContentUpdateHandler({
    getAdminSession: async () => ({ uid: "approved" }),
    update: async () => ({ kind: "conflict" as const }),
    publish: () => {
      publications += 1;
    },
  });
  assert.equal((await conflict(request(payload()))).status, 409);
  assert.equal(publications, 1);
});

test("public homepage content falls back safely and excludes internal singleton fields", () => {
  const fallback = toPublicHomepageContent(null);
  assert.deepEqual(fallback, { ...validInput, ...emptyHomepageImageFields() });
  assert.equal("id" in fallback, false);
  assert.equal("revision" in fallback, false);

  const projected = toPublicHomepageContent({ id: "homepage", revision: 3, ...validInput, ...emptyHomepageImageFields() });
  assert.deepEqual(projected, { ...validInput, ...emptyHomepageImageFields() });
});

test("homepage saves invalidate only the homepage content tag and route", () => {
  const tags: Array<[string, { expire: number }]> = [];
  const paths: string[] = [];
  invalidatePublishedHomepageContent({
    revalidateTag: (tag, profile) => tags.push([tag, profile]),
    revalidatePath: (path) => paths.push(path),
  });
  assert.deepEqual(tags, [["homepage-content", { expire: 0 }]]);
  assert.deepEqual(paths, [...homepageContentPublicPaths]);
});

test("homepage uses persisted image replacements while retaining the established layout and copy controls", async () => {
  const [page, siteContent, css] = await Promise.all([
    readFile("app/page.tsx", "utf8"),
    readFile("lib/site-content.ts", "utf8"),
    readFile("app/globals.css", "utf8"),
  ]);
  assert.match(page, /contact\.email \? <a href="#contact"/);
  assert.match(page, /href="#portfolio"/);
  assert.match(page, /href=\{contact\.email\.href\}/);
  assert.match(page, /getHomepageImage/);
  assert.match(css, /celebration-hero\.jpg/);
  assert.match(css, /celebration-contact\.jpg/);
  assert.match(page, /selectedWork\.map/);
  assert.doesNotMatch(page, /journalPosts|testimonials|Testimonial/);
  assert.doesNotMatch(siteContent, /38 stories|24 stories|16 stories/);
  assert.match(page, /className="homepage-managed-heading"/);
});
