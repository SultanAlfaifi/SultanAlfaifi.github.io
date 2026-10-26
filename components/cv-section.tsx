"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowDownToLine, X } from "lucide-react";
import { CV_FIELDS, type CvTarget } from "@/data/cv";
import { getContent, type Locale } from "@/data/i18n";
import { AgentError, agentConfigured, checkHealth, confirmCvCode, notifyCvDownload, requestCvCode, tailorCv, turnstileToken, withSession } from "@/lib/agent/client";
import { renderCvPdf, saveBlob } from "@/lib/cv/browser-render";
import { cvFileName } from "@/lib/cv/document";
import { cvDate, generalFooter, preparedFooter } from "@/lib/cv/fit";
import { decodeSelection, encodeSelection, resolveSelection, roleTarget, selectForTarget, selectForText, type CvSelection } from "@/lib/cv/select";
import { CvPaper } from "./cv-paper";
import { SectionHeader } from "./section-header";

const GENERAL_CV = "/cv/Sultan-Alfaifi-CV.pdf";
// Written by scripts/build-cv.ts: which lines each field's CV keeps once it fits on one page.
const FITTED = "/cv/fitted.json";
const DRAFT_KEY = "cv-draft-v2";
const OFFER_KEY = "cv-offer-shown";
const IDLE_MS = 45_000;
const POSTING_MIN = 40;
// Typing pauses this long before the PDF is prepared in the background, so the download is instant.
const PREPARE_MS = 650;

type Draft = { company: string; role: string; posting: string; savedAt: number };
type Pick = { selection: CvSelection; cover: { message: string; signature: string } | null; from: "ai" | "link" };
type Prepared = { key: string; blob: Blob; selection: CvSelection };

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
    if (!draft.company && !draft.role && !draft.posting) window.localStorage.removeItem(DRAFT_KEY);
    else window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // Storage can be blocked; the form still works, it just won't remember.
  }
}

export function CvSection({ locale = "en" }: { locale?: Locale }) {
  const { ui } = getContent(locale);
  const copy = ui.cv;
  const id = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [posting, setPosting] = useState("");
  const [postingOpen, setPostingOpen] = useState(false);
  const [fitted, setFitted] = useState<Partial<Record<CvTarget, CvSelection>>>({});
  const [pick, setPick] = useState<Pick | null>(null);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [aiLive, setAiLive] = useState(false);
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

  // What goes on the page. With nothing typed it's the general CV; a role picks the field's lines; a
  // pasted posting reorders them by its keywords; the AI or a CV link can hand over an exact pick.
  const date = useMemo(() => cvDate(), []);
  const target = useMemo(() => roleTarget(role), [role]);
  const hasPosting = posting.trim().length >= POSTING_MIN;
  const personal = Boolean(company.trim() || role.trim() || hasPosting || pick);
  const selection = useMemo(() => {
    if (pick) return pick.selection;
    if (hasPosting) return selectForText(`${role}\n${posting}`, target).selection;
    return fitted[target] ?? selectForTarget(target);
  }, [pick, hasPosting, role, posting, target, fitted]);
  const footer = personal ? preparedFooter(date, company, selection.target) : generalFooter(date);
  const key = `${encodeSelection(selection)}|${footer}`;
  const ready = prepared?.key === key ? prepared : null;
  const shown = ready?.selection ?? selection;
  const resolved = useMemo(() => resolveSelection(shown), [shown]);

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

  useEffect(() => {
    let cancelled = false;
    fetch(FITTED)
      .then((response) => (response.ok ? (response.json() as Promise<Record<string, unknown>>) : {}))
      .then((data) => {
        if (cancelled) return;
        const next: Partial<Record<CvTarget, CvSelection>> = {};
        for (const [name, encoded] of Object.entries(data)) {
          const decoded = typeof encoded === "string" ? decodeSelection(encoded) : null;
          if (decoded && decoded.target === name) next[decoded.target] = decoded;
        }
        setFitted(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // A CV link from an email, or a saved draft, is read once after the page has rendered.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const fromLink = params.get("cv");
      const linked = fromLink ? decodeSelection(fromLink) : null;
      if (linked) {
        setPick({ selection: linked, cover: null, from: "link" });
        setCompany((params.get("for") ?? "").slice(0, 60));
        return;
      }
      const draft = readDraft();
      if (!draft) return;
      setCompany(draft.company);
      setRole(draft.role);
      setPosting(draft.posting);
      setPostingOpen(Boolean(draft.posting));
      setRestored(true);
      started.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (started.current) writeDraft({ company, role, posting });
  }, [company, role, posting]);

  // Prepares the visitor's PDF while they look at the preview; the preview then shows exactly the lines
  // that fit on the page.
  useEffect(() => {
    if (!personal) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      renderCvPdf(selection, footer)
        .then(({ output, selection: fittedSelection }) => {
          if (!cancelled) setPrepared({ key, blob: output, selection: fittedSelection });
        })
        .catch(() => undefined);
    }, PREPARE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [personal, selection, footer, key]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!health.current && agentConfigured) {
          health.current = checkHealth().then((result) => Boolean(result?.agent));
          void health.current.then(setAiLive);
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

  // A new role or posting replaces whatever the AI or a link picked for the old one.
  function changeWhatFor(update: () => void) {
    touch();
    update();
    setPick(null);
    setJdState("idle");
    setDownload("idle");
  }

  function finish() {
    completed.current = true;
    setOffer(false);
    writeDraft({ company: "", role: "", posting: "" });
  }

  async function matchWithAi() {
    touch();
    if (!hasPosting || !slotRef.current) return;
    setJdState("working");
    try {
      const result = await withSession(slotRef.current, locale, (token) => tailorCv(token, posting.trim(), company.trim(), locale));
      const picked = decodeSelection(result.encoded);
      if (!picked) throw new AgentError("selection_rejected");
      setPick({ selection: picked, cover: result.coverMessage ? { message: result.coverMessage, signature: result.signature } : null, from: "ai" });
      setJdState("done");
    } catch (error) {
      setJdState(error instanceof AgentError && (error.code === "agent_offline" || error.code === "budget" || error.code === "offline") ? "offline" : "failed");
    }
  }

  async function downloadPrepared() {
    touch();
    setDownload("building");
    try {
      let pdf = ready;
      if (!pdf) {
        const built = await renderCvPdf(selection, footer);
        pdf = { key, blob: built.output, selection: built.selection };
      }
      setPrepared(pdf);
      saveBlob(pdf.blob, cvFileName(company.trim()));
      setDownload("done");
      finish();
      if (agentConfigured && slotRef.current) {
        const cover = pick?.cover;
        const payload = { selection: encodeSelection(pdf.selection), company: company.trim(), ...(cover ? { coverMessage: cover.message, signature: cover.signature } : {}) };
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
      const cover = pick?.cover;
      const payload = { email: email.trim(), code: code.trim(), selection: encodeSelection(shown), company: company.trim(), ...(cover ? { coverMessage: cover.message, signature: cover.signature } : {}) };
      await withSession(slotRef.current, locale, (token) => confirmCvCode(token, payload));
      setEmailState("done");
      completed.current = true;
      setOffer(false);
    } catch (error) {
      setEmailState(error instanceof AgentError && error.code === "bad_code" ? "bad" : "failed");
    }
  }

  const jdMessage = { idle: "", working: copy.jdWorking, done: copy.jdDone, offline: copy.jdOffline, failed: copy.jdFailed }[jdState];
  const name = company.trim();

  return (
    <section ref={sectionRef} id="cv" className="section cv-section" aria-label={copy.title}>
      <div className="page-shell">
        <SectionHeader title={copy.title} description={copy.description} />
        <div className="cv-layout">
          <div className="cv-get">
            {personal ? (
              <button type="button" className="button cv-button--primary cv-download" onClick={downloadPrepared} disabled={download === "building"}>
                <ArrowDownToLine size={20} aria-hidden="true" /> {download === "building" ? copy.building : name ? copy.downloadFor(name) : copy.download}
              </button>
            ) : (
              <a className="button cv-button--primary cv-download" href={GENERAL_CV} download onClick={() => { finish(); setDownload("done"); }}>
                <ArrowDownToLine size={20} aria-hidden="true" /> {copy.download}
              </a>
            )}
            <p className="cv-get__note">{copy.downloadNote}</p>
            {download === "done" ? <p className="cv-note" role="status">{copy.downloaded}</p> : null}
            {download === "failed" ? (
              <p className="cv-note cv-note--warn" role="status">{copy.downloadFailed} <a href={GENERAL_CV} download>{copy.generalInstead}</a></p>
            ) : null}
            {offer ? (
              <div className="cv-offer" role="status">
                <p>{copy.hesitation}</p>
                <a href={GENERAL_CV} download onClick={() => { completed.current = true; setOffer(false); }}>{copy.hesitationAction}</a>
                <button type="button" onClick={() => setOffer(false)} aria-label={copy.hesitationDismiss}><X size={16} aria-hidden="true" /></button>
              </div>
            ) : null}
            {restored ? <p className="cv-note" role="status">{copy.restored}</p> : null}
          </div>

          <div className="cv-for">
            <h3>{copy.forTitle}</h3>
            <p className="cv-for__hint">{copy.forHint}</p>
            <div className="cv-for__fields">
              <div className="cv-field">
                <label htmlFor={`${id}-company`}>{copy.company}</label>
                <input id={`${id}-company`} className="cv-input" value={company} onChange={(event) => { touch(); setCompany(event.target.value); setDownload("idle"); }} placeholder={copy.companyPlaceholder} maxLength={60} autoComplete="organization" dir="auto" />
              </div>
              <div className="cv-field">
                <label htmlFor={`${id}-role`}>{copy.role}</label>
                <input id={`${id}-role`} className="cv-input" value={role} onChange={(event) => changeWhatFor(() => setRole(event.target.value))} placeholder={copy.rolePlaceholder} maxLength={80} autoComplete="organization-title" dir="auto" />
              </div>
            </div>
            <div className="cv-suggest" role="group" aria-labelledby={`${id}-suggest`}>
              <span id={`${id}-suggest`}>{copy.suggestions}</span>
              {CV_FIELDS.map((field) => (
                <button key={field} type="button" aria-pressed={role === copy.fields[field]} onClick={() => changeWhatFor(() => setRole(copy.fields[field]))}>
                  {copy.fields[field]}
                </button>
              ))}
            </div>
            <details className="cv-posting" open={postingOpen} onToggle={(event) => setPostingOpen(event.currentTarget.open)}>
              <summary>{copy.postingTitle}</summary>
              <div className="cv-posting__body">
                <label htmlFor={`${id}-posting`} className="sr-only">{copy.postingLabel}</label>
                <textarea id={`${id}-posting`} value={posting} onChange={(event) => changeWhatFor(() => setPosting(event.target.value))} placeholder={copy.postingPlaceholder} rows={5} maxLength={8000} dir="auto" />
                {aiLive ? (
                  <button type="button" className="button cv-button--secondary" onClick={matchWithAi} disabled={!hasPosting || jdState === "working"}>
                    {jdState === "working" ? copy.jdWorking : copy.postingAi}
                  </button>
                ) : null}
                {jdMessage ? <p className="cv-note" role="status">{jdMessage}</p> : null}
              </div>
            </details>
            {pick?.cover ? (
              <div className="cv-cover">
                <p className="cv-cover__title">{copy.cover}</p>
                <p lang="en" dir="ltr">{pick.cover.message}</p>
                <p className="cv-note">{copy.coverHint}</p>
              </div>
            ) : null}
          </div>

          <div className="cv-preview">
            <CvPaper cv={resolved} footer={footer} label={copy.previewAria} />
            <p className="cv-preview__caption">{copy.previewCaption}</p>
          </div>

          <div className="cv-extra">
            <details className="cv-email">
              <summary>{copy.emailTitle}</summary>
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
            </details>
            <div ref={slotRef} className="agent-turnstile" />
            <p className="cv-privacy">{copy.privacy}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
