// What the AI assistant is doing right now, for the living orb beside the console. The console reports
// plain facts (a question went out, a token came in, a tool is being prepared, the input has focus, the
// visitor approved a draft); this module turns them into one orb state and a voice level. It is a tiny
// store outside React, so the console and the orb never re-render each other.
import type { LivingOrbState } from "@/lib/living-orb";

export type AssistantActivity = "idle" | "thinking" | "speaking";
/** "agent" is the live assistant; "script" is the console's own scripted lines (boot, commands, offline replies). */
export type ActivitySource = "agent" | "script";
/** The orb states the console can cause. "paused" belongs to the hero, not here. */
export type PresenceState = Exclude<LivingOrbState, "paused">;

/** How long the orb shows the visitor's yes before it settles. */
export const APPROVED_MS = 2400;
// The voice level is a leaky bucket of characters: each piece of an answer pours in, and it drains with
// this time constant. About 40 characters in flight read as a full voice.
const DRAIN_MS = 260;
const FULL_VOICE = 40;

const activity: Record<ActivitySource, AssistantActivity> = { agent: "idle", script: "idle" };
const attention = { focus: false };
let approvedUntil = 0;
let approvedTimer: ReturnType<typeof setTimeout> | undefined;
let approvals = 0;
let level = 0;
let levelAt = 0;
let snapshot: PresenceState = "idle";
const listeners = new Set<() => void>();

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

// The order matters: the visitor's yes shows first; a question in flight outranks the console's own
// lines; listening is what the orb does while nothing else is happening and the visitor is at the input.
function derive(): PresenceState {
  if (now() < approvedUntil) return "approved";
  if (activity.agent === "thinking") return "thinking";
  if (activity.agent === "speaking" || activity.script === "speaking") return "speaking";
  if (activity.script === "thinking") return "thinking";
  if (attention.focus) return "listening";
  return "idle";
}

function emit() {
  const next = derive();
  if (next === snapshot) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

/** The console reports what it is doing. Repeating the same activity is free. */
export function setActivity(source: ActivitySource, next: AssistantActivity) {
  if (activity[source] === next) return;
  activity[source] = next;
  emit();
}

/** The console's input gained or lost focus. */
export function setAttention(focused: boolean) {
  if (attention.focus === focused) return;
  attention.focus = focused;
  emit();
}

/** The visitor approved something the assistant offered (sending a draft). The orb blooms once. */
export function markApproved() {
  approvedUntil = now() + APPROVED_MS;
  clearTimeout(approvedTimer);
  approvedTimer = setTimeout(emit, APPROVED_MS + 20);
  approvals += 1;
  // Everyone hears about every yes, even one that arrives while the last bloom is still showing.
  snapshot = derive();
  listeners.forEach((listener) => listener());
}

/** How many times the visitor has said yes on this page: a second yes blooms the orb again. */
export function approvalCount() {
  return approvals;
}

/** A piece of text arrived (a streamed token, a console line, a keystroke): it feeds the orb's voice. */
export function pulseVoice(characters: number) {
  const time = now();
  level = level * Math.exp(-(time - levelAt) / DRAIN_MS) + Math.max(0, characters);
  levelAt = time;
}

/**
 * The orb's voice, 0..1, polled every frame while it is speaking or listening. It follows how fast text
 * is arriving, with a soft syllable rhythm on top so a steady stream still sounds like speech.
 */
export function voiceLevel() {
  const time = now();
  const pool = level * Math.exp(-(time - levelAt) / DRAIN_MS);
  const rate = Math.min(1, pool / FULL_VOICE);
  const t = time / 1000;
  const syllable = Math.abs(Math.sin(t * 6.3) * 0.6 + Math.sin(t * 10.1 + 1.3) * 0.4);
  return Math.min(1, rate * (0.6 + 0.4 * syllable) + (rate > 0.02 ? 0.12 : 0));
}

export function presenceState(): PresenceState {
  return snapshot;
}

export function subscribePresence(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** For tests: back to a quiet console. */
export function resetPresence() {
  activity.agent = "idle";
  activity.script = "idle";
  attention.focus = false;
  approvedUntil = 0;
  clearTimeout(approvedTimer);
  approvals = 0;
  level = 0;
  levelAt = 0;
  snapshot = "idle";
}
