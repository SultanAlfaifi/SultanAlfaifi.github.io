import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const terminal = read("../components/agent-terminal.tsx");
const cards = read("../components/agent-cards.tsx");
const cvSection = read("../components/cv-section.tsx");
const client = read("../lib/agent/client.ts");
const workflow = read("../.github/workflows/deploy-pages.yml");
const hero = read("../components/hero.tsx");
const home = read("../components/home-page.tsx");
const palette = read("../components/command-palette.tsx");
const launcher = read("../components/assistant-launcher.tsx");
const styles = read("../app/signature.css") + read("../app/agent.css");
const { LEADING_TAG, textDir } = await import("../lib/agent/direction.ts");

test("the console keeps its scripted replies whenever the agent can't answer", () => {
  assert.match(client, /export const agentConfigured = Boolean\(AGENT_URL && SITE_KEY\)/);
  assert.match(terminal, /useState<AgentState>\(agentConfigured \? "checking" : "off"\)/);
  for (const code of ["budget", "rate_limited", "daily_cap", "agent_offline"]) assert.ok(terminal.includes(`"${code}"`), code);
  assert.match(terminal, /scripted\(scriptedIntent\(question\)\)/, "a failed question still gets the closest scripted reply");
  assert.match(terminal, /else scripted\(scriptedIntent\(trimmed\)\)/, "offline free-form questions get scripted replies");
});

test("the boot plays once, even if the visitor types before the console scrolls into view", () => {
  assert.match(terminal, /if \(bootStarted\.current\) return;\s*bootStarted\.current = true;/);
  assert.match(terminal, /function skipBoot\(\) \{\s*bootStarted\.current = true;/);
});

test("visitors reach the AI assistant from the hero, a floating button, and the palette, without losing their place", () => {
  assert.match(hero, /<AssistantButton locale=\{locale\} \/>/);
  assert.match(home, /<AssistantLauncher locale=\{locale\} \/>/);
  assert.match(palette, /run: openAssistant/);
  assert.match(launcher, /onClick=\{openAssistant\}/);
  assert.match(terminal, /window\.addEventListener\(OPEN_ASSISTANT, listener\)/);
});

test("the panel closes with Escape, hands focus back, and steps aside on phones to show what it highlighted", () => {
  assert.match(terminal, /event\.key === "Escape" && docked/);
  assert.match(terminal, /opener\?\.isConnected/);
  assert.match(terminal, /if \(docked && window\.matchMedia\(PHONE_PANEL\)\.matches\) closePanel\("none"\)/);
});

test("the human check and the session start before the first question, not after it", () => {
  assert.match(terminal, /onFocus=\{warmUp\}/);
  assert.match(terminal, /function openPanel\(\) \{[\s\S]*?warmUp\(\);\s*\}/);
  assert.match(client, /pendingSession \?\?=/, "a question asked mid-preparation reuses the same session");
});

test("typing is comfortable: a growing 16px input where Enter sends and Shift+Enter adds a line", () => {
  assert.match(terminal, /<textarea/);
  assert.match(terminal, /event\.key === "Enter" && !event\.shiftKey && !event\.nativeEvent\.isComposing/);
  // iOS zooms the page into any input set below 16px.
  assert.match(styles, /\.terminal__input textarea \{[^}]*font-size: 1rem;/);
});

test("console lines take the direction of their main script, and a [tag] stays at the start", () => {
  assert.equal(textDir("المشاريع: 11 · الإنجازات: 6"), "rtl");
  assert.equal(textDir("أنصحك تبدأ بمشروع AccessFinish لأنه يصلح الأخطاء"), "rtl");
  assert.equal(textDir("github ✓ · linkedin ✓ · x ✓"), "ltr");
  assert.equal(textDir("✓ 11"), "auto");
  assert.equal("[memory] المشاريع".replace(LEADING_TAG, ""), "المشاريع");
  assert.match(terminal, /<span className="terminal__tag" dir="ltr">/);
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
