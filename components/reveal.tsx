"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RevealPhase = "before" | "visible" | "past";
type RevealVariant = "soft" | "title" | "media" | "left" | "right";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "soft"
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const applyPhase = (phase: RevealPhase) => {
      element.classList.remove("reveal--before", "reveal--visible", "reveal--past");
      element.classList.add("reveal--ready", `reveal--${phase}`);
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      applyPhase("visible");
      return;
    }

    const rect = element.getBoundingClientRect();
    applyPhase(rect.bottom < 0 ? "past" : rect.top > window.innerHeight ? "before" : "visible");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          applyPhase("visible");
        } else if (entry.boundingClientRect.bottom <= 0) {
          applyPhase("past");
        } else if (entry.boundingClientRect.top >= window.innerHeight) {
          applyPhase("before");
        }
      },
      { rootMargin: "18% 0px 18% 0px", threshold: 0.01 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal reveal--${variant} reveal--visible ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
