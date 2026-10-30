import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { HeroMedia } from "../components/hero-media.tsx";
import { SallaExperienceStory } from "../components/salla-experience-story.tsx";

async function mountMedia({ reduced = false, motionOff = false, requested = false, component = HeroMedia } = {}) {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://portfolio.test" });
  const previous = new Map();
  for (const [key, value] of Object.entries({
    window: dom.window, document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  let intersection;
  let motionChange;
  let hidden = false;
  let rejection = false;
  let paused = true;
  let playCalls = 0;
  let loadCalls = 0;
  const motion = {
    matches: reduced,
    addEventListener: (_, listener) => { motionChange = listener; },
    removeEventListener: () => { motionChange = undefined; },
  };
  dom.window.matchMedia = () => motion;
  previous.set("IntersectionObserver", Object.getOwnPropertyDescriptor(globalThis, "IntersectionObserver"));
  globalThis.IntersectionObserver = class {
    constructor(callback) { intersection = callback; }
    observe() {}
    disconnect() { intersection = undefined; }
  };
  Object.defineProperty(dom.window.document, "hidden", { get: () => hidden });
  Object.defineProperty(dom.window.HTMLMediaElement.prototype, "paused", { get: () => paused });
  dom.window.HTMLMediaElement.prototype.play = function () {
    playCalls += 1;
    if (rejection) return Promise.reject(new Error("Playback blocked"));
    paused = false;
    this.dispatchEvent(new dom.window.Event("playing"));
    return Promise.resolve();
  };
  dom.window.HTMLMediaElement.prototype.pause = function () {
    paused = true;
    this.dispatchEvent(new dom.window.Event("pause"));
  };
  dom.window.HTMLMediaElement.prototype.load = () => { loadCalls += 1; };
  // The page's own Motion toggle (components/motion-toggle.tsx) marks <html> and announces the change.
  const setMotionToggle = (off) => {
    if (off) dom.window.document.documentElement.dataset.motion = "off";
    else delete dom.window.document.documentElement.dataset.motion;
    dom.window.dispatchEvent(new dom.window.Event("portfolio:motion"));
  };
  if (motionOff) dom.window.document.documentElement.dataset.motion = "off";
  const root = createRoot(dom.window.document.getElementById("root"));
  await act(async () => root.render(createElement(component, {
    src: "/intro.mp4", mobileSrc: "/intro-mobile.mp4", poster: "/poster.webp", requested,
    experience: {
      organization: "Salla", dates: "2026", location: "Makkah", role: "Intern",
      description: "Engineering experience", responsibilities: [], technologies: [], note: "",
    },
    asset: { derived: { color: "/salla.webp" }, alt: "Salla" },
  })));
  const video = dom.window.document.querySelector("video");
  return {
    video,
    get playCalls() { return playCalls; },
    get loadCalls() { return loadCalls; },
    get paused() { return paused; },
    get status() { return dom.window.document.querySelector('[role="status"]').textContent; },
    rejectPlayback: (value) => { rejection = value; },
    setMotionToggle: (off) => act(async () => setMotionToggle(off)),
    intersect: (value) => act(async () => intersection([{ isIntersecting: value }])),
    setReduced: (value) => act(async () => { motion.matches = value; motionChange(); }),
    setHidden: (value) => act(async () => {
      hidden = value;
      dom.window.document.dispatchEvent(new dom.window.Event("visibilitychange"));
    }),
    clickPlayback: () => act(async () => dom.window.document.querySelector("button").click()),
    failSource: () => act(async () => video.querySelector("source").dispatchEvent(new dom.window.Event("error"))),
    async cleanup() {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    },
  };
}

for (const [name, component] of [["Intro", HeroMedia], ["Salla", SallaExperienceStory]]) {
test(`${name} playback follows viewport and page visibility while keeping an explicit pause`, async () => {
  const media = await mountMedia({ component });
  try {
    assert.equal(media.video.autoplay, false);
    assert.equal(media.playCalls, 0);
    await media.intersect(true);
    assert.equal(media.paused, false);
    await media.intersect(false);
    assert.equal(media.paused, true);
    await media.intersect(true);
    await media.setHidden(true);
    assert.equal(media.paused, true);
    await media.setHidden(false);
    assert.equal(media.paused, false);
    await media.clickPlayback();
    const callsAtPause = media.playCalls;
    await media.intersect(false);
    await media.intersect(true);
    await media.setHidden(true);
    await media.setHidden(false);
    assert.equal(media.paused, true);
    assert.equal(media.playCalls, callsAtPause);
  } finally { await media.cleanup(); }
});

test(`${name} reduced motion shows a poster until explicit playback and responds to preference changes`, async () => {
  const media = await mountMedia({ reduced: true, component });
  try {
    await media.intersect(true);
    assert.equal(media.playCalls, 0);
    assert.equal(media.video.preload, "none");
    await media.clickPlayback();
    assert.equal(media.paused, false);
    await media.setReduced(false);
    await media.setReduced(true);
    assert.equal(media.paused, true);
    await media.setHidden(true);
    await media.setHidden(false);
    assert.equal(media.paused, true);
  } finally { await media.cleanup(); }
});

test(`${name} failed playback supplies feedback and retries only after a user action`, async () => {
  const media = await mountMedia({ component });
  try {
    media.rejectPlayback(true);
    await media.intersect(true);
    assert.match(media.status, /couldn’t start/);
    await media.intersect(false);
    await media.intersect(true);
    assert.equal(media.playCalls, 1);
    media.rejectPlayback(false);
    await media.clickPlayback();
    assert.equal(media.paused, false);
    assert.equal(media.status, "");
    await media.failSource();
    assert.match(media.status, /couldn’t load/);
    await media.clickPlayback();
    assert.equal(media.loadCalls, 1);
    assert.equal(media.paused, false);
  } finally { await media.cleanup(); }
});
}

test("Intro follows the page's Motion toggle, not only the OS setting", async () => {
  const media = await mountMedia({ motionOff: true });
  try {
    await media.intersect(true);
    assert.equal(media.playCalls, 0, "motion off keeps the poster, like reduced motion");
    await media.setMotionToggle(false);
    assert.equal(media.paused, false, "turning motion back on resumes playback in view");
    await media.setMotionToggle(true);
    assert.equal(media.paused, true, "turning it off again stops the film");
    await media.clickPlayback();
    assert.equal(media.paused, false, "an explicit play still works with motion off");
  } finally { await media.cleanup(); }
});

test("Intro opened from the hero's dialog counts as the visitor's request to play", async () => {
  const media = await mountMedia({ reduced: true, requested: true });
  try {
    assert.equal(media.video.preload, "none");
    assert.equal(media.playCalls, 0, "nothing is fetched until the dialog shows the film");
    await media.intersect(true);
    assert.equal(media.paused, false, "the dialog's film starts even with reduced motion");
    await media.clickPlayback();
    assert.equal(media.paused, true, "pause still works");
    await media.setHidden(true);
    await media.setHidden(false);
    assert.equal(media.paused, true, "and stays paused");
  } finally { await media.cleanup(); }
});
