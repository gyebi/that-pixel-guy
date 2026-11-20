import { siteSettingsFallback } from "@/lib/site-content";
import {
  SITE_SETTINGS_ID,
  type PublicSiteSettings,
  type SiteSettingsInput,
  type SiteSettingsRecord,
} from "./site-settings-types";

export type SiteSettingsStore = {
  find: () => Promise<SiteSettingsRecord | null>;
  initialize: (input: SiteSettingsInput) => Promise<SiteSettingsRecord>;
  update: (
    expectedRevision: number,
    input: SiteSettingsInput,
  ) => Promise<{ count: number }>;
};

function fallbackInput(): SiteSettingsInput {
  return { ...siteSettingsFallback };
}

export function toPublicSiteSettings(settings: SiteSettingsRecord | null): PublicSiteSettings {
  if (!settings) return fallbackInput();

  return {
    businessName: settings.businessName,
    publicEmail: settings.publicEmail,
    phoneNumber: settings.phoneNumber,
    whatsAppNumber: settings.whatsAppNumber,
    location: settings.location,
    instagramUrl: settings.instagramUrl,
    facebookUrl: settings.facebookUrl,
    pinterestUrl: settings.pinterestUrl,
    tikTokUrl: settings.tikTokUrl,
    youTubeUrl: settings.youTubeUrl,
  };
}

export function createSiteSettingsRepository(store: SiteSettingsStore) {
  return {
    async get() {
      return store.find();
    },

    async getOrInitialize() {
      return store.initialize(fallbackInput());
    },

    async update(input: SiteSettingsInput, expectedRevision: number) {
      const result = await store.update(expectedRevision, input);

      if (result.count !== 1) {
        return { kind: "conflict" as const };
      }

      return {
        kind: "updated" as const,
        settings: {
          id: SITE_SETTINGS_ID,
          revision: expectedRevision + 1,
          ...input,
        },
      };
    },
  };
}
