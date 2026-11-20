import assert from "node:assert/strict";
import test from "node:test";
import { getPrisma, prisma, requireDatabaseUrl } from "@/lib/prisma";

test("Prisma module import defers missing DATABASE_URL validation until runtime access", () => {
  assert.ok(prisma);
  assert.throws(
    () => requireDatabaseUrl(undefined),
    /DATABASE_URL is not configured\./,
  );

  const environment = process.env as Record<string, string | undefined>;
  const originalDatabaseUrl = environment.DATABASE_URL;
  delete environment.DATABASE_URL;

  try {
    assert.throws(
      () => prisma.client,
      /DATABASE_URL is not configured\./,
    );
  } finally {
    if (originalDatabaseUrl === undefined) {
      delete environment.DATABASE_URL;
    } else {
      environment.DATABASE_URL = originalDatabaseUrl;
    }
  }
});

test("Prisma access reuses one client and preserves bound methods", () => {
  const environment = process.env as Record<string, string | undefined>;
  const originalDatabaseUrl = environment.DATABASE_URL;
  environment.DATABASE_URL =
    "postgresql://placeholder:placeholder@127.0.0.1:5432/pixel-guy";

  try {
    const firstClient = getPrisma();
    const secondClient = getPrisma();

    assert.strictEqual(secondClient, firstClient);
    assert.strictEqual(prisma.client, firstClient.client);
    assert.strictEqual(prisma.gallery, firstClient.gallery);

    const extend = prisma.$extends;
    assert.doesNotThrow(() => extend({}));
  } finally {
    if (originalDatabaseUrl === undefined) {
      delete environment.DATABASE_URL;
    } else {
      environment.DATABASE_URL = originalDatabaseUrl;
    }
  }
});
