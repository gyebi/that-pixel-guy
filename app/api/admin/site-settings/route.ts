import { getAdminSession } from "@/lib/auth/require-admin";
import { siteSettingsRepository } from "@/lib/repositories/site-settings-repository";
import { publishSiteSettings } from "@/lib/site-settings/site-settings-publisher";
import { createSiteSettingsUpdateHandler } from "@/lib/site-settings/site-settings-update-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSettings = createSiteSettingsUpdateHandler({
  getAdminSession,
  update: siteSettingsRepository.update,
  publish: publishSiteSettings,
});

export async function PATCH(request: Request) {
  return updateSettings(request);
}
