import "server-only";

import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSiteSettingsRepository,
  toPublicSiteSettings,
  type SiteSettingsStore,
} from "@/lib/site-settings/site-settings-repository-core";
import { SITE_SETTINGS_CACHE_TAG, SITE_SETTINGS_ID } from "@/lib/site-settings/site-settings-types";

export { createSiteSettingsRepository, toPublicSiteSettings } from "@/lib/site-settings/site-settings-repository-core";

export { SITE_SETTINGS_CACHE_TAG } from "@/lib/site-settings/site-settings-types";

const settingSelect = {
  id: true,
  businessName: true,
  publicEmail: true,
  phoneNumber: true,
  whatsAppNumber: true,
  location: true,
  instagramUrl: true,
  facebookUrl: true,
  pinterestUrl: true,
  tikTokUrl: true,
  youTubeUrl: true,
  revision: true,
} as const;

const store: SiteSettingsStore = {
  find() {
    return prisma.siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
      select: settingSelect,
    });
  },

  initialize(input) {
    return prisma.siteSettings.upsert({
      where: { id: SITE_SETTINGS_ID },
      create: { id: SITE_SETTINGS_ID, ...input },
      update: {},
      select: settingSelect,
    });
  },

  update(expectedRevision, input) {
    return prisma.siteSettings.updateMany({
      where: { id: SITE_SETTINGS_ID, revision: expectedRevision },
      data: { ...input, revision: { increment: 1 } },
    });
  },
};

export const siteSettingsRepository = createSiteSettingsRepository(store);

function isMissingSiteSettingsTable(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2021"
  );
}

const readPublicSiteSettings = unstable_cache(
  async () => {
    try {
      return toPublicSiteSettings(await siteSettingsRepository.get());
    } catch (error) {
      // The static fallback keeps public pages available until the additive
      // migration has been applied to an environment.
      if (isMissingSiteSettingsTable(error)) return toPublicSiteSettings(null);
      throw error;
    }
  },
  ["public-site-settings"],
  { tags: [SITE_SETTINGS_CACHE_TAG], revalidate: false },
);

export async function getPublicSiteSettings() {
  // Public settings may change immediately after an authenticated save. Keep
  // the page request-time while caching only the database read below it.
  await connection();
  return readPublicSiteSettings();
}
