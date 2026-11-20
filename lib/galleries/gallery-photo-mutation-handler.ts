import {
  GalleryPhotoOperationError,
  type PhotoAssignment,
} from "@/lib/galleries/gallery-photo-service";
import { hasSameOrigin } from "@/lib/auth/same-origin";
import { JsonRequestError, readBoundedJsonObject } from "@/lib/http/bounded-json";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_ASSIGNMENTS = 100;
const MAX_ORDERED_PHOTOS = 500;
const MAX_POSITION = 1_000_000;
const validId = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

type MutationService = {
  assign: (galleryId: string, assignments: PhotoAssignment[]) => Promise<unknown>;
  reorder: (galleryId: string, photoIds: string[]) => Promise<unknown>;
};

type Dependencies = {
  getAdminSession: () => Promise<unknown | null>;
  service: MutationService;
};

class RequestError extends Error {
  constructor(
    readonly status: 400 | 403 | 413 | 415,
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

function assertId(value: unknown, label: string) {
  if (typeof value !== "string" || !validId.test(value)) {
    throw new RequestError(400, `Invalid ${label}.`);
  }
  return value;
}

async function readJson(request: Request) {
  try {
    return await readBoundedJsonObject(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestError) throw error;
    if (error instanceof JsonRequestError) {
      throw new RequestError(error.status, error.message);
    }
    throw error;
  }
}

function parseAssignments(body: Record<string, unknown>) {
  if (!Array.isArray(body.assignments) || body.assignments.length === 0 || body.assignments.length > MAX_ASSIGNMENTS) {
    throw new RequestError(400, "Provide between 1 and 100 photograph assignments.");
  }

  const assignments = body.assignments.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new RequestError(400, "Invalid photograph assignment.");
    }

    const assignment = value as Record<string, unknown>;
    const photoId = assertId(assignment.photoId, "photograph ID");
    const position = assignment.position;
    if (
      typeof position !== "number" ||
      !Number.isSafeInteger(position) ||
      position < 0 ||
      position > MAX_POSITION
    ) {
      throw new RequestError(400, "Invalid gallery position.");
    }
    return { photoId, position };
  });

  const photoIds = new Set(assignments.map((assignment) => assignment.photoId));
  const positions = new Set(assignments.map((assignment) => assignment.position));
  if (photoIds.size !== assignments.length || positions.size !== assignments.length) {
    throw new RequestError(400, "Photograph assignments must use unique photographs and positions.");
  }

  return assignments;
}

function parseOrder(body: Record<string, unknown>) {
  if (!Array.isArray(body.photoIds) || body.photoIds.length === 0 || body.photoIds.length > MAX_ORDERED_PHOTOS) {
    throw new RequestError(400, "Provide between 1 and 500 photograph IDs in order.");
  }

  const photoIds = body.photoIds.map((value) => assertId(value, "photograph ID"));
  if (new Set(photoIds).size !== photoIds.length) {
    throw new RequestError(400, "Photograph IDs must be unique.");
  }
  return photoIds;
}

export function createGalleryPhotoMutationHandler(dependencies: Dependencies) {
  async function authorize(request: Request) {
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
    } catch (error) {
      if (error instanceof RequestError) {
        return response({ error: error.message }, error.status);
      }
      return response({ error: "Gallery service unavailable." }, 503);
    }

    return null;
  }

  return {
    async assign(request: Request, galleryId: string) {
      const authorizationError = await authorize(request);
      if (authorizationError) return authorizationError;

      try {
        const validGalleryId = assertId(galleryId, "gallery ID");
        const assignments = parseAssignments(await readJson(request));
        const result = await dependencies.service.assign(validGalleryId, assignments);
        return response(result as object, 201);
      } catch (error) {
        if (error instanceof RequestError || error instanceof GalleryPhotoOperationError) {
          return response({ error: error.message }, error.status);
        }
        return response({ error: "Gallery service unavailable." }, 503);
      }
    },

    async reorder(request: Request, galleryId: string) {
      const authorizationError = await authorize(request);
      if (authorizationError) return authorizationError;

      try {
        const validGalleryId = assertId(galleryId, "gallery ID");
        const photoIds = parseOrder(await readJson(request));
        const result = await dependencies.service.reorder(validGalleryId, photoIds);
        return response(result as object, 200);
      } catch (error) {
        if (error instanceof RequestError || error instanceof GalleryPhotoOperationError) {
          return response({ error: error.message }, error.status);
        }
        return response({ error: "Gallery service unavailable." }, 503);
      }
    },
  };
}
