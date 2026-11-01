import type { CSSProperties } from "react";
import type { PortfolioContent } from "@/data/i18n";
import type { Project, ProjectMetric } from "@/data/portfolio";

// Small, stateless pieces of the showcase, shared by the tiles (components/showcase.tsx), the case view,
// and the server-rendered section. Everything here reads the data as it is: no number, date, or claim
// is made up, and every metric keeps its kind, note, and date.

export type WorkCopy = PortfolioContent["ui"]["work"];
export type ShowcaseCopy = WorkCopy["showcase"];

// Each featured project's own light from the living palette: [main, second]. Design, not data.
const ACCENTS: Record<string, [string, string]> = {
  accessfinish: ["rose", "apricot"],
  mustakshif: ["glacier", "iris"],
  masari: ["iris", "rose"],
  mashhad: ["apricot", "rose"],
  autoflow: ["violet", "glacier"],
  mawrid: ["glacier", "frost"]
};

// The same hue light enough for small text on the ground (the audited --li-tint-* values).
const TINTS: Record<string, string> = { rose: "tint-rose", glacier: "tint-glacier", iris: "tint-iris", apricot: "tint-apricot", violet: "tint-iris", frost: "frost" };

export function accentStyle(slug: string): CSSProperties {
  const [main, second] = ACCENTS[slug] ?? ["iris", "glacier"];
  return { "--sc-accent": `var(--li-${main})`, "--sc-accent-2": `var(--li-${second})`, "--sc-tint": `var(--li-${TINTS[main]})` } as CSSProperties;
}

export function accentPair(slug: string) {
  return ACCENTS[slug] ?? ["iris", "glacier"];
}

// The colour a tile lights in when its demo reaches its stop (app/living.css .li-k-*).
export function kindClass(project: Project) {
  return `li-k-${project.checkpoint?.kind ?? "bound"}`;
}

// The featured six in the data's showcase order, 1 first.
export function showcaseOrder(projects: Project[]) {
  return projects
    .filter((project) => project.enabled)
    .filter((project) => project.featured)
    .sort((a, b) => (a.showcase ?? Infinity) - (b.showcase ?? Infinity));
}

// The rhythm of the grid: wide, then pairs, and one left over at the end is wide again, so the grid never
// ends on a gap. Six projects read wide · pair · pair · wide.
export function isWide(index: number, total: number) {
  return index === 0 || (index === total - 1 && (total - 1) % 2 === 1);
}

// The figure a tile shows on its face: its first metric in data order. AccessFinish shows its two real-bug
// results together, the one its wall draws first (the data lists "0 of 7" before "15 of 15"). Every other
// figure (the seeded fault, early trials, stars, downloads, design capacity) is in "Inside the build".
export function leadFigures(project: Project): ProjectMetric[] {
  const metrics = project.metrics ?? [];
  if (project.slug === "accessfinish") return metrics.filter((metric) => metric.kind === "real-bug").reverse().slice(0, 2);
  return metrics.slice(0, 1);
}

export function primaryLink(project: Project, copy: WorkCopy) {
  return project.primaryAction ?? (project.liveDemo ? { href: project.liveDemo, label: copy.tryApp } : null);
}

// "15 of 15", "0 من 7", "About 1,600", "1,000 L/h": numerals large, words and signs small, on one line.
export function FigureValue({ value }: { value: string }) {
  const tokens = value.split(" ");
  return (
    <span className="sc-value li-num">
      {tokens.map((token, index) => (
        <span key={`${token}-${index}`} className={/\d/.test(token) ? "sc-value__n" : "sc-value__u"}>
          {index ? " " : null}
          {token}
        </span>
      ))}
    </span>
  );
}

// A number with what it is: the value, its label, then one quiet line with its kind as a tag (unless its
// own note already says it), its note, its date, and the public place to check it.
export function Figure({ metric, copy, className = "" }: { metric: ProjectMetric; copy: ShowcaseCopy; className?: string }) {
  const tag = metric.kind && !metric.note ? copy.tags[metric.kind] : null;
  return (
    <div className={`sc-fig ${className}`.trim()}>
      <p className="sc-fig__value"><FigureValue value={metric.value} /></p>
      <p className="sc-fig__label">{metric.label}</p>
      {tag || metric.note || metric.asOf || metric.href ? (
        <p className="sc-fig__meta">
          {tag ? <span className={`sc-tag sc-tag--${metric.kind}`}>{tag}</span> : null}
          {metric.note ? <span className="sc-fig__note">{metric.note}</span> : null}
          {metric.asOf ? <span className="sc-fig__note">{copy.asOf(metric.asOf)}</span> : null}
          {metric.href ? <a className="sc-fig__check" href={metric.href} target="_blank" rel="noreferrer noopener">{copy.verifyOn}</a> : null}
        </p>
      ) : null}
    </div>
  );
}

// The face's figures. Figures of one kind and one date read as one unit: the values side by side at the
// same size, each with its own label, under a single tag and a single date (AccessFinish: "15 of 15" and
// "0 of 7", both real-bug results as of 24 Oct 2026). Anything else shows each figure whole.
export function Figures({ metrics, copy }: { metrics: ProjectMetric[]; copy: ShowcaseCopy }) {
  const [first] = metrics;
  if (!first) return null;
  const shared = metrics.length > 1 && metrics.every((metric) => metric.kind === first.kind && metric.asOf === first.asOf && !metric.note && !metric.href);
  if (!shared) {
    return (
      <div className={`sc-figs${metrics.length > 1 ? " sc-figs--two" : ""}`}>
        {metrics.map((metric) => <Figure key={metric.label} metric={metric} copy={copy} />)}
      </div>
    );
  }
  return (
    <div className="sc-figs sc-figs--unit">
      <div className="sc-figs__pair">
        {metrics.map((metric) => (
          <div key={metric.label} className="sc-fig">
            <p className="sc-fig__value"><FigureValue value={metric.value} /></p>
            <p className="sc-fig__label">{metric.label}</p>
          </div>
        ))}
      </div>
      <p className="sc-fig__meta">
        {first.kind ? <span className={`sc-tag sc-tag--${first.kind}`}>{copy.tags[first.kind]}</span> : null}
        {first.asOf ? <span className="sc-fig__note">{copy.asOf(first.asOf)}</span> : null}
      </p>
    </div>
  );
}

// The face's last word on the project: the lamp in its checkpoint colour and the stop in the project's own
// words, or the line it keeps (Masari).
export function StopLine({ project }: { project: Project }) {
  return (
    <p className="sc-stop">
      <span className="li-lamp" aria-hidden="true" />
      <span className="sc-stop__text">{project.checkpoint?.text ?? project.boundary}</span>
    </p>
  );
}

// Where the project stops for a person, as "Inside the build" tells it: a track of its flow with the stop
// lit, the kind of stop and its step, and its own words. A project without a stop shows the line it keeps
// instead, on a dashed track.
export function CheckpointBlock({ project, copy }: { project: Project; copy: ShowcaseCopy }) {
  const flow = project.flow ?? [];
  const checkpoint = project.checkpoint;
  const gate = checkpoint ? checkpoint.step - 1 : -1;
  return (
    <div className={`sc-cp${checkpoint ? "" : " sc-cp--bound"}`}>
      <div className="sc-track" aria-hidden="true">
        {flow.map((step, index) => (
          <i key={step} className={index === gate ? "is-gate" : index < gate ? "is-past" : undefined} />
        ))}
      </div>
      <p className="sc-cp__kind">
        <span className="li-lamp" aria-hidden="true" />
        <span>{checkpoint ? copy.kinds[checkpoint.kind] : copy.boundary}</span>
        {checkpoint ? <span className="sc-cp__step li-num">{copy.step(checkpoint.step, flow.length)}</span> : null}
      </p>
      <p className="sc-cp__text">{checkpoint ? checkpoint.text : project.boundary}</p>
    </div>
  );
}

// The project's flow as numbered steps with its stop marked: the case view's account of where it waits.
export function FlowSteps({ project, copy }: { project: Project; copy: ShowcaseCopy }) {
  const flow = project.flow ?? [];
  const gate = project.checkpoint ? project.checkpoint.step - 1 : -1;
  return (
    <ol className={`sc-flow${project.checkpoint ? "" : " sc-flow--bound"}`} style={{ "--n": flow.length } as CSSProperties}>
      {flow.map((step, index) => (
        <li key={step} className={index === gate ? "is-gate" : undefined}>
          <small className="li-num">{copy.position(index + 1, flow.length)}</small>
          <span>{step}</span>
          {index === gate ? <em>{copy.gate}</em> : null}
        </li>
      ))}
    </ol>
  );
}
