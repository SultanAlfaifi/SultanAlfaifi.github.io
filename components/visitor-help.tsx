"use client";

import { Mail } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { useProfile } from "./use-visitor";

// Above the three ways to start in Contact: where Sultan's work meets the visitor's, in the agent's words
// (two or three points, each tied to a project or skill on the site), and an email to him already begun
// from their card, which they finish in their own mail app. Only for a visitor whose AI introduced them.
export function VisitorHelp({ locale = "en" }: { locale?: Locale }) {
  const { identity, ui } = getContent(locale);
  const copy = ui.welcome;
  const profile = useProfile();
  if (!profile?.help.length) return null;
  const params = new URLSearchParams({ subject: copy.mailSubject(profile.name, profile.organization), body: copy.mailBody(profile) });
  // mailto wants %20 for spaces; URLSearchParams writes "+", which mail apps show as a plus.
  const href = `mailto:${identity.email}?${params.toString().replace(/\+/g, "%20")}`;
  return (
    <section className="visitor-help li-glass" aria-labelledby="visitor-help-title">
      <h3 id="visitor-help-title" className="visitor-help__title">{copy.helpFor(profile.name)}</h3>
      <ul className="visitor-help__points">
        {/* The agent writes in the page's language, so a point that opens on a project's Latin name
            ("AutoFlow …") still reads in the page's direction. */}
        {profile.help.map((point) => <li key={point}>{point}</li>)}
      </ul>
      <a className="li-btn li-btn--ghost visitor-help__write" href={href}>
        <Mail aria-hidden="true" />
        {copy.writeTo}
      </a>
    </section>
  );
}
