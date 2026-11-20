import { AdminPageHeader } from "@/components/admin-shell";
import { AdminHomepageEditor } from "@/components/admin-homepage-editor";
import { AdminSiteEditor } from "@/components/admin-site-editor";
import { homepageContentRepository } from "@/lib/repositories/homepage-content-repository";
import { siteSettingsRepository } from "@/lib/repositories/site-settings-repository";

export const metadata = { title: "Website settings" };

export default async function AdminSitePage() {
  const [settings, homepageContent] = await Promise.all([
    siteSettingsRepository.getOrInitialize(),
    homepageContentRepository.getOrInitialize(),
  ]);

  return (
    <>
      <AdminPageHeader eyebrow="Website" title="Website settings" />
      <AdminSiteEditor key={settings.revision} settings={settings} />
      <AdminHomepageEditor key={homepageContent.revision} content={homepageContent} />
    </>
  );
}
