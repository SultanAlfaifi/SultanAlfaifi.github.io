// The calm page (FINAL-SPEC 9.1): eight blocks after the hero, folds one level deep, every place the
// assistant can point at still on the page in both languages, and the navigation on the new chapters.
// The server HTML is what a visitor without JavaScript gets and what the assistant's anchors land on.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const { HomePage } = await import("../components/home-page.tsx");
const { SECTION_ORDERS } = await import("../components/personal-order.tsx");
const { getContent, locales } = await import("../data/i18n.ts");
const { buildAnchors } = await import("../lib/agent/anchors.ts");
const { deeperRowLines } = await import("../lib/deeper-rows.ts");
const { openFolds, revealAnchor, revealFoldedHash } = await import("../lib/agent/reveal.ts");

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const pages = Object.fromEntries(locales.map((locale) => [locale, new JSDOM(renderToStaticMarkup(createElement(HomePage, { locale }))).window.document]));
const anchors = buildAnchors(getContent("en"), getContent("ar"));
const ROWS = ["timeline", "organizations", "skills", "journey", "community", "ideas"];

test("(a) folds are one level deep: no <details> sits inside another, in either language", () => {
  for (const [locale, document] of Object.entries(pages)) {
    const folds = [...document.querySelectorAll("details")];
    assert.ok(folds.length >= ROWS.length, `${locale}: the six rows are folds`);
    for (const fold of folds) assert.equal(fold.parentElement.closest("details"), null, `${locale}: ${fold.id || fold.className} is nested in a fold`);
  }
});

test("(b) every place the assistant can cite or open is on both pages, exactly once", () => {
  assert.ok(anchors.length >= 15 + 5, "15 sections and the projects");
  for (const [locale, document] of Object.entries(pages)) {
    for (const { id } of anchors) assert.equal(document.querySelectorAll(`[id="${id}"]`).length, 1, `${locale}: #${id}`);
  }
});

test("(c) the Turnstile slot is never inside a fold", () => {
  for (const [locale, document] of Object.entries(pages)) {
    const slots = [...document.querySelectorAll(".agent-turnstile")];
    assert.ok(document.querySelector("#cv .agent-turnstile"), `${locale}: the CV's slot is in the HTML`);
    for (const slot of slots) assert.equal(slot.closest("details"), null, `${locale}: a Turnstile slot sits in a <details>`);
  }
});

test.todo("(d) no music in Mashhad's copy or in the motion note, in either language (owner: work)");

test("(e) every visitor order lists exactly the eight blocks the page passes to PersonalOrder", () => {
  const passed = [...read("../components/home-page.tsx").matchAll(/\{ id: "([a-z]+)", node:/g)].map((match) => match[1]);
  assert.deepEqual(passed, ["work", "band", "runtime", "about", "achievements", "cv", "deeper", "contact"], "the browse order");
  for (const [visitor, order] of Object.entries(SECTION_ORDERS)) {
    assert.deepEqual([...order].sort(), [...passed].sort(), visitor);
    assert.equal(new Set(order).size, order.length, `${visitor}: no key twice`);
  }
});

test.todo("(f) the footer has no [data-proximity] (owner: rest)");

test.todo("(g) ui.cv.notify and ui.cv.emailPrivacy exist in both languages and ui.cv.privacy does not (owner: cv)");

test("(h) the navigation is the five chapters a visitor looks for, in both languages", () => {
  for (const locale of locales) {
    assert.deepEqual(getContent(locale).navigation.map((item) => item.href), ["#work", "#runtime", "#about", "#cv", "#contact"], locale);
    const document = pages[locale];
    for (const { href } of getContent(locale).navigation) assert.ok(document.querySelector(`main > section${href}`), `${locale}: ${href} is a top-level chapter, so the scroll-spy sees it`);
  }
});

test("six numbered chapters, the band and the appendix, each with its pause; the nested ids sit in their chapter", () => {
  for (const [locale, document] of Object.entries(pages)) {
    const blocks = [...document.querySelectorAll("main > section")].slice(1);
    assert.equal(blocks.length, 8, `${locale}: eight blocks after the hero`);
    const numbered = blocks.filter((block) => block.matches(".li-chapter:not(.li-chapter--appendix)"));
    assert.deepEqual(numbered.map((block) => block.id), ["work", "runtime", "about", "achievements", "cv", "contact"], locale);
    for (const block of numbered) assert.equal(block.querySelectorAll(".li-chapter__eyebrow .li-chapter__num").length, 1, `${locale}: #${block.id} shows its number once`);
    assert.ok(blocks.every((block) => block.matches(".li-chapter, .li-pause")), `${locale}: every block sits on the rhythm and gets a seam`);
    assert.ok(blocks.find((block) => block.matches(".kinetic-band")).matches(".li-pause:not(.li-chapter)"), "the band does not count");
    assert.ok(blocks.find((block) => block.matches(".deeper")).matches(".li-chapter--appendix"), "the appendix does not count");
    assert.ok(document.querySelector("#about #experience"), `${locale}: the Now card is in About`);
    assert.ok(document.querySelector("#achievements #recommendations"), `${locale}: the quotes are in Recognition`);
    assert.ok(document.querySelector("#contact #help"), `${locale}: the help paths are in Contact`);
    for (const id of ROWS) assert.ok(document.querySelector(`.deeper > .page-shell > .deeper__rows > details#${id}`), `${locale}: #${id} is its own row`);
  }
  const living = read("../app/living.css");
  assert.match(living, /#main-content \{ counter-reset: chapter; \}/);
  assert.match(living, /\.portfolio-v3 \.li-chapter \{[^}]*counter-increment: chapter;/);
  assert.match(living, /\.portfolio-v3 \.li-chapter--appendix \{ counter-increment: none; \}/);
  assert.match(living, /\.li-chapter__num::before \{ content: counter\(chapter, decimal-leading-zero\); \}/);
});

test("the rhythm steps clearly: chapter > group > opener > card, and eight type sizes", () => {
  const living = read("../app/living.css");
  const token = (name) => living.match(new RegExp(`${name}: clamp\\((\\d+)px, [\\d.]+vw, (\\d+)px\\);`)).slice(1).map(Number);
  const [chapter, group, open, gap] = ["--li-chapter", "--li-group", "--li-open", "--li-gap"].map(token);
  for (const end of [0, 1]) {
    assert.ok(chapter[end] > group[end] && group[end] > open[end] && open[end] > gap[end], "each step is bigger than the one inside it");
    assert.ok(chapter[end] >= 3 * gap[end], "chapters sit at least 3× the card gap apart");
  }
  for (const size of ["--li-t0", "--li-t1", "--li-t2", "--li-t3", "--li-t4", "--li-t5", "--li-t6", "--li-t7"]) assert.match(living, new RegExp(`${size}: `), size);
  assert.match(living, /--li-space-feature: calc\(var\(--li-chapter\) \/ 2\);/, "the work and AI sections share the chapter rhythm");
  // The blocks for each builder exist, in order, and the file loads right after the design system.
  const chapters = read("../app/chapters.css");
  const owners = ["About + Now (owner: recog)", "Recognition (owner: recog)", "Outside the projects (owner: rest)", "Contact + Help (owner: rest)", "Closing and footer (owner: rest)"].map((name) => chapters.indexOf(`/* ===== ${name} ===== */`));
  assert.ok(owners.every((at) => at > 0));
  assert.deepEqual([...owners].sort((a, b) => a - b), owners);
  assert.match(read("../app/layout.tsx"), /import "\.\/living\.css";\r?\nimport "\.\/chapters\.css";/);
});

test("a pause seed blooms once and rests; without the observer or with motion off it is simply lit", () => {
  const living = read("../app/living.css");
  assert.match(living, /:is\(\.li-chapter, \.li-pause\) \+ :is\(\.li-chapter, \.li-pause\)::before \{[^}]*width: 9px;[^}]*conic-gradient\(from 210deg/);
  assert.match(living, /@media \(prefers-reduced-motion: no-preference\) \{\s*html\[data-seeds\]:not\(\[data-motion="off"\]\)/, "the bloom only with motion allowed and the observer running");
  assert.match(living, /animation: li-seed-bloom 1\.6s var\(--li-ease-spring\) both;/);
  assert.doesNotMatch(living, /li-seed-bloom[^;]*infinite/, "once, never a loop");
  const layer = read("../components/interaction-layer.tsx");
  assert.match(layer, /if \(motionAllowed\(\)\) \{\s*root\.dataset\.seeds = "on";/);
  assert.match(layer, /entry\.target\.classList\.add\("is-seen"\);\s*seeds\?\.unobserve\(entry\.target\);/, "each seed blooms once");
  assert.match(layer, /const characters = document\.querySelector\("\[data-proximity\]"\)/, "no proximity work when nothing opts in");
});

test("the closed rows still say what left the number row: 6,500+ and 180+, each with its note", () => {
  const expected = {
    en: {
      community: "3 trainings I’ve led · 180+ volunteer hours · Across 11 initiatives · my own record",
      ideas: "6,500+ followers across X and LinkedIn · 4.5K+ on X · 2K+ on LinkedIn",
      timeline: "15 stops, from starting my degree to what I'm working on now"
    },
    ar: {
      community: "3 فعاليات تدريبية قدّمتها · +180 ساعة تطوع · في 11 مبادرة · حسب سجلي",
      ideas: "+6,500 متابع على X ولينكدإن · أكثر من 4.5 ألف على X · أكثر من ألفين على لينكدإن",
      timeline: "15 محطة، من بدء دراستي حتى ما أعمل عليه الآن"
    }
  };
  for (const locale of locales) {
    const content = getContent(locale);
    const lines = deeperRowLines(content);
    assert.equal(lines.community, expected[locale].community, locale);
    assert.equal(lines.ideas, expected[locale].ideas, locale);
    assert.equal(lines.timeline, expected[locale].timeline.replace("15", String(content.journey.length)), locale);
    assert.equal(lines.organizations, content.ui.organizations.intro);
    assert.equal(lines.journey, content.ui.programs.description);
    assert.ok(content.ui.skills.description.startsWith(lines.skills) && /[.؟!]$/.test(lines.skills), `${locale}: the skills line is the first sentence`);
    // Visible with every row closed: the line is in the summary, not behind the fold.
    for (const id of ROWS) assert.equal(pages[locale].querySelector(`details#${id} > summary .deeper-row__line`).textContent, lines[id], `${locale}: #${id}`);
  }
});

test("the assistant, the palette and a shared link open every fold around what they point at", () => {
  const dom = new JSDOM(`<main><details id="outer"><summary>o</summary><details id="skills"><summary>s</summary><p id="deep">x</p></details></details><section id="cv"></section></main>`, { url: "https://example.test/ar/#skills" });
  const { window } = dom;
  const saved = { window: globalThis.window, document: globalThis.document };
  globalThis.window = window;
  globalThis.document = window.document;
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  const scrolled = [];
  window.Element.prototype.scrollIntoView = function () { scrolled.push(this.id); };
  try {
    const outer = window.document.getElementById("outer");
    const row = window.document.getElementById("skills");
    openFolds(window.document.getElementById("deep"));
    assert.ok(outer.open && row.open, "every ancestor, not just the closest");
    outer.open = row.open = false;
    assert.equal(revealAnchor("skills", false), true);
    assert.ok(row.open && outer.open, "a row that is itself the target opens");
    outer.open = row.open = false;
    assert.equal(revealFoldedHash(), true, "a shared link to a folded row opens it");
    assert.ok(row.open && outer.open);
    assert.deepEqual(scrolled, ["skills", "skills"]);
    window.location.hash = "#cv";
    assert.equal(revealFoldedHash(), false, "any other hash is left to the browser");
    window.location.hash = "#%E0%A4%A";
    assert.equal(revealFoldedHash(), false, "a broken hash is ignored");
  } finally {
    globalThis.window = saved.window;
    globalThis.document = saved.document;
    dom.window.close();
  }
  const palette = read("../components/command-palette.tsx");
  assert.match(palette, /if \(!target\) return;\s*openFolds\(target\);/, "the palette's jump opens every fold");
  assert.doesNotMatch(read("../lib/agent/reveal.ts") + palette, /const details = \w+\.closest\("details"\);/, "no single-fold shortcut left");
  assert.match(read("../components/interaction-layer.tsx"), /window\.addEventListener\("hashchange", handleHash\);/);
});
