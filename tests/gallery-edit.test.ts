import assert from "node:assert/strict";
import test from "node:test";
import { createAdminClientGalleryView } from "@/lib/galleries/admin-client-gallery-view";
import { createGalleryUpdateHandler } from "@/lib/galleries/gallery-update-handler";

const now = new Date("2026-11-16T12:00:00.000Z");

function validSettings(overrides: Record<string, unknown> = {}) {
  return {
    name: "Abigail's gallery",
    status: "Active",
    expiresOn: "2026-12-01",
    downloadsEnabled: false,
    ...overrides,
  };
}

function jsonRequest(body: unknown, origin: string | null = "https://studio.example") {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (origin) headers.set("Origin", origin);
  return new Request("https://studio.example/api/galleries/gallery-1", {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
}

test("the client gallery view retains every shoot and gallery, including expired and archived galleries", () => {
  const view = createAdminClientGalleryView(
    [
      {
        id: "shoot-new",
        name: "Wedding",
        date: new Date("2026-11-11T12:00:00.000Z"),
        galleries: [
          {
            id: "gallery-active",
            name: "Wedding gallery",
            status: "Active",
            expiresOn: null,
            _count: { photos: 4 },
          },
        ],
      },
      {
        id: "shoot-old",
        name: "Engagement",
        date: new Date("2026-10-31T12:00:00.000Z"),
        galleries: [
          {
            id: "gallery-expired",
            name: "Engagement gallery",
            status: "Active",
            expiresOn: new Date("2026-11-11T12:00:00.000Z"),
            _count: { photos: 2 },
          },
          {
            id: "gallery-archived",
            name: "Archive",
            status: "Archived",
            expiresOn: null,
            _count: { photos: 0 },
          },
        ],
      },
    ],
    now,
  );

  assert.equal(view.length, 2);
  assert.equal(view[0]?.galleries.length, 1);
  assert.equal(view[1]?.galleries.length, 2);
  assert.equal(view[1]?.galleries[0]?.isExpired, true);
  assert.equal(view[1]?.galleries[1]?.status, "Archived");
});

test("the client gallery view handles clients without shoots and shoots without galleries", () => {
  assert.deepEqual(createAdminClientGalleryView([], now), []);

  const view = createAdminClientGalleryView(
    [{ id: "shoot-empty", name: "Portraits", date: now, galleries: [] }],
    now,
  );
  assert.equal(view.length, 1);
  assert.deepEqual(view[0]?.galleries, []);
});

test("gallery updates deny anonymous requests and reject invalid IDs, origins, and payloads", async () => {
  let updateCalls = 0;
  const handler = createGalleryUpdateHandler({
    getAdminSession: async () => null,
    getGalleryById: async () => ({ id: "gallery-1" }),
    updateGallery: async () => {
      updateCalls += 1;
      return {
        id: "gallery-1",
        name: "unused",
        status: "Active",
        expiresOn: null,
        downloadsEnabled: false,
      };
    },
  });
  assert.equal((await handler(jsonRequest(validSettings()), "gallery-1")).status, 401);
  assert.equal(updateCalls, 0);

  const authenticatedHandler = createGalleryUpdateHandler({
    getAdminSession: async () => ({ uid: "admin" }),
    getGalleryById: async () => ({ id: "gallery-1" }),
    updateGallery: async () => ({
      id: "gallery-1",
      name: "unused",
      status: "Active",
      expiresOn: null,
      downloadsEnabled: false,
    }),
  });
  assert.equal((await authenticatedHandler(jsonRequest(validSettings()), "bad/id")).status, 400);
  assert.equal((await authenticatedHandler(jsonRequest(validSettings(), null), "gallery-1")).status, 403);
  assert.equal((await authenticatedHandler(jsonRequest(validSettings(), "https://attacker.example"), "gallery-1")).status, 403);
  assert.equal((await authenticatedHandler(jsonRequest(validSettings({ status: "Draft" })), "gallery-1")).status, 400);
  assert.equal((await authenticatedHandler(jsonRequest(validSettings({ clientId: "client-2" })), "gallery-1")).status, 400);
  assert.equal((await authenticatedHandler(jsonRequest(validSettings({ photoIds: ["photo-1"] })), "gallery-1")).status, 400);
});

test("a valid update persists only supported settings, clears expiry, and preserves photo assignments", async () => {
  const gallery: {
    id: string;
    name: string;
    status: string;
    expiresOn: Date | null;
    downloadsEnabled: boolean;
    memberships: string[];
  } = {
    id: "gallery-1",
    name: "Before",
    status: "Active",
    expiresOn: new Date("2026-12-01T12:00:00.000Z"),
    downloadsEnabled: false,
    memberships: ["photo-1", "photo-2"],
  };
  const handler = createGalleryUpdateHandler({
    getAdminSession: async () => ({ uid: "admin" }),
    getGalleryById: async (id) => (id === gallery.id ? gallery : null),
    updateGallery: async (id, input) => {
      assert.equal(id, gallery.id);
      gallery.name = input.name;
      gallery.status = input.status;
      gallery.expiresOn = input.expiresOn;
      gallery.downloadsEnabled = input.downloadsEnabled;
      return {
        id: gallery.id,
        name: gallery.name,
        status: gallery.status,
        expiresOn: gallery.expiresOn,
        downloadsEnabled: gallery.downloadsEnabled,
      };
    },
  });

  const response = await handler(
    jsonRequest(validSettings({ name: "After", status: "Archived", expiresOn: null, downloadsEnabled: true })),
    gallery.id,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(gallery.memberships, ["photo-1", "photo-2"]);
  assert.equal(gallery.name, "After");
  assert.equal(gallery.status, "Archived");
  assert.equal(gallery.expiresOn, null);
  assert.equal(gallery.downloadsEnabled, true);
  assert.deepEqual(await response.json(), {
    gallery: {
      id: "gallery-1",
      name: "After",
      status: "Archived",
      expiresOn: null,
      downloadsEnabled: true,
    },
  });
});

test("gallery updates return a safe 404 when the gallery is missing", async () => {
  const handler = createGalleryUpdateHandler({
    getAdminSession: async () => ({ uid: "admin" }),
    getGalleryById: async () => null,
    updateGallery: async () => {
      throw new Error("should not update");
    },
  });

  assert.equal((await handler(jsonRequest(validSettings()), "gallery-1")).status, 404);
});
