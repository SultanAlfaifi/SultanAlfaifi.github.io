import Image from "next/image";
import { ArrowRight, ArrowUpRight, AudioLines, Check, Cpu, Download, FileText, GitBranch, MessageSquare, ScanLine, ShieldCheck } from "lucide-react";
import { projects, type Project } from "@/data/portfolio";
import { GitHubIcon } from "./brand-icons";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

function ProjectVisual({ project }: { project: Project }) {
  return (
    <figure className={`work-visual work-visual--${project.slug}`}>
      {project.imagePresentation === "icon" && project.screenshot ? (
        <div className="model-advisor">
          <Image src={project.screenshot} width={150} height={150} alt="Mustakshif application icon" sizes="150px" loading="eager" fetchPriority="low" />
          <p>The right model.<br /><span>For your machine.</span></p>
          <ol className="model-advisor__path" aria-label="Mustakshif recommendation process">
            <li><Cpu aria-hidden="true" /><span>Your hardware</span></li>
            <li><ScanLine aria-hidden="true" /><span>Your goals</span></li>
            <li><Check aria-hidden="true" /><span>Explained fit</span></li>
          </ol>
        </div>
      ) : project.slug === "rajih-engine" ? (
        <div className="agent-blueprint">
          <div className="agent-blueprint__title"><GitBranch aria-hidden="true" size={22} /><span>Many perspectives.<br />One traceable decision.</span></div>
          <div className="agent-blueprint__branches" aria-label="Independent ideation perspectives"><span>Grounded</span><span>Transformational</span><span>Demo-first</span></div>
          <div className="agent-blueprint__connector" aria-hidden="true"><i /><i /><i /></div>
          <ol aria-label="RAJIH decision workflow">{project.flow?.slice(1).map((step) => <li key={step}><span className="flow-dot" aria-hidden="true" />{step}</li>)}</ol>
          <p className="diagram-note">Shared state. Recorded reasoning. Human judgment.</p>
        </div>
      ) : project.slug === "autoflow" ? (
        <div className="automation-blueprint">
          <div className="automation-blueprint__input"><span><MessageSquare size={20} aria-hidden="true" />Text</span><span><AudioLines size={20} aria-hidden="true" />Voice</span></div>
          <div className="automation-blueprint__bridge" aria-hidden="true" />
          <div className="automation-blueprint__draft"><span>One shared workflow</span><p>Your intent, made clear.</p><span className="draft-state">Draft · Inactive</span></div>
          <div className="automation-blueprint__review"><ShieldCheck size={22} aria-hidden="true" /><span>You review.<br /><strong>You decide.</strong></span><ArrowRight aria-hidden="true" /></div>
          <p className="diagram-note">Prototype workflow · Financial actions are simulated</p>
        </div>
      ) : project.slug === "masari" ? (
        <div className="resume-blueprint">
          <div className="resume-blueprint__title"><FileText size={24} aria-hidden="true" /><span>Your experience.<br />Ready for the next step.</span></div>
          <div className="resume-blueprint__workspace">
            <div className="resume-blueprint__inputs"><span>Profile details</span><div aria-hidden="true"><i /><i /><i /></div><span>Experience & skills</span><div aria-hidden="true"><i /><i /></div></div>
            <ArrowRight className="resume-blueprint__arrow" size={20} aria-hidden="true" />
            <div className="resume-blueprint__document"><FileText size={25} aria-hidden="true" /><span>Live preview</span><div aria-hidden="true"><i /><i /><i /><i /></div></div>
          </div>
          <div className="resume-blueprint__export"><Download size={21} aria-hidden="true" /><span>Print-ready PDF</span><Check size={19} aria-hidden="true" /></div>
          <p className="diagram-note">Created in your browser. Kept on your device.</p>
        </div>
      ) : project.screenshot ? (
        <Image src={project.screenshot} alt={`${project.title} application preview`} fill sizes="(max-width: 840px) 90vw, 52vw" className="work-visual__image" />
      ) : null}
      <figcaption>{project.category}</figcaption>
    </figure>
  );
}

function ProjectActions({ project }: { project: Project }) {
  const primary = project.primaryAction ?? (project.liveDemo ? { href: project.liveDemo, label: "Try the application" } : null);
  return (
    <div className="work-actions">
      {primary ? <a href={primary.href} target="_blank" rel="noreferrer noopener">{primary.label}<ArrowUpRight size={18} aria-hidden="true" /></a> : null}
      {project.repository ? <a href={project.repository} target="_blank" rel="noreferrer noopener" aria-label={`View ${project.title} source on GitHub`}><GitHubIcon size={17} />Source code</a> : null}
    </div>
  );
}

export function ProjectsSection() {
  const visible = projects.filter((project) => project.enabled);
  const featured = visible.filter((project) => project.featured);
  const additional = visible.filter((project) => !project.featured);
  return (
    <section id="work" className="work-section">
      <div className="page-shell">
        <SectionHeader title="Selected work." description="Useful products. Inspectable systems. Built from the idea through the details." />
        <nav className="work-index" aria-label="Featured projects">{featured.map((project) => <a key={project.slug} href={`#project-${project.slug}`}>{project.title}<ArrowDownRight /></a>)}</nav>
        <div className="work-list">
          {featured.map((project) => (
            <article className={`work-story work-story--${project.slug}`} id={`project-${project.slug}`} key={project.slug}>
              <Reveal variant="media" className="work-story__visual"><ProjectVisual project={project} /></Reveal>
              <div className="work-story__copy">
                <p className="work-status"><span aria-hidden="true" />{project.status}</p>
                <h3>{project.title}</h3>
                <p className="work-description">{project.description}</p>
                <p className="work-role">{project.role}</p>
                <ul className="work-tech" aria-label={`${project.title} technologies`}>{project.technologies.map(tech => <li key={tech}>{tech}</li>)}</ul>
                {project.metrics?.length ? <dl className="work-metrics" aria-label={`${project.title} usage metrics`}>{project.metrics.map(metric => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl> : null}
                <details className="work-case">
                  <summary>Inside the build <span aria-hidden="true">+</span></summary>
                  <div className="work-case__content">
                    <h4>The problem</h4><p>{project.challenge}</p>
                    <h4>The engineering decision</h4><p>{project.decision}</p>
                    <h4>What you can verify</h4><p>{project.evidence}</p>
                  </div>
                </details>
                <ProjectActions project={project} />
              </div>
            </article>
          ))}
        </div>
        <details className="additional-work">
          <summary>More work <span>DANNA, Tabayun & applied ML <span aria-hidden="true">+</span></span></summary>
          <div className="additional-work__list">{additional.map(project => <article key={project.slug}><div><h3>{project.title}</h3><p className="additional-work__status">{project.status}</p></div><div><p>{project.description}</p><details className="work-case"><summary>Project context <span aria-hidden="true">+</span></summary><ul>{project.highlights.map(point => <li key={point}>{point}</li>)}</ul></details><ProjectActions project={project} /></div></article>)}</div>
        </details>
      </div>
    </section>
  );
}

function ArrowDownRight() {
  return <ArrowUpRight size={17} aria-hidden="true" className="work-index__arrow" />;
}
