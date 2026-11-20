import assert from "node:assert/strict";
import test from "node:test";
import {
  createClientCreateHandler,
  createGalleryCreateHandler,
  createShootCreateHandler,
} from "@/lib/admin/admin-create-handlers";

const origin = "https://studio.example";

function jsonRequest(
  path: string,
  body: unknown,
  options: { origin?: string | null; contentLength?: string; raw?: string } = {},
) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options.origin !== null) headers.set("Origin", options.origin ?? origin);
  if (options.contentLength) headers.set("Content-Length", options.contentLength);

  return new Request(`${origin}${path}`, {
    method: "POST",
    headers,
    body: options.raw ?? JSON.stringify(body),
  });
}

test("legacy create handlers deny missing, expired, and cross-origin admin sessions before repository access", async () => {
  let lookups = 0;
  const handler = createClientCreateHandler({
    getAdminSession: async () => null,
    getByEmail: async () => {
      lookups += 1;
      return null;
    },
    create: async () => ({ id: "client-1" }),
  });

  assert.equal((await handler(jsonRequest("/api/clients", { name: "Test", email: "test@example.com" }))).status, 401);
  assert.equal(lookups, 0);

  const authenticated = createClientCreateHandler({
    getAdminSession: async () => ({ uid: "approved" }),
    getByEmail: async () => {
      lookups += 1;
      return null;
    },
    create: async () => ({ id: "client-1" }),
  });
  assert.equal((await authenticated(jsonRequest("/api/clients", { name: "Test", email: "test@example.com" }, { origin: null }))).status, 403);
  assert.equal((await authenticated(jsonRequest("/api/clients", { name: "Test", email: "test@example.com" }, { origin: "https://attacker.example" }))).status, 403);
  assert.equal(lookups, 0);
});

test("client creation bounds and validates JSON before database operations", async () => {
  let lookups = 0;
  let creates = 0;
  const handler = createClientCreateHandler({
    getAdminSession: async () => ({ uid: "approved" }),
    getByEmail: async () => {
      lookups += 1;
      return null;
    },
    create: async () => {
      creates += 1;
      return { id: "client-1" };
    },
  });

  assert.equal((await handler(jsonRequest("/api/clients", null, { raw: "{" }))).status, 400);
  assert.equal((await handler(jsonRequest("/api/clients", { name: "Test", email: "test@example.com", status: "Active" }))).status, 400);
  assert.equal((await handler(jsonRequest("/api/clients", { name: "Test", email: "not-an-email" }))).status, 400);
  assert.equal((await handler(jsonRequest("/api/clients", { name: "Test", email: "test@example.com" }, { contentLength: "16385" }))).status, 413);
  assert.equal(lookups, 0);
  assert.equal(creates, 0);
});

test("valid client, shoot, and gallery creation preserve legitimate form payloads and no-store responses", async () => {
  let clientInput: unknown;
  const clientHandler = createClientCreateHandler({
    getAdminSession: async () => ({ uid: "approved" }),
    getByEmail: async () => null,
    create: async (input) => {
      clientInput = input;
      return { id: "client-1", ...input };
    },
  });
  const clientResponse = await clientHandler(jsonRequest("/api/clients", {
    name: "  Test Client  ",
    email: "TEST@EXAMPLE.COM",
  }));
  assert.equal(clientResponse.status, 201);
  assert.equal(clientResponse.headers.get("cache-control"), "no-store");
  assert.deepEqual(clientInput, {
    name: "Test Client",
    email: "test@example.com",
    initials: "TC",
  });

  let shootInput: unknown;
  const shootHandler = createShootCreateHandler({
    getAdminSession: async () => ({ uid: "approved" }),
    getClientById: async () => ({ id: "client-1" }),
    create: async (input) => {
      shootInput = input;
      return { id: "shoot-1" };
    },
  });
  assert.equal((await shootHandler(jsonRequest("/api/shoots", {
    clientId: "client-1",
    name: "Portrait session",
    date: "2026-12-05",
  }))).status, 201);
  assert.deepEqual(shootInput, {
    clientId: "client-1",
    name: "Portrait session",
    date: new Date("2026-12-05T12:00:00.000Z"),
  });

  let galleryInput: unknown;
  const galleryHandler = createGalleryCreateHandler({
    getAdminSession: async () => ({ uid: "approved" }),
    getShootById: async () => ({ id: "shoot-1" }),
    create: async (input) => {
      galleryInput = input;
      return { id: "gallery-1" };
    },
  });
  assert.equal((await galleryHandler(jsonRequest("/api/galleries", {
    shootId: "shoot-1",
    name: "Portrait gallery",
    expiresOn: "",
  }))).status, 201);
  assert.deepEqual(galleryInput, {
    shootId: "shoot-1",
    name: "Portrait gallery",
    expiresOn: null,
    downloadsEnabled: false,
  });
});

test("shoot and gallery creation reject unknown fields, malformed identifiers, and calendar-invalid dates", async () => {
  let creates = 0;
  const shootHandler = createShootCreateHandler({
    getAdminSession: async () => ({ uid: "approved" }),
    getClientById: async () => ({ id: "client-1" }),
    create: async () => {
      creates += 1;
      return { id: "shoot-1" };
    },
  });
  assert.equal((await shootHandler(jsonRequest("/api/shoots", {
    clientId: "bad/id",
    name: "Portrait session",
    date: "2026-12-05",
  }))).status, 400);
  assert.equal((await shootHandler(jsonRequest("/api/shoots", {
    clientId: "client-1",
    name: "Portrait session",
    date: "2026-02-30",
  }))).status, 400);

  const galleryHandler = createGalleryCreateHandler({
    getAdminSession: async () => ({ uid: "approved" }),
    getShootById: async () => ({ id: "shoot-1" }),
    create: async () => {
      creates += 1;
      return { id: "gallery-1" };
    },
  });
  assert.equal((await galleryHandler(jsonRequest("/api/galleries", {
    shootId: "shoot-1",
    name: "Portrait gallery",
    expiresOn: "2026-02-30",
  }))).status, 400);
  assert.equal((await galleryHandler(jsonRequest("/api/galleries", {
    shootId: "shoot-1",
    name: "Portrait gallery",
    expiresOn: "",
    downloadsEnabled: true,
  }))).status, 400);
  assert.equal(creates, 0);
});
