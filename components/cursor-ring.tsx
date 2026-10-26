"use client";

import { useEffect, useRef } from "react";
import { motionAllowed, subscribeMotion } from "./motion-preference";

const INTERACTIVE = "a, button, summary, input, label, [role='option']";

// A trailing ring that reads the room: it grows over controls and names what a surface invites.
// The native cursor stays visible; this is decoration on fine pointers only.
export function CursorRing() {
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ring = ringRef.current;
    const label = labelRef.current;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!ring || !label) return;

    let x = -100;
    let y = -100;
    let targetX = -100;
    let targetY = -100;
    let frame = 0;
    let currentLabel = "";

    function render() {
      x += (targetX - x) * 0.22;
      y += (targetY - y) * 0.22;
      ring!.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.3 ? requestAnimationFrame(render) : 0;
    }

    function handleMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !finePointer.matches || !motionAllowed()) return;
      targetX = event.clientX;
      targetY = event.clientY;
      ring!.dataset.visible = "true";
      const target = event.target as Element | null;
      const named = target?.closest<HTMLElement>("[data-cursor]");
      const interactive = target?.closest(INTERACTIVE);
      const nextLabel = interactive ? "" : named?.dataset.cursor ?? "";
      if (nextLabel !== currentLabel) {
        currentLabel = nextLabel;
        label!.textContent = nextLabel;
      }
      ring!.dataset.state = nextLabel ? "label" : interactive ? "link" : "idle";
      if (!frame) frame = requestAnimationFrame(render);
    }

    function handleDown() { ring!.dataset.pressed = "true"; }
    function handleUp() { delete ring!.dataset.pressed; }
    function handleLeave() { delete ring!.dataset.visible; }
    function handleMotion() { if (!motionAllowed()) handleLeave(); }

    document.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("pointerdown", handleDown);
    document.addEventListener("pointerup", handleUp);
    document.documentElement.addEventListener("pointerleave", handleLeave);
    const unsubscribe = subscribeMotion(handleMotion);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerdown", handleDown);
      document.removeEventListener("pointerup", handleUp);
      document.documentElement.removeEventListener("pointerleave", handleLeave);
      unsubscribe();
    };
  }, []);

  return (
    <div ref={ringRef} className="cursor-ring" aria-hidden="true">
      <span className="cursor-ring__shape"><span ref={labelRef} className="cursor-ring__label" /></span>
    </div>
  );
}
