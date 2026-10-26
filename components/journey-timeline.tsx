import type { CSSProperties } from "react";
import { getContent, type Locale } from "@/data/i18n";

// On wide screens with scroll-driven animation support, the track is pinned and slides sideways as you scroll.
// Everywhere else it is a native horizontal scroller with snap points.
export function JourneyTimeline({ locale = "en" }: { locale?: Locale }) {
  const { journey, ui } = getContent(locale);
  return (
    <section id="timeline" className="timeline" aria-labelledby="timeline-title" style={{ "--count": journey.length } as CSSProperties}>
      <div className="timeline__sticky">
        <div className="page-shell timeline__head">
          <h2 id="timeline-title">{ui.timeline.title}</h2>
          <p>{ui.timeline.description}</p>
        </div>
        <div className="timeline__viewport" tabIndex={0} aria-label={ui.timeline.aria} data-cursor={ui.timeline.cursor}>
          <ol className="timeline__track">
            {journey.map((stop, index) => (
              <li key={`${stop.date}-${stop.title}`} className={`timeline__stop timeline__stop--${stop.kind.toLowerCase().replace(" ", "-")}`}>
                <span className="timeline__dot" aria-hidden="true" />
                <time>{stop.date}</time>
                <span className="timeline__kind">{ui.timeline.kinds[stop.kind] ?? stop.kind}</span>
                <h3>{stop.title}</h3>
                <p>{stop.detail}</p>
                <span className="timeline__index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="page-shell timeline__progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
