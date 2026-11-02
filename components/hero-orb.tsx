"use client";

import { useSyncExternalStore } from "react";
import { LivingOrb, type LivingOrbState } from "./living-orb";

// The hero's agent: one big living orb under the headline that follows the run card beside it. The card
// (hero-run.tsx) says what the agent is doing through this tiny store, and the orb only listens, so the
// two stay in step without sharing a component. It is decoration: the card's own status line says it all.
let current: LivingOrbState = "idle";
const listeners = new Set<() => void>();

export const heroOrb = {
  get: () => current,
  set(next: LivingOrbState) {
    if (next === current) return;
    current = next;
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

const serverState = (): LivingOrbState => "idle";

export function HeroOrb() {
  const state = useSyncExternalStore(heroOrb.subscribe, heroOrb.get, serverState);
  // The square is larger than the sphere: at halo 1 the sphere is about 56% of it, and the rest is glow.
  return <LivingOrb className="hero-orb" state={state} size="var(--hero-orb-square)" halo={1} interactive />;
}
