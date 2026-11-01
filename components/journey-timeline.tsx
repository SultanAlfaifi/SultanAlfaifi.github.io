import { getContent, type Locale } from "@/data/i18n";
import { MetaParts } from "./meta-parts";

// The dated timeline, inside its "Beyond the projects" row (components/deeper-section.tsx), which carries
// #timeline and the title. A still, vertical list read top to bottom: no pin, no sideways scroll, nothing that
// moves on its own. A thin line of the living light runs through the stops, each lit in its kind's colour; the
// last stop, what I'm working on next, carries a lamp.
export function JourneyTimeline({ locale = "en" }: { locale?: Locale }) {
  const { journey, ui } = getContent(locale);
  return (
    <div className="row-timeline">
      <p className="deeper-body__lead">{ui.timeline.description}</p>
      <ol className="row-timeline__list">
        {journey.map((stop) => (
          <li key={`${stop.date}-${stop.title}`} className={`row-timeline__stop row-timeline__stop--${stop.kind.toLowerCase().replace(" ", "-")}`}>
            <p className="row-timeline__when">
              <span className="row-timeline__date li-num">{stop.date}</span>{" "}
              <span className="row-timeline__kind">{ui.timeline.kinds[stop.kind] ?? stop.kind}</span>
            </p>
            <span className="row-timeline__dot" aria-hidden="true" />
            <div className="row-timeline__body">
              <h4>{stop.title}</h4>
              <p><MetaParts text={stop.detail} /></p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
