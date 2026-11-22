import { getAdminSession } from "@/lib/auth/require-admin";
import { createHomepageImageUploadHandler } from "@/lib/homepage/homepage-image-upload-handler";
import { publishHomepageContent } from "@/lib/homepage/homepage-content-publisher";
import { cloudinaryHomepageImageService } from "@/lib/media/cloudinary-service";
import { homepageContentRepository } from "@/lib/repositories/homepage-content-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uploadHomepageImage = createHomepageImageUploadHandler({
  getAdminSession,
  updateImage: homepageContentRepository.updateImage,
  publish: publishHomepageContent,
  mediaService: cloudinaryHomepageImageService,
});

export async function POST(request: Request) {
  return uploadHomepageImage(request);
}
