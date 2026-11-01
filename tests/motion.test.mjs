import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { OrganizationRail } from "../components/organization-rail.tsx";
import { Reveal } from "../components/reveal.tsx";

async function mount(Component, { top = 1200 } = {}) {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://portfolio.test" });
  const previous = new Map();
  const intersections = [];
  const frames = new Map();
  const timers = new Map();
  const animations = [];
  let sequence = 0;
  let motionChange;
  const motion = { matches: false, addEventListener: (_, cb) => { motionChange = cb; }, removeEventListener() {} };
  const IO = class {
    constructor(callback) { this.callback = callback; }
    observe(element) { intersections.push({ element, callback: this.callback }); }
    disconnect() {}
  };
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, Node: dom.window.Node, IntersectionObserver: IO,
    ResizeObserver: class { observe() {} disconnect() {} }, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  dom.window.IntersectionObserver = IO;
  dom.window.matchMedia = () => motion;
  dom.window.requestAnimationFrame = (cb) => { frames.set(++sequence, cb); return sequence; };
  dom.window.cancelAnimationFrame = (id) => frames.delete(id);
  dom.window.setTimeout = (cb) => { timers.set(++sequence, cb); return sequence; };
  dom.window.clearTimeout = (id) => timers.delete(id);
  Object.defineProperty(dom.window.document, "hidden", { value: false });
  dom.window.HTMLElement.prototype.getBoundingClientRect = function () {
    return { top, bottom: top + 200, height: 200, width: this.classList.contains("journey-marquee__group") ? 1000 : 300, left: 0, right: 300 };
  };
  dom.window.HTMLElement.prototype.hasPointerCapture = () => false;
  dom.window.HTMLElement.prototype.setPointerCapture = () => {};
  dom.window.HTMLElement.prototype.animate = (keyframes, options) => {
    const animation = { keyframes, options, cancelled: false, cancel() { this.cancelled = true; } };
    animations.push(animation);
    return animation;
  };
  const root = createRoot(dom.window.document.getElementById("root"));
  await act(async () => root.render(createElement(Component, { delay: 120 }, "Content")));
  return {
    document: dom.window.document, animations,
    intersect: () => act(async () => intersections.forEach(({ callback }) => callback([{ isIntersecting: true }]))),
    tick: (time) => act(async () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(cb => cb(time)); }),
    settle: () => act(async () => { const pending = [...timers.values()]; timers.clear(); pending.forEach(cb => cb()); }),
    reduced: () => act(async () => { motion.matches = true; motionChange?.(); }),
    dispatch: (element, type, props = {}) => act(async () => {
      const event = new dom.window.Event(type, { bubbles: true, cancelable: true });
      for (const [key, value] of Object.entries(props)) Object.defineProperty(event, key, { value });
      element.dispatchEvent(event);
    }),
    async cleanup() {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  };
}

test("the organization grid never moves on its own: no autoplay, no drag, nothing to pause", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(new URL("../components/organization-rail.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /"use client"|useEffect|requestAnimationFrame|scrollLeft|onPointerDown|onWheel|AUTO_SCROLL|setInterval/, "a still grid, rendered on the server");
  const h = await mount(OrganizationRail);
  try {
    await h.intersect();
    await h.tick(10000);
    await h.settle();
    const grid = h.document.querySelector(".row-orgs");
    assert.ok(grid, "the grid renders");
    assert.equal(grid.querySelectorAll("button, [aria-pressed], [draggable=true]").length, 0, "nothing to pause or drag");
    assert.equal(h.document.querySelector(".organization-showcase__rail, .journey-marquee"), null, "no marquee");
    assert.equal(h.animations.length, 0, "no entrance or loop");
  } finally { await h.cleanup(); }
});

test("already-visible content does not replay an entrance after hydration", async () => {
  const h = await mount(Reveal, { top: 100 });
  try {
    await h.intersect();
    assert.equal(h.animations.length, 0);
  } finally { await h.cleanup(); }
});

test("offscreen entrance holds its delay frame without clipping and respects reduced motion", async () => {
  const h = await mount(Reveal);
  try {
    await h.intersect();
    assert.equal(h.animations.length, 1);
    assert.equal(h.animations[0].options.fill, "backwards");
    assert.ok(h.animations[0].keyframes.every(frame => !("clipPath" in frame)));
    await h.reduced();
    assert.equal(h.animations[0].cancelled, true);
  } finally { await h.cleanup(); }
});
