"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { ArrowUpRight, Check, ClipboardPaste, Copy } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { agentConfigured, prepareSession, readIntro, withSession } from "@/lib/agent/client";
import { revealAnchor } from "@/lib/agent/reveal";
import { AI_APPS, copyText, introPrompt, parseCard, timeGreeting, type AiAppId, type VisitorProfile } from "@/lib/intro";
import { markLanding, markWelcome, rememberLanguage, saveVisitor, storeProfile, WELCOME_EVENT, type VisitorDetail } from "@/lib/visitor";
import { AiMark } from "./ai-marks";
import { LivingOrb, type LivingOrbControls, type LivingOrbState } from "./living-orb";
import { motionAllowed } from "./motion-preference";

type Step = "ask" | "listen" | "reading" | "ready";
type App = AiAppId | "other";
type Shard = { text: string; x: number; y: number; cx: number; cy: number; delay: number };

// The app the visitor went to, kept for this tab: a phone may reload the page while they're in the AI app,
// and they should come back to the paste step, not the start.
const PENDING_KEY = "portfolio-intro-app";
// Reading never flashes past: the orb thinks for at least this long, even when the card is read locally.
const MIN_READ_MS = 2200;
// How long the reading waits for the agent before greeting from the card alone, and how long a slower
// answer may still arrive and fill in the greeting, or the page if the visitor has already come in.
const AGENT_WAIT_MS = 8000;
const AGENT_LATE_MS = 30000;
// The orb's flight into the hero, and the moment it hands over to the hero's own orb.
const FLIGHT_MS = 1300;
const LANDING = 0.78;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function pendingApp(): App | null {
  try {
    const value = window.sessionStorage.getItem(PENDING_KEY);
    return value === "other" || AI_APPS.some((app) => app.id === value) ? (value as App) : null;
  } catch {
    return null;
  }
}

function rememberApp(app: App | null) {
  try {
    if (app) window.sessionStorage.setItem(PENDING_KEY, app);
    else window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Without storage a reload just starts over.
  }
}

// A line the orb says: the words arrive one after another, blur to sharp (welcome.css). Words only, never
// letters, so Arabic keeps its joins; the element's text is exactly the line.
function Voice({ text, as: Tag = "p", className, delay = 0, id }: { text: string; as?: "p" | "h2"; className?: string; delay?: number; id?: string }) {
  let index = 0;
  const words: ReactNode[] = text.split(/(\s+)/).map((part, key) => (/^\s+$/.test(part) || !part ? part : <span key={key} className="welcome__word" style={{ "--i": index++ } as CSSProperties}>{part}</span>));
  return <Tag id={id} className={`welcome__voice ${className ?? ""}`} style={{ "--d": `${delay}ms` } as CSSProperties}>{words}</Tag>;
}

// The short lines a card is made of, for the moment it's drawn into the orb.
function shardsOf(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s>*`#•-]+|[*`#]+/g, "").trim())
    .map((line) => (line.includes(":") ? line.slice(line.indexOf(":") + 1).trim() : line))
    .filter((line) => line.length > 1 && !/^(?:غير معروف|unknown)$/i.test(line))
    .slice(0, 8)
    .map((line) => (line.length > 30 ? `${line.slice(0, 28)}…` : line));
}

// Asks first-time visitors one thing before the site, as a scene with one idea per moment. The living orb
// asks to meet them through their own AI; they send the prompt to ChatGPT, Claude or Gemini, paste the
// card it writes anywhere on the screen, and watch it drawn into the orb. The orb greets them by name,
// then flies down into the hero and becomes its orb as the arranged page arrives around it. "No thanks"
// and Escape take the same flight. The boot script decides whether the screen shows (and paints it before
// React loads); this component makes it a real modal dialog once hydrated.
export function WelcomeScreen({ locale = "en" }: { locale?: Locale }) {
  const { ui, projects } = getContent(locale);
  const copy = ui.welcome;
  const prompt = introPrompt(locale);
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const orbRef = useRef<LivingOrbControls>(null);
  const checkRef = useRef<HTMLDivElement>(null);
  const catchRef = useRef<HTMLTextAreaElement>(null);
  const readingRef = useRef<AbortController | null>(null);
  // The profile the visitor came in with, while the agent may still be writing a fuller one.
  const enteredRef = useRef<VisitorProfile | null>(null);
  const [step, setStep] = useState<Step>("ask");
  const [app, setApp] = useState<App | null>(null);
  // The opening and the greeting are spoken; once a moment has been said, the orb goes back to listening.
  const [settled, setSettled] = useState<Step | null>(null);
  const [manual, setManual] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shards, setShards] = useState<Shard[]>([]);
  const [guess, setGuess] = useState<VisitorProfile | null>(null);
  const [profile, setProfile] = useState<VisitorProfile | null>(null);
  const [leaving, setLeaving] = useState(false);
  // The living orb lives only while the screen is up, so its WebGL context is free again for the page.
  const [showing, setShowing] = useState(false);
  const [device, setDevice] = useState<{ canPaste: boolean; keys: string | null }>({ canPaste: false, keys: null });

  const appInfo = AI_APPS.find((item) => item.id === app);
  const comma = locale === "ar" ? "، " : ", ";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const open = (resume: boolean) => {
      // A screen opened again starts from the orb's own place, not where its last flight left it.
      slotRef.current?.getAnimations().forEach((animation) => animation.cancel());
      markWelcome(true);
      setShowing(true);
      setLeaving(false);
      const pending = resume ? pendingApp() : null;
      setApp(pending);
      setStep(pending ? "listen" : "ask");
      if (!dialog.open) dialog.showModal();
    };
    const closed = () => setShowing(false);
    dialog.addEventListener("close", closed);
    // A keyboard hint only where there's a keyboard; a Paste button wherever the browser can read the clipboard.
    const fine = window.matchMedia("(pointer: fine)").matches;
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    setDevice({ canPaste: typeof navigator.clipboard?.readText === "function", keys: fine ? (mac ? "⌘" : "Ctrl") : null });
    if (document.documentElement.dataset.welcome === "show") open(true);
    const reopen = () => {
      // Choosing again: a reading still on its way from last time no longer applies.
      readingRef.current?.abort();
      readingRef.current = null;
      enteredRef.current = null;
      setText("");
      setError(null);
      setProfile(null);
      setManual(false);
      setSettled(null);
      open(false);
    };
    window.addEventListener(WELCOME_EVENT, reopen);
    return () => {
      window.removeEventListener(WELCOME_EVENT, reopen);
      dialog.removeEventListener("close", closed);
    };
  }, []);

  useEffect(() => {
    if (step === "ready") orbRef.current?.bloom();
    if (step !== "ask" && step !== "ready") return;
    const timer = window.setTimeout(() => setSettled(step), step === "ready" ? 3200 : 2600);
    return () => window.clearTimeout(timer);
  }, [step]);
  const orbState: LivingOrbState = step === "reading" ? "thinking" : step === "listen" || settled === step ? "listening" : "speaking";

  // Leaving: the words fade, the dark lifts, and the orb flies to the hero's orb and hands over to it, so
  // the visitor never sees a screen close. Without motion the screen just closes.
  function finish(detail: VisitorDetail, then?: () => void) {
    const dialog = dialogRef.current;
    rememberApp(null);
    saveVisitor(detail);
    const close = () => {
      markLanding(false);
      if (!dialog?.open) return;
      dialog.close();
      // Closing hands focus back to <body>; it goes to the headline instead, so the next Tab is in the
      // hero, not in the browser's own toolbar.
      const title = document.getElementById("hero-title");
      if (title) {
        if (!title.hasAttribute("tabindex")) title.tabIndex = -1;
        title.focus({ preventScroll: true });
      }
      then?.();
    };
    const slot = slotRef.current;
    const target = document.querySelector<HTMLElement>(".hero-stage .hero-orb");
    if (!dialog?.open || !motionAllowed() || !slot || !target || typeof slot.animate !== "function" || window.scrollY > 40) {
      markWelcome(false);
      return close();
    }
    // The hero starts arriving underneath, its own orb hidden until this one lands on it.
    markLanding(true);
    markWelcome(false);
    setLeaving(true);
    slot.getAnimations().forEach((animation) => animation.cancel());
    const from = slot.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const scale = target.offsetWidth / Math.max(1, slot.offsetWidth);
    const move = `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px, ${to.top + to.height / 2 - (from.top + from.height / 2)}px) scale(${scale})`;
    // The easing is on the flight alone, so the orb lands at LANDING and only then fades into the hero's.
    slot.animate(
      [{ transform: "none", opacity: 1, easing: "cubic-bezier(0.65, 0, 0.35, 1)" }, { transform: move, opacity: 1, offset: LANDING }, { transform: move, opacity: 0 }],
      { duration: FLIGHT_MS, fill: "forwards" }
    ).finished.then(close, close);
    // The hero's orb starts to show just before this one settles, so the light never dips.
    window.setTimeout(() => markLanding(false), FLIGHT_MS * LANDING - 120);
    // A tab in the background may not run the animation; the screen still goes.
    window.setTimeout(close, FLIGHT_MS + 400);
  }

  // "No thanks" also drops a reading still on its way: the visitor chose not to be read.
  function skip() {
    readingRef.current?.abort();
    readingRef.current = null;
    finish({ visitor: "skip" });
  }

  // The tile is a real link, so the app opens in a new tab without a pop-up blocker in the way. The
  // prompt is copied in the same click, for apps that don't read it from the link.
  function pick(next: App) {
    void copyText(prompt);
    setApp(next);
    setError(null);
    setManual(false);
    setStep("listen");
    rememberApp(next);
    // The human check runs while the visitor is away, so reading the card starts straight away.
    if (checkRef.current) prepareSession(checkRef.current, locale);
  }

  async function copyAgain() {
    setCopied(await copyText(prompt));
    window.setTimeout(() => setCopied(false), 2200);
  }

  function copyOther() {
    void copyAgain();
    pick("other");
  }

  async function pasteFromClipboard() {
    try {
      const value = await navigator.clipboard.readText();
      if (value) void read(value);
    } catch {
      // Permission refused: the visitor can still paste with the keyboard or type it.
      setManual(true);
    }
  }

  // The card's lines scatter around the orb and are drawn into it.
  function drawIn(value: string) {
    const slot = slotRef.current?.getBoundingClientRect();
    if (!slot || !motionAllowed()) return;
    const cx = slot.left + slot.width / 2;
    const cy = slot.top + slot.height / 2;
    const reach = Math.min(window.innerWidth, window.innerHeight) * 0.42;
    const lines = shardsOf(value);
    setShards(lines.map((line, index) => {
      const angle = (index / lines.length) * Math.PI * 2 + 0.4;
      const distance = reach * (0.75 + ((index * 37) % 25) / 100);
      return { text: line, x: cx + Math.cos(angle) * distance, y: cy + Math.sin(angle) * distance * 0.7, cx, cy, delay: index * 90 };
    }));
    window.setTimeout(() => setShards([]), 2200);
  }

  async function read(source: string) {
    const value = source.trim();
    if (value.length < 20) return setError(copy.tooShort);
    const card = parseCard(value);
    setError(null);
    setGuess(card);
    drawIn(value);
    setStep("reading");
    readingRef.current?.abort();
    enteredRef.current = null;
    const controller = new AbortController();
    readingRef.current = controller;
    const timer = window.setTimeout(() => controller.abort(), AGENT_LATE_MS);
    const agent = agentConfigured && checkRef.current
      ? withSession(checkRef.current, locale, (token) => readIntro(token, value.slice(0, 3000), locale, controller.signal)).then((result) => result.profile, () => null).finally(() => window.clearTimeout(timer))
      : Promise.resolve(null);
    // undefined: the agent hasn't answered yet; null: it couldn't read the card.
    const [fromAgent] = await Promise.all([Promise.race([agent, wait(AGENT_WAIT_MS).then(() => undefined)]), wait(motionAllowed() ? MIN_READ_MS : 0)]);
    if (readingRef.current !== controller) return;
    // Without the agent the card is still read line by line: the name and why they came, no bridge. Only a
    // text that isn't the card waits for the agent as long as it takes.
    let result = fromAgent ?? card;
    if (fromAgent === undefined && !card) result = await agent;
    if (readingRef.current !== controller) return;
    if (!result) {
      setStep("listen");
      setError(copy.unreadable);
      return;
    }
    setProfile(result);
    setStep("ready");
    if (fromAgent !== undefined || result !== card) return;
    // The agent is still writing. Its fuller reading replaces the card's when it lands: in the greeting, or
    // on the page around the visitor if they have already come in (with the order they came in with).
    void agent.then((late) => {
      if (!late || readingRef.current !== controller) return;
      const entered = enteredRef.current;
      if (!entered) return setProfile(late);
      storeProfile({ ...late, intent: entered.intent, name: late.name || entered.name, projects: late.projects.length ? late.projects : entered.projects });
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void read(text);
  }

  // Paste anywhere while the orb listens. On a keyboard device a hidden box holds focus, so every browser
  // (Safari included) fires the paste; the visible box, when open, keeps its own text.
  useEffect(() => {
    if (step !== "listen") return;
    if (device.keys && !manual) catchRef.current?.focus({ preventScroll: true });
    const onPaste = (event: ClipboardEvent) => {
      const value = event.clipboardData?.getData("text") ?? "";
      const own = event.target instanceof HTMLTextAreaElement && event.target !== catchRef.current;
      if (own) {
        if (parseCard(value)) window.setTimeout(() => void read(value), 320);
        return;
      }
      event.preventDefault();
      void read(value);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
    // read only needs the latest render's values when it runs; re-subscribing on every keystroke isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, manual, device.keys]);

  // The project the agent tied the visitor to, or the first in the showcase when it couldn't.
  const featured = [...projects].filter((item) => item.enabled && item.showcase).sort((a, b) => (a.showcase ?? 99) - (b.showcase ?? 99))[0];
  const project = projects.find((item) => item.enabled && item.slug === profile?.projects[0]) ?? featured;

  function enter(toProject = false) {
    if (!profile) return skip();
    const hiring = profile.intent === "hiring";
    const kept: VisitorProfile = { ...profile, projects: profile.projects.length ? profile.projects : project ? [project.slug] : [] };
    enteredRef.current = kept;
    finish(
      { visitor: profile.intent, company: hiring ? profile.organization : undefined, role: hiring ? profile.hiringRole : undefined, profile: kept },
      toProject && project ? () => window.setTimeout(() => revealAnchor(`project-${project.slug}`), 80) : undefined
    );
  }

  const title = `${id}-title`;
  const name = profile?.name || "";
  const arranged = profile ? [copy.arrangedFor[profile.intent], profile.intent === "hiring" && profile.organization ? copy.cvFor(profile.organization) : "", agentConfigured ? copy.agentKnows : ""].filter(Boolean) : [];
  const echoes = guess ? [guess.field, guess.organization, guess.workingOn].filter(Boolean).map((item) => (item.length > 26 ? `${item.slice(0, 24)}…` : item)).slice(0, 3) : [];

  return (
    <dialog
      ref={dialogRef}
      className="welcome"
      data-step={step}
      data-leaving={leaving ? "" : undefined}
      aria-labelledby={title}
      onCancel={(event) => {
        event.preventDefault();
        if (step === "ready") enter();
        else skip();
      }}
    >
      <div className="welcome__ground" aria-hidden="true"><div className="aurora"><i /><i /><i /></div></div>
      <div className="welcome__top">
        <p className="welcome__brand">
          <Image src="/brand/sultan-alfaifi-mark.svg" alt="" width={32} height={32} />
          {copy.brand}
        </p>
        <div className="welcome__tools">
          <a className="welcome__language" href={ui.nav.language.href} hrefLang={ui.nav.language.hrefLang} lang={ui.nav.language.hrefLang} onClick={() => rememberLanguage(ui.nav.language.hrefLang)}>
            {ui.nav.language.short}
          </a>
          {/* On the first step a wide screen shows the way out under the apps instead (welcome.css). */}
          <button type="button" className="welcome__skip" onClick={skip}>{copy.skipShort}</button>
        </div>
      </div>

      <div className="welcome__stage">
        {/* The slot keeps its size before the script arrives, so nothing moves when the orb appears. */}
        <span ref={slotRef} className="welcome__orb-slot" aria-hidden="true">
          {/* overWelcome: the one orb that keeps moving while the screen covers the page (living-orb.tsx). */}
          {showing ? <LivingOrb ref={orbRef} className="welcome__orb" size="100%" halo={1} state={orbState} overWelcome /> : null}
          {step === "reading" ? echoes.map((echo, index) => <span key={echo} className={`welcome__echo welcome__echo--${index + 1}`} dir="auto">{echo}</span>) : null}
        </span>

        {step === "ask" ? (
          <div className="welcome__body" key="ask">
            <Voice className="welcome__whisper" text={copy.whisper} delay={500} />
            <Voice as="h2" id={title} className="welcome__line" text={copy.title} delay={1300} />
            <ul className="welcome__apps" aria-label={copy.apps}>
              {AI_APPS.map((item) => (
                <li key={item.id}>
                  <a className="welcome__app" href={item.href(prompt)} target="_blank" rel="noopener noreferrer" onClick={() => pick(item.id)} data-app={item.id}>
                    <span className="welcome__mark"><AiMark app={item.id} size={30} /></span>
                    <span className="welcome__app-name">{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="welcome__quiet">
              <button type="button" onClick={copyOther}>
                {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                {copied ? copy.copied : copy.other}
              </button>
              <details className="welcome__prompt">
                <summary>{copy.seePrompt}</summary>
                <pre dir="auto">{prompt}</pre>
              </details>
            </div>
            <button type="button" className="welcome__no" onClick={skip}>{copy.skip}</button>
            <p className="welcome__privacy">{copy.privacy}</p>
          </div>
        ) : null}

        {step === "listen" ? (
          <div className="welcome__body" key="listen">
            <Voice className="welcome__whisper" text={app && app !== "other" ? (appInfo?.prefills ? copy.listenAside.prefill(appInfo.name) : copy.listenAside.paste(appInfo?.name ?? "")) : copy.listenAside.other} delay={100} />
            <Voice as="h2" id={title} className="welcome__line welcome__line--listen" text={copy.listenTitle} delay={500} />
            <div className="welcome__paste-row">
              {device.keys ? (
                <span className="welcome__keys">
                  <kbd>{device.keys}</kbd><kbd>V</kbd>
                  <span>{copy.anywhere}</span>
                </span>
              ) : null}
              {device.canPaste ? (
                <button type="button" className="welcome__paste" onClick={pasteFromClipboard}>
                  <ClipboardPaste size={18} aria-hidden="true" />{copy.paste}
                </button>
              ) : null}
            </div>
            {manual ? (
              <form className="welcome__card" onSubmit={submit}>
                <label htmlFor={`${id}-card`}>{copy.pasteLabel}</label>
                <textarea
                  id={`${id}-card`}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={copy.pastePlaceholder}
                  rows={6}
                  maxLength={4000}
                  // An empty box follows the page, so the placeholder reads the right way; a card follows its own text.
                  dir={text ? "auto" : locale === "ar" ? "rtl" : "ltr"}
                  spellCheck={false}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                  autoFocus
                />
                <button type="submit" className="li-btn li-btn--primary welcome__enter">{copy.read}</button>
              </form>
            ) : null}
            {error ? <p id={`${id}-error`} className="welcome__error" role="alert">{error}</p> : null}
            <p className="welcome__quiet">
              {appInfo ? (
                <a href={appInfo.href(prompt)} target="_blank" rel="noopener noreferrer" onClick={() => void copyText(prompt)}>
                  {copy.reopen(appInfo.name)} <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              ) : null}
              <button type="button" onClick={() => void copyAgain()}>
                {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copied ? copy.copied : copy.copyAgain}
              </button>
              {manual ? null : <button type="button" onClick={() => setManual(true)}>{copy.manual}</button>}
              <button type="button" onClick={() => { rememberApp(null); setError(null); setStep("ask"); }}>{copy.back}</button>
            </p>
            {/* Holds focus on keyboard devices, so a paste anywhere on the screen lands. */}
            {device.keys && !manual ? <textarea ref={catchRef} className="welcome__catch" aria-label={copy.pasteLabel} tabIndex={-1} defaultValue="" /> : null}
          </div>
        ) : null}

        {step === "reading" ? (
          <div className="welcome__body" key="reading" aria-live="polite">
            <Voice as="h2" id={title} className="welcome__line welcome__line--reading" text={guess?.name ? copy.readingName(guess.name) : copy.reading} delay={500} />
          </div>
        ) : null}

        {step === "ready" && profile ? (
          <div className="welcome__body" key="ready">
            <Voice className="welcome__whisper" text={app && app !== "other" ? copy.introduced(appInfo?.name ?? "") : copy.introducedOther} delay={200} />
            <Voice as="h2" id={title} className="welcome__line welcome__line--greet" text={`${timeGreeting(locale)}${name ? `${comma}${name}` : ""}`} delay={500} />
            {/* Keyed by its words, so a line the agent sends late arrives word by word like the first. */}
            <Voice key={profile.bridge || "card"} className="welcome__bridge" text={profile.bridge || copy.fallbackBridge} delay={1300} />
            <p className="welcome__arranged">{copy.arrangedTitle} {arranged.join(" · ")}</p>
            <div className="welcome__actions">
              <button type="button" className="li-btn li-btn--primary welcome__enter" onClick={() => enter()} autoFocus>{copy.enter}</button>
              {project ? <button type="button" className="welcome__then" onClick={() => enter(true)}>{copy.startWith(project.title)}</button> : null}
            </div>
          </div>
        ) : null}
      </div>

      {shards.length ? (
        <div className="welcome__shards" aria-hidden="true">
          {shards.map((shard, index) => (
            <span
              key={index}
              className="welcome__shard"
              dir="auto"
              style={{ "--x": `${shard.x}px`, "--y": `${shard.y}px`, "--cx": `${shard.cx}px`, "--cy": `${shard.cy}px`, "--d": `${shard.delay}ms` } as CSSProperties}
            >
              {shard.text}
            </span>
          ))}
        </div>
      ) : null}
      {/* Turnstile's check renders here, invisible unless it needs the visitor. */}
      <div ref={checkRef} className="welcome__check" />
    </dialog>
  );
}
