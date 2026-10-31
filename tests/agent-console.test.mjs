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
const companion = read("../components/agent-companion.tsx");
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
  assert.match(hero, /<AssistantButton locale=\{locale\} label=\{ui\.hero\.ask\} \/>/);
  assert.match(read("../components/hero-run.tsx"), /onClick=\{openAssistant\}/, "the run card's own-task button opens the same assistant");
  assert.match(home, /<AssistantLauncher locale=\{locale\} \/>/);
  assert.match(palette, /run: openAssistant/);
  assert.match(launcher, /onClick=\{openAssistant\}/);
  assert.match(terminal, /window\.addEventListener\(OPEN_ASSISTANT, listener\)/);
});

test("the panel closes with Escape, hands focus back, and steps aside to show what it highlighted", () => {
  assert.match(terminal, /event\.key === "Escape" && docked/);
  assert.match(terminal, /opener\?\.isConnected/);
  assert.ok(terminal.includes('if (dockedNow.current) closePanel("none")'), "the panel steps aside whenever the agent moves the page");
});

test("moving the page hands the chat to a companion that stays with the visitor and brings them back", () => {
  assert.ok(terminal.includes("createPortal("), "the companion floats over the page, outside any animated section");
  assert.ok(terminal.includes("function backToChat()"));
  assert.ok(terminal.includes('if (from === "docked")'), "back to the chat reopens the panel the visitor came from");
  assert.ok(terminal.includes('if (companionRef.current) setCompanion({ kind: "answer", card:'), "a report or a draft is offered from the companion, not forced on the visitor");
  assert.ok(terminal.includes("dockedNow.current"), "actions from the stream see whether the panel is open now, not when the question was asked");
  assert.ok(companion.includes('event.key === "Escape"'));
  assert.ok(companion.includes('dir={locale === "ar" ? "rtl" : "ltr"}'), "portalled outside the page, the companion still reads right to left in Arabic");
  assert.ok(companion.includes("motionAllowed()"), "tour lines type out only while motion is on");
  assert.ok(styles.includes('html[data-companion="on"] .assistant-launcher'), "the floating launcher steps aside for the companion");
});

test("the open panel greets with one-click starts instead of the boot log", () => {
  assert.ok(terminal.includes("docked && live && !started"), "the welcome shows only until the first question");
  assert.ok(styles.includes(".terminal-shell--docked.terminal-shell--live .terminal__line--boot { display: none; }"));
  assert.ok(styles.includes(".terminal-shell--docked .terminal__chips:not(.terminal__chips--agent) { display: none; }"), "console commands stay in the inline console");
  assert.ok(terminal.includes("if (!starter.fill)"), "a starter either asks or fills the input for the visitor to finish");
  assert.ok(terminal.includes('<span className="agent-caret" aria-hidden="true" />'), "a cursor writes the streaming answer");
  assert.ok(styles.includes('html:not([data-motion="off"]) .agent-orb::before'), "the orb moves only while motion is on");
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

test("the CV is one download first; who it's for is optional and never framed as tailoring", async () => {
  const { getContent } = await import("../data/i18n.ts");
  assert.ok(cvSection.indexOf("cv-download") < cvSection.indexOf("cv-for"), "the download comes before the optional fields");
  for (const locale of ["en", "ar"]) {
    const words = JSON.stringify(getContent(locale).ui.cv);
    assert.doesNotMatch(words, /tailor|فصّل|فصل/i, locale);
  }
  // The preview shows the lines the prepared PDF kept, so it matches the download.
  assert.match(cvSection, /const shown = ready\?\.selection \?\? selection;/);
});

test("the email field is optional and last, after the download", () => {
  assert.ok(cvSection.indexOf("cv-download") < cvSection.indexOf("cv-email"));
  assert.doesNotMatch(cvSection, /type="email"[^>]*required/);
});

test("the Pages build passes the public agent settings from repository variables", () => {
  assert.match(workflow, /NEXT_PUBLIC_AGENT_URL: \$\{\{ vars\.AGENT_URL \}\}/);
  assert.match(workflow, /NEXT_PUBLIC_TURNSTILE_SITE_KEY: \$\{\{ vars\.TURNSTILE_SITE_KEY \}\}/);
});

// ---------- The AI section: the living orb beside the console ----------

const presenceModule = await import("../components/assistant-presence.ts");
const stageSource = read("../components/assistant-stage.tsx");
const runtimeSource = read("../components/runtime-section.tsx");
const aiCss = read("../app/ai.css");

test("the orb follows the real console: thinking until the first words, speaking while they stream, listening at the input", () => {
  const ask = terminal.slice(terminal.indexOf("async function askAgent"), terminal.indexOf("function submit("));
  assert.ok(ask.indexOf('setActivity("agent", "thinking")') < ask.indexOf("withSession("), "thinking starts when the question goes out");
  assert.match(ask, /pulseVoice\(event\.data\.text\.length\);\s*if \(event\.data\.text\.trim\(\)\) setActivity\("agent", "speaking"\);/, "each streamed piece feeds the voice");
  assert.match(ask, /if \(THINKING_STEPS\.has\(event\.data\.step\)\) setActivity\("agent", "thinking"\);/, "planning or preparing a tool is thinking again");
  assert.match(terminal, /const THINKING_STEPS = new Set\(\["plan", "prep", "tool", "result"\]\);/);
  assert.match(ask, /\} finally \{\s*setActivity\("agent", "idle"\);/, "a finished, failed or aborted answer always lets the orb rest");
  assert.match(terminal, /if \(outputs\.length\) speakFor\(delay \* outputs\.length \+ 520\);/, "scripted lines are spoken too");
  assert.match(terminal, /pulseVoice\(output\.text\.length\);/);
  assert.match(terminal, /input\.addEventListener\("focus", listen\);\s*input\.addEventListener\("blur", leave\);/);
  // Hooks only: the chat itself is unchanged.
  assert.match(terminal, /onFocus=\{warmUp\}/);
  assert.match(terminal, /else scripted\(scriptedIntent\(trimmed\)\)/);
});

test("the orb blooms only when the visitor says yes to a draft, after the address checks out", () => {
  const send = cards.slice(cards.indexOf("async function send"), cards.indexOf("return (", cards.indexOf("async function send")));
  assert.ok(send.indexOf("setError(copy.invalidEmail)") < send.indexOf("markApproved()"), "an invalid address is not a yes");
  assert.ok(send.indexOf("markApproved()") < send.indexOf("sendEmailToSultan("), "the yes shows when the visitor presses send");
  assert.equal(terminal.includes("markApproved"), false, "the agent can never approve for the visitor");
  assert.match(stageSource, /orbRef\.current\?\.bloom\(\);\s*bloomBrandOrb\(\);/, "every yes blooms the orb and the logo");
});

test("presence: one orb state from what the console reports, with the visitor's yes first", () => {
  const { setActivity, setAttention, markApproved, approvalCount, presenceState, pulseVoice, voiceLevel, subscribePresence, resetPresence } = presenceModule;
  resetPresence();
  let calls = 0;
  const stop = subscribePresence(() => calls++);
  try {
    assert.equal(presenceState(), "idle");
    assert.equal(voiceLevel(), 0, "silent with nothing arriving");
    setAttention(true);
    assert.equal(presenceState(), "listening");
    setActivity("agent", "thinking");
    assert.equal(presenceState(), "thinking", "a question in flight outranks the input's focus");
    setActivity("script", "speaking");
    assert.equal(presenceState(), "thinking", "the agent's thinking outranks the console's own lines");
    setActivity("agent", "speaking");
    pulseVoice(60);
    assert.equal(presenceState(), "speaking");
    assert.ok(voiceLevel() > 0.5, "a burst of text is a loud voice");
    setActivity("agent", "idle");
    setActivity("script", "idle");
    assert.equal(presenceState(), "listening", "back to listening while the input still has focus");
    const before = calls;
    setAttention(true);
    assert.equal(calls, before, "repeating a fact is free");
    markApproved();
    assert.equal(presenceState(), "approved");
    markApproved();
    assert.equal(approvalCount(), 2, "a second yes is counted, so it blooms again");
    setAttention(false);
  } finally {
    stop();
    resetPresence();
  }
  assert.equal(presenceState(), "idle");
});

test("the AI section: huge headline, the real console, and the orb between them on a phone", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { JSDOM } = await import("jsdom");
  const { RuntimeSection } = await import("../components/runtime-section.tsx");
  const { getContent } = await import("../data/i18n.ts");
  for (const locale of ["en", "ar"]) {
    const { ui, principles } = getContent(locale);
    const document = new JSDOM(renderToStaticMarkup(createElement(RuntimeSection, { locale }))).window.document;
    const section = document.getElementById("runtime");
    assert.ok(section, `${locale}: the anchor the assistant and the nav use is kept`);
    assert.equal(section.getAttribute("aria-labelledby"), "runtime-title");
    assert.equal(document.getElementById("runtime-title").textContent, ui.runtime.title);
    const order = [".ai-head", ".ai-stage", ".ai-chat"].map((selector) => [...section.querySelectorAll("*")].indexOf(section.querySelector(selector)));
    assert.deepEqual([...order].sort((a, b) => a - b), order, `${locale}: intro, then the orb, then the console`);
    assert.ok(section.querySelector(".ai-chat .terminal"), `${locale}: the real console`);
    assert.equal(section.querySelector(".ai-state__word").textContent, ui.runtime.states.idle, `${locale}: the orb's word is there without JavaScript`);
    assert.equal(section.querySelector(".ai-orb").getAttribute("aria-label"), ui.runtime.orb);
    // The tour quotes visible text, so every principle stays on the page word for word.
    const items = [...section.querySelectorAll(".ai-principles__list li p")].map((item) => item.textContent);
    assert.deepEqual(items, principles, `${locale}: principles unchanged`);
    assert.equal(section.querySelector(".ai-principles__title").textContent, ui.runtime.principles, "the section's citation label");
    for (const word of ["idle", "greeting", "listening", "thinking", "speaking", "approved", "gravity"]) assert.ok(ui.runtime.states[word], `${locale}: a word for ${word}`);
  }
  assert.match(read("../app/layout.tsx"), /import "\.\/living\.css";\nimport "\.\/ai\.css";/, "the section's styles load after the design system");
});

test("the AI section is complete at rest: its entrance only hides what JavaScript will reveal, with motion on", () => {
  const motion = aiCss.indexOf("@media (prefers-reduced-motion: no-preference)");
  assert.ok(motion > 0);
  for (const match of aiCss.matchAll(/data-arrive="(wait|play)"/g)) {
    assert.ok(match.index > motion, "every entrance rule sits in the motion block");
    assert.match(aiCss.slice(aiCss.lastIndexOf("\n", match.index), match.index), /html:not\(\[data-motion="off"\]\)/, "and respects the site's Motion switch");
  }
  // The docked panel is position: fixed inside the section, so no ancestor of it may be transformed or hidden.
  assert.match(aiCss, /\[data-arrive="wait"\] \.terminal-shell:not\(\.terminal-shell--docked\) > \.terminal/);
  assert.doesNotMatch(aiCss, /\.ai-chat \{[^}]*(transform|opacity|filter)/);
  assert.match(stageSource, /subscribeMotion\(\(\) => \{\s*if \(motionAllowed\(\)\) return;\s*delete section\.dataset\.arrive;/, "turning motion off mid-wait shows everything");
  // Small text stays readable, and phone taps are full size.
  for (const [, size] of aiCss.matchAll(/font-size: ([\d.]+)rem/g)) assert.ok(+size >= 0.78125, `${size}rem is under 12.5px`);
  const phone = aiCss.slice(aiCss.indexOf("@media (max-width: 760px)"), aiCss.indexOf("@media (pointer: coarse)"));
  for (const part of [".terminal__bar button { min-height: 44px; }", ".terminal__chips button { min-height: 44px; }", ".terminal__send { width: 44px; height: 44px; }"]) assert.ok(phone.includes(part), part);
  assert.match(runtimeSource, /aria-labelledby="runtime-title"/);
});
