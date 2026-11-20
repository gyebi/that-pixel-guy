export const SITE_SETTINGS_ID = "site";
export const SITE_SETTINGS_CACHE_TAG = "site-settings";

export type SiteSettingsInput = {
  businessName: string;
  publicEmail: string;
  phoneNumber: string | null;
  whatsAppNumber: string | null;
  location: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  pinterestUrl: string | null;
  tikTokUrl: string | null;
  youTubeUrl: string | null;
};

export type SiteSettingsRecord = SiteSettingsInput & {
  id: string;
  revision: number;
};

export type PublicSiteSettings = SiteSettingsInput;
