import "server-only";

import { Readable } from "node:stream";
import type { UploadApiResponse } from "cloudinary";
import { getCloudinary } from "./cloudinary-config";
import { isApprovedPhotoMediaKey } from "./photo-media-key";
import {
  authenticatedThumbnailTransformation,
  authenticatedThumbnailUrlOptions,
} from "./cloudinary-thumbnail-options";
import type {
  ImageVariant,
  HomepageImageMediaService,
  MediaService,
  StoredPhoto,
  UploadPhotoInput,
} from "./media-service";

const transformations: Record<ImageVariant, object> = {
  thumbnail: {
    ...authenticatedThumbnailTransformation,
    format: "webp",
  },
  gallery: {
    width: 1200,
    crop: "limit",
    quality: "auto",
    format: "webp",
  },
  preview: {
    width: 1800,
    crop: "limit",
    quality: "auto",
    format: "webp",
  },
};

const eagerTransformations = Object.values(transformations);
const harmlessCloudinarySigningErrorCodes = new Set([
  "MISSING_CLOUD_NAME",
  "MISSING_API_KEY",
  "MISSING_API_SECRET",
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function safeCloudinarySigningErrorCode(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;

  return isNonEmptyString(code) && harmlessCloudinarySigningErrorCodes.has(code)
    ? code
    : "other";
}

function logCloudinarySigningFailure(
  cloudinary: ReturnType<typeof getCloudinary>,
  error: unknown,
) {
  const config = cloudinary.config() as {
    cloud_name?: unknown;
    api_key?: unknown;
    api_secret?: unknown;
  };

  console.warn("[Admin Thumbnail] cloudinary_signing_failed", {
    environmentCloudNamePresent: isNonEmptyString(process.env.CLOUDINARY_CLOUD_NAME),
    environmentApiKeyPresent: isNonEmptyString(process.env.CLOUDINARY_API_KEY),
    environmentApiSecretPresent: isNonEmptyString(process.env.CLOUDINARY_API_SECRET),
    configCloudNamePresent: isNonEmptyString(config.cloud_name),
    configApiKeyPresent: isNonEmptyString(config.api_key),
    configApiSecretPresent: isNonEmptyString(config.api_secret),
    errorCode: safeCloudinarySigningErrorCode(error),
  });
}

function hasVerifiedEagerVariants(result: UploadApiResponse) {
  const eager = result.eager;
  return (
    result.type === "authenticated" &&
    Array.isArray(eager) &&
    eager.length >= eagerTransformations.length &&
    eager.slice(0, eagerTransformations.length).every(
      (variant) =>
        variant &&
        typeof variant === "object" &&
        typeof variant.secure_url === "string" &&
        variant.secure_url.length > 0 &&
        Number.isInteger(variant.width) &&
        variant.width > 0 &&
        Number.isInteger(variant.height) &&
        variant.height > 0,
    )
  );
}

async function deleteCloudinaryPhoto(mediaKey: string): Promise<void> {
  const cloudinary = getCloudinary();

  const result = await cloudinary.uploader.destroy(mediaKey, {
    resource_type: "image",
    type: "authenticated",
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("Unable to delete Cloudinary image.");
  }
}

async function deleteCloudinaryHomepageImage(mediaKey: string): Promise<void> {
  const cloudinary = getCloudinary();
  const result = await cloudinary.uploader.destroy(mediaKey, {
    resource_type: "image",
    type: "upload",
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("Unable to delete Cloudinary homepage image.");
  }
}

export const cloudinaryHomepageImageService: HomepageImageMediaService = {
  async uploadHomepageImage(input) {
    const cloudinary = getCloudinary();
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          type: "upload",
          folder: input.folder,
          use_filename: false,
          unique_filename: true,
          overwrite: false,
          discard_original_filename: true,
          allowed_formats: ["jpg", "png", "webp"],
        },
        (error, upload) => {
          if (error) reject(error);
          else if (!upload) reject(new Error("Cloudinary returned no upload result."));
          else resolve(upload);
        },
      );
      Readable.from(input.buffer).pipe(stream);
    });

    if (
      result.type !== "upload" ||
      typeof result.secure_url !== "string" ||
      result.secure_url.length === 0 ||
      typeof result.public_id !== "string" ||
      result.public_id.length === 0
    ) {
      throw new Error("Cloudinary returned an invalid homepage image.");
    }

    return {
      mediaKey: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  },

  deleteHomepageImage: deleteCloudinaryHomepageImage,
};

export const cloudinaryService: MediaService = {
  async uploadPhoto(input: UploadPhotoInput): Promise<StoredPhoto> {
    const cloudinary = getCloudinary();

    const result = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            type: "authenticated",
            folder: input.folder,
            use_filename: false,
            unique_filename: true,
            overwrite: false,
            discard_original_filename: true,
            allowed_formats: ["jpg", "png", "webp"],
            eager: eagerTransformations,
            eager_async: false,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (!result) {
              reject(new Error("Cloudinary returned no upload result."));
            } else {
              resolve(result);
            }
          },
        );

        Readable.from(input.buffer).pipe(stream);
      },
    );

    if (!hasVerifiedEagerVariants(result)) {
      try {
        await deleteCloudinaryPhoto(result.public_id);
      } catch {
        console.error("[Cloudinary Upload] eager_variant_cleanup_failed");
      }

      throw new Error("Cloudinary eager variant generation failed.");
    }

    return {
      mediaKey: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  },

  async getImageUrl(
    mediaKey: string,
    variant: ImageVariant,
  ): Promise<string> {
    let cloudinary;

    try {
      cloudinary = getCloudinary();
    } catch {
      console.warn("[Admin Thumbnail] cloudinary_initialization_failed");
      throw new Error("Cloudinary initialization failed.");
    }

    try {
      return cloudinary.url(
        mediaKey,
        variant === "thumbnail"
          ? authenticatedThumbnailUrlOptions
          : {
              resource_type: "image",
              type: "authenticated",
              sign_url: true,
              secure: true,
              transformation: transformations[variant],
            },
      );
    } catch (error) {
      logCloudinarySigningFailure(cloudinary, error);
      throw new Error("Cloudinary URL signing failed.");
    }
  },

  deletePhoto: deleteCloudinaryPhoto,
};

export async function getAuthenticatedThumbnailUrl(mediaKey: string) {
  if (!isApprovedPhotoMediaKey(mediaKey)) {
    console.warn("[Admin Thumbnail] thumbnail_media_key_rejected");
    throw new Error("Photo media key is not eligible for thumbnail delivery.");
  }

  try {
    return await cloudinaryService.getImageUrl(mediaKey, "thumbnail");
  } catch {
    console.warn("[Admin Thumbnail] thumbnail_cloudinary_url_generation_exception");
    throw new Error("Unable to generate a thumbnail URL.");
  }
}
