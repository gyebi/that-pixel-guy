
import { prisma } from "@/lib/prisma";
import type { GalleryStatus } from "@/lib/galleries/gallery-settings";
import {
  createAdminGalleryIndexView,
  GALLERY_INDEX_FETCH_LIMIT,
  galleryIndexOrderBy,
} from "@/lib/galleries/admin-gallery-index-view";

export type CreateGalleryInput = {
  shootId: string;
  name: string;
  expiresOn?: Date | null;
  downloadsEnabled?: boolean;
};

export type UpdateGalleryInput = {
  name: string;
  status: GalleryStatus;
  expiresOn: Date | null;
  downloadsEnabled: boolean;
};

export const galleryRepository = {
  async getIndex() {
    const galleries = await prisma.gallery.findMany({
      take: GALLERY_INDEX_FETCH_LIMIT,
      orderBy: galleryIndexOrderBy,
      select: {
        id: true, name: true, status: true, createdAt: true, expiresOn: true,
        shoot: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
        _count: { select: { photos: true } },
      },
    });
    return createAdminGalleryIndexView(galleries);
  },

  async getById(id: string) {
    return prisma.gallery.findUnique({
      where: { id },
      include: {
        shoot: {
          include: {
            client: true,
          },
        },
        photos: {
          orderBy: {
            position: "asc",
          },
          include: {
            photo: true,
          },
        },
      },
    });
  },

  async getForShoot(shootId: string) {
    return prisma.gallery.findMany({
      where: { shootId },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async create(input: CreateGalleryInput) {
    return prisma.gallery.create({
      data: {
        shootId: input.shootId,
        name: input.name,
        expiresOn: input.expiresOn ?? null,
        downloadsEnabled: input.downloadsEnabled ?? false,
      },
    });
  },

  async update(id: string, input: UpdateGalleryInput) {
    return prisma.gallery.update({
      where: { id },
      data: {
        name: input.name,
        status: input.status,
        expiresOn: input.expiresOn,
        downloadsEnabled: input.downloadsEnabled,
      },
      select: {
        id: true,
        name: true,
        status: true,
        expiresOn: true,
        downloadsEnabled: true,
      },
    });
  },
};
