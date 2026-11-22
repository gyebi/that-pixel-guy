import { createHash } from "node:crypto";
import { hasSameOrigin } from "@/lib/auth/same-origin";
import type { HomepageImageMediaService } from "@/lib/media/media-service";
import { decodeImageMetadata, InvalidImageError } from "@/lib/uploads/image-metadata";
import { getPhotoUploadLimits, type PhotoUploadLimits } from "@/lib/uploads/photo-upload-handler";
import { HOMEPAGE_IMAGE_SLOTS, type HomepageImageSlot } from "./homepage-image-types";

const MAX_MULTIPART_OVERHEAD_BYTES = 256 * 1024;
const MAX_ALT_LENGTH = 300;
const inFlightUploads = new Set<string>();

type UpdateResult =
  | { kind: "updated"; settings: { revision: number } }
  | { kind: "conflict" };

type Dependencies = {
  getAdminSession: () => Promise<unknown | null>;
  updateImage: (
    slot: HomepageImageSlot,
    imageUrl: string,
    imageAlt: string,
    expectedRevision: number,
  ) => Promise<UpdateResult>;
  publish: () => void | Promise<void>;
  mediaService: HomepageImageMediaService;
  getLimits?: () => PhotoUploadLimits;
};

class UploadRequestError extends Error {
  constructor(readonly status: 400 | 403 | 413 | 415, message: string) {
    super(message);
  }
}

function response(body: object, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readBoundedBody(request: Request, maximumBytes: number) {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      throw new UploadRequestError(400, "Invalid upload size.");
    }
    if (parsedLength > maximumBytes) throw new UploadRequestError(413, "Upload is too large.");
  }
  if (!request.body) throw new UploadRequestError(400, "Upload body is required.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) throw new UploadRequestError(413, "Upload is too large.");
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function readSlot(value: FormDataEntryValue | null): HomepageImageSlot {
  if (typeof value !== "string" || !(value in HOMEPAGE_IMAGE_SLOTS)) {
    throw new UploadRequestError(400, "Invalid homepage image position.");
  }
  return value as HomepageImageSlot;
}

function readAltText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") throw new UploadRequestError(400, "Meaningful alt text is required.");
  const altText = value.trim();
  if (altText.length < 3 || altText.length > MAX_ALT_LENGTH || /[\u0000-\u001f\u007f]/.test(altText)) {
    throw new UploadRequestError(400, "Alt text must be between 3 and 300 characters.");
  }
  return altText;
}

function readRevision(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw new UploadRequestError(400, "Invalid homepage content revision.");
  }
  const revision = Number(value);
  if (!Number.isSafeInteger(revision)) throw new UploadRequestError(400, "Invalid homepage content revision.");
  return revision;
}

async function readInput(request: Request, limits: PhotoUploadLimits) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) {
    throw new UploadRequestError(415, "Upload must use multipart form data.");
  }

  const bytes = await readBoundedBody(request, limits.maxUploadBytes + MAX_MULTIPART_OVERHEAD_BYTES);
  const headers = new Headers(request.headers);
  headers.set("content-length", String(bytes.byteLength));
  let formData: FormData;
  try {
    formData = await new Request(request.url, { method: "POST", headers, body: bytes }).formData();
  } catch {
    throw new UploadRequestError(400, "Upload form data is invalid.");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new UploadRequestError(400, "A non-empty image file is required.");
  }
  if (file.size > limits.maxUploadBytes) throw new UploadRequestError(413, "Upload is too large.");

  return {
    slot: readSlot(formData.get("slot")),
    altText: readAltText(formData.get("altText")),
    revision: readRevision(formData.get("revision")),
    buffer: Buffer.from(await file.arrayBuffer()),
  };
}

export function createHomepageImageUploadHandler(dependencies: Dependencies) {
  return async function uploadHomepageImage(request: Request) {
    let admin: unknown | null;
    try {
      admin = await dependencies.getAdminSession();
    } catch {
      return response({ error: "Homepage image service unavailable." }, 503);
    }
    if (!admin) return response({ error: "Unauthorized. Photographer login required." }, 401);

    try {
      if (!hasSameOrigin(request)) throw new UploadRequestError(403, "Invalid request origin.");
      const limits = dependencies.getLimits?.() ?? getPhotoUploadLimits();
      const input = await readInput(request, limits);
      const metadata = await decodeImageMetadata(input.buffer, limits.maxImagePixels);
      if (
        metadata.width > limits.maxImageDimension ||
        metadata.height > limits.maxImageDimension ||
        metadata.width * metadata.height > limits.maxImagePixels
      ) {
        throw new UploadRequestError(413, "Image dimensions exceed upload limits.");
      }

      const uploadKey = `${input.slot}:${createHash("sha256").update(input.buffer).digest("hex")}`;
      if (inFlightUploads.has(uploadKey)) {
        return response({ error: "An identical upload is already being processed." }, 409);
      }
      inFlightUploads.add(uploadKey);
      try {
        let stored;
        try {
          stored = await dependencies.mediaService.uploadHomepageImage({
            buffer: input.buffer,
            filename: "homepage-image",
            folder: "tpg/homepage",
          });
        } catch {
          return response({ error: "Unable to store the homepage photograph." }, 502);
        }

        try {
          const updated = await dependencies.updateImage(input.slot, stored.url, input.altText, input.revision);
          if (updated.kind === "conflict") {
            await dependencies.mediaService.deleteHomepageImage(stored.mediaKey).catch(() => {
              console.error("[Homepage Image] provisional_cloudinary_cleanup_failed");
            });
            return response({ error: "Homepage content changed elsewhere. Reload the latest version before replacing an image." }, 409);
          }
          await dependencies.publish();
          return response({
            image: {
              slot: input.slot,
              url: stored.url,
              altText: input.altText,
              revision: updated.settings.revision,
              width: metadata.width,
              height: metadata.height,
            },
          }, 201);
        } catch {
          await dependencies.mediaService.deleteHomepageImage(stored.mediaKey).catch(() => {
            console.error("[Homepage Image] provisional_cloudinary_cleanup_failed");
          });
          return response({ error: "Unable to save the homepage photograph." }, 503);
        }
      } finally {
        inFlightUploads.delete(uploadKey);
      }
    } catch (error) {
      if (error instanceof UploadRequestError) return response({ error: error.message }, error.status);
      if (error instanceof InvalidImageError) return response({ error: "The image is malformed or unsupported." }, 400);
      return response({ error: "Unable to process the homepage photograph." }, 400);
    }
  };
}
