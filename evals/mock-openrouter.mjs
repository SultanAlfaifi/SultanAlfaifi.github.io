// A scripted stand-in for OpenRouter's chat completions API. It lets the tests and a local browser check
// exercise the whole agent loop (streaming, tool calls, cards, the CV tailor) without a key or any spend.
// It is not a model: replies are picked by keywords in the last message.
//   node evals/mock-openrouter.mjs            → listens on http://127.0.0.1:8788
//   npm run agent:dev -- --var OPENROUTER_API_KEY:mock --var OPENROUTER_URL:http://127.0.0.1:8788/api/v1/chat/completions
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

const encoder = new TextEncoder();

function sse(chunks) {
  const body = chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("") + ": OPENROUTER PROCESSING\n\ndata: [DONE]\n\n";
  return new Response(encoder.encode(body), { headers: { "Content-Type": "text/event-stream" } });
}

const textChunks = (text) => [
  ...text.match(/.{1,18}/gs).map((piece) => ({ choices: [{ delta: { content: piece } }] })),
  { choices: [{ delta: {}, finish_reason: "stop" }] },
  { choices: [], usage: { prompt_tokens: 9000, completion_tokens: 60, prompt_tokens_details: { cached_tokens: 8000 }, cost: 0.0012 } }
];

const toolChunks = (name, args) => {
  const json = JSON.stringify(args);
  return [
    { choices: [{ delta: { tool_calls: [{ index: 0, id: `call_${name}`, type: "function", function: { name, arguments: "" } }] } }] },
    ...json.match(/.{1,25}/gs).map((piece) => ({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: piece } }] } }] })),
    { choices: [{ delta: {}, finish_reason: "tool_calls" }] }
  ];
};

const arabic = (text) => /[\u0600-\u06ff]/.test(text);

function chatReply(messages) {
  const last = messages[messages.length - 1];
  const lastUser = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const ar = arabic(lastUser);
  if (last.role === "tool") {
    const toolName = [...messages].reverse().find((message) => message.tool_calls)?.tool_calls[0].function.name;
    if (toolName === "open_on_page") return textChunks(ar ? "هذا «مساري» في الصفحة ([مساري](#project-masari)). وتقدر تجرّبه من الزر تحت." : "Here's Masari on the page ([Masari](#project-masari)). Its live demo opens from the button below.");
    if (toolName === "match_requirements") {
      return toolChunks("show_fit_report", {
        role: "Back-end engineer",
        strong: [{ point: "Laravel, PHP, and MySQL REST endpoints with tests at Salla", evidence: ["experience", "skills"] }],
        partial: [{ point: "Docker is newer to him; he's learning it at Salla", evidence: ["skills"] }],
        gaps: [{ point: "Kubernetes isn't on the site", plan: "The site doesn't cover it; Sultan can speak to it." }, { point: "3+ years of experience", plan: "He's a student graduating in 2027, in a COOP since June 2026." }],
        summary: "Strong on the Laravel stack he uses daily at Salla; Docker is in progress; no Kubernetes or multi-year experience on the site."
      });
    }
    if (toolName === "show_fit_report") return textChunks("That's the fit report above, with evidence for each match ([What I do at Salla](#experience)). Want me to draft an email with this summary to Sultan?");
    if (toolName === "draft_email") return textChunks(ar ? "المسودة تحت. عدّلها إذا تبغى، وما تنرسل إلا إذا ضغطت «أرسلها»." : "The draft is below. Edit it if you like; nothing is sent until you press Send.");
    return textChunks("Done.");
  }
  const lower = lastUser.toLowerCase();
  if (/open|show|افتح|وريني/.test(lower)) return toolChunks("open_on_page", { anchor: "project-masari" });
  if (/^fit check/.test(lower) || lower.includes("fit ")) return toolChunks("match_requirements", { role: "Back-end engineer", requirements: ["Laravel", "Docker", "Kubernetes", "3+ years back end"] });
  if (/email|راسل|أراسل/.test(lower)) return toolChunks("draft_email", { subject: ar ? "فرصة عمل" : "A role on our team", body: ar ? "هلا سلطان، عندنا فرصة تناسبك ونبغى نتكلم معك." : "Hi Sultan, we have a role that looks like a fit and would like to talk.", topic: "role" });
  if (/salary|راتب/.test(lower)) return textChunks(ar ? "ما أعرف، هذي المعلومة مو موجودة في الموقع. اسأل سلطان مباشرة." : "I don't know. That isn't on this site, so ask Sultan directly. Want me to draft an email to him?");
  return textChunks(ar
    ? "يقدّم «مساري» نحو 1,600 مستخدم نشط ([مساري](#project-masari))، ويتدرّب سلطان في سلة ([تدريبي في سلة](#experience))."
    : "Masari has about 1,600 active users ([Masari](#project-masari)), and Sultan is a COOP intern at Salla ([What I do at Salla](#experience)). [More](#not-a-real-anchor)");
}

let tailorCalls = 0;
function tailorReply() {
  tailorCalls += 1;
  // The first answer slips in an ID that isn't in the library, so the Worker's rejection and retry run.
  const projects = [
    { id: "prj-accessfinish", bullet_ids: ["prj-accessfinish-verify"] },
    { id: "prj-mustakshif", bullet_ids: ["prj-mustakshif-app", "prj-mustakshif-engine"] },
    { id: "prj-autoflow", bullet_ids: tailorCalls % 2 === 1 ? ["prj-autoflow-invented"] : ["prj-autoflow-schema"] }
  ];
  const args = {
    target: "backend",
    summary_id: "sum-backend",
    skill_ids: ["skl-backend", "skl-practices", "skl-ai", "skl-learning"],
    experience_bullet_ids: ["exp-salla-endpoints", "exp-salla-validation", "exp-salla-tests"],
    projects,
    recognition_ids: ["rec-kaust", "rec-amad", "rec-ibm"],
    training_ids: ["trn-ibm-genai"],
    teaching_ids: [],
    cover_message: "Sultan's Salla COOP work matches this role most directly: Laravel and MySQL endpoints with tests. Docker is newer to him."
  };
  return Response.json({ choices: [{ message: { content: null, tool_calls: [{ id: `call_cv_${tailorCalls}`, type: "function", function: { name: "select_cv", arguments: JSON.stringify(args) } }] } }], usage: { prompt_tokens: 3000, completion_tokens: 120 } });
}

export function handle(body) {
  if (!body.stream) return tailorReply();
  return sse(chatReply(body.messages));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const port = Number(process.env.PORT ?? 8788);
  createServer(async (request, response) => {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const reply = handle(JSON.parse(raw || "{}"));
    response.writeHead(reply.status, Object.fromEntries(reply.headers));
    response.end(Buffer.from(await reply.arrayBuffer()));
  }).listen(port, "127.0.0.1", () => console.log(`mock OpenRouter on http://127.0.0.1:${port}`));
}
