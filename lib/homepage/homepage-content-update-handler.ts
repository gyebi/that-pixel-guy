import { hasSameOrigin } from "@/lib/auth/same-origin";
import { JsonRequestError, readBoundedJsonObject } from "@/lib/http/bounded-json";
import type { HomepageContentInput } from "./homepage-content-types";

const MAX_BODY_BYTES = 16 * 1024;
const fieldLimits = {
  heroEyebrow: 120,
  heroHeading: 180,
  heroIntro: 600,
  heroCtaLabel: 80,
  introEyebrow: 120,
  introHeading: 180,
  introBody: 800,
  introCtaLabel: 80,
  workEyebrow: 120,
  workHeading: 180,
  workCtaLabel: 80,
  servicesEyebrow: 120,
  servicesHeading: 180,
  servicesBody: 800,
  contactEyebrow: 120,
  contactHeading: 180,
  contactCtaLabel: 80,
} as const;

type ContentField = keyof typeof fieldLimits;
const expectedFields = new Set([...Object.keys(fieldLimits), "revision"]);
const headingFields = new Set<ContentField>([
  "heroHeading",
  "introHeading",
  "workHeading",
  "servicesHeading",
  "contactHeading",
]);

type UpdateResult =
  | { kind: "updated"; settings: { revision: number } }
  | { kind: "conflict" };

type Dependencies = {
  getAdminSession: () => Promise<unknown | null>;
  update: (input: HomepageContentInput, expectedRevision: number) => Promise<UpdateResult>;
  publish: () => void | Promise<void>;
};

class RequestError extends Error {
  constructor(readonly status: 400 | 403 | 413 | 415, message: string) {
    super(message);
  }
}

function response(body: object, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function plainText(value: unknown, field: ContentField) {
  if (typeof value !== "string") throw new RequestError(400, `Invalid ${field}.`);

  const normalized = value.replace(/\r\n?/g, "\n").trim();
  const allowLineBreaks = headingFields.has(field);
  const invalidControls = allowLineBreaks
    ? /[\u0000-\u0009\u000B-\u001F\u007F]/
    : /[\u0000-\u001F\u007F]/;

  if (
    normalized.length === 0 ||
    normalized.length > fieldLimits[field] ||
    invalidControls.test(normalized) ||
    (allowLineBreaks && normalized.split("\n").length > 3)
  ) {
    throw new RequestError(400, `Invalid ${field}.`);
  }

  return normalized;
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
      throw new RequestError(400, "Homepage content contains unsupported fields.");
    }
    if (!Number.isSafeInteger(body.revision) || (body.revision as number) < 1) {
      throw new RequestError(400, "Invalid homepage content revision.");
    }

    return {
      revision: body.revision as number,
      input: {
        heroEyebrow: plainText(body.heroEyebrow, "heroEyebrow"),
        heroHeading: plainText(body.heroHeading, "heroHeading"),
        heroIntro: plainText(body.heroIntro, "heroIntro"),
        heroCtaLabel: plainText(body.heroCtaLabel, "heroCtaLabel"),
        introEyebrow: plainText(body.introEyebrow, "introEyebrow"),
        introHeading: plainText(body.introHeading, "introHeading"),
        introBody: plainText(body.introBody, "introBody"),
        introCtaLabel: plainText(body.introCtaLabel, "introCtaLabel"),
        workEyebrow: plainText(body.workEyebrow, "workEyebrow"),
        workHeading: plainText(body.workHeading, "workHeading"),
        workCtaLabel: plainText(body.workCtaLabel, "workCtaLabel"),
        servicesEyebrow: plainText(body.servicesEyebrow, "servicesEyebrow"),
        servicesHeading: plainText(body.servicesHeading, "servicesHeading"),
        servicesBody: plainText(body.servicesBody, "servicesBody"),
        contactEyebrow: plainText(body.contactEyebrow, "contactEyebrow"),
        contactHeading: plainText(body.contactHeading, "contactHeading"),
        contactCtaLabel: plainText(body.contactCtaLabel, "contactCtaLabel"),
      },
    };
  } catch (error) {
    if (error instanceof JsonRequestError) throw new RequestError(error.status, error.message);
    throw error;
  }
}

export function createHomepageContentUpdateHandler(dependencies: Dependencies) {
  return async function updateHomepageContent(request: Request) {
    let admin: unknown | null;
    try {
      admin = await dependencies.getAdminSession();
    } catch {
      return response({ error: "Homepage content service unavailable." }, 500);
    }
    if (!admin) {
      return response({ error: "Unauthorized. Photographer login required." }, 401);
    }

    try {
      if (!hasSameOrigin(request)) throw new RequestError(403, "Invalid request origin.");
      const { input, revision } = await readInput(request);
      const result = await dependencies.update(input, revision);
      if (result.kind === "conflict") {
        return response({ error: "Homepage content changed elsewhere. Reload the latest version before saving." }, 409);
      }

      await dependencies.publish();
      return response({ settings: result.settings }, 200);
    } catch (error) {
      if (error instanceof RequestError) return response({ error: error.message }, error.status);
      return response({ error: "Homepage content service unavailable." }, 500);
    }
  };
}
