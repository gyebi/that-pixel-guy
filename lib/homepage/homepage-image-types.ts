export const HOMEPAGE_IMAGE_SLOTS = {
  hero: { label: "Hero photograph", urlField: "heroImageUrl", altField: "heroImageAlt" },
  workWedding: { label: "Selected work — weddings", urlField: "workWeddingImageUrl", altField: "workWeddingImageAlt" },
  workPortrait: { label: "Selected work — portraits", urlField: "workPortraitImageUrl", altField: "workPortraitImageAlt" },
  workFamily: { label: "Selected work — families", urlField: "workFamilyImageUrl", altField: "workFamilyImageAlt" },
  service: { label: "Services photograph", urlField: "serviceImageUrl", altField: "serviceImageAlt" },
  contact: { label: "Contact background photograph", urlField: "contactImageUrl", altField: "contactImageAlt" },
} as const;

export type HomepageImageSlot = keyof typeof HOMEPAGE_IMAGE_SLOTS;
export type HomepageImageFields = {
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  workWeddingImageUrl: string | null;
  workWeddingImageAlt: string | null;
  workPortraitImageUrl: string | null;
  workPortraitImageAlt: string | null;
  workFamilyImageUrl: string | null;
  workFamilyImageAlt: string | null;
  serviceImageUrl: string | null;
  serviceImageAlt: string | null;
  contactImageUrl: string | null;
  contactImageAlt: string | null;
};

export function emptyHomepageImageFields(): HomepageImageFields {
  return {
    heroImageUrl: null,
    heroImageAlt: null,
    workWeddingImageUrl: null,
    workWeddingImageAlt: null,
    workPortraitImageUrl: null,
    workPortraitImageAlt: null,
    workFamilyImageUrl: null,
    workFamilyImageAlt: null,
    serviceImageUrl: null,
    serviceImageAlt: null,
    contactImageUrl: null,
    contactImageAlt: null,
  };
}
