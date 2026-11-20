import {
  isGalleryStatus,
  type GalleryStatus,
} from "@/lib/galleries/gallery-settings";
import { hasSameOrigin } from "@/lib/auth/same-origin";
import { JsonRequestError, readBoundedJsonObject } from "@/lib/http/bounded-json";

const MAX_BODY_BYTES = 16 * 1024;
const validId = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const expectedFields = new Set([
  "name",
  "status",
  "expiresOn",
  "downloadsEnabled",
]);

export type GallerySettingsUpdate = {
  name: string;
  status: GalleryStatus;
  expiresOn: Date | null;
  downloadsEnabled: boolean;
};

type Dependencies = {
  getAdminSession: () => Promise<unknown | null>;
  getGalleryById: (id: string) => Promise<unknown | null>;
  updateGallery: (id: string, input: GallerySettingsUpdate) => Promise<{
    id: string;
    name: string;
    status: string;
    expiresOn: Date | null;
    downloadsEnabled: boolean;
  }>;
};

class RequestError extends Error {
  constructor(
    readonly status: 400 | 403 | 404 | 413 | 415,
    message: string,
  ) {
    super(message);
  }
}

function response(body: object, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function assertId(value: string) {
  if (!validId.test(value)) {
    throw new RequestError(400, "Invalid gallery ID.");
  }
  return value;
}

function parseExpiry(value: unknown) {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RequestError(400, "Invalid expiration date.");
  }

  const date = new Date(`${value}T12:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== Number(value.slice(0, 4)) ||
    date.getUTCMonth() + 1 !== Number(value.slice(5, 7)) ||
    date.getUTCDate() !== Number(value.slice(8, 10))
  ) {
    throw new RequestError(400, "Invalid expiration date.");
  }
  return date;
}

async function readUpdate(request: Request): Promise<GallerySettingsUpdate> {
  try {
    const body = await readBoundedJsonObject(request, MAX_BODY_BYTES);

    const fields = Object.keys(body);
    if (
      fields.length !== expectedFields.size ||
      fields.some((field) => !expectedFields.has(field)) ||
      ![...expectedFields].every((field) => field in body)
    ) {
      throw new RequestError(400, "Gallery settings must contain only supported fields.");
    }

    const values = body as Record<string, unknown>;
    const name = typeof values.name === "string" ? values.name.trim() : "";
    if (name.length < 1 || name.length > 120) {
      throw new RequestError(400, "Gallery name must be between 1 and 120 characters.");
    }
    if (!isGalleryStatus(values.status)) {
      throw new RequestError(400, "Invalid gallery status.");
    }
    if (typeof values.downloadsEnabled !== "boolean") {
      throw new RequestError(400, "Downloads setting must be true or false.");
    }

    return {
      name,
      status: values.status,
      expiresOn: parseExpiry(values.expiresOn),
      downloadsEnabled: values.downloadsEnabled,
    };
  } catch (error) {
    if (error instanceof JsonRequestError) {
      throw new RequestError(error.status, error.message);
    }
    throw error;
  }
}

export function createGalleryUpdateHandler(dependencies: Dependencies) {
  return async function updateGallery(request: Request, galleryId: string) {
    let admin: unknown | null;
    try {
      admin = await dependencies.getAdminSession();
    } catch {
      return response({ error: "Gallery service unavailable." }, 503);
    }
    if (!admin) {
      return response({ error: "Unauthorized. Photographer login required." }, 401);
    }

    try {
      if (!hasSameOrigin(request)) {
        throw new RequestError(403, "Invalid request origin.");
      }
      const id = assertId(galleryId);
      const input = await readUpdate(request);
      const gallery = await dependencies.getGalleryById(id);
      if (!gallery) {
        return response({ error: "Gallery not found." }, 404);
      }

      const updated = await dependencies.updateGallery(id, input);
      return response({ gallery: updated }, 200);
    } catch (error) {
      if (error instanceof RequestError) {
        return response({ error: error.message }, error.status);
      }
      return response({ error: "Gallery service unavailable." }, 503);
    }
  };
}
