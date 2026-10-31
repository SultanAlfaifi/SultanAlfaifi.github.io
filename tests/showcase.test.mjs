import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const { ProjectsSection } = await import("../components/projects-section.tsx");
const { getContent } = await import("../data/i18n.ts");

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const css = read("../app/showcase.css");
const showcase = read("../components/showcase.tsx");
const demos = read("../components/showcase-demos.tsx");
// The server HTML is what a visitor without JavaScript gets, what paints before hydration, and what a
// visitor with motion off keeps: every demo in its finished frame.
const page = (locale) => new JSDOM(renderToStaticMarkup(createElement(ProjectsSection, { locale }))).window.document;
const featured = (content) => content.projects.filter((project) => project.enabled && project.featured).sort((a, b) => a.showcase - b.showcase);

test("the showcase runs in the data's order, AccessFinish first as the full-width feature, and every project keeps its anchor", () => {
  for (const locale of ["en", "ar"]) {
    const content = getContent(locale);
    const document = page(locale);
    const tiles = [...document.querySelectorAll(".sc-grid > article.sc-tile")];
    assert.deepEqual(tiles.map((tile) => tile.id), featured(content).map((project) => `project-${project.slug}`));
    assert.equal(tiles[0].id, "project-accessfinish", "the hero's Approve lands on the feature");
    assert.ok(tiles[0].classList.contains("sc-feature"));
    assert.equal(document.querySelectorAll(".sc-feature").length, 1);
    for (const project of content.projects.filter((item) => item.enabled)) {
      assert.equal(document.querySelectorAll(`#project-${project.slug}`).length, 1, `${locale}: #project-${project.slug} once`);
    }
    assert.ok(document.querySelector("section#work.work-section"), "the dark-band class stays for app/living.css");
  }
});

test("every demo is built in its finished frame, so nothing waits on a script", () => {
  for (const locale of ["en", "ar"]) {
    const { ui } = getContent(locale);
    const document = page(locale);
    const wall = document.querySelector("#project-accessfinish .sc-dm--wall");
    assert.equal(wall.querySelectorAll(".sc-page").length, 15);
    assert.equal(wall.querySelectorAll(".sc-page.is-rejected").length, 15, `${locale}: every page rejected at rest`);
    assert.equal(wall.querySelector(".sc-wall__count").textContent, ui.work.visuals.verified);
    assert.equal(wall.getAttribute("role"), "img");
    assert.equal(wall.getAttribute("aria-label"), ui.work.visuals.trialsAria);
    assert.equal(document.querySelector("#project-mustakshif .sc-dm--mk").dataset.frame, "4");
    assert.ok(document.querySelector("#project-mustakshif .mk-rank li.is-pick"));
    assert.equal(document.querySelector("#project-masari .sc-dm--ms").dataset.frame, "5");
    assert.equal(document.querySelector("#project-mashhad .sc-dm--mh").dataset.step, "5");
    assert.equal(document.querySelector("#project-autoflow .sc-dm--au").dataset.frame, "4");
    assert.ok(document.querySelector("#project-mawrid .sc-dm--wv.is-held"));
    assert.equal(document.querySelectorAll("#project-mawrid .wv-sensor.is-fail").length, 1, "two readings pass, one fails");
    for (const demo of document.querySelectorAll(".sc-dm")) assert.equal(demo.dataset.phase ?? "rest", "rest");
  }
});

test("the lead numbers keep their kind, note and date, and never wrap", () => {
  const cases = {
    en: { values: ["15 of 15", "0 of 7"], tag: "Real bug", asOf: "As of 24 Oct 2026", note: "My own count, not audited" },
    ar: { values: ["15 من 15", "0 من 7"], tag: "خلل حقيقي", asOf: "حتى 24 أكتوبر 2026", note: "حسب إحصاءاتي، غير مدقّقة" }
  };
  for (const [locale, expected] of Object.entries(cases)) {
    const document = page(locale);
    const figures = [...document.querySelectorAll("#project-accessfinish > .sc-figs > .sc-fig")];
    assert.deepEqual(figures.map((figure) => figure.querySelector(".sc-value").textContent), expected.values);
    for (const figure of figures) {
      assert.equal(figure.querySelector(".sc-tag").textContent, expected.tag);
      assert.equal(figure.querySelector(".sc-fig__note").textContent, expected.asOf);
      assert.ok(figure.querySelector(".sc-value").classList.contains("li-num"), "tabular, on one line");
    }
    assert.equal(document.querySelector("#project-masari > .sc-figs .sc-fig__note").textContent, expected.note, `${locale}: Masari's count says it isn't audited`);
    // The seeded fault only ever appears with its own label.
    const seeded = [...document.querySelectorAll(".sc-fig")].filter((figure) => /^7 (of|من) 7$/.test(figure.querySelector(".sc-value").textContent));
    assert.ok(seeded.length > 0);
    for (const figure of seeded) assert.equal(figure.querySelector(".sc-tag").textContent, getContent(locale).ui.work.showcase.tags["seeded-fault"]);
    // Mashhad's star count stays out until Sultan confirms it.
    assert.equal(document.querySelectorAll("#project-mashhad .sc-fig").length, 0);
    assert.doesNotMatch(document.querySelector("#project-mashhad").textContent, /stars|نجم/i);
  }
  assert.match(css, /\.sc-value \{[^}]*white-space: nowrap/);
  assert.match(css, /\.li-num|tabular/);
});

test("each tile shows where it stops for a person in the project's own words, and Masari the line it keeps", () => {
  for (const locale of ["en", "ar"]) {
    const content = getContent(locale);
    const document = page(locale);
    for (const project of featured(content)) {
      const block = document.querySelector(`#project-${project.slug} > .sc-cp`);
      assert.equal(block.querySelector(".sc-cp__text").textContent, project.checkpoint?.text ?? project.boundary);
      assert.equal(block.querySelectorAll(".sc-track i").length, project.flow.length);
      if (project.checkpoint) {
        assert.equal(block.querySelector(".sc-track i.is-gate"), block.querySelectorAll(".sc-track i")[project.checkpoint.step - 1]);
        assert.ok(document.querySelector(`#project-${project.slug}`).classList.contains(`li-k-${project.checkpoint.kind}`));
      } else {
        assert.ok(block.classList.contains("sc-cp--bound"));
        assert.ok(document.querySelector(`#project-${project.slug}`).classList.contains("li-k-bound"));
      }
    }
    const legend = [...document.querySelectorAll(".sc-legend li")].map((item) => item.className);
    assert.deepEqual(legend, ["li-k-asks", "li-k-verifies", "li-k-holds", "li-k-bound sc-legend__bound"]);
  }
  const counts = [...page("en").querySelectorAll(".sc-legend li small")].map((item) => item.textContent);
  assert.deepEqual(counts, ["2 projects", "2 projects", "1 project", "1 project"]);
});

test("the case text is in the server HTML inside each tile, so it works without JavaScript and the assistant can quote it", () => {
  for (const locale of ["en", "ar"]) {
    const content = getContent(locale);
    const document = page(locale);
    for (const project of featured(content)) {
      const tile = document.querySelector(`#project-${project.slug}`);
      const details = tile.querySelector("details.sc-more");
      assert.ok(details, `${locale} ${project.slug}: the case text ships in a <details>`);
      for (const text of [project.description, project.challenge, project.decision, project.evidence, ...project.highlights]) {
        assert.ok(tile.textContent.includes(text), `${locale} ${project.slug}: "${text.slice(0, 40)}…" is on the page`);
      }
      if (project.caveat) assert.ok(details.textContent.includes(project.caveat));
      assert.equal(tile.querySelector("button.sc-open"), null, "the dialog button only appears once the script can open it");
    }
    const dialog = document.querySelector("dialog.sc-case");
    assert.equal(dialog.getAttribute("aria-labelledby"), "sc-case-title");
    assert.equal(dialog.hasAttribute("open"), false);
  }
});

test("each tile has its own identity: the real Mustakshif icon and Masari screenshot, and its own light", () => {
  const document = page("en");
  // next/image rewrites the src outside the static export, so match the file, not the whole URL.
  assert.match(decodeURIComponent(document.querySelector("#project-mustakshif .sc-tile__title img").getAttribute("src")), /\/assets\/projects\/mustakshif-icon\.png/);
  assert.match(decodeURIComponent(document.querySelector("#project-masari .ms-shot img").getAttribute("src")), /\/assets\/projects\/masari\.webp/);
  const accents = featured(getContent("en")).map((project) => document.querySelector(`#project-${project.slug}`).getAttribute("style"));
  assert.equal(new Set(accents).size, accents.length, "no two tiles share a light");
  for (const tile of document.querySelectorAll(".sc-grid > .sc-tile")) {
    assert.ok(tile.classList.contains("li-glass") && tile.classList.contains("li-glass--light"), "glass with the pointer light");
    assert.equal(tile.querySelector(":scope > .sc-edge")?.getAttribute("aria-hidden"), "true", "a lit stretch of edge follows the pointer");
  }
  // The pointer's light is the tile's own colour, on a fine pointer only, and off with the motion switch.
  assert.match(css, /\.sc-tile\.li-glass--light::before \{[^}]*var\(--sc-accent\)/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.sc-tile:hover > \.sc-edge/);
  assert.match(css, /html\[data-motion="off"\] \.sc-edge \{ display: none; \}/);
});

test("the grids never end on an empty gap", () => {
  // A demo takes the height its row has to spare, so a tile without figures doesn't end in a hole.
  assert.match(css, /\.sc-tile:not\(\.sc-feature\) > \.sc-demo \{ flex: 1 0 auto; height: auto; min-height: 288px; \}/);
  // Five smaller builds on a desktop: three, then two that share the row.
  assert.match(css, /\.sc-lab__cell:nth-child\(3n \+ 1\):nth-last-child\(2\),\s*\.sc-lab__cell:nth-child\(3n \+ 2\):last-child \{ grid-column: span 3; \}/);
  assert.match(css, /\.sc-lab__cell:nth-child\(3n \+ 1\):last-child \{ grid-column: 1 \/ -1; \}/, "and one left over takes the row");
  for (const locale of ["en", "ar"]) {
    const cells = page(locale).querySelectorAll(".sc-lab__grid > .sc-lab__cell > article.sc-lab__card");
    assert.equal(cells.length, getContent(locale).projects.filter((project) => project.enabled && !project.featured).length);
  }
});

test("the case view is a real modal dialog that grows out of its tile, with motion as an enhancement", () => {
  assert.match(showcase, /dialog\.showModal\(\)/, "showModal makes the rest of the page inert");
  assert.match(showcase, /document\.startViewTransition/);
  assert.match(showcase, /motionAllowed\(\) && typeof document\.startViewTransition === "function"/, "no morph with motion off");
  assert.match(showcase, /onCancel=\{\(event\) => \{\s*event\.preventDefault\(\);\s*closeCase\(\);/, "Escape closes through the same path");
  assert.match(showcase, /focusBack/, "focus goes back to the tile's button");
  assert.match(showcase, /subscribeMotion/, "turning motion off mid-demo lands it on its stop");
  assert.match(showcase, /const enough = feature \? 0\.35 : 0\.5;/, "the tall wall starts once a third of it shows");
  assert.match(demos, /if \(phase === "rest"\) return schedule\.length;/, "rest is the finished frame");
  assert.match(css, /html\.sc-locked \{ overflow: hidden; \}/);
  assert.match(css, /::view-transition-group\(sc-case\)/);
});

test("text in the showcase and its demos is never smaller than 12.5px, and nothing moves forever", () => {
  const sizes = [...css.matchAll(/([^{}]+)\{[^}]*?font-size: ([^;]+);/g)];
  assert.ok(sizes.length > 20);
  for (const [, selector, value] of sizes) {
    const first = value.startsWith("clamp(") ? value.slice(6).split(",")[0].trim() : value.trim();
    const number = Number.parseFloat(first);
    if (first.endsWith("rem")) assert.ok(number * 16 >= 12.5, `${selector.trim()}: ${value}`);
    else if (first.endsWith("px")) assert.ok(number >= 12.5, `${selector.trim()}: ${value}`);
    else if (first.endsWith("em") && !/sc-value__u/.test(selector)) assert.ok(number >= 1, `${selector.trim()}: ${value} (demos are 13px and up)`);
  }
  assert.match(css, /\.sc-dm \{[^}]*font-size: 13px/);
  assert.doesNotMatch(css, /infinite/, "every demo animation ends");
  // Tap targets: the case controls and phone links are 44px.
  assert.match(css, /\.sc-icon \{[^}]*width: 44px; height: 44px/);
  assert.match(css, /\.sc-open \{[^}]*min-height: 44px/);
  assert.match(css, /@media \(max-width: 720px\) \{[\s\S]*?\.sc-link \{ min-height: 44px; \}/);
});

test("text over a tile's accent light is never quiet ink, the wall ends on its last no, and source links say what they show", () => {
  assert.match(css, /\.sc-tile__meta \{[^}]*color: var\(--li-ink-2\);/);
  assert.match(css, /\.sc-page__top b \{[^}]*color: var\(--li-ink-2\);/);
  assert.match(css, /\.sc-dm--wv\.is-held \.wv-node\.is-end \{ color: var\(--li-ink-2\); \}/);
  assert.doesNotMatch(css, /\.mh-brief \{ color: var\(--li-ink-3\); \}/);
  assert.match(css, /\.sc-page__day \{[^}]*white-space: nowrap;/, "the wrong-day line never leaves a word alone");
  assert.match(css, /\.sc-page\.is-rejected:last-child \{/);
  for (const locale of ["en", "ar"]) {
    const document = page(locale);
    assert.equal(document.querySelectorAll("#project-accessfinish .sc-page__cal").length, 5, `${locale}: every third page is a booking week`);
    const { ui } = getContent(locale);
    for (const link of document.querySelectorAll(".sc-link:not(.sc-link--primary), .sc-actions .li-btn--ghost")) {
      const label = link.getAttribute("aria-label");
      if (label) assert.ok(label.startsWith(ui.work.sourceCode), `${locale}: "${label}" starts with the visible words`);
    }
  }
});
