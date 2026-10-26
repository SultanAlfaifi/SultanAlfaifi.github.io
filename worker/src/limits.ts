import { numberVar, type Env } from "./env";
import { HttpError } from "./http";
import { today, visitorKey } from "./security";

type Bucket = "chat" | "email" | "code" | "tailor" | "notify";

const CAPS: Record<Bucket, (env: Env) => { global: number; visitor: number }> = {
  chat: (env) => ({ global: numberVar(env.DAILY_CHAT_CAP, 400), visitor: numberVar(env.DAILY_CHAT_PER_VISITOR, 40) }),
  email: (env) => ({ global: numberVar(env.DAILY_EMAIL_CAP, 25), visitor: numberVar(env.DAILY_EMAIL_PER_VISITOR, 3) }),
  code: (env) => ({ global: numberVar(env.DAILY_CODE_CAP, 40), visitor: 3 }),
  tailor: (env) => ({ global: numberVar(env.DAILY_TAILOR_CAP, 80), visitor: numberVar(env.DAILY_TAILOR_PER_VISITOR, 8) }),
  notify: (env) => ({ global: numberVar(env.DAILY_TAILOR_CAP, 80), visitor: numberVar(env.DAILY_TAILOR_PER_VISITOR, 8) })
};

async function bump(env: Env, key: string, day: string) {
  const row = await env.DB.prepare(
    "INSERT INTO counters (key, day, count) VALUES (?1, ?2, 1) ON CONFLICT (key, day) DO UPDATE SET count = count + 1 RETURNING count"
  ).bind(key, day).first<{ count: number }>();
  return row?.count ?? 1;
}

// Per-minute bursts go through Cloudflare's rate limiter; daily totals through D1 counters.
export async function enforceLimits(env: Env, bucket: Bucket, ip: string, extraKey?: string) {
  const limiter = bucket === "chat" || bucket === "tailor" ? env.CHAT_LIMITER : env.ACTION_LIMITER;
  const day = today();
  const visitor = await visitorKey(env, ip, day);
  const { success } = await limiter.limit({ key: `${bucket}:${visitor}` });
  if (!success) throw new HttpError(429, "rate_limited");

  const caps = CAPS[bucket](env);
  const [global, mine, extra] = await Promise.all([
    bump(env, `${bucket}:all`, day),
    bump(env, `${bucket}:v:${visitor}`, day),
    extraKey ? bump(env, `${bucket}:x:${extraKey}`, day) : Promise.resolve(0)
  ]);
  if (global > caps.global) throw new HttpError(429, "daily_cap");
  if (mine > caps.visitor || extra > caps.visitor) throw new HttpError(429, "visitor_cap");
}

const BUDGET_KEY = "model_paused";

export async function modelPaused(env: Env) {
  const row = await env.DB.prepare("SELECT value FROM state WHERE key = ?1 AND expires_at > ?2").bind(BUDGET_KEY, Date.now()).first<{ value: string }>();
  return row?.value ?? null;
}

// After OpenRouter says the credit cap is reached, stop calling it for a while instead of failing every request.
export async function pauseModel(env: Env, reason: string, minutes = 30) {
  await env.DB.prepare("INSERT INTO state (key, value, expires_at) VALUES (?1, ?2, ?3) ON CONFLICT (key) DO UPDATE SET value = ?2, expires_at = ?3")
    .bind(BUDGET_KEY, reason, Date.now() + minutes * 60_000)
    .run();
}

export async function cleanup(env: Env) {
  const now = Date.now();
  const dayBefore = new Date(now - 2 * 86_400_000).toISOString().slice(0, 10);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM questions WHERE created_at < ?1").bind(now - 30 * 86_400_000),
    env.DB.prepare("DELETE FROM counters WHERE day < ?1").bind(dayBefore),
    env.DB.prepare("DELETE FROM codes WHERE expires_at < ?1").bind(now),
    env.DB.prepare("DELETE FROM state WHERE expires_at < ?1").bind(now)
  ]);
}
