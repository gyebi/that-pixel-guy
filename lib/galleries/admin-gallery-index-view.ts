export const GALLERY_INDEX_PAGE_SIZE = 50;
export const GALLERY_INDEX_FETCH_LIMIT = GALLERY_INDEX_PAGE_SIZE + 1;

export const galleryIndexOrderBy: Array<{
  createdAt?: "asc" | "desc";
  id?: "asc" | "desc";
}> = [
  { createdAt: "desc" },
  { id: "desc" },
];

type GalleryForIndexView = {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  expiresOn: Date | null;
  shoot: {
    id: string;
    name: string;
    client: { id: string; name: string };
  };
  _count: { photos: number };
};

export function createAdminGalleryIndexView(galleries: GalleryForIndexView[]) {
  return {
    galleries: galleries.slice(0, GALLERY_INDEX_PAGE_SIZE).map((gallery) => ({
      ...gallery,
      href: `/admin/galleries/${encodeURIComponent(gallery.id)}`,
    })),
    hasMore: galleries.length > GALLERY_INDEX_PAGE_SIZE,
  };
}
