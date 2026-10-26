"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { getContent, type Locale, type PortfolioContent } from "@/data/i18n";
import { motionAllowed, setMotionEnabled, toast } from "./motion-preference";
import { foundSecrets, SECRET_IDS, secretCopy, unlockSecret } from "./secrets";

type LineKind = "input" | "out" | "muted" | "ok" | "warn" | "accent";
type Line = { id: number; kind: LineKind; text: string; href?: string };
type Output = Omit<Line, "id">;

// Commands stay in English on both pages; answers follow the page language.
const COMMANDS = ["help", "whoami", "projects", "open", "achievements", "stack", "socials", "contact", "run", "secrets", "time", "motion", "clear", "عربي", "sudo hire sultan"];
const BOOT_KINDS: LineKind[] = ["muted", "muted", "muted", "accent", "ok"];
const TRACE_KINDS: LineKind[] = ["muted", "out", "out", "out", "out", "ok", "warn", "muted"];

function bootLines({ projects, achievements, ui }: PortfolioContent): Output[] {
  const count = projects.filter((project) => project.enabled).length;
  return ui.terminal.boot(count, achievements.length).map((text, index) => ({ kind: BOOT_KINDS[index], text }));
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
        const target = document.getElementById(`project-${project.slug}`);
        const details = target?.closest("details");
        if (details && !details.open) details.open = true;
        target?.scrollIntoView({ behavior: motionAllowed() ? "smooth" : "auto", block: "start" });
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
  const copy = getContent(locale).ui.terminal;
  const boot = useMemo(() => bootLines(getContent(locale)), [locale]);
  const respond = useMemo(() => createResponder(getContent(locale)), [locale]);
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState("");
  const [booted, setBooted] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      stream(boot, 260, () => setBooted(true));
    }, { threshold: 0.35 });
    observer.observe(root);
    const pending = timers.current;
    return () => {
      observer.disconnect();
      pending.forEach((timer) => window.clearTimeout(timer));
    };
  }, [stream, boot]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [lines]);

  function skipBoot() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    setLines(boot.map((line) => ({ ...line, id: nextId.current++ })));
    setBooted(true);
  }

  function submit(command: string) {
    const trimmed = command.trim();
    if (!trimmed) return;
    historyRef.current = [trimmed, ...historyRef.current].slice(0, 30);
    historyIndex.current = -1;
    setValue("");
    const echo: Line = { id: nextId.current++, kind: "input", text: trimmed };
    const result = respond(trimmed);
    if (result === "clear") {
      setLines([]);
      return;
    }
    setLines((current) => [...current, echo].slice(-80));
    const isTrace = trimmed.toLowerCase().startsWith("run");
    stream(result, isTrace ? 340 : 40);
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

  return (
    <div ref={rootRef} className="terminal glow-card" data-cursor={copy.cursor}>
      <div className="terminal__bar" dir="ltr">
        <span className="terminal__dots" aria-hidden="true"><i /><i /><i /></span>
        <p>{copy.title}</p>
        {!booted ? <button type="button" onClick={skipBoot}>{copy.skip}</button> : <span className="terminal__live">{copy.live}</span>}
      </div>
      <div ref={logRef} className="terminal__log" role="log" aria-live={booted ? "polite" : "off"} aria-label={copy.log}>
        {lines.map((line) => (
          <p key={line.id} className={`terminal__line terminal__line--${line.kind}`} dir="auto">
            {line.kind === "input" ? <span className="terminal__prompt" aria-hidden="true">❯ </span> : null}
            {line.href ? <a href={line.href} target={line.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer noopener">{line.text}</a> : line.text}
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
          placeholder={copy.placeholder}
          dir="auto"
        />
      </form>
      <div className="terminal__chips" aria-label={copy.chipsAria} dir="ltr">
        {copy.chips.map((command) => (
          <button key={command} type="button" onClick={() => { if (!booted) skipBoot(); submit(command); }}>{command}</button>
        ))}
      </div>
    </div>
  );
}
