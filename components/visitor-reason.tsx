"use client";

import { Sparkles } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { reasonFor } from "@/lib/intro";
import { useProfile } from "./use-visitor";

// One line on a project the agent tied to the visitor: why it is worth their minute. Nothing for anyone
// else, and nothing in the server HTML, since the card lives in the visitor's browser only.
export function VisitorReason({ slug, locale = "en" }: { slug: string; locale?: Locale }) {
  const copy = getContent(locale).ui.welcome;
  const reason = reasonFor(useProfile(), slug);
  if (!reason) return null;
  return (
    <p className="visitor-reason">
      <Sparkles size={14} aria-hidden="true" />
      <span className="visitor-reason__label">{copy.forYou}</span>
      {/* In the page's direction: the agent writes in its language, even when a line opens on a Latin name. */}
      <span>{reason}</span>
    </p>
  );
}
