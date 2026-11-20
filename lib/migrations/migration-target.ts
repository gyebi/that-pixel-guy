const EXPECTED_DATABASE_NAME = "pixel-guy";
const KNOWN_PRODUCTION_NEON_HOST = "ep-muddy-shape-b5cxe640.c-7.us-east-2.aws.neon.tech";

export const MIGRATION_DATABASE_URL_ENV = "MIGRATION_DATABASE_URL";
export const MIGRATION_DEVELOPMENT_HOST_ENV = "MIGRATION_DEVELOPMENT_HOST";

export class MigrationTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MigrationTargetError";
  }
}

type MigrationEnvironment = Record<string, string | undefined>;

function requiredValue(environment: MigrationEnvironment, name: string) {
  const value = environment[name]?.trim();

  if (!value) {
    throw new MigrationTargetError(`${name} is required for development migration commands.`);
  }

  return value;
}

function normalizeNeonHostname(hostname: string, variableName: string) {
  const normalized = hostname.trim().toLowerCase();

  if (
    !normalized ||
    normalized.includes("://") ||
    normalized.includes("/") ||
    normalized.includes("@") ||
    normalized.includes(":") ||
    !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(
      normalized,
    ) ||
    !normalized.endsWith(".neon.tech")
  ) {
    throw new MigrationTargetError(`${variableName} must be a direct Neon hostname.`);
  }

  if (normalized.includes("-pooler.")) {
    throw new MigrationTargetError(`${variableName} must not be a pooled Neon hostname.`);
  }

  return normalized;
}

function parseMigrationUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new MigrationTargetError(`${MIGRATION_DATABASE_URL_ENV} must be a valid PostgreSQL URL.`);
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new MigrationTargetError(`${MIGRATION_DATABASE_URL_ENV} must use a PostgreSQL URL.`);
  }

  if (!url.username || !url.password) {
    throw new MigrationTargetError(`${MIGRATION_DATABASE_URL_ENV} must include database credentials.`);
  }

  if (url.port && url.port !== "5432") {
    throw new MigrationTargetError(`${MIGRATION_DATABASE_URL_ENV} must use the standard PostgreSQL port.`);
  }

  if (url.pathname !== `/${EXPECTED_DATABASE_NAME}`) {
    throw new MigrationTargetError(
      `${MIGRATION_DATABASE_URL_ENV} must target the ${EXPECTED_DATABASE_NAME} database.`,
    );
  }

  return url;
}

/**
 * Fails closed unless the direct URL exactly matches the independently configured
 * development endpoint. The approved hostname is intentionally a separate
 * configuration value and is never inferred from the URL being validated.
 */
export function assertDevelopmentMigrationTarget(environment: MigrationEnvironment = process.env) {
  const migrationUrl = parseMigrationUrl(requiredValue(environment, MIGRATION_DATABASE_URL_ENV));
  const hostname = normalizeNeonHostname(migrationUrl.hostname, MIGRATION_DATABASE_URL_ENV);
  const approvedDevelopmentHostname = normalizeNeonHostname(
    requiredValue(environment, MIGRATION_DEVELOPMENT_HOST_ENV),
    MIGRATION_DEVELOPMENT_HOST_ENV,
  );

  if (hostname === KNOWN_PRODUCTION_NEON_HOST || approvedDevelopmentHostname === KNOWN_PRODUCTION_NEON_HOST) {
    throw new MigrationTargetError("Production migrations are disabled by this workflow.");
  }

  if (hostname !== approvedDevelopmentHostname) {
    throw new MigrationTargetError(
      `${MIGRATION_DATABASE_URL_ENV} does not match the approved development migration endpoint.`,
    );
  }

  return {
    database: EXPECTED_DATABASE_NAME,
    hostname,
  };
}
