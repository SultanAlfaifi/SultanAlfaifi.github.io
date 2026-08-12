"use client";

import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";

export function HeroScrollCue() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (window.scrollY < 24) setVisible(true);
    }, 5000);

    function handleScroll() {
      if (window.scrollY >= 24) {
        window.clearTimeout(timer);
        setVisible(false);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <a
      className={`hero__scroll-cue ${visible ? "is-visible" : ""}`}
      href="#about"
      aria-label="Scroll to the About section"
    >
      <ArrowDown aria-hidden="true" size={18} />
    </a>
  );
}
