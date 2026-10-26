"use client";

import { useSyncExternalStore } from "react";
import { VISITOR_EVENT, VISITORS, type Visitor } from "@/lib/visitor";

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
