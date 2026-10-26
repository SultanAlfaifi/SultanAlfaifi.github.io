// Runs the Cloudflare Worker in Node for tests: D1 is backed by node:sqlite, the rate limiters always
// allow, and every outgoing fetch (Turnstile, OpenRouter, Resend) is answered locally and recorded.
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { handle as mockOpenRouter } from "../../evals/mock-openrouter.mjs";

const MIGRATION = readFileSync(new URL("../../worker/migrations/0001_init.sql", import.meta.url), "utf8");

function d1() {
  const db = new DatabaseSync(":memory:");
  db.exec(MIGRATION);
  const statement = (sql, params = []) => ({
    bind: (...values) => statement(sql, values),
    first: async () => db.prepare(sql).get(...params) ?? null,
    run: async () => db.prepare(sql).run(...params),
    all: async () => ({ results: db.prepare(sql).all(...params) }),
    _exec: () => db.prepare(sql).run(...params)
  });
  return {
    db,
    prepare: (sql) => statement(sql),
    batch: async (statements) => statements.map((item) => item._exec())
  };
}

export function createHarness(overrides = {}) {
  const calls = { openrouter: [], resend: [], turnstile: 0 };
  let upstream = (body) => mockOpenRouter(body);
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.includes("challenges.cloudflare.com")) {
      calls.turnstile += 1;
      const token = init.body.get("response");
      return Response.json({ success: token === "ok" });
    }
    if (url.includes("openrouter")) {
      const body = JSON.parse(init.body);
      calls.openrouter.push(body);
      return upstream(body);
    }
    if (url.includes("api.resend.com")) {
      calls.resend.push(JSON.parse(init.body));
      return Response.json({ id: `email_${calls.resend.length}` });
    }
    throw new Error(`Unexpected fetch in test: ${url}`);
  };

  const DB = d1();
  const env = {
    DB,
    CHAT_LIMITER: { limit: async () => ({ success: true }) },
    ACTION_LIMITER: { limit: async () => ({ success: true }) },
    ENVIRONMENT: "development",
    ALLOWED_ORIGINS: "http://localhost:3000",
    SITE_URL: "http://localhost:3000",
    MODEL: "anthropic/claude-sonnet-5.5",
    REASONING_EFFORT: "low",
    EMAIL_FROM: "Sultan Alfaifi <hello@sultalfaifi.com>",
    EMAIL_NOTIFY_FROM: "notifications@sultalfaifi.com",
    DAILY_CHAT_CAP: "400",
    DAILY_CHAT_PER_VISITOR: "40",
    DAILY_EMAIL_CAP: "25",
    DAILY_EMAIL_PER_VISITOR: "3",
    DAILY_CODE_CAP: "40",
    DAILY_TAILOR_CAP: "80",
    DAILY_TAILOR_PER_VISITOR: "8",
    OPENROUTER_API_KEY: "test-key",
    OPENROUTER_URL: "https://openrouter.test/api/v1/chat/completions",
    TURNSTILE_SECRET_KEY: "test-turnstile-secret",
    RESEND_API_KEY: "test-resend",
    SESSION_SECRET: "a-test-session-secret-that-is-long-enough",
    ...overrides
  };

  const pending = [];
  const ctx = { waitUntil: (promise) => pending.push(promise), passThroughOnException() {} };

  return {
    env,
    calls,
    db: DB.db,
    setUpstream(fn) {
      upstream = fn;
    },
    async request(worker, path, { method = "POST", body, token, origin = "http://localhost:3000" } = {}) {
      const headers = { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.7" };
      if (origin) headers.Origin = origin;
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await worker.fetch(new Request(`http://worker.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), env, ctx);
      return response;
    },
    async settle() {
      await Promise.all(pending.splice(0));
    },
    restore() {
      globalThis.fetch = realFetch;
    }
  };
}

export async function readEvents(response) {
  const text = await response.text();
  return text.split("\n\n").filter(Boolean).map((block) => ({
    event: /^event: (.+)$/m.exec(block)?.[1],
    data: JSON.parse(/^data: (.+)$/m.exec(block)?.[1] ?? "null")
  }));
}
