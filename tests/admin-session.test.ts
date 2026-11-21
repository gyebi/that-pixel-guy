import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_ABSOLUTE_TIMEOUT_MS,
  ADMIN_IDLE_TIMEOUT_MS,
  createAdminSessionService,
  hashAdminSessionId,
  type AdminSessionRecord,
  type AdminSessionStore,
} from "@/lib/auth/admin-session-service";
import { hasSameOrigin } from "@/lib/auth/same-origin";

class InMemoryAdminSessionStore implements AdminSessionStore {
  sessions = new Map<string, AdminSessionRecord>();
  renewCalls = 0;
  fail = false;

  async create(input: {
    sessionIdHash: string;
    uid: string;
    lastActivityAt: Date;
    absoluteExpiresAt: Date;
  }) {
    if (this.fail) throw new Error("storage unavailable");
    this.sessions.set(input.sessionIdHash, {
      ...input,
      createdAt: new Date(input.lastActivityAt),
      revokedAt: null,
    });
  }

  async findByHash(sessionIdHash: string) {
    if (this.fail) throw new Error("storage unavailable");
    const session = this.sessions.get(sessionIdHash);
    return session ? { ...session } : null;
  }

  async renew(input: {
    sessionIdHash: string;
    uid: string;
    now: Date;
    idleCutoff: Date;
  }) {
    if (this.fail) throw new Error("storage unavailable");
    this.renewCalls += 1;
    const session = this.sessions.get(input.sessionIdHash);
    if (
      !session ||
      session.uid !== input.uid ||
      session.revokedAt !== null ||
      session.absoluteExpiresAt <= input.now ||
      session.lastActivityAt <= input.idleCutoff
    ) {
      return false;
    }
    session.lastActivityAt = input.now;
    return true;
  }

  async revoke(sessionIdHash: string, now: Date) {
    if (this.fail) throw new Error("storage unavailable");
    const session = this.sessions.get(sessionIdHash);
    if (session && session.revokedAt === null) session.revokedAt = now;
  }
}

const startedAt = new Date("2026-11-16T12:00:00.000Z");

async function createSession() {
  const store = new InMemoryAdminSessionStore();
  const service = createAdminSessionService(store);
  const created = await service.create("approved-admin", startedAt);
  return { store, service, created };
}

test("validates the hashed opaque session ID without extending activity", async () => {
  const { store, service, created } = await createSession();
  const hash = hashAdminSessionId(created.sessionId);
  assert.ok(store.sessions.has(hash));
  assert.notEqual(created.sessionId, hash);

  const result = await service.validate(
    created.sessionId,
    "approved-admin",
    new Date(startedAt.getTime() + 5 * 60 * 1000),
  );
  assert.equal(result?.uid, "approved-admin");
  assert.equal(store.renewCalls, 0);
  assert.equal(store.sessions.get(hash)?.lastActivityAt.getTime(), startedAt.getTime());
});

test("rejects tampered, expired, absolute-expired, and revoked session IDs", async () => {
  const { service, created } = await createSession();
  assert.equal(await service.validate("tampered", "approved-admin", startedAt), null);
  assert.equal(
    await service.validate(
      created.sessionId,
      "approved-admin",
      new Date(startedAt.getTime() + ADMIN_IDLE_TIMEOUT_MS),
    ),
    null,
  );

  const fresh = await createSession();
  assert.equal(
    await fresh.service.validate(
      fresh.created.sessionId,
      "approved-admin",
      new Date(startedAt.getTime() + ADMIN_ABSOLUTE_TIMEOUT_MS),
    ),
    null,
  );
  await fresh.service.revoke(fresh.created.sessionId, startedAt);
  assert.equal(await fresh.service.validate(fresh.created.sessionId, "approved-admin", startedAt), null);
});

test("explicit renewal updates idle activity but never extends absolute expiry", async () => {
  const { service, created } = await createSession();
  let renewalTime = new Date(startedAt.getTime() + 14 * 60 * 1000);
  let renewed = await service.renew(created.sessionId, "approved-admin", renewalTime);

  while (renewalTime.getTime() + 14 * 60 * 1000 < startedAt.getTime() + ADMIN_ABSOLUTE_TIMEOUT_MS) {
    renewalTime = new Date(renewalTime.getTime() + 14 * 60 * 1000);
    renewed = await service.renew(created.sessionId, "approved-admin", renewalTime);
  }

  assert.equal(renewed?.absoluteExpiresAt.getTime(), startedAt.getTime() + ADMIN_ABSOLUTE_TIMEOUT_MS);
  assert.equal(renewed?.idleExpiresAt.getTime(), renewalTime.getTime() + ADMIN_IDLE_TIMEOUT_MS);
  assert.equal(
    await service.validate(
      created.sessionId,
      "approved-admin",
      new Date(startedAt.getTime() + ADMIN_ABSOLUTE_TIMEOUT_MS),
    ),
    null,
  );
});

test("concurrent renewal and logout leaves the session revoked", async () => {
  const { service, created } = await createSession();
  const now = new Date(startedAt.getTime() + 60_000);

  await Promise.all([
    service.renew(created.sessionId, "approved-admin", now),
    service.revoke(created.sessionId, now),
  ]);

  assert.equal(await service.validate(created.sessionId, "approved-admin", now), null);
  assert.equal(await service.renew(created.sessionId, "approved-admin", now), null);
});

test("storage failures cannot produce an authenticated session", async () => {
  const { store, service, created } = await createSession();
  store.fail = true;
  await assert.rejects(() => service.validate(created.sessionId, "approved-admin", startedAt));
  await assert.rejects(() => service.renew(created.sessionId, "approved-admin", startedAt));
});

test("development session-changing requests require an exact same origin", () => {
  const sameOrigin = new Request("https://studio.example/api/admin/session/activity", {
    method: "POST",
    headers: { Origin: "https://studio.example" },
  });
  const crossOrigin = new Request("https://studio.example/api/admin/session/activity", {
    method: "POST",
    headers: { Origin: "https://attacker.example" },
  });
  const missingOrigin = new Request("https://studio.example/api/admin/session/activity", {
    method: "POST",
  });

  assert.equal(hasSameOrigin(sameOrigin), true);
  assert.equal(hasSameOrigin(crossOrigin), false);
  assert.equal(hasSameOrigin(missingOrigin), false);
});

function withEnvironment(name: string, value: string | undefined, run: () => void) {
  const environment = process.env as Record<string, string | undefined>;
  const previous = environment[name];

  if (value === undefined) {
    delete environment[name];
  } else {
    environment[name] = value;
  }

  try {
    run();
  } finally {
    if (previous === undefined) {
      delete environment[name];
    } else {
      environment[name] = previous;
    }
  }
}

function withProductionOrigins(origins: string | undefined, run: () => void) {
  withEnvironment("NODE_ENV", "production", () => {
    withEnvironment("ADMIN_TRUSTED_ORIGINS", origins, run);
  });
}

test("production accepts an exact trusted HTTPS browser origin behind App Hosting", () => {
  withProductionOrigins("https://pixel-guy.web.app", () => {
    const request = new Request("https://internal-service.run.app/api/admin/session", {
      method: "POST",
      headers: { Origin: "https://pixel-guy.web.app" },
    });

    assert.equal(hasSameOrigin(request), true);
  });
});

test("production rejects untrusted, missing, malformed, HTTP, and wrong-port origins", () => {
  withProductionOrigins("https://pixel-guy.web.app", () => {
    const request = (origin?: string) =>
      new Request("https://internal-service.run.app/api/admin/session", {
        method: "POST",
        headers: origin ? { Origin: origin } : undefined,
      });

    assert.equal(hasSameOrigin(request("https://attacker.example")), false);
    assert.equal(hasSameOrigin(request()), false);
    assert.equal(hasSameOrigin(request("https://pixel-guy.web.app,https://attacker.example")), false);
    assert.equal(hasSameOrigin(request("http://pixel-guy.web.app")), false);
    assert.equal(hasSameOrigin(request("https://pixel-guy.web.app:8443")), false);
  });
});

test("production fails closed for malformed, wildcard, or duplicate trusted-origin configuration", () => {
  const request = new Request("https://internal-service.run.app/api/admin/session", {
    method: "POST",
    headers: { Origin: "https://pixel-guy.web.app" },
  });

  for (const origins of [
    undefined,
    "https://pixel-guy.web.app/",
    "http://pixel-guy.web.app",
    "https://*.web.app",
    "https://pixel-guy.web.app,https://pixel-guy.web.app",
  ]) {
    withProductionOrigins(origins, () => {
      assert.equal(hasSameOrigin(request), false, origins);
    });
  }
});

test("production permits each of multiple exact configured origins", () => {
  withProductionOrigins("https://pixel-guy.web.app,https://photos.example.com:8443", () => {
    for (const origin of ["https://pixel-guy.web.app", "https://photos.example.com:8443"]) {
      const request = new Request("https://internal-service.run.app/api/admin/session", {
        method: "POST",
        headers: { Origin: origin },
      });

      assert.equal(hasSameOrigin(request), true);
    }
  });
});

test("forwarded and Host headers cannot authorize a production request", () => {
  withProductionOrigins("https://pixel-guy.web.app", () => {
    const forged = new Request("http://internal.service/api/admin/session", {
      method: "POST",
      headers: {
        Origin: "https://attacker.example",
        Host: "pixel-guy.web.app",
        "X-Forwarded-Host": "pixel-guy.web.app",
        "X-Forwarded-Proto": "https",
      },
    });

    assert.equal(hasSameOrigin(forged), false);
  });
});
