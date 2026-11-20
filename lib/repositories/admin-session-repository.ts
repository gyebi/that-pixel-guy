import { prisma } from "@/lib/prisma";
import type {
  AdminSessionRecord,
  AdminSessionStore,
} from "@/lib/auth/admin-session-service";

function mapRecord(record: {
  sessionIdHash: string;
  uid: string;
  createdAt: Date;
  lastActivityAt: Date;
  absoluteExpiresAt: Date;
  revokedAt: Date | null;
}): AdminSessionRecord {
  return record;
}

export const adminSessionRepository: AdminSessionStore = {
  async create(input) {
    await prisma.adminSession.create({ data: input });
  },

  async findByHash(sessionIdHash) {
    const session = await prisma.adminSession.findUnique({
      where: { sessionIdHash },
      select: {
        sessionIdHash: true,
        uid: true,
        createdAt: true,
        lastActivityAt: true,
        absoluteExpiresAt: true,
        revokedAt: true,
      },
    });

    return session ? mapRecord(session) : null;
  },

  async renew({ sessionIdHash, uid, now, idleCutoff }) {
    const result = await prisma.adminSession.updateMany({
      where: {
        sessionIdHash,
        uid,
        revokedAt: null,
        absoluteExpiresAt: { gt: now },
        lastActivityAt: { gt: idleCutoff },
      },
      data: { lastActivityAt: now },
    });

    return result.count === 1;
  },

  async revoke(sessionIdHash, now) {
    await prisma.adminSession.updateMany({
      where: { sessionIdHash, revokedAt: null },
      data: { revokedAt: now },
    });
  },
};
