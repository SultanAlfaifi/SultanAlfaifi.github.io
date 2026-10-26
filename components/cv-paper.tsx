"use client";

import { useLayoutEffect, useRef, type PointerEvent, type ReactNode } from "react";
import type { CvLine } from "@/data/cv";
import type { ResolvedCv } from "@/lib/cv/select";
import { motionAllowed } from "./motion-preference";

const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";
const TILT_PROPS = ["--tilt-x", "--tilt-y", "--light-x", "--light-y"];

type Link = { label: string; href: string };

// An HTML twin of the PDF at A4 proportions: the same lines in the same order, sized in points of the
// page width (see app/cv.css), so the visitor sees the page they will download. The sheet tilts toward
// the pointer, and when the lines change, the ones that stay glide to their new places.
export function CvPaper({ cv, footer, label }: { cv: ResolvedCv; footer: string; label: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLElement>(null);
  const positions = useRef(new Map<string, number>());

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

  function tilt(event: PointerEvent<HTMLDivElement>) {
    const stage = stageRef.current;
    if (!stage || event.pointerType !== "mouse" || !motionAllowed()) return;
    const box = stage.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    stage.style.setProperty("--tilt-x", `${(-y * 8).toFixed(2)}deg`);
    stage.style.setProperty("--tilt-y", `${(x * 11).toFixed(2)}deg`);
    stage.style.setProperty("--light-x", `${((x + 0.5) * 100).toFixed(1)}%`);
    stage.style.setProperty("--light-y", `${((y + 0.5) * 100).toFixed(1)}%`);
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

  return (
    <div ref={stageRef} className="cv-stage" onPointerMove={tilt} onPointerLeave={rest}>
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
          <p className="cv-paper__footer">{footer}</p>
        </article>
      </div>
    </div>
  );
}
