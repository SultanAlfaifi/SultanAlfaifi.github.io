export interface Env {
  DB: D1Database;
  CHAT_LIMITER: RateLimit;
  ACTION_LIMITER: RateLimit;

  ENVIRONMENT: "development" | "production";
  ALLOWED_ORIGINS: string;
  SITE_URL: string;
  MODEL: string;
  REASONING_EFFORT: string;
  EMAIL_FROM: string;
  DAILY_CHAT_CAP: string;
  DAILY_CHAT_PER_VISITOR: string;
  DAILY_EMAIL_CAP: string;
  DAILY_EMAIL_PER_VISITOR: string;
  DAILY_CODE_CAP: string;
  DAILY_TAILOR_CAP: string;
  DAILY_TAILOR_PER_VISITOR: string;

  // Secrets: set by Sultan with `wrangler secret put` (production) or worker/.dev.vars (local).
  OPENROUTER_API_KEY?: string;
  // Local testing only: point the agent at a mock OpenRouter (tests and evals/mock-openrouter.mjs).
  OPENROUTER_URL?: string;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  SESSION_SECRET?: string;
}

export const numberVar = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};
