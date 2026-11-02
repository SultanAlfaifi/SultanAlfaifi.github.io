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
// A card's face: everything but its folded case text.
const face = (tile) => [...tile.children].filter((child) => !child.matches("details"));
const onFace = (tile, selector) => face(tile).flatMap((child) => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);

test("the showcase runs in the data's order, wide · pair · pair · wide, and every project keeps its anchor", () => {
  for (const locale of ["en", "ar"]) {
    const content = getContent(locale);
    const document = page(locale);
    const tiles = [...document.querySelectorAll(".sc-grid > article.sc-tile")];
    assert.deepEqual(tiles.map((tile) => tile.id), featured(content).map((project) => `project-${project.slug}`));
    assert.equal(tiles[0].id, "project-accessfinish", "the hero's Approve lands on the feature");
    assert.ok(tiles[0].classList.contains("sc-feature"));
    assert.equal(document.querySelectorAll(".sc-feature").length, 1);
    assert.deepEqual(tiles.map((tile) => tile.classList.contains("sc-wide")), [true, false, false, false, false, true], `${locale}: AccessFinish and WAREVA wide, two pairs between`);
    for (const project of content.projects.filter((item) => item.enabled)) {
      assert.equal(document.querySelectorAll(`#project-${project.slug}`).length, 1, `${locale}: #project-${project.slug} once`);
    }
    assert.ok(document.querySelector("section#work.work-section"), "the dark-band class stays for app/living.css");
  }
  // Two columns, a wide card across both: no three-column row is left.
  assert.match(css, /\.sc-grid \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); gap: var\(--li-gap\); margin-top: var\(--li-open\); \}/);
  assert.match(css, /\.sc-grid > \.sc-wide \{ grid-column: 1 \/ -1; \}/);
  assert.doesNotMatch(css, /span 7|span 5|nth-child\(6\)/, "the old 7 + 5 and three-across rows are gone");
});

test("the legend strip is gone: the cards say where they stop on their own", () => {
  for (const locale of ["en", "ar"]) assert.equal(page(locale).querySelector(".sc-legend"), null, locale);
  assert.doesNotMatch(css, /\.sc-legend/);
  assert.doesNotMatch(read("../components/projects-section.tsx"), /sc-legend|legendAria/);
});

test("every demo is built in its finished frame, so nothing waits on a script", () => {
  for (const locale of ["en", "ar"]) {
    const { ui } = getContent(locale);
    const document = page(locale);
    const wall = document.querySelector("#project-accessfinish .sc-dm--wall");
    assert.equal(wall.querySelectorAll(".sc-page").length, 15);
    assert.equal(wall.querySelectorAll(".sc-page.is-rejected").length, 15, `${locale}: every page struck at rest`);
    assert.ok(wall.classList.contains("is-struck"));
    assert.equal(wall.getAttribute("role"), "img");
    assert.equal(wall.getAttribute("aria-label"), ui.work.visuals.trialsAria);
    // A quiet texture: the words are said once, in the caption, not on every page.
    assert.equal(wall.querySelector(".sc-wall__cap").textContent, ui.work.visuals.trials);
    assert.equal(wall.textContent.split(ui.work.showcase.wall.rejected).length - 1, 0, `${locale}: no "rejected" printed per page`);
    assert.equal(wall.textContent.split(ui.work.showcase.wall.wrongDay).length - 1, 0, `${locale}: no "wrong day" printed per page`);
    for (const pageMark of wall.querySelectorAll(".sc-page")) {
      assert.equal(pageMark.querySelector(".sc-page__booked").textContent, ui.work.showcase.wall.booked);
      assert.ok(pageMark.querySelector(".sc-page__lamp"), "a lamp on every page");
      assert.ok(pageMark.children.length <= 2, "a quiet page: its line and lamp, and on every third page its week");
    }
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

test("the verifier strikes the wall once, in reading order, and at rest everything is already struck", () => {
  // From 300 ms, a page every 110 ms: about 2 s for fifteen, then it rests and never replays.
  assert.match(css, /\.sc-dm--wall\[data-phase="playing"\] :is\(\.sc-page, \.sc-page__booked, \.sc-page__lamp, \.sc-page__cal rect\),\s*\.sc-dm--wall\[data-phase="playing"\] \.sc-page__booked::after \{ transition-delay: calc\(300ms \+ var\(--i\) \* 110ms\); \}/);
  assert.match(css, /\.sc-page\.is-rejected \.sc-page__booked::after \{ transform: scaleX\(1\); \}/);
  assert.match(css, /\[dir="rtl"\] \.sc-page__booked::after \{ transform-origin: right center; \}/, "the strike draws from the inline start");
  assert.match(css, /\.sc-page\.is-rejected \.sc-page__lamp \{ background: var\(--li-rose\);/, "the lamp turns rose");
  assert.match(demos, /export const STRIKE_MS = 300 \+ 14 \* 110 \+ 350 \+ 110;/);
  assert.match(demos, /return slug === "accessfinish";/);
  assert.match(demos, /const struck = phase === "rest" \|\| \(phase === "playing" && armed\);/, "rest is the struck frame");
  assert.match(showcase, /const enough = once \? 0\.4 : 0\.5;/, "the wall starts once 40% of it shows");
  assert.match(showcase, /\} else if \(!once \|\| !played\.current\) \{/, "once struck, it is never rewound");
  // On a phone the pages drop their words and keep the struck line and the lamp.
  assert.match(css, /@container \(max-width: 540px\) \{[\s\S]*?\.sc-page__booked \{[^}]*color: transparent; \}[\s\S]*?\.sc-page__cal \{ display: none; \}/);
  // The card keeps its glass rim and inner glow: lit in its checkpoint colour, its own light inside.
  assert.match(css, /\.sc-tile \{[\s\S]*?background: radial-gradient\(110% 60% at 0% 0%, color-mix\(in srgb, var\(--sc-accent\) 10%, transparent\)/);
  assert.match(css, /\.sc-dm\.sc-dm--wall \{[\s\S]*?rgb\(var\(--li-rose-rgb\) \/ 13%\)/);
});

test("a face shows one figure with its kind, note and date; AccessFinish its two real-bug results together", () => {
  const cases = {
    en: { values: ["15 of 15", "0 of 7"], tag: "Real bug", asOf: "As of 24 Oct 2026", note: "My own count, not audited" },
    ar: { values: ["15 من 15", "0 من 7"], tag: "خلل حقيقي", asOf: "حتى 24 أكتوبر 2026", note: "حسب إحصاءاتي، غير مدقّقة" }
  };
  for (const [locale, expected] of Object.entries(cases)) {
    const content = getContent(locale);
    const document = page(locale);
    // AccessFinish: one unit, the two values side by side at the same size, under one tag and one date.
    const unit = document.querySelector("#project-accessfinish > .sc-figs.sc-figs--unit");
    assert.ok(unit, `${locale}: the figure unit`);
    const figures = [...unit.querySelectorAll(".sc-figs__pair > .sc-fig")];
    assert.deepEqual(figures.map((figure) => figure.querySelector(".sc-value").textContent), expected.values);
    assert.deepEqual(figures.map((figure) => figure.querySelector(".sc-fig__value").className), ["sc-fig__value", "sc-fig__value"], "the same size");
    for (const figure of figures) assert.ok(figure.querySelector(".sc-value").classList.contains("li-num"), "tabular, on one line");
    assert.deepEqual([...unit.querySelectorAll(".sc-tag")].map((tag) => tag.textContent), [expected.tag], "one real-bug tag");
    assert.deepEqual([...unit.querySelectorAll(".sc-fig__note")].map((note) => note.textContent), [expected.asOf], "one date");
    // Every other face: its first figure in data order, or none.
    for (const project of featured(content).slice(1)) {
      const tile = document.querySelector(`#project-${project.slug}`);
      const shown = onFace(tile, ".sc-fig");
      assert.equal(shown.length, project.metrics?.length ? 1 : 0, `${locale} ${project.slug}: one figure on the face`);
      if (shown.length) assert.equal(shown[0].querySelector(".sc-value").textContent, project.metrics[0].value);
    }
    assert.equal(onFace(document.querySelector("#project-masari"), ".sc-fig__note")[0].textContent, expected.note, `${locale}: Masari's count says it isn't audited`);
    assert.equal(onFace(document.querySelector("#project-mustakshif"), ".sc-tag")[0].textContent, content.ui.work.showcase.tags["public-count"]);
    // The second figures moved into "Inside the build", with their own labels.
    for (const [slug, value] of [["mustakshif", "11"], ["masari", content.projects.find((p) => p.slug === "masari").metrics[1].value], ["mawrid", content.projects.find((p) => p.slug === "mawrid").metrics[1].value]]) {
      const tile = document.querySelector(`#project-${slug}`);
      assert.ok(!onFace(tile, ".sc-value").some((v) => v.textContent === value), `${locale} ${slug}: ${value} is not on the face`);
      assert.ok([...tile.querySelectorAll("details.sc-more .sc-value")].some((v) => v.textContent === value), `${locale} ${slug}: ${value} is in the case text`);
    }
    // The seeded fault and the early trials only ever appear with their own labels, inside the case.
    const seeded = [...document.querySelectorAll(".sc-fig")].filter((figure) => /^7 (of|من) 7$/.test(figure.querySelector(".sc-value").textContent));
    assert.ok(seeded.length > 0);
    for (const figure of seeded) {
      assert.equal(figure.querySelector(".sc-tag").textContent, content.ui.work.showcase.tags["seeded-fault"]);
      assert.ok(figure.closest("details.sc-more"), "the seeded fault is in the case text, not on the face");
    }
    // Mashhad's star count stays out until Sultan confirms it.
    assert.equal(document.querySelectorAll("#project-mashhad .sc-fig").length, 0);
    assert.doesNotMatch(document.querySelector("#project-mashhad").textContent, /stars|نجم/i);
    assert.equal(document.querySelectorAll("#project-autoflow .sc-fig").length, 0);
  }
  assert.match(css, /\.sc-value \{[^}]*white-space: nowrap/);
  assert.match(css, /\.sc-fig__meta \{[^}]*min-height: 44px;/, "the figure lines of a pair stay level");
});

test("a face ends on where it stops in its own words; the track, the kind, the status and the source are inside the build", () => {
  for (const locale of ["en", "ar"]) {
    const content = getContent(locale);
    const document = page(locale);
    for (const project of featured(content)) {
      const tile = document.querySelector(`#project-${project.slug}`);
      const stop = tile.querySelector(":scope > .sc-foot > .sc-stop");
      assert.equal(stop.querySelector(".sc-stop__text").textContent, project.checkpoint?.text ?? project.boundary);
      assert.ok(stop.querySelector(".li-lamp"), "on its checkpoint lamp");
      assert.ok(tile.classList.contains(`li-k-${project.checkpoint?.kind ?? "bound"}`));
      // Off the face.
      for (const selector of [".sc-track", ".sc-cp", ".sc-meta", ".sc-tile__status", ".sc-facts"]) assert.equal(onFace(tile, selector).length, 0, `${locale} ${project.slug}: ${selector} left the face`);
      assert.equal(onFace(tile, `a[href="${project.repository}"]`).length, 0, `${locale} ${project.slug}: the source link left the face`);
      // Inside the build.
      const details = tile.querySelector("details.sc-more");
      const block = details.querySelector(".sc-more__stop > .sc-cp");
      assert.equal(block.querySelectorAll(".sc-track i").length, project.flow.length);
      assert.equal(block.querySelector(".sc-cp__text").textContent, project.checkpoint?.text ?? project.boundary);
      if (project.checkpoint) {
        assert.equal(block.querySelector(".sc-track i.is-gate"), block.querySelectorAll(".sc-track i")[project.checkpoint.step - 1]);
        assert.ok(block.querySelector(".sc-cp__kind").textContent.includes(content.ui.work.showcase.kinds[project.checkpoint.kind]));
      } else {
        assert.ok(block.classList.contains("sc-cp--bound"));
      }
      assert.ok(details.querySelector(".sc-meta").textContent.includes(project.status.split(" · ")[0]), `${locale} ${project.slug}: the status is in the case text`);
      const source = details.querySelector(".sc-more__links a.sc-link");
      assert.equal(source.getAttribute("href"), project.repository);
      assert.equal(source.getAttribute("aria-label"), content.ui.work.sourceAria(project.title));
      // The way in stays on the face.
      const primary = tile.querySelector(":scope > .sc-foot .sc-link--primary");
      assert.equal(primary.getAttribute("href"), (project.primaryAction ?? { href: project.liveDemo }).href);
    }
  }
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
  // The case view says the rest around the same wall: the verifier, the repair note, and the count.
  assert.match(demos, /variant === "case" \? \(\s*<div className="sc-dm__bar">/);
  assert.match(demos, /<span className="sc-wall__count li-num">\{visuals\.verified\}<\/span>/);
  assert.match(showcase, /variant="case"/);
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

test("the grids never end on an empty gap, and the smaller builds fold behind one row that names them", () => {
  // In a pair the demo takes the height its row has to spare, so neither card ends in a hole.
  assert.match(css, /\.sc-tile:not\(\.sc-wide\) > \.sc-demo \{ flex: 1 0 auto; height: auto; min-height: 288px; \}/);
  // Five smaller builds on a desktop: three, then two that share the row.
  assert.match(css, /\.sc-lab__card:nth-child\(3n \+ 1\):nth-last-child\(2\),\s*\.sc-lab__card:nth-child\(3n \+ 2\):last-child \{ grid-column: span 3; \}/);
  assert.match(css, /\.sc-lab__card:nth-child\(3n \+ 1\):last-child \{ grid-column: 1 \/ -1; \}/, "and one left over takes the row");
  assert.match(css, /\.sc-labrow__summary \{[^}]*min-height: 88px;/);
  assert.match(css, /\.sc-labrow__plus \{[^}]*width: 44px; height: 44px;/);
  for (const locale of ["en", "ar"]) {
    const { projects, ui } = getContent(locale);
    const smaller = projects.filter((project) => project.enabled && !project.featured);
    const document = page(locale);
    const row = document.querySelector("#work details.sc-labrow");
    assert.ok(row, `${locale}: one row for the smaller builds`);
    assert.equal(row.querySelector("details"), null, "one level deep");
    assert.equal(row.parentElement.closest("details"), null);
    const summary = row.querySelector(":scope > summary");
    assert.equal(summary.querySelector("h3").textContent.trim(), `${ui.work.labTitle} · ${String(smaller.length).padStart(2, "0")}`);
    for (const project of smaller) {
      assert.ok(summary.querySelector(".sc-labrow__names").textContent.includes(project.title), `${locale}: the closed row names ${project.title}`);
      assert.ok(row.querySelector(`.sc-lab__grid > article.sc-lab__card#project-${project.slug}`), `${locale}: #project-${project.slug} opens with the row`);
    }
    assert.equal(row.querySelector(".sc-labrow__lead").textContent, ui.work.labDescription);
  }
});

test("the case view is a real modal dialog that grows out of its tile, with motion as an enhancement", () => {
  assert.match(showcase, /dialog\.showModal\(\)/, "showModal makes the rest of the page inert");
  assert.match(showcase, /document\.startViewTransition/);
  assert.match(showcase, /motionAllowed\(\) && typeof document\.startViewTransition === "function"/, "no morph with motion off");
  assert.match(showcase, /onCancel=\{\(event\) => \{\s*event\.preventDefault\(\);\s*closeCase\(\);/, "Escape closes through the same path");
  assert.match(showcase, /focusBack/, "focus goes back to the tile's button");
  assert.match(showcase, /subscribeMotion/, "turning motion off mid-demo lands it on its stop");
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
  // Outside the demos the faces use the page's type scale only.
  for (const selector of [".sc-tile__meta", ".portfolio-v3 .sc-tile__title", ".sc-tile__desc", ".sc-fig__value", ".sc-fig__label", ".sc-stop", ".sc-head__lede"]) {
    const rule = css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{[^}]*\\}`));
    assert.ok(rule, selector);
    assert.match(rule[0], /font-size: var\(--li-t\d\);/, `${selector} uses the type scale`);
  }
  // Tap targets: the case controls, the face's links and the row's plus are 44px.
  assert.match(css, /\.sc-icon \{[^}]*width: 44px; height: 44px/);
  assert.match(css, /\.sc-open \{[^}]*min-height: 44px/);
  assert.match(css, /\.sc-link \{[^}]*min-height: 44px;/);
  assert.match(css, /\.sc-fig__check \{[^}]*min-height: 44px;/);
});

test("text over a tile's accent light is never quiet ink, the wall ends on its last no, and source links say what they show", () => {
  assert.match(css, /\.sc-tile__meta \{[^}]*color: var\(--li-ink-2\);/);
  assert.match(css, /\.sc-stop \{[^}]*color: var\(--li-ink-2\);/);
  assert.match(css, /\.sc-dm--wv\.is-held \.wv-node\.is-end \{ color: var\(--li-ink-2\); \}/);
  assert.doesNotMatch(css, /\.mh-brief \{ color: var\(--li-ink-3\); \}/);
  assert.match(css, /\.sc-page__booked \{[^}]*white-space: nowrap;/, "the booked line never breaks");
  assert.match(css, /\.sc-page\.is-rejected:last-child \{/);
  for (const locale of ["en", "ar"]) {
    const document = page(locale);
    assert.equal(document.querySelectorAll("#project-accessfinish .sc-page__cal").length, 5, `${locale}: every third page is a booking week`);
    assert.ok(document.querySelector("#project-accessfinish .sc-page:last-child.is-rejected"));
    const { ui } = getContent(locale);
    const links = [...document.querySelectorAll(".sc-link:not(.sc-link--primary), .sc-case__links .li-btn--ghost")];
    assert.ok(links.length >= 6);
    for (const link of links) {
      const label = link.getAttribute("aria-label");
      if (label) assert.ok(label.startsWith(ui.work.sourceCode), `${locale}: "${label}" starts with the visible words`);
    }
  }
});
