import "server-only";

import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createHomepageContentRepository,
  toPublicHomepageContent,
  type HomepageContentStore,
} from "@/lib/homepage/homepage-content-repository-core";
import {
  HOMEPAGE_CONTENT_CACHE_TAG,
  HOMEPAGE_CONTENT_ID,
} from "@/lib/homepage/homepage-content-types";
import type { HomepageImageSlot } from "@/lib/homepage/homepage-image-types";

export {
  createHomepageContentRepository,
  toPublicHomepageContent,
} from "@/lib/homepage/homepage-content-repository-core";
export { HOMEPAGE_CONTENT_CACHE_TAG } from "@/lib/homepage/homepage-content-types";

const homepageContentSelect = {
  id: true,
  heroEyebrow: true,
  heroHeading: true,
  heroIntro: true,
  heroCtaLabel: true,
  introEyebrow: true,
  introHeading: true,
  introBody: true,
  introCtaLabel: true,
  workEyebrow: true,
  workHeading: true,
  workCtaLabel: true,
  servicesEyebrow: true,
  servicesHeading: true,
  servicesBody: true,
  contactEyebrow: true,
  contactHeading: true,
  contactCtaLabel: true,
  heroImageUrl: true,
  heroImageAlt: true,
  workWeddingImageUrl: true,
  workWeddingImageAlt: true,
  workPortraitImageUrl: true,
  workPortraitImageAlt: true,
  workFamilyImageUrl: true,
  workFamilyImageAlt: true,
  serviceImageUrl: true,
  serviceImageAlt: true,
  contactImageUrl: true,
  contactImageAlt: true,
  revision: true,
} as const;

const store: HomepageContentStore = {
  find() {
    return prisma.homepageContent.findUnique({
      where: { id: HOMEPAGE_CONTENT_ID },
      select: homepageContentSelect,
    });
  },

  initialize(input) {
    return prisma.homepageContent.upsert({
      where: { id: HOMEPAGE_CONTENT_ID },
      create: { id: HOMEPAGE_CONTENT_ID, ...input },
      update: {},
      select: homepageContentSelect,
    });
  },

  update(expectedRevision, input) {
    return prisma.homepageContent.updateMany({
      where: { id: HOMEPAGE_CONTENT_ID, revision: expectedRevision },
      data: { ...input, revision: { increment: 1 } },
    });
  },

  updateImage(slot: HomepageImageSlot, imageUrl: string, imageAlt: string, expectedRevision: number) {
    const imageData = {
      hero: { heroImageUrl: imageUrl, heroImageAlt: imageAlt },
      workWedding: { workWeddingImageUrl: imageUrl, workWeddingImageAlt: imageAlt },
      workPortrait: { workPortraitImageUrl: imageUrl, workPortraitImageAlt: imageAlt },
      workFamily: { workFamilyImageUrl: imageUrl, workFamilyImageAlt: imageAlt },
      service: { serviceImageUrl: imageUrl, serviceImageAlt: imageAlt },
      contact: { contactImageUrl: imageUrl, contactImageAlt: imageAlt },
    } as const;

    return prisma.homepageContent.updateMany({
      where: { id: HOMEPAGE_CONTENT_ID, revision: expectedRevision },
      data: { ...imageData[slot], revision: { increment: 1 } },
    });
  },
};

export const homepageContentRepository = createHomepageContentRepository(store);

function isMissingHomepageContentTable(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2021"
  );
}

const readPublicHomepageContent = unstable_cache(
  async () => {
    try {
      return toPublicHomepageContent(await homepageContentRepository.get());
    } catch (error) {
      if (isMissingHomepageContentTable(error)) return toPublicHomepageContent(null);
      throw error;
    }
  },
  ["public-homepage-content"],
  { tags: [HOMEPAGE_CONTENT_CACHE_TAG], revalidate: false },
);

export async function getPublicHomepageContent() {
  await connection();
  return readPublicHomepageContent();
}
