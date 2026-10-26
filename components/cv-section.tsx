"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowDownToLine, X } from "lucide-react";
import { CV_FIELDS, type CvTarget } from "@/data/cv";
import { getContent, type Locale } from "@/data/i18n";
import { cvFooterFields } from "@/data/ui";
import { AgentError, agentConfigured, checkHealth, confirmCvCode, notifyCvDownload, requestCvCode, tailorCv, turnstileToken, withSession } from "@/lib/agent/client";
import { renderCvPdf, saveBlob } from "@/lib/cv/browser-render";
import { cvFileName } from "@/lib/cv/document";
import { cvDate, generalFooter } from "@/lib/cv/fit";
import { decodeSelection, encodeSelection, resolveSelection, selectForTarget, selectForText, type CvSelection, type ResolvedCv } from "@/lib/cv/select";
import { SectionHeader } from "./section-header";

const GENERAL_CV = "/cv/Sultan-Alfaifi-CV.pdf";
const DRAFT_KEY = "cv-draft-v1";
const OFFER_KEY = "cv-offer-shown";
const IDLE_MS = 45_000;

type Source = "general" | "field" | "ai" | "keywords" | "link";
type Draft = { target: CvTarget | null; description: string; company: string; savedAt: number };

function readDraft(): Draft | null {
  try {
    const draft = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "null") as Draft | null;
    return draft && Date.now() - draft.savedAt < 7 * 86_400_000 ? draft : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: Omit<Draft, "savedAt">) {
  try {
    if (!draft.target && !draft.description && !draft.company) window.localStorage.removeItem(DRAFT_KEY);
    else window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // Storage can be blocked; the form still works, it just won't remember.
  }
}

function CvPreview({ cv, footer, label }: { cv: ResolvedCv; footer: string; label: string }) {
  const entry = (title: string, meta: string, extras: (string | undefined)[], links: { label: string; href: string }[]) => (
    <p className="cv-paper__entry">
      <strong>{title}</strong>, {meta}
      {extras.filter(Boolean).map((extra) => <span key={extra}> | {extra}</span>)}
      {links.map((link, index) => <span key={link.href}>{index ? " · " : " | "}<a href={link.href} target="_blank" rel="noreferrer noopener" tabIndex={-1}>{link.label}</a></span>)}
    </p>
  );
  const list = (items: { id: string; text: string }[]) => <ul>{items.map((item) => <li key={item.id}>{item.text}</li>)}</ul>;
  return (
    <article className="cv-paper" lang="en" dir="ltr" aria-label={label}>
      <h3>{cv.header.name}</h3>
      <p className="cv-paper__headline">{cv.header.headline}</p>
      <p className="cv-paper__contact">{[cv.header.location, cv.header.email, ...cv.header.links.map((link) => link.label)].join(" | ")}</p>
      <h4>Summary</h4>
      <p>{cv.summary.text}</p>
      <h4>Skills</h4>
      {cv.skills.map((skill) => {
        const [name, ...rest] = skill.text.split(": ");
        return <p key={skill.id} className="cv-paper__skill"><strong>{name}:</strong> {rest.join(": ")}</p>;
      })}
      <h4>Experience</h4>
      {cv.experience.map(({ entry: item, bullets }) => <div key={item.id}>{entry(item.title, item.meta, [item.dates, item.location], item.links)}{list(bullets)}</div>)}
      {cv.target === "teaching" && cv.teaching.length ? <><h4>Teaching and community</h4>{list(cv.teaching)}</> : null}
      <h4>Projects</h4>
      {cv.projects.map(({ entry: item, bullets }) => <div key={item.id}>{entry(item.title, item.meta, [item.dates], item.links)}{list(bullets)}</div>)}
      {cv.target !== "teaching" && cv.teaching.length ? <><h4>Teaching and community</h4>{list(cv.teaching)}</> : null}
      <h4>Recognition</h4>
      {list(cv.recognition)}
      <h4>Education</h4>
      <p>{cv.education.text}</p>
      {cv.training.length ? <><h4>Training</h4>{list(cv.training)}</> : null}
      <p className="cv-paper__footer">{footer}</p>
    </article>
  );
}

export function CvSection({ locale = "en" }: { locale?: Locale }) {
  const { ui } = getContent(locale);
  const copy = ui.cv;
  const id = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<CvTarget | null>(null);
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [selection, setSelection] = useState<CvSelection>(() => selectForTarget("general"));
  const [source, setSource] = useState<Source>("general");
  const [cover, setCover] = useState<{ message: string; signature: string } | null>(null);
  const [jdState, setJdState] = useState<"idle" | "working" | "done" | "offline" | "failed">("idle");
  const [download, setDownload] = useState<"idle" | "building" | "done" | "failed">("idle");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "confirming" | "done" | "bad" | "offline" | "failed">("idle");
  const [devCode, setDevCode] = useState("");
  const [restored, setRestored] = useState(false);
  const [offer, setOffer] = useState(false);
  const health = useRef<Promise<boolean> | null>(null);
  const started = useRef(false);
  const completed = useRef(false);
  const pendingOffer = useRef(false);
  const idleTimer = useRef<number | null>(null);

  const date = useMemo(() => cvDate(), []);
  const footerFor = useMemo(() => {
    const label = company.trim() || (source === "general" ? "" : target ? cvFooterFields[target] : "this role");
    return label ? copy.footer(label, date) : generalFooter(date);
  }, [company, source, target, copy, date]);
  const resolved = useMemo(() => resolveSelection(selection), [selection]);

  const showOffer = useCallback(() => {
    if (completed.current) return;
    try {
      if (window.sessionStorage.getItem(OFFER_KEY)) return;
      window.sessionStorage.setItem(OFFER_KEY, "1");
    } catch {
      // Without storage the offer can still show once per page view.
    }
    setOffer(true);
  }, []);

  // Idle mid-form: one quiet inline offer of the general CV. Never a modal, never beforeunload.
  const touch = useCallback(() => {
    started.current = true;
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => { if (!completed.current) showOffer(); }, IDLE_MS);
  }, [showOffer]);

  // A CV link from an email, or a saved draft, is read once after the page has rendered.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const fromLink = params.get("cv");
      const linked = fromLink ? decodeSelection(fromLink) : null;
      if (linked) {
        setSelection(linked);
        setSource("link");
        setTarget(linked.target === "general" ? null : linked.target);
        setCompany((params.get("for") ?? "").slice(0, 60));
        return;
      }
      const draft = readDraft();
      if (!draft) return;
      setTarget(draft.target);
      setDescription(draft.description);
      setCompany(draft.company);
      if (draft.target) {
        setSelection(selectForTarget(draft.target));
        setSource("field");
      }
      setRestored(true);
      started.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (started.current) writeDraft({ target, description, company });
  }, [target, description, company]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let checked = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!checked && agentConfigured) {
          checked = true;
          health.current ??= checkHealth().then((result) => Boolean(result?.agent));
        }
        if (pendingOffer.current) {
          pendingOffer.current = false;
          showOffer();
        }
      } else if (started.current && !completed.current) {
        // They left mid-form: the offer waits for them when they come back.
        pendingOffer.current = true;
      }
    }, { threshold: 0 });
    observer.observe(section);
    const onHide = () => { if (document.visibilityState === "hidden" && started.current && !completed.current) pendingOffer.current = true; };
    const onShow = () => { if (document.visibilityState === "visible" && pendingOffer.current) { pendingOffer.current = false; showOffer(); } };
    document.addEventListener("visibilitychange", onHide);
    document.addEventListener("visibilitychange", onShow);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onHide);
      document.removeEventListener("visibilitychange", onShow);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [showOffer]);

  function pickField(next: CvTarget) {
    touch();
    setTarget(next);
    setSelection(selectForTarget(next));
    setSource("field");
    setCover(null);
    setJdState("idle");
    setDownload("idle");
  }

  async function tailorToDescription(event: FormEvent) {
    event.preventDefault();
    touch();
    if (description.trim().length < 40) return;
    setDownload("idle");
    const local = selectForText(description);
    setSelection(local.selection);
    setTarget(local.selection.target === "general" ? null : local.selection.target);
    setSource("keywords");
    setCover(null);
    if (agentConfigured) health.current ??= checkHealth().then((result) => Boolean(result?.agent));
    if (!health.current || !(await health.current) || !slotRef.current) {
      setJdState("offline");
      return;
    }
    setJdState("working");
    try {
      const result = await withSession(slotRef.current, locale, (token) => tailorCv(token, description.trim(), company.trim(), locale));
      const picked = decodeSelection(result.encoded);
      if (!picked) throw new AgentError("selection_rejected");
      setSelection(picked);
      setTarget(picked.target === "general" ? null : picked.target);
      setSource("ai");
      setCover(result.coverMessage ? { message: result.coverMessage, signature: result.signature } : null);
      setJdState("done");
    } catch (error) {
      setJdState(error instanceof AgentError && (error.code === "agent_offline" || error.code === "budget" || error.code === "offline") ? "offline" : "failed");
    }
  }

  async function downloadTailored() {
    touch();
    setDownload("building");
    try {
      const { output, selection: fitted } = await renderCvPdf(selection, footerFor);
      saveBlob(output, cvFileName(company.trim()));
      setSelection(fitted);
      setDownload("done");
      completed.current = true;
      setOffer(false);
      writeDraft({ target: null, description: "", company: "" });
      if (agentConfigured && slotRef.current) {
        const payload = { selection: encodeSelection(fitted), company: company.trim(), ...(cover ? { coverMessage: cover.message, signature: cover.signature } : {}) };
        void withSession(slotRef.current, locale, (token) => notifyCvDownload(token, payload)).catch(() => undefined);
      }
    } catch {
      setDownload("failed");
    }
  }

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    if (!slotRef.current || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return;
    if (!agentConfigured) {
      setEmailState("offline");
      return;
    }
    setEmailState("sending");
    try {
      const token = await turnstileToken(slotRef.current, locale, "cv_code");
      const result = await requestCvCode(token, email.trim());
      setDevCode(result.devCode ?? "");
      setEmailState("sent");
    } catch (error) {
      setEmailState(error instanceof AgentError && error.code === "offline" ? "offline" : "failed");
    }
  }

  async function confirmCode(event: FormEvent) {
    event.preventDefault();
    if (!slotRef.current) return;
    setEmailState("confirming");
    try {
      const payload = { email: email.trim(), code: code.trim(), selection: encodeSelection(selection), company: company.trim(), ...(cover ? { coverMessage: cover.message, signature: cover.signature } : {}) };
      await withSession(slotRef.current, locale, (token) => confirmCvCode(token, payload));
      setEmailState("done");
      completed.current = true;
      setOffer(false);
    } catch (error) {
      setEmailState(error instanceof AgentError && error.code === "bad_code" ? "bad" : "failed");
    }
  }

  const jdMessage = jdState === "working" ? copy.jdWorking : jdState === "offline" ? copy.jdOffline : jdState === "failed" ? copy.jdFailed : "";

  return (
    <section ref={sectionRef} id="cv" className="section cv-section" aria-label={copy.title}>
      <div className="page-shell">
        <SectionHeader title={copy.title} description={copy.description} />
        <div className="cv-layout">
          <div className="cv-controls">
            <div className="cv-general">
              <a className="button cv-button--primary cv-general__link" href={GENERAL_CV} download>
                <ArrowDownToLine size={18} aria-hidden="true" /> {copy.general}
              </a>
              <p>{copy.generalNote}</p>
            </div>

            {offer ? (
              <div className="cv-offer" role="status">
                <p>{copy.hesitation}</p>
                <a href={GENERAL_CV} download onClick={() => { completed.current = true; setOffer(false); }}>{copy.hesitationAction}</a>
                <button type="button" onClick={() => setOffer(false)} aria-label={copy.hesitationDismiss}><X size={16} aria-hidden="true" /></button>
              </div>
            ) : null}
            {restored ? <p className="cv-note" role="status">{copy.restored}</p> : null}

            <h3>{copy.tailorTitle}</h3>
            <fieldset className="cv-fields">
              <legend>{copy.fieldLegend}</legend>
              {CV_FIELDS.map((field) => (
                <label key={field} className={`cv-chip${target === field && source === "field" ? " is-active" : ""}`}>
                  <input type="radio" name={`${id}-field`} value={field} checked={target === field && source === "field"} onChange={() => pickField(field)} />
                  {copy.fields[field]}
                </label>
              ))}
            </fieldset>

            <form className="cv-jd" onSubmit={tailorToDescription}>
              <label htmlFor={`${id}-jd`}>{copy.jdLabel}</label>
              <textarea id={`${id}-jd`} value={description} onChange={(event) => { touch(); setDescription(event.target.value); }} placeholder={copy.jdPlaceholder} rows={5} maxLength={8000} dir="auto" />
              <button type="submit" className="button cv-button--secondary" disabled={description.trim().length < 40 || jdState === "working"}>{jdState === "working" ? copy.jdWorking : copy.jdButton}</button>
              {jdMessage ? <p className="cv-note" role="status">{jdMessage}</p> : null}
            </form>

            <label className="cv-company" htmlFor={`${id}-company`}>{copy.company}</label>
            <input id={`${id}-company`} className="cv-input" value={company} onChange={(event) => { touch(); setCompany(event.target.value); }} placeholder={copy.companyPlaceholder} maxLength={60} dir="auto" />

            {cover ? (
              <div className="cv-cover">
                <p className="cv-cover__title">{copy.cover}</p>
                <p lang="en" dir="ltr">{cover.message}</p>
                <p className="cv-note">{copy.coverHint}</p>
              </div>
            ) : null}

            <button type="button" className="button cv-button--primary cv-download" onClick={downloadTailored} disabled={download === "building"}>
              <ArrowDownToLine size={18} aria-hidden="true" /> {download === "building" ? copy.building : copy.download}
            </button>
            {download === "done" ? <p className="cv-note" role="status">{copy.downloaded}</p> : null}

            <div className="cv-email">
              <p className="cv-email__title">{copy.emailTitle}</p>
              {emailState === "sent" || emailState === "confirming" || emailState === "bad" || emailState === "done" ? (
                <form onSubmit={confirmCode}>
                  <p className="cv-note" role="status">{copy.codeSent(email.trim())}{devCode ? ` (dev: ${devCode})` : ""}</p>
                  <label htmlFor={`${id}-code`}>{copy.codeLabel}</label>
                  <div className="cv-inline">
                    <input id={`${id}-code`} className="cv-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" disabled={emailState === "done"} />
                    <button type="submit" className="button cv-button--secondary" disabled={code.length !== 6 || emailState === "confirming" || emailState === "done"}>{emailState === "confirming" ? copy.confirming : copy.confirm}</button>
                  </div>
                  {emailState === "bad" ? <p className="cv-note cv-note--warn" role="alert">{copy.badCode}</p> : null}
                  {emailState === "done" ? <p className="cv-note" role="status">{copy.emailed}</p> : null}
                </form>
              ) : (
                <form onSubmit={sendCode}>
                  <label htmlFor={`${id}-email`}>{copy.emailLabel}</label>
                  <div className="cv-inline">
                    <input id={`${id}-email`} className="cv-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} dir="ltr" />
                    <button type="submit" className="button cv-button--secondary" disabled={!email.includes("@") || emailState === "sending"}>{emailState === "sending" ? copy.sendingCode : copy.sendCode}</button>
                  </div>
                  {emailState === "offline" ? <p className="cv-note" role="status">{copy.emailOffline}</p> : null}
                  {emailState === "failed" ? <p className="cv-note cv-note--warn" role="status">{copy.emailFailed}</p> : null}
                </form>
              )}
              <div ref={slotRef} className="agent-turnstile" />
            </div>
            <p className="cv-privacy">{copy.privacy}</p>
          </div>

          <div className="cv-preview">
            <p className="cv-preview__title">{copy.previewTitle}</p>
            <CvPreview cv={resolved} footer={footerFor} label={copy.previewAria} />
          </div>
        </div>
      </div>
    </section>
  );
}
