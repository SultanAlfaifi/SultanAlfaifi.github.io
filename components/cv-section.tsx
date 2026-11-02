"use client";

import { useCallback, useEffect, useEffectEvent, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowDownToLine, Info, X } from "lucide-react";
import { CV_FIELDS, type CvTarget } from "@/data/cv";
import { getContent, type Locale } from "@/data/i18n";
import { TAILOR_CV, type TailorRequest } from "@/lib/agent/assistant";
import { AgentError, agentConfigured, checkHealth, confirmCvCode, notifyCvDownload, requestCvCode, tailorCv, turnstileToken, withSession } from "@/lib/agent/client";
import { renderCvPdf, saveBlob } from "@/lib/cv/browser-render";
import { cvFileName } from "@/lib/cv/document";
import { cvDate, generalFooter, preparedFooter } from "@/lib/cv/fit";
import { decodeSelection, encodeSelection, resolveSelection, roleTarget, selectForTarget, selectForText, type CvSelection } from "@/lib/cv/select";
import { VISITOR_EVENT, type VisitorDetail } from "@/lib/visitor";
import { CvPaper } from "./cv-paper";
import { bloomBrandOrb } from "./living-orb";
import { motionAllowed } from "./motion-preference";
import { ChapterEyebrow, SplitWords } from "./section-header";

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

// public/cv/fitted.json: each field's encoded lines, kept only when they decode back to that field.
function decodeFitted(data: Record<string, unknown>) {
  const next: Partial<Record<CvTarget, CvSelection>> = {};
  for (const [name, encoded] of Object.entries(data)) {
    const decoded = typeof encoded === "string" ? decodeSelection(encoded) : null;
    if (decoded && decoded.target === name) next[decoded.target] = decoded;
  }
  return next;
}

function writeDraft(draft: Omit<Draft, "savedAt">) {
  try {
    if (!draft.company && !draft.role && !draft.posting) window.localStorage.removeItem(DRAFT_KEY);
    else window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // Storage can be blocked; the form still works, it just won't remember.
  }
}

// `fitted` comes from the build (lib/cv/fitted-file.ts), so the first paper, the one in the server HTML and
// the one without JavaScript, already fits one page.
export function CvSection({ locale = "en", fitted: fittedAtBuild = {} }: { locale?: Locale; fitted?: Record<string, string> }) {
  const { ui } = getContent(locale);
  const copy = ui.cv;
  const id = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const forRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const postingRef = useRef<HTMLDivElement>(null);
  const keepChipsClosed = useRef(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [posting, setPosting] = useState("");
  // "More options" holds the job posting and the emailed copy; the role chips show while the visitor is
  // choosing a role (component state, not :focus-within, which Safari never sets for a clicked button).
  const [moreOpen, setMoreOpen] = useState(false);
  const [chipsOpen, setChipsOpen] = useState(false);
  const [fitted, setFitted] = useState(() => decodeFitted(fittedAtBuild));
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
  // The paper's footer turns to "Prepared for …" once the visitor pauses (or the PDF is ready), not on
  // every keystroke, so it lights up once.
  const [settledFooter, setSettledFooter] = useState(footer);
  const paperFooter = !personal || ready ? footer : settledFooter;

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
        const next = decodeFitted(data);
        if (Object.keys(next).length) setFitted(next);
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
      setMoreOpen(Boolean(draft.posting));
      setRestored(true);
      started.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (started.current) writeDraft({ company, role, posting });
  }, [company, role, posting]);

  // A hiring visitor who named their company or role on the welcome screen finds the CV ready for it.
  useEffect(() => {
    const prefill = (event: Event) => {
      const { company: name, role: title } = (event as CustomEvent<VisitorDetail>).detail;
      if (!name && !title) return;
      started.current = true;
      setCompany((name ?? "").slice(0, 60));
      setRole((title ?? "").slice(0, 80));
      setPick(null);
    };
    window.addEventListener(VISITOR_EVENT, prefill);
    return () => window.removeEventListener(VISITOR_EVENT, prefill);
  }, []);

  // The assistant can ask for a CV from the chat: the form fills in with the role and the posting, and
  // the same AI match the visitor could run by hand runs here, so they watch the paper change.
  const onTailor = useEffectEvent((request: TailorRequest) => {
    started.current = true;
    setCompany(request.company.slice(0, 60));
    setRole(request.role.slice(0, 80));
    setPosting(request.description);
    setMoreOpen(true);
    setDownload("idle");
    void matchWithAi(request.description, request.company);
    // The assistant has already started taking the visitor to the CV; once that settles, the posting is
    // brought into view beside the page.
    window.setTimeout(() => postingRef.current?.scrollIntoView({ block: "nearest", behavior: motionAllowed() ? "smooth" : "auto" }), 900);
  });
  useEffect(() => {
    const listener = (event: Event) => onTailor((event as CustomEvent<TailorRequest>).detail);
    window.addEventListener(TAILOR_CV, listener);
    return () => window.removeEventListener(TAILOR_CV, listener);
  }, []);

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

  useEffect(() => {
    const timer = window.setTimeout(() => setSettledFooter(footer), PREPARE_MS);
    return () => window.clearTimeout(timer);
  }, [footer]);

  // The approval moment: a CV that landed makes the brand mark bloom once, as the hero's yes does. The page's
  // lift and its light turning to glacier are in cv-paper.tsx and app/cv.css. With motion off, only the
  // status line says it.
  useEffect(() => {
    if (download === "done" && motionAllowed()) bloomBrandOrb();
  }, [download]);

  // The role chips close on a press outside the "who's it for" group.
  useEffect(() => {
    if (!chipsOpen) return;
    const outside = (event: PointerEvent) => {
      if (!forRef.current?.contains(event.target as Node)) setChipsOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [chipsOpen]);

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

  async function matchWithAi(text = posting, name = company) {
    touch();
    if (text.trim().length < POSTING_MIN || !slotRef.current) return;
    setJdState("working");
    try {
      const result = await withSession(slotRef.current, locale, (token) => tailorCv(token, text.trim(), name.trim(), locale));
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
      const result = await requestCvCode(token, email.trim(), locale);
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
      const payload = { email: email.trim(), code: code.trim(), selection: encodeSelection(shown), company: company.trim(), locale, ...(cover ? { coverMessage: cover.message, signature: cover.signature } : {}) };
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

  // «حمّل السيرة لـ Salla»: the company sits in its own direction, whatever the page's.
  const [forBefore, forAfter] = copy.downloadFor("\u0000").split("\u0000");

  // The chips open when the role field gets focus or a click, and stay open while focus or the pointer is in
  // the group. Escape closes them and hands focus back to the role field without reopening them.
  function openChips() {
    if (keepChipsClosed.current) {
      keepChipsClosed.current = false;
      return;
    }
    setChipsOpen(true);
  }

  return (
    <section ref={sectionRef} id="cv" className="section cv-section li-chapter" aria-label={copy.title}>
      <div className="page-shell cv-grid">
        <div className="cv-text">
          <header className="cv-head">
            <ChapterEyebrow />
            <h2 className="cv-title split-heading"><SplitWords text={copy.title} /></h2>
            <p className="cv-lead">{copy.description}</p>
          </header>

          <div className="cv-get">
            {personal ? (
              <button type="button" className="li-btn li-btn--primary cv-download" onClick={downloadPrepared} disabled={download === "building"}>
                <ArrowDownToLine aria-hidden="true" />
                <span>{download === "building" ? copy.building : name ? <>{forBefore}<bdi>{name}</bdi>{forAfter}</> : copy.download}</span>
              </button>
            ) : (
              <a className="li-btn li-btn--primary cv-download" href={GENERAL_CV} download onClick={() => { finish(); setDownload("done"); }}>
                <ArrowDownToLine aria-hidden="true" />
                <span>{copy.download}</span>
              </a>
            )}
            <p className="cv-get__note">{copy.downloadNote}</p>
            {download === "done" ? <p className="cv-note cv-note--done" role="status"><i className="li-lamp li-k-verifies" aria-hidden="true" />{copy.downloaded}</p> : null}
            {download === "failed" ? (
              <p className="cv-note cv-note--warn" role="status">{copy.downloadFailed} <a href={GENERAL_CV} download>{copy.generalInstead}</a></p>
            ) : null}
            {offer ? (
              <div className="cv-offer" role="status">
                <p>{copy.hesitation}</p>
                <a href={GENERAL_CV} download onClick={() => { completed.current = true; setOffer(false); }}>{copy.hesitationAction}</a>
                <button type="button" onClick={() => setOffer(false)} aria-label={copy.hesitationDismiss}><X size={18} aria-hidden="true" /></button>
              </div>
            ) : null}
            {restored ? <p className="cv-note" role="status">{copy.restored}</p> : null}
          </div>

          <div
            ref={forRef}
            className="cv-for"
            onBlur={(event) => {
              const next = event.relatedTarget as Node | null;
              if (next && !event.currentTarget.contains(next)) setChipsOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Escape" || !chipsOpen) return;
              setChipsOpen(false);
              // Only a focus that this Escape causes is skipped; when the role field already has focus, the
              // next time the visitor comes back to it the chips open as usual.
              if (document.activeElement !== roleRef.current) {
                keepChipsClosed.current = true;
                roleRef.current?.focus();
              }
            }}
          >
            <div className="cv-for__label">
              <h3>{copy.forTitle}</h3>
              <p className="cv-for__hint">{copy.forHint}</p>
            </div>
            <div className="cv-capsule">
              <label className="cv-field">
                <span className="cv-field__label">{copy.company}</span>
                <input className="cv-input" value={company} onChange={(event) => { touch(); setCompany(event.target.value); setDownload("idle"); }} placeholder={copy.companyPlaceholder} maxLength={60} autoComplete="organization" dir="auto" />
              </label>
              <label className="cv-field">
                <span className="cv-field__label">{copy.role}</span>
                <input ref={roleRef} className="cv-input" value={role} onChange={(event) => changeWhatFor(() => setRole(event.target.value))} onFocus={openChips} onClick={() => setChipsOpen(true)} placeholder={copy.rolePlaceholder} maxLength={80} autoComplete="organization-title" dir="auto" />
              </label>
            </div>
            <div className={`cv-chips${chipsOpen ? " is-open" : ""}`} inert={!chipsOpen}>
              <div className="cv-chips__inner">
                <div className="cv-suggest" role="group" aria-labelledby={`${id}-suggest`}>
                  <span id={`${id}-suggest`}>{copy.suggestions}</span>
                  {CV_FIELDS.map((field) => (
                    <button key={field} type="button" aria-pressed={role === copy.fields[field]} onClick={() => changeWhatFor(() => setRole(copy.fields[field]))}>
                      {copy.fields[field]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="cv-notify"><Info aria-hidden="true" /><span>{copy.notify}</span></p>
          </div>

          <details className="cv-more" open={moreOpen} onToggle={(event) => setMoreOpen(event.currentTarget.open)}>
            <summary>
              <span className="cv-more__label"><span className="cv-more__title">{copy.more}</span> <span className="cv-more__hint">· {copy.moreHint}</span></span>
              <span className="cv-more__icon" aria-hidden="true" />
            </summary>
            <div className="cv-more__panel li-glass">
              <div ref={postingRef} className="cv-posting">
                <h3>{copy.postingTitle}</h3>
                <label htmlFor={`${id}-posting`} className="sr-only">{copy.postingLabel}</label>
                <textarea id={`${id}-posting`} className="cv-input cv-input--area" value={posting} onChange={(event) => changeWhatFor(() => setPosting(event.target.value))} placeholder={copy.postingPlaceholder} rows={5} maxLength={8000} dir="auto" />
                {aiLive ? (
                  <button type="button" className="li-btn li-btn--ghost cv-secondary" onClick={() => void matchWithAi()} disabled={!hasPosting || jdState === "working"}>
                    {jdState === "working" ? copy.jdWorking : copy.postingAi}
                  </button>
                ) : null}
                {jdMessage ? <p className="cv-note" role="status">{jdMessage}</p> : null}
                {pick?.cover ? (
                  <div className="cv-cover">
                    <p className="cv-cover__title">{copy.cover}</p>
                    <p lang="en" dir="ltr">{pick.cover.message}</p>
                    <p className="cv-note">{copy.coverHint}</p>
                  </div>
                ) : null}
              </div>
              <div className="cv-email">
                <h3>{copy.emailTitle}</h3>
                {emailState === "sent" || emailState === "confirming" || emailState === "bad" || emailState === "done" ? (
                  <form onSubmit={confirmCode}>
                    <p className="cv-note" role="status">{copy.codeSent(email.trim())}{devCode ? ` (dev: ${devCode})` : ""}</p>
                    <label htmlFor={`${id}-code`}>{copy.codeLabel}</label>
                    <div className="cv-inline">
                      <input id={`${id}-code`} className="cv-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" disabled={emailState === "done"} dir="ltr" />
                      <button type="submit" className="li-btn li-btn--ghost cv-secondary" disabled={code.length !== 6 || emailState === "confirming" || emailState === "done"}>{emailState === "confirming" ? copy.confirming : copy.confirm}</button>
                    </div>
                    {emailState === "bad" ? <p className="cv-note cv-note--warn" role="alert">{copy.badCode}</p> : null}
                    {emailState === "done" ? <p className="cv-note" role="status">{copy.emailed}</p> : null}
                  </form>
                ) : (
                  <form onSubmit={sendCode}>
                    <label htmlFor={`${id}-email`}>{copy.emailLabel}</label>
                    <div className="cv-inline">
                      <input id={`${id}-email`} className="cv-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} dir="ltr" />
                      <button type="submit" className="li-btn li-btn--ghost cv-secondary" disabled={!email.includes("@") || emailState === "sending"}>{emailState === "sending" ? copy.sendingCode : copy.sendCode}</button>
                    </div>
                    {emailState === "offline" ? <p className="cv-note" role="status">{copy.emailOffline}</p> : null}
                    {emailState === "failed" ? <p className="cv-note cv-note--warn" role="status">{copy.emailFailed}</p> : null}
                  </form>
                )}
                <p className="cv-email__privacy">{copy.emailPrivacy}</p>
              </div>
            </div>
          </details>
          {/* Outside the fold: the posting match, the email code and the notify all need it, open or closed. */}
          <div ref={slotRef} className="agent-turnstile" />
        </div>

        <div className="cv-stagewrap">
          <CvPaper cv={resolved} footer={paperFooter} label={copy.previewAria} caption={copy.previewCaption} approved={download === "done"} />
        </div>
      </div>
    </section>
  );
}
