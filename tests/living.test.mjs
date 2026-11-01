import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { LIVING_ORB_STATES, LIVING_PALETTES, MAX_LIVE_WEBGL, mountLivingOrb } from "../lib/living-orb.ts";
import { BrandOrb, LivingOrb } from "../components/living-orb.tsx";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

// A DOM with a fake Canvas 2D context and controllable observers, frames and motion preference.
function setup({ reduce = false, motionOff = false } = {}) {
  // pretendToBeVisual: a visible page, so the engine is allowed to run.
  const dom = new JSDOM('<div id="root"></div>', { url: "https://portfolio.test", pretendToBeVisual: true });
  const win = dom.window;
  const frames = new Map();
  let frameId = 0;
  const draws = { count: 0 };
  const intersections = [];
  const motion = { matches: reduce, addEventListener() {}, removeEventListener() {} };
  const ctx = new Proxy({}, {
    get: (_, key) => {
      if (key === "clearRect") return () => { draws.count++; };
      if (key === "createRadialGradient") return () => ({ addColorStop() {} });
      return () => {};
    },
    set: () => true
  });
  win.HTMLCanvasElement.prototype.getContext = function (kind) { return kind === "2d" ? ctx : null; };
  win.matchMedia = () => motion;
  if (motionOff) win.document.documentElement.dataset.motion = "off";
  const IO = class {
    constructor(callback) { this.callback = callback; }
    observe(element) { intersections.push({ element, callback: this.callback }); }
    disconnect() {}
  };
  const globals = {
    window: win, document: win.document, Node: win.Node, HTMLElement: win.HTMLElement, IntersectionObserver: IO,
    ResizeObserver: class { observe() {} disconnect() {} }, IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: (cb) => { frames.set(++frameId, cb); return frameId; },
    cancelAnimationFrame: (id) => { frames.delete(id); }
  };
  const previous = new Map();
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  win.IntersectionObserver = IO;
  win.requestAnimationFrame = globals.requestAnimationFrame;
  win.cancelAnimationFrame = globals.cancelAnimationFrame;
  const restore = () => {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  };
  const intersect = (element, isIntersecting = true) => {
    for (const entry of intersections.filter((item) => item.element === element || element.contains(item.element) || item.element.contains(element))) {
      entry.callback([{ isIntersecting, target: entry.element }]);
    }
  };
  return { dom, win, frames, draws, intersect, restore };
}

test("the engine exposes the living states, the aurora palette, and a cap on live WebGL orbs", () => {
  assert.deepEqual(LIVING_ORB_STATES, ["idle", "listening", "thinking", "speaking", "approved", "paused"]);
  assert.deepEqual([...LIVING_PALETTES.aurora], ["#FFB46A", "#FF5C8D", "#8F6BFF", "#47C8F5"]);
  assert.equal(MAX_LIVE_WEBGL, 3);
});

test("with motion off the engine paints one still frame and asks for no animation frames", () => {
  const env = setup();
  try {
    const canvas = env.win.document.createElement("canvas");
    env.win.document.body.append(canvas);
    const orb = mountLivingOrb(canvas, { still: true });
    assert.equal(orb.renderer, "2d", "without WebGL the Canvas 2D fallback draws");
    assert.equal(env.draws.count, 1, "one composed frame");
    assert.equal(env.frames.size, 0, "nothing keeps running");
    orb.setState("thinking");
    assert.equal(env.frames.size, 0, "a new state repaints the still frame, it does not start a loop");
    orb.setStill(false);
    assert.equal(env.frames.size, 1, "motion back on starts the loop");
    orb.destroy();
    assert.equal(env.frames.size, 0, "destroy cancels the loop");
  } finally {
    env.restore();
  }
});

test("<LivingOrb> mounts near the viewport, follows the site's Motion switch, and cleans up", async () => {
  const env = setup({ motionOff: true });
  try {
    const root = createRoot(env.win.document.getElementById("root"));
    await act(async () => root.render(createElement(LivingOrb, { state: "listening", size: 240 })));
    const wrap = env.win.document.querySelector(".li-orb");
    assert.ok(wrap, "the orb renders its wrapper");
    assert.equal(wrap.getAttribute("aria-hidden"), "true", "decorative unless labelled");
    assert.equal(wrap.dataset.state, "listening");
    assert.equal(wrap.style.getPropertyValue("--li-orb-size"), "240px");
    assert.equal(wrap.querySelector("canvas"), null, "no canvas and no context before it is near the viewport");
    await act(async () => env.intersect(wrap));
    assert.ok(wrap.querySelector("canvas"), "a canvas once it comes near");
    assert.equal(wrap.dataset.ready, "", "the CSS stand-in steps aside");
    assert.equal(env.frames.size, 0, "html[data-motion=off] gives a still frame, no loop");
    await act(async () => root.unmount());
    assert.equal(wrap.querySelector("canvas"), null, "unmount destroys the engine and removes its canvas");
  } finally {
    env.restore();
  }
});

test("the brand mark is a living orb with the static mark as its poster", async () => {
  const env = setup();
  try {
    const root = createRoot(env.win.document.getElementById("root"));
    await act(async () => root.render(createElement(BrandOrb)));
    const wrap = env.win.document.querySelector(".li-brand-orb");
    assert.ok(wrap.querySelector('img[src*="/brand/sultan-alfaifi-mark.svg"]'), "the static mark shows until the first frame");
    await act(async () => root.unmount());
  } finally {
    env.restore();
  }
});

test("every place that showed the S monogram shows the orb mark", () => {
  const mark = read("../public/brand/sultan-alfaifi-mark.svg");
  assert.match(mark, /The living orb, held still/);
  assert.doesNotMatch(mark, /M16 20h20v7H23/, "the S path is gone");
  assert.equal(read("../app/icon.svg"), mark, "the browser icon is the same mark");
  const manifest = read("../app/manifest.ts");
  assert.match(manifest, /src: "\/brand\/sultan-alfaifi-mark\.svg"/);
  assert.match(manifest, /background_color: "#030304"/);
  const navbar = read("../components/navbar.tsx");
  assert.match(navbar, /<BrandOrb \/>/);
  assert.match(read("../components/welcome-screen.tsx"), /\/brand\/sultan-alfaifi-mark\.svg/);
  assert.match(read("../app/agent.css"), /\.agent-orb \{[\s\S]*?url\("\/brand\/sultan-alfaifi-mark\.svg"\)/, "the assistant's face is the same orb");
});

test("the living design system defines its tokens, glass, checkpoints and dark bands", () => {
  const css = read("../app/living.css");
  for (const token of ["--li-bg", "--li-ink", "--li-ink-2", "--li-ink-3", "--li-on-light", "--li-line", "--li-glass", "--li-glass-fill", "--li-glass-raised",
    "--li-highlight", "--li-r", "--li-r-s", "--li-apricot", "--li-rose", "--li-iris", "--li-glacier", "--li-aurora", "--li-focus",
    "--li-k-asks", "--li-k-verifies", "--li-k-holds", "--li-k-bound"]) {
    assert.match(css, new RegExp(`${token}:`), `${token} is defined`);
  }
  for (const rule of [".li-glass", ".li-glass--raised", ".li-glass--light", ".li-glass.is-lit", ".li-btn--primary", ".li-eyebrow", ".li-orb", ".li-brand-orb"]) {
    assert.ok(css.includes(rule), `${rule} exists`);
  }
  assert.match(css, /html\[data-motion="off"\] \.li-glass--light::before \{ display: none; \}/, "the pointer light stops with the Motion switch");
  assert.match(css, /:where\(\s*\.nav,[\s\S]*?\.work-section[\s\S]*?\.runtime-section[\s\S]*?\) \{\s*--ink: var\(--li-bg\);/, "former dark bands keep their meanings on the new black");
  assert.match(read("../app/layout.tsx"), /import "\.\/living\.css";\s*\n\s*\/\/|import "\.\/living\.css";/);
  assert.match(read("../app/layout.tsx"), /themeColor: "#030304"/);
  assert.match(read("../docs/living-design.md"), /<LivingOrb/);
});

test("the rebuilt sections and the older ones read as one product", () => {
  const living = read("../app/living.css");
  const showcase = read("../app/showcase.css");
  const ai = read("../app/ai.css");
  for (const token of ["--li-display", "--li-space-feature", "--li-seam"]) assert.match(living, new RegExp(`${token}:`), `${token} is defined`);
  assert.doesNotMatch(living, /--li-h2:/, "one headline scale: no second size beside t1");
  // Every chapter headline is t1 at 600, 1.16 (1.2 in Arabic), plain ink: work and AI included.
  const chapters = read("../app/chapters.css");
  const cv = read("../app/cv.css");
  for (const [name, css, rule] of [
    ["work", showcase, /\.portfolio-v3 \.sc-head__h2 \{[\s\S]*?\}/],
    ["AI", ai, /\.ai-title \{[\s\S]*?\}/],
    ["about and recognition", chapters, /:is\(#about, #achievements\) \.section-header h2 \{[\s\S]*?\}/],
    ["CV", cv, /\.cv-section \.cv-title \{[\s\S]*?\}/],
    ["contact", chapters, /\.finale \.finale__title \{[\s\S]*?\}/]
  ]) {
    const body = css.match(rule)[0];
    assert.match(body, /font-size: var\(--li-t1\);/, `${name}: t1`);
    assert.match(body, /font-weight: 600;/, `${name}: 600`);
    assert.match(body, /line-height: 1\.16;/, `${name}: 1.16`);
    assert.doesNotMatch(body, /background-clip: text/, `${name}: the headline is plain ink, like the hero's`);
  }
  assert.match(showcase, /\[dir="rtl"\] \.sc-head__h2 \{ line-height: 1\.2; letter-spacing: 0; \}/);
  assert.match(ai, /\[dir="rtl"\] \.ai-title \{ line-height: 1\.2; letter-spacing: 0; \}/);
  assert.match(showcase, /#work\.sc-section \{[\s\S]*?padding: var\(--li-space-feature\) 0;[\s\S]*?border-image: var\(--li-seam\) 1;/);
  assert.match(ai, /\.ai-section \{[\s\S]*?padding-block: var\(--li-space-feature\);[\s\S]*?border-image: var\(--li-seam\) 1;/);
  assert.match(showcase, /#work\.sc-section::after \{[\s\S]*?linear-gradient\(180deg, transparent, var\(--li-bg\)\)/, "the work light fades out before the next section");
  // No grain or starfield left behind the AI section.
  const signature = read("../app/signature.css");
  assert.doesNotMatch(signature, /\.runtime-section::after|\.agent-field|--noise:/);
  // The shared pieces: one primary button, living light. The seams belong to the chapter rhythm ("Calm"), so no
  // block draws its own beside them.
  const block = living.slice(living.indexOf("One product."));
  assert.ok(block.length > 100, "the One product block exists");
  assert.match(living, /:is\(\.li-chapter, \.li-pause\) \+ :is\(\.li-chapter, \.li-pause\) \{\s*border-top: 1px solid transparent;\s*border-image: var\(--li-seam\) 1;/);
  assert.doesNotMatch(block.slice(0, block.indexOf("Calm (docs")), /border-image: var\(--li-seam\)/, "one seam system");
  assert.match(block, /@keyframes word-rise \{[\s\S]*?filter: blur\(10px\)/, "split headings arrive blur to sharp");
  for (const selector of [".terminal__send", ".companion__primary"]) {
    const at = block.indexOf(selector);
    assert.ok(at > 0, `${selector} is styled`);
    const rule = block.slice(at, block.indexOf("}", at));
    assert.ok(rule.includes("background: var(--li-ink);") && rule.includes("color: var(--li-on-light);"), `${selector} is the off-white primary`);
  }
  assert.match(block, /\.kinetic-band__row \.kinetic-band__accent \{[\s\S]*?background: var\(--li-aurora\);/);
  // Recognition's one moment carries the living light at t0; no rules are left for the old achievement cards.
  assert.doesNotMatch(living, /\.proof-card(--lead|__signal|:not)/, "no rules left for the old achievement cards");
  assert.match(read("../components/achievements-section.tsx"), /<span className="li-aurora-text"><Signal text=\{lead\.signal\} \/><\/span>/);
  assert.match(read("../app/chapters.css"), /\.recognition__moment \{[^}]*font-size: var\(--li-t0\);/);
  // Contact's one email action is the same off-white primary; the help paths are hairline columns, not glass.
  assert.match(read("../components/contact-section.tsx"), /className="li-btn li-btn--primary finale__btn" href=\{`mailto:\$\{identity\.email\}`\}/);
  assert.doesNotMatch(read("../components/contact-section.tsx"), /contact-orb|orbRing/, "the rotating badge is gone");
  assert.match(read("../app/chapters.css"), /\.portfolio-v3 \.contact__path \{[^}]*border-top: 1px solid var\(--li-line-2\);[^}]*\}/);
  assert.doesNotMatch(block, /^\.portfolio-v3 \.(help-card|contact-orb)/m, "no rules left for the old cards and badge");
  // Both section eyebrows carry the living rule, now as numbered chapter eyebrows ("01 · Featured projects").
  assert.match(read("../components/section-header.tsx"), /className=\{`li-eyebrow li-eyebrow--live li-chapter__eyebrow \$\{className\}`/);
  assert.match(read("../components/projects-section.tsx"), /<ChapterEyebrow text=\{copy\.index\} className="sc-head__eyebrow" \/>/);
  assert.match(read("../components/runtime-section.tsx"), /<ChapterEyebrow text=\{copy\.eyebrow\} className="ai-eyebrow" \/>/);
  // Section titles everywhere arrive like the hero's: blur to sharp.
  assert.match(read("../components/reveal.tsx"), /variant === "title"\s*\? \[\{ transform: "translateY\(16px\)", opacity: 0, filter: "blur\(10px\)" \}/);
});

test("<LivingOrb> holds still behind the welcome screen and comes alive when it closes", async () => {
  const env = setup();
  const previous = globalThis.MutationObserver;
  globalThis.MutationObserver = env.win.MutationObserver;
  try {
    const root = env.win.document.documentElement;
    root.dataset.welcome = "show";
    const host = createRoot(env.win.document.getElementById("root"));
    await act(async () => host.render(createElement(LivingOrb, { size: 240 })));
    const wrap = env.win.document.querySelector(".li-orb");
    await act(async () => env.intersect(wrap));
    await act(async () => env.intersect(wrap));
    assert.ok(wrap.querySelector("canvas"), "it mounts, so it is ready when the screen closes");
    assert.equal(env.frames.size, 0, "covered by the welcome screen: one still frame, no loop");
    await act(async () => {
      delete root.dataset.welcome;
      await new Promise((resolve) => env.win.setTimeout(resolve, 0));
    });
    assert.equal(env.frames.size, 1, "the screen closes and the orb moves");
    await act(async () => host.unmount());
  } finally {
    globalThis.MutationObserver = previous;
    env.restore();
  }
});

test("big orbs cap at 60 fps and size from layout; the welcome screen has its own orb and hands focus on", () => {
  const orb = read("../components/living-orb.tsx");
  assert.match(orb, /const STAGE_FPS = 60;/);
  assert.match(orb, /fps: fpsRef\.current \?\? STAGE_FPS,/);
  // An orb mounts mid-entrance (scaled): the backing store follows the layout size, not the painted one.
  assert.match(read("../lib/living-orb.ts"), /const cssW = Math\.max\(1, canvas\.clientWidth \|\| rect\?\.width \|\| 1\);/);
  const welcome = read("../components/welcome-screen.tsx");
  assert.match(welcome, /\{showing \? <LivingOrb className="welcome__orb"[^>]*overWelcome \/> : null\}/, "only while the screen is up, so its context is free again");
  assert.match(welcome, /title\.focus\(\{ preventScroll: true \}\);/, "closing hands focus to the headline, not to <body>");
});

test("the lower chapters are hairline rows in the eight type sizes, and small labels never fall under 13 px", () => {
  const living = read("../app/living.css");
  // The brand's small label reads at 13 px (t7), never 12.5.
  assert.match(living, /\.portfolio-v3 \.nav__brand small \{ font-size: 0\.8125rem; \}/);
  assert.doesNotMatch(living, /font-size: 0\.78125rem/, "nothing at 12.5 px");
  // Recognition is hairline rows, never cards, so no grid of them can end on a hole.
  assert.match(read("../app/chapters.css"), /\.recognition__row \{[^}]*border-top: 1px solid var\(--li-line\);/, "the recognitions are hairline rows");
  // The appendix, Contact and the footer (app/chapters.css, owner rest) speak only in the eight type sizes, and
  // their logos are off-white: no brand colour fills a tile any more.
  const chapters = read("../app/chapters.css");
  const rest = chapters.slice(chapters.indexOf("/* ===== Outside the projects (owner: rest) ===== */"));
  const sizes = [...rest.matchAll(/font-size: ([^;]+);/g)].map((match) => match[1]);
  assert.ok(sizes.length > 20);
  for (const size of sizes) assert.match(size, /^(var\(--li-t[0-7]\)|clamp\(\d+px, [\d.]+vw, \d+px\))$/, `${size}: a type token (or the decorative wordmark)`);
  assert.doesNotMatch(rest, /font-weight: (?!400|500|600)\d+/, "weights 400, 500 and 600 only");
  assert.doesNotMatch(rest, /--brand-a|journey-tile|organization-showcase/, "no brand colour in the organizations");
  assert.match(living, /\.portfolio-v3 \.terminal__input textarea \{ min-height: 44px; \}/);
  assert.match(living, /\.portfolio-v3 \.nav__brand \{ min-width: 44px; \}/);
});
