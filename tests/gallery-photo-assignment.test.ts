import assert from "node:assert/strict";
import test from "node:test";
import { createGalleryPhotoMutationHandler } from "@/lib/galleries/gallery-photo-mutation-handler";
import {
  createGalleryPhotoService,
  GalleryPhotoOperationError,
} from "@/lib/galleries/gallery-photo-service";
import type {
  GalleryPhotoMembership,
  GalleryPhotoStore,
  GalleryPhotoTransaction,
} from "@/lib/repositories/gallery-photo-repository";

type Photo = { id: string; shootId: string; status: string };
type Membership = GalleryPhotoMembership & { galleryId: string };

class InMemoryGalleryPhotoStore implements GalleryPhotoStore {
  galleries = new Map([[
    "gallery-1",
    { id: "gallery-1", shootId: "shoot-1" },
  ]]);
  photos = new Map<string, Photo>([
    ["photo-a", { id: "photo-a", shootId: "shoot-1", status: "Visible" }],
    ["photo-b", { id: "photo-b", shootId: "shoot-1", status: "Visible" }],
    ["photo-hidden", { id: "photo-hidden", shootId: "shoot-1", status: "Hidden" }],
    ["photo-other", { id: "photo-other", shootId: "shoot-2", status: "Visible" }],
  ]);
  memberships: Membership[] = [];
  failCreate = false;
  private lock = Promise.resolve();

  async transaction<T>(work: (tx: GalleryPhotoTransaction) => Promise<T>) {
    const previous = this.lock;
    let release = () => {};
    this.lock = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;

    const draft = this.memberships.map((membership) => ({
      ...membership,
      photo: { ...membership.photo },
    }));
    try {
      const result = await work(this.transactionFor(draft));
      this.memberships = draft;
      return result;
    } finally {
      release();
    }
  }

  private transactionFor(memberships: Membership[]): GalleryPhotoTransaction {
    return {
      getGallery: async (id) => this.galleries.get(id) ?? null,
      getPhotos: async (ids) =>
        ids.flatMap((id) => {
          const photo = this.photos.get(id);
          return photo ? [{ ...photo }] : [];
        }),
      getGalleryMemberships: async (galleryId) =>
        memberships
          .filter((membership) => membership.galleryId === galleryId)
          .sort((first, second) => first.position - second.position)
          .map(({ id, photoId, position, photo }) => ({
            id,
            photoId,
            position,
            photo: { ...photo },
          })),
      getMembershipsForPhotos: async (galleryId, photoIds) =>
        memberships
          .filter(
            (membership) =>
              membership.galleryId === galleryId && photoIds.includes(membership.photoId),
          )
          .map(({ photoId }) => ({ photoId })),
      getMembershipsForPositions: async (galleryId, positions) =>
        memberships
          .filter(
            (membership) =>
              membership.galleryId === galleryId && positions.includes(membership.position),
          )
          .map(({ position }) => ({ position })),
      createMemberships: async (newMemberships) => {
        if (this.failCreate) throw new Error("database unavailable");
        for (const membership of newMemberships) {
          if (
            memberships.some(
              (existing) =>
                existing.galleryId === membership.galleryId &&
                (existing.photoId === membership.photoId ||
                  existing.position === membership.position),
            )
          ) {
            throw { code: "P2002" };
          }
        }
        memberships.push(
          ...newMemberships.map((membership, index) => ({
            id: `membership-${memberships.length + index + 1}`,
            ...membership,
            photo: { status: this.photos.get(membership.photoId)!.status },
          })),
        );
      },
      shiftMembershipPositions: async (galleryId, offset) => {
        for (const membership of memberships) {
          if (membership.galleryId === galleryId) membership.position += offset;
        }
      },
      updateMembershipPosition: async (membershipId, position) => {
        const membership = memberships.find((item) => item.id === membershipId);
        if (!membership) throw new Error("missing membership");
        if (
          memberships.some(
            (existing) =>
              existing.id !== membershipId &&
              existing.galleryId === membership.galleryId &&
              existing.position === position,
          )
        ) {
          throw { code: "P2002" };
        }
        membership.position = position;
      },
    };
  }
}

function expectOperationError(status: number) {
  return (error: unknown) =>
    error instanceof GalleryPhotoOperationError && error.status === status;
}

function jsonRequest(body: unknown, origin: string | null = "https://studio.example") {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (origin) headers.set("Origin", origin);
  return new Request("https://studio.example/api/galleries/gallery-1/photos", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

test("gallery assignment rejects anonymous and cross-origin requests", async () => {
  const service = {
    assign: async () => ({ memberships: [] }),
    reorder: async () => ({ memberships: [] }),
  };
  const anonymous = createGalleryPhotoMutationHandler({
    getAdminSession: async () => null,
    service,
  });
  assert.equal((await anonymous.assign(jsonRequest({ assignments: [{ photoId: "photo-a", position: 0 }] }), "gallery-1")).status, 401);

  const authenticated = createGalleryPhotoMutationHandler({
    getAdminSession: async () => ({ uid: "admin" }),
    service,
  });
  assert.equal((await authenticated.assign(jsonRequest({ assignments: [{ photoId: "photo-a", position: 0 }] }, null), "gallery-1")).status, 403);
  assert.equal((await authenticated.assign(jsonRequest({ assignments: [{ photoId: "photo-a", position: 0 }] }, "https://attacker.example"), "gallery-1")).status, 403);
});

test("valid assignment is atomic and only returns safe membership metadata", async () => {
  const store = new InMemoryGalleryPhotoStore();
  const service = createGalleryPhotoService(store);

  const result = await service.assign("gallery-1", [
    { photoId: "photo-a", position: 0 },
    { photoId: "photo-b", position: 1 },
  ]);

  assert.deepEqual(result, {
    memberships: [
      { photoId: "photo-a", position: 0 },
      { photoId: "photo-b", position: 1 },
    ],
  });
  assert.equal(store.memberships.length, 2);
});

test("assignment rejects cross-shoot, hidden, duplicate, and position-conflicting photographs", async () => {
  const store = new InMemoryGalleryPhotoStore();
  const service = createGalleryPhotoService(store);

  await assert.rejects(
    service.assign("gallery-1", [{ photoId: "photo-other", position: 0 }]),
    expectOperationError(409),
  );
  await assert.rejects(
    service.assign("gallery-1", [{ photoId: "photo-hidden", position: 0 }]),
    expectOperationError(409),
  );

  await service.assign("gallery-1", [{ photoId: "photo-a", position: 0 }]);
  await assert.rejects(
    service.assign("gallery-1", [{ photoId: "photo-a", position: 1 }]),
    expectOperationError(409),
  );
  await assert.rejects(
    service.assign("gallery-1", [{ photoId: "photo-b", position: 0 }]),
    expectOperationError(409),
  );
});

test("concurrent assignment attempts produce one membership and one conflict", async () => {
  const store = new InMemoryGalleryPhotoStore();
  const service = createGalleryPhotoService(store);

  const outcomes = await Promise.allSettled([
    service.assign("gallery-1", [{ photoId: "photo-a", position: 0 }]),
    service.assign("gallery-1", [{ photoId: "photo-a", position: 0 }]),
  ]);

  assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter((outcome) => outcome.status === "rejected").length, 1);
  assert.equal(store.memberships.length, 1);
});

test("reordering shifts positions inside one transaction before applying the new order", async () => {
  const store = new InMemoryGalleryPhotoStore();
  const service = createGalleryPhotoService(store);
  await service.assign("gallery-1", [
    { photoId: "photo-a", position: 0 },
    { photoId: "photo-b", position: 1 },
  ]);

  const result = await service.reorder("gallery-1", ["photo-b", "photo-a"]);

  assert.deepEqual(result.memberships, [
    { photoId: "photo-b", position: 0 },
    { photoId: "photo-a", position: 1 },
  ]);
  assert.deepEqual(
    store.memberships
      .sort((first, second) => first.position - second.position)
      .map(({ photoId, position }) => ({ photoId, position })),
    result.memberships,
  );
});

test("the handler rejects invalid IDs and payloads and reports database failures safely", async () => {
  const store = new InMemoryGalleryPhotoStore();
  store.failCreate = true;
  const handler = createGalleryPhotoMutationHandler({
    getAdminSession: async () => ({ uid: "admin" }),
    service: createGalleryPhotoService(store),
  });

  assert.equal((await handler.assign(jsonRequest({ assignments: [{ photoId: "photo-a", position: 0 }] }), "bad/id")).status, 400);
  assert.equal((await handler.assign(jsonRequest({ assignments: [{ photoId: "photo-a", position: -1 }] }), "gallery-1")).status, 400);
  assert.equal((await handler.assign(jsonRequest({ assignments: [] }), "gallery-1")).status, 400);

  const failure = await handler.assign(
    jsonRequest({ assignments: [{ photoId: "photo-a", position: 0 }] }),
    "gallery-1",
  );
  assert.equal(failure.status, 503);
  assert.deepEqual(await failure.json(), {
    error: "Gallery photographs are temporarily unavailable.",
  });
  assert.equal(store.memberships.length, 0);
});
