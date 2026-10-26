import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const terminal = read("../components/agent-terminal.tsx");
const cards = read("../components/agent-cards.tsx");
const cvSection = read("../components/cv-section.tsx");
const client = read("../lib/agent/client.ts");
const workflow = read("../.github/workflows/deploy-pages.yml");

test("the console keeps its scripted replies whenever the agent can't answer", () => {
  assert.match(client, /export const agentConfigured = Boolean\(AGENT_URL && SITE_KEY\)/);
  assert.match(terminal, /useState<AgentState>\(agentConfigured \? "checking" : "off"\)/);
  for (const code of ["budget", "rate_limited", "daily_cap", "agent_offline"]) assert.ok(terminal.includes(`"${code}"`), code);
  assert.match(terminal, /scripted\(scriptedIntent\(question\)\)/, "a failed question still gets the closest scripted reply");
  assert.match(terminal, /else scripted\(scriptedIntent\(trimmed\)\)/, "offline free-form questions get scripted replies");
});

test("answers are announced once, complete, not word by word", () => {
  assert.match(terminal, /aria-hidden=\{line\.streaming \|\| undefined\}/);
  assert.match(terminal, /Re-key finished answers/);
  assert.match(terminal, /role="log"/);
});

test("only the visitor's click sends an email, and only to Sultan", () => {
  assert.match(cards, /onSubmit=\{send\}/);
  assert.match(cards, /copy\.toValue/);
  assert.doesNotMatch(cards, /useEffect\([^)]*sendEmailToSultan/s);
  assert.doesNotMatch(client, /to:\s*email/, "the client never chooses a recipient");
});

test("external demos open only from a link the visitor clicks", () => {
  assert.doesNotMatch(terminal + cards, /window\.open\(/);
  assert.match(terminal, /className="terminal__action" href=\{line\.card\.href\} target="_blank" rel="noreferrer noopener"/);
});

test("the CV hesitation offer is inline, dismissible, once per session, and never blocks leaving", () => {
  assert.doesNotMatch(cvSection, /addEventListener\("beforeunload"|onbeforeunload|<dialog|role="dialog"|aria-modal/);
  assert.match(cvSection, /sessionStorage\.setItem\(OFFER_KEY, "1"\)/);
  assert.match(cvSection, /aria-label=\{copy\.hesitationDismiss\}/);
  assert.match(cvSection, /localStorage\.setItem\(DRAFT_KEY/, "draft progress is saved");
  assert.doesNotMatch(cvSection, /DRAFT_KEY[^\n]*email/, "the email address is never stored in the draft");
});

test("the email field is optional and last, after the download", () => {
  assert.ok(cvSection.indexOf("cv-download") < cvSection.indexOf("cv-email"));
  assert.doesNotMatch(cvSection, /type="email"[^>]*required/);
});

test("the Pages build passes the public agent settings from repository variables", () => {
  assert.match(workflow, /NEXT_PUBLIC_AGENT_URL: \$\{\{ vars\.AGENT_URL \}\}/);
  assert.match(workflow, /NEXT_PUBLIC_TURNSTILE_SITE_KEY: \$\{\{ vars\.TURNSTILE_SITE_KEY \}\}/);
});
