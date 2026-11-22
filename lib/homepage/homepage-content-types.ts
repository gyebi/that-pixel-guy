import type { HomepageImageFields } from "./homepage-image-types";

export const HOMEPAGE_CONTENT_ID = "homepage";
export const HOMEPAGE_CONTENT_CACHE_TAG = "homepage-content";

export type HomepageContentInput = {
  heroEyebrow: string;
  heroHeading: string;
  heroIntro: string;
  heroCtaLabel: string;
  introEyebrow: string;
  introHeading: string;
  introBody: string;
  introCtaLabel: string;
  workEyebrow: string;
  workHeading: string;
  workCtaLabel: string;
  servicesEyebrow: string;
  servicesHeading: string;
  servicesBody: string;
  contactEyebrow: string;
  contactHeading: string;
  contactCtaLabel: string;
};

export type HomepageContentRecord = HomepageContentInput & HomepageImageFields & {
  id: string;
  revision: number;
};

export type PublicHomepageContent = HomepageContentInput & HomepageImageFields;
