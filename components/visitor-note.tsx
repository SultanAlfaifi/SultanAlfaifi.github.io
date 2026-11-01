"use client";

import { getContent, type Locale } from "@/data/i18n";
import { revealAnchor } from "@/lib/agent/reveal";
import { openWelcome } from "@/lib/visitor";
import { useProfile, useVisitor } from "./use-visitor";

// A quiet line in the hero: what the site is arranged for, and a way to change it or to choose. When the
// visitor's AI introduced them, it names them and points at the project the welcome screen tied them to.
export function VisitorNote({ locale = "en" }: { locale?: Locale }) {
  const { ui, projects } = getContent(locale);
  const copy = ui.welcome;
  const visitor = useVisitor();
  const profile = useProfile();
  const project = profile ? projects.find((item) => item.enabled && item.slug === profile.projects[0]) : undefined;
  const arranged = profile?.name ? copy.arrangedName(profile.name) : visitor ? copy.arranged[visitor] : undefined;
  return (
    <p className="visitor-note">
      {arranged ? <span>{arranged}</span> : null}
      {project ? (
        <a
          href={`#project-${project.slug}`}
          onClick={(event) => {
            if (revealAnchor(`project-${project.slug}`)) event.preventDefault();
          }}
        >
          {copy.startWith(project.title)}
        </a>
      ) : null}
      <button type="button" onClick={openWelcome}>{arranged ? copy.change : copy.personalize}</button>
    </p>
  );
}
