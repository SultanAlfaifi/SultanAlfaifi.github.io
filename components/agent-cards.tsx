"use client";

import Image from "next/image";
import { Fragment, useId, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import type { Locale } from "@/data/i18n";
import { getContent } from "@/data/i18n";
import { AgentError, sendEmailToSultan, turnstileToken, type FitReport, type TourStop } from "@/lib/agent/client";
import { revealAnchor } from "@/lib/agent/reveal";
import type { AnchorInfo } from "@/lib/agent/types";

const LINK = /\[([^\]\n]{1,120})\]\(([^)\s]{1,400})\)/g;

// Renders an answer's markdown links. Only anchors on this page and URLs published on the site become
// links; anything else the model wrote stays as plain text, and stray bold markers are dropped. A page
// link goes through `onAnchor` when the console wants to follow the visitor there.
export function AgentText({ text: raw, anchors, urls, email, onAnchor = revealAnchor }: { text: string; anchors: AnchorInfo[]; urls: Set<string>; email: string; onAnchor?: (id: string) => void }) {
  const text = raw.split("**").join("");
  const known = new Set(anchors.map((anchor) => anchor.id));
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, href] = match;
    const start = match.index ?? 0;
    parts.push(text.slice(last, start));
    if (href.startsWith("#") && known.has(href.slice(1))) {
      parts.push(<a key={start} href={href} onClick={(event: MouseEvent) => { event.preventDefault(); onAnchor(href.slice(1)); }}>{label}</a>);
    } else if (urls.has(href.replace(/\/$/, "")) || href === `mailto:${email}`) {
      parts.push(<a key={start} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer noopener">{label}</a>);
    } else {
      parts.push(label);
    }
    last = start + whole.length;
  }
  parts.push(text.slice(last));
  return <>{parts.map((part, index) => <Fragment key={index}>{part}</Fragment>)}</>;
}

export type AgentStep = { step: string; text: string; tool?: string; error?: boolean };

// Everything the agent did for one answer, folded into a single line. While it works, the line says
// what it last finished; afterwards it keeps that last result and opens to every tool call and result.
export function ActivityLine({ steps, state, locale }: { steps: AgentStep[]; state: "running" | "done"; locale: Locale }) {
  const copy = getContent(locale).ui.terminal.agent;
  if (state === "running") {
    const latest = steps.findLast((step) => step.step === "result");
    return (
      <p className="agent-activity agent-activity--running" dir="auto">
        <span className="agent-activity__pulse" aria-hidden="true" />
        {latest?.text ?? copy.thinking}
      </p>
    );
  }
  return (
    <details className="agent-activity">
      <summary>{[copy.activity(steps.filter((step) => step.step === "tool").length), steps.findLast((step) => step.step === "result")?.text].filter(Boolean).join(" · ")}</summary>
      <ol>
        {steps.map((step, index) => (
          <li key={index} className={step.error || step.step === "guard" ? "agent-activity__warn" : undefined} dir="auto">
            <span className="terminal__step">{copy.steps[step.step] ?? step.step}</span> {step.text}
          </li>
        ))}
      </ol>
    </details>
  );
}

// A project the agent is talking about, as the page shows it: picture, headline numbers, and the way
// to see it on the page, try it, or read its code.
export function ProjectCard({ slug, locale, onShow }: { slug: string; locale: Locale; onShow: (anchor: string) => void }) {
  const { projects, ui } = getContent(locale);
  const copy = ui.terminal.agent.project;
  const project = projects.find((item) => item.slug === slug && item.enabled);
  if (!project) return null;
  const tryIt = project.liveDemo ?? project.primaryAction?.href ?? null;
  return (
    <article className="agent-card agent-project">
      {project.screenshot ? (
        <div className={`agent-project__media${project.imagePresentation === "icon" ? " agent-project__media--icon" : ""}`}>
          <Image src={project.screenshot} alt="" fill sizes="(max-width: 760px) 90vw, 420px" />
        </div>
      ) : null}
      <div className="agent-project__body">
        <p className="agent-project__category">{project.category}</p>
        <p className="agent-card__title">{project.title}</p>
        <p className="agent-project__description">{project.description}</p>
        {project.metrics?.length ? (
          <dl className="agent-project__metrics">
            {project.metrics.slice(0, 3).map((metric) => (
              <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>
            ))}
          </dl>
        ) : null}
        <div className="agent-card__actions">
          <button type="button" onClick={() => onShow(`project-${project.slug}`)}>{copy.see}</button>
          {tryIt ? <a className="agent-card__ghost" href={tryIt} target="_blank" rel="noreferrer noopener">{copy.demo} ↗</a> : null}
          {project.repository ? <a className="agent-card__ghost" href={project.repository} target="_blank" rel="noreferrer noopener">{copy.code} ↗</a> : null}
        </div>
      </div>
    </article>
  );
}

// What a tour covered, kept in the chat so the visitor can jump back to any stop.
export function TourCard({ stops, locale, onOpen }: { stops: TourStop[]; locale: Locale; onOpen: (index: number) => void }) {
  const copy = getContent(locale).ui.terminal.agent.tour;
  return (
    <div className="agent-card agent-tour">
      <p className="agent-card__title">{copy.title(stops.length)}</p>
      <ol aria-label={copy.aria}>
        {stops.map((stop, index) => (
          <li key={`${stop.anchor}-${index}`}>
            <button type="button" onClick={() => onOpen(index)}>{stop.label[locale]}</button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export type Draft = { subject: string; body: string; topic: string };

export function DraftCard({ draft, locale, onClose }: { draft: Draft; locale: Locale; onClose: (outcome: "sent" | "discarded") => void }) {
  const { identity, ui } = getContent(locale);
  const copy = ui.terminal.agent.draft;
  const id = useId();
  const slotRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [state, setState] = useState<"editing" | "sending" | "sent" | "dry" | "failed" | "capped" | "discarded">("editing");
  const [error, setError] = useState("");
  const mailto = `mailto:${identity.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const locked = state === "sending" || state === "sent" || state === "discarded";

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError(copy.invalidEmail);
      return;
    }
    setError("");
    setState("sending");
    try {
      const token = await turnstileToken(slotRef.current!, locale, "email");
      const result = await sendEmailToSultan(token, { name: name.trim(), email: email.trim(), subject: subject.trim(), message: body.trim(), topic: draft.topic });
      setState(result.sent ? "sent" : "dry");
      if (result.sent) onClose("sent");
    } catch (failure) {
      const code = failure instanceof AgentError ? failure.code : "";
      setState(code === "daily_cap" || code === "visitor_cap" || code === "rate_limited" ? "capped" : code === "invalid_email" ? "editing" : "failed");
      if (code === "invalid_email") setError(copy.invalidEmail);
    }
  }

  return (
    <form className="agent-card agent-draft" onSubmit={send} aria-labelledby={`${id}-title`}>
      <p className="agent-card__title" id={`${id}-title`}>{copy.title}</p>
      <p className="agent-draft__to"><span>{copy.to}</span> {copy.toValue}</p>
      <label>{copy.name}<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={80} disabled={locked} /></label>
      <label>{copy.email}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={254} disabled={locked} aria-invalid={Boolean(error) || undefined} aria-describedby={error ? `${id}-error` : undefined} /></label>
      <label>{copy.subject}<input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={140} required disabled={locked} /></label>
      <label>{copy.body}<textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} maxLength={3000} required disabled={locked} dir="auto" /></label>
      {error ? <p className="agent-card__error" id={`${id}-error`} role="alert">{error}</p> : null}
      <div ref={slotRef} className="agent-turnstile" />
      {state === "sent" ? <p className="agent-card__status" role="status">{copy.sent}</p> : null}
      {state === "discarded" ? <p className="agent-card__status" role="status">{copy.discarded}</p> : null}
      {state === "dry" || state === "failed" || state === "capped" ? (
        <p className="agent-card__status" role="status">
          {state === "dry" ? copy.dryRun : state === "capped" ? copy.capped : copy.failed} <a href={mailto}>{identity.email}</a>
        </p>
      ) : null}
      {state === "editing" || state === "sending" || state === "failed" ? (
        <div className="agent-card__actions">
          <button type="submit" disabled={state === "sending"}>{state === "sending" ? copy.sending : copy.send}</button>
          <button type="button" className="agent-card__ghost" onClick={() => { setState("discarded"); onClose("discarded"); }} disabled={state === "sending"}>{copy.discard}</button>
        </div>
      ) : null}
      <p className="agent-card__note">{copy.note}</p>
    </form>
  );
}

export function FitCard({ report, locale, anchors, onEmail }: { report: FitReport; locale: Locale; anchors: AnchorInfo[]; onEmail: (draft: Draft) => void }) {
  const copy = getContent(locale).ui.terminal.agent.fit;
  const label = (id: string) => anchors.find((anchor) => anchor.id === id)?.label[locale] ?? id;
  const evidence = (ids: string[]) => (
    <span className="agent-fit__evidence">
      {ids.map((anchorId, index) => (
        <Fragment key={anchorId}>
          {index ? " · " : null}
          <a href={`#${anchorId}`} onClick={(event) => { event.preventDefault(); revealAnchor(anchorId); }}>{label(anchorId)}</a>
        </Fragment>
      ))}
    </span>
  );
  const summaryText = [
    copy.title(report.role),
    report.summary,
    report.strong.length ? `\n${copy.strong}:\n${report.strong.map((item) => `- ${item.point}`).join("\n")}` : "",
    report.partial.length ? `\n${copy.partial}:\n${report.partial.map((item) => `- ${item.point}`).join("\n")}` : "",
    report.gaps.length ? `\n${copy.gaps}:\n${report.gaps.map((gap) => `- ${gap.point}${gap.plan ? ` (${gap.plan})` : ""}`).join("\n")}` : ""
  ].filter(Boolean).join("\n");

  return (
    <section className="agent-card agent-fit" aria-label={copy.title(report.role)}>
      <p className="agent-card__title">{copy.title(report.role)}</p>
      {report.summary ? <p className="agent-fit__summary">{report.summary}</p> : null}
      {report.strong.length ? <><h4>{copy.strong}</h4><ul>{report.strong.map((item) => <li key={item.point}>{item.point} {evidence(item.evidence)}</li>)}</ul></> : null}
      {report.partial.length ? <><h4>{copy.partial}</h4><ul>{report.partial.map((item) => <li key={item.point}>{item.point} {evidence(item.evidence)}</li>)}</ul></> : null}
      {report.gaps.length ? (
        <>
          <h4>{copy.gaps}</h4>
          <ul>{report.gaps.map((gap) => <li key={gap.point}>{gap.point}{gap.plan ? <span className="agent-fit__plan">{copy.plan}: {gap.plan}</span> : null}</li>)}</ul>
        </>
      ) : null}
      <div className="agent-card__actions">
        <button type="button" onClick={() => onEmail({ subject: copy.title(report.role), body: summaryText, topic: "fit" })}>{copy.email}</button>
      </div>
      <p className="agent-card__note">{copy.note}</p>
    </section>
  );
}
