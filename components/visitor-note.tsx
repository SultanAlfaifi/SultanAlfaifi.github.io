"use client";

import { getContent, type Locale } from "@/data/i18n";
import { openWelcome } from "@/lib/visitor";
import { useVisitor } from "./use-visitor";

// A quiet line in the hero: what the site is arranged for, and a way to change it or to choose.
export function VisitorNote({ locale = "en" }: { locale?: Locale }) {
  const copy = getContent(locale).ui.welcome;
  const visitor = useVisitor();
  const arranged = visitor ? copy.arranged[visitor] : undefined;
  return (
    <p className="visitor-note">
      {arranged ? <span>{arranged}</span> : null}
      <button type="button" onClick={openWelcome}>{arranged ? copy.change : copy.personalize}</button>
    </p>
  );
}
