"use client";

import { useEffect, useState } from "react";
import { motionAllowed, subscribeMotion, toast, TOAST_EVENT } from "./motion-preference";
import { currentLocale, getContent } from "@/data/i18n";
import { unlockSecret } from "./secrets";

const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/#*+";
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

function formatCount(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

// Page-wide pointer craft. Every effect is decorative and stops with reduced motion or the Motion toggle.
export function InteractionLayer() {
  const [message, setMessage] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    let magnetic: HTMLElement | null = null;
    let tilted: HTMLElement | null = null;

    function paint() {
      frame = 0;
      // Read every rect first, then write, so one frame never forces repeated style recalcs.
      const cards = Array.from(document.querySelectorAll<HTMLElement>(".glow-card"), (element) => ({ element, rect: element.getBoundingClientRect() }));
      const characters = Array.from(document.querySelectorAll<HTMLElement>("[data-proximity] .px-char"), (element) => ({ element, rect: element.getBoundingClientRect() }));
      root.style.setProperty("--mx", `${pointerX}px`);
      root.style.setProperty("--my", `${pointerY}px`);
      for (const { element, rect } of cards) {
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) continue;
        element.style.setProperty("--gx", `${pointerX - rect.left}px`);
        element.style.setProperty("--gy", `${pointerY - rect.top}px`);
      }
      for (const { element, rect } of characters) {
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
        const distance = Math.hypot(pointerX - (rect.left + rect.width / 2), pointerY - (rect.top + rect.height / 2));
        // IBM Plex Sans Arabic ships static weights, so the swell steps through 300–700.
        const weight = 300 + 400 * Math.max(0, 1 - distance / 320);
        element.style.fontWeight = String(Math.round(weight / 100) * 100);
      }
    }

    function release(element: HTMLElement | null, property: "translate" | "transform") {
      if (!element) return;
      element.style[property] = "";
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !finePointer.matches || !motionAllowed()) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);

      const target = event.target as Element | null;
      const nextMagnetic = target?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (nextMagnetic !== magnetic) release(magnetic, "translate");
      magnetic = nextMagnetic;
      if (magnetic) {
        const rect = magnetic.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) * 0.28;
        const dy = (event.clientY - (rect.top + rect.height / 2)) * 0.4;
        magnetic.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      }

      const nextTilted = target?.closest<HTMLElement>("[data-tilt]") ?? null;
      if (nextTilted !== tilted) release(tilted, "transform");
      tilted = nextTilted;
      if (tilted) {
        const rect = tilted.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        tilted.style.transform = `perspective(1100px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`;
        tilted.style.setProperty("--tx", `${((x + 0.5) * 100).toFixed(1)}%`);
        tilted.style.setProperty("--ty", `${((y + 0.5) * 100).toFixed(1)}%`);
      }
    }

    // The intro curtain ends by itself in CSS; any key or click skips it.
    let introTimer = 0;
    function endIntro() {
      if (root.dataset.intro !== "play") return;
      root.dataset.intro = "done";
      window.removeEventListener("pointerdown", endIntro);
      window.removeEventListener("keydown", endIntro);
    }
    if (root.dataset.intro === "play") {
      introTimer = window.setTimeout(endIntro, 2600);
      window.addEventListener("pointerdown", endIntro, { once: true });
      window.addEventListener("keydown", endIntro, { once: true });
    }

    function handlePointerLeave() {
      release(magnetic, "translate");
      release(tilted, "transform");
      magnetic = null;
      tilted = null;
      pointerX = -9999;
      pointerY = -9999;
      if (!frame) frame = requestAnimationFrame(paint);
    }

    const scrambling = new WeakSet<Element>();
    function scramble(element: HTMLElement) {
      // Mutate React's own text node in place so reconciliation never loses track of it.
      const textNode = element.firstChild;
      if (scrambling.has(element) || !motionAllowed() || textNode?.nodeType !== Node.TEXT_NODE) return;
      const original = textNode.nodeValue ?? "";
      scrambling.add(element);
      element.style.minWidth = `${element.getBoundingClientRect().width}px`;
      let tick = 0;
      const total = original.length * 2 + 4;
      const run = () => {
        tick += 1;
        textNode.nodeValue = Array.from(original, (character, index) =>
          character === " " || index < tick / 2 ? character : SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]
        ).join("");
        if (tick < total) requestAnimationFrame(run);
        else {
          textNode.nodeValue = original;
          element.style.minWidth = "";
          scrambling.delete(element);
        }
      };
      requestAnimationFrame(run);
    }

    function handlePointerOver(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      const element = (event.target as Element | null)?.closest<HTMLElement>("[data-scramble]");
      if (element && !element.contains(event.relatedTarget as Node | null)) scramble(element);
    }

    const counters = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        counters.unobserve(entry.target);
        const element = entry.target as HTMLElement;
        const target = Number(element.dataset.count);
        if (!motionAllowed() || !Number.isFinite(target)) continue;
        const textNode = element.querySelector("[data-count-value]")?.firstChild;
        if (textNode?.nodeType !== Node.TEXT_NODE) continue;
        const startTime = performance.now();
        const animate = (time: number) => {
          const progress = Math.min(1, (time - startTime) / 1500);
          const eased = 1 - Math.pow(2, -10 * progress);
          textNode.nodeValue = formatCount(target * (progress === 1 ? 1 : eased));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.6 });
    document.querySelectorAll("[data-count]").forEach((element) => counters.observe(element));

    let konamiIndex = 0;
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      konamiIndex = key === KONAMI[konamiIndex] ? konamiIndex + 1 : key === KONAMI[0] ? 1 : 0;
      if (konamiIndex === KONAMI.length) {
        konamiIndex = 0;
        const enabled = root.dataset.agentMode !== "on";
        if (enabled) root.dataset.agentMode = "on";
        else delete root.dataset.agentMode;
        const copy = getContent(currentLocale()).ui.toasts;
        toast(enabled ? copy.agentOn : copy.agentOff);
        if (enabled) window.setTimeout(() => unlockSecret("konami"), 1800);
      }
    }

    let toastTimer = 0;
    function handleToast(event: Event) {
      const text = (event as CustomEvent<string>).detail;
      setMessage({ id: Date.now(), text });
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => setMessage(null), 3600);
    }

    function handleMotion() {
      if (!motionAllowed()) handlePointerLeave();
    }

    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener(TOAST_EVENT, handleToast);
    const unsubscribe = subscribeMotion(handleMotion);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(introTimer);
      window.removeEventListener("pointerdown", endIntro);
      window.removeEventListener("keydown", endIntro);
      counters.disconnect();
      window.clearTimeout(toastTimer);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerover", handlePointerOver);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(TOAST_EVENT, handleToast);
      unsubscribe();
    };
  }, []);

  return (
    <>
      <div className="spotlight" aria-hidden="true" />
      <div className="toast-region" role="status" aria-live="polite">
        {message ? <p key={message.id} className="toast">{message.text}</p> : null}
      </div>
    </>
  );
}
