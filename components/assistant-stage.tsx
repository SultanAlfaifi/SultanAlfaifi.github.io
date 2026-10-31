"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { getContent, type Locale } from "@/data/i18n";
import type { LivingOrbState } from "@/lib/living-orb";
import { approvalCount, presenceState, subscribePresence, voiceLevel, type PresenceState } from "./assistant-presence";
import { bloomBrandOrb, LivingOrb, type LivingOrbControls } from "./living-orb";
import { motionAllowed, subscribeMotion } from "./motion-preference";
import { unlockSecret } from "./secrets";

type Word = PresenceState | "greeting" | "gravity";
type Gravity = "off" | "held" | "released";

// How long a press must last before the orb starts pulling (the "gravity" secret), and how long the
// release bloom shows before the orb goes back to following the console.
const HOLD_MS = 420;
const RELEASE_MS = 2000;
// The hello when the section first comes into view: it notices you, says something, then rests.
const GREETING: [Exclude<LivingOrbState, "paused">, number][] = [["listening", 350], ["speaking", 1150], ["idle", 2700]];

const serverState = (): PresenceState => "idle";
const serverCount = () => 0;

// The AI section's living orb and the small word under it. It follows the real console (through
// components/assistant-presence.ts): listening at the input, thinking until the first words, speaking
// while they stream, a bloom when the visitor approves a draft. It also plays the section's entrance,
// says hello once, and holds the "gravity" secret: press and hold the light, then let go.
export function AssistantStage({ locale = "en" }: { locale?: Locale }) {
  const copy = getContent(locale).ui.runtime;
  const stageRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<LivingOrbControls>(null);
  const presence = useSyncExternalStore(subscribePresence, presenceState, serverState);
  const approvals = useSyncExternalStore(subscribePresence, approvalCount, serverCount);
  const [greeting, setGreeting] = useState<LivingOrbState | null>(null);
  const [gravity, setGravity] = useState<Gravity>("off");
  const gravityRef = useRef<Gravity>("off");
  const holding = useRef(false);
  const holdTimer = useRef(0);

  // Gravity and the visitor's own moves come first; the hello fills in only while nothing real is happening.
  let state: LivingOrbState;
  let word: Word;
  if (gravity === "held") [state, word] = ["thinking", "gravity"];
  else if (gravity === "released") [state, word] = ["approved", "gravity"];
  else if (presence !== "idle" && presence !== "speaking") [state, word] = [presence, presence];
  else if (greeting && greeting !== "idle") [state, word] = [greeting, "greeting"];
  else [state, word] = [presence, presence];

  // A second yes while the first bloom is still showing blooms again; every yes also lights the logo.
  const seenApprovals = useRef(0);
  useEffect(() => {
    if (approvals <= seenApprovals.current) return;
    seenApprovals.current = approvals;
    orbRef.current?.bloom();
    bloomBrandOrb();
  }, [approvals]);

  // The section mirrors the state, so the console's edge can answer the orb.
  useEffect(() => {
    const section = stageRef.current?.closest<HTMLElement>(".ai-section");
    if (section) section.dataset.presence = state;
  }, [state]);

  // The entrance and the hello. The section's parts wait (hidden) only when motion is on and the section
  // is still below the fold when the page wakes up; without JavaScript, or with motion off, nothing waits.
  useEffect(() => {
    const stage = stageRef.current;
    const section = stage?.closest<HTMLElement>(".ai-section");
    const title = section?.querySelector<HTMLElement>(".ai-title");
    if (!stage || !section || !title) return;
    const timers: number[] = [];
    let greeted = false;

    const greet = () => {
      if (greeted || !motionAllowed()) return;
      greeted = true;
      GREETING.forEach(([phase, at]) => timers.push(window.setTimeout(() => setGreeting(phase), at)));
    };

    const below = title.getBoundingClientRect().top > window.innerHeight;
    if (motionAllowed() && below && "IntersectionObserver" in window) section.dataset.arrive = "wait";
    const unsubscribe = subscribeMotion(() => {
      if (motionAllowed()) return;
      delete section.dataset.arrive;
      setGreeting(null);
    });

    // The entrance plays once the title is a fifth of the screen above the bottom edge, or as soon as the
    // orb or the console is on screen (the companion's "back to the chat" lands on the console directly).
    const arrival = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      arrival.disconnect();
      if (section.dataset.arrive === "wait") {
        if (motionAllowed()) section.dataset.arrive = "play";
        else delete section.dataset.arrive;
      }
      greet();
    }, { rootMargin: "0px 0px -20% 0px" });
    arrival.observe(title);
    arrival.observe(stage);
    const chat = section.querySelector(".ai-chat");
    if (chat) arrival.observe(chat);

    // Arriving from a link straight to the console, the orb still says hello once it is on screen.
    const seen = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      seen.disconnect();
      greet();
    }, { threshold: 0.45 });
    seen.observe(stage);

    return () => {
      arrival.disconnect();
      seen.disconnect();
      unsubscribe();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  // The gravity secret. A press that lasts pulls the light in; letting go releases it.
  useEffect(() => {
    let settle = 0;
    const release = () => {
      if (!holding.current) return;
      holding.current = false;
      window.clearTimeout(holdTimer.current);
      if (gravityRef.current !== "held") return;
      gravityRef.current = "released";
      setGravity("released");
      orbRef.current?.bloom();
      unlockSecret("gravity");
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        gravityRef.current = "off";
        setGravity("off");
      }, RELEASE_MS);
    };
    // A scroll that starts on the orb cancels the press without unlocking anything.
    const cancel = () => {
      holding.current = false;
      window.clearTimeout(holdTimer.current);
      if (gravityRef.current === "held") {
        gravityRef.current = "off";
        setGravity("off");
      }
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(holdTimer.current);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", cancel);
    };
  }, []);

  function press(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || gravityRef.current !== "off") return;
    holding.current = true;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      if (!holding.current) return;
      gravityRef.current = "held";
      setGravity("held");
    }, HOLD_MS);
  }

  return (
    <div
      ref={stageRef}
      className="ai-stage"
      data-state={state}
      data-gravity={gravity === "held" ? "" : undefined}
      data-cursor={copy.cursor}
      onPointerDown={press}
      onContextMenu={(event) => {
        if (holding.current) event.preventDefault();
      }}
    >
      <span className="ai-stage__floor" aria-hidden="true" />
      <span className="ai-stage__ring" aria-hidden="true" />
      <LivingOrb ref={orbRef} className="ai-orb" state={state} amplitude={voiceLevel} interactive label={copy.orb} />
      <p className="ai-state" aria-hidden="true">
        <span className="ai-state__lamp" />
        <span key={word} className="ai-state__word">{copy.states[word]}</span>
      </p>
    </div>
  );
}
