import { homepageImageFallback } from "@/lib/site-content";
import { HOMEPAGE_IMAGE_SLOTS, type HomepageImageFields, type HomepageImageSlot } from "./homepage-image-types";

export type HomepageImage = { url: string; alt: string };

export function getHomepageImage(
  content: HomepageImageFields,
  slot: HomepageImageSlot,
): HomepageImage {
  const fields = HOMEPAGE_IMAGE_SLOTS[slot];
  const fallback = homepageImageFallback[slot];
  const url = content[fields.urlField];
  const alt = content[fields.altField];

  return {
    url: url && alt ? url : fallback.url,
    alt: url && alt ? alt : fallback.alt,
  };
}
