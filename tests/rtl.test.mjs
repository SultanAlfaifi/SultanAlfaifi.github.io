import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { MetaParts } = await import("../components/meta-parts.tsx");

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const rtl = read("../app/rtl.css");
const welcome = read("../components/welcome-screen.tsx");
const welcomeCss = read("../app/welcome.css");
const heroCss = read("../app/hero.css");
const portfolioCss = read("../app/portfolio.css");

test("each part of an 'a · b · c' line is isolated, so two English neighbours keep their order in Arabic", () => {
  assert.equal(
    renderToStaticMarkup(createElement(MetaParts, { text: "مفتوح المصدر · v1.2.0 · Codex وClaude Code" })),
    '<span><span class="meta-part">مفتوح المصدر</span> · <span class="meta-part">v1.2.0</span> · <span class="meta-part">Codex وClaude Code</span></span>'
  );
  assert.equal(renderToStaticMarkup(createElement(MetaParts, { text: "One part only" })), "One part only");
  assert.equal(renderToStaticMarkup(createElement(MetaParts, {})), "");
  assert.match(rtl, /\.meta-part \{ unicode-bidi: isolate; \}/);
  for (const file of ["projects-section", "achievements-section", "journey-timeline", "programs-section", "hero-run", "spec-strip"]) {
    assert.match(read(`../components/${file}.tsx`), /<MetaParts text=/, file);
  }
});

test("Arabic headings get room for their marks, including the recommendations heading", () => {
  assert.match(rtl, /\[dir="rtl"\] #recommendations h3 \{ line-height: 1\.4; \}/);
  assert.doesNotMatch(rtl, /#recommendations \.section-header h2/, "the quotes are a block inside Recognition, with an h3");
});

test("every chapter keeps its own spacing, since the visitor's choice can put any chapter after the hero", () => {
  // globals.css pads #about by id; the chapter rhythm wins it back. The Now card is a card, not a section.
  assert.match(read("../app/chapters.css"), /\.portfolio-v3 #about\.li-chapter \{ padding-bottom: calc\(var\(--li-chapter\) \/ 2\); \}/);
  assert.doesNotMatch(read("../components/experience-section.tsx"), /experience-section"|className="[^"]*\bsection\b/);
  assert.match(portfolioCss, /\.portfolio-v3 \.section \{ padding-block: var\(--section-space\); \}/);
});

test("the welcome screen arranges the page first, then flies into it, and never sticks around", () => {
  const finish = welcome.slice(welcome.indexOf("function finish("));
  assert.ok(finish.indexOf("saveVisitor(detail)") < finish.indexOf("slot.animate("), "the page is arranged before the orb leaves");
  assert.match(finish, /!motionAllowed\(\) \|\| !slot \|\| !target \|\| typeof slot\.animate !== "function"/);
  assert.match(finish, /window\.setTimeout\(close, FLIGHT_MS \+ 400\);/);
  // !important, because the hero's motion rules set the animation shorthand (which resets play-state) at a
  // higher specificity than this rule; a plain declaration lost to them and the entrance ran behind the screen.
  assert.match(heroCss, /html\[data-welcome="show"\] \.nav,\s*html\[data-welcome="show"\] \.identity-hero,\s*html\[data-welcome="show"\] \.identity-hero::before,\s*html\[data-welcome="show"\] \.identity-hero \*,\s*html\[data-welcome="show"\] \.identity-hero \*::before,\s*html\[data-welcome="show"\] \.identity-hero \*::after \{ animation-play-state: paused !important; \}/);
  assert.match(welcomeCss, /The hero's entrance waits behind the welcome screen/);
});
