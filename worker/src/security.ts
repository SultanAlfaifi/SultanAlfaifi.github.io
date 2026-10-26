import type { Env } from "./env";
import { HttpError } from "./http";

const encoder = new TextEncoder();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

const base64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64url = (value: string) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

// One secret signs sessions, assistant turns, and CV links. SESSION_SECRET is preferred; the Turnstile
// secret is a fallback so a fresh setup still works with one fewer step.
export function signingSecret(env: Env) {
  if (env.SESSION_SECRET && env.SESSION_SECRET.length >= 16) return env.SESSION_SECRET;
  if (env.TURNSTILE_SECRET_KEY) return `turnstile-derived:${env.TURNSTILE_SECRET_KEY}`;
  return null;
}

const keys = new Map<string, Promise<CryptoKey>>();
function hmacKey(secret: string) {
  let key = keys.get(secret);
  if (!key) {
    key = crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
    keys.set(secret, key);
  }
  return key;
}

export async function sign(env: Env, purpose: string, data: string) {
  const secret = signingSecret(env);
  if (!secret) throw new HttpError(503, "not_configured");
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(`${purpose}\n${data}`));
  return base64url(signature);
}

export async function verifySignature(env: Env, purpose: string, data: string, signature: unknown) {
  const secret = signingSecret(env);
  if (!secret || typeof signature !== "string" || !signature) return false;
  try {
    return await crypto.subtle.verify("HMAC", await hmacKey(secret), fromBase64url(signature), encoder.encode(`${purpose}\n${data}`));
  } catch {
    return false;
  }
}

export async function issueSession(env: Env) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = base64url(encoder.encode(JSON.stringify({ v: 1, exp: expiresAt, n: crypto.randomUUID() })));
  return { token: `${payload}.${await sign(env, "session", payload)}`, expiresAt };
}

export async function requireSession(request: Request, env: Env) {
  const header = request.headers.get("Authorization") ?? "";
  const [payload, signature] = header.replace(/^Bearer\s+/i, "").split(".");
  if (!payload || !(await verifySignature(env, "session", payload, signature))) throw new HttpError(401, "session_required");
  try {
    const { exp } = JSON.parse(new TextDecoder().decode(fromBase64url(payload))) as { exp: number };
    if (typeof exp !== "number" || exp < Date.now()) throw new Error("expired");
  } catch {
    throw new HttpError(401, "session_expired");
  }
}

export async function verifyTurnstile(env: Env, token: unknown, ip: string) {
  if (!env.TURNSTILE_SECRET_KEY) throw new HttpError(503, "turnstile_not_configured");
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET_KEY);
  body.append("response", token);
  if (ip !== "local") body.append("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

export async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// A per-day, salted stand-in for the visitor's IP. Counters store this, never the address itself.
export async function visitorKey(env: Env, ip: string, day: string) {
  return (await sha256Hex(`${signingSecret(env) ?? "unsigned"}|${day}|${ip}`)).slice(0, 24);
}

export const today = () => new Date().toISOString().slice(0, 10);
