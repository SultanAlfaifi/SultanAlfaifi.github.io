import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

const { Hero } = await import("../components/hero.tsx");
const { HeroRun } = await import("../components/hero-run.tsx");
const { MeetSultan } = await import("../components/meet-sultan.tsx");
const { getContent } = await import("../data/i18n.ts");

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
// The server HTML is what a visitor without JavaScript gets, and what paints before hydration.
const page = (locale) => new JSDOM(renderToStaticMarkup(createElement(Hero, { locale }))).window.document;

test("the headline is real text, and its gate phrase carries the dashed underline", () => {
  for (const [locale, phrase] of [["en", "check with you"], ["ar", "يستأذنونك"]]) {
    const { identity, ui } = getContent(locale);
    const document = page(locale);
    const heading = document.querySelector("h1#hero-title");
    assert.equal(ui.hero.highlight, phrase);
    assert.equal(heading.textContent, identity.headline, `${locale}: the whole headline is in the HTML, unsplit`);
    assert.equal(heading.querySelector("em.gate-phrase").textContent, phrase);
    assert.equal(heading.querySelectorAll("span").length, 0, `${locale}: no per-letter or per-word spans`);
    const mark = heading.querySelector("em.gate-phrase > svg.gate-mark");
    assert.equal(mark.getAttribute("aria-hidden"), "true", "the gate tick is decoration; the status line says it");
  }
  assert.equal(page("en").querySelector("#home").dataset.gate, undefined, "the gate starts waiting");
});

test("the run card ships all three visitor versions, built from the data, with no shared ids", () => {
  const { experience, identity, helpPaths } = getContent("en");
  const document = page("en");
  const card = document.querySelector("section.hero-run");
  assert.equal(card.getAttribute("aria-labelledby"), "hero-run-title");
  assert.equal(document.getElementById("hero-run-title").textContent, "A short agent run");
  assert.match(card.textContent, /Replay · from this page’s data · no AI call/);
  assert.equal(card.querySelectorAll("ol.hero-run__steps > li").length, 3, "the whole transcript is in the DOM at once");

  const approve = [...card.querySelectorAll("a.hero-run__approve")];
  assert.deepEqual(approve.map((link) => link.getAttribute("href")), ["#project-accessfinish", "#cv", "#contact"]);
  assert.deepEqual(approve.map((link) => [link.dataset.visitorHide, link.dataset.visitorOnly]), [["hiring collaborate", undefined], [undefined, "hiring"], [undefined, "collaborate"]]);
  for (const link of approve) {
    assert.equal(link.textContent, "Approve");
    assert.ok(link.getAttribute("aria-label").startsWith("Approve"), "the accessible name starts with the visible label");
  }
  assert.equal(approve[0].getAttribute("aria-label"), "Approve: open the AccessFinish project");

  const result = card.querySelector(".run-step--result [data-visitor-hide]").textContent;
  assert.equal(result, "Fifteen times it reached a “booked” page with the wrong day saved, and the verifier rejected every one.");
  assert.match(card.querySelector(".run-step--read [data-visitor-hide]").textContent, /projects\.read\(\)\s+6 featured · 5 stop to check/);
  assert.match(card.querySelector(".run-step--read [data-visitor-only=hiring]").textContent, new RegExp(experience[0].organization));
  assert.equal(card.querySelector(".run-step--result [data-visitor-only=hiring]").textContent, experience[0].description);
  assert.match(card.querySelector(".run-step--read [data-visitor-only=collaborate]").textContent, new RegExp(identity.openTo));
  assert.equal(card.querySelector(".run-step--result [data-visitor-only=collaborate]").textContent, helpPaths.find((path) => path.id === "product").need, "collaborators read the AI-product path, picked by id");
  assert.equal(card.querySelector(".run-step--read bdi").getAttribute("dir"), "ltr", "tool names stay left to right");

  const status = card.querySelectorAll('[role="status"]');
  assert.equal(status.length, 1);
  assert.equal(status[0].textContent, "", "the status line is empty until the visitor acts");
  assert.equal(card.querySelector(".hero-run__hold"), null, "Not now needs a script, so it only renders once hydrated");
  // The phone fold is in the server HTML, so the card doesn't change height when the script arrives.
  assert.equal(card.querySelector(".hero-run__steps").hasAttribute("data-folded"), true);
  assert.equal(card.querySelector(".hero-run__more").getAttribute("aria-expanded"), "false");

  const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
  assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids}`);
});

test("the Arabic card speaks the site's own voice and keeps Latin names left to right", () => {
  const { ui } = getContent("ar");
  const card = page("ar").querySelector("section.hero-run");
  assert.equal(card.querySelector("h2").textContent, "تشغيل قصير للوكيل");
  assert.equal(card.querySelector(".hero-run__ask [data-visitor-hide]").innerHTML, 'أفتح لك <bdi dir="ltr">AccessFinish</bdi>؟ بتنتقل الصفحة لمكانه.');
  assert.equal(card.querySelector(".run-step--result [data-visitor-hide]").textContent, "وصل 15 مرة إلى صفحة «تم الحجز» مع أن اليوم المحفوظ خاطئ، ورفضها المدقّق كلها.");
  assert.match(card.querySelector(".run-step--read [data-visitor-hide]").textContent, /المشاريع البارزة: 6 · تتوقف للتحقق: 5/, "no plural that only fits 3 to 10");
  assert.equal(ui.hero.run.state.held, "الوكيل · متوقّف", "holding reads differently from waiting");
  assert.notEqual(ui.hero.run.state.held, ui.hero.run.state.waiting);
  assert.equal(ui.hero.run.notNow, "مو الحين");
  assert.equal(ui.hero.run.approve, "موافق");
  assert.equal(card.querySelector("a.hero-run__approve").getAttribute("aria-label"), "موافق: افتح مشروع AccessFinish");
});

test("Approve is a real link to a real place, so it works without JavaScript", () => {
  const projects = read("../components/projects-section.tsx");
  assert.ok(projects.includes("id={`project-${project.slug}`}"));
  assert.ok(getContent("en").projects.some((project) => project.slug === "accessfinish" && project.featured && project.enabled));
  assert.match(read("../components/cv-section.tsx"), /id="cv"/);
  assert.match(read("../components/contact-section.tsx"), /id="contact"/);
  for (const link of page("en").querySelectorAll("a.hero-run__approve")) {
    assert.equal(link.getAttribute("role"), null);
    assert.equal(link.hasAttribute("onclick"), false, "no inline script: the href does the work");
  }
});

test("the spec strip is four static links, each value read from the data", () => {
  const expected = {
    en: [["COOP intern", "#experience"], ["About 1,600", "#project-masari"], ["160+", "https://github.com/SultanAlfaifi/mustakshif/releases/latest"], ["2027", "#about"]],
    ar: [["متدرّب تعاوني", "#experience"], ["نحو 1,600", "#project-masari"], ["+160", "https://github.com/SultanAlfaifi/mustakshif/releases/latest"], ["2027", "#about"]]
  };
  for (const [locale, cells] of Object.entries(expected)) {
    const strip = page(locale).querySelector("ul.spec-strip");
    const links = [...strip.querySelectorAll("li > a.spec-cell")];
    assert.deepEqual(links.map((link) => [link.querySelector(".spec-cell__value").textContent, link.getAttribute("href")]), cells);
    for (const link of links) assert.equal(link.querySelector(".spec-cell__value").hasAttribute("dir"), false, "values follow the page direction, so digits sit at the same edge as their labels");
    assert.equal(links[2].getAttribute("target"), "_blank");
    assert.equal(links[2].getAttribute("rel"), "noreferrer noopener");
    assert.equal(strip.querySelectorAll('[aria-hidden="true"]').length, 1, "no duplicated, hidden copy of the strip for a loop");
  }
  assert.match(page("en").querySelector(".spec-strip").textContent, /My own count, not audited/, "Masari's count says whose count it is");
  assert.doesNotMatch(page("en").body.innerHTML, /hero-ticker|achievement/);
});

test("the film waits in a dialog: no video in the page until the visitor asks", () => {
  const document = page("en");
  assert.equal(document.querySelectorAll("video").length, 0, "the MP4 is not even referenced before the dialog opens");
  const dialog = document.querySelector("dialog.film-dialog");
  assert.equal(dialog.getAttribute("aria-labelledby"), "film-dialog-title");
  assert.equal(dialog.hasAttribute("open"), false);
  const triggers = [...document.querySelectorAll("button.maker-frame, button.meet-row")];
  assert.equal(triggers.length, 2);
  for (const trigger of triggers) assert.match(trigger.textContent, /^Hi, I’m Sultan\.(.*) Play introductory video$/);
  for (const image of document.querySelectorAll(".meet-sultan img")) {
    assert.equal(image.getAttribute("alt"), "", "the portrait sits inside a labelled button");
    assert.equal(image.getAttribute("fetchpriority"), "low", "the H1, not the portrait, stays the LCP element");
  }
  const source = read("../components/meet-sultan.tsx");
  assert.match(source, /dialog\.showModal\(\)/);
  assert.match(source, /triggerRef\.current\?\.focus\(\)/, "closing hands focus back to the button that opened it");
});

test("the hero keeps its foot line, the visitor note, and every anchor the page links to", () => {
  const document = page("en");
  assert.equal(document.querySelector("section#home").getAttribute("aria-labelledby"), "hero-title");
  assert.ok(document.querySelector(".identity-hero__foot .live-clock"));
  assert.ok(document.querySelector(".identity-hero__foot .social-links"));
  assert.ok(document.querySelector(".identity-hero__actions .visitor-note"));
  assert.equal(document.querySelector('.identity-hero__name [lang="ar"]').getAttribute("dir"), "rtl");
  assert.equal(page("ar").querySelector('.identity-hero__name [lang="en"]').getAttribute("dir"), "ltr");
  assert.equal(document.querySelectorAll("canvas").length, 0, "no animation loop in the first viewport");
});

test("the source order is the phone's order, so focus moves the way the screen reads", () => {
  const layout = page("en").querySelector(".identity-hero__layout");
  assert.deepEqual([...layout.children].map((child) => child.className.split(" ")[0]), [
    "identity-hero__intro", "hero-run", "identity-hero__body", "meet-sultan", "spec-strip", "identity-hero__foot"
  ]);
  const css = read("../app/signature.css");
  assert.doesNotMatch(css, /grid-template-areas|identity-hero__stage/, "no visual reordering that focus wouldn't follow");
});

test("the portrait isn't preloaded at high priority, so the H1 stays the LCP element", () => {
  assert.doesNotMatch(read("../app/layout.tsx"), /sultan-introduction-poster/);
});

// ---------- In the browser ----------

async function mountDom(markup, { reduced = true } = {}) {
  const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`, { url: "https://portfolio.test/" });
  const previous = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  previous.set("IntersectionObserver", Object.getOwnPropertyDescriptor(globalThis, "IntersectionObserver"));
  globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
  dom.window.matchMedia = () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} });
  const scrolled = [];
  dom.window.HTMLElement.prototype.scrollIntoView = function (options) { scrolled.push([this.id, options.behavior]); };
  return {
    dom,
    scrolled,
    document: dom.window.document,
    click: (element) => act(async () => element.click()),
    async render(element, container) {
      const root = createRoot(container);
      await act(async () => root.render(element));
      this.root = root;
    },
    async cleanup() {
      await act(async () => this.root?.unmount());
      dom.window.close();
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  };
}

const stage = `
  <section id="home" class="identity-hero"><div id="run"></div></section>
  <article id="project-accessfinish"><h3>AccessFinish</h3></article>
  <section id="cv"><h2>CV</h2></section>
  <section id="contact"><h2 id="contact-title">Contact</h2></section>`;

test("Approve opens the flagship, marks the gate approved, and moves focus to its heading", async () => {
  const page = await mountDom(stage);
  try {
    await page.render(createElement(HeroRun, { locale: "en" }), page.document.getElementById("run"));
    const hero = page.document.getElementById("home");
    const approve = page.document.querySelector('a.hero-run__approve[href="#project-accessfinish"]');
    await page.click(approve);
    assert.equal(page.dom.window.location.hash, "", "the script handles it; without one the href would");
    assert.equal(page.document.querySelector('[role="status"]').textContent, "Done. Opened AccessFinish, approved by you.");
    assert.equal(hero.dataset.gate, "approved", "the headline's gate turns solid");
    assert.equal(page.document.querySelector(".hero-run").dataset.gate, "approved");
    assert.deepEqual(page.scrolled, [["project-accessfinish", "auto"]], "reduced motion scrolls without smoothing");
    const heading = page.document.querySelector("#project-accessfinish h3");
    assert.equal(page.document.activeElement, heading);
    assert.equal(heading.getAttribute("tabindex"), "-1");
    assert.ok(page.document.getElementById("project-accessfinish").classList.contains("agent-highlight"));
    assert.equal(page.document.querySelector(".hero-run__hold"), null, "once approved, Not now would claim nothing happened");
  } finally { await page.cleanup(); }
});

test("Not now does nothing, offers plain ways in, and only the visitor asks again", async () => {
  const page = await mountDom(stage);
  try {
    await page.render(createElement(HeroRun, { locale: "en" }), page.document.getElementById("run"));
    const hero = page.document.getElementById("home");
    await page.click(page.document.querySelector(".hero-run__hold"));
    assert.equal(page.document.querySelector('[role="status"]').textContent, "Okay. Nothing happened. I’ll wait.");
    assert.equal(hero.dataset.gate, "held", "the underline stays dashed and dims");
    assert.deepEqual(page.scrolled, [], "nothing moved");
    const choices = page.document.querySelector(".hero-run__choices");
    assert.equal(page.document.activeElement, choices, "focus lands on what replaced the button");
    assert.deepEqual([...choices.querySelectorAll("a")].map((link) => [link.textContent, link.getAttribute("href")]), [
      ["Open my CV", "#cv"],
      ["See the 6 featured projects", "#work"],
      ["Open the strongest proof", "#project-accessfinish"]
    ]);
    assert.equal(page.document.querySelectorAll("a.hero-run__approve").length, 0, "the card doesn't keep asking");
    await page.click(choices.querySelector(".hero-run__again"));
    assert.equal(hero.dataset.gate, undefined);
    assert.equal(page.document.querySelector('[role="status"]').textContent, "");
    assert.equal(page.document.activeElement, page.document.querySelector("a.hero-run__approve"));
  } finally { await page.cleanup(); }
});

test("hiring and collaborating visitors approve their own next step", async () => {
  const page = await mountDom(stage);
  try {
    await page.render(createElement(HeroRun, { locale: "en" }), page.document.getElementById("run"));
    await page.click(page.document.querySelector('a.hero-run__approve[href="#cv"]'));
    assert.equal(page.document.querySelector('[role="status"]').textContent, "Done. Opened the CV section, approved by you.");
    assert.equal(page.document.activeElement, page.document.querySelector("#cv h2"));
    await page.click(page.document.querySelector('a.hero-run__approve[href="#contact"]'));
    assert.equal(page.document.activeElement, page.document.getElementById("contact-title"));
    assert.deepEqual(page.scrolled.map(([id]) => id), ["cv", "contact"]);
  } finally { await page.cleanup(); }
});

test("with motion on, the gate tick lands before the page moves", async () => {
  const page = await mountDom(stage, { reduced: false });
  try {
    await page.render(createElement(HeroRun, { locale: "en" }), page.document.getElementById("run"));
    await page.click(page.document.querySelector('a.hero-run__approve[href="#project-accessfinish"]'));
    assert.equal(page.document.getElementById("home").dataset.gate, "approved");
    assert.deepEqual(page.scrolled, [], "the scroll waits for the tick");
    await act(() => new Promise((resolve) => page.dom.window.setTimeout(resolve, 650)));
    assert.deepEqual(page.scrolled, [["project-accessfinish", "smooth"]]);
  } finally { await page.cleanup(); }
});

test("on a phone the read step folds behind a disclosure, and unfolds without a script", async () => {
  const page = await mountDom(stage);
  try {
    await page.render(createElement(HeroRun, { locale: "en" }), page.document.getElementById("run"));
    const steps = page.document.querySelector(".hero-run__steps");
    const more = page.document.querySelector(".hero-run__more");
    assert.equal(steps.hasAttribute("data-folded"), true);
    assert.equal(more.getAttribute("aria-expanded"), "false");
    assert.equal(more.getAttribute("aria-controls"), "hero-run-read");
    assert.ok(page.document.getElementById("hero-run-read"));
    await page.click(more);
    assert.equal(more.getAttribute("aria-expanded"), "true");
    assert.equal(steps.hasAttribute("data-folded"), false);
  } finally { await page.cleanup(); }
  const css = read("../app/signature.css");
  assert.match(css, /@media \(max-width: 759px\) \{[\s\S]*?\.hero-run__steps\[data-folded\] \.run-step--read \{ display: none; \}/);
  assert.match(css, /@media \(scripting: none\) \{\s*\.hero-run__steps\[data-folded\] \.run-step--read \{ display: grid; \}\s*\.hero-run__more \{ display: none; \}/);
});

test("the entrance plays once: a motion change or reduced motion marks it played, so it never replays", async () => {
  const { MOTION_EVENT } = await import("../components/motion-preference.ts");
  const moving = await mountDom(stage, { reduced: false });
  try {
    await moving.render(createElement(HeroRun, { locale: "en" }), moving.document.getElementById("run"));
    const hero = moving.document.getElementById("home");
    assert.equal(hero.hasAttribute("data-played"), false, "with motion on, the entrance plays");
    await act(async () => moving.dom.window.dispatchEvent(new moving.dom.window.Event(MOTION_EVENT)));
    assert.equal(hero.hasAttribute("data-played"), true, "turning motion off and on again doesn't replay it");
  } finally { await moving.cleanup(); }
  const still = await mountDom(stage, { reduced: true });
  try {
    await still.render(createElement(HeroRun, { locale: "en" }), still.document.getElementById("run"));
    assert.equal(still.document.getElementById("home").hasAttribute("data-played"), true);
  } finally { await still.cleanup(); }
  const css = read("../app/signature.css");
  for (const rule of [/\.identity-hero:not\(\[data-played\]\) \.run-step \{/, /\.identity-hero:not\(\[data-played\]\) \.hero-run__gate \{/, /\.identity-hero:not\(\[data-played\]\) :is\(\.hero-status__pulse, \.live-clock__dot\)::after \{/]) {
    assert.match(css, rule);
  }
});

test("the film dialog mounts the video only while open and gives focus back on close", async () => {
  const page = await mountDom('<div id="meet"></div>');
  try {
    const { HTMLDialogElement } = page.dom.window;
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new page.dom.window.Event("close")); };
    page.dom.window.HTMLMediaElement.prototype.pause = () => {};
    await page.render(createElement(MeetSultan, { locale: "en" }), page.document.getElementById("meet"));
    assert.equal(page.document.querySelectorAll("video").length, 0);
    const frame = page.document.querySelector("button.maker-frame");
    frame.focus();
    await page.click(frame);
    const dialog = page.document.querySelector("dialog.film-dialog");
    assert.equal(dialog.hasAttribute("open"), true);
    assert.equal(dialog.querySelectorAll("video").length, 1, "opening the dialog is the request that fetches the film");
    await page.click(dialog.querySelector(".film-dialog__close"));
    assert.equal(dialog.hasAttribute("open"), false);
    assert.equal(page.document.querySelectorAll("video").length, 0);
    assert.equal(page.document.activeElement, frame);
  } finally { await page.cleanup(); }
});
