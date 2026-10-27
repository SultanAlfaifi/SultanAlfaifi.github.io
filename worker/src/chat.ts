import type { Env } from "./env";
import { KNOWLEDGE_VERSION } from "./generated/knowledge";
import { HttpError, cleanText, clientIp, corsHeaders, readJson } from "./http";
import { enforceLimits, modelPaused, pauseModel } from "./limits";
import { logQuestion } from "./log";
import { UpstreamError, streamTurn, type ChatMessage, type ToolCall, type Usage } from "./openrouter";
import { systemParts } from "./prompt";
import { requireSession, sign, verifySignature } from "./security";
import { TOOL_DEFINITIONS, checkLinks, runTool, type ToolRecord } from "./tools";

type Locale = "en" | "ar";
type Incoming = { role?: unknown; content?: unknown; sig?: unknown; tools?: unknown };

const ARABIC = /[\u0600-\u06ff]/;
const MAX_STEPS = 4;

const COPY = {
  en: {
    plan: (both: boolean) => `knowledge ${KNOWLEDGE_VERSION} (${both ? "EN + AR" : "EN"}) · tools: open_on_page, match_requirements, show_fit_report, draft_email`,
    sources: (list: string) => list || "none cited",
    removed: (count: number) => `dropped ${count} link${count === 1 ? "" : "s"} that ${count === 1 ? "isn't" : "aren't"} on this site`,
    policy: "the draft goes to Sultan only if you press Send",
    steps: "stopped after 4 steps"
  },
  ar: {
    plan: (both: boolean) => `المعرفة ${KNOWLEDGE_VERSION} (${both ? "عربي + إنجليزي" : "إنجليزي"}) · الأدوات: open_on_page، match_requirements، show_fit_report، draft_email`,
    sources: (list: string) => list || "بلا مصادر",
    removed: (count: number) => `حذفت ${count} رابط مو موجود في الموقع`,
    policy: "المسودة ما تروح لسلطان إلا إذا ضغطت «أرسلها»",
    steps: "توقفت بعد 4 خطوات"
  }
};

// What a turn's signature covers: the answer, plus the tools that ran for it when there were any.
// Answers without tools sign the same way they always did, so a tab left open survives a deploy.
const turnPayload = (content: string, tools: ToolRecord[]) => (tools.length ? JSON.stringify({ content, tools }) : content);

// Assistant turns come back from the browser, so each one carries the signature the Worker gave it.
// Unsigned or edited turns are dropped instead of being trusted as something the assistant said. A
// turn that used tools is replayed as the calls it made, so the model knows those actions happened
// and doesn't apologise for them or run them again.
async function sanitizeHistory(env: Env, raw: unknown) {
  if (!Array.isArray(raw) || !raw.length) throw new HttpError(400, "messages_required");
  const recent = (raw as Incoming[]).slice(-12);
  const turns: { size: number; messages: ChatMessage[] }[] = [];
  for (const [index, message] of recent.entries()) {
    const last = index === recent.length - 1;
    if (message.role === "user") {
      const content = cleanText(message.content, last ? 6000 : 2000);
      if (content) turns.push({ size: content.length, messages: [{ role: "user", content }] });
    } else if (message.role === "assistant" && typeof message.content === "string") {
      const content = message.content.slice(0, 4000);
      const tools = Array.isArray(message.tools) ? (message.tools as ToolRecord[]) : [];
      if (!(await verifySignature(env, "turn", turnPayload(content, tools), message.sig))) continue;
      const calls: ToolCall[] = tools.map((tool, position) => ({ id: `past_${index}_${position}`, type: "function", function: { name: tool.name, arguments: JSON.stringify(tool.args) } }));
      const messages: ChatMessage[] = calls.length ? [{ role: "assistant", content: null, tool_calls: calls }] : [];
      calls.forEach((call, position) => messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ ok: true, memo: tools[position].memo }) }));
      const reply = content || tools.map((tool) => tool.memo).join(" ");
      if (reply) messages.push({ role: "assistant", content: reply });
      if (messages.length) turns.push({ size: reply.length + (tools.length ? JSON.stringify(tools).length : 0), messages });
    }
  }
  const lastTurn = turns[turns.length - 1]?.messages[0];
  if (!lastTurn || lastTurn.role !== "user") throw new HttpError(400, "last_message_must_be_user");
  let total = turns.reduce((sum, turn) => sum + turn.size, 0);
  while (total > 16000 && turns.length > 1) total -= turns.shift()!.size;
  // The conversation opens with the visitor, never with a reply cut off from its question.
  while (turns.length > 1 && turns[0].messages[0].role !== "user") turns.shift();
  return { history: turns.flatMap((turn) => turn.messages), question: lastTurn.content };
}

export async function handleChat(request: Request, env: Env, ctx: ExecutionContext, origin: string | null) {
  await requireSession(request, env);
  if (!env.OPENROUTER_API_KEY) throw new HttpError(503, "agent_offline");
  if (await modelPaused(env)) throw new HttpError(503, "budget");
  const body = await readJson<{ messages?: unknown; locale?: unknown }>(request, 60_000);
  const locale: Locale = body.locale === "ar" ? "ar" : "en";
  const { history, question } = await sanitizeHistory(env, body.messages);
  await enforceLimits(env, "chat", clientIp(request));

  const copy = COPY[locale];
  const includeArabic = locale === "ar" || history.some((message) => message.role === "user" && ARABIC.test(message.content));
  const messages: ChatMessage[] = [{ role: "system", content: systemParts(includeArabic, locale) }, ...history];

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const upstream = new AbortController();
  let disconnected = false;
  const send = async (event: string, data: unknown) => {
    if (disconnected) return;
    try {
      await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    } catch {
      disconnected = true;
      upstream.abort();
    }
  };

  const task = (async () => {
    let answer = "";
    const toolsUsed: string[] = [];
    const performed: ToolRecord[] = [];
    const usage: Required<Pick<Usage, "prompt_tokens" | "completion_tokens">> & { cached: number; cost: number } = { prompt_tokens: 0, completion_tokens: 0, cached: 0, cost: 0 };
    let outcome = "answered";
    try {
      await send("trace", { step: "plan", text: copy.plan(includeArabic) });
      for (let step = 0; step < MAX_STEPS; step += 1) {
        const calls = new Map<number, { id: string; name: string; arguments: string }>();
        let turnText = "";
        for await (const part of streamTurn(env, messages, TOOL_DEFINITIONS, upstream.signal)) {
          if (part.type === "text") {
            if (!turnText && answer && !answer.endsWith("\n")) {
              answer += "\n";
              await send("delta", { text: "\n" });
            }
            turnText += part.text;
            answer += part.text;
            await send("delta", { text: part.text });
          } else if (part.type === "tool") {
            const call = calls.get(part.index) ?? { id: "", name: "", arguments: "" };
            if (part.id) call.id = part.id;
            if (part.name) call.name += part.name;
            if (part.arguments) call.arguments += part.arguments;
            calls.set(part.index, call);
          } else if (part.type === "usage") {
            usage.prompt_tokens += part.usage.prompt_tokens ?? 0;
            usage.completion_tokens += part.usage.completion_tokens ?? 0;
            usage.cached += part.usage.prompt_tokens_details?.cached_tokens ?? 0;
            usage.cost += part.usage.cost ?? 0;
          }
        }
        if (!calls.size) break;
        if (step === MAX_STEPS - 1) {
          await send("trace", { step: "guard", text: copy.steps });
          break;
        }
        const toolCalls: ToolCall[] = [...calls.values()].map((call, index) => ({ id: call.id || `call_${step}_${index}`, type: "function", function: { name: call.name, arguments: call.arguments } }));
        messages.push({ role: "assistant", content: turnText || null, tool_calls: toolCalls });
        for (const call of toolCalls) {
          toolsUsed.push(call.function.name);
          const result = runTool(call.function.name, call.function.arguments, locale);
          if (result.record) performed.push({ name: call.function.name, ...result.record });
          await send("trace", { step: "tool", text: result.trace.call, tool: call.function.name });
          await send("trace", { step: "result", text: result.trace.result, error: Boolean(result.error) });
          if (result.action) await send("action", result.action);
          messages.push({ role: "tool", tool_call_id: call.id, content: result.content });
        }
      }

      const { sources, removed } = checkLinks(answer);
      if (removed.length) await send("trace", { step: "guard", text: copy.removed(removed.length) });
      await send("trace", { step: "sources", text: copy.sources(sources.map((anchor) => `#${anchor}`).join(" · ")) });
      if (toolsUsed.includes("draft_email")) await send("trace", { step: "policy", text: copy.policy });
      if (/ask sultan|اسأل سلطان/i.test(answer)) outcome = "idk";
      const content = answer.slice(0, 4000);
      const tools = performed.slice(0, 6);
      await send("done", { signature: await sign(env, "turn", turnPayload(content, tools)), tools, sources, removed, usage });
    } catch (error) {
      outcome = "error";
      let code = "upstream";
      if (error instanceof UpstreamError) {
        if (error.status === 402) {
          code = "budget";
          await pauseModel(env, "credits").catch(() => undefined);
        } else if (error.status === 429) code = "rate_limited";
        else if (error.status === 401 || error.status === 403) code = "agent_offline";
        console.error(`OpenRouter ${error.status}: ${error.message}`);
      } else if (!disconnected) {
        console.error(error);
      }
      await send("error", { code, partial: answer.length > 0 });
    } finally {
      await writer.close().catch(() => undefined);
      await logQuestion(env, { locale, question, tools: toolsUsed, outcome }).catch((error) => console.error("log failed", error));
    }
  })();
  ctx.waitUntil(task);

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no", ...corsHeaders(origin) }
  });
}
