"use client";

import { useEffect, useRef } from "react";
import { getContent, type Locale } from "@/data/i18n";

// The page's one continuous motion below the AI chapter (app/experience.css): two rows that drift on their
// own at one steady speed, all the time; scrolling never changes it. Purely typographic; the words repeat
// ideas stated elsewhere, so it is hidden from assistive tech. The rows keep an LTR track so the motion is
// identical in both languages (app/rtl.css turns it to read right to left on the Arabic page).
export function KineticBand({ locale = "en" }: { locale?: Locale }) {
  const { band } = getContent(locale).ui;
  const ref = useRef<HTMLElement>(null);
  const solidRow = [...band.solid, ...band.solid, ...band.solid];
  const outlineRow = [...band.outline, ...band.outline, ...band.outline];
  const second = locale === "en" ? "ar" : "en";

  // Off screen the rows rest (.is-away) and pick up where they left off when the band comes back.
  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => element.classList.toggle("is-away", !entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
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
