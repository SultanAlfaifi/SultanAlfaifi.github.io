// Browser side of the agent: Turnstile, the console session, the streamed answer, and the email and CV
// endpoints. Every call fails soft: the caller gets an AgentError code and falls back to scripted behavior.

export const AGENT_URL = (process.env.NEXT_PUBLIC_AGENT_URL ?? "").replace(/\/$/, "");
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
export const agentConfigured = Boolean(AGENT_URL && SITE_KEY);

export type AgentErrorCode = "not_configured" | "offline" | "agent_offline" | "budget" | "rate_limited" | "daily_cap" | "visitor_cap" | "turnstile_failed" | "session_required" | "invalid_email" | "bad_code" | "email_failed" | "upstream" | "selection_rejected" | string;

export class AgentError extends Error {
  constructor(public code: AgentErrorCode) {
    super(code);
  }
}

export type Health = { agent: boolean; email: boolean; paused: string | null; knowledge: string };

export async function checkHealth(signal?: AbortSignal): Promise<Health | null> {
  if (!agentConfigured) return null;
  try {
    const response = await fetch(`${AGENT_URL}/health`, { signal, cache: "no-store" });
    return response.ok ? ((await response.json()) as Health) : null;
  } catch {
    return null;
  }
}

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScript: Promise<TurnstileApi> | null = null;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  turnstileScript ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new AgentError("turnstile_failed")));
    script.onerror = () => {
      turnstileScript = null;
      reject(new AgentError("offline"));
    };
    document.head.appendChild(script);
  });
  return turnstileScript;
}

// Renders an invisible-unless-needed Turnstile check into `slot` and resolves with a single-use token.
export async function turnstileToken(slot: HTMLElement, locale: "en" | "ar", action: string): Promise<string> {
  const api = await loadTurnstile();
  return new Promise<string>((resolve, reject) => {
    let widget = "";
    const finish = (callback: () => void) => {
      callback();
      window.setTimeout(() => api.remove(widget), 0);
    };
    widget = api.render(slot, {
      sitekey: SITE_KEY,
      action,
      language: locale,
      appearance: "interaction-only",
      callback: (token: string) => finish(() => resolve(token)),
      "error-callback": () => finish(() => reject(new AgentError("turnstile_failed"))),
      "timeout-callback": () => finish(() => reject(new AgentError("turnstile_failed")))
    });
  });
}

const SESSION_KEY = "agent-session";
let session: { token: string; expiresAt: number } | null = null;

function storedSession() {
  if (session && session.expiresAt > Date.now() + 60_000) return session;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as typeof session) : null;
    if (parsed && parsed.expiresAt > Date.now() + 60_000) return (session = parsed);
  } catch {
    // Private windows can block storage; a fresh session is fetched instead.
  }
  return null;
}

async function request<T>(path: string, body: unknown, init: { token?: string; signal?: AbortSignal } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${AGENT_URL}${path}`, {
      method: "POST",
      signal: init.signal,
      headers: { "Content-Type": "application/json", ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}) },
      body: JSON.stringify(body)
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new AgentError("offline");
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new AgentError(payload.error ?? (response.status >= 500 ? "upstream" : "offline"));
  }
  return (await response.json()) as T;
}

export async function ensureSession(slot: HTMLElement, locale: "en" | "ar") {
  if (!agentConfigured) throw new AgentError("not_configured");
  const cached = storedSession();
  if (cached) return cached.token;
  const token = await turnstileToken(slot, locale, "session");
  session = await request<{ token: string; expiresAt: number }>("/session", { turnstileToken: token });
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // See storedSession.
  }
  return session.token;
}

export function dropSession() {
  session = null;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear.
  }
}

// Calls `run` with a session token, renewing the session once if the Worker says it expired.
export async function withSession<T>(slot: HTMLElement, locale: "en" | "ar", run: (token: string) => Promise<T>) {
  try {
    return await run(await ensureSession(slot, locale));
  } catch (error) {
    if (error instanceof AgentError && (error.code === "session_required" || error.code === "session_expired")) {
      dropSession();
      return run(await ensureSession(slot, locale));
    }
    throw error;
  }
}

export type ChatTurn = { role: "user" | "assistant"; content: string; sig?: string };
export type Bilingual = { en: string; ar: string };
export type FitItem = { point: string; evidence: string[] };
export type FitReport = { role: string; strong: FitItem[]; partial: FitItem[]; gaps: { point: string; plan: string }[]; summary: string };
export type AgentAction =
  | { type: "open"; anchor: string; kind: "section" | "project"; label: Bilingual; collapsed: boolean; external: { href: string; label: Bilingual } | null }
  | { type: "fit_report"; report: FitReport }
  | { type: "draft_email"; draft: { subject: string; body: string; topic: string } };

export type AgentEvent =
  | { event: "trace"; data: { step: string; text: string; error?: boolean } }
  | { event: "delta"; data: { text: string } }
  | { event: "action"; data: AgentAction }
  | { event: "done"; data: { signature: string; sources: string[]; removed: string[] } }
  | { event: "error"; data: { code: string; partial: boolean } };

export async function streamChat(token: string, turns: ChatTurn[], locale: "en" | "ar", onEvent: (event: AgentEvent) => void, signal?: AbortSignal) {
  let response: Response;
  try {
    response = await fetch(`${AGENT_URL}/chat`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages: turns, locale })
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new AgentError("offline");
  }
  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new AgentError(payload.error ?? "offline");
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = /^event: (.+)$/m.exec(block)?.[1];
      const data = /^data: (.+)$/m.exec(block)?.[1];
      if (!event || !data) continue;
      try {
        onEvent({ event, data: JSON.parse(data) } as AgentEvent);
      } catch {
        // A malformed frame is skipped rather than breaking the whole answer.
      }
    }
  }
}

export type SendResult = { sent: boolean; dryRun?: boolean; devCode?: string };

export function sendEmailToSultan(turnstile: string, message: { name: string; email: string; subject: string; message: string; topic: string }) {
  return request<SendResult>("/email/send", { ...message, turnstileToken: turnstile });
}

export type TailorResult = { encoded: string; coverMessage: string; target: string; signature: string; source: "ai" };

export function tailorCv(token: string, description: string, company: string, locale: "en" | "ar") {
  return request<TailorResult>("/cv/tailor", { description, company, locale }, { token });
}

export function notifyCvDownload(token: string, payload: { selection: string; company: string; coverMessage?: string; signature?: string }) {
  return request<SendResult>("/cv/notify", payload, { token });
}

export function requestCvCode(turnstile: string, email: string) {
  return request<SendResult>("/cv/code", { email, turnstileToken: turnstile });
}

export function confirmCvCode(token: string, payload: { email: string; code: string; selection: string; company: string; coverMessage?: string; signature?: string }) {
  return request<SendResult>("/cv/confirm", payload, { token });
}
