"use client";

import { ArrowUp, Bot, FileUser, Mail, Maximize2, Rocket, Route, ScanSearch, Sparkles, X, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { getContent, type Locale, type PortfolioContent } from "@/data/i18n";
import { buildAnchors, collectUrls } from "@/lib/agent/anchors";
import { OPEN_ASSISTANT, requestTailoredCv } from "@/lib/agent/assistant";
import { LEADING_TAG, textDir } from "@/lib/agent/direction";
import { AgentError, agentConfigured, checkHealth, prepareSession, streamChat, withSession, type AgentAction, type ChatTurn, type FitReport, type TourStop } from "@/lib/agent/client";
import { clearSpotlight, revealAnchor, showOnPage } from "@/lib/agent/reveal";
import { useVisitor } from "./use-visitor";
import { ActivityLine, AgentText, DraftCard, FitCard, ProjectCard, TourCard, type AgentStep, type Draft } from "./agent-cards";
import { Companion, type CompanionView } from "./agent-companion";
import { motionAllowed, setMotionEnabled, toast } from "./motion-preference";
import { foundSecrets, SECRET_IDS, secretCopy, unlockSecret } from "./secrets";

type LineKind = "input" | "out" | "muted" | "ok" | "warn" | "accent" | "answer";
type Card =
  | { type: "draft"; draft: Draft }
  | { type: "fit"; report: FitReport }
  | { type: "link"; href: string; label: string }
  | { type: "activity"; steps: AgentStep[]; state: "running" | "done" }
  | { type: "sources"; anchors: string[] }
  | { type: "project"; slug: string }
  | { type: "tour"; stops: TourStop[] };
// `boot` marks the console's start-up lines, which the open panel replaces with its welcome.
type Line = { id: number; kind: LineKind; text: string; href?: string; streaming?: boolean; boot?: boolean; card?: Card };
type Output = Omit<Line, "id">;
type AgentState = "off" | "checking" | "live" | "offline" | "budget";

// Commands stay in English on both pages; answers follow the page language.
const COMMANDS = ["help", "whoami", "projects", "open", "achievements", "stack", "socials", "contact", "run", "secrets", "time", "motion", "fit", "clear", "عربي", "sudo hire sultan"];
// Exact-match commands; anything else that isn't a command with arguments goes to the agent.
const BARE_COMMANDS = new Set(["help", "whoami", "projects", "ls", "achievements", "stack", "socials", "contact", "email", "secrets", "time", "date", "clear", "exit", "عربي", "ar", "motion", "run", "open", "cd"]);
const BOOT_KINDS: LineKind[] = ["muted", "muted", "muted", "accent", "ok"];
const TRACE_KINDS: LineKind[] = ["muted", "out", "out", "out", "out", "ok", "warn", "muted"];

function bootLines({ projects, achievements, ui }: PortfolioContent): Output[] {
  const count = projects.filter((project) => project.enabled).length;
  return ui.terminal.boot(count, achievements.length).map((text, index) => ({ kind: BOOT_KINDS[index], text, boot: true }));
}

const STARTER_ICONS: Record<string, LucideIcon> = { tour: Route, project: Rocket, fit: ScanSearch, cv: FileUser, agent: Bot, mail: Mail };

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
  const panelCopy = content.ui.assistant;
  const visitor = useVisitor();
  const agentChips = (visitor && agentCopy.chipsFor[visitor]) || agentCopy.chips;
  const starters = (visitor && agentCopy.startersFor[visitor]) || agentCopy.starters;
  const boot = useMemo(() => bootLines(getContent(locale)), [locale]);
  const respond = useMemo(() => createResponder(getContent(locale)), [locale]);
  const anchors = useMemo(() => buildAnchors(getContent("en"), getContent("ar")), []);
  const urls = useMemo(() => new Set(collectUrls(getContent("en")).map((url) => url.replace(/\/$/, ""))), []);
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState("");
  const [booted, setBooted] = useState(false);
  const [agent, setAgent] = useState<AgentState>(agentConfigured ? "checking" : "off");
  const [busy, setBusy] = useState(false);
  // Docked, the same console (and its conversation) moves into a panel beside the page.
  const [docked, setDocked] = useState(false);
  // The agent's actions run inside the streaming callback, which still sees the state from when the
  // question was asked; this ref always knows whether the panel is open right now.
  const dockedNow = useRef(false);
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  // While the agent shows the visitor around the page, the conversation rides along in a small
  // companion instead of being left behind where the console sits.
  const [companion, setCompanion] = useState<CompanionView | null>(null);
  const [liveAnswer, setLiveAnswer] = useState({ text: "", streaming: false });
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const companionRef = useRef<HTMLDivElement>(null);
  const companionFrom = useRef<"inline" | "docked" | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dockButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
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
  // The boot runs once: either when the console scrolls into view, or right away if the visitor
  // types or clicks before that. Without this, the scroll-in boot replays after the visitor's question.
  const bootStarted = useRef(false);

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
    if (state === "live") append([{ kind: "accent", text: status.liveLine, boot: true }]);
    else if (state === "budget") append([{ kind: "warn", text: status.budgetLine, boot: true }]);
    else append([{ kind: "muted", text: status.offlineLine, boot: true }]);
  }, [locale, append]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (bootStarted.current) return;
      bootStarted.current = true;
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

  // The input grows with the question, up to about six lines, then scrolls.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 168)}px`;
  }, [value]);

  useEffect(() => {
    if (!docked) return;
    const root = document.documentElement;
    root.dataset.assistant = "open";
    inputRef.current?.focus({ preventScroll: true });
    return () => {
      delete root.dataset.assistant;
    };
  }, [docked]);

  const companionOn = companion !== null;
  useEffect(() => {
    if (!companionOn) return;
    const root = document.documentElement;
    root.dataset.companion = "on";
    return () => {
      delete root.dataset.companion;
    };
  }, [companionOn]);

  function skipBoot() {
    bootStarted.current = true;
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    setLines(boot.map((line) => ({ ...line, id: nextId.current++ })));
    setBooted(true);
    if (agentConfigured && !health.current) health.current = checkHealth().then((result): AgentState => (result?.agent ? "live" : result?.paused ? "budget" : "offline"));
    void announceAgent();
  }

  // Starts the human check and the session as soon as the visitor shows intent, so the first
  // question doesn't wait for them.
  function warmUp() {
    const slot = slotRef.current;
    if (!slot || !health.current) return;
    void health.current.then((state) => {
      if (state === "live") prepareSession(slot, locale);
    });
  }

  function openPanel() {
    if (companion) closeCompanion();
    if (dockedNow.current) {
      inputRef.current?.focus({ preventScroll: true });
      return;
    }
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPlaceholderHeight(shellRef.current?.offsetHeight ?? 0);
    if (!booted) skipBoot();
    dockedNow.current = true;
    setDocked(true);
    warmUp();
  }

  // Focus goes back to whatever opened the panel, or to the console itself when it's brought back.
  function closePanel(focus: "opener" | "input" | "none" = "opener") {
    dockedNow.current = false;
    setDocked(false);
    const opener = openerRef.current;
    openerRef.current = null;
    if (focus === "none") return;
    window.requestAnimationFrame(() => {
      const target = focus === "input" ? inputRef.current : opener?.isConnected && !opener.closest("[inert]") ? opener : dockButtonRef.current;
      target?.focus({ preventScroll: true });
    });
  }

  const onOpenRequest = useEffectEvent(() => openPanel());
  useEffect(() => {
    const listener = () => onOpenRequest();
    window.addEventListener(OPEN_ASSISTANT, listener);
    return () => window.removeEventListener(OPEN_ASSISTANT, listener);
  }, []);

  function scripted(input: string, gap = 40) {
    const result = respond(input);
    if (result === "clear") {
      setLines([]);
      return;
    }
    stream(result, input.toLowerCase().startsWith("run") ? 340 : gap);
  }

  // Anything that moves the visitor's page hands the conversation to the companion, which stays with
  // them there. The panel steps aside; the console stays where it is for the way back.
  function follow(view: CompanionView) {
    const opening = !companionRef.current;
    if (!companionFrom.current) companionFrom.current = dockedNow.current ? "docked" : "inline";
    if (dockedNow.current) closePanel("none");
    setCompanion(view);
    if (opening) window.requestAnimationFrame(() => companionRef.current?.focus({ preventScroll: true }));
  }

  function closeCompanion() {
    companionFrom.current = null;
    setCompanion(null);
    clearSpotlight();
  }

  // "Back to the chat": the panel reopens if that's where the visitor was, otherwise the page returns
  // to the console.
  function backToChat() {
    const from = companionFrom.current;
    closeCompanion();
    if (from === "docked") {
      openPanel();
      return;
    }
    rootRef.current?.scrollIntoView({ behavior: motionAllowed() ? "smooth" : "auto", block: "center" });
    inputRef.current?.focus({ preventScroll: true });
  }

  function goToStop(stops: TourStop[], index: number) {
    const stop = stops[index];
    if (!stop) return;
    follow({ kind: "tour", stops, index });
    showOnPage(stop.anchor, stop.quote);
  }

  function showAnchor(id: string) {
    follow({ kind: "answer" });
    showOnPage(id);
  }

  function handleAction(action: AgentAction) {
    if (action.type === "open") {
      // The activity line already says what was highlighted; only a demo button needs a line of its own,
      // in the chat and in the companion that's showing the project.
      const link = action.external ? { href: action.external.href, label: agentCopy.openDemo(action.external.label[locale]) } : undefined;
      follow({ kind: "answer", link });
      showOnPage(action.anchor, action.quote);
      if (link) append([{ kind: "out", text: "", card: { type: "link", ...link } }]);
    } else if (action.type === "tour") {
      append([{ kind: "out", text: "", card: { type: "tour", stops: action.stops } }]);
      goToStop(action.stops, 0);
    } else if (action.type === "project") {
      append([{ kind: "out", text: "", card: { type: "project", slug: action.slug } }]);
      // Out on the page already, the visitor is taken to the project rather than to a card they can't see.
      if (companionRef.current) showOnPage(action.anchor);
    } else if (action.type === "tailor_cv") {
      requestTailoredCv({ role: action.role, company: action.company, description: action.description });
      follow({ kind: "answer" });
      showOnPage("cv");
    } else {
      append([{ kind: "out", text: "", card: action.type === "fit_report" ? { type: "fit", report: action.report } : { type: "draft", draft: action.draft } }]);
      // A report or a draft needs the room of the full chat. Out on the page, the companion offers it
      // instead of pulling the visitor away from what they're looking at.
      if (companionRef.current) setCompanion({ kind: "answer", card: action.type === "fit_report" ? "fit" : "draft" });
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
    setLiveAnswer({ text: "", streaming: true });
    setLiveStatus(agentCopy.thinking);
    // An answer can arrive in several pieces around tool calls; each piece gets its own line.
    const segments: { id: number; text: string }[] = [];
    let open: { id: number; text: string } | null = null;
    let answer = "";
    let failure: string | null = null;
    // Everything the agent does on the way to its answer folds into one line above it. Without any
    // tool calls there's nothing worth unfolding, so the line goes once the answer is in.
    const steps: AgentStep[] = [];
    const activity = append([{ kind: "muted", text: "", card: { type: "activity", steps: [], state: "running" } }])[0];
    const showSteps = (state: "running" | "done") =>
      setLines((current) => current.map((line) => (line.id === activity ? { ...line, card: { type: "activity", steps: [...steps], state } } : line)));
    try {
      await withSession(slotRef.current!, locale, (token) => streamChat(token, history, locale, (event) => {
        if (event.event === "delta") {
          answer += event.data.text;
          setLiveAnswer({ text: answer.trimStart(), streaming: true });
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
          steps.push(event.data);
          showSteps("running");
          if (event.data.step === "result" || event.data.step === "prep") setLiveStatus(event.data.text);
        } else if (event.event === "action") {
          handleAction(event.data);
        } else if (event.event === "done") {
          // Re-key finished answers so screen readers announce them once, complete, instead of word by word.
          const finished = new Map(segments.map((segment) => [segment.id, nextId.current++]));
          setLines((current) => current.map((line) => (finished.has(line.id) ? { ...line, id: finished.get(line.id)!, streaming: false } : line)));
          if (event.data.sources.length) append([{ kind: "out", text: "", card: { type: "sources", anchors: event.data.sources } }]);
          setLiveAnswer({ text: answer.trimStart(), streaming: false });
          // The signed tool list goes back with the turn, so the agent remembers what it already showed.
          turns.current = [...history, { role: "assistant" as const, content: answer, sig: event.data.signature, tools: event.data.tools }].slice(-12);
        } else if (event.event === "error") {
          failure = event.data.code;
        }
      }, controller.signal));
    } catch (error) {
      if ((error as Error).name !== "AbortError") failure = error instanceof AgentError ? error.code : "offline";
    } finally {
      setLiveStatus(null);
      if (steps.some((step) => step.step === "tool")) showSteps("done");
      else setLines((current) => current.filter((line) => line.id !== activity));
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

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a line. Arrow keys walk the history only while the input is one line.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    } else if ((event.key === "ArrowUp" || event.key === "ArrowDown") && !value.includes("\n")) {
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

  // A starter either asks right away or puts its prompt in the input for the visitor to finish.
  function start(starter: { prompt: string; fill: boolean }) {
    if (!starter.fill) {
      submit(starter.prompt);
      return;
    }
    setValue(starter.prompt);
    window.requestAnimationFrame(() => {
      const input = inputRef.current;
      input?.focus({ preventScroll: true });
      input?.setSelectionRange(starter.prompt.length, starter.prompt.length);
    });
  }

  function renderLine(line: Line) {
    if (line.card?.type === "activity") return <ActivityLine steps={line.card.steps} state={line.card.state} locale={locale} />;
    if (line.card?.type === "project") return <ProjectCard slug={line.card.slug} locale={locale} onShow={showAnchor} />;
    if (line.card?.type === "tour") {
      const { stops } = line.card;
      return <TourCard stops={stops} locale={locale} onOpen={(index) => goToStop(stops, index)} />;
    }
    if (line.card?.type === "sources") {
      return (
        <p className="agent-sources">
          <span>{agentCopy.sources}</span>
          {line.card.anchors.map((id) => {
            const anchor = anchors.find((item) => item.id === id);
            return anchor ? <button key={id} type="button" onClick={() => showAnchor(id)}>{anchor.label[locale]}</button> : null;
          })}
        </p>
      );
    }
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
      return (
        <>
          <AgentText text={line.text} anchors={anchors} urls={urls} email={content.identity.email} onAnchor={showAnchor} />
          {line.streaming ? <span className="agent-caret" aria-hidden="true" /> : null}
        </>
      );
    }
    const tag = LEADING_TAG.exec(line.text)?.[0];
    const text = tag ? line.text.slice(tag.length) : line.text;
    return (
      <>
        {line.kind === "input" ? <span className="terminal__prompt" aria-hidden="true">❯ </span> : null}
        {tag ? <><span className="terminal__tag" dir="ltr">{tag.trim()}</span> </> : null}
        {line.href ? <a href={line.href} target={line.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer noopener">{text}</a> : text}
      </>
    );
  }

  const live = agent === "live";
  const started = lines.some((line) => line.kind === "input");
  return (
    <div className="terminal-slot">
      {docked ? (
        <div className="terminal-placeholder" style={{ minHeight: placeholderHeight || undefined }}>
          <p>{panelCopy.docked}</p>
          <button type="button" onClick={() => closePanel("input")}>{panelCopy.bringBack}</button>
        </div>
      ) : null}
      <div
        ref={shellRef}
        className={`terminal-shell${docked ? " terminal-shell--docked" : ""}${live ? " terminal-shell--live" : ""}`}
        role={docked ? "region" : undefined}
        aria-label={docked ? panelCopy.panel : undefined}
        onKeyDown={(event) => {
          if (event.key === "Escape" && docked) {
            event.preventDefault();
            closePanel();
          }
        }}
      >
        <div ref={rootRef} className="terminal glow-card" data-cursor={copy.cursor}>
          <div className="terminal__bar" dir="ltr">
            {docked ? <span className="agent-orb" data-busy={busy || undefined} aria-hidden="true" /> : <span className="terminal__dots" aria-hidden="true"><i /><i /><i /></span>}
            <p dir="auto">{docked ? panelCopy.panel : copy.title}</p>
            {!booted ? (
              <button type="button" onClick={skipBoot}>{copy.skip}</button>
            ) : (
              <span className={`terminal__live${live ? " terminal__live--agent" : ""}`} dir="auto">
                {live ? <><Sparkles size={13} aria-hidden="true" /> {panelCopy.badge}</> : copy.live}
              </span>
            )}
            <button
              ref={dockButtonRef}
              type="button"
              className="terminal__dock"
              onClick={() => (docked ? closePanel() : openPanel())}
              aria-label={docked ? panelCopy.close : panelCopy.expand}
              title={docked ? panelCopy.close : panelCopy.expand}
            >
              {docked ? <X size={16} aria-hidden="true" /> : <Maximize2 size={15} aria-hidden="true" />}
            </button>
          </div>
          <div ref={logRef} className="terminal__log" role="log" aria-live={booted ? "polite" : "off"} aria-label={copy.log}>
            {lines.map((line) => {
              if (line.card) return <div key={line.id} className="terminal__card" aria-live="off">{renderLine(line)}</div>;
              const dir = textDir(line.text.replace(LEADING_TAG, ""));
              return (
                <p key={line.id} className={`terminal__line terminal__line--${line.kind}${line.boot ? " terminal__line--boot" : ""}`} dir={dir} aria-hidden={line.streaming || undefined}>
                  {renderLine(line)}
                </p>
              );
            })}
            {docked && live && !started ? (
              <div className="agent-welcome" aria-live="off">
                <span className="agent-orb agent-orb--large" aria-hidden="true" />
                <p className="agent-welcome__title">{agentCopy.welcome.title}</p>
                <p className="agent-welcome__body">{agentCopy.welcome.body}</p>
                <div className="agent-starters" role="group" aria-label={agentCopy.welcome.aria}>
                  {starters.map((starter) => {
                    const Icon = STARTER_ICONS[starter.icon] ?? Sparkles;
                    return (
                      <button key={starter.title} type="button" disabled={busy} onClick={() => start(starter)}>
                        <Icon size={18} aria-hidden="true" />
                        <span className="agent-starters__title">{starter.title}</span>
                        <span className="agent-starters__hint">{starter.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
          <form className="terminal__input" onSubmit={handleSubmit}>
            <label htmlFor="terminal-input" className="sr-only">{copy.input}</label>
            <span className="terminal__prompt" aria-hidden="true">❯</span>
            <textarea
              ref={inputRef}
              id="terminal-input"
              rows={1}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={warmUp}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="send"
              maxLength={6000}
              placeholder={live ? (docked ? agentCopy.panelPlaceholder : agentCopy.placeholder) : copy.placeholder}
              dir="auto"
            />
            <button type="submit" className="terminal__send" aria-label={panelCopy.send} disabled={!value.trim()}>
              <ArrowUp size={18} aria-hidden="true" />
            </button>
          </form>
          <div ref={slotRef} className="agent-turnstile" />
          <div className="terminal__chips" aria-label={copy.chipsAria} dir="ltr">
            {copy.chips.map((command) => (
              <button key={command} type="button" onClick={() => { if (!booted) skipBoot(); submit(command); }}>{command}</button>
            ))}
          </div>
          {live && (started || !docked) ? (
            <div className="terminal__chips terminal__chips--agent" aria-label={agentCopy.chipsAria} dir="auto">
              {agentChips.map((question) => (
                <button key={question} type="button" disabled={busy} onClick={() => submit(question)}>{question}</button>
              ))}
            </div>
          ) : null}
        </div>
        {agentConfigured ? <p className="terminal__privacy">{agentCopy.privacy} <a href="/agent-evals/">{agentCopy.evalsLink}</a></p> : null}
      </div>
      {companion
        ? createPortal(
            <Companion
              view={companion}
              locale={locale}
              answer={liveAnswer}
              status={liveStatus}
              busy={busy}
              anchors={anchors}
              urls={urls}
              email={content.identity.email}
              panelRef={companionRef}
              onStep={(index) => companion.kind === "tour" && goToStop(companion.stops, index)}
              onAnchor={(id) => showOnPage(id)}
              onAsk={(question) => {
                setCompanion({ kind: "answer" });
                submit(question);
              }}
              onBack={backToChat}
              onClose={closeCompanion}
            />,
            document.body
          )
        : null}
    </div>
  );
}
