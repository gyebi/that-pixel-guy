import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  adminNavigationItems,
  isAdminNavigationActive,
} from "@/lib/admin/admin-navigation";
import {
  createDashboardOverviewView,
  DASHBOARD_RECENT_GALLERY_LIMIT,
  dashboardRecentGalleryOrderBy,
} from "@/lib/dashboard/dashboard-overview-view";

function gallery(id: string, index: number, assignedPhotoCount = index) {
  return {
    id,
    name: `Gallery ${index}`,
    status: index % 2 === 0 ? "Active" : "Archived",
    createdAt: new Date(`2026-11-${String((index % 28) + 1).padStart(2, "0")}T12:00:00.000Z`),
    shoot: {
      id: `shoot-${index}`,
      name: `Shoot ${index}`,
      client: {
        id: `client-${index}`,
        name: `Client ${index}`,
      },
    },
    _count: { photos: assignedPhotoCount },
  };
}

test("dashboard maps real entity counts without treating gallery assignments as uploads", () => {
  const view = createDashboardOverviewView({
    clientCount: 2,
    shootCount: 3,
    galleryCount: 4,
    photoCount: 19,
    recentGalleries: [gallery("gallery-1", 1, 2)],
  });

  assert.deepEqual(view.metrics, {
    clients: 2,
    shoots: 3,
    galleries: 4,
    uploadedPhotos: 19,
  });
  assert.equal(view.recentGalleries[0]?._count.photos, 2);
  assert.notEqual(view.metrics.uploadedPhotos, view.recentGalleries[0]?._count.photos);
});

test("dashboard retains ordered gallery relation data and limits the recent list to five", () => {
  const view = createDashboardOverviewView({
    clientCount: 0,
    shootCount: 0,
    galleryCount: 6,
    photoCount: 0,
    recentGalleries: Array.from({ length: 6 }, (_, index) => gallery(`gallery-${index}`, index)),
  });

  assert.deepEqual(dashboardRecentGalleryOrderBy, [
    { createdAt: "desc" },
    { id: "desc" },
  ]);
  assert.equal(view.recentGalleries.length, DASHBOARD_RECENT_GALLERY_LIMIT);
  assert.equal(view.recentGalleries[0]?.shoot.client.name, "Client 0");
  assert.equal(view.recentGalleries[0]?.shoot.name, "Shoot 0");
  assert.equal(view.recentGalleries.at(-1)?.id, "gallery-4");
});

test("dashboard handles an empty database state and creates safe management links", () => {
  const empty = createDashboardOverviewView({
    clientCount: 0,
    shootCount: 0,
    galleryCount: 0,
    photoCount: 0,
    recentGalleries: [],
  });
  assert.deepEqual(empty, {
    metrics: { clients: 0, shoots: 0, galleries: 0, uploadedPhotos: 0 },
    recentGalleries: [],
  });

  const safeLink = createDashboardOverviewView({
    clientCount: 0,
    shootCount: 0,
    galleryCount: 1,
    photoCount: 0,
    recentGalleries: [gallery("gallery/../unsafe?x=1", 1)],
  });
  assert.equal(safeLink.recentGalleries[0]?.href, "/admin/galleries/gallery%2F..%2Funsafe%3Fx%3D1");
});

test("admin navigation exposes only approved modules and marks current routes accessibly", () => {
  assert.deepEqual(adminNavigationItems, [
    { label: "Overview", href: "/admin" },
    { label: "Website", href: "/admin/site" },
    { label: "Clients", href: "/admin/clients" },
    { label: "Galleries", href: "/admin/galleries" },
  ]);
  assert.equal(isAdminNavigationActive("/admin", "/admin"), true);
  assert.equal(isAdminNavigationActive("/admin/site", "/admin/site"), true);
  assert.equal(isAdminNavigationActive("/admin/galleries/gallery-1", "/admin/galleries"), true);
  assert.equal(isAdminNavigationActive("/admin/galleries", "/admin/clients"), false);
});

test("dashboard has no demo dependency and remains inside the protected admin route group", async () => {
  const [dashboard, protectedLayout] = await Promise.all([
    readFile("app/admin/(protected)/page.tsx", "utf8"),
    readFile("app/admin/(protected)/layout.tsx", "utf8"),
  ]);
  assert.equal(dashboard.includes("demoRepository"), false);
  assert.match(protectedLayout, /requireAdmin\(\)/);
});
