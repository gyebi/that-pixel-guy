import { cloudinaryService } from "@/lib/media/cloudinary-service";
import { createPhotoUploadHandler } from "@/lib/uploads/photo-upload-handler";
import { getAdminSession } from "@/lib/auth/require-admin";
import { photoRepository } from "@/lib/repositories/photo-repository";
import { shootRepository } from "@/lib/repositories/shoot-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlePhotoUpload = createPhotoUploadHandler({
  getAdminSession,
  getShootById: shootRepository.getById,
  createPhoto: photoRepository.create,
  mediaService: cloudinaryService,
});

export async function POST(
  request: Request,
  context: RouteContext<"/api/shoots/[id]/photos">,
) {
  const { id } = await context.params;
  return handlePhotoUpload(request, id);
}
