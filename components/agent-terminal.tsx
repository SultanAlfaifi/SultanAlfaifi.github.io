"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { getContent, type Locale, type PortfolioContent } from "@/data/i18n";
import { buildAnchors, collectUrls } from "@/lib/agent/anchors";
import { AgentError, agentConfigured, checkHealth, streamChat, withSession, type AgentAction, type ChatTurn, type FitReport } from "@/lib/agent/client";
import { revealAnchor } from "@/lib/agent/reveal";
import { AgentText, DraftCard, FitCard, type Draft } from "./agent-cards";
import { motionAllowed, setMotionEnabled, toast } from "./motion-preference";
import { foundSecrets, SECRET_IDS, secretCopy, unlockSecret } from "./secrets";

type LineKind = "input" | "out" | "muted" | "ok" | "warn" | "accent" | "answer";
type Card = { type: "draft"; draft: Draft } | { type: "fit"; report: FitReport } | { type: "link"; href: string; label: string };
type Line = { id: number; kind: LineKind; text: string; href?: string; step?: string; streaming?: boolean; card?: Card };
type Output = Omit<Line, "id">;
type AgentState = "off" | "checking" | "live" | "offline" | "budget";

// Commands stay in English on both pages; answers follow the page language.
const COMMANDS = ["help", "whoami", "projects", "open", "achievements", "stack", "socials", "contact", "run", "secrets", "time", "motion", "fit", "clear", "عربي", "sudo hire sultan"];
// Exact-match commands; anything else that isn't a command with arguments goes to the agent.
const BARE_COMMANDS = new Set(["help", "whoami", "projects", "ls", "achievements", "stack", "socials", "contact", "email", "secrets", "time", "date", "clear", "exit", "عربي", "ar", "motion", "run", "open", "cd"]);
const BOOT_KINDS: LineKind[] = ["muted", "muted", "muted", "accent", "ok"];
const TRACE_KINDS: LineKind[] = ["muted", "out", "out", "out", "out", "ok", "warn", "muted"];
const STEP_KINDS: Record<string, LineKind> = { plan: "muted", tool: "out", result: "ok", sources: "muted", guard: "warn", policy: "warn" };

function bootLines({ projects, achievements, ui }: PortfolioContent): Output[] {
  const count = projects.filter((project) => project.enabled).length;
  return ui.terminal.boot(count, achievements.length).map((text, index) => ({ kind: BOOT_KINDS[index], text }));
}

function isCommand(input: string) {
  const lower = input.toLowerCase();
  const [first] = lower.split(/\s+/);
  if (lower === "sudo hire sultan" || lower === "hire sultan" || lower === "hire" || /^(sudo )?rm\b/.test(lower) || lower.includes("drop table")) return true;
  if (["open", "cd", "run", "motion"].includes(first)) return true;
  return BARE_COMMANDS.has(lower);
}

// When the agent is offline, free-form questions still land on the closest scripted reply.
function scriptedIntent(text: string): string {
  const lower = text.toLowerCase();
  const rules: [RegExp, string][] = [
    [/hire|job|role|recruit|توظيف|وظيف|توظ/, "sudo hire sultan"],
    [/contact|e-?mail|reach|تواصل|ايميل|إيميل|بريد|راسل/, "contact"],
    [/project|built|build|demo|مشروع|مشاريع|أعمال|اعمال/, "projects"],
    [/achiev|award|recogni|prize|rank|إنجاز|انجاز|جائز|فاز/, "achievements"],
    [/stack|skill|tech|tool|مهار|تقني|أدوات|ادوات/, "stack"],
    [/social|linkedin|twitter|github|follow|حساب|تابع|متابع/, "socials"],
    [/who|about|سلطان|مين|من هو|نبذة|عرّف|عرف/, "whoami"]
  ];
  return rules.find(([pattern]) => pattern.test(lower))?.[1] ?? text;
}

function createResponder(content: PortfolioContent) {
  const { achievements, identity, locale, projects, skillGroups, socialLinks, ui } = content;
  const copy = ui.terminal;
  const visibleProjects = projects.filter((project) => project.enabled);

  return function respond(raw: string): Output[] | "clear" {
    const input = raw.trim();
    const [command, ...rest] = input.split(/\s+/);
    const argument = rest.join(" ").replace(/^["'«]|["'»]$/g, "");
    const lower = input.toLowerCase();

    if (!input) return [];
    if (lower === "sudo hire sultan" || lower === "hire sultan" || lower === "hire") {
      toast(copy.hireToast);
      window.setTimeout(() => unlockSecret("sudo"), 2600);
      return [
        { kind: "muted", text: copy.hire[0] },
        { kind: "ok", text: copy.hire[1] },
        { kind: "out", text: `${copy.hire[2]} ${identity.email}`, href: `mailto:${identity.email}?subject=A%20role%20for%20you` }
      ];
    }
    if (/^(sudo )?rm\b/.test(lower) || lower.includes("drop table")) {
      window.setTimeout(() => unlockSecret("policy"), 900);
      return [{ kind: "warn", text: copy.blocked }];
    }

    switch (command.toLowerCase()) {
      case "help":
        return copy.help.map((text) => ({ kind: "out", text }));
      case "whoami":
        return [
          { kind: "accent", text: `${identity.name} — ${identity.role}` },
          { kind: "out", text: locale === "ar" ? "Sultan Alfaifi — Full-Stack Software Engineer specializing in AI Agents" : identity.arabicRole },
          { kind: "out", text: `${identity.location} · ${identity.education}` },
          { kind: "muted", text: `${copy.currently} ${identity.currently}` }
        ];
      case "ls":
      case "projects":
        return visibleProjects.map((project) => ({
          kind: project.featured ? "out" : "muted",
          text: `${project.featured ? "★" : "·"} ${project.slug} — ${project.category}`
        }));
      case "open":
      case "cd": {
        const query = argument.toLowerCase();
        const project = visibleProjects.find((item) => item.slug.includes(query) || item.title.toLowerCase().includes(query));
        if (!query || !project) return [{ kind: "warn", text: copy.openUsage }];
        revealAnchor(`project-${project.slug}`, false);
        return [{ kind: "ok", text: copy.opening(project.title) }];
      }
      case "achievements":
        return achievements.filter((item) => item.enabled).map((item) => ({ kind: "out", text: `${item.signal} · ${item.ticker ?? item.title} — ${item.issuer}` }));
      case "stack":
        return skillGroups.map((group) => ({ kind: "out", text: `${group.title}: ${group.skills.join(" · ")}` }));
      case "socials":
        return socialLinks.map((link) => ({ kind: "out", text: `${link.label} · ${link.audience ?? link.href.replace("mailto:", "")}`, href: link.href }));
      case "contact":
      case "email":
        return [{ kind: "ok", text: identity.email, href: `mailto:${identity.email}` }];
      case "run":
        return copy.trace(argument || copy.defaultTask).map((text, index) => ({ kind: TRACE_KINDS[index], text }));
      case "time":
      case "date":
        return [{ kind: "out", text: `${copy.time} ${new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", { timeZone: "Asia/Riyadh", dateStyle: "full", timeStyle: "short" }).format(new Date())}` }];
      case "motion": {
        const enable = argument === "on" ? true : argument === "off" ? false : !motionAllowed();
        setMotionEnabled(enable);
        return [{ kind: "ok", text: copy.motion(enable) }];
      }
      case "clear":
        return "clear";
      case "secrets": {
        const found = foundSecrets();
        return [
          { kind: "accent", text: copy.secrets(found.length, SECRET_IDS.length) },
          ...SECRET_IDS.map((id): Output => {
            const secret = secretCopy(id, locale);
            return found.includes(id) ? { kind: "ok", text: `✓ ${secret.title}` } : { kind: "muted", text: `· ${copy.locked} ${secret.hint}` };
          })
        ];
      }
      case "عربي":
      case "ar":
        window.setTimeout(() => unlockSecret("arabic"), 900);
        return [{ kind: "accent", text: copy.arabic }];
      case "exit":
        return [{ kind: "muted", text: copy.exit }];
      default:
        return [{ kind: "warn", text: copy.notFound(command) }];
    }
  };
}

export function AgentTerminal({ locale = "en" }: { locale?: Locale }) {
  const content = getContent(locale);
  const copy = content.ui.terminal;
  const agentCopy = copy.agent;
  const boot = useMemo(() => bootLines(getContent(locale)), [locale]);
  const respond = useMemo(() => createResponder(getContent(locale)), [locale]);
  const anchors = useMemo(() => buildAnchors(getContent("en"), getContent("ar")), []);
  const urls = useMemo(() => new Set(collectUrls(getContent("en")).map((url) => url.replace(/\/$/, ""))), []);
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState("");
  const [booted, setBooted] = useState(false);
  const [agent, setAgent] = useState<AgentState>(agentConfigured ? "checking" : "off");
  const [busy, setBusy] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const turns = useRef<ChatTurn[]>([]);
  const health = useRef<Promise<AgentState> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const append = useCallback((outputs: Output[]) => {
    const created = outputs.map((output) => ({ ...output, id: nextId.current++ }));
    setLines((current) => [...current, ...created].slice(-80));
    return created.map((line) => line.id);
  }, []);

  const stream = useCallback((outputs: Output[], gap: number, onDone?: () => void) => {
    const delay = motionAllowed() ? gap : 0;
    outputs.forEach((output, index) => {
      const timer = window.setTimeout(() => {
        setLines((current) => [...current, { ...output, id: nextId.current++ }].slice(-80));
        if (index === outputs.length - 1) onDone?.();
      }, delay * (index + 1));
      timers.current.push(timer);
    });
    if (!outputs.length) onDone?.();
  }, []);

  const announceAgent = useCallback(async () => {
    if (!health.current) return;
    const state = await health.current;
    const status = getContent(locale).ui.terminal.agent;
    setAgent(state);
    if (state === "live") append([{ kind: "accent", text: status.liveLine }]);
    else if (state === "budget") append([{ kind: "warn", text: status.budgetLine }]);
    else append([{ kind: "muted", text: status.offlineLine }]);
  }, [locale, append]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (agentConfigured) health.current = checkHealth().then((result): AgentState => (result?.agent ? "live" : result?.paused ? "budget" : "offline"));
      stream(boot, 260, () => {
        setBooted(true);
        void announceAgent();
      });
    }, { threshold: 0.35 });
    observer.observe(root);
    const pending = timers.current;
    return () => {
      observer.disconnect();
      pending.forEach((timer) => window.clearTimeout(timer));
      abortRef.current?.abort();
    };
  }, [stream, boot, announceAgent]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [lines]);

  function skipBoot() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    setLines(boot.map((line) => ({ ...line, id: nextId.current++ })));
    setBooted(true);
    if (agentConfigured && !health.current) health.current = checkHealth().then((result): AgentState => (result?.agent ? "live" : result?.paused ? "budget" : "offline"));
    void announceAgent();
  }

  function scripted(input: string, gap = 40) {
    const result = respond(input);
    if (result === "clear") {
      setLines([]);
      return;
    }
    stream(result, input.toLowerCase().startsWith("run") ? 340 : gap);
  }

  function handleAction(action: AgentAction) {
    if (action.type === "open") {
      revealAnchor(action.anchor);
      const outputs: Output[] = [{ kind: "ok", text: `→ ${agentCopy.highlighted(action.label[locale])}` }];
      if (action.external) outputs.push({ kind: "out", text: "", card: { type: "link", href: action.external.href, label: agentCopy.openDemo(action.external.label[locale]) } });
      append(outputs);
    } else if (action.type === "fit_report") {
      append([{ kind: "out", text: "", card: { type: "fit", report: action.report } }]);
    } else {
      append([{ kind: "out", text: "", card: { type: "draft", draft: action.draft } }]);
    }
  }

  function fallBack(code: string, question: string) {
    if (code === "budget") {
      setAgent("budget");
      append([{ kind: "warn", text: agentCopy.budgetLine }]);
    } else if (code === "rate_limited" || code === "daily_cap" || code === "visitor_cap") {
      append([{ kind: "warn", text: agentCopy.rateLine }]);
    } else {
      if (code === "agent_offline" || code === "not_configured") setAgent("offline");
      append([{ kind: "warn", text: agentCopy.errorLine }]);
    }
    scripted(scriptedIntent(question));
  }

  async function askAgent(question: string) {
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const history: ChatTurn[] = [...turns.current, { role: "user", content: question }];
    // An answer can arrive in several pieces around tool calls; each piece gets its own line.
    const segments: { id: number; text: string }[] = [];
    let open: { id: number; text: string } | null = null;
    let answer = "";
    let failure: string | null = null;
    const thinking = append([{ kind: "muted", text: agentCopy.thinking }])[0];
    const dropThinking = () => setLines((current) => current.filter((line) => line.id !== thinking));
    try {
      await withSession(slotRef.current!, locale, (token) => streamChat(token, history, locale, (event) => {
        if (event.event === "delta") {
          dropThinking();
          answer += event.data.text;
          if (!open) {
            if (!event.data.text.trim()) return;
            open = { id: append([{ kind: "answer", text: event.data.text.replace(/^\n/, ""), streaming: true }])[0], text: event.data.text.replace(/^\n/, "") };
            segments.push(open);
          } else {
            open.text += event.data.text;
            const { id, text } = open;
            setLines((current) => current.map((line) => (line.id === id ? { ...line, text } : line)));
          }
          return;
        }
        open = null;
        if (event.event === "trace") {
          append([{ kind: event.data.error ? "warn" : STEP_KINDS[event.data.step] ?? "muted", step: event.data.step, text: event.data.text }]);
        } else if (event.event === "action") {
          dropThinking();
          handleAction(event.data);
        } else if (event.event === "done") {
          dropThinking();
          // Re-key finished answers so screen readers announce them once, complete, instead of word by word.
          const finished = new Map(segments.map((segment) => [segment.id, nextId.current++]));
          setLines((current) => current.map((line) => (finished.has(line.id) ? { ...line, id: finished.get(line.id)!, streaming: false } : line)));
          turns.current = [...history, { role: "assistant" as const, content: answer, sig: event.data.signature }].slice(-12);
        } else if (event.event === "error") {
          failure = event.data.code;
        }
      }, controller.signal));
    } catch (error) {
      if ((error as Error).name !== "AbortError") failure = error instanceof AgentError ? error.code : "offline";
    } finally {
      dropThinking();
      setBusy(false);
    }
    if (failure) {
      setLines((current) => current.map((line) => (segments.some((segment) => segment.id === line.id) ? { ...line, streaming: false } : line)));
      if (!answer.trim()) fallBack(failure, question);
      else append([{ kind: "warn", text: agentCopy.errorLine }]);
    }
  }

  function submit(command: string) {
    const trimmed = command.trim();
    if (!trimmed) return;
    historyRef.current = [trimmed, ...historyRef.current].slice(0, 30);
    historyIndex.current = -1;
    setValue("");
    if (trimmed.toLowerCase() === "clear") {
      setLines([]);
      return;
    }
    append([{ kind: "input", text: trimmed }]);
    const live = agent === "live";
    if (/^fit\b/i.test(trimmed)) {
      const role = trimmed.slice(3).trim();
      if (!role) append([{ kind: "warn", text: agentCopy.fitUsage }]);
      else if (!live) append([{ kind: "warn", text: agentCopy.fitOffline }]);
      else if (busy) append([{ kind: "muted", text: agentCopy.busy }]);
      else void askAgent(`Fit check for this role or job description:\n${role}`);
      return;
    }
    if (isCommand(trimmed)) {
      scripted(trimmed);
      return;
    }
    if (live && busy) append([{ kind: "muted", text: agentCopy.busy }]);
    else if (live) void askAgent(trimmed);
    else scripted(scriptedIntent(trimmed));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!booted) skipBoot();
    submit(value);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const history = historyRef.current;
      const next = Math.min(history.length - 1, Math.max(-1, historyIndex.current + (event.key === "ArrowUp" ? 1 : -1)));
      historyIndex.current = next;
      setValue(next === -1 ? "" : history[next]);
    } else if (event.key === "Tab" && value) {
      const match = COMMANDS.find((command) => command.startsWith(value.toLowerCase()));
      if (match) {
        event.preventDefault();
        setValue(match);
      }
    }
  }

  function renderLine(line: Line) {
    if (line.card?.type === "link") {
      return <a className="terminal__action" href={line.card.href} target="_blank" rel="noreferrer noopener">{line.card.label}</a>;
    }
    if (line.card?.type === "fit") {
      return <FitCard report={line.card.report} locale={locale} anchors={anchors} onEmail={(draft) => append([{ kind: "out", text: "", card: { type: "draft", draft } }])} />;
    }
    if (line.card?.type === "draft") {
      return <DraftCard draft={line.card.draft} locale={locale} onClose={() => undefined} />;
    }
    if (line.kind === "answer") {
      return line.streaming ? line.text : <AgentText text={line.text} anchors={anchors} urls={urls} email={content.identity.email} />;
    }
    const step = line.step ? <span className="terminal__step">{agentCopy.steps[line.step] ?? line.step} → </span> : null;
    return (
      <>
        {line.kind === "input" ? <span className="terminal__prompt" aria-hidden="true">❯ </span> : null}
        {step}
        {line.href ? <a href={line.href} target={line.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer noopener">{line.text}</a> : line.text}
      </>
    );
  }

  const live = agent === "live";
  return (
    <div className="terminal-shell">
      <div ref={rootRef} className="terminal glow-card" data-cursor={copy.cursor}>
        <div className="terminal__bar" dir="ltr">
          <span className="terminal__dots" aria-hidden="true"><i /><i /><i /></span>
          <p>{copy.title}</p>
          {!booted ? <button type="button" onClick={skipBoot}>{copy.skip}</button> : <span className={`terminal__live${live ? " terminal__live--agent" : ""}`}>{live ? "agent" : copy.live}</span>}
        </div>
        <div ref={logRef} className="terminal__log" role="log" aria-live={booted ? "polite" : "off"} aria-label={copy.log}>
          {lines.map((line) => line.card ? (
            <div key={line.id} className="terminal__card" aria-live="off">{renderLine(line)}</div>
          ) : (
            <p key={line.id} className={`terminal__line terminal__line--${line.kind}`} dir="auto" aria-hidden={line.streaming || undefined}>
              {renderLine(line)}
            </p>
          ))}
        </div>
        <form className="terminal__input" onSubmit={handleSubmit} dir="ltr">
          <label htmlFor="terminal-input" className="sr-only">{copy.input}</label>
          <span className="terminal__prompt" aria-hidden="true">❯</span>
          <input
            id="terminal-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={6000}
            placeholder={live ? agentCopy.placeholder : copy.placeholder}
            dir="auto"
          />
        </form>
        <div ref={slotRef} className="agent-turnstile" />
        <div className="terminal__chips" aria-label={copy.chipsAria} dir="ltr">
          {copy.chips.map((command) => (
            <button key={command} type="button" onClick={() => { if (!booted) skipBoot(); submit(command); }}>{command}</button>
          ))}
        </div>
        {live ? (
          <div className="terminal__chips terminal__chips--agent" aria-label={agentCopy.chipsAria} dir="auto">
            {agentCopy.chips.map((question) => (
              <button key={question} type="button" disabled={busy} onClick={() => submit(question)}>{question}</button>
            ))}
          </div>
        ) : null}
      </div>
      {agentConfigured ? <p className="terminal__privacy">{agentCopy.privacy} <a href="/agent-evals/">{agentCopy.evalsLink}</a></p> : null}
    </div>
  );
}
