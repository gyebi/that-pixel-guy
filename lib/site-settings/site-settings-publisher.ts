import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { invalidatePublishedSiteSettings } from "./site-settings-publisher-core";

export { invalidatePublishedSiteSettings, siteSettingsPublicPaths } from "./site-settings-publisher-core";

export function publishSiteSettings() {
  invalidatePublishedSiteSettings({ revalidateTag, revalidatePath });
}
