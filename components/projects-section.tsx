import Image from "next/image";
import { ArrowRight, ArrowUpRight, AudioLines, Check, Cpu, Download, FileText, FlaskConical, GitBranch, MessageSquare, Pause, ScanLine, ShieldCheck, WavesHorizontal, X } from "lucide-react";
import { getContent, type Locale, type PortfolioContent } from "@/data/i18n";
import type { Project } from "@/data/portfolio";
import { GitHubIcon } from "./brand-icons";
import { MetaParts } from "./meta-parts";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

// AccessFinish live run, 24 Oct: 15 "booked" pages with the wrong day saved, all rejected by the verifier.
const caughtPages = Array.from({ length: 15 }, (_, index) => index);
// WAREVA demo state: one simulated sensor fails, so the last flow step (irrigation) is held.
const sensorReadings = [true, true, false];

type Copy = PortfolioContent["ui"]["work"];

function ProjectVisual({ project, copy }: { project: Project; copy: Copy }) {
  const v = copy.visuals;
  return (
    <figure className={`work-visual work-visual--${project.slug}`} data-tilt data-cursor={copy.cursor}>
      {project.imagePresentation === "icon" && project.screenshot ? (
        <div className="model-advisor">
          <Image src={project.screenshot} width={150} height={150} alt={v.iconAlt} sizes="150px" loading="eager" fetchPriority="low" />
          <p>{v.mustakshifTitle[0]}<br /><span>{v.mustakshifTitle[1]}</span></p>
          <ol className="model-advisor__path" aria-label={v.mustakshifAria}>
            <li><Cpu aria-hidden="true" /><span>{v.mustakshifPath[0]}</span></li>
            <li><ScanLine aria-hidden="true" /><span>{v.mustakshifPath[1]}</span></li>
            <li><Check aria-hidden="true" /><span>{v.mustakshifPath[2]}</span></li>
          </ol>
        </div>
      ) : project.slug === "accessfinish" ? (
        <div className="repair-blueprint">
          <div className="repair-blueprint__title"><ShieldCheck size={24} aria-hidden="true" /><span>{v.repairTitle[0]}<br />{v.repairTitle[1]}</span></div>
          <ol className="repair-blueprint__pipeline" aria-label={v.repairAria}>
            {project.flow?.map((step, index) => <li key={step}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{step}</li>)}
          </ol>
          <div className="repair-blueprint__trials repair-blueprint__trials--caught">
            <p>{v.trials}</p>
            <ul aria-label={v.trialsAria} dir="ltr">
              {caughtPages.map((index) => (
                <li key={index} className="is-caught"><X size={12} strokeWidth={3} aria-hidden="true" /></li>
              ))}
            </ul>
            <strong>{v.verified}</strong>
          </div>
          <p className="diagram-note">{v.repairNote}</p>
        </div>
      ) : project.slug === "mashhad" ? (
        <div className="motion-blueprint">
          <p className="motion-blueprint__word" lang="ar" dir="rtl">مَشهد</p>
          <div className="motion-blueprint__timeline" aria-hidden="true" dir="ltr">
            <span className="motion-blueprint__playhead" />
            <div><small>scene</small><i style={{ left: "4%", width: "30%" }} /><i style={{ left: "38%", width: "24%" }} /><i style={{ left: "66%", width: "30%" }} /></div>
            <div><small>type</small><i style={{ left: "12%", width: "18%" }} /><i style={{ left: "44%", width: "40%" }} /></div>
            <div><small>sfx</small><i style={{ left: "8%", width: "6%" }} /><i style={{ left: "36%", width: "5%" }} /><i style={{ left: "63%", width: "7%" }} /><i style={{ left: "88%", width: "5%" }} /></div>
          </div>
          <ol className="motion-blueprint__steps" aria-label={v.motionAria}>
            {project.flow?.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p className="diagram-note">{v.motionNote}</p>
        </div>
      ) : project.slug === "mawrid" ? (
        <div className="water-blueprint">
          <div className="water-blueprint__title"><WavesHorizontal size={24} aria-hidden="true" /><span>{v.waterTitle[0]}<br />{v.waterTitle[1]}</span></div>
          <ol className="water-blueprint__flow" aria-label={v.waterAria}>
            {project.flow?.map((step, index, steps) => <li key={step} className={index === steps.length - 1 ? "is-held" : undefined}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{step}</li>)}
          </ol>
          <div className="water-blueprint__readings">
            <p>{v.waterSensors}</p>
            <ul aria-label={v.waterReadingsAria}>
              {sensorReadings.map((ok, index) => (
                <li key={index} className={ok ? "is-ok" : "is-fail"}>{ok ? <Check size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}{v.waterSensor(index + 1)}</li>
              ))}
            </ul>
            <strong><Pause size={17} aria-hidden="true" />{v.waterHeld}</strong>
          </div>
          <p className="diagram-note">{v.waterNote}</p>
        </div>
      ) : project.slug === "rajih-engine" ? (
        <div className="agent-blueprint">
          <div className="agent-blueprint__title"><GitBranch aria-hidden="true" size={22} /><span>{v.rajihTitle[0]}<br />{v.rajihTitle[1]}</span></div>
          <div className="agent-blueprint__branches" aria-label={v.rajihBranchesAria}>{v.rajihBranches.map((branch) => <span key={branch}>{branch}</span>)}</div>
          <div className="agent-blueprint__connector" aria-hidden="true"><i /><i /><i /></div>
          <ol aria-label={v.rajihFlowAria}>{project.flow?.slice(1).map((step) => <li key={step}><span className="flow-dot" aria-hidden="true" />{step}</li>)}</ol>
          <p className="diagram-note">{v.rajihNote}</p>
        </div>
      ) : project.slug === "autoflow" ? (
        <div className="automation-blueprint">
          <div className="automation-blueprint__input"><span><MessageSquare size={20} aria-hidden="true" />{v.autoText}</span><span><AudioLines size={20} aria-hidden="true" />{v.autoVoice}</span></div>
          <div className="automation-blueprint__bridge" aria-hidden="true" />
          <div className="automation-blueprint__draft"><span>{v.autoShared}</span><p>{v.autoIntent}</p><span className="draft-state">{v.autoDraft}</span></div>
          <div className="automation-blueprint__review"><ShieldCheck size={22} aria-hidden="true" /><span>{v.autoReview[0]}<br /><strong>{v.autoReview[1]}</strong></span><ArrowRight aria-hidden="true" /></div>
          <p className="diagram-note">{v.autoNote}</p>
        </div>
      ) : project.slug === "masari" ? (
        <div className="resume-blueprint">
          <div className="resume-blueprint__title"><FileText size={24} aria-hidden="true" /><span>{v.resumeTitle[0]}<br />{v.resumeTitle[1]}</span></div>
          <div className="resume-blueprint__workspace">
            <div className="resume-blueprint__inputs"><span>{v.resumeProfile}</span><div aria-hidden="true"><i /><i /><i /></div><span>{v.resumeExperience}</span><div aria-hidden="true"><i /><i /></div></div>
            <ArrowRight className="resume-blueprint__arrow" size={20} aria-hidden="true" />
            <div className="resume-blueprint__document"><FileText size={25} aria-hidden="true" /><span>{v.resumePreview}</span><div aria-hidden="true"><i /><i /><i /><i /></div></div>
          </div>
          <div className="resume-blueprint__export"><Download size={21} aria-hidden="true" /><span>{v.resumePdf}</span><Check size={19} aria-hidden="true" /></div>
          <p className="diagram-note">{v.resumeNote}</p>
        </div>
      ) : project.screenshot ? (
        <Image src={project.screenshot} alt={v.previewAlt(project.title)} fill sizes="(max-width: 840px) 90vw, 52vw" className="work-visual__image" />
      ) : null}
      <figcaption>{project.category}</figcaption>
    </figure>
  );
}

function ProjectActions({ project, copy }: { project: Project; copy: Copy }) {
  const primary = project.primaryAction ?? (project.liveDemo ? { href: project.liveDemo, label: copy.tryApp } : null);
  return (
    <div className="work-actions">
      {primary ? <a href={primary.href} target="_blank" rel="noreferrer noopener">{primary.label}<ArrowUpRight size={18} aria-hidden="true" /></a> : null}
      {project.repository ? <a href={project.repository} target="_blank" rel="noreferrer noopener" aria-label={copy.sourceAria(project.title)}><GitHubIcon size={17} />{copy.sourceCode}</a> : null}
    </div>
  );
}

export function ProjectsSection({ locale = "en" }: { locale?: Locale }) {
  const { projects, ui } = getContent(locale);
  const copy = ui.work;
  const visible = projects.filter((project) => project.enabled);
  const featured = visible.filter((project) => project.featured);
  const additional = visible.filter((project) => !project.featured);
  const total = String(featured.length).padStart(2, "0");
  return (
    <section id="work" className="work-section">
      <div className="page-shell">
        <SectionHeader title={copy.title} description={copy.description} />
        <nav className="work-index" aria-label={copy.index}>{featured.map((project, index) => <a key={project.slug} href={`#project-${project.slug}`}><span className="work-index__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{project.title}<ArrowDownRight /></a>)}</nav>
        <div className="work-list">
          {featured.map((project, index) => (
            <article className={`work-story work-story--${project.slug}`} id={`project-${project.slug}`} key={project.slug}>
              <Reveal variant="media" className="work-story__visual"><ProjectVisual project={project} copy={copy} /></Reveal>
              <div className="work-story__copy">
                <p className="work-story__index" aria-hidden="true" dir="ltr"><span>{String(index + 1).padStart(2, "0")}</span> / {total}</p>
                <p className="work-status"><span aria-hidden="true" /><MetaParts text={project.status} /></p>
                <h3>{project.title}</h3>
                <p className="work-description">{project.description}</p>
                <p className="work-role">{project.role}</p>
                <ul className="work-tech" aria-label={copy.techAria(project.title)}>{project.technologies.map(tech => <li key={tech}>{tech}</li>)}</ul>
                {project.metrics?.length ? <dl className="work-metrics" aria-label={copy.figuresAria(project.title)}>{project.metrics.map(metric => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl> : null}
                <details className="work-case">
                  <summary>{copy.insideBuild} <span aria-hidden="true">+</span></summary>
                  <div className="work-case__content">
                    <h4>{copy.problem}</h4><p>{project.challenge}</p>
                    <h4>{copy.decision}</h4><p>{project.decision}</p>
                    <h4>{copy.verify}</h4><p>{project.evidence}</p>
                  </div>
                </details>
                <ProjectActions project={project} copy={copy} />
              </div>
            </article>
          ))}
        </div>
        <div className="lab">
          <div className="lab__header">
            <h3><FlaskConical size={22} aria-hidden="true" /> {copy.labTitle}</h3>
            <p>{copy.labDescription}</p>
          </div>
          <div className="lab-grid">
            {additional.map((project, index) => (
              <Reveal key={project.slug} delay={index * 50} className="lab-card-shell">
                <article className="lab-card glow-card" id={`project-${project.slug}`}>
                  <p className="lab-card__status"><MetaParts text={project.status} /></p>
                  <h4>{project.title}</h4>
                  <p className="lab-card__category">{project.category}</p>
                  <p className="lab-card__description">{project.description}</p>
                  {project.technologies.length ? <ul className="lab-card__tech" aria-label={copy.techAria(project.title)}>{project.technologies.slice(0, 4).map((tech) => <li key={tech}>{tech}</li>)}</ul> : null}
                  <ProjectActions project={project} copy={copy} />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowDownRight() {
  return <ArrowUpRight size={17} aria-hidden="true" className="work-index__arrow" />;
}
