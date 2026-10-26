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
const portfolioCss = read("../app/portfolio.css");

test("each part of an 'a · b · c' line is isolated, so two English neighbours keep their order in Arabic", () => {
  assert.equal(
    renderToStaticMarkup(createElement(MetaParts, { text: "مفتوح المصدر · v1.2.0 · Codex وClaude Code" })),
    '<span><span class="meta-part">مفتوح المصدر</span> · <span class="meta-part">v1.2.0</span> · <span class="meta-part">Codex وClaude Code</span></span>'
  );
  assert.equal(renderToStaticMarkup(createElement(MetaParts, { text: "One part only" })), "One part only");
  assert.equal(renderToStaticMarkup(createElement(MetaParts, {})), "");
  assert.match(rtl, /\.meta-part \{ unicode-bidi: isolate; \}/);
  for (const file of ["projects-section", "achievements-section", "journey-timeline", "programs-section", "hero"]) {
    assert.match(read(`../components/${file}.tsx`), /<MetaParts text=/, file);
  }
});

test("Arabic headings get room for their marks, including the recommendations heading", () => {
  assert.match(rtl, /\[dir="rtl"\] #recommendations \.section-header h2 \{ line-height: 1\.32; \}/);
});

test("every section keeps its own spacing, since the visitor's choice can put any section after the hero", () => {
  assert.match(portfolioCss, /\.portfolio-v3 \.experience-section \{ padding-top: var\(--section-space\);/);
});

test("the welcome screen arranges the page first, then fades out, and never sticks around", () => {
  const finish = welcome.slice(welcome.indexOf("function finish("));
  assert.ok(finish.indexOf("saveVisitor(detail)") < finish.indexOf("dialog.animate("), "the page is arranged before the fade starts");
  assert.match(finish, /if \(!motionAllowed\(\) \|\| typeof dialog\.animate !== "function"\) return close\(\);/);
  assert.match(finish, /window\.setTimeout\(close, 700\);/);
  assert.match(welcomeCss, /html\[data-welcome="show"\] :is\(\.identity-hero__copy, \.intro-film\) \{ animation-play-state: paused; \}/);
});
