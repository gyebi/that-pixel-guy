
import { prisma } from "@/lib/prisma";

export type CreatePhotoInput = {
  shootId: string;
  originalFilename: string;
  mediaKey: string;
  width: number;
  height: number;
  altText: string;
  sortOrder?: number;
};

export const photoRepository = {
  async getById(id: string) {
    return prisma.photo.findUnique({
      where: { id },
      include: {
        shoot: true,
        galleryPhotos: true,
      },
    });
  },

  async getForShoot(shootId: string) {
    return prisma.photo.findMany({
      where: { shootId },
      orderBy: { sortOrder: "asc" },
    });
  },

  async create(input: CreatePhotoInput) {
    return prisma.photo.create({
      data: {
        shootId: input.shootId,
        originalFilename: input.originalFilename,
        mediaKey: input.mediaKey,
        width: input.width,
        height: input.height,
        altText: input.altText,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  },
};

