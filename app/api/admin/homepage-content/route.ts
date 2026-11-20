import { getAdminSession } from "@/lib/auth/require-admin";
import { homepageContentRepository } from "@/lib/repositories/homepage-content-repository";
import { publishHomepageContent } from "@/lib/homepage/homepage-content-publisher";
import { createHomepageContentUpdateHandler } from "@/lib/homepage/homepage-content-update-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateHomepageContent = createHomepageContentUpdateHandler({
  getAdminSession,
  update: homepageContentRepository.update,
  publish: publishHomepageContent,
});

export async function PATCH(request: Request) {
  return updateHomepageContent(request);
}
