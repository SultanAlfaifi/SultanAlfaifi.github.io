import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getPortfolioAsset, projects, type Project } from "@/data/portfolio";
import { GitHubIcon } from "./brand-icons";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

function ProjectMedia({ project }: { project: Project }) {
  const asset = getPortfolioAsset(project.brandAssetId);

  return (
    <div className="project-signal">
      {project.screenshot ? (
        <Image
          className="project-signal__media"
          src={project.screenshot}
          alt={`${project.title} project visual`}
          fill
          priority={project.flagship}
          fetchPriority={project.flagship ? "high" : "auto"}
          sizes="(max-width: 840px) 100vw, 82vw"
          style={{ objectFit: "contain", objectPosition: "center" }}
        />
      ) : asset ? (
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
            priority={project.flagship}
            fetchPriority={project.flagship ? "high" : "auto"}
            sizes={project.flagship ? "(max-width: 840px) 70vw, 32vw" : "220px"}
            style={{ objectPosition: asset.objectPosition }}
          />
        </div>
      ) : null}
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
  const longTitle = project.title.length > 20;

  return (
    <article
      className={`project-card project-card--${project.slug} ${project.flagship ? "project-card--flagship" : ""} ${longTitle ? "project-card--long-title" : ""}`}
    >
      <ProjectMedia project={project} />

      <div className="project-card__body">
        <div className="project-card__lead">
          <div className="project-card__meta">
            <span>{project.category}</span>
            <span>{project.role}</span>
          </div>
          <h3>{project.title}</h3>
          <p className="project-card__description">{project.description}</p>
        </div>

        <div className="project-card__support">
          {project.metrics?.length ? (
            <dl className="project-card__metrics" aria-label={`${project.title} usage metrics`}>
              {project.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

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
      </div>
    </article>
  );
}

export function ProjectsSection() {
  const projectOrder = ["masari", "tabayun", "danna", "kaust-ai-projects"];
  const visibleProjects = projects
    .filter((project) => project.enabled)
    .toSorted(
      (projectA, projectB) =>
        projectOrder.indexOf(projectA.slug) - projectOrder.indexOf(projectB.slug)
    );

  return (
    <section id="work" className="section section--ink">
      <div className="page-shell">
        <SectionHeader
          eyebrow="Selected systems"
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
              variant="media"
            >
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
