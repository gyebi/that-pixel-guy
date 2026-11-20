import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDevelopmentMigrationTarget,
  MIGRATION_DATABASE_URL_ENV,
  MIGRATION_DEVELOPMENT_HOST_ENV,
  MigrationTargetError,
} from "@/lib/migrations/migration-target";

const developmentHost = "ep-development-123456.c-7.us-east-2.aws.neon.tech";
const productionHost = "ep-muddy-shape-b5cxe640.c-7.us-east-2.aws.neon.tech";

function environment(overrides: Record<string, string | undefined> = {}) {
  return {
    [MIGRATION_DATABASE_URL_ENV]: `postgresql://migration:password@${developmentHost}/pixel-guy?sslmode=require`,
    [MIGRATION_DEVELOPMENT_HOST_ENV]: developmentHost,
    ...overrides,
  };
}

function expectTargetError(work: () => unknown) {
  assert.throws(work, MigrationTargetError);
}

test("accepts only the independently configured direct development endpoint", () => {
  const result = assertDevelopmentMigrationTarget(environment());

  assert.deepEqual(result, {
    database: "pixel-guy",
    hostname: developmentHost,
  });
});

test("rejects a missing migration URL, malformed URL, and pooled URL", () => {
  expectTargetError(() =>
    assertDevelopmentMigrationTarget(
      environment({
        [MIGRATION_DATABASE_URL_ENV]: undefined,
        DATABASE_URL: `postgresql://runtime:password@${developmentHost}/pixel-guy?sslmode=require`,
      }),
    ),
  );
  expectTargetError(() =>
    assertDevelopmentMigrationTarget(environment({ [MIGRATION_DATABASE_URL_ENV]: "not a URL" })),
  );
  expectTargetError(() =>
    assertDevelopmentMigrationTarget(
      environment({
        [MIGRATION_DATABASE_URL_ENV]: "postgresql://migration:password@ep-development-123456-pooler.c-7.us-east-2.aws.neon.tech/pixel-guy?sslmode=require",
      }),
    ),
  );
  expectTargetError(() =>
    assertDevelopmentMigrationTarget(
      environment({
        [MIGRATION_DATABASE_URL_ENV]: `postgresql://migration:password@${developmentHost}:5433/pixel-guy?sslmode=require`,
      }),
    ),
  );
});

test("rejects an incorrect database name", () => {
  expectTargetError(() =>
    assertDevelopmentMigrationTarget(
      environment({
        [MIGRATION_DATABASE_URL_ENV]: `postgresql://migration:password@${developmentHost}/another-database?sslmode=require`,
      }),
    ),
  );
});

test("explicitly rejects the known production endpoint", () => {
  expectTargetError(() =>
    assertDevelopmentMigrationTarget(
      environment({
        [MIGRATION_DATABASE_URL_ENV]: `postgresql://migration:password@${productionHost}/pixel-guy?sslmode=require`,
        [MIGRATION_DEVELOPMENT_HOST_ENV]: productionHost,
      }),
    ),
  );
});

test("requires a separately configured allowlist and exact hostname matching", () => {
  expectTargetError(() =>
    assertDevelopmentMigrationTarget(environment({ [MIGRATION_DEVELOPMENT_HOST_ENV]: undefined })),
  );
  expectTargetError(() =>
    assertDevelopmentMigrationTarget(environment({ [MIGRATION_DEVELOPMENT_HOST_ENV]: "not-a-neon-host.example" })),
  );
  expectTargetError(() =>
    assertDevelopmentMigrationTarget(
      environment({ [MIGRATION_DEVELOPMENT_HOST_ENV]: "ep-other-development-123456.c-7.us-east-2.aws.neon.tech" }),
    ),
  );
});

test("rejects similar-looking and malicious hostnames", () => {
  expectTargetError(() =>
    assertDevelopmentMigrationTarget(
      environment({
        [MIGRATION_DATABASE_URL_ENV]: "postgresql://migration:password@ep-development-123456.c-7.us-east-2.aws.neon.tech.attacker.example/pixel-guy?sslmode=require",
      }),
    ),
  );
  expectTargetError(() =>
    assertDevelopmentMigrationTarget(
      environment({
        [MIGRATION_DATABASE_URL_ENV]: "postgresql://migration:password@attacker-ep-development-123456.c-7.us-east-2.aws.neon.tech/pixel-guy?sslmode=require",
      }),
    ),
  );
});
