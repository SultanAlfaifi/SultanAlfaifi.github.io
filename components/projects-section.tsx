import { ArrowUpRight, FlaskConical } from "lucide-react";
import { getContent, type Locale, type PortfolioContent } from "@/data/i18n";
import type { CheckpointKind, Project } from "@/data/portfolio";
import { GitHubIcon } from "./brand-icons";
import { MetaParts } from "./meta-parts";
import { Reveal } from "./reveal";
import { Showcase } from "./showcase";
import { showcaseOrder } from "./showcase-parts";

type Copy = PortfolioContent["ui"]["work"];

const KINDS: CheckpointKind[] = ["asks", "verifies", "holds"];

function LabActions({ project, copy }: { project: Project; copy: Copy }) {
  const primary = project.primaryAction ?? (project.liveDemo ? { href: project.liveDemo, label: copy.tryApp } : null);
  if (!primary && !project.repository) return null;
  return (
    <div className="sc-lab__actions">
      {primary ? <a className="sc-link sc-link--primary" href={primary.href} target="_blank" rel="noreferrer noopener">{primary.label}<ArrowUpRight size={16} aria-hidden="true" /></a> : null}
      {project.repository ? <a className="sc-link" href={project.repository} target="_blank" rel="noreferrer noopener" aria-label={copy.sourceAria(project.title)}><GitHubIcon size={16} />{copy.sourceCode}</a> : null}
    </div>
  );
}

// "Try these first": the featured six (components/showcase.tsx) under a legend of where each one stops
// for a person, then the smaller builds. The section's light (.sc-light) takes the colour of the project
// most in view.
export function ProjectsSection({ locale = "en" }: { locale?: Locale }) {
  const { projects, ui } = getContent(locale);
  const copy = ui.work;
  const s = copy.showcase;
  const visible = projects.filter((project) => project.enabled);
  const featured = showcaseOrder(visible.filter((project) => project.featured));
  const additional = visible.filter((project) => !project.featured);
  const count = (kind: CheckpointKind | "bound") => featured.filter((project) => (project.checkpoint?.kind ?? "bound") === kind).length;
  return (
    <section id="work" className="work-section sc-section" aria-labelledby="work-title">
      <div className="sc-light" aria-hidden="true" />
      <div className="page-shell">
        <header className="sc-head">
          <Reveal variant="title" className="sc-head__title">
            <p className="li-eyebrow sc-head__eyebrow">{s.count(featured.length)}</p>
            <h2 id="work-title" className="sc-head__h2">{copy.title}</h2>
          </Reveal>
          <p className="sc-head__lede">{copy.description}</p>
        </header>
        <div className="sc-legend li-glass" role="group" aria-label={s.legendAria}>
          <p className="sc-legend__title">{s.legend}</p>
          <ul>
            {KINDS.map((kind) => (
              <li key={kind} className={`li-k-${kind}`}>
                <span className="li-lamp" aria-hidden="true" />
                <span>{s.kinds[kind]}</span>
                <small className="li-num">{s.projects(count(kind))}</small>
              </li>
            ))}
            <li className="li-k-bound sc-legend__bound">
              <span className="li-lamp" aria-hidden="true" />
              <span>{s.boundary}</span>
              <small className="li-num">{s.projects(count("bound"))}</small>
            </li>
          </ul>
        </div>
        <Showcase locale={locale} />
        <div className="sc-lab">
          <div className="sc-lab__head">
            <h3><FlaskConical size={22} aria-hidden="true" /> {copy.labTitle}</h3>
            <p>{copy.labDescription}</p>
          </div>
          <div className="sc-lab__grid">
            {additional.map((project, index) => (
              <Reveal key={project.slug} delay={index * 50} className="sc-lab__cell">
                <article className="sc-lab__card li-glass li-glass--light" id={`project-${project.slug}`}>
                  <p className="sc-lab__status"><MetaParts text={project.status} /></p>
                  <h4>{project.title}</h4>
                  <p className="sc-lab__category">{project.category}</p>
                  <p className="sc-lab__description">{project.description}</p>
                  {project.technologies.length ? (
                    <ul className="sc-chips" aria-label={copy.techAria(project.title)}>
                      {project.technologies.slice(0, 4).map((tech) => <li key={tech}>{tech}</li>)}
                    </ul>
                  ) : null}
                  <LabActions project={project} copy={copy} />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
