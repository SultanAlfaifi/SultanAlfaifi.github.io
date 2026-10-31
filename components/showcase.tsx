"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type RefObject } from "react";
import { flushSync } from "react-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import type { Project } from "@/data/portfolio";
import { GitHubIcon } from "./brand-icons";
import { MetaParts } from "./meta-parts";
import { motionAllowed, subscribeMotion } from "./motion-preference";
import { ShowcaseDemo, type DemoPhase } from "./showcase-demos";
import {
  accentPair,
  accentStyle,
  CheckpointBlock,
  Figure,
  FlowSteps,
  kindClass,
  leadFigures,
  primaryLink,
  showcaseOrder,
  type WorkCopy
} from "./showcase-parts";

// The featured six: AccessFinish as a full-width feature, then a varied glass grid. Every tile is in the
// server HTML in its finished state, with its full case text in a <details> (so it works without
// JavaScript, and the assistant can open it to light the words it quotes). With JavaScript, "Inside the
// build" opens a case view that grows out of the tile.

const subscribeNothing = () => () => undefined;
const pad = (value: number) => String(value).padStart(2, "0");
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function onScreen(element: Element) {
  const rect = element.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
}

function canMorph() {
  return motionAllowed() && typeof document.startViewTransition === "function";
}

/* ---------- The case text, shared by a tile's <details> and the case view ---------- */
function Meta({ project, copy }: { project: Project; copy: WorkCopy }) {
  return (
    <dl className="sc-meta">
      <div><dt>{copy.showcase.status}</dt><dd><MetaParts text={project.status} /></dd></div>
      <div><dt>{copy.showcase.role}</dt><dd><MetaParts text={project.role} /></dd></div>
    </dl>
  );
}

function CaseDetails({ project, copy, level }: { project: Project; copy: WorkCopy; level: "h3" | "h4" }) {
  const s = copy.showcase;
  const Heading = level;
  return (
    <>
      {level === "h4" ? <Meta project={project} copy={copy} /> : null}
      <div className="sc-three">
        <section><Heading>{copy.problem}</Heading><p>{project.challenge}</p></section>
        <section><Heading>{copy.decision}</Heading><p>{project.decision}</p></section>
        <section><Heading>{copy.verify}</Heading><p>{project.evidence}</p></section>
      </div>
      {project.metrics?.length ? (
        <section className="sc-numbers">
          <Heading>{s.figures}</Heading>
          <div className="sc-numbers__grid">
            {project.metrics.map((metric) => <Figure key={metric.label} metric={metric} copy={s} className="sc-fig--cell" />)}
          </div>
        </section>
      ) : null}
      <div className="sc-extra">
        <section>
          <Heading>{s.more}</Heading>
          <ul className="sc-points">{project.highlights.map((point) => <li key={point}>{point}</li>)}</ul>
          {project.technologies.length ? (
            <>
              <Heading className="sc-tech">{s.tech}</Heading>
              <ul className="sc-chips" aria-label={copy.techAria(project.title)}>
                {project.technologies.map((tech) => <li key={tech}>{tech}</li>)}
              </ul>
            </>
          ) : null}
        </section>
        {project.caveat ? (
          <aside className="sc-caveat">
            <Heading>{s.caveat}</Heading>
            <p>{project.caveat}</p>
          </aside>
        ) : null}
      </div>
    </>
  );
}

function Links({ project, copy, size }: { project: Project; copy: WorkCopy; size: "tile" | "big" }) {
  const primary = primaryLink(project, copy);
  const big = size === "big";
  return (
    <>
      {primary ? (
        <a className={big ? "li-btn li-btn--primary" : "sc-link sc-link--primary"} href={primary.href} target="_blank" rel="noreferrer noopener">
          {primary.label}<ArrowUpRight size={16} aria-hidden="true" />
        </a>
      ) : null}
      {project.repository ? (
        <a className={big ? "li-btn li-btn--ghost" : "sc-link"} href={project.repository} target="_blank" rel="noreferrer noopener" aria-label={copy.sourceAria(project.title)}>
          <GitHubIcon size={16} />{copy.sourceCode}
        </a>
      ) : null}
    </>
  );
}

/* ---------- One tile ---------- */
type TileProps = {
  project: Project;
  index: number;
  copy: WorkCopy;
  feature: boolean;
  hydrated: boolean;
  onOpen: (index: number) => void;
  register: (index: number, element: HTMLElement | null) => void;
};

function Tile({ project, index, copy, feature, hydrated, onOpen, register }: TileProps) {
  const s = copy.showcase;
  const ref = useRef<HTMLElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const played = useRef(false);
  const [phase, setPhase] = useState<DemoPhase>("rest");
  const [run, setRun] = useState(0);
  const [inView, setInView] = useState(false);
  const figures = leadFigures(project);

  useEffect(() => {
    register(index, ref.current);
    return () => register(index, null);
  }, [index, register]);

  useEffect(() => {
    const tile = ref.current;
    const demo = demoRef.current;
    if (!tile || !demo || !("IntersectionObserver" in window)) return;
    // The feature's wall is tall, so it starts once a third of it shows; the smaller demos at half.
    const enough = feature ? 0.35 : 0.5;
    // Primed to its first frame while still off screen, so the rewind never happens in front of anyone.
    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!played.current && motionAllowed()) setPhase((current) => (current === "rest" ? "primed" : current));
      } else {
        played.current = false;
        setPhase("rest");
      }
    }, { rootMargin: "25% 0px 25% 0px" });
    // Plays once it is properly in view, then rests on its stop with the tile lit.
    const seen = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting && entry.intersectionRatio >= enough && !played.current && motionAllowed()) {
        played.current = true;
        setRun((count) => count + 1);
        setPhase("playing");
      }
    }, { threshold: [0, enough] });
    // A soft rise the first time a tile arrives from below; the HTML is already visible without it.
    const arrive = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      arrive.disconnect();
      if (!motionAllowed() || !tile.animate || entry.boundingClientRect.top < window.innerHeight * 0.6) return;
      tile.animate([{ opacity: 0, transform: "translateY(40px) scale(0.985)" }, { opacity: 1, transform: "none" }], { duration: 900, easing: EASE, fill: "backwards" });
    }, { rootMargin: "0px 0px 80px 0px" });
    near.observe(demo);
    seen.observe(demo);
    if (!onScreen(tile)) arrive.observe(tile);
    const stop = subscribeMotion(() => {
      if (!motionAllowed()) setPhase("rest");
    });
    return () => {
      near.disconnect();
      seen.disconnect();
      arrive.disconnect();
      stop();
    };
  }, [feature]);

  // The whole tile opens the case (a tap on a phone); links, buttons and the open details keep their own.
  function handleClick(event: MouseEvent<HTMLElement>) {
    if (!hydrated || event.defaultPrevented) return;
    if ((event.target as Element).closest("a, button, summary, .sc-more[open]")) return;
    if (window.getSelection()?.toString()) return;
    onOpen(index);
  }

  const lit = inView && phase === "rest";
  const titleId = `sc-title-${project.slug}`;
  return (
    <article
      ref={ref}
      id={`project-${project.slug}`}
      className={`sc-tile${feature ? " sc-feature" : ""} li-glass li-glass--light ${kindClass(project)}${lit ? " is-lit" : ""}${hydrated ? " is-live" : ""}`}
      style={accentStyle(project.slug)}
      data-slug={project.slug}
      data-cursor={hydrated ? copy.cursor : undefined}
      aria-labelledby={titleId}
      onClick={handleClick}
    >
      <span className="sc-edge" aria-hidden="true" />
      <header className="sc-tile__head">
        <p className="sc-tile__meta"><span className="sc-tile__no li-num">{pad(index + 1)}</span><span>{project.category}</span></p>
        <h3 id={titleId} className="sc-tile__title">
          {project.imagePresentation === "icon" && project.screenshot ? (
            <Image className="sc-tile__icon" src={project.screenshot} alt="" width={96} height={96} sizes="48px" />
          ) : null}
          <span>{project.title}</span>
        </h3>
        {feature ? <p className="sc-tile__status"><span className="li-lamp" aria-hidden="true" /><MetaParts text={project.status} /></p> : null}
      </header>
      {feature ? <p className="sc-tile__desc">{project.description}</p> : null}
      <div className="sc-demo" ref={demoRef}>
        <ShowcaseDemo key={run} project={project} copy={copy} phase={phase} onDone={() => setPhase("rest")} />
      </div>
      <div className={`sc-figs${figures.length > 1 ? " sc-figs--two" : ""}`}>
        {figures.length ? (
          figures.map((metric) => <Figure key={metric.label} metric={metric} copy={s} />)
        ) : (
          <ul className="sc-facts">{(project.status ?? "").split(" · ").map((part) => <li key={part}>{part}</li>)}</ul>
        )}
      </div>
      <CheckpointBlock project={project} copy={s} />
      <div className="sc-actions">
        {hydrated ? (
          <button type="button" className="sc-open" aria-haspopup="dialog" aria-label={s.openAria(project.title)} onClick={() => onOpen(index)}>
            <span>{s.open}</span>
            <ChevronRight className="sc-flip" size={18} aria-hidden="true" />
          </button>
        ) : null}
        <span className="sc-links">
          <Links project={project} copy={copy} size={feature ? "big" : "tile"} />
        </span>
      </div>
      <details className="sc-more">
        <summary><span className="sc-more__show">{s.open}</span><span className="sc-more__hide">{s.hide}</span></summary>
        <div className="sc-more__body">
          {feature ? null : <p className="sc-more__desc">{project.description}</p>}
          <CaseDetails project={project} copy={copy} level="h4" />
        </div>
      </details>
    </article>
  );
}

/* ---------- The case view ---------- */
type CaseProps = {
  project: Project;
  index: number;
  total: number;
  copy: WorkCopy;
  run: number;
  phase: DemoPhase;
  onDone: () => void;
  onStep: (delta: number) => void;
  onClose: () => void;
  closeRef: RefObject<HTMLButtonElement | null>;
};

function CaseView({ project, index, total, copy, run, phase, onDone, onStep, onClose, closeRef }: CaseProps) {
  const s = copy.showcase;
  const figures = leadFigures(project);
  return (
    <>
      <div className="sc-case__bar">
        <p className="sc-case__crumb"><span className="li-lamp" aria-hidden="true" />{copy.index} · <span className="li-num">{s.position(index + 1, total)}</span></p>
        <div className="sc-case__nav">
          <button type="button" className="sc-icon" aria-label={s.previous} onClick={() => onStep(-1)}><ChevronLeft className="sc-flip" size={18} aria-hidden="true" /></button>
          <button type="button" className="sc-icon" aria-label={s.next} onClick={() => onStep(1)}><ChevronRight className="sc-flip" size={18} aria-hidden="true" /></button>
          <button type="button" className="sc-icon" aria-label={s.close} onClick={onClose} ref={closeRef}><X size={18} aria-hidden="true" /></button>
        </div>
      </div>
      <div className="sc-case__body">
        <header className="sc-case__head">
          <div className="sc-case__intro">
            <p className="li-eyebrow">{project.category}</p>
            <h2 id="sc-case-title" className="sc-case__title">
              {project.imagePresentation === "icon" && project.screenshot ? (
                <Image className="sc-tile__icon" src={project.screenshot} alt="" width={128} height={128} sizes="64px" />
              ) : null}
              <span>{project.title}</span>
            </h2>
            <p className="sc-case__desc">{project.description}</p>
            <Meta project={project} copy={copy} />
            <div className="sc-case__links"><Links project={project} copy={copy} size="big" /></div>
            {figures.length ? (
              <div className={`sc-figs${figures.length > 1 ? " sc-figs--two" : ""}`}>
                {figures.map((metric) => <Figure key={metric.label} metric={metric} copy={s} />)}
              </div>
            ) : null}
          </div>
          <div className="sc-case__visual">
            <div className="sc-demo">
              <ShowcaseDemo key={run} project={project} copy={copy} phase={phase} onDone={onDone} />
            </div>
          </div>
        </header>
        <section className="sc-case__stop">
          <h3>{s.legend}</h3>
          <FlowSteps project={project} copy={s} />
          <CheckpointBlock project={project} copy={s} />
        </section>
        <CaseDetails project={project} copy={copy} level="h3" />
        {project.slug === "masari" && project.screenshot ? (
          <figure className="sc-shot">
            <Image src={project.screenshot} alt={s.screenshotAlt(project.title)} width={1586} height={992} sizes="(max-width: 900px) 92vw, 1040px" />
          </figure>
        ) : null}
      </div>
    </>
  );
}

/* ---------- The showcase ---------- */
export function Showcase({ locale = "en" }: { locale?: Locale }) {
  const { projects, ui } = getContent(locale);
  const copy = ui.work;
  const list = showcaseOrder(projects);
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const tiles = useRef<(HTMLElement | null)[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [caseRun, setCaseRun] = useState(0);
  const [casePhase, setCasePhase] = useState<DemoPhase>("rest");

  const register = useCallback((index: number, element: HTMLElement | null) => {
    tiles.current[index] = element;
  }, []);

  // The section's light takes the colour of the project most in view.
  useEffect(() => {
    const light = document.querySelector<HTMLElement>("#work .sc-light");
    const elements = tiles.current.filter((element): element is HTMLElement => Boolean(element));
    if (!light || !elements.length || !("IntersectionObserver" in window)) return;
    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio * Math.min(1, entry.boundingClientRect.height / window.innerHeight + 0.4) : 0);
      let best: Element | null = null;
      let top = 0;
      for (const [element, ratio] of ratios) if (ratio > top) { best = element; top = ratio; }
      const slug = (best as HTMLElement | null)?.dataset.slug;
      if (!slug) return;
      const [main, second] = accentPair(slug);
      light.style.setProperty("--sc-a", `var(--li-${main})`);
      light.style.setProperty("--sc-b", `var(--li-${second})`);
    }, { threshold: [0, 0.15, 0.3, 0.5, 0.7, 0.9] });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => document.documentElement.classList.remove("sc-locked"), []);

  function show(index: number) {
    openRef.current = index;
    flushSync(() => {
      setOpen(index);
      setCaseRun((count) => count + 1);
      setCasePhase(motionAllowed() ? "playing" : "rest");
    });
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    document.documentElement.classList.add("sc-locked");
    sheetRef.current?.scrollTo(0, 0);
    closeRef.current?.focus({ preventScroll: true });
  }

  function openCase(index: number) {
    const tile = tiles.current[index];
    const sheet = sheetRef.current;
    if (tile && sheet && canMorph() && onScreen(tile)) {
      tile.style.viewTransitionName = "sc-case";
      const transition = document.startViewTransition(() => {
        tile.style.viewTransitionName = "";
        show(index);
        sheet.style.viewTransitionName = "sc-case";
      });
      transition.finished.finally(() => { sheet.style.viewTransitionName = ""; });
      return;
    }
    show(index);
    if (motionAllowed() && sheet?.animate) {
      sheet.animate([{ opacity: 0, transform: "translateY(18px) scale(0.985)" }, { opacity: 1, transform: "none" }], { duration: 460, easing: EASE });
    }
  }

  function hide() {
    const index = openRef.current;
    openRef.current = null;
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    flushSync(() => {
      setOpen(null);
      setCasePhase("rest");
    });
    document.documentElement.classList.remove("sc-locked");
    const tile = index === null ? null : tiles.current[index];
    if (tile && !onScreen(tile)) tile.scrollIntoView({ block: "center" });
    return tile;
  }

  function closeCase() {
    const index = openRef.current;
    if (index === null) return;
    const tile = tiles.current[index];
    const sheet = sheetRef.current;
    const focusBack = (element: HTMLElement | null | undefined) => element?.querySelector<HTMLElement>(".sc-open")?.focus({ preventScroll: true });
    if (tile && sheet && canMorph()) {
      sheet.style.viewTransitionName = "sc-case";
      const transition = document.startViewTransition(() => {
        sheet.style.viewTransitionName = "";
        hide();
        tile.style.viewTransitionName = "sc-case";
        focusBack(tile);
      });
      transition.finished.finally(() => { tile.style.viewTransitionName = ""; });
      return;
    }
    focusBack(hide());
  }

  function step(delta: number) {
    const current = openRef.current;
    if (current === null) return;
    const next = (current + delta + list.length) % list.length;
    const body = sheetRef.current;
    const swap = () => {
      openRef.current = next;
      flushSync(() => {
        setOpen(next);
        setCaseRun((count) => count + 1);
        setCasePhase(motionAllowed() ? "playing" : "rest");
      });
      body?.scrollTo(0, 0);
    };
    if (motionAllowed() && body?.animate) {
      body.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(8px)" }], { duration: 150, easing: "ease-in" }).onfinish = () => {
        // Closed during the fade: the case is gone, so nothing may open it again.
        if (openRef.current === null || !dialogRef.current?.open) return;
        swap();
        body.animate([{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: EASE });
      };
    } else swap();
  }

  const current = open === null ? null : list[open];
  return (
    <>
      <div className="sc-grid">
        {list.map((project, index) => (
          <Tile key={project.slug} project={project} index={index} copy={copy} feature={index === 0} hydrated={hydrated} onOpen={openCase} register={register} />
        ))}
      </div>
      <dialog
        ref={dialogRef}
        className="sc-case"
        aria-labelledby="sc-case-title"
        onCancel={(event) => {
          event.preventDefault();
          closeCase();
        }}
        onClose={() => {
          if (openRef.current !== null) hide();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeCase();
        }}
      >
        <div ref={sheetRef} className={`sc-case__sheet${current ? ` ${kindClass(current)}` : ""}`} style={current ? accentStyle(current.slug) : undefined}>
          {current && open !== null ? (
            <CaseView
              project={current}
              index={open}
              total={list.length}
              copy={copy}
              run={caseRun}
              phase={casePhase}
              onDone={() => setCasePhase("rest")}
              onStep={step}
              onClose={closeCase}
              closeRef={closeRef}
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
