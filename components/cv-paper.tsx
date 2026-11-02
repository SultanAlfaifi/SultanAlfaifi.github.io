"use client";

import { useEffect, useLayoutEffect, useRef, type PointerEvent, type ReactNode, type RefObject } from "react";
import type { CvLine } from "@/data/cv";
import type { ResolvedCv } from "@/lib/cv/select";
import { motionAllowed, subscribeMotion } from "./motion-preference";

const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";
const SPRING = "cubic-bezier(0.16, 1, 0.3, 1)";
const TILT_PROPS = ["--px", "--py"];
// "Prepared for Salla on 31 Oct 2026 from verified data at sultalfaifi.com": the part that names who it's
// for, and the rest. Greedy, so a company with " on " in its name still splits at the date.
const PREPARED = /^(Prepared for .+) (on .+ from verified data at sultalfaifi\.com)$/;

type Link = { label: string; href: string };

const easeOutCubic = (value: number) => 1 - (1 - value) ** 3;

// The page rises out of light as its stage scrolls in: --rise goes 0 → 1 (app/cv.css). Where CSS can tie
// it to scroll (animation-timeline: view()) CSS does it all; elsewhere this writes --rise while the stage is
// on screen. It is tied to the scroll position, so the page is finished wherever it rests, and the page is
// fully drawn at every value. Without JavaScript, with reduced motion or with the Motion switch off, CSS
// keeps --rise at 1: the page stands.
function useRise(stageRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof CSS === "undefined" || CSS.supports("animation-timeline: view()") || !("IntersectionObserver" in window)) return;
    let frame = 0;
    let watching = false;
    const update = () => {
      frame = 0;
      if (!motionAllowed()) {
        stage.style.removeProperty("--rise");
        return;
      }
      const progress = Math.min(1, Math.max(0, (window.innerHeight - stage.getBoundingClientRect().top) / (0.7 * window.innerHeight)));
      stage.style.setProperty("--rise", easeOutCubic(progress).toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === watching) return;
      watching = entry.isIntersecting;
      if (watching) window.addEventListener("scroll", onScroll, { passive: true });
      else window.removeEventListener("scroll", onScroll);
      update();
    });
    observer.observe(stage);
    update();
    const unsubscribe = subscribeMotion(update);
    return () => {
      observer.disconnect();
      unsubscribe();
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [stageRef]);
}

// An HTML twin of the PDF at A4 proportions: the same lines in the same order, sized in points of the
// page width (see app/cv.css), so the visitor sees the page they will download. It stands in a glass case
// on a pool of the orb's light, leans toward the text, follows the pointer a little, and when the lines
// change, the ones that stay glide to their new places. When the footer turns to "Prepared for …" it lights
// up and an aurora ring turns once around the page; when the download lands, the page lifts and the light
// turns to glacier.
export function CvPaper({ cv, footer, label, caption, approved = false }: { cv: ResolvedCv; footer: string; label: string; caption: string; approved?: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLElement>(null);
  const positions = useRef(new Map<string, number>());
  const preparedMatch = PREPARED.exec(footer);
  const prepared = Boolean(preparedMatch);

  useRise(stageRef);

  useLayoutEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    const animate = positions.current.size > 0 && motionAllowed() && typeof paper.animate === "function";
    const next = new Map<string, number>();
    paper.querySelectorAll<HTMLElement>("[data-line]").forEach((element) => {
      const id = element.dataset.line ?? "";
      const top = element.offsetTop;
      next.set(id, top);
      if (!animate) return;
      const before = positions.current.get(id);
      if (before === undefined) {
        element.animate([{ opacity: 0, transform: "translateY(0.5em)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: 140, easing: EASE, fill: "backwards" });
      } else if (before !== top) {
        element.animate([{ transform: `translateY(${before - top}px)` }, { transform: "none" }], { duration: 560, easing: EASE });
      }
    });
    positions.current = next;
  }, [cv]);

  // The download landed: the page lifts a little and settles (the light's turn to glacier is in CSS).
  useEffect(() => {
    const page = pageRef.current;
    if (!approved || !page || !motionAllowed() || typeof page.animate !== "function") return;
    const lift = page.animate([{ translate: "0 0" }, { translate: "0 -10px", offset: 0.35 }, { translate: "0 0" }], { duration: 600, easing: SPRING });
    return () => lift.cancel();
  }, [approved]);

  function tilt(event: PointerEvent<HTMLDivElement>) {
    const stage = stageRef.current;
    if (!stage || event.pointerType !== "mouse" || !motionAllowed()) return;
    const box = stage.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    // About ±4° on X and ±5.5° on Y around the rest pose; leaving springs back to rest.
    stage.style.setProperty("--px", `${(-y * 8).toFixed(2)}deg`);
    stage.style.setProperty("--py", `${(x * 11).toFixed(2)}deg`);
  }

  function rest() {
    TILT_PROPS.forEach((prop) => stageRef.current?.style.removeProperty(prop));
  }

  const links = (items: Link[], lead = " | ") =>
    items.map((link, index) => (
      <span key={link.href}>
        {index ? " · " : lead}
        <a href={link.href} target="_blank" rel="noreferrer noopener" tabIndex={-1}>{link.label}</a>
      </span>
    ));
  const section = (title: string, children: ReactNode) => (
    <>
      <h4 data-line={`h-${title}`}>{title}</h4>
      {children}
    </>
  );
  const list = (items: CvLine[]) => (
    <ul>
      {items.map((item) => (
        <li key={item.id} data-line={item.id}>
          {item.text}
          {item.link ? <> (<a href={item.link.href} target="_blank" rel="noreferrer noopener" tabIndex={-1}>{item.link.label}</a>)</> : null}
        </li>
      ))}
    </ul>
  );
  const entries = (groups: ResolvedCv["projects"], withLocation: boolean) =>
    groups.map(({ entry, bullets }) => (
      <div key={entry.id}>
        <p className="cv-paper__entry" data-line={entry.id}>
          <strong>{entry.title}</strong>, {entry.meta}
          {[entry.dates, withLocation ? entry.location : undefined].filter(Boolean).map((extra) => <span key={extra} className="cv-paper__muted"> | {extra}</span>)}
          <span className="cv-paper__muted">{links(entry.links)}</span>
        </p>
        {list(bullets)}
      </div>
    ));
  const teaching = cv.teaching.length ? section("Teaching and community", list(cv.teaching)) : null;
  // .is-prepared lights the footer and turns the ring once (the turn starts when the class arrives).
  const stageClass = ["cv-stage", prepared ? "is-prepared" : "", approved ? "is-approved" : ""].filter(Boolean).join(" ");

  return (
    <div ref={stageRef} className={stageClass} onPointerMove={tilt} onPointerLeave={rest}>
      <div ref={pageRef} className="cv-page">
        <span className="cv-ring" aria-hidden="true" />
        <div className="cv-sheet">
          <article ref={paperRef} className="cv-paper" lang="en" dir="ltr" aria-label={label}>
            <h3 className="cv-paper__name">{cv.header.name}</h3>
            <p className="cv-paper__headline">{cv.header.headline}</p>
            <p className="cv-paper__contact">
              {cv.header.location} | <a href={`mailto:${cv.header.email}`} tabIndex={-1}>{cv.header.email}</a>
              {links(cv.header.links)}
            </p>
            <hr className="cv-paper__rule" />
            {section("Summary", <p data-line={cv.summary.id}>{cv.summary.text}</p>)}
            {section("Skills", cv.skills.map((skill) => {
              const [name, ...rest] = skill.text.split(": ");
              return <p key={skill.id} className="cv-paper__skill" data-line={skill.id}><strong>{name}:</strong> {rest.join(": ")}</p>;
            }))}
            {section("Experience", entries(cv.experience, true))}
            {cv.target === "teaching" ? teaching : null}
            {section("Projects", entries(cv.projects, false))}
            {cv.target === "teaching" ? null : teaching}
            {section("Recognition", list(cv.recognition))}
            {section("Education", <p data-line={cv.education.id}>{cv.education.text}</p>)}
            {cv.training.length ? section("Training", list(cv.training)) : null}
            <p className="cv-paper__footer">
              {preparedMatch ? <><mark>{preparedMatch[1]}</mark> {preparedMatch[2]}</> : footer}
            </p>
          </article>
        </div>
        <span className="cv-glow" aria-hidden="true" />
      </div>
      <p className="cv-caption"><span><i className="li-lamp li-k-verifies" aria-hidden="true" />{caption}</span></p>
    </div>
  );
}
