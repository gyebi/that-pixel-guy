import "server-only";

import { prisma } from "@/lib/prisma";
import {
  createDashboardOverviewView,
  DASHBOARD_RECENT_GALLERY_LIMIT,
  dashboardRecentGalleryOrderBy,
} from "@/lib/dashboard/dashboard-overview-view";

export const dashboardRepository = {
  async getOverview() {
    const [clientCount, shootCount, galleryCount, photoCount, recentGalleries] =
      await Promise.all([
        prisma.client.count(),
        prisma.shoot.count(),
        prisma.gallery.count(),
        prisma.photo.count(),
        prisma.gallery.findMany({
          take: DASHBOARD_RECENT_GALLERY_LIMIT,
          orderBy: dashboardRecentGalleryOrderBy,
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            shoot: {
              select: {
                id: true,
                name: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                photos: true,
              },
            },
          },
        }),
      ]);

    return createDashboardOverviewView({
      clientCount,
      shootCount,
      galleryCount,
      photoCount,
      recentGalleries,
    });
  },
};
