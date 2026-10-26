import type { Env } from "./env";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

export function allowedOrigin(request: Request, env: Env) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  const allowed = env.ALLOWED_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

export function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

export function json(body: unknown, status = 200, origin: string | null = null, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders(origin), ...extra }
  });
}

export async function readJson<T>(request: Request, maxBytes = 24_000): Promise<T> {
  const length = Number(request.headers.get("Content-Length") ?? "0");
  if (length > maxBytes) throw new HttpError(413, "too_large");
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, "too_large");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

export const clientIp = (request: Request) => request.headers.get("CF-Connecting-IP") ?? "local";

// Strips control characters (incl. CR/LF) so visitor text can't break headers or fake new lines in subjects.
export function cleanLine(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, "").trim().slice(0, max) : "";
}

export const isEmail = (value: string) => /^[^\s@<>()",;:]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/.test(value);
