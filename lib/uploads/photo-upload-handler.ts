import { createHash } from "node:crypto";
import type { MediaService } from "@/lib/media/media-service";
import type { CreatePhotoInput } from "@/lib/repositories/photo-repository";
import { hasSameOrigin } from "@/lib/auth/same-origin";
import { decodeImageMetadata, InvalidImageError } from "./image-metadata";

const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_IMAGE_DIMENSION = 12_000;
const DEFAULT_MAX_IMAGE_PIXELS = 60_000_000;
const MAX_MULTIPART_OVERHEAD_BYTES = 256 * 1024;
const MAX_CONFIGURED_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_CONFIGURED_IMAGE_DIMENSION = 16_000;
const MAX_CONFIGURED_IMAGE_PIXELS = 100_000_000;

type Shoot = { id: string };
type Photo = { id: string };

export type PhotoUploadDependencies = {
  getAdminSession: () => Promise<unknown | null>;
  getShootById: (id: string) => Promise<Shoot | null>;
  createPhoto: (input: CreatePhotoInput) => Promise<Photo>;
  mediaService: Pick<MediaService, "uploadPhoto" | "deletePhoto">;
  getLimits?: () => PhotoUploadLimits;
};

export type PhotoUploadLimits = {
  maxUploadBytes: number;
  maxImageDimension: number;
  maxImagePixels: number;
};

class UploadRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const inFlightUploads = new Set<string>();

function boundedEnvironmentLimit(
  name: string,
  defaultValue: number,
  maximum: number,
) {
  const value = process.env[name];
  if (!value) return defaultValue;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= maximum
    ? parsed
    : defaultValue;
}

export function getPhotoUploadLimits(): PhotoUploadLimits {
  return {
    maxUploadBytes: boundedEnvironmentLimit(
      "PHOTO_UPLOAD_MAX_BYTES",
      DEFAULT_MAX_UPLOAD_BYTES,
      MAX_CONFIGURED_UPLOAD_BYTES,
    ),
    maxImageDimension: boundedEnvironmentLimit(
      "PHOTO_UPLOAD_MAX_DIMENSION",
      DEFAULT_MAX_IMAGE_DIMENSION,
      MAX_CONFIGURED_IMAGE_DIMENSION,
    ),
    maxImagePixels: boundedEnvironmentLimit(
      "PHOTO_UPLOAD_MAX_PIXELS",
      DEFAULT_MAX_IMAGE_PIXELS,
      MAX_CONFIGURED_IMAGE_PIXELS,
    ),
  };
}

function response(body: object, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function safeFilename(name: string) {
  const sanitized = name
    .replace(/[\\/\0\r\n]/g, "_")
    .replace(/[^\p{L}\p{N}._() -]/gu, "_")
    .trim()
    .slice(0, 255);

  return sanitized || "photo";
}

async function readBoundedBody(request: Request, maximumBytes: number) {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      throw new UploadRequestError(400, "Invalid upload size.");
    }
    if (parsedLength > maximumBytes) {
      throw new UploadRequestError(413, "Upload is too large.");
    }
  }

  if (!request.body) {
    throw new UploadRequestError(400, "Upload body is required.");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) {
        throw new UploadRequestError(413, "Upload is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body;
}

async function readUploadFile(request: Request, limits: PhotoUploadLimits) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    throw new UploadRequestError(415, "Upload must use multipart form data.");
  }

  const body = await readBoundedBody(
    request,
    limits.maxUploadBytes + MAX_MULTIPART_OVERHEAD_BYTES,
  );
  const headers = new Headers(request.headers);
  headers.set("content-length", String(body.byteLength));

  let formData: FormData;
  try {
    formData = await new Request(request.url, {
      method: "POST",
      headers,
      body,
    }).formData();
  } catch {
    throw new UploadRequestError(400, "Upload form data is invalid.");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new UploadRequestError(400, "A non-empty image file is required.");
  }
  if (file.size > limits.maxUploadBytes) {
    throw new UploadRequestError(413, "Upload is too large.");
  }

  return {
    buffer: Buffer.from(await file.arrayBuffer()),
    filename: safeFilename(file.name),
  };
}

export function createPhotoUploadHandler(dependencies: PhotoUploadDependencies) {
  return async function handlePhotoUpload(request: Request, shootId: string) {
    let admin: unknown | null;
    try {
      admin = await dependencies.getAdminSession();
    } catch {
      return response({ error: "Upload service unavailable." }, 503);
    }

    if (!admin) {
      return response({ error: "Unauthorized. Photographer login required." }, 401);
    }

    try {
      if (!hasSameOrigin(request)) {
        throw new UploadRequestError(403, "Invalid upload origin.");
      }
    } catch (error) {
      if (error instanceof UploadRequestError) {
        return response({ error: error.message }, error.status);
      }
      return response({ error: "Upload service unavailable." }, 503);
    }

    let shoot: Shoot | null;
    try {
      shoot = await dependencies.getShootById(shootId);
    } catch {
      return response({ error: "Upload service unavailable." }, 503);
    }

    if (!shoot) {
      return response({ error: "Shoot not found." }, 404);
    }

    const limits = dependencies.getLimits?.() ?? getPhotoUploadLimits();
    let upload: { buffer: Buffer; filename: string };
    try {
      upload = await readUploadFile(request, limits);
      const metadata = await decodeImageMetadata(
        upload.buffer,
        limits.maxImagePixels,
      );
      if (
        metadata.width > limits.maxImageDimension ||
        metadata.height > limits.maxImageDimension ||
        metadata.width * metadata.height > limits.maxImagePixels
      ) {
        return response({ error: "Image dimensions exceed upload limits." }, 413);
      }

      const uploadKey = `${shoot.id}:${createHash("sha256").update(upload.buffer).digest("hex")}`;
      if (inFlightUploads.has(uploadKey)) {
        return response({ error: "An identical upload is already being processed." }, 409);
      }
      inFlightUploads.add(uploadKey);

      try {
        let stored;
        try {
          stored = await dependencies.mediaService.uploadPhoto({
            buffer: upload.buffer,
            filename: upload.filename,
            folder: `tpg/shoots/${shoot.id}`,
          });
        } catch {
          return response({ error: "Unable to store the photograph." }, 502);
        }

        try {
          const photo = await dependencies.createPhoto({
            shootId: shoot.id,
            originalFilename: upload.filename,
            mediaKey: stored.mediaKey,
            width: metadata.width,
            height: metadata.height,
            altText: "",
          });

          return response(
            {
              photo: {
                id: photo.id,
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
              },
            },
            201,
          );
        } catch {
          try {
            await dependencies.mediaService.deletePhoto(stored.mediaKey);
          } catch {
            console.error("[Photo Upload] cloudinary_cleanup_failed");
          }
          return response({ error: "Unable to save the photograph." }, 503);
        }
      } finally {
        inFlightUploads.delete(uploadKey);
      }
    } catch (error) {
      if (error instanceof UploadRequestError) {
        return response({ error: error.message }, error.status);
      }
      if (error instanceof InvalidImageError) {
        return response({ error: "The image is malformed or unsupported." }, 400);
      }
      return response({ error: "Unable to process the photograph." }, 400);
    }
  };
}
