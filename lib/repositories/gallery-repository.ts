
import { prisma } from "@/lib/prisma";

export type CreateGalleryInput = {
  shootId: string;
  name: string;
  expiresOn?: Date | null;
  downloadsEnabled?: boolean;
};

export const galleryRepository = {
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
};


