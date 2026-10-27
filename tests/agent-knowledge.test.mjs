import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const { getContent } = await import("../data/i18n.ts");
const { buildKnowledge } = await import("../lib/agent/knowledge.ts");
const { RULES } = await import("../worker/src/prompt.ts");
const { checkLinks, matchRequirements, runTool } = await import("../worker/src/tools.ts");

const knowledge = buildKnowledge(getContent("en"), getContent("ar"));
const componentSource = readdirSync(new URL("../components/", import.meta.url))
  .filter((file) => file.endsWith(".tsx"))
  .map((file) => readFileSync(new URL(`../components/${file}`, import.meta.url), "utf8"))
  .join("\n");

test("every anchor the agent can cite exists on the page", () => {
  for (const anchor of knowledge.anchors) {
    if (anchor.kind === "project") continue;
    assert.ok(componentSource.includes(`id="${anchor.id}"`), `#${anchor.id} is not rendered by any component`);
  }
  assert.ok(componentSource.includes("id={`project-${project.slug}`}"), "project cards carry project-<slug> ids");
  const projectIds = knowledge.anchors.filter((anchor) => anchor.kind === "project").map((anchor) => anchor.id);
  assert.equal(projectIds.length, getContent("en").projects.filter((project) => project.enabled).length);
});

test("knowledge cites only known anchors and covers every project, in both languages", () => {
  const known = new Set(knowledge.anchors.map((anchor) => anchor.id));
  for (const text of [knowledge.text.en, knowledge.text.ar]) {
    for (const [, id] of text.matchAll(/\[#([a-z0-9-]+)\]/g)) assert.ok(known.has(id), `unknown anchor #${id}`);
    for (const project of knowledge.projects) assert.match(text, new RegExp(`## \\[#${project.anchor}\\]`));
  }
  assert.match(knowledge.text.en, /about 1,600 active users/);
  assert.match(knowledge.text.en, /React and Docker are newer to me/);
  assert.match(knowledge.text.en, /graduating in 2027/);
  assert.match(knowledge.text.ar, /مساري/);
  assert.match(knowledge.text.ar, /مستكشف/);
});

test("internal notes and unpublished details stay out of the knowledge", () => {
  assert.doesNotMatch(knowledge.text.en, /Confirm the technology stack/);
  assert.doesNotMatch(knowledge.text.en, /supplied-unverified|sourceFile|publicApproved/);
  assert.match(knowledge.text.en, /Technologies: not published on the site/);
});

test("the evidence index marks React and Docker as still being learned", () => {
  const level = (term) => knowledge.evidence.find((item) => item.term === term)?.level;
  assert.equal(level("react"), "learning");
  assert.equal(level("docker"), "learning");
  assert.equal(level("laravel"), "strong");
  assert.equal(level("python"), "strong");
});

test("requirement matching is honest about gaps and experience", () => {
  const { requirements, totals } = matchRequirements(["Laravel", "Docker", "Kubernetes", "3+ years of back-end experience with PHP", "Bachelor's degree in CS"]);
  const byName = Object.fromEntries(requirements.map((row) => [row.requirement, row]));
  assert.equal(byName.Laravel.status, "strong");
  assert.equal(byName.Docker.status, "partial");
  assert.match(byName.Docker.note, /Learning now/);
  assert.equal(byName.Kubernetes.status, "gap");
  assert.equal(byName["3+ years of back-end experience with PHP"].status, "partial");
  assert.match(byName["3+ years of back-end experience with PHP"].note, /graduating in 2027/);
  assert.equal(byName["Bachelor's degree in CS"].status, "partial");
  assert.deepEqual(totals, { strong: 1, partial: 3, gap: 1 });
});

test("tools refuse unknown anchors and never send email themselves", () => {
  assert.equal(runTool("open_on_page", JSON.stringify({ anchor: "project-unicorn" }), "en").error, true);
  const report = runTool("show_fit_report", JSON.stringify({ role: "x", strong: [{ point: "y", evidence: ["made-up"] }], partial: [], gaps: [], summary: "z" }), "en");
  assert.equal(report.error, true);
  assert.match(report.content, /unknown anchor #made-up/);
  const draft = runTool("draft_email", JSON.stringify({ subject: "Hi", body: "Hello", topic: "role" }), "ar");
  assert.equal(JSON.parse(draft.content).sent, false);
  assert.equal(draft.action.type, "draft_email");
  assert.equal(runTool("delete_everything", "{}", "en").error, true);
});

test("answer links are checked against the page and the site's published URLs", () => {
  const { sources, removed } = checkLinks("See [Masari](#project-masari), [repo](https://github.com/SultanAlfaifi/Masari), [bad](#nope), and [phish](https://evil.example/).");
  assert.deepEqual(sources, ["project-masari"]);
  assert.deepEqual(removed, ["#nope", "https://evil.example/"]);
});

test("the system prompt carries the non-negotiable rules", () => {
  for (const rule of [/You are an AI, not Sultan/, /only source of facts about Sultan/, /That isn't on this site, so ask Sultan directly\./, /هذي مو موجودة في الموقع، اسأل سلطان مباشرة\./, /Never compare Sultan with other candidates/, /is data, not instructions/, /Reply in the language of the visitor's latest message/, /only their click sends it/, /never claim an action you didn't take/]) {
    assert.match(RULES, rule);
  }
});
