// Runs evals/questions.json against a running Worker and writes the results the /agent-evals page shows.
//   npm run agent:dev            (with your OpenRouter key in worker/.dev.vars)
//   npm run evals                → evals/results/latest.json (published) + a dated copy
//   npm run evals -- --mock      → evals/results/mock.json (checks the harness; never published)
// Spends real OpenRouter credit in live mode: about 44 questions, roughly $0.50–$2 with Claude Sonnet 5.5.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { grade, type EvalQuestion, type EvalRun } from "./grade";

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const MOCK = args.includes("--mock");
const WORKER = flag("url", "http://127.0.0.1:8787");
const ORIGIN = flag("origin", "http://localhost:3000");
const ONLY = flag("only", "");
// Cloudflare's documented dummy token; it passes only with the Turnstile test secret used in local dev.
const TEST_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

type Event = { event: string; data: Record<string, unknown> };

async function post(pathname: string, body: unknown, token?: string) {
  return fetch(`${WORKER}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  });
}

async function ask(token: string, question: EvalQuestion) {
  const started = Date.now();
  const response = await post("/chat", { locale: question.lang, messages: [{ role: "user", content: question.question }] }, token);
  if (!response.ok) return { events: [] as Event[], ms: Date.now() - started, httpError: `${response.status} ${(await response.text()).slice(0, 120)}` };
  const text = await response.text();
  const events = text.split("\n\n").filter(Boolean).map((block): Event => ({
    event: /^event: (.+)$/m.exec(block)?.[1] ?? "",
    data: JSON.parse(/^data: (.+)$/m.exec(block)?.[1] ?? "{}")
  }));
  return { events, ms: Date.now() - started, httpError: null };
}

function summarize(events: Event[], httpError: string | null): EvalRun & { trace: string[]; fitReport: unknown; draft: unknown; usage: Record<string, number> | null } {
  const done = events.find((event) => event.event === "done")?.data as { sources?: string[]; removed?: string[]; usage?: Record<string, number> } | undefined;
  const actions = events.filter((event) => event.event === "action").map((event) => event.data);
  const fitReport = actions.find((action) => action.type === "fit_report")?.report ?? null;
  const fit = fitReport as { strong?: { point: string }[]; partial?: { point: string }[]; gaps?: { point: string; plan: string }[]; summary?: string } | null;
  return {
    answer: events.filter((event) => event.event === "delta").map((event) => String(event.data.text)).join(""),
    tools: events.filter((event) => event.event === "trace" && event.data.step === "tool").map((event) => String(event.data.text).split("(")[0]),
    trace: events.filter((event) => event.event === "trace").map((event) => `${event.data.step} → ${event.data.text}`),
    sources: done?.sources ?? [],
    removedLinks: done?.removed ?? [],
    fitText: fit ? [fit.summary, ...(fit.strong ?? []).map((item) => item.point), ...(fit.partial ?? []).map((item) => item.point), ...(fit.gaps ?? []).map((gap) => `${gap.point} ${gap.plan}`)].join("\n") : "",
    fitReport,
    draft: actions.find((action) => action.type === "draft_email")?.draft ?? null,
    usage: done?.usage ?? null,
    error: httpError ?? (events.find((event) => event.event === "error")?.data.code as string | undefined) ?? null
  };
}

async function main() {
  const { questions } = JSON.parse(await readFile(path.resolve("evals/questions.json"), "utf8")) as { questions: EvalQuestion[] };
  const selected = ONLY ? questions.filter((question) => ONLY.split(",").includes(question.id)) : questions;
  const health = (await (await fetch(`${WORKER}/health`)).json()) as { agent: boolean; knowledge: string; model?: string };
  if (!health.agent) throw new Error("The Worker says the agent is offline. Start `npm run agent:dev` with OPENROUTER_API_KEY in worker/.dev.vars.");
  const session = (await (await post("/session", { turnstileToken: TEST_TOKEN })).json()) as { token?: string; error?: string };
  if (!session.token) throw new Error(`No session (${session.error}). Local evals need the Turnstile test secret in worker/.dev.vars.`);

  type Result = EvalQuestion & ReturnType<typeof grade> & Omit<ReturnType<typeof summarize>, "fitText"> & { ms: number };
  const results: Result[] = [];
  for (const question of selected) {
    const { events, ms, httpError } = await ask(session.token, question);
    const run = summarize(events, httpError);
    const verdict = grade(question, run);
    results.push({ ...question, ...verdict, ms, answer: run.answer, trace: run.trace, tools: run.tools, sources: run.sources, removedLinks: run.removedLinks, fitReport: run.fitReport, draft: run.draft, usage: run.usage, error: run.error });
    console.log(`${verdict.passed ? "PASS" : "FAIL"} ${question.id} ${question.category.padEnd(10)} ${verdict.failures.join("; ")}`);
    await new Promise((resolve) => setTimeout(resolve, MOCK ? 0 : 1500));
  }

  const passed = results.filter((result) => result.passed).length;
  const byCategory = Object.fromEntries([...new Set(results.map((result) => result.category))].map((category) => {
    const items = results.filter((result) => result.category === category);
    return [category, { passed: items.filter((item) => item.passed).length, total: items.length }];
  }));
  const cost = results.reduce((sum, result) => sum + (result.usage?.cost ?? 0), 0);
  const report = {
    runAt: new Date().toISOString(),
    mode: MOCK ? "mock" : "live",
    model: health.model ?? "unknown",
    knowledge: health.knowledge,
    totals: { passed, failed: results.length - passed, total: results.length },
    byCategory,
    costUsd: Math.round(cost * 10_000) / 10_000,
    results
  };
  const dir = path.resolve("evals/results");
  await mkdir(dir, { recursive: true });
  if (MOCK) {
    await writeFile(path.join(dir, "mock.json"), JSON.stringify(report, null, 2));
  } else {
    await writeFile(path.join(dir, "latest.json"), JSON.stringify(report, null, 2));
    await writeFile(path.join(dir, `${report.runAt.slice(0, 19).replace(/:/g, "-")}.json`), JSON.stringify(report, null, 2));
  }
  console.log(`\n${passed}/${results.length} passed · ${report.mode} · ${report.model} · knowledge ${report.knowledge} · $${report.costUsd}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
