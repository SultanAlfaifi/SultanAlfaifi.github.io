"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { ArrowRight, Check, FileSearch, Flag, ListTodo, RotateCcw, Sparkles } from "lucide-react";
import { getContent, type Locale, type PortfolioContent } from "@/data/i18n";
import { openAssistant } from "@/lib/agent/assistant";
import { agentConfigured } from "@/lib/agent/client";
import { revealAnchor } from "@/lib/agent/reveal";
import { MetaParts } from "./meta-parts";
import { motionAllowed, subscribeMotion } from "./motion-preference";

type Gate = "waiting" | "approved" | "held";

export type RunVariant = {
  key: "project" | "hiring" | "collaborate";
  // Which visitor sees it, read by the same html[data-visitor] rules as the hero's calls to action.
  visitor: { "data-visitor-only": string } | { "data-visitor-hide": string };
  plan: string;
  tool: string;
  read: string;
  result: string;
  ask: { before: string; name?: string; after: string };
  target: string;
  approveLabel: string;
  done: string;
};

// The last sentence keeps its full stop: only a stop followed by a space ends a sentence, so "v0.2.0" and
// the final period stay put. (No lookbehind, which older Safari can't parse.)
export function lastSentence(text = "") {
  const sentences = text.split(/[.!?؟]\s+/);
  return sentences[sentences.length - 1];
}

// Everything the card says. The facts come from the data files and the counts are computed, never typed:
// "6 featured · 5 stop to check" counts the featured projects and the ones with a checkpoint.
export function runScript(content: PortfolioContent) {
  const { experience, helpPaths, identity, projects, ui } = content;
  const copy = ui.hero.run;
  const featured = projects.filter((project) => project.enabled && project.featured);
  const checks = featured.filter((project) => project.checkpoint).length;
  const flagship = [...featured].sort((a, b) => (a.showcase ?? Infinity) - (b.showcase ?? Infinity))[0];
  const job = experience[0];
  // The "Building an AI product" path: what a collaborator usually came for, in the site's own words.
  // Picked by its id, so reordering the paths can't put another audience's words here.
  const product = helpPaths.find((path) => path.id === "product");
  if (!product) throw new Error("The hero’s collaborate run quotes the “product” help path, and it is missing.");
  const variants: RunVariant[] = [
    {
      key: "project",
      visitor: { "data-visitor-hide": "hiring collaborate" },
      plan: copy.plan.project,
      tool: "projects.read()",
      read: copy.count(featured.length, checks),
      result: lastSentence(flagship.highlights[flagship.highlights.length - 1]),
      ask: { before: copy.ask.project[0], name: flagship.title, after: copy.ask.project[1] },
      target: `project-${flagship.slug}`,
      approveLabel: copy.approveLabel.project(flagship.title),
      done: copy.done.project(flagship.title)
    },
    {
      key: "hiring",
      visitor: { "data-visitor-only": "hiring" },
      plan: copy.plan.hiring,
      tool: "experience.read()",
      read: `${job.organization} · ${job.role}`,
      result: job.description,
      ask: { before: copy.ask.hiring, after: "" },
      target: "cv",
      approveLabel: copy.approveLabel.hiring,
      done: copy.done.hiring
    },
    {
      key: "collaborate",
      visitor: { "data-visitor-only": "collaborate" },
      plan: copy.plan.collaborate,
      tool: "identity.read()",
      read: identity.openTo,
      result: product.need,
      ask: { before: copy.ask.collaborate, after: "" },
      target: "contact",
      approveLabel: copy.approveLabel.collaborate,
      done: copy.done.collaborate
    }
  ];
  return { variants, featured: featured.length, checks, flagship };
}

const subscribeNothing = () => () => undefined;

// The Approve link of the variant this visitor sees. The others are display: none, so they have no boxes.
function visibleApprove(root: HTMLElement | null) {
  const links = Array.from(root?.querySelectorAll<HTMLElement>(".hero-run__approve") ?? []);
  return links.find((link) => link.getClientRects().length > 0) ?? links[0];
}

// A short scripted run beside the headline that stops at a real approval gate. The server HTML is the
// finished state (all lines shown, the gate waiting), and CSS alone plays it in. All three visitor
// versions are in the HTML and html[data-visitor] shows one, so nothing flashes. Approve is a real link,
// so it works before (or without) JavaScript; "Not now" needs a script, so it only renders once hydrated.
export function HeroRun({ locale = "en" }: { locale?: Locale }) {
  const content = getContent(locale);
  const copy = content.ui.hero.run;
  const script = runScript(content);
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const rootRef = useRef<HTMLElement>(null);
  const choicesRef = useRef<HTMLDivElement>(null);
  const focusNext = useRef<"choices" | "approve" | null>(null);
  const timer = useRef(0);
  const [gate, setGate] = useState<Gate>("waiting");
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // The entrance plays once per page load. data-played on the hero switches its rules off once the run
  // and the status pulses have finished, or as soon as the motion setting changes, so turning motion back
  // on (or unfolding the read step) never replays lines or hides Approve under the visitor.
  useEffect(() => {
    const hero = rootRef.current?.closest<HTMLElement>(".identity-hero");
    if (!hero) return;
    const ended = new Set<string>();
    const settle = () => { hero.dataset.played = ""; };
    const onEnd = (event: AnimationEvent) => {
      ended.add(event.animationName);
      if (ended.has("gate-rise") && ended.has("hero-pulse")) settle();
    };
    if (!motionAllowed()) settle();
    hero.addEventListener("animationend", onEnd);
    const unsubscribe = subscribeMotion(settle);
    return () => {
      hero.removeEventListener("animationend", onEnd);
      unsubscribe();
    };
  }, []);

  // The control that was clicked disappears with the state change, so focus moves to what replaced it.
  useEffect(() => {
    const next = focusNext.current;
    focusNext.current = null;
    if (next === "choices") choicesRef.current?.focus();
    if (next === "approve") visibleApprove(rootRef.current)?.focus();
  }, [gate]);

  // The headline shows the gate too: data-gate on the hero turns its dashed underline solid, or dims it.
  function mark(next: Gate) {
    setGate(next);
    const hero = rootRef.current?.closest<HTMLElement>(".identity-hero");
    if (!hero) return;
    if (next === "waiting") delete hero.dataset.gate;
    else hero.dataset.gate = next;
  }

  function approve(event: MouseEvent<HTMLAnchorElement>, variant: RunVariant) {
    // A new tab or window, or a page without the target, gets the plain link.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (!document.getElementById(variant.target)) return;
    event.preventDefault();
    window.clearTimeout(timer.current);
    mark("approved");
    setStatus(variant.done);
    const go = () => {
      revealAnchor(variant.target);
      const heading = document.getElementById(variant.target)?.querySelector<HTMLElement>("h2, h3");
      if (!heading) return;
      if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    };
    // The gate tick lands first, then the page moves. With motion off, both happen at once.
    if (motionAllowed()) timer.current = window.setTimeout(go, 600);
    else go();
  }

  function hold() {
    // Once approved, the page has already moved: "Not now" would claim nothing happened.
    if (gate !== "waiting") return;
    window.clearTimeout(timer.current);
    focusNext.current = "choices";
    mark("held");
    setStatus(copy.held);
  }

  // Only the visitor asks again; the card never re-asks on its own.
  function askAgain() {
    focusNext.current = "approve";
    mark("waiting");
    setStatus("");
  }

  return (
    <section ref={rootRef} className="hero-run" aria-labelledby="hero-run-title" data-gate={gate}>
      <h2 id="hero-run-title" className="hero-run__title">{copy.title}</h2>
      <div className="hero-run__head">
        <p className="hero-run__state"><span className="hero-run__dot" aria-hidden="true" />{copy.state[gate]}</p>
        <p className="hero-run__chip"><MetaParts text={copy.replay} /></p>
      </div>
      {/* Folded in the server HTML too, so a phone's card keeps its height when the script arrives. CSS
          folds it on phones only, and shows the step anyway when there is no script to unfold it. */}
      <ol className="hero-run__steps" data-folded={expanded ? undefined : ""}>
        <li className="run-step run-step--plan">
          <span className="run-step__label"><ListTodo size={15} aria-hidden="true" />{copy.labels.plan}</span>
          <span className="run-step__text">
            {script.variants.map((variant) => <span key={variant.key} {...variant.visitor}>{variant.plan}</span>)}
          </span>
        </li>
        <li id="hero-run-read" className="run-step run-step--read">
          <span className="run-step__label"><FileSearch size={15} aria-hidden="true" />{copy.labels.read}</span>
          <span className="run-step__text">
            {script.variants.map((variant) => (
              <span key={variant.key} {...variant.visitor}>
                <bdi dir="ltr" className="run-step__tool">{variant.tool}</bdi> <ArrowRight size={14} aria-hidden="true" /> <MetaParts text={variant.read} />
              </span>
            ))}
          </span>
        </li>
        <li className="run-step run-step--result">
          <span className="run-step__label"><Flag size={15} aria-hidden="true" />{copy.labels.result}</span>
          <span className="run-step__text">
            {script.variants.map((variant) => <span key={variant.key} {...variant.visitor}>{variant.result}</span>)}
          </span>
        </li>
      </ol>
      <button type="button" className="hero-run__more" aria-expanded={expanded} aria-controls="hero-run-read" onClick={() => setExpanded((value) => !value)}>
        {expanded ? copy.less : copy.more}
      </button>
      <div className="hero-run__gate">
        <p className="hero-run__ask">
          {script.variants.map((variant) => (
            <span key={variant.key} {...variant.visitor}>
              {variant.ask.before}{variant.ask.name ? <bdi dir="ltr">{variant.ask.name}</bdi> : null}{variant.ask.after}
            </span>
          ))}
        </p>
        {gate === "held" ? (
          <div ref={choicesRef} className="hero-run__choices" role="group" aria-label={copy.choices} tabIndex={-1}>
            <a href="#cv">{copy.openCv}</a>
            <a href="#work">{copy.seeAll(script.featured)}</a>
            <a href={`#project-${script.flagship.slug}`}>{copy.strongest}</a>
            <button type="button" className="hero-run__again" onClick={askAgain}><RotateCcw size={15} aria-hidden="true" />{copy.again}</button>
            {agentConfigured ? <button type="button" className="hero-run__own" onClick={openAssistant}><Sparkles size={15} aria-hidden="true" />{copy.own}</button> : null}
          </div>
        ) : (
          <div className="hero-run__actions">
            {script.variants.map((variant) => (
              <a
                key={variant.key}
                className="hero-run__approve"
                href={`#${variant.target}`}
                aria-label={variant.approveLabel}
                onClick={(event) => approve(event, variant)}
                {...variant.visitor}
              >
                <Check size={17} aria-hidden="true" />{copy.approve}
              </a>
            ))}
            {hydrated && gate === "waiting" ? <button type="button" className="hero-run__hold" onClick={hold}>{copy.notNow}</button> : null}
          </div>
        )}
        <p className="hero-run__caption">{copy.caption}</p>
      </div>
      <p className="hero-run__status" role="status">{status}</p>
    </section>
  );
}
