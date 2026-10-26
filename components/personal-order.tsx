"use client";

import { Fragment, type ReactNode } from "react";
import type { Visitor } from "@/lib/visitor";
import { useVisitor } from "./use-visitor";

// The order of the sections after the hero, by why the visitor came. Hiring: what he does now, the
// proof, then the CV. Working together: the projects, the assistant, and how to start. Browsing or
// skipping keeps the usual order, which is the order the sections are passed in.
export const SECTION_ORDERS: Partial<Record<Visitor, string[]>> = {
  hiring: ["experience", "work", "cv", "recommendations", "achievements", "runtime", "about", "organizations", "journey", "band", "deeper", "help", "contact"],
  collaborate: ["work", "runtime", "help", "achievements", "about", "journey", "band", "experience", "organizations", "recommendations", "deeper", "cv", "contact"]
};

// Reorders the real DOM, not just the paint, so keyboard and screen-reader order match what's seen.
export function PersonalOrder({ sections }: { sections: { id: string; node: ReactNode }[] }) {
  const visitor = useVisitor();
  const order = visitor ? SECTION_ORDERS[visitor] : undefined;
  const shown = order ? [...sections].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)) : sections;
  return <>{shown.map(({ id, node }) => <Fragment key={id}>{node}</Fragment>)}</>;
}
