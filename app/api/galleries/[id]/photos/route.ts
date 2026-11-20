import { getAdminSession } from "@/lib/auth/require-admin";
import { createGalleryPhotoMutationHandler } from "@/lib/galleries/gallery-photo-mutation-handler";
import { createGalleryPhotoService } from "@/lib/galleries/gallery-photo-service";
import { galleryPhotoRepository } from "@/lib/repositories/gallery-photo-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createGalleryPhotoMutationHandler({
  getAdminSession,
  service: createGalleryPhotoService(galleryPhotoRepository),
});

export async function POST(
  request: Request,
  context: RouteContext<"/api/galleries/[id]/photos">,
) {
  const { id } = await context.params;
  return handler.assign(request, id);
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/galleries/[id]/photos">,
) {
  const { id } = await context.params;
  return handler.reorder(request, id);
}
