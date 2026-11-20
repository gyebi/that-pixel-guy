import { HOMEPAGE_CONTENT_CACHE_TAG } from "./homepage-content-types";

export const homepageContentPublicPaths = ["/"] as const;

type CacheInvalidationDependencies = {
  revalidateTag: (tag: string, profile: { expire: number }) => void;
  revalidatePath: (path: string) => void;
};

export function invalidatePublishedHomepageContent(
  dependencies: CacheInvalidationDependencies,
) {
  dependencies.revalidateTag(HOMEPAGE_CONTENT_CACHE_TAG, { expire: 0 });
  homepageContentPublicPaths.forEach((path) => dependencies.revalidatePath(path));
}
