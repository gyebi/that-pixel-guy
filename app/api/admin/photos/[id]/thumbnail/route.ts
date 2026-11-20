import { getAdminSession } from "@/lib/auth/require-admin";
import { createAdminThumbnailHandler } from "@/lib/media/admin-thumbnail-handler";
import { getAuthenticatedThumbnailUrl } from "@/lib/media/cloudinary-service";
import { photoRepository } from "@/lib/repositories/photo-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getThumbnail = createAdminThumbnailHandler({
  getAdminSession,
  getPhotoById: photoRepository.getThumbnailById,
  getThumbnailUrl: getAuthenticatedThumbnailUrl,
});

export async function GET(
  _request: Request,
  context: RouteContext<"/api/admin/photos/[id]/thumbnail">,
) {
  const { id } = await context.params;
  return getThumbnail(id);
}
