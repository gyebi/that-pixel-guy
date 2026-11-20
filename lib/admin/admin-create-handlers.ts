import { hasSameOrigin } from "@/lib/auth/same-origin";
import { JsonRequestError, readBoundedJsonObject } from "@/lib/http/bounded-json";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const validId = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

type AdminSession = unknown | null;

type ClientInput = {
  name: string;
  email: string;
  initials: string;
};

type ShootInput = {
  clientId: string;
  name: string;
  date: Date;
};

type GalleryInput = {
  shootId: string;
  name: string;
  expiresOn: Date | null;
  downloadsEnabled: boolean;
};

type ClientDependencies = {
  getAdminSession: () => Promise<AdminSession>;
  getByEmail: (email: string) => Promise<unknown | null>;
  create: (input: ClientInput) => Promise<unknown>;
};

type ShootDependencies = {
  getAdminSession: () => Promise<AdminSession>;
  getClientById: (id: string) => Promise<unknown | null>;
  create: (input: ShootInput) => Promise<unknown>;
};

type GalleryDependencies = {
  getAdminSession: () => Promise<AdminSession>;
  getShootById: (id: string) => Promise<unknown | null>;
  create: (input: GalleryInput) => Promise<unknown>;
};

class CreateRequestError extends Error {
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

function assertExpectedFields(
  body: Record<string, unknown>,
  expected: readonly string[],
) {
  const fields = Object.keys(body);
  if (
    fields.length !== expected.length ||
    fields.some((field) => !expected.includes(field)) ||
    expected.some((field) => !(field in body))
  ) {
    throw new CreateRequestError(400, "Request contains unsupported fields.");
  }
}

function requiredString(value: unknown, label: string, maximumLength = MAX_NAME_LENGTH) {
  if (typeof value !== "string") {
    throw new CreateRequestError(400, `Invalid ${label}.`);
  }

  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > maximumLength ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    throw new CreateRequestError(400, `Invalid ${label}.`);
  }
  return normalized;
}

function requiredId(value: unknown, label: string) {
  if (typeof value !== "string" || !validId.test(value)) {
    throw new CreateRequestError(400, `Invalid ${label}.`);
  }
  return value;
}

function parseDate(value: unknown, label: string): Date;
function parseDate(value: unknown, label: string, allowEmpty: true): Date | null;
function parseDate(value: unknown, label: string, allowEmpty = false): Date | null {
  if (allowEmpty && value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new CreateRequestError(400, `Invalid ${label}.`);
  }

  const date = new Date(`${value}T12:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== Number(value.slice(0, 4)) ||
    date.getUTCMonth() + 1 !== Number(value.slice(5, 7)) ||
    date.getUTCDate() !== Number(value.slice(8, 10))
  ) {
    throw new CreateRequestError(400, `Invalid ${label}.`);
  }
  return date;
}

function isUniqueConstraint(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

async function authorize(request: Request, getAdminSession: () => Promise<AdminSession>) {
  let admin: AdminSession;
  try {
    admin = await getAdminSession();
  } catch {
    return response({ error: "Admin service unavailable." }, 503);
  }

  if (!admin) {
    return response({ error: "Unauthorized. Photographer login required." }, 401);
  }
  if (!hasSameOrigin(request)) {
    return response({ error: "Invalid request origin." }, 403);
  }
  return null;
}

async function readBody(request: Request) {
  try {
    return await readBoundedJsonObject(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof JsonRequestError) {
      throw new CreateRequestError(error.status, error.message);
    }
    throw error;
  }
}

export function createClientCreateHandler(dependencies: ClientDependencies) {
  return async function createClient(request: Request) {
    const authorizationError = await authorize(request, dependencies.getAdminSession);
    if (authorizationError) return authorizationError;

    try {
      const body = await readBody(request);
      assertExpectedFields(body, ["name", "email"]);
      const name = requiredString(body.name, "client name");
      const email = requiredString(body.email, "email address", MAX_EMAIL_LENGTH).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new CreateRequestError(400, "Invalid email address.");
      }

      const existing = await dependencies.getByEmail(email);
      if (existing) {
        return response({ error: "A client with this email already exists." }, 409);
      }

      const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
      const client = await dependencies.create({ name, email, initials });
      return response(client as object, 201);
    } catch (error) {
      if (error instanceof CreateRequestError) {
        return response({ error: error.message }, error.status);
      }
      if (isUniqueConstraint(error)) {
        return response({ error: "A client with this email already exists." }, 409);
      }
      return response({ error: "Client service unavailable." }, 503);
    }
  };
}

export function createShootCreateHandler(dependencies: ShootDependencies) {
  return async function createShoot(request: Request) {
    const authorizationError = await authorize(request, dependencies.getAdminSession);
    if (authorizationError) return authorizationError;

    try {
      const body = await readBody(request);
      assertExpectedFields(body, ["clientId", "name", "date"]);
      const clientId = requiredId(body.clientId, "client ID");
      const name = requiredString(body.name, "shoot name");
      const date = parseDate(body.date, "shoot date");

      const client = await dependencies.getClientById(clientId);
      if (!client) return response({ error: "Client not found." }, 404);

      const shoot = await dependencies.create({ clientId, name, date });
      return response(shoot as object, 201);
    } catch (error) {
      if (error instanceof CreateRequestError) {
        return response({ error: error.message }, error.status);
      }
      return response({ error: "Shoot service unavailable." }, 503);
    }
  };
}

export function createGalleryCreateHandler(dependencies: GalleryDependencies) {
  return async function createGallery(request: Request) {
    const authorizationError = await authorize(request, dependencies.getAdminSession);
    if (authorizationError) return authorizationError;

    try {
      const body = await readBody(request);
      assertExpectedFields(body, ["shootId", "name", "expiresOn"]);
      const shootId = requiredId(body.shootId, "shoot ID");
      const name = requiredString(body.name, "gallery name");
      const expiresOn = parseDate(body.expiresOn, "expiration date", true);

      const shoot = await dependencies.getShootById(shootId);
      if (!shoot) return response({ error: "Shoot not found." }, 404);

      const gallery = await dependencies.create({
        shootId,
        name,
        expiresOn,
        downloadsEnabled: false,
      });
      return response(gallery as object, 201);
    } catch (error) {
      if (error instanceof CreateRequestError) {
        return response({ error: error.message }, error.status);
      }
      return response({ error: "Gallery service unavailable." }, 503);
    }
  };
}
