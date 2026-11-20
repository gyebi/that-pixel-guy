import { prisma } from "@/lib/prisma";

export type GalleryPhotoMembership = {
  id: string;
  photoId: string;
  position: number;
  photo: { status: string };
};

export type GalleryPhotoTransaction = {
  getGallery: (id: string) => Promise<{ id: string; shootId: string } | null>;
  getPhotos: (ids: string[]) => Promise<Array<{ id: string; shootId: string; status: string }>>;
  getGalleryMemberships: (galleryId: string) => Promise<GalleryPhotoMembership[]>;
  getMembershipsForPhotos: (galleryId: string, photoIds: string[]) => Promise<Array<{ photoId: string }>>;
  getMembershipsForPositions: (galleryId: string, positions: number[]) => Promise<Array<{ position: number }>>;
  createMemberships: (memberships: Array<{ galleryId: string; photoId: string; position: number }>) => Promise<void>;
  shiftMembershipPositions: (galleryId: string, offset: number) => Promise<void>;
  updateMembershipPosition: (membershipId: string, position: number) => Promise<void>;
};

export type GalleryPhotoStore = {
  transaction: <T>(work: (tx: GalleryPhotoTransaction) => Promise<T>) => Promise<T>;
};

export const galleryPhotoRepository: GalleryPhotoStore = {
  async transaction(work) {
    return prisma.$transaction(
      async (tx) =>
        work({
          async getGallery(id) {
            return tx.gallery.findUnique({
              where: { id },
              select: { id: true, shootId: true },
            });
          },
          async getPhotos(ids) {
            return tx.photo.findMany({
              where: { id: { in: ids } },
              select: { id: true, shootId: true, status: true },
            });
          },
          async getGalleryMemberships(galleryId) {
            return tx.galleryPhoto.findMany({
              where: { galleryId },
              orderBy: { position: "asc" },
              select: {
                id: true,
                photoId: true,
                position: true,
                photo: { select: { status: true } },
              },
            });
          },
          async getMembershipsForPhotos(galleryId, photoIds) {
            return tx.galleryPhoto.findMany({
              where: { galleryId, photoId: { in: photoIds } },
              select: { photoId: true },
            });
          },
          async getMembershipsForPositions(galleryId, positions) {
            return tx.galleryPhoto.findMany({
              where: { galleryId, position: { in: positions } },
              select: { position: true },
            });
          },
          async createMemberships(memberships) {
            await tx.galleryPhoto.createMany({ data: memberships });
          },
          async shiftMembershipPositions(galleryId, offset) {
            await tx.galleryPhoto.updateMany({
              where: { galleryId },
              data: { position: { increment: offset } },
            });
          },
          async updateMembershipPosition(membershipId, position) {
            await tx.galleryPhoto.update({
              where: { id: membershipId },
              data: { position },
            });
          },
        }),
      {
        isolationLevel: "Serializable",
        maxWait: 5_000,
        timeout: 10_000,
      },
    );
  },
};
