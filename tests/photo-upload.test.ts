import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { createPhotoUploadHandler } from "@/lib/uploads/photo-upload-handler";

const validPng = (width = 1200, height = 800) =>
  sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 30, g: 30, b: 30 },
    },
  })
    .png()
    .toBuffer();

function uploadRequest(
  contents: Uint8Array,
  name = "photo.png",
  contentType = "image/png",
  requestOrigin: string | null = "http://test.local",
) {
  const form = new FormData();
  const copy = new Uint8Array(contents.byteLength);
  copy.set(contents);
  form.set("file", new Blob([copy.buffer], { type: contentType }), name);
  return new Request("http://test.local/api/shoots/shoot-1/photos", {
    method: "POST",
    headers: requestOrigin ? { Origin: requestOrigin } : undefined,
    body: form,
  });
}

function createHarness(options?: {
  admin?: unknown | null;
  shoot?: { id: string } | null;
  uploadError?: boolean;
  databaseError?: boolean;
  limits?: { maxUploadBytes: number; maxImageDimension: number; maxImagePixels: number };
}) {
  const calls = {
    getShoot: 0,
    uploads: [] as Array<{ folder: string; filename: string }>,
    create: [] as Array<{ shootId: string; mediaKey: string; width: number; height: number }>,
    deletes: [] as string[],
  };
  const handler = createPhotoUploadHandler({
    getAdminSession: async () =>
      options && "admin" in options ? options.admin : { uid: "approved" },
    getShootById: async () => {
      calls.getShoot += 1;
      return options?.shoot === undefined ? { id: "shoot-1" } : options.shoot;
    },
    createPhoto: async (input) => {
      calls.create.push(input);
      if (options?.databaseError) throw new Error("database unavailable");
      return { id: "photo-1" };
    },
    mediaService: {
      uploadPhoto: async (input) => {
        calls.uploads.push({ folder: input.folder, filename: input.filename });
        if (options?.uploadError) throw new Error("provider failure");
        return { mediaKey: "private-key", width: 1200, height: 800, format: "png", bytes: input.buffer.length };
      },
      deletePhoto: async (mediaKey) => {
        calls.deletes.push(mediaKey);
      },
    },
    getLimits: () => options?.limits ?? {
      maxUploadBytes: 10_000,
      maxImageDimension: 2000,
      maxImagePixels: 2_000_000,
    },
  });
  return { calls, handler };
}

test("rejects anonymous and unapproved upload attempts before reading the shoot or file", async () => {
  const { handler, calls } = createHarness({ admin: null });
  const response = await handler(uploadRequest(await validPng()), "shoot-1");

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized. Photographer login required." });
  assert.equal(calls.getShoot, 0);
  assert.equal(calls.uploads.length, 0);
});

test("rejects upload requests without a matching origin before reading the shoot or file", async () => {
  const { handler, calls } = createHarness();
  const missingOrigin = await handler(uploadRequest(await validPng(), "photo.png", "image/png", null), "shoot-1");
  const invalidOrigin = await handler(uploadRequest(await validPng(), "photo.png", "image/png", "https://attacker.example"), "shoot-1");

  assert.equal(missingOrigin.status, 403);
  assert.equal(invalidOrigin.status, 403);
  assert.equal(calls.getShoot, 0);
  assert.equal(calls.uploads.length, 0);
});

test("rejects a missing shoot without uploading", async () => {
  const { handler, calls } = createHarness({ shoot: null });
  const response = await handler(uploadRequest(await validPng()), "missing-shoot");

  assert.equal(response.status, 404);
  assert.equal(calls.uploads.length, 0);
  assert.equal(calls.create.length, 0);
});

test("rejects malformed and unsupported files", async () => {
  const { handler, calls } = createHarness();
  const response = await handler(uploadRequest(Buffer.from("not an image"), "photo.jpg", "image/jpeg"), "shoot-1");

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "The image is malformed or unsupported." });
  assert.equal(calls.uploads.length, 0);
});

test("accepts JPEG and WebP by decoded file content rather than supplied MIME type", async () => {
  for (const format of ["jpeg", "webp"] as const) {
    const buffer = await sharp({
      create: {
        width: 320,
        height: 240,
        channels: 3,
        background: { r: 30, g: 30, b: 30 },
      },
    })
      .toFormat(format)
      .toBuffer();
    const { handler, calls } = createHarness();
    const response = await handler(
      uploadRequest(buffer, `photo.${format}`, "application/octet-stream"),
      "shoot-1",
    );

    assert.equal(response.status, 201);
    assert.equal(calls.create[0]?.width, 320);
    assert.equal(calls.create[0]?.height, 240);
  }
});

test("rejects oversized files and excessive image dimensions", async () => {
  const oversized = createHarness({ limits: { maxUploadBytes: 32, maxImageDimension: 2000, maxImagePixels: 2_000_000 } });
  const oversizedResponse = await oversized.handler(uploadRequest(await validPng()), "shoot-1");
  assert.equal(oversizedResponse.status, 413);
  assert.equal(oversized.calls.uploads.length, 0);

  const dimensions = createHarness({ limits: { maxUploadBytes: 1024, maxImageDimension: 1000, maxImagePixels: 1_000_000 } });
  const dimensionsResponse = await dimensions.handler(uploadRequest(await validPng(1200, 800)), "shoot-1");
  assert.equal(dimensionsResponse.status, 413);
  assert.equal(dimensions.calls.uploads.length, 0);
});

test("returns a safe error when Cloudinary storage fails", async () => {
  const { handler, calls } = createHarness({ uploadError: true });
  const response = await handler(uploadRequest(await validPng()), "shoot-1");

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "Unable to store the photograph." });
  assert.equal(calls.create.length, 0);
});

test("deletes the authenticated asset when database persistence fails", async () => {
  const { handler, calls } = createHarness({ databaseError: true });
  const response = await handler(uploadRequest(await validPng()), "shoot-1");

  assert.equal(response.status, 503);
  assert.deepEqual(calls.deletes, ["private-key"]);
});

test("persists verified metadata for the requested shoot without leaking private delivery data", async () => {
  const { handler, calls } = createHarness();
  const response = await handler(uploadRequest(await validPng(1200, 800), "wedding.png"), "shoot-1");
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(calls.uploads, [{ folder: "tpg/shoots/shoot-1", filename: "wedding.png" }]);
  assert.deepEqual(calls.create, [{
    shootId: "shoot-1",
    mediaKey: "private-key",
    width: 1200,
    height: 800,
    originalFilename: "wedding.png",
    altText: "",
  }]);
  assert.deepEqual(body, { photo: { id: "photo-1", width: 1200, height: 800, format: "png" } });
  assert.doesNotMatch(JSON.stringify(body), /private-key|cloudinary|https?:\/\//i);
});
