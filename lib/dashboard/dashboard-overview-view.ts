export const DASHBOARD_RECENT_GALLERY_LIMIT = 5;

export const dashboardRecentGalleryOrderBy: Array<{
  createdAt?: "asc" | "desc";
  id?: "asc" | "desc";
}> = [
  { createdAt: "desc" },
  { id: "desc" },
];

type RecentGallery = {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  shoot: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
    };
  };
  _count: {
    photos: number;
  };
};

type DashboardOverviewInput = {
  clientCount: number;
  shootCount: number;
  galleryCount: number;
  photoCount: number;
  recentGalleries: RecentGallery[];
};

export function createDashboardOverviewView(input: DashboardOverviewInput) {
  return {
    metrics: {
      clients: input.clientCount,
      shoots: input.shootCount,
      galleries: input.galleryCount,
      uploadedPhotos: input.photoCount,
    },
    recentGalleries: input.recentGalleries
      .slice(0, DASHBOARD_RECENT_GALLERY_LIMIT)
      .map((gallery) => ({
        ...gallery,
        href: `/admin/galleries/${encodeURIComponent(gallery.id)}`,
      })),
  };
}
