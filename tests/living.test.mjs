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
  for (const token of ["--li-display", "--li-h2", "--li-space-feature", "--li-seam"]) assert.match(living, new RegExp(`${token}:`), `${token} is defined`);
  // One display scale and one rhythm for the work and AI sections.
  for (const [name, css, rule] of [["work", showcase, /\.portfolio-v3 \.sc-head__h2 \{[\s\S]*?\}/], ["AI", ai, /\.ai-title \{[\s\S]*?\}/]]) {
    assert.match(css.match(rule)[0], /font-size: var\(--li-display\);/, `${name}: the shared display scale`);
    assert.doesNotMatch(css.match(rule)[0], /background-clip: text/, `${name}: the headline is plain ink, like the hero's`);
  }
  assert.match(showcase, /#work\.sc-section \{[\s\S]*?padding: var\(--li-space-feature\) 0;[\s\S]*?border-image: var\(--li-seam\) 1;/);
  assert.match(ai, /\.ai-section \{[\s\S]*?padding-block: var\(--li-space-feature\);[\s\S]*?border-image: var\(--li-seam\) 1;/);
  assert.match(showcase, /#work\.sc-section::after \{[\s\S]*?linear-gradient\(180deg, transparent, var\(--li-bg\)\)/, "the work light fades out before the next section");
  // No grain or starfield left behind the AI section.
  const signature = read("../app/signature.css");
  assert.doesNotMatch(signature, /\.runtime-section::after|\.agent-field|--noise:/);
  // The older sections: seams, headline scale, one primary button, glass, living light.
  const block = living.slice(living.indexOf("One product."));
  assert.ok(block.length > 100, "the One product block exists");
  assert.match(block, /:is\(\.kinetic-band, \.organization-rail, \.organization-showcase\) \{[\s\S]*?border-image: var\(--li-seam\) 1;/);
  assert.match(block, /:is\(\.section-header h2, \.timeline__head h2\) \{[\s\S]*?font-size: var\(--li-h2\);/);
  assert.match(block, /@keyframes word-rise \{[\s\S]*?filter: blur\(10px\)/, "split headings arrive blur to sharp");
  for (const selector of [".help-card__cta", ".contact-orb__core", ".terminal__send", ".companion__primary"]) {
    const at = block.indexOf(selector);
    assert.ok(at > 0, `${selector} is styled`);
    const rule = block.slice(at, block.indexOf("}", at));
    assert.ok(rule.includes("background: var(--li-ink);") && rule.includes("color: var(--li-on-light);"), `${selector} is the off-white primary`);
  }
  assert.match(block, /\.help-card \{[\s\S]*?background: var\(--li-glass-fill\);/);
  assert.match(block, /\.proof-card--lead \.proof-card__signal,\s*\.kinetic-band__row \.kinetic-band__accent \{[\s\S]*?background: var\(--li-aurora\);/);
  // Both section eyebrows carry the living rule.
  assert.match(read("../components/projects-section.tsx"), /li-eyebrow li-eyebrow--live sc-head__eyebrow/);
  assert.match(read("../components/runtime-section.tsx"), /li-eyebrow li-eyebrow--live ai-eyebrow/);
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

test("the older sections share the rebuilt sections' chips, type and glass, and the logo rail is dark glass", () => {
  const living = read("../app/living.css");
  const chips = living.match(/\.portfolio-v3 :is\(\.tag-list li, \.tag-list--dark li, \.timeline__kind, \.ideas-footer li, \.workshop__diagram span\) \{[\s\S]*?\}/)[0];
  assert.match(chips, /border-radius: var\(--li-r-pill\);/, "one glass pill");
  assert.match(chips, /font-size: 0\.8125rem;/, "13 px, never under 12.5");
  assert.match(living, /\.organization-detail-stage__hint,[\s\S]*?\) \{ font-size: 0\.8125rem; \}/, "the small labels read at 13 px");
  const tile = living.match(/\.portfolio-v3 \.journey-tile \{[\s\S]*?\}/)[0];
  assert.match(tile, /animation: none;/, "no flowing brand fill");
  assert.match(tile, /var\(--li-bg-1\)/, "a dark tile");
  assert.match(tile, /color-mix\(in srgb, var\(--brand-a\) 0%, transparent\)/, "the brand is dark at rest");
  assert.match(living, /:is\(\.journey-tile\.is-active, \.journey-tile:hover, \.journey-tile:focus-within\) \{[\s\S]*?var\(--brand-a\) 30%/, "and a faint glow only on air");
  assert.match(living, /\.portfolio-v3 \.organization-showcase__rail \{[\s\S]*?clip-path: none;/);
  assert.match(living, /\.proof-card:not\(\.proof-card--lead\):last-child:nth-child\(3n\) \{\s*grid-column: 1 \/ -1;/, "the achievements grid ends flush");
  assert.match(living, /\.portfolio-v3 \.terminal__input textarea \{ min-height: 44px; \}/);
  assert.match(living, /\.portfolio-v3 \.nav__brand \{ min-width: 44px; \}/);
});
