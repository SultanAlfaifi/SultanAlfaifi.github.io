"use client";

import { useEffect, useRef } from "react";
import { introPlaying, motionAllowed } from "./motion-preference";

// Glyphs follow the original character's case so scrambled lines keep roughly the same width.
const UPPER = "ABCDEFGHKNOPRSTUVXYZ";
const LOWER = "abcdeghknopqrsuvxyz";
const SYMBOLS = "<>/{}#*+=";
const ARABIC = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";

function glyphFor(character: string) {
  const pool = character >= "؀" && character <= "ۿ" ? ARABIC
    : character >= "A" && character <= "Z" ? UPPER
      : character >= "a" && character <= "z" ? LOWER : SYMBOLS;
  return pool[Math.floor(Math.random() * pool.length)];
}

type DecodeTextProps = {
  text: string;
  highlight?: string;
  duration?: number;
};

// The real text owns layout and the accessible name; the scramble is an aria-hidden overlay.
export function DecodeText({ text, highlight, duration = 1150 }: DecodeTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const overlay = overlayRef.current;
    if (!root || !overlay || !motionAllowed()) return;
    const resolveAt = Array.from(text, (_, index) => (index / text.length) * duration * 0.72 + Math.random() * duration * 0.28);
    let frame = 0;
    let start = 0;
    root.dataset.decoding = "true";

    function finish() {
      delete root!.dataset.decoding;
      overlay!.textContent = "";
    }

    function render(time: number) {
      if (!start) start = time;
      const elapsed = time - start;
      let output = "";
      for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        output += character === " " || elapsed >= resolveAt[index] ? character : glyphFor(character);
      }
      overlay!.textContent = output;
      if (elapsed < duration) frame = requestAnimationFrame(render);
      else finish();
    }

    // Under the intro curtain, decoding starts as the curtain opens.
    const delay = introPlaying() ? 1550 : 0;
    const starter = window.setTimeout(() => { frame = requestAnimationFrame(render); }, delay);
    // Background tabs pause animation frames; the real headline must still land.
    const fallback = window.setTimeout(() => {
      cancelAnimationFrame(frame);
      finish();
    }, delay + duration + 600);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(starter);
      window.clearTimeout(fallback);
      finish();
    };
  }, [text, duration]);

  const parts = highlight && text.includes(highlight) ? text.split(highlight) : null;

  return (
    <span ref={rootRef} className="decode">
      <span className="decode__text">
        {parts ? (
          <>
            {parts[0]}
            <em>{highlight}</em>
            {parts.slice(1).join(highlight)}
          </>
        ) : text}
      </span>
      <span ref={overlayRef} className="decode__fx" aria-hidden="true" />
    </span>
  );
}
