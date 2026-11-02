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

test("(d) no music in Mashhad's copy or in the motion note, in either language", () => {
  const music = /music|موسيق/i;
  for (const locale of locales) {
    const { projects, ui } = getContent(locale);
    const mashhad = projects.find((project) => project.slug === "mashhad");
    assert.doesNotMatch(JSON.stringify(mashhad), music, `${locale}: Mashhad's data`);
    assert.doesNotMatch(ui.work.visuals.motionNote, music, `${locale}: the motion note`);
    assert.doesNotMatch(pages[locale].querySelector("#project-mashhad").textContent, music, `${locale}: Mashhad's card`);
    // The optional voice-over is not music, and it stays.
    assert.match(mashhad.highlights.join(" "), /ElevenLabs/, `${locale}: the narration stays`);
  }
});

test("(e) every visitor order lists exactly the eight blocks the page passes to PersonalOrder", () => {
  const passed = [...read("../components/home-page.tsx").matchAll(/\{ id: "([a-z]+)", node:/g)].map((match) => match[1]);
  assert.deepEqual(passed, ["work", "band", "runtime", "about", "achievements", "cv", "deeper", "contact"], "the browse order");
  for (const [visitor, order] of Object.entries(SECTION_ORDERS)) {
    assert.deepEqual([...order].sort(), [...passed].sort(), visitor);
    assert.equal(new Set(order).size, order.length, `${visitor}: no key twice`);
  }
});

test("(f) the footer has no [data-proximity]: the page closes on a still name in its own language and one row", () => {
  for (const [locale, document] of Object.entries(pages)) {
    const { identity, ui } = getContent(locale);
    const footer = document.querySelector("footer");
    assert.ok(footer, `${locale}: a footer`);
    assert.equal(document.querySelectorAll("footer[data-proximity], footer [data-proximity], footer [data-cursor]").length, 0, `${locale}: nothing in the footer follows the pointer`);
    const mark = footer.querySelector(".closing__mark");
    assert.equal(mark.getAttribute("aria-hidden"), "true", `${locale}: the name is decoration`);
    assert.equal(mark.textContent, identity.name, `${locale}: the name in the page's language`);
    assert.deepEqual([...footer.querySelectorAll("a")].map((link) => link.getAttribute("href")), ["#home"], `${locale}: one link, back to the top; no social row`);
    assert.ok(footer.textContent.includes(ui.footer.designed) && footer.textContent.includes(ui.footer.rights), locale);
    // Contact, just above it: one email action, the address once as text, the help paths inline, the profiles
    // once, and the horizon. No rotating badge.
    const contact = document.getElementById("contact");
    assert.deepEqual([...contact.querySelectorAll(".li-btn--primary")].map((link) => link.getAttribute("href")), [`mailto:${identity.email}`], `${locale}: one primary`);
    assert.equal(contact.querySelectorAll(`a[href="mailto:${identity.email}"]`).length, 1, `${locale}: no second email pill`);
    assert.ok(contact.querySelector(".finale__meta").textContent.includes(identity.email), `${locale}: the address as text`);
    assert.equal(contact.querySelector("#help h3").textContent, ui.help.title, `${locale}: «كيف أقدر أخدمك؟» keeps its title`);
    assert.equal(contact.querySelectorAll("#help .contact__path").length, 3);
    assert.equal(document.querySelectorAll(".finale__socials .social-links a").length, 3, `${locale}: GitHub, LinkedIn and X`);
    assert.equal(contact.querySelector(".finale__horizon").getAttribute("aria-hidden"), "true");
    assert.equal(contact.querySelector(".contact-orb, textPath"), null, `${locale}: the rotating badge is gone`);
  }
});

test("(g) the CV's privacy note is split: who gets notified beside the fields, the email's use beside the email", () => {
  for (const locale of locales) {
    const cv = getContent(locale).ui.cv;
    assert.ok(cv.notify?.trim() && cv.emailPrivacy?.trim(), `${locale}: both halves exist`);
    assert.equal(Object.hasOwn(cv, "privacy"), false, `${locale}: the old single sentence is gone`);
    assert.doesNotMatch(cv.notify + cv.emailPrivacy + cv.more + cv.moreHint, /tailor|فصّل|فصل/i, locale);
    const section = pages[locale].getElementById("cv");
    const folds = section.querySelectorAll("details");
    assert.equal(folds.length, 1, `${locale}: one fold in the CV, «خيارات أكثر»`);
    const [more] = folds;
    assert.ok(more.matches(".cv-more") && more.querySelector(":scope > summary").textContent.includes(cv.moreHint), `${locale}: the fold says what it holds`);
    // The download sends a note whenever a company, a role or a posting is given, so that half stays in view.
    const notify = section.querySelector(".cv-notify");
    assert.equal(notify?.textContent, cv.notify, `${locale}: the notify line`);
    assert.equal(notify.closest("details"), null, `${locale}: the notify line is never folded away`);
    assert.ok(notify.closest(".cv-for"), `${locale}: beside the company and role`);
    assert.equal(section.querySelector(".cv-more .cv-email .cv-email__privacy")?.textContent, cv.emailPrivacy, `${locale}: the email half sits with the email field`);
    // One download first, then who it's for, then the fold; the posting and the emailed copy are inside it.
    const order = [".cv-download", ".cv-for", ".cv-more", ".cv-more .cv-posting", ".cv-more .cv-email"].map((selector) => section.querySelector(selector));
    assert.ok(order.every(Boolean), `${locale}: every part is on the page`);
    for (let index = 1; index < order.length; index += 1) assert.ok(order[index - 1].compareDocumentPosition(order[index]) & 4, `${locale}: source order`);
    assert.equal(section.querySelectorAll(".li-btn--primary").length, 1, `${locale}: one primary action`);
  }
});

test("the CV page rises out of light and is complete at every point: standing without JavaScript or motion", () => {
  const css = read("../app/cv.css");
  const paper = read("../components/cv-paper.tsx");
  assert.match(css, /@property --rise \{ syntax: "<number>"; inherits: true; initial-value: 1; \}/, "standing by default");
  const motion = css.slice(css.indexOf("@media (prefers-reduced-motion: no-preference) {"));
  assert.match(motion, /^@media \(prefers-reduced-motion: no-preference\) \{\s*\/\*[^*]*\*\/\s*@supports \(animation-timeline: view\(\)\) \{\s*html:not\(\[data-motion="off"\]\) \.cv-stage \{\s*animation: cv-rise [^;]+;\s*animation-timeline: view\(\);\s*animation-range: entry 10% cover 40%;/, "tied to scroll, only with motion allowed");
  assert.match(css, /html\[data-motion="off"\] \.cv-stage \{ --rise: 1 !important; \}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.cv-stage \{ --rise: 1 !important; \}/);
  assert.match(paper, /CSS\.supports\("animation-timeline: view\(\)"\)/, "a scroll fallback where CSS can't tie it to scroll");
  // The old drop-in left a blank cream flap on a normal scroll; the underlay sheet is gone with it.
  assert.doesNotMatch(css, /#e7e5dc|\.cv-sheet::before/);
  assert.doesNotMatch(paper, /rotate: "x 30deg"/);
  // The approval moment and the prepared ring are decoration: gated on motion, the status line says it.
  assert.match(read("../components/cv-section.tsx"), /if \(download === "done" && motionAllowed\(\)\) bloomBrandOrb\(\);/);
  assert.match(motion, /html:not\(\[data-motion="off"\]\) \.cv-stage\.is-prepared \.cv-ring \{ animation: cv-ring-turn 2\.4s [^}]*1 both; \}/, "the ring turns once");
  // The paper in the server HTML is the fitted one (lib/cv/fitted-file.ts), so it fits one page without
  // JavaScript: it shows exactly the lines scripts/build-cv.ts kept for the general CV.
  const fitted = (() => { try { return JSON.parse(read("../public/cv/fitted.json")); } catch { return null; } })();
  if (fitted?.general) {
    const kept = new Set(fitted.general.split("~").slice(1).flatMap((part) => part.split(/[._]/)).filter(Boolean));
    for (const [locale, document] of Object.entries(pages)) {
      const lines = [...document.querySelectorAll("#cv .cv-paper [data-line]")].map((line) => line.getAttribute("data-line")).filter((id) => /^(sum|skl|exp|prj|rec|trn|tch)-/.test(id));
      assert.ok(lines.length > 10, `${locale}: the paper has its lines`);
      for (const id of lines) assert.ok(kept.has(id), `${locale}: ${id} is on the paper only if the fitted CV keeps it`);
      for (const id of kept) assert.ok(lines.includes(id), `${locale}: ${id} from the fitted CV is on the paper`);
    }
  }
});

test("the last headline breaks after its question, never inside it, and the hiring order keeps the greeting with its sentence", () => {
  for (const [locale, document] of Object.entries(pages)) {
    const title = getContent(locale).ui.contact.title;
    const lines = [...document.querySelectorAll("#contact-title .clause-line")].map((line) => line.textContent.trim());
    if (/[?؟]\s/.test(title)) assert.deepEqual(lines, title.replace(/([?؟])\s+/g, "$1\n").split("\n"), `${locale}: one line per clause`);
    else assert.equal(lines.length, 0, `${locale}: a headline without a question stays one block`);
    // The voices in Mashhad and AutoFlow are one line each, not rows of bars.
    for (const wave of document.querySelectorAll(".mh-wave, .au-wave")) {
      assert.equal(wave.querySelectorAll("i").length, 0, `${locale}: no bars`);
      assert.equal(wave.querySelectorAll("svg.sc-wave > path").length, 1, `${locale}: one stroke`);
    }
  }
  const chapters = read("../app/chapters.css");
  assert.match(chapters, /html\[data-visitor="hiring"\] \.about__now \{ order: -1;/, "G10: the Salla card comes first inside About");
  assert.match(chapters, /html\[data-visitor="hiring"\] \.about__lead \{ grid-column: 1 \/ span 7; grid-row: 1; \}/, "the greeting keeps its first sentence above the card");
});

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
  // The chapter blocks exist, in page order, and the file loads right after the design system.
  const chapters = read("../app/chapters.css");
  const blocks = ["About + Now", "Recognition", "Outside the projects", "Contact + Help", "Closing and footer"].map((name) => chapters.indexOf(`/* ===== ${name} ===== */`));
  assert.ok(blocks.every((at) => at > 0));
  assert.deepEqual([...blocks].sort((a, b) => a - b), blocks);
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
    assert.equal(revealFoldedHash(true), true, "on load, after hydration, a place that is not folded is landed on again");
    assert.equal(scrolled.at(-1), "cv");
    // A reload or a history step keeps the place the browser restored: nothing scrolls, a fold only opens.
    const navigation = window.performance.getEntriesByType;
    window.performance.getEntriesByType = (type) => (type === "navigation" ? [{ type: "reload" }] : []);
    const before = scrolled.length;
    assert.equal(revealFoldedHash(true), false, "a reload is not pulled back to the hash");
    outer.open = row.open = false;
    window.location.hash = "#skills";
    assert.equal(revealFoldedHash(true), true, "a reload of a folded link opens the row");
    assert.ok(row.open && outer.open);
    window.performance.getEntriesByType = () => [{ type: "back_forward" }];
    window.location.hash = "#cv";
    assert.equal(revealFoldedHash(true), false, "neither is a step back");
    assert.equal(scrolled.length, before, "no scroll on a restored visit");
    window.performance.getEntriesByType = navigation;
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
