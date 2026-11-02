"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Droplets, Filter, Gauge, Pause, Sprout, X, type LucideIcon } from "lucide-react";
import type { Project } from "@/data/portfolio";
import type { WorkCopy } from "./showcase-parts";

// The micro-demos. Each one is drawn in its finished frame (the stop reached): that is the server HTML,
// what shows without JavaScript, and what shows with motion off. When its tile comes into view it is
// primed to its first frame just off screen, plays once, and lands on the finished frame again, where it
// stops for the person. Text inside a demo is never smaller than 12.5px (see app/showcase.css).

export type DemoPhase = "rest" | "primed" | "playing";
// "tile" is the card's face; "case" is "Inside the build", which can say more around the same demo.
type DemoProps = { project: Project; copy: WorkCopy; phase: DemoPhase; onDone?: () => void; variant?: "tile" | "case" };

// ms from the start at which frames 1..n begin; frame 0 is the start, frame n the finished frame.
const MUSTAKSHIF = [320, 1350, 2150, 3050];
const MASARI = [380, 1000, 1650, 2250, 3000];
const MASHHAD = [1050, 2100, 3150, 4200];
const AUTOFLOW = [320, 1450, 2650, 3550];
const WAREVA = [1900, 2450];

function useFrames(phase: DemoPhase, schedule: number[], onDone?: () => void) {
  const [frame, setFrame] = useState(0);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    if (phase !== "playing") return;
    const timers = schedule.map((at, index) => window.setTimeout(() => setFrame(index + 1), at));
    timers.push(window.setTimeout(() => done.current?.(), schedule[schedule.length - 1] + 160));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [phase, schedule]);
  if (phase === "rest") return schedule.length;
  return phase === "primed" ? 0 : frame;
}

/* ---------- AccessFinish: fifteen "booked" pages, each struck by the verifier ---------- */
// A quiet texture, not fifteen cards: each page is its "booked" line, struck once the verifier rejects it,
// and a lamp that turns rose; every third page also keeps its booking week with the saved day marked, drawn
// as one small picture. The words are said once, in the caption and the aria-label. The marks are drawing,
// not data: no page claims which day it saved.
const PAGE_LOOK = Array.from({ length: 15 }, (_, index) => ({
  calendar: index % 3 === 0,
  day: (index * 4 + 2) % 7,
  style: { "--i": index }
}));
const WEEK = Array.from({ length: 7 }, (_, index) => index);
// The strike: from 300 ms, a page every 110 ms in reading order, each line drawn in 350 ms (app/showcase.css).
export const STRIKE_MS = 300 + 14 * 110 + 350 + 110;

// Runs once the first time the wall is seen (components/showcase.tsx, playsOnce). At rest, and so without
// JavaScript or with motion off, every page is already struck.
export function playsOnce(slug: string) {
  return slug === "accessfinish";
}

export function WallDemo({ copy, phase, onDone, variant = "tile" }: DemoProps) {
  const visuals = copy.visuals;
  const wall = copy.showcase.wall;
  const done = useRef(onDone);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    done.current = onDone;
  });
  // Playing: the pages first show "booked" for two frames, so the strike has something to draw from.
  useEffect(() => {
    if (phase !== "playing") return;
    let frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => setArmed(true));
    });
    const timer = window.setTimeout(() => done.current?.(), STRIKE_MS);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [phase]);
  const struck = phase === "rest" || (phase === "playing" && armed);
  return (
    <div className={`sc-dm sc-dm--wall${struck ? " is-struck" : ""}`} role="img" aria-label={visuals.trialsAria} data-phase={phase}>
      {variant === "case" ? (
        <div className="sc-dm__bar">
          <span>{visuals.trials}</span>
          <span className="sc-wall__verifier"><span className="li-lamp" />{wall.verifier}</span>
        </div>
      ) : null}
      <ol className="sc-wall">
        {PAGE_LOOK.map((look, index) => (
          <li key={index} className={`sc-page ${struck ? "is-rejected" : "is-claimed"}`} style={look.style as CSSProperties}>
            <span className="sc-page__head">
              <span className="sc-page__booked">{wall.booked}</span>
              <i className="sc-page__lamp" />
            </span>
            {look.calendar ? (
              <svg className="sc-page__cal" viewBox="0 0 76 6" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                {WEEK.map((day) => <rect key={day} x={day * 11} width="10" height="6" rx="1.5" className={day === look.day ? "is-saved" : undefined} />)}
              </svg>
            ) : null}
          </li>
        ))}
      </ol>
      {variant === "case" ? (
        <div className="sc-dm__foot">
          <span>{visuals.repairNote}</span>
          <span className="sc-wall__count li-num">{visuals.verified}</span>
        </div>
      ) : (
        <p className="sc-wall__cap"><span className="li-lamp" />{visuals.trials}</p>
      )}
    </div>
  );
}

/* ---------- Mustakshif: reads the machine, ranks, then waits for your yes ---------- */
const SPEC_FILL = [0.82, 0.64, 0.74, 0.5];
const RANK_FILL = ["88%", "70%", "56%"];

function MustakshifDemo({ project, copy, phase, onDone }: DemoProps) {
  const visuals = copy.visuals;
  const frame = useFrames(phase, MUSTAKSHIF, onDone);
  const current = frame < 2 ? 0 : frame < 3 ? 1 : 2;
  return (
    <div className="sc-dm sc-dm--mk" role="img" aria-label={visuals.mustakshifAria} data-frame={frame}>
      <div className="mk-path">
        {visuals.mustakshifPath.map((step, index) => (
          <span key={step} className={`mk-path__step${index === current ? " is-current" : ""}${index < current ? " is-past" : ""}`}>{step}</span>
        ))}
      </div>
      <div className="mk-body">
        <ul className="mk-specs">
          {copy.showcase.mustakshif.specs.map((label, index) => (
            <li key={label} style={{ "--w": SPEC_FILL[index], "--i": index } as CSSProperties}>
              <span>{label}</span><i><b /></i>
            </li>
          ))}
        </ul>
        <ol className="mk-rank">
          {RANK_FILL.map((fill, index) => (
            <li key={fill} className={frame >= 4 && index === 0 ? "is-pick" : undefined} style={{ "--a": fill, "--i": index } as CSSProperties}>
              <span className="li-num">{index + 1}</span><i />
            </li>
          ))}
        </ol>
      </div>
      <p className="mk-gate"><span className="li-lamp" /><span className="mk-gate__text">{project.checkpoint?.text}</span></p>
    </div>
  );
}

/* ---------- Masari: the real app, typed into and exported, all inside your browser ---------- */
function MasariDemo({ project, copy, phase, onDone }: DemoProps) {
  const visuals = copy.visuals;
  const frame = useFrames(phase, MASARI, onDone);
  return (
    <div className="sc-dm sc-dm--ms" role="img" aria-label={copy.showcase.screenshotAlt(project.title)} data-frame={frame}>
      <div className="ms-device">
        <div className="ms-shot">
          {project.screenshot ? <Image className="ms-shot__img" src={project.screenshot} alt="" width={1586} height={992} sizes="(max-width: 720px) 120vw, 640px" /> : null}
          <i className="ms-focus ms-focus--name" />
          <i className="ms-focus ms-focus--mail" />
          <i className="ms-pulse ms-pulse--name" />
          <i className="ms-pulse ms-pulse--mail" />
          <span className="ms-pdf li-num">{copy.showcase.masari.pdf}</span>
        </div>
      </div>
      <p className="ms-bound"><span className="li-lamp" /><b>{copy.showcase.masari.browser}</b><span>{visuals.resumeNote}</span></p>
    </div>
  );
}

/* ---------- A voice, drawn as one quiet line ---------- */
// The sound in Mashhad and the voice in AutoFlow were rows of 26 and 22 bars: dozens of small marks inside a
// card that should read as one object. Each is now one stroke through the same heights, worked out once
// (bar i at 0.25 + |0.6 sin 1.7i + 0.3 sin 0.6i| for Mashhad, 0.3 + |0.7 sin 1.3i| for AutoFlow) and written
// out, so the server and every browser draw the same path.
const SOUND_LINE = "M0 12 Q3.7 9.5 5.6 15.8 Q7.4 22.0 9.3 15.1 Q11.1 8.2 13.0 12.7 Q14.8 17.1 16.7 10.8 Q18.5 4.5 20.4 12.1 Q22.2 19.7 24.1 11.8 Q25.9 4.0 27.8 12.4 Q29.6 20.8 31.5 14.1 Q33.3 7.3 35.2 10.9 Q37.0 14.6 38.9 8.7 Q40.7 2.9 42.6 8.7 Q44.4 14.5 46.3 8.3 Q48.1 2.0 50.0 9.4 Q51.9 16.8 53.7 11.5 Q55.6 6.2 57.4 12.1 Q59.3 17.9 61.1 11.3 Q63.0 4.7 64.8 12.4 Q66.7 20.1 68.5 11.2 Q70.4 2.2 72.2 9.3 Q74.1 16.4 75.9 12.2 Q77.8 7.9 79.6 13.9 Q81.5 19.9 83.3 14.7 Q85.2 9.5 87.0 15.7 Q88.9 22.0 90.7 14.2 Q92.6 6.4 94.4 12.4 Q96.3 18.5 98.1 15.3 L100 12";
const VOICE_LINE = "M0 12 Q4.3 9.0 6.5 15.4 Q8.7 21.7 10.9 13.6 Q13.0 5.4 15.2 12.6 Q17.4 19.8 19.6 11.3 Q21.7 2.8 23.9 9.7 Q26.1 16.5 28.3 9.3 Q30.4 2.0 32.6 9.6 Q34.8 17.2 37.0 10.2 Q39.1 3.2 41.3 11.8 Q43.5 20.3 45.7 13.2 Q47.8 6.1 50.0 14.0 Q52.2 21.9 54.3 15.1 Q56.5 8.2 58.7 14.9 Q60.9 21.5 63.0 13.1 Q65.2 4.8 67.4 12.0 Q69.6 19.2 71.7 10.9 Q73.9 2.5 76.1 9.1 Q78.3 15.8 80.4 8.9 Q82.6 2.1 84.8 10.0 Q87.0 17.9 89.1 10.8 Q91.3 3.7 93.5 12.2 Q95.7 20.8 97.8 16.4 L100 12";

function WaveLine({ path }: { path: string }) {
  return (
    <svg className="sc-wave" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={path} />
    </svg>
  );
}

/* ---------- Mashhad: brief, scenes, sound, render, then the review before the final cut ---------- */

function MashhadDemo({ project, copy, phase, onDone }: DemoProps) {
  const frame = useFrames(phase, MASHHAD, onDone);
  const flow = project.flow ?? [];
  const step = frame + 1;
  return (
    <div className="sc-dm sc-dm--mh" role="img" aria-label={copy.visuals.motionAria} data-step={step} data-phase={phase}>
      <div className="mh-screen">
        <p className="mh-brief">{copy.visuals.motionNote}</p>
        <p className="mh-word" lang="ar" dir="rtl">مَشهد</p>
        <div className="mh-wave"><WaveLine path={SOUND_LINE} /></div>
        <div className="mh-render"><i /></div>
        <div className="mh-check" />
      </div>
      <ol className="mh-track">
        {flow.map((name, index) => (
          <li key={name} className={`${index === step - 1 ? "is-current" : index < step - 1 ? "is-past" : ""}${index === (project.checkpoint?.step ?? 0) - 1 ? " is-gate" : ""}`}>{name}</li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- AutoFlow: text or voice, one draft, and nothing turns on until you approve ---------- */

function AutoFlowDemo({ project, copy, phase, onDone }: DemoProps) {
  const visuals = copy.visuals;
  const frame = useFrames(phase, AUTOFLOW, onDone);
  return (
    <div className="sc-dm sc-dm--au" role="img" aria-label={`${visuals.autoIntent} ${visuals.autoReview.join(" ")}`} data-frame={frame} data-phase={phase}>
      <div className="au-in au-in--text"><span className="au-tag">{visuals.autoText}</span><span className="au-type">{project.flow?.[0]}…</span></div>
      <div className="au-in au-in--voice"><span className="au-tag">{visuals.autoVoice}</span><span className="au-wave"><WaveLine path={VOICE_LINE} /></span></div>
      <p className="au-same">{visuals.autoShared}</p>
      <div className="au-draft">
        <div className="au-draft__head"><span>{visuals.autoDraft}</span><span className="au-switch" /></div>
        <p>{visuals.autoIntent}</p>
      </div>
      <p className="au-gate"><span className="li-lamp" />{visuals.autoReview.join(" ")}</p>
      <p className="au-note">{visuals.autoNote}</p>
    </div>
  );
}

/* ---------- WAREVA: water flows while every reading passes, and stops when one fails ---------- */
const PLANT: LucideIcon[] = [Droplets, Filter, Gauge, Sprout];
function PlantIcon({ index }: { index: number }) {
  const Icon = PLANT[index] ?? Droplets;
  return <i><Icon size={15} strokeWidth={1.8} /></i>;
}

function WarevaDemo({ project, copy, phase, onDone }: DemoProps) {
  const visuals = copy.visuals;
  const frame = useFrames(phase, WAREVA, onDone);
  const flow = project.flow ?? [];
  const gate = (project.checkpoint?.step ?? 0) - 1;
  const held = frame >= 2;
  return (
    <div className={`sc-dm sc-dm--wv${held ? " is-held" : ""}`} role="img" aria-label={visuals.waterAria} data-frame={frame} data-phase={phase}>
      <div className="wv-line">
        {flow.map((name, index) => (
          <span key={name} className="wv-step">
            {index ? <span className={`wv-pipe${index === flow.length - 1 ? " wv-pipe--last" : ""}`} /> : null}
            <span className={`wv-node${index === gate ? " is-gate" : ""}${index === flow.length - 1 ? " is-end" : ""}`}><PlantIcon index={index} />{name}</span>
          </span>
        ))}
      </div>
      <p className="wv-label">{visuals.waterSensors}</p>
      <div className="wv-sensors">
        {[0, 1, 2].map((index) => {
          const failed = index === 2 && frame >= 1;
          return (
            <span key={index} className={`wv-sensor ${failed ? "is-fail" : "is-ok"}`}>
              <b>{failed ? <X size={13} strokeWidth={2.6} /> : <Check size={13} strokeWidth={2.6} />}{visuals.waterSensor(index + 1)}</b>
              <i />
            </span>
          );
        })}
      </div>
      <p className="wv-held"><span className="wv-held__state"><Pause size={14} strokeWidth={2.4} />{visuals.waterHeld}</span><small>{visuals.waterNote}</small></p>
    </div>
  );
}

const DEMOS: Record<string, (props: DemoProps) => ReactNode> = {
  accessfinish: (props) => <WallDemo {...props} />,
  mustakshif: (props) => <MustakshifDemo {...props} />,
  masari: (props) => <MasariDemo {...props} />,
  mashhad: (props) => <MashhadDemo {...props} />,
  autoflow: (props) => <AutoFlowDemo {...props} />,
  mawrid: (props) => <WarevaDemo {...props} />
};

export function hasDemo(slug: string) {
  return slug in DEMOS;
}

export function ShowcaseDemo(props: DemoProps) {
  const render = DEMOS[props.project.slug];
  return render ? render(props) : null;
}
