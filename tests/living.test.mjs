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
