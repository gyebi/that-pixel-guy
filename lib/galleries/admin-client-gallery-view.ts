type GalleryForClientView = {
  id: string;
  name: string;
  status: string;
  expiresOn: Date | null;
  _count: { photos: number };
};

type ShootForClientView = {
  id: string;
  name: string;
  date: Date;
  galleries: GalleryForClientView[];
};

export function createAdminClientGalleryView(
  shoots: ShootForClientView[],
  now = new Date(),
) {
  return shoots.map((shoot) => ({
    ...shoot,
    galleries: shoot.galleries.map((gallery) => ({
      ...gallery,
      isExpired: Boolean(gallery.expiresOn && gallery.expiresOn.getTime() < now.getTime()),
    })),
  }));
}
