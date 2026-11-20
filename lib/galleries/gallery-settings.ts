export const galleryStatuses = ["Active", "Archived"] as const;

export type GalleryStatus = (typeof galleryStatuses)[number];

export function isGalleryStatus(value: unknown): value is GalleryStatus {
  return typeof value === "string" && galleryStatuses.includes(value as GalleryStatus);
}
