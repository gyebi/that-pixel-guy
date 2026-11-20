import { createHash, randomBytes } from "node:crypto";

export const ADMIN_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const ADMIN_ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

export type AdminSessionRecord = {
  sessionIdHash: string;
  uid: string;
  createdAt: Date;
  lastActivityAt: Date;
  absoluteExpiresAt: Date;
  revokedAt: Date | null;
};

export type ValidAdminSession = {
  uid: string;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
};

export type AdminSessionStore = {
  create(input: {
    sessionIdHash: string;
    uid: string;
    lastActivityAt: Date;
    absoluteExpiresAt: Date;
  }): Promise<void>;
  findByHash(sessionIdHash: string): Promise<AdminSessionRecord | null>;
  renew(input: {
    sessionIdHash: string;
    uid: string;
    now: Date;
    idleCutoff: Date;
  }): Promise<boolean>;
  revoke(sessionIdHash: string, now: Date): Promise<void>;
};

export function hashAdminSessionId(sessionId: string) {
  return createHash("sha256").update(sessionId).digest("base64url");
}

export function createAdminSessionId() {
  return randomBytes(32).toString("base64url");
}

function isLive(record: AdminSessionRecord, uid: string, now: Date) {
  return (
    record.uid === uid &&
    record.revokedAt === null &&
    record.absoluteExpiresAt.getTime() > now.getTime() &&
    record.lastActivityAt.getTime() + ADMIN_IDLE_TIMEOUT_MS > now.getTime()
  );
}

function toValidSession(record: AdminSessionRecord): ValidAdminSession {
  return {
    uid: record.uid,
    idleExpiresAt: new Date(record.lastActivityAt.getTime() + ADMIN_IDLE_TIMEOUT_MS),
    absoluteExpiresAt: record.absoluteExpiresAt,
  };
}

export function createAdminSessionService(store: AdminSessionStore) {
  return {
    async create(uid: string, now = new Date()) {
      const sessionId = createAdminSessionId();
      const sessionIdHash = hashAdminSessionId(sessionId);
      const absoluteExpiresAt = new Date(now.getTime() + ADMIN_ABSOLUTE_TIMEOUT_MS);

      await store.create({
        sessionIdHash,
        uid,
        lastActivityAt: now,
        absoluteExpiresAt,
      });

      return {
        sessionId,
        session: {
          uid,
          idleExpiresAt: new Date(now.getTime() + ADMIN_IDLE_TIMEOUT_MS),
          absoluteExpiresAt,
        },
      };
    },

    async validate(sessionId: string, uid: string, now = new Date()) {
      const record = await store.findByHash(hashAdminSessionId(sessionId));
      return record && isLive(record, uid, now) ? toValidSession(record) : null;
    },

    async renew(sessionId: string, uid: string, now = new Date()) {
      const sessionIdHash = hashAdminSessionId(sessionId);
      const record = await store.findByHash(sessionIdHash);

      if (!record || !isLive(record, uid, now)) {
        return null;
      }

      const renewed = await store.renew({
        sessionIdHash,
        uid,
        now,
        idleCutoff: new Date(now.getTime() - ADMIN_IDLE_TIMEOUT_MS),
      });

      if (!renewed) {
        return null;
      }

      return {
        uid,
        idleExpiresAt: new Date(now.getTime() + ADMIN_IDLE_TIMEOUT_MS),
        absoluteExpiresAt: record.absoluteExpiresAt,
      } satisfies ValidAdminSession;
    },

    async revoke(sessionId: string, now = new Date()) {
      await store.revoke(hashAdminSessionId(sessionId), now);
    },
  };
}
