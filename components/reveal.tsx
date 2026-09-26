"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "soft" | "title" | "media" | "left" | "right";
};

// Content is visible in the server HTML. Motion is a one-time enhancement.
export function Reveal({ children, className = "", delay = 0, variant = "soft" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window) || !element.animate) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Hydrated content already on screen must never jump back to an entrance frame.
    const bounds = element.getBoundingClientRect();
    if (preference.matches || (bounds.height > 0 && bounds.top < window.innerHeight && bounds.bottom > 0)) return;
    let animation: Animation | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (preference.matches) return;
      const frames = [{ transform: `translateY(${variant === "title" ? 8 : 12}px)`, opacity: 0.8 }, { transform: "translateY(0)", opacity: 1 }];
      animation = element.animate(frames, { duration: 420, delay: Math.min(delay, 60), easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" });
    }, { threshold: 0, rootMargin: "0px 0px 64px 0px" });
    const stopMotion = () => { if (preference.matches) animation?.cancel(); };
    preference.addEventListener("change", stopMotion);
    observer.observe(element);
    return () => { observer.disconnect(); animation?.cancel(); preference.removeEventListener("change", stopMotion); };
  }, [delay, variant]);

  return <div ref={ref} className={`reveal motion-reveal ${className}`}>{children}</div>;
}
