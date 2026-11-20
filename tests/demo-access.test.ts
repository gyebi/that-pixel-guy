import assert from "node:assert/strict";
import test from "node:test";
import { DELETE, POST } from "@/app/api/demo-auth/route";
import { isDemoAccessEnabled } from "@/lib/demo-access";

function withNodeEnvironment<T>(nodeEnv: string, action: () => T | Promise<T>) {
  const previous = process.env.NODE_ENV;
  const environment = process.env as Record<string, string | undefined>;
  environment.NODE_ENV = nodeEnv;

  return Promise.resolve(action()).finally(() => {
    environment.NODE_ENV = previous;
  });
}

test("the client demo is enabled only outside production", () => {
  assert.equal(isDemoAccessEnabled("development"), true);
  assert.equal(isDemoAccessEnabled("test"), true);
  assert.equal(isDemoAccessEnabled("production"), false);
});

test("production rejects demo authentication without issuing a demo cookie", async () => {
  const request = new Request("https://studio.example/api/demo-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: "ama-kwame" }),
  });

  const response = await withNodeEnvironment("production", () => POST(request));
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("set-cookie"), null);

  const deleteResponse = await withNodeEnvironment("production", () => DELETE());
  assert.equal(deleteResponse.status, 404);
  assert.equal(deleteResponse.headers.get("set-cookie"), null);
});

test("development retains the demo route and validates its client selection", async () => {
  const request = new Request("https://studio.example/api/demo-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: "unknown-client" }),
  });

  const response = await withNodeEnvironment("development", () => POST(request));
  assert.equal(response.status, 400);
});
