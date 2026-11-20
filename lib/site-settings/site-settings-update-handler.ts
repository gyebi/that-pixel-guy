import { hasSameOrigin } from "@/lib/auth/same-origin";
import { JsonRequestError, readBoundedJsonObject } from "@/lib/http/bounded-json";
import type { SiteSettingsInput } from "./site-settings-types";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_BUSINESS_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 32;
const MAX_LOCATION_LENGTH = 160;
const MAX_SOCIAL_URL_LENGTH = 2048;

const expectedFields = new Set([
  "businessName",
  "publicEmail",
  "phoneNumber",
  "whatsAppNumber",
  "location",
  "instagramUrl",
  "facebookUrl",
  "pinterestUrl",
  "tikTokUrl",
  "youTubeUrl",
  "revision",
]);

type UpdateResult =
  | { kind: "updated"; settings: { revision: number } }
  | { kind: "conflict" };

type Dependencies = {
  getAdminSession: () => Promise<unknown | null>;
  update: (input: SiteSettingsInput, expectedRevision: number) => Promise<UpdateResult>;
  publish: () => void | Promise<void>;
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

function requiredString(value: unknown, label: string, maximumLength: number) {
  if (typeof value !== "string") throw new RequestError(400, `Invalid ${label}.`);
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > maximumLength ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    throw new RequestError(400, `Invalid ${label}.`);
  }
  return normalized;
}

function optionalString(value: unknown, label: string, maximumLength: number) {
  if (value === "" || value === null) return null;
  return requiredString(value, label, maximumLength);
}

function phoneNumber(value: unknown, label: string) {
  const normalized = optionalString(value, label, MAX_PHONE_LENGTH);
  if (normalized === null) return null;

  const digits = normalized.replace(/\D/g, "");
  if (
    digits.length < 7 ||
    digits.length > 15 ||
    !/^\+?[0-9][0-9 ()-]*$/.test(normalized)
  ) {
    throw new RequestError(400, `Invalid ${label}.`);
  }
  return normalized;
}

const socialHosts = {
  instagramUrl: new Set(["instagram.com", "www.instagram.com"]),
  facebookUrl: new Set(["facebook.com", "www.facebook.com", "m.facebook.com"]),
  pinterestUrl: new Set(["pinterest.com", "www.pinterest.com"]),
  tikTokUrl: new Set(["tiktok.com", "www.tiktok.com"]),
  youTubeUrl: new Set(["youtube.com", "www.youtube.com", "youtu.be"]),
} as const;

function socialUrl(
  value: unknown,
  field: keyof typeof socialHosts,
) {
  const normalized = optionalString(value, field, MAX_SOCIAL_URL_LENGTH);
  if (normalized === null) return null;

  try {
    const url = new URL(normalized);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !socialHosts[field].has(url.hostname.toLowerCase())
    ) {
      throw new Error("invalid social URL");
    }
    return url.toString();
  } catch {
    throw new RequestError(400, `Invalid ${field}.`);
  }
}

async function readInput(request: Request) {
  try {
    const body = await readBoundedJsonObject(request, MAX_BODY_BYTES);
    const fields = Object.keys(body);
    if (
      fields.length !== expectedFields.size ||
      fields.some((field) => !expectedFields.has(field)) ||
      ![...expectedFields].every((field) => field in body)
    ) {
      throw new RequestError(400, "Settings contain unsupported fields.");
    }

    const publicEmail = requiredString(body.publicEmail, "public email", MAX_EMAIL_LENGTH).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publicEmail)) {
      throw new RequestError(400, "Invalid public email.");
    }
    if (!Number.isSafeInteger(body.revision) || (body.revision as number) < 1) {
      throw new RequestError(400, "Invalid settings revision.");
    }

    return {
      revision: body.revision as number,
      input: {
        businessName: requiredString(body.businessName, "business name", MAX_BUSINESS_NAME_LENGTH),
        publicEmail,
        phoneNumber: phoneNumber(body.phoneNumber, "phone number"),
        whatsAppNumber: phoneNumber(body.whatsAppNumber, "WhatsApp number"),
        location: optionalString(body.location, "location", MAX_LOCATION_LENGTH),
        instagramUrl: socialUrl(body.instagramUrl, "instagramUrl"),
        facebookUrl: socialUrl(body.facebookUrl, "facebookUrl"),
        pinterestUrl: socialUrl(body.pinterestUrl, "pinterestUrl"),
        tikTokUrl: socialUrl(body.tikTokUrl, "tikTokUrl"),
        youTubeUrl: socialUrl(body.youTubeUrl, "youTubeUrl"),
      },
    };
  } catch (error) {
    if (error instanceof JsonRequestError) {
      throw new RequestError(error.status, error.message);
    }
    throw error;
  }
}

export function createSiteSettingsUpdateHandler(dependencies: Dependencies) {
  return async function updateSiteSettings(request: Request) {
    let admin: unknown | null;
    try {
      admin = await dependencies.getAdminSession();
    } catch {
      return response({ error: "Settings service unavailable." }, 500);
    }
    if (!admin) {
      return response({ error: "Unauthorized. Photographer login required." }, 401);
    }

    try {
      if (!hasSameOrigin(request)) {
        throw new RequestError(403, "Invalid request origin.");
      }
      const { input, revision } = await readInput(request);
      const result = await dependencies.update(input, revision);
      if (result.kind === "conflict") {
        return response({ error: "Settings changed elsewhere. Reload the latest version before saving." }, 409);
      }

      await dependencies.publish();
      return response({ settings: result.settings }, 200);
    } catch (error) {
      if (error instanceof RequestError) {
        return response({ error: error.message }, error.status);
      }
      return response({ error: "Settings service unavailable." }, 500);
    }
  };
}
