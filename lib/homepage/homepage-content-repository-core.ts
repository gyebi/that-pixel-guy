import { homepageContentFallback } from "@/lib/site-content";
import {
  HOMEPAGE_CONTENT_ID,
  type HomepageContentInput,
  type HomepageContentRecord,
  type PublicHomepageContent,
} from "./homepage-content-types";
import {
  emptyHomepageImageFields,
  type HomepageImageFields,
  type HomepageImageSlot,
} from "./homepage-image-types";

export type HomepageContentStore = {
  find: () => Promise<HomepageContentRecord | null>;
  initialize: (input: HomepageContentInput & HomepageImageFields) => Promise<HomepageContentRecord>;
  update: (expectedRevision: number, input: HomepageContentInput) => Promise<{ count: number }>;
  updateImage: (
    slot: HomepageImageSlot,
    imageUrl: string,
    imageAlt: string,
    expectedRevision: number,
  ) => Promise<{ count: number }>;
};

function fallbackInput(): HomepageContentInput {
  return { ...homepageContentFallback };
}

function fallbackRecordInput(): HomepageContentInput & HomepageImageFields {
  return { ...fallbackInput(), ...emptyHomepageImageFields() };
}

export function toPublicHomepageContent(
  content: HomepageContentRecord | null,
): PublicHomepageContent {
  if (!content) return fallbackRecordInput();

  return {
    heroEyebrow: content.heroEyebrow,
    heroHeading: content.heroHeading,
    heroIntro: content.heroIntro,
    heroCtaLabel: content.heroCtaLabel,
    introEyebrow: content.introEyebrow,
    introHeading: content.introHeading,
    introBody: content.introBody,
    introCtaLabel: content.introCtaLabel,
    workEyebrow: content.workEyebrow,
    workHeading: content.workHeading,
    workCtaLabel: content.workCtaLabel,
    servicesEyebrow: content.servicesEyebrow,
    servicesHeading: content.servicesHeading,
    servicesBody: content.servicesBody,
    contactEyebrow: content.contactEyebrow,
    contactHeading: content.contactHeading,
    contactCtaLabel: content.contactCtaLabel,
    heroImageUrl: content.heroImageUrl,
    heroImageAlt: content.heroImageAlt,
    workWeddingImageUrl: content.workWeddingImageUrl,
    workWeddingImageAlt: content.workWeddingImageAlt,
    workPortraitImageUrl: content.workPortraitImageUrl,
    workPortraitImageAlt: content.workPortraitImageAlt,
    workFamilyImageUrl: content.workFamilyImageUrl,
    workFamilyImageAlt: content.workFamilyImageAlt,
    serviceImageUrl: content.serviceImageUrl,
    serviceImageAlt: content.serviceImageAlt,
    contactImageUrl: content.contactImageUrl,
    contactImageAlt: content.contactImageAlt,
  };
}

export function createHomepageContentRepository(store: HomepageContentStore) {
  return {
    async get() {
      return store.find();
    },

    async getOrInitialize() {
      return store.initialize(fallbackRecordInput());
    },

    async update(input: HomepageContentInput, expectedRevision: number) {
      const result = await store.update(expectedRevision, input);
      if (result.count !== 1) return { kind: "conflict" as const };

      return {
        kind: "updated" as const,
        settings: {
          id: HOMEPAGE_CONTENT_ID,
          revision: expectedRevision + 1,
          ...input,
        },
      };
    },

    async updateImage(
      slot: HomepageImageSlot,
      imageUrl: string,
      imageAlt: string,
      expectedRevision: number,
    ) {
      const result = await store.updateImage(slot, imageUrl, imageAlt, expectedRevision);
      if (result.count !== 1) return { kind: "conflict" as const };

      return {
        kind: "updated" as const,
        settings: {
          id: HOMEPAGE_CONTENT_ID,
          revision: expectedRevision + 1,
        },
      };
    },
  };
}
