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

// The figures a tile leads with. AccessFinish leads with its two real-bug results, the one its wall
// shows first (the data lists "0 of 7" before "15 / 15"); every other project with its first figure.
// Projects without figures show their status instead.
export function leadFigures(project: Project): ProjectMetric[] {
  const metrics = project.metrics ?? [];
  if (project.slug === "accessfinish") return metrics.filter((metric) => metric.kind === "real-bug").reverse().slice(0, 2);
  return metrics.slice(0, 1);
}

export function primaryLink(project: Project, copy: WorkCopy) {
  return project.primaryAction ?? (project.liveDemo ? { href: project.liveDemo, label: copy.tryApp } : null);
}

// "15 / 15", "0 من 7", "About 1,600", "1,000 L/h": numerals large, words and signs small, on one line.
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

// A number with what it is: its kind as a tag (unless its own note already says it), its label, its
// note, its date, and the public place to check it.
export function Figure({ metric, copy, className = "" }: { metric: ProjectMetric; copy: ShowcaseCopy; className?: string }) {
  const tag = metric.kind && !metric.note ? copy.tags[metric.kind] : null;
  return (
    <div className={`sc-fig ${className}`}>
      {tag ? <span className={`sc-tag sc-tag--${metric.kind}`}>{tag}</span> : null}
      <p className="sc-fig__value"><FigureValue value={metric.value} /></p>
      <p className="sc-fig__label">{metric.label}</p>
      {metric.note ? <p className="sc-fig__note">{metric.note}</p> : null}
      {metric.asOf ? <p className="sc-fig__note">{copy.asOf(metric.asOf)}</p> : null}
      {metric.href ? (
        <a className="sc-fig__check" href={metric.href} target="_blank" rel="noreferrer noopener">{copy.verifyOn}</a>
      ) : null}
    </div>
  );
}

// Where the project stops for a person: a track of its flow with the stop lit, the kind of stop, and
// its own words. A project without a stop shows the line it keeps instead, on a dashed track.
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
