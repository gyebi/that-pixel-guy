import { SITE_SETTINGS_CACHE_TAG } from "./site-settings-types";

export const siteSettingsPublicPaths = ["/", "/contact"] as const;

type CacheInvalidationDependencies = {
  revalidateTag: (tag: string, profile: { expire: number }) => void;
  revalidatePath: (path: string) => void;
};

export function invalidatePublishedSiteSettings(
  dependencies: CacheInvalidationDependencies,
) {
  // expire: 0 makes the next request wait for fresh content rather than using
  // stale-while-revalidate behavior.
  dependencies.revalidateTag(SITE_SETTINGS_CACHE_TAG, { expire: 0 });
  siteSettingsPublicPaths.forEach((path) => dependencies.revalidatePath(path));
}
