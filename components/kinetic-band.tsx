"use client";

import { useEffect, useRef } from "react";
import { getContent, type Locale } from "@/data/i18n";
import { motionAllowed, subscribeMotion } from "./motion-preference";

// How scrolling speeds the band up: 1× at rest, plus 1× for every 900 px/s of scroll, at most 4×. When the
// scrolling stops it eases back to 1× in about 600 ms (three time constants of 200 ms).
export const BAND_BOOST = { perSpeed: 900, maxExtra: 3, settleMs: 600 };

export function bandRate(velocity: number) {
  return 1 + Math.min(Math.abs(velocity) / BAND_BOOST.perSpeed, BAND_BOOST.maxExtra);
}

// The page's one continuous motion below the AI chapter (app/experience.css): two rows that drift on their
// own, and run faster while the visitor scrolls. Purely typographic; the words repeat ideas stated
// elsewhere, so it is hidden from assistive tech. The rows keep an LTR track so the motion is identical in
// both languages (app/rtl.css turns it to read right to left on the Arabic page).
export function KineticBand({ locale = "en" }: { locale?: Locale }) {
  const { band } = getContent(locale).ui;
  const ref = useRef<HTMLElement>(null);
  const solidRow = [...band.solid, ...band.solid, ...band.solid];
  const outlineRow = [...band.outline, ...band.outline, ...band.outline];
  const second = locale === "en" ? "ar" : "en";

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const root = element;
    const rows = [...root.querySelectorAll<HTMLElement>(".kinetic-band__row")];
    let visible = false;
    let listening = false;
    let frame = 0;
    let rate = 1;
    let speed = 0;
    let lastY = window.scrollY;
    let lastTime = 0;

    // The rows' own CSS animations; looked up each time, since the Motion switch removes and recreates them.
    const apply = (value: number) => {
      for (const row of rows) for (const animation of row.getAnimations?.() ?? []) animation.playbackRate = value;
    };
    const settle = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      speed = 0;
      rate = 1;
      apply(1);
    };
    const step = (time: number) => {
      frame = 0;
      const dt = lastTime ? Math.min(Math.max(time - lastTime, 1), 100) : 16;
      lastTime = time;
      const y = window.scrollY;
      const velocity = ((y - lastY) / dt) * 1000;
      lastY = y;
      speed += (velocity - speed) * Math.min(1, dt / 60);
      const target = bandRate(speed);
      // Quick to catch the scroll, slower to let go.
      const constant = target > rate ? 90 : BAND_BOOST.settleMs / 3;
      rate += (target - rate) * (1 - Math.exp(-dt / constant));
      if (Math.abs(rate - 1) < 0.01 && Math.abs(speed) < 5) {
        settle();
        return;
      }
      apply(rate);
      frame = window.requestAnimationFrame(step);
    };
    // Only while the band is on screen: a scroll starts the loop, and the loop stops itself once settled.
    const onScroll = () => {
      if (visible && !frame) frame = window.requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      root.classList.toggle("is-away", !visible);
      lastY = window.scrollY;
      if (!visible) settle();
    });
    // With reduced motion or the Motion switch off the rows stand still (CSS), and nothing listens.
    const sync = () => {
      const allowed = motionAllowed();
      if (allowed && !listening) {
        lastY = window.scrollY;
        window.addEventListener("scroll", onScroll, { passive: true });
        listening = true;
      } else if (!allowed && listening) {
        window.removeEventListener("scroll", onScroll);
        listening = false;
        settle();
      }
    };
    observer.observe(root);
    sync();
    const stop = subscribeMotion(sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
      stop();
    };
  }, []);

  return (
    <section ref={ref} className="kinetic-band li-pause" aria-hidden="true" data-cursor={band.cursor} dir="ltr">
      <div className="kinetic-band__row kinetic-band__row--solid">
        {solidRow.map(([primary, secondary], index) => (
          <span key={`${primary}-${index}`}>
            <span lang={locale} dir="auto">{primary}</span>
            <i>✦</i>
            <span lang={second} dir="auto" className="kinetic-band__accent">{secondary}</span>
            <i>✦</i>
          </span>
        ))}
      </div>
      <div className="kinetic-band__row kinetic-band__row--outline">
        {outlineRow.map((phrase, index) => (
          <span key={`${phrase}-${index}`}><span dir="auto">{phrase}</span><i>✦</i></span>
        ))}
      </div>
    </section>
  );
}
