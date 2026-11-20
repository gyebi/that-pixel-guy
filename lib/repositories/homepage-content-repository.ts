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
