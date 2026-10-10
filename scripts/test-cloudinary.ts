import "dotenv/config";
import { readFile } from "node:fs/promises";
import { cloudinaryService } from "../lib/media/cloudinary-service";
import { getCloudinary } from "../lib/media/cloudinary-config";

async function main() {
  const filename = "public/images/celebration-hero.jpg";
  const buffer = await readFile(filename);

  let mediaKey: string | undefined;

  try {
    const uploaded = await cloudinaryService.uploadPhoto({
      buffer,
      filename: "cloudinary-test.jpg",
      folder: "pixel-guy/integration-tests",
    });

    mediaKey = uploaded.mediaKey;

    console.log("Upload successful");
    console.log("Media key:", uploaded.mediaKey);
    console.log("Dimensions:", uploaded.width, "x", uploaded.height);
    console.log("Format:", uploaded.format);
    console.log("Bytes:", uploaded.bytes);

    const resource = await getCloudinary().api.resource(mediaKey, {
      resource_type: "image",
      type: "authenticated",
    });

    if (resource.type !== "authenticated") {
      throw new Error("Test image was not stored as authenticated.");
    }

    console.log("Storage type verified:", resource.type);

    const url = await cloudinaryService.getImageUrl(
      mediaKey,
      "gallery",
    );

    if (!url.includes("/authenticated/") || !url.includes("/s--")) {
      throw new Error("Expected an authenticated, signed image URL.");
    }

    console.log("Signed delivery URL generated successfully");
  } finally {
    if (mediaKey) {
      await cloudinaryService.deletePhoto(mediaKey);
      console.log("Temporary test image deleted");
    }
  }
}

main().catch((error) => {
  console.error("MediaService test failed:", error.message);
  process.exitCode = 1;
});

