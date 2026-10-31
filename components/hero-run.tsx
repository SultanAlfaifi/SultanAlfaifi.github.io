"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { Check, RotateCcw, Sparkles } from "lucide-react";
import { getContent, type Locale, type PortfolioContent } from "@/data/i18n";
import { openAssistant } from "@/lib/agent/assistant";
import { agentConfigured } from "@/lib/agent/client";
import { revealAnchor } from "@/lib/agent/reveal";
import { bloomBrandOrb } from "./living-orb";
import { heroOrb } from "./hero-orb";
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

// The run's clock, in ms from the start of the hero's entrance. hero.css plays the same schedule: the
// steps scan from RUN.scan, one every RUN.step, and the question lights and is asked at RUN.ask, once the
// last step is done (until then its words wait dimmed, like a step not yet reached). The entrance is
// over by RUN.settle, when data-intro turns "done" so nothing in it can play twice.
export const RUN = { scan: 1700, step: 550, ask: 3350, settle: 3900, carry: 900, rest: 3000 } as const;

const subscribeNothing = () => () => undefined;

// The Approve link of the variant this visitor sees. The others are display: none, so they have no boxes.
function visibleApprove(root: HTMLElement | null) {
  const links = Array.from(root?.querySelectorAll<HTMLElement>(".hero-run__approve") ?? []);
  return links.find((link) => link.getClientRects().length > 0) ?? links[0];
}

// How far into the entrance the page already is. The card's CSS animations know: each one's clock stops
// at its own end, so the latest of them (the last step's scan) is the truest. The orb keeps time with the
// CSS even when the script arrives late; without the API, the run starts now.
function entranceElapsed(card: HTMLElement) {
  let elapsed = 0;
  for (const animation of card.getAnimations?.({ subtree: true }) ?? []) {
    const time = animation.currentTime;
    if (typeof time === "number" && time > elapsed) elapsed = time;
  }
  return elapsed;
}

// The entrance is over: hero.css stops keying on it, so nothing in it can play twice.
function endEntrance() {
  const root = document.documentElement;
  if (root.dataset.intro === "play") root.dataset.intro = "done";
}

// A short scripted run that stops at a real approval gate. The server HTML is the finished state (all
// steps done, the gate waiting), so it reads complete without a script. On first view the entrance in
// hero.css scans the steps while the orb thinks, then the card asks and the orb listens. All three visitor
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
  const timers = useRef<number[]>([]);
  const [gate, setGate] = useState<Gate>("waiting");
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState(false);

  const later = (ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, Math.max(0, ms)));
  };
  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  // The question is open: the orb listens, and (with motion) the gate block breathes and the headline's
  // dashes march a few times, then rest. Re-arming restarts those few beats.
  function ask() {
    heroOrb.set("listening");
    const hero = rootRef.current?.closest<HTMLElement>(".identity-hero");
    if (!hero || !motionAllowed()) return;
    delete hero.dataset.asking;
    void hero.offsetWidth;
    hero.dataset.asking = "";
  }

  function quiet() {
    const hero = rootRef.current?.closest<HTMLElement>(".identity-hero");
    if (hero) delete hero.dataset.asking;
  }

  // The entrance plays once per page load (hero.css, keyed on html[data-intro="play"], which the boot
  // script sets before first paint). Behind the welcome screen it waits, paused, and plays as the screen
  // closes. A key or a click finishes it at once, and so does turning motion off.
  useEffect(() => {
    const root = document.documentElement;
    const card = rootRef.current;
    if (!card) return;
    let waiting: MutationObserver | null = null;
    let inView: IntersectionObserver | null = null;
    const unlisten = () => {
      window.removeEventListener("keydown", skip, true);
      window.removeEventListener("pointerdown", skip, true);
    };
    const finish = () => {
      endEntrance();
      unlisten();
    };
    function skip() {
      clearTimers();
      finish();
      ask();
    }
    const begin = () => {
      const elapsed = entranceElapsed(card);
      heroOrb.set("idle");
      later(RUN.scan - elapsed, () => heroOrb.set("thinking"));
      later(RUN.ask - elapsed, ask);
      later(RUN.settle - elapsed, finish);
      window.addEventListener("keydown", skip, true);
      window.addEventListener("pointerdown", skip, true);
    };

    if (root.dataset.intro === "play" && motionAllowed()) {
      if (root.dataset.welcome === "show") {
        waiting = new window.MutationObserver(() => {
          if (root.dataset.welcome === "show") return;
          waiting?.disconnect();
          waiting = null;
          begin();
        });
        waiting.observe(root, { attributes: true, attributeFilter: ["data-welcome"] });
      } else begin();
    } else {
      finish();
      heroOrb.set("listening");
      // No entrance this time (a link into the page, a crawler, motion off): the card is already asking,
      // and it says so with a few beats the first time it comes into view.
      if (motionAllowed() && typeof IntersectionObserver !== "undefined") {
        inView = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          inView?.disconnect();
          inView = null;
          ask();
        }, { threshold: 0.4 });
        inView.observe(card);
      }
    }

    const unsubscribe = subscribeMotion(() => {
      if (motionAllowed()) return;
      clearTimers();
      waiting?.disconnect();
      finish();
      quiet();
      if (heroOrb.get() === "idle" || heroOrb.get() === "thinking") heroOrb.set("listening");
    });
    // Cleaning up leaves data-intro alone: a remount (React's development double run) picks the same
    // entrance up again from the card's own animation clock.
    return () => {
      clearTimers();
      waiting?.disconnect();
      inView?.disconnect();
      unlisten();
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

  // The headline shows the gate too: data-gate on the hero turns its dashed line into light, or dims it.
  function mark(next: Gate) {
    setGate(next);
    endEntrance();
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
    clearTimers();
    quiet();
    mark("approved");
    setStatus(variant.done);
    // The orb blooms once (a ring of light leaves it), the gate line turns to light, and the mark in the
    // navigation answers with its own bloom. Then the page moves.
    heroOrb.set("approved");
    bloomBrandOrb();
    later(RUN.rest, () => {
      if (heroOrb.get() === "approved") heroOrb.set("idle");
    });
    const go = () => {
      revealAnchor(variant.target);
      const heading = document.getElementById(variant.target)?.querySelector<HTMLElement>("h2, h3");
      if (!heading) return;
      if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    };
    // The bloom lands first, then the page moves. With motion off, both happen at once.
    if (motionAllowed()) later(RUN.carry, go);
    else go();
  }

  function hold() {
    // Once approved, the page has already moved: "Not now" would claim nothing happened.
    if (gate !== "waiting") return;
    clearTimers();
    quiet();
    focusNext.current = "choices";
    mark("held");
    setStatus(copy.held);
    heroOrb.set("paused");
  }

  // Only the visitor asks again; the card never re-asks on its own.
  function askAgain() {
    focusNext.current = "approve";
    mark("waiting");
    setStatus("");
    ask();
  }

  return (
    <section ref={rootRef} className="hero-run" aria-labelledby="hero-run-title" data-gate={gate}>
      <div className="hero-run__head">
        <div className="hero-run__who">
          <h2 id="hero-run-title" className="hero-run__title">{copy.title}</h2>
          <p className="hero-run__chip"><MetaParts text={copy.replay} /></p>
        </div>
        <p className="hero-run__state"><span className="hero-run__dot" aria-hidden="true" />{copy.state[gate]}</p>
      </div>
      {/* Folded in the server HTML too, so a phone's card keeps its height when the script arrives. CSS
          folds it on phones only, and shows the step anyway when there is no script to unfold it. */}
      <ol className="hero-run__steps" data-folded={expanded ? undefined : ""}>
        <li className="run-step run-step--plan">
          <span className="run-step__label">{copy.labels.plan}</span>
          <span className="run-step__text">
            {script.variants.map((variant) => <span key={variant.key} {...variant.visitor}>{variant.plan}</span>)}
          </span>
        </li>
        <li id="hero-run-read" className="run-step run-step--read">
          <span className="run-step__label">{copy.labels.read}</span>
          <span className="run-step__text">
            {script.variants.map((variant) => (
              <span key={variant.key} {...variant.visitor}>
                <bdi dir="ltr" className="run-step__tool">{variant.tool}</bdi> <MetaParts text={variant.read} />
              </span>
            ))}
          </span>
        </li>
        <li className="run-step run-step--result">
          <span className="run-step__label">{copy.labels.result}</span>
          <span className="run-step__text">
            {script.variants.map((variant) => <span key={variant.key} {...variant.visitor}>{variant.result}</span>)}
          </span>
        </li>
      </ol>
      <button type="button" className="hero-run__more" aria-expanded={expanded} aria-controls="hero-run-read" onClick={() => setExpanded((value) => !value)}>
        {expanded ? copy.less : copy.more}
      </button>
      <div className="hero-run__gate">
        <div className="hero-run__question">
          <p className="hero-run__ask">
            {script.variants.map((variant) => (
              <span key={variant.key} {...variant.visitor}>
                {variant.ask.before}{variant.ask.name ? <bdi dir="ltr">{variant.ask.name}</bdi> : null}{variant.ask.after}
              </span>
            ))}
          </p>
          <p className="hero-run__caption">{copy.caption}</p>
        </div>
        {gate === "held" ? (
          <div ref={choicesRef} className="hero-run__choices" role="group" aria-label={copy.choices} tabIndex={-1}>
            <a className="li-btn li-btn--ghost li-btn--sm" href="#cv">{copy.openCv}</a>
            <a className="li-btn li-btn--ghost li-btn--sm" href="#work">{copy.seeAll(script.featured)}</a>
            <a className="li-btn li-btn--ghost li-btn--sm" href={`#project-${script.flagship.slug}`}>{copy.strongest}</a>
            <button type="button" className="li-btn li-btn--ghost li-btn--sm hero-run__again" onClick={askAgain}><RotateCcw size={15} aria-hidden="true" />{copy.again}</button>
            {agentConfigured ? <button type="button" className="li-btn li-btn--ghost li-btn--sm hero-run__own" onClick={openAssistant}><Sparkles size={15} aria-hidden="true" />{copy.own}</button> : null}
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
      </div>
      <p className="hero-run__status" role="status">{status}</p>
    </section>
  );
}
