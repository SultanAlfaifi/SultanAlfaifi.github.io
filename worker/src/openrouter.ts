import type { Env } from "./env";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type ChatMessage =
  | { role: "system"; content: { type: "text"; text: string; cache_control?: { type: "ephemeral" } }[] }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type Usage = { prompt_tokens?: number; completion_tokens?: number; cost?: number; prompt_tokens_details?: { cached_tokens?: number } };

export class UpstreamError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function requestBody(env: Env, messages: ChatMessage[], extra: Record<string, unknown>) {
  const body: Record<string, unknown> = {
    model: env.MODEL,
    messages,
    max_tokens: 1800,
    usage: { include: true },
    // Skip providers that keep prompts for training.
    provider: { data_collection: "deny" },
    ...extra
  };
  if (env.REASONING_EFFORT) body.reasoning = { effort: env.REASONING_EFFORT };
  return body;
}

async function post(env: Env, body: Record<string, unknown>, signal?: AbortSignal) {
  if (!env.OPENROUTER_API_KEY) throw new UpstreamError(503, "OPENROUTER_API_KEY is not set");
  const response = await fetch(env.OPENROUTER_URL || ENDPOINT, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.SITE_URL,
      "X-Title": "Sultan Alfaifi portfolio agent"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new UpstreamError(response.status, detail || response.statusText);
  }
  return response;
}

export type StreamPart =
  | { type: "text"; text: string }
  | { type: "tool"; index: number; id?: string; name?: string; arguments?: string }
  | { type: "finish"; reason: string | null }
  | { type: "usage"; usage: Usage };

// Streams one model turn. Text arrives as it's generated; tool-call fragments are assembled by the caller.
export async function* streamTurn(env: Env, messages: ChatMessage[], tools: unknown[], signal?: AbortSignal): AsyncGenerator<StreamPart> {
  const response = await post(env, requestBody(env, messages, { stream: true, tools, tool_choice: "auto" }), signal);
  if (!response.body) throw new UpstreamError(502, "empty stream");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line.startsWith("data:")) continue; // ": OPENROUTER PROCESSING" keep-alives and blank lines
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      let chunk: {
        error?: { code?: number; message?: string };
        usage?: Usage;
        choices?: { delta?: { content?: string | null; tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[] }; finish_reason?: string | null }[];
      };
      try {
        chunk = JSON.parse(data);
      } catch {
        continue;
      }
      if (chunk.error) throw new UpstreamError(chunk.error.code ?? 502, chunk.error.message ?? "stream error");
      const choice = chunk.choices?.[0];
      if (choice?.delta?.content) yield { type: "text", text: choice.delta.content };
      for (const call of choice?.delta?.tool_calls ?? []) {
        yield { type: "tool", index: call.index, id: call.id, name: call.function?.name, arguments: call.function?.arguments };
      }
      if (choice?.finish_reason) yield { type: "finish", reason: choice.finish_reason };
      if (chunk.usage) yield { type: "usage", usage: chunk.usage };
    }
  }
}

// One non-streaming turn, for the CV tailor.
export async function completeTurn(env: Env, messages: ChatMessage[], tools: unknown[]) {
  const response = await post(env, requestBody(env, messages, { tools, tool_choice: "auto" }));
  const result = (await response.json()) as {
    choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[];
    usage?: Usage;
  };
  const message = result.choices?.[0]?.message;
  return { content: message?.content ?? "", toolCalls: message?.tool_calls ?? [], usage: result.usage };
}
