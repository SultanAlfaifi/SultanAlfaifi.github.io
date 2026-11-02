"use client";

import { Fragment, type ReactNode } from "react";
import type { Visitor } from "@/lib/visitor";
import { useVisitor } from "./use-visitor";

// The order of the eight blocks after the hero, by why the visitor came. Browsing or skipping keeps the usual
// order, which is the order the blocks are passed in: work, band, runtime, about, achievements, cv, deeper,
// contact. Hiring: About first (its Now card, Salla, leads), then the work, then the CV as the third block.
// Working together: the projects, the assistant, and Contact last, where the three ways to start now live.
// Contact always closes, so the horizon and the wordmark end every order. Every order lists all eight keys.
export const SECTION_ORDERS: Partial<Record<Visitor, string[]>> = {
  hiring: ["about", "work", "cv", "achievements", "runtime", "band", "deeper", "contact"],
  collaborate: ["work", "band", "runtime", "achievements", "about", "deeper", "cv", "contact"]
};

// Reorders the real DOM, not just the paint, so keyboard and screen-reader order match what's seen, and the
// chapter numbers (a CSS counter in DOM order) follow the visitor's order.
export function PersonalOrder({ sections }: { sections: { id: string; node: ReactNode }[] }) {
  const visitor = useVisitor();
  const order = visitor ? SECTION_ORDERS[visitor] : undefined;
  const shown = order ? [...sections].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)) : sections;
  return <>{shown.map(({ id, node }) => <Fragment key={id}>{node}</Fragment>)}</>;
}
