import assert from "node:assert/strict";
import test from "node:test";
import { createAdminGalleryIndexView, GALLERY_INDEX_PAGE_SIZE, galleryIndexOrderBy } from "@/lib/galleries/admin-gallery-index-view";

function gallery(id: string, index: number, expiresOn: Date | null = null) {
  return {
    id, name: `Gallery ${index}`, status: index % 2 === 0 ? "Active" : "Archived",
    createdAt: new Date(`2026-11-${String((index % 28) + 1).padStart(2, "0")}T12:00:00.000Z`), expiresOn,
    shoot: { id: `shoot-${index}`, name: `Shoot ${index}`, client: { id: `client-${index}`, name: `Client ${index}` } },
    _count: { photos: index },
  };
}

test("gallery index view retains gallery, shoot, client, status, count, and nullable expiry", () => {
  const expiresOn = new Date("2026-12-01T12:00:00.000Z");
  const view = createAdminGalleryIndexView([gallery("gallery-active", 3, expiresOn), gallery("gallery-archived", 0, null)]);
  assert.equal(view.hasMore, false);
  assert.equal(view.galleries[0]?.shoot.client.name, "Client 3");
  assert.equal(view.galleries[0]?.shoot.name, "Shoot 3");
  assert.equal(view.galleries[0]?._count.photos, 3);
  assert.equal(view.galleries[0]?.status, "Archived");
  assert.equal(view.galleries[0]?.expiresOn, expiresOn);
  assert.equal(view.galleries[1]?.expiresOn, null);
});

test("gallery index view handles an empty result", () => {
  assert.deepEqual(createAdminGalleryIndexView([]), { galleries: [], hasMore: false });
});

test("gallery index view keeps the deterministic repository order and bounds visible rows", () => {
  const records = Array.from({ length: GALLERY_INDEX_PAGE_SIZE + 1 }, (_, index) => gallery(`gallery-${index}`, index));
  const view = createAdminGalleryIndexView(records);
  assert.deepEqual(galleryIndexOrderBy, [{ createdAt: "desc" }, { id: "desc" }]);
  assert.equal(view.galleries.length, GALLERY_INDEX_PAGE_SIZE);
  assert.equal(view.hasMore, true);
  assert.equal(view.galleries[0]?.id, "gallery-0");
  assert.equal(view.galleries.at(-1)?.id, "gallery-49");
});

test("gallery detail links are constructed as internal, encoded paths", () => {
  const view = createAdminGalleryIndexView([gallery("gallery/../unsafe?x=1", 1)]);
  assert.equal(view.galleries[0]?.href, "/admin/galleries/gallery%2F..%2Funsafe%3Fx%3D1");
});
