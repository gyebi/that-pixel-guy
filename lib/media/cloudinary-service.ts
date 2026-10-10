import "server-only";

import { Readable } from "node:stream";
import type { UploadApiResponse } from "cloudinary";
import { getCloudinary } from "./cloudinary-config";
import type {
  ImageVariant,
  MediaService,
  StoredPhoto,
  UploadPhotoInput,
} from "./media-service";

const transformations: Record<ImageVariant, object> = {
  thumbnail: {
    width: 400,
    height: 400,
    crop: "fill",
    quality: "auto",
    fetch_format: "auto",
  },
  gallery: {
    width: 1200,
    crop: "limit",
    quality: "auto",
    fetch_format: "auto",
  },
  preview: {
    width: 1800,
    crop: "limit",
    quality: "auto",
    fetch_format: "auto",
  },
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
    const cloudinary = getCloudinary();

    return cloudinary.url(mediaKey, {
      resource_type: "image",
      type: "authenticated",
      sign_url: true,
      secure: true,
      transformation: transformations[variant],
    });
  },

  async deletePhoto(mediaKey: string): Promise<void> {
    const cloudinary = getCloudinary();

    const result = await cloudinary.uploader.destroy(mediaKey, {
      resource_type: "image",
      type: "authenticated",
      invalidate: true,
    });

    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error("Unable to delete Cloudinary image.");
    }
  },
};
