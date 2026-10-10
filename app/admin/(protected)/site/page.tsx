import { AdminPageHeader } from "@/components/admin-shell";
import { AdminSiteEditor } from "@/components/admin-site-editor";
import { demoRepository } from "@/lib/demo-repository";

export const metadata = { title: "Website editor" };

export default async function AdminSitePage() { const content = await demoRepository.getSiteContent(); return <><AdminPageHeader eyebrow="Website" title="Edit your homepage" /><AdminSiteEditor initialContent={content} /></>; }
