import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const { getContent } = await import("../data/i18n.ts");
const { personalRun } = await import("../components/hero-run.tsx");
const { firstFor, showcaseOrder } = await import("../components/showcase-parts.tsx");
const { reasonFor } = await import("../lib/intro.ts");

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");

// A card as the agent reads it: the visitor's own words, and Mashhad as their closest project.
const noura = {
  name: "نورة",
  address: "feminine",
  field: "مهندسة تعلم آلة",
  organization: "stc",
  workingOn: "منصة لتوليد الروايات",
  intent: "collaborate",
  hiringRole: "",
  projects: ["mashhad", "masari"],
  reasons: ["الأقرب لمنصة الروايات.", "يبني السيرة على جهازك."],
  bridge: "منصتك تكتب القصة، ومَشهد يحوّل الوصف إلى فيلم متحرك.",
  help: ["كيف بنى مَشهد كمهارة وكيل مفتوحة المصدر"],
  source: "ai"
};

test("the hero's run greets the visitor, reads their card, and offers to open their closest project", () => {
  const ar = getContent("ar");
  const run = personalRun(ar, noura, "مساء الخير");
  assert.equal(run.key, "personal");
  assert.deepEqual(run.visitor, {}, "the only run rendered, so no visitor rule hides it");
  assert.equal(run.plan, "مساء الخير يا نورة. أربط بطاقتك بشغل سلطان.");
  assert.equal(run.tool, "visitor.card()");
  assert.equal(run.read, "مهندسة تعلم آلة · stc");
  assert.equal(run.result, noura.bridge);
  assert.equal(run.target, "project-mashhad");
  // Its result line is the agent's, so the card says so instead of "no AI call".
  assert.match(read("../components/hero-run.tsx"), /personal \? copy\.personal\.replay : copy\.replay/);
  assert.equal(ar.ui.hero.run.personal.replay, "من بطاقتك · قرأها مساعد سلطان الذكي");
  const mashhad = ar.projects.find((project) => project.slug === "mashhad");
  assert.equal(run.ask.name, mashhad.title);
});

test("without the agent's line, the run says what the project itself proves; without a project, there is no run", () => {
  const en = getContent("en");
  const quiet = personalRun(en, { ...noura, name: "", field: "", organization: "", bridge: "" }, "Good evening");
  assert.equal(quiet.plan, "Matching your card to Sultan’s work.", "no name, no greeting by name");
  assert.equal(quiet.read, "منصة لتوليد الروايات", "what they work on when the card names no field or place");
  assert.ok(quiet.result.length > 10);
  assert.equal(personalRun(en, { ...noura, projects: ["not-on-the-page"] }, "Hi"), null);
});

test("the visitor's projects lead the showcase, in the agent's order, and the grid keeps its rhythm", () => {
  const list = showcaseOrder(getContent("en").projects);
  const mine = firstFor(list, ["mawrid", "mashhad", "not-a-project"]);
  assert.deepEqual(mine.slice(0, 2).map((project) => project.slug), ["mawrid", "mashhad"]);
  assert.equal(mine.length, list.length, "nobody is dropped or doubled");
  assert.deepEqual(firstFor(list, []), list, "everyone else sees the showcase as it is");
  assert.match(read("../components/showcase.tsx"), /firstFor\(showcaseOrder\(projects\), useProfile\(\)\?\.projects \?\? \[\]\)/);
});

test("a project's line for the visitor is the reason written for it, and nothing for any other project", () => {
  assert.equal(reasonFor(noura, "masari"), "يبني السيرة على جهازك.");
  assert.equal(reasonFor(noura, "autoflow"), "");
  assert.equal(reasonFor(null, "mashhad"), "");
  // Inside the tile's head, so a wide card's grid areas stay as they are; and on the smaller builds too.
  assert.match(read("../components/showcase.tsx"), /<VisitorReason slug=\{project\.slug\} locale=\{locale\} \/>\s*<\/header>/);
  assert.match(read("../components/projects-section.tsx"), /<VisitorReason slug=\{project\.slug\} locale=\{locale\} \/>/);
});

test("Contact shows where Sultan's work meets the visitor's, with an email begun from their card", () => {
  const contact = read("../components/contact-section.tsx");
  assert.ok(contact.indexOf("<VisitorHelp") < contact.indexOf("<HelpSection"), "above the three ways to start");
  const help = read("../components/visitor-help.tsx");
  assert.match(help, /if \(!profile\?\.help\.length\) return null;/, "nothing for anyone the agent didn't read");
  assert.match(help, /replace\(\/\\\+\/g, "%20"\)/, "spaces stay spaces in mail apps");
  const ar = getContent("ar").ui.welcome;
  assert.equal(ar.mailSubject("نورة", "stc"), "سلام من نورة (stc)");
  assert.equal(ar.mailBody(noura), "مرحبا سلطان،\n\nأنا نورة، مهندسة تعلم آلة في stc. أشتغل على منصة لتوليد الروايات.\n\n");
});
