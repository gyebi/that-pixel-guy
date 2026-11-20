
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// The global cache survives development hot reloads. The module cache ensures
// production requests reuse a single client for the lifetime of this module.
let modulePrisma: PrismaClient | undefined;

export function requireDatabaseUrl(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return connectionString;
}

export function getPrisma() {
  const existingPrisma = modulePrisma ?? globalForPrisma.prisma;

  if (existingPrisma) {
    modulePrisma = existingPrisma;
    return existingPrisma;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: requireDatabaseUrl(),
    }),
  });

  modulePrisma = prisma;

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}

// Repository modules are evaluated while Next.js collects page data. Delay
// client construction until a query or transaction is actually requested, so
// credential-free CI builds do not initialize a database adapter.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrisma();
    const value = Reflect.get(client, property, client);

    return typeof value === "function" ? value.bind(client) : value;
  },
});
