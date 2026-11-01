"use client";

import { useSyncExternalStore } from "react";
import type { VisitorProfile } from "@/lib/intro";
import { readProfile, VISITOR_EVENT, VISITORS, type Visitor } from "@/lib/visitor";

function subscribe(callback: () => void) {
  window.addEventListener(VISITOR_EVENT, callback);
  return () => window.removeEventListener(VISITOR_EVENT, callback);
}

function snapshot() {
  const value = document.documentElement.dataset.visitor as Visitor | undefined;
  return value && VISITORS.includes(value) ? value : null;
}

// Null on the server and while the welcome screen is still waiting for an answer.
export function useVisitor(): Visitor | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

// The card the visitor's AI wrote about them, when they shared one.
export function useProfile(): VisitorProfile | null {
  return useSyncExternalStore(subscribe, readProfile, () => null);
}
