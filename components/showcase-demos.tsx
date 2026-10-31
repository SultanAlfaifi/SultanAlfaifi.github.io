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
type DemoProps = { project: Project; copy: WorkCopy; phase: DemoPhase; onDone?: () => void };

// ms from the start at which frames 1..n begin; frame 0 is the start, frame n the finished frame.
const WALL = Array.from({ length: 15 }, (_, index) => 520 + index * 150);
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

const pad = (value: number) => String(value).padStart(2, "0");

/* ---------- AccessFinish: fifteen "booked" pages, each rejected by the verifier ---------- */
// Variety so the wall reads as fifteen pages, not fifteen boxes: every third page is a booking week with
// the saved day marked, the rest a form, each with its own line lengths and stamp angle. The marks are
// drawing, not data: no page claims which day it saved.
const PAGE_LOOK = Array.from({ length: 15 }, (_, index) => ({
  calendar: index % 3 === 0,
  day: (index * 4 + 2) % 7,
  style: {
    "--w1": `${58 + ((index * 37) % 34)}%`,
    "--w2": `${34 + ((index * 23) % 40)}%`,
    "--tilt": `${((index * 7) % 9) - 4}deg`
  }
}));
const WEEK = Array.from({ length: 7 }, (_, index) => index);

export function WallDemo({ copy, phase, onDone }: DemoProps) {
  const visuals = copy.visuals;
  const wall = copy.showcase.wall;
  const frame = useFrames(phase, WALL, onDone);
  return (
    <div className="sc-dm sc-dm--wall" role="img" aria-label={visuals.trialsAria} data-phase={phase}>
      <div className="sc-dm__bar">
        <span>{visuals.trials}</span>
        <span className="sc-wall__verifier"><span className="li-lamp" />{wall.verifier}</span>
      </div>
      <ol className="sc-wall">
        {PAGE_LOOK.map((look, index) => {
          const state = index < frame ? "rejected" : index === frame && phase === "playing" ? "scan" : "claimed";
          return (
            <li key={index} className={`sc-page is-${state}`} style={look.style as CSSProperties}>
              <span className="sc-page__top"><i /><i /><i /><b className="li-num">{pad(index + 1)}</b></span>
              <span className="sc-page__booked"><Check size={14} strokeWidth={2.4} /><span>{wall.booked}</span></span>
              {look.calendar ? (
                <span className="sc-page__cal">{WEEK.map((day) => <i key={day} className={day === look.day ? "is-saved" : undefined} />)}</span>
              ) : (
                <span className="sc-page__lines"><i /><i /></span>
              )}
              <span className="sc-page__day">{wall.wrongDay}</span>
              <span className="sc-page__stamp"><X size={13} strokeWidth={2.6} /><span>{wall.rejected}</span></span>
            </li>
          );
        })}
      </ol>
      <div className="sc-dm__foot">
        <span>{visuals.repairNote}</span>
        <span className="sc-wall__count li-num">{visuals.verified.replace(/\d+/, String(frame))}</span>
      </div>
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

/* ---------- Mashhad: brief, scenes, sound, render, then the review before the final cut ---------- */
const BARS = Array.from({ length: 26 }, (_, index) => ({
  "--h": (0.25 + Math.abs(Math.sin(index * 1.7) * 0.6 + Math.sin(index * 0.6) * 0.3)).toFixed(2),
  "--d": (index * 0.07).toFixed(2)
}));

function MashhadDemo({ project, copy, phase, onDone }: DemoProps) {
  const frame = useFrames(phase, MASHHAD, onDone);
  const flow = project.flow ?? [];
  const step = frame + 1;
  return (
    <div className="sc-dm sc-dm--mh" role="img" aria-label={copy.visuals.motionAria} data-step={step} data-phase={phase}>
      <div className="mh-screen">
        <p className="mh-brief">{copy.visuals.motionNote}</p>
        <p className="mh-word" lang="ar" dir="rtl">مَشهد</p>
        <div className="mh-wave">{BARS.map((bar, index) => <i key={index} style={bar as CSSProperties} />)}</div>
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
const VOICE = Array.from({ length: 22 }, (_, index) => ({
  "--h": (0.3 + Math.abs(Math.sin(index * 1.3) * 0.7)).toFixed(2),
  "--d": (index * 0.06).toFixed(2)
}));

function AutoFlowDemo({ project, copy, phase, onDone }: DemoProps) {
  const visuals = copy.visuals;
  const frame = useFrames(phase, AUTOFLOW, onDone);
  return (
    <div className="sc-dm sc-dm--au" role="img" aria-label={`${visuals.autoIntent} ${visuals.autoReview.join(" ")}`} data-frame={frame} data-phase={phase}>
      <div className="au-in au-in--text"><span className="au-tag">{visuals.autoText}</span><span className="au-type">{project.flow?.[0]}…</span></div>
      <div className="au-in au-in--voice"><span className="au-tag">{visuals.autoVoice}</span><span className="au-wave">{VOICE.map((bar, index) => <i key={index} style={bar as CSSProperties} />)}</span></div>
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
