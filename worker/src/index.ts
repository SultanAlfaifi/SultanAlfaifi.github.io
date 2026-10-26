// Sultan's portfolio agent: a small Cloudflare Worker that holds the OpenRouter and Resend keys,
// so the static site on GitHub Pages never sees them.
import { handleChat } from "./chat";
import { handleCodeConfirm, handleCodeStart, handleNotify, handleTailor } from "./cv";
import { handleEmailSend } from "./email";
import type { Env } from "./env";
import { KNOWLEDGE_VERSION } from "./generated/knowledge";
import { HttpError, allowedOrigin, clientIp, corsHeaders, json, readJson } from "./http";
import { cleanup, modelPaused } from "./limits";
import { issueSession, signingSecret, verifyTurnstile } from "./security";

async function health(env: Env) {
  const paused = await modelPaused(env).catch(() => null);
  const ready = Boolean(env.TURNSTILE_SECRET_KEY && signingSecret(env));
  return {
    ok: true,
    agent: ready && Boolean(env.OPENROUTER_API_KEY) && !paused,
    paused: paused ? "budget" : null,
    email: ready && Boolean(env.RESEND_API_KEY),
    model: env.MODEL,
    knowledge: KNOWLEDGE_VERSION
  };
}

async function handleSession(request: Request, env: Env) {
  const body = await readJson<{ turnstileToken?: unknown }>(request);
  const ip = clientIp(request);
  const { success } = await env.ACTION_LIMITER.limit({ key: `session:${ip}` });
  if (!success) throw new HttpError(429, "rate_limited");
  if (!signingSecret(env)) throw new HttpError(503, "not_configured");
  if (!(await verifyTurnstile(env, body.turnstileToken, ip))) throw new HttpError(403, "turnstile_failed");
  return issueSession(env);
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const origin = allowedOrigin(request, env);
    const { pathname } = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: origin ? 204 : 403, headers: corsHeaders(origin) });
    // Only the site's own pages may call anything but /health.
    if (pathname !== "/health" && !origin) return json({ error: "origin_not_allowed" }, 403);

    try {
      switch (`${request.method} ${pathname}`) {
        case "GET /health":
          return json(await health(env), 200, origin);
        case "POST /session":
          return json(await handleSession(request, env), 200, origin);
        case "POST /chat":
          return await handleChat(request, env, ctx, origin);
        case "POST /email/send":
          return json(await handleEmailSend(request, env), 200, origin);
        case "POST /cv/tailor":
          return json(await handleTailor(request, env), 200, origin);
        case "POST /cv/notify":
          return json(await handleNotify(request, env), 200, origin);
        case "POST /cv/code":
          return json(await handleCodeStart(request, env), 200, origin);
        case "POST /cv/confirm":
          return json(await handleCodeConfirm(request, env), 200, origin);
        default:
          return json({ error: "not_found" }, 404, origin);
      }
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.code }, error.status, origin);
      console.error(error);
      return json({ error: "server_error" }, 500, origin);
    }
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(cleanup(env));
  }
} satisfies ExportedHandler<Env>;
