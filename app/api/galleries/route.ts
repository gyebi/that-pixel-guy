
import { galleryRepository } from "@/lib/repositories/gallery-repository";
import { shootRepository } from "@/lib/repositories/shoot-repository";
import { getAdminSession } from "@/lib/auth/require-admin";
import { createGalleryCreateHandler } from "@/lib/admin/admin-create-handlers";

const createGallery = createGalleryCreateHandler({
  getAdminSession,
  getShootById: shootRepository.getById,
  create: galleryRepository.create,
});

export async function POST(request: Request) {
  return createGallery(request);
}


