import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getPortfolioAsset, projects, type Project } from "@/data/portfolio";
import { GitHubIcon } from "./brand-icons";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

function ProjectSignal({ project }: { project: Project }) {
  const asset = getPortfolioAsset(project.brandAssetId);

  return (
    <div className="project-signal" aria-hidden="true">
      <span className="project-signal__label">{project.slug.toUpperCase()}</span>
      <div className="project-signal__rail">
        <span />
        <span />
        <span />
        <span />
      </div>
      {asset ? (
        <div
          className={`project-signal__brand-tile ${
            asset.displayRole === "supporting"
              ? "project-signal__brand-tile--supporting"
              : asset.displayRole === "organization"
                ? "project-signal__brand-tile--context"
                : ""
          }`}
          style={{ "--asset-scale": asset.visualScale } as React.CSSProperties}
        >
          <Image
            src={asset.derived.color}
            alt={asset.alt}
            fill
            sizes={project.flagship ? "(max-width: 840px) 70vw, 32vw" : "220px"}
            style={{ objectPosition: asset.objectPosition }}
          />
        </div>
      ) : null}
      <p>{project.flagship ? "CONVERSATION ROUTE" : "VERIFIED PROJECT NODE"}</p>
    </div>
  );
}

function ProjectActions({ project }: { project: Project }) {
  if (!project.repository && !project.liveDemo) return null;

  return (
    <div className="project-card__actions">
      {project.repository ? (
        <a
          href={project.repository}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`View ${project.title} repository on GitHub`}
        >
          <GitHubIcon size={17} /> View Repository
          <ArrowUpRight aria-hidden="true" size={15} />
        </a>
      ) : null}
      {project.liveDemo ? (
        <a
          href={project.liveDemo}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Open the live ${project.title} application`}
        >
          Live Application <ArrowUpRight aria-hidden="true" size={15} />
        </a>
      ) : null}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className={`project-card ${project.flagship ? "project-card--flagship" : ""}`}>
      <ProjectSignal project={project} />

      <div className="project-card__body">
        <div className="project-card__meta">
          <span>{project.category}</span>
          <span>{project.role}</span>
        </div>
        <h3>{project.title}</h3>
        <p className="project-card__description">{project.description}</p>

        {project.outcome ? (
          <p className="project-card__outcome">
            <span>Concrete outcome</span>
            {project.outcome}
          </p>
        ) : null}

        {project.technologies.length ? (
          <ul className="tag-list" aria-label={`${project.title} technologies`}>
            {project.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        ) : null}

        <details className="project-card__details">
          <summary>Technical context</summary>
          <ul>
            {project.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </details>

        <ProjectActions project={project} />
      </div>
    </article>
  );
}

export function ProjectsSection() {
  const visibleProjects = projects.filter((project) => project.enabled);

  return (
    <section id="work" className="section section--ink">
      <div className="page-shell">
        <SectionHeader
          eyebrow="Selected systems / 03"
          title="Selected Work"
          description="A curated selection of projects I understand, trust, and can confidently explain."
          inverse
        />

        <div className="projects-grid">
          {visibleProjects.map((project, index) => (
            <Reveal
              key={project.slug}
              className={project.flagship ? "projects-grid__flagship" : ""}
              delay={Math.min(index * 80, 200)}
            >
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
