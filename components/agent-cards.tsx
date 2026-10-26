"use client";

import { Fragment, useId, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import type { Locale } from "@/data/i18n";
import { getContent } from "@/data/i18n";
import { AgentError, sendEmailToSultan, turnstileToken, type FitReport } from "@/lib/agent/client";
import { revealAnchor } from "@/lib/agent/reveal";
import type { AnchorInfo } from "@/lib/agent/types";

const LINK = /\[([^\]\n]{1,120})\]\(([^)\s]{1,400})\)/g;

// Renders an answer's markdown links. Only anchors on this page and URLs published on the site become
// links; anything else the model wrote stays as plain text.
export function AgentText({ text, anchors, urls, email }: { text: string; anchors: AnchorInfo[]; urls: Set<string>; email: string }) {
  const known = new Set(anchors.map((anchor) => anchor.id));
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, href] = match;
    const start = match.index ?? 0;
    parts.push(text.slice(last, start));
    if (href.startsWith("#") && known.has(href.slice(1))) {
      parts.push(<a key={start} href={href} onClick={(event: MouseEvent) => { event.preventDefault(); revealAnchor(href.slice(1)); }}>{label}</a>);
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
