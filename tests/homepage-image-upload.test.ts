import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { createHomepageImageUploadHandler } from "@/lib/homepage/homepage-image-upload-handler";

const origin = "http://test.local";
const validPng = () => sharp({ create: { width: 1200, height: 800, channels: 3, background: "#333333" } }).png().toBuffer();

function request(options: {
  file?: Uint8Array;
  origin?: string | null;
  slot?: string;
  altText?: string;
  revision?: string;
} = {}) {
  const form = new FormData();
  if (options.file) {
    const copy = new Uint8Array(options.file.byteLength);
    copy.set(options.file);
    form.set("file", new Blob([copy.buffer], { type: "image/png" }), "homepage.png");
  }
  form.set("slot", options.slot ?? "hero");
  form.set("altText", options.altText ?? "Couple celebrating outdoors");
  form.set("revision", options.revision ?? "1");
  return new Request(`${origin}/api/admin/homepage-images`, {
    method: "POST",
    headers: options.origin === null ? undefined : { Origin: options.origin ?? origin },
    body: form,
  });
}

function harness(options?: { admin?: unknown | null; conflict?: boolean; uploadError?: boolean }) {
  const calls = { uploads: 0, updates: 0, published: 0, deletes: [] as string[] };
  const currentImage = { url: "https://res.cloudinary.com/example/image/upload/tpg/homepage/current-photo.jpg", altText: "Existing homepage photograph" };
  const handler = createHomepageImageUploadHandler({
    getAdminSession: async () => options && "admin" in options ? options.admin : { uid: "approved" },
    updateImage: async () => {
      calls.updates += 1;
      if (options?.conflict) return { kind: "conflict" as const };
      currentImage.url = "https://res.cloudinary.com/example/image/upload/tpg/homepage/new-photo.jpg";
      currentImage.altText = "Couple celebrating at sunset";
      return { kind: "updated" as const, settings: { revision: 2 } };
    },
    publish: () => { calls.published += 1; },
    mediaService: {
      uploadHomepageImage: async () => {
        calls.uploads += 1;
        if (options?.uploadError) throw new Error("provider unavailable");
        return { mediaKey: "tpg/homepage/new-photo", url: "https://res.cloudinary.com/example/image/upload/tpg/homepage/new-photo.jpg", width: 1200, height: 800, format: "png", bytes: 100 };
      },
      deleteHomepageImage: async (mediaKey) => { calls.deletes.push(mediaKey); },
    },
    getLimits: () => ({ maxUploadBytes: 10_000, maxImageDimension: 2000, maxImagePixels: 2_000_000 }),
  });
  return { calls, currentImage, handler };
}

test("homepage image uploads require an authenticated, same-origin administrator before reading the file", async () => {
  const anonymous = harness({ admin: null });
  assert.equal((await anonymous.handler(request({ file: await validPng() }))).status, 401);
  assert.equal(anonymous.calls.uploads, 0);

  const crossOrigin = harness();
  assert.equal((await crossOrigin.handler(request({ file: await validPng(), origin: "https://attacker.example" }))).status, 403);
  assert.equal(crossOrigin.calls.uploads, 0);
});

test("homepage image uploads reject invalid positions, alt text, and malformed files without Cloudinary writes", async () => {
  const invalidSlot = harness();
  assert.equal((await invalidSlot.handler(request({ file: await validPng(), slot: "not-a-slot" }))).status, 400);
  assert.equal(invalidSlot.calls.uploads, 0);

  const invalidAlt = harness();
  assert.equal((await invalidAlt.handler(request({ file: await validPng(), altText: "x" }))).status, 400);
  assert.equal(invalidAlt.calls.uploads, 0);

  const invalidImage = harness();
  assert.equal((await invalidImage.handler(request({ file: Buffer.from("not an image") }))).status, 400);
  assert.equal(invalidImage.calls.uploads, 0);
});

test("a successful homepage image replacement publishes only after the image URL and alt text are saved", async () => {
  const { handler, calls, currentImage } = harness();
  const response = await handler(request({ file: await validPng(), slot: "contact", altText: "Couple celebrating at sunset" }));
  assert.equal(response.status, 201);
  assert.equal(calls.uploads, 1);
  assert.equal(calls.updates, 1);
  assert.equal(calls.published, 1);
  assert.deepEqual(calls.deletes, []);
  assert.deepEqual(currentImage, {
    url: "https://res.cloudinary.com/example/image/upload/tpg/homepage/new-photo.jpg",
    altText: "Couple celebrating at sunset",
  });
  assert.deepEqual(await response.json(), {
    image: {
      slot: "contact",
      url: "https://res.cloudinary.com/example/image/upload/tpg/homepage/new-photo.jpg",
      altText: "Couple celebrating at sunset",
      revision: 2,
      width: 1200,
      height: 800,
    },
  });
});

test("a stale replacement leaves the existing mapping untouched and removes only the provisional new asset", async () => {
  const { handler, calls, currentImage } = harness({ conflict: true });
  const response = await handler(request({ file: await validPng() }));
  assert.equal(response.status, 409);
  assert.equal(calls.published, 0);
  assert.deepEqual(calls.deletes, ["tpg/homepage/new-photo"]);
  assert.deepEqual(currentImage, {
    url: "https://res.cloudinary.com/example/image/upload/tpg/homepage/current-photo.jpg",
    altText: "Existing homepage photograph",
  });
});
