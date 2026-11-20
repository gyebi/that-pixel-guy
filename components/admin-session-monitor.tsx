"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WARNING_DURATION_MS = 2 * 60 * 1000;
const ACTIVITY_RENEWAL_THROTTLE_MS = 60 * 1000;
const SESSION_EVENT_KEY = "tpg-admin-session-event";
const SESSION_CHANNEL = "tpg-admin-session";

type SessionTimes = {
  idleExpiresAt: string;
  absoluteExpiresAt: string;
};

type SessionEvent =
  | { type: "logout"; at: number }
  | { type: "renewed"; at: number; session: SessionTimes };

export function notifyAdminSession(event: SessionEvent) {
  if (typeof window === "undefined") return;

  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(SESSION_CHANNEL);
    channel.postMessage(event);
    window.setTimeout(() => channel.close(), 0);
  }

  try {
    localStorage.setItem(SESSION_EVENT_KEY, JSON.stringify(event));
  } catch {
    // BroadcastChannel above remains available in browsers that block storage.
  }
}

function isSessionTimes(value: unknown): value is SessionTimes {
  if (!value || typeof value !== "object") return false;
  const session = value as Record<string, unknown>;
  return (
    typeof session.idleExpiresAt === "string" &&
    Number.isFinite(Date.parse(session.idleExpiresAt)) &&
    typeof session.absoluteExpiresAt === "string" &&
    Number.isFinite(Date.parse(session.absoluteExpiresAt))
  );
}

async function readSession(response: Response): Promise<SessionTimes | null> {
  const body: unknown = await response.json().catch(() => null);
  if (!body || typeof body !== "object" || !("session" in body)) return null;
  return isSessionTimes((body as { session: unknown }).session)
    ? (body as { session: SessionTimes }).session
    : null;
}

export function AdminSessionMonitor({
  idleExpiresAt,
  absoluteExpiresAt,
}: SessionTimes) {
  const [session, setSession] = useState<SessionTimes>({
    idleExpiresAt,
    absoluteExpiresAt,
  });
  const [warningOpen, setWarningOpen] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState("");
  const warningOpenRef = useRef(false);
  const renewingRef = useRef(false);
  const lastRenewalRef = useRef(0);
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);

  const endSession = useCallback(() => {
    window.location.replace("/admin/login?reason=session-expired");
  }, []);

  const applySession = useCallback((nextSession: SessionTimes, broadcast = true) => {
    setSession(nextSession);
    setWarningOpen(false);
    warningOpenRef.current = false;
    setError("");
    lastRenewalRef.current = Date.now();

    if (broadcast) {
      const event: SessionEvent = { type: "renewed", at: Date.now(), session: nextSession };
      notifyAdminSession(event);
    }
  }, []);

  const renew = useCallback(async () => {
    if (renewingRef.current) return false;
    renewingRef.current = true;

    try {
      const response = await fetch("/api/admin/session/activity", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      const nextSession = await readSession(response);

      if (!response.ok || !nextSession) {
        if (response.status === 401 || response.status === 403) endSession();
        return false;
      }

      applySession(nextSession);
      return true;
    } catch {
      return false;
    } finally {
      renewingRef.current = false;
    }
  }, [applySession, endSession]);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/session/status", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const nextSession = await readSession(response);

      if (!response.ok || !nextSession) {
        if (response.status === 401 || response.status === 403) endSession();
        return false;
      }

      applySession(nextSession, false);
      return true;
    } catch {
      return false;
    }
  }, [applySession, endSession]);

  useEffect(() => {
    const idleDeadline = Date.parse(session.idleExpiresAt);
    const absoluteDeadline = Date.parse(session.absoluteExpiresAt);
    const deadline = Math.min(idleDeadline, absoluteDeadline);
    const now = Date.now();

    if (!Number.isFinite(deadline) || deadline <= now) {
      const timer = window.setTimeout(() => {
        void checkSession().then((active) => {
          if (!active) endSession();
        });
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const warningDelay = Math.max(0, deadline - now - WARNING_DURATION_MS);
    const warningTimer = window.setTimeout(() => {
      warningOpenRef.current = true;
      setWarningOpen(true);
    }, warningDelay);
    const expiryTimer = window.setTimeout(endSession, deadline - now);

    return () => {
      window.clearTimeout(warningTimer);
      window.clearTimeout(expiryTimer);
    };
  }, [checkSession, endSession, session]);

  useEffect(() => {
    function onInteraction() {
      if (warningOpenRef.current || renewingRef.current) return;
      const now = Date.now();

      if (now - lastRenewalRef.current < ACTIVITY_RENEWAL_THROTTLE_MS) return;
      lastRenewalRef.current = now;
      void renew();
    }

    function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      void checkSession().then((active) => {
        const deadline = Math.min(
          Date.parse(session.idleExpiresAt),
          Date.parse(session.absoluteExpiresAt),
        );
        if (!active && Date.now() >= deadline) endSession();
      });
    }

    window.addEventListener("pointerdown", onInteraction, { passive: true });
    window.addEventListener("keydown", onInteraction);
    window.addEventListener("touchstart", onInteraction, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [checkSession, endSession, renew, session]);

  useEffect(() => {
    const channel = typeof BroadcastChannel === "undefined"
      ? null
      : new BroadcastChannel(SESSION_CHANNEL);

    function receive(event: SessionEvent) {
      if (event.type === "logout") {
        endSession();
      } else if (event.type === "renewed") {
        applySession(event.session, false);
      }
    }

    function onChannelMessage(event: MessageEvent<SessionEvent>) {
      if (event.data?.type === "logout" || event.data?.type === "renewed") {
        receive(event.data);
      }
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== SESSION_EVENT_KEY || !event.newValue) return;
      try {
        const data: unknown = JSON.parse(event.newValue);
        if (data && typeof data === "object" && "type" in data) {
          const parsed = data as SessionEvent;
          if (parsed.type === "logout" || (parsed.type === "renewed" && isSessionTimes(parsed.session))) {
            receive(parsed);
          }
        }
      } catch {
        // Ignore malformed cross-tab notifications.
      }
    }

    channel?.addEventListener("message", onChannelMessage);
    window.addEventListener("storage", onStorage);

    return () => {
      channel?.removeEventListener("message", onChannelMessage);
      channel?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [applySession, endSession]);

  useEffect(() => {
    if (!warningOpen) return;
    const frame = window.requestAnimationFrame(() => continueButtonRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [warningOpen]);

  async function continueSession() {
    setContinuing(true);
    setError("");
    const renewed = await renew();

    if (!renewed) {
      setError("We could not continue this session. Check your connection or sign in again.");
    }
    setContinuing(false);
  }

  if (!warningOpen) return null;

  return (
    <div className="admin-session-warning" role="presentation">
      <section
        aria-describedby="admin-session-warning-description"
        aria-labelledby="admin-session-warning-title"
        aria-modal="true"
        className="admin-session-warning__dialog"
        role="dialog"
      >
        <p className="admin-eyebrow">Session timeout</p>
        <h2 id="admin-session-warning-title">Your session will end soon.</h2>
        <p id="admin-session-warning-description">
          You have two minutes to continue. Save any unfinished work before the session ends.
        </p>
        {error && <p className="admin-session-warning__error" role="alert">{error}</p>}
        <div className="admin-session-warning__actions">
          <button className="admin-button" disabled={continuing} onClick={continueSession} ref={continueButtonRef} type="button">
            {continuing ? "Continuing…" : "Continue session"}
          </button>
          <button className="admin-session-warning__signout" onClick={endSession} type="button">
            Sign in again
          </button>
        </div>
      </section>
    </div>
  );
}
