import { ArrowUpRight } from "lucide-react";
import { getContent, type Locale, type PortfolioContent } from "@/data/i18n";
import type { Project } from "@/data/portfolio";
import { GitHubIcon } from "./brand-icons";
import { MetaParts } from "./meta-parts";
import { Reveal } from "./reveal";
import { ChapterEyebrow } from "./section-header";
import { Showcase } from "./showcase";

type Copy = PortfolioContent["ui"]["work"];

const pad = (value: number) => String(value).padStart(2, "0");

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

// Chapter 01, "Try these first": the featured six (components/showcase.tsx), then the smaller builds folded
// behind one row that names them all. The row is a single <details> (folds stay one level deep), so the
// assistant, the palette and a shared link to #project-rajih-engine open it (lib/agent/reveal.ts). The
// section's light (.sc-light) takes the colour of the project most in view.
export function ProjectsSection({ locale = "en" }: { locale?: Locale }) {
  const { projects, ui } = getContent(locale);
  const copy = ui.work;
  const additional = projects.filter((project) => project.enabled && !project.featured);
  return (
    <section id="work" className="work-section sc-section li-chapter" aria-labelledby="work-title">
      <div className="sc-light" aria-hidden="true" />
      <div className="page-shell">
        <header className="sc-head">
          <Reveal variant="title" className="sc-head__title">
            <ChapterEyebrow text={copy.index} className="sc-head__eyebrow" />
            <h2 id="work-title" className="sc-head__h2">{copy.title}</h2>
          </Reveal>
          <p className="sc-head__lede">{copy.description}</p>
        </header>
        <Showcase locale={locale} />
        {additional.length ? (
          // The browser opens the row by itself when a link lands on a card inside it (#project-rajih-engine),
          // before hydration; that open state is the visitor's, so React leaves it alone.
          <details className="sc-labrow" suppressHydrationWarning>
            <summary className="sc-labrow__summary">
              <span className="sc-labrow__text">
                <h3 className="sc-labrow__title">
                  <span>{copy.labTitle}</span>
                  <span className="sc-labrow__count li-num" aria-hidden="true"> · {pad(additional.length)}</span>
                </h3>
                <span className="sc-labrow__names"><MetaParts text={additional.map((project) => project.title).join(" · ")} /></span>
              </span>
              <span className="sc-labrow__plus" aria-hidden="true" />
            </summary>
            <div className="sc-labrow__body">
              <p className="sc-labrow__lead">{copy.labDescription}</p>
              <div className="sc-lab__grid">
                {additional.map((project) => (
                  <article key={project.slug} className="sc-lab__card li-glass" id={`project-${project.slug}`}>
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
                ))}
              </div>
            </div>
          </details>
        ) : null}
      </div>
    </section>
  );
}
