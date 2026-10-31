import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

const { Hero } = await import("../components/hero.tsx");
const { HeroRun, RUN } = await import("../components/hero-run.tsx");
const { heroOrb } = await import("../components/hero-orb.tsx");
const { BRAND_BLOOM_EVENT } = await import("../components/living-orb.tsx");
const { MeetSultan } = await import("../components/meet-sultan.tsx");
const { getContent } = await import("../data/i18n.ts");

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
// The server HTML is what a visitor without JavaScript gets, and what paints before hydration.
const page = (locale) => new JSDOM(renderToStaticMarkup(createElement(Hero, { locale }))).window.document;

test("the headline is real text in two lines, and its gate word carries the gate line", () => {
  for (const [locale, phrase, lines] of [
    ["en", "ask", ["I build AI agents ", "that ask before they act."]],
    ["ar", "يستأذنونك", ["أبني وكلاء ذكاء اصطناعي ", "يستأذنونك قبل أن يتصرفوا."]]
  ]) {
    const { identity, ui } = getContent(locale);
    const document = page(locale);
    const heading = document.querySelector("h1#hero-title");
    assert.equal(ui.hero.highlight, phrase);
    assert.equal(heading.textContent, identity.headline, `${locale}: the whole headline is in the HTML, in order`);
    assert.deepEqual([...heading.children].map((line) => line.textContent), lines, `${locale}: split only into its two lines`);
    assert.ok([...heading.children].every((line) => line.matches("span.hero-line")));
    assert.equal(heading.querySelector("em.gate-phrase").textContent, phrase);
    // The only other spans are the gate line's two layers, which carry no text.
    const extra = [...heading.querySelectorAll("span")].filter((span) => !span.matches(".hero-line"));
    assert.ok(extra.every((span) => span.closest(".gate-line") && span.textContent === ""), `${locale}: no per-letter or per-word spans`);
    const line = heading.querySelector("em.gate-phrase > span.gate-line");
    assert.equal(line.getAttribute("aria-hidden"), "true", "the gate line is decoration; the status line says it");
    assert.ok(line.querySelector(".gate-line__dashes") && line.querySelector(".gate-line__light"));
  }
  assert.equal(page("en").querySelector("#home").dataset.gate, undefined, "the gate starts waiting");
});

test("the living orb sits under the headline as light, not content", () => {
  const document = page("ar");
  const stage = document.querySelector(".identity-hero__layout > .hero-stage");
  assert.equal(stage.getAttribute("aria-hidden"), "true");
  const orb = stage.querySelector(".li-orb.hero-orb");
  assert.equal(orb.getAttribute("aria-hidden"), "true");
  assert.equal(orb.getAttribute("role"), null);
  assert.equal(orb.dataset.state, "idle", "the server HTML starts idle; the run card moves it");
  assert.equal(document.querySelectorAll("canvas").length, 0, "the canvas is made on the visitor's screen, never in the HTML");
  const source = read("../components/hero-orb.tsx");
  assert.match(source, /useSyncExternalStore\(heroOrb\.subscribe, heroOrb\.get, serverState\)/, "it follows the card without a hydration mismatch");
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
  assert.equal(triggers.length, 1, "one round portrait in a glass pill");
  for (const trigger of triggers) assert.match(trigger.textContent, /^Hi, I’m Sultan\.(.*) Play introductory video$/);
  for (const image of document.querySelectorAll(".meet-sultan img")) {
    assert.equal(image.getAttribute("alt"), "", "the portrait sits inside a labelled button");
    assert.equal(image.getAttribute("fetchpriority"), "low", "the H1, not the portrait, stays the LCP element");
  }
  const source = read("../components/meet-sultan.tsx");
  assert.match(source, /dialog\.showModal\(\)/);
  assert.match(source, /triggerRef\.current\?\.focus\(\)/, "closing hands focus back to the button that opened it");
});

test("the hero keeps its status, who line, foot, the visitor note, and every anchor the page links to", () => {
  for (const locale of ["en", "ar"]) {
    const { identity } = getContent(locale);
    const document = page(locale);
    assert.equal(document.querySelector("section#home").getAttribute("aria-labelledby"), "hero-title");
    assert.ok(document.querySelector(".hero-status").textContent.includes(identity.openTo));
    assert.ok(document.querySelector(".hero-status .live-clock"), "the clock rides in the status line");
    assert.ok(document.querySelector(".identity-hero__foot .social-links"));
    assert.ok(document.querySelector(".identity-hero__foot .meet-sultan"));
    assert.ok(document.querySelector(".identity-hero__actions .visitor-note"));
    const who = document.querySelector(".hero-who");
    assert.equal(who.querySelector(".hero-who__name").textContent, identity.name);
    assert.equal(who.querySelector(".hero-who__role").textContent, identity.role, `${locale}: the role reads whole`);
    const fullStack = who.querySelector("bdi.nowrap");
    assert.equal(fullStack.textContent, "Full-Stack", `${locale}: "Full-Stack" never breaks at its hyphen`);
    assert.equal(fullStack.getAttribute("dir"), "ltr");
    assert.equal(document.querySelector(".identity-hero__more .identity-hero__summary").textContent, identity.summary);
  }
});

test("the source order is the reading order, so focus moves the way the screen reads", () => {
  const layout = page("en").querySelector(".identity-hero__layout");
  assert.deepEqual([...layout.children].map((child) => child.className.split(" ")[0]), [
    "identity-hero__intro", "hero-stage", "hero-run", "identity-hero__actions", "identity-hero__more"
  ]);
  assert.deepEqual([...page("en").querySelector(".identity-hero__more").children].map((child) => child.className.split(" ")[0]), [
    "identity-hero__summary", "spec-strip", "identity-hero__foot"
  ]);
  const css = read("../app/hero.css");
  assert.doesNotMatch(css, /grid-template-areas|[;{\s]order\s*:|-reverse/, "no visual reordering that focus wouldn't follow");
  assert.match(read("../app/layout.tsx"), /import "\.\/living\.css";\r?\nimport "\.\/hero\.css";/, "hero.css loads after the design system");
});

test("the portrait isn't preloaded at high priority, so the H1 stays the LCP element", () => {
  assert.doesNotMatch(read("../app/layout.tsx"), /sultan-introduction-poster/);
});

// ---------- In the browser ----------

async function mountDom(markup, { reduced = true } = {}) {
  const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`, { url: "https://portfolio.test/" });
  const previous = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  previous.set("IntersectionObserver", Object.getOwnPropertyDescriptor(globalThis, "IntersectionObserver"));
  globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
  dom.window.matchMedia = () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} });
  const scrolled = [];
  dom.window.HTMLElement.prototype.scrollIntoView = function (options) { scrolled.push([this.id, options.behavior]); };
  const blooms = [];
  dom.window.addEventListener(BRAND_BLOOM_EVENT, (event) => blooms.push(event.type));
  return {
    dom,
    scrolled,
    blooms,
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
    assert.equal(heroOrb.get(), "approved", "the orb blooms");
    assert.equal(page.blooms.length, 1, "the navigation mark blooms with it");
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
    assert.equal(heroOrb.get(), "paused", "the orb dims while it holds");
    assert.equal(page.blooms.length, 0);
    await page.click(choices.querySelector(".hero-run__again"));
    assert.equal(hero.dataset.gate, undefined);
    assert.equal(heroOrb.get(), "listening", "asked again, it listens");
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

test("with motion on, the bloom lands before the page moves", async () => {
  const page = await mountDom(stage, { reduced: false });
  try {
    await page.render(createElement(HeroRun, { locale: "en" }), page.document.getElementById("run"));
    await page.click(page.document.querySelector('a.hero-run__approve[href="#project-accessfinish"]'));
    assert.equal(page.document.getElementById("home").dataset.gate, "approved");
    assert.deepEqual(page.scrolled, [], "the scroll waits for the bloom");
    await act(() => new Promise((resolve) => page.dom.window.setTimeout(resolve, RUN.carry + 50)));
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
  const css = read("../app/hero.css");
  assert.match(css, /@media \(max-width: 759px\) \{[\s\S]*?\.hero-run__steps\[data-folded\] \.run-step--read \{ display: none; \}/);
  assert.match(css, /@media \(scripting: none\) \{\s*\.hero-run__steps\[data-folded\] \.run-step--read \{ display: grid; \}\s*\.hero-run__more \{ display: none; \}/);
});

test("the entrance plays once per load: a key finishes it, and the orb keeps time with the run", async () => {
  const moving = await mountDom(stage, { reduced: false });
  try {
    const root = moving.document.documentElement;
    root.dataset.intro = "play";
    await moving.render(createElement(HeroRun, { locale: "en" }), moving.document.getElementById("run"));
    const hero = moving.document.getElementById("home");
    assert.equal(root.dataset.intro, "play", "with motion on, the entrance plays");
    assert.equal(heroOrb.get(), "idle", "the orb emerges idle, then thinks while the steps scan");
    await act(async () => moving.dom.window.dispatchEvent(new moving.dom.window.KeyboardEvent("keydown", { key: "Tab" })));
    assert.equal(root.dataset.intro, "done", "a key finishes the entrance at once, so focus never lands on something still arriving");
    assert.equal(heroOrb.get(), "listening", "and the card is asking");
    assert.equal(hero.dataset.asking, "");
  } finally { await moving.cleanup(); }

  const welcome = await mountDom(stage, { reduced: false });
  try {
    const root = welcome.document.documentElement;
    root.dataset.intro = "play";
    root.dataset.welcome = "show";
    await welcome.render(createElement(HeroRun, { locale: "en" }), welcome.document.getElementById("run"));
    await act(async () => welcome.dom.window.dispatchEvent(new welcome.dom.window.KeyboardEvent("keydown", { key: "Enter" })));
    assert.equal(root.dataset.intro, "play", "behind the welcome screen the entrance waits; a key there belongs to the screen");
    await act(async () => { delete root.dataset.welcome; await new Promise((resolve) => welcome.dom.window.setTimeout(resolve, 0)); });
    await act(async () => welcome.dom.window.dispatchEvent(new welcome.dom.window.Event("pointerdown")));
    assert.equal(root.dataset.intro, "done", "it plays once the screen closes, and can be skipped from then on");
  } finally { await welcome.cleanup(); }

  const still = await mountDom(stage, { reduced: true });
  try {
    await still.render(createElement(HeroRun, { locale: "en" }), still.document.getElementById("run"));
    assert.equal(still.document.documentElement.dataset.intro, undefined, "with motion off there is no entrance");
    assert.equal(heroOrb.get(), "listening", "the orb rests listening, since the card is waiting");
    assert.equal(still.document.getElementById("home").dataset.asking, undefined, "and nothing beckons");
  } finally { await still.cleanup(); }

  const css = read("../app/hero.css");
  for (const rule of [
    /html\[data-intro="play"\]:not\(\[data-motion="off"\]\) \.hero-stage \.li-orb \{ animation: hero-orb-in /,
    /html\[data-intro="play"\]:not\(\[data-motion="off"\]\) \.hero-run \{ animation: hero-rise /,
    /html\[data-intro="play"\]:not\(\[data-motion="off"\]\) \.hero-line \{[\s\S]*?animation: hero-line-in /,
    /html\[data-intro="play"\]:not\(\[data-motion="off"\]\) \.gate-line \{ animation: gate-draw /,
    /html\[data-welcome="show"\] \.identity-hero \*::after \{ animation-play-state: paused !important; \}/
  ]) assert.match(css, rule);
  // The CSS and the orb share one clock: the steps scan from RUN.scan, one every RUN.step.
  assert.ok(css.includes(`--at: calc(${RUN.scan / 1000}s + var(--i) * ${RUN.step / 1000}s)`));
  assert.equal(RUN.ask, RUN.scan + 3 * RUN.step, "the question comes when the last step is done");
});

test("elements arrive first, then the text: the card's question waits for the headline", () => {
  const css = read("../app/hero.css");
  // The delay of the first animation in the selector's entrance rule.
  const delay = (selector) => {
    const at = css.search(new RegExp(`html\\[data-intro="play"\\]:not\\(\\[data-motion="off"\\]\\) ${selector} \\{`));
    assert.ok(at >= 0, `${selector} has an entrance`);
    const rule = css.slice(at, css.indexOf("}", at)).match(/animation: [\w-]+ [\d.]+s [^;,]*?([\d.]+)s both/);
    return Number(rule[1]);
  };
  const lineTwo = Number(css.match(/\.hero-line--2 \{ animation-delay: ([\d.]+)s/)[1]);
  assert.ok(delay("\\.hero-run") < delay("\\.hero-line") && delay("\\.hero-line") < lineTwo, "the glass card rises before the headline arrives");
  for (const text of ["\\.hero-run__gate", "\\.identity-hero__actions", "\\.hero-who"]) {
    assert.ok(delay(text) > lineTwo, `${text} follows the headline`);
  }
  assert.ok(delay("\\.identity-hero__more") <= 1.6, "and everything has started by about 1.6 s");
});

test("the headline keeps its marks in the light, and two whole lines on a phone", () => {
  const css = read("../app/hero.css");
  // During the entrance a sweep of light fills the letters (background-clip: text); each line's box reaches
  // past the dots under a final ي, so none of them goes missing, and flex keeps the margins from collapsing.
  assert.match(css, /\.hero-line \{ display: block; padding-block: 0\.12em 0\.32em; margin-block: -0\.12em -0\.32em; \}/);
  assert.match(css, /\.portfolio-v3 \.identity-hero \.hero-title \{[^}]*display: flex;\s*flex-direction: column;/);
  // The longer line is about 10.6em in Arabic: the phone size keeps it on one row at any width.
  assert.match(css, /@media \(max-width: 759px\) \{[\s\S]*?\.hero-title \{[^}]*font-size: min\(calc\(\(100vw - 40px\) \/ 10\.9\), 2\.75rem\);/);
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
    const frame = page.document.querySelector("button.meet-row");
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
