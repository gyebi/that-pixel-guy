import { getAdminSession } from "@/lib/auth/require-admin";
import { createGalleryUpdateHandler } from "@/lib/galleries/gallery-update-handler";
import { galleryRepository } from "@/lib/repositories/gallery-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateGallery = createGalleryUpdateHandler({
  getAdminSession,
  getGalleryById: galleryRepository.getById,
  updateGallery: galleryRepository.update,
});

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/galleries/[id]">,
) {
  const { id } = await context.params;
  return updateGallery(request, id);
}
