/**
 * The client-gallery demo is intentionally available only outside production.
 * It must never become an authentication path for persisted client data.
 */
export function isDemoAccessEnabled(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv !== "production";
}
