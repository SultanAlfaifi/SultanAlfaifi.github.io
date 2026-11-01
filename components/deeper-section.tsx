import type { ReactNode } from "react";
import { getContent, type Locale } from "@/data/i18n";
import { deeperRowLines } from "@/lib/deeper-rows";
import { CommunitySection } from "./community-section";
import { IdeasSection } from "./ideas-section";
import { JourneyTimeline } from "./journey-timeline";
import { OrganizationRail } from "./organization-rail";
import { ProgramsSection } from "./programs-section";
import { SkillsSection } from "./skills-section";

// One row: a <details> that carries the section's own id, so the assistant, the palette and a shared link
// (/ar/#skills) open exactly the row they point at (lib/agent/reveal.ts). The closed row still says something
// true: its number, its title and one line from the data.
function DeeperRow({ id, index, title, line, children }: { id: string; index: number; title: string; line: string; children: ReactNode }) {
  return (
    <details id={id} className="deeper-row">
      <summary className="deeper-row__summary">
        <span className="deeper-row__num li-num" aria-hidden="true">{String(index).padStart(2, "0")}</span>
        <span className="deeper-row__text">
          <h3 className="deeper-row__title">{title}</h3>
          <span className="deeper-row__line">{line}</span>
        </span>
        <span className="deeper-row__plus" aria-hidden="true" />
      </summary>
      <div className="deeper-row__body">{children}</div>
    </details>
  );
}

// «خارج المشاريع» / "Beyond the projects": the quiet appendix after the CV. A header and six sibling rows,
// never nested: the page keeps folds one level deep. It sits on the chapter rhythm and its seam, but it is not
// a numbered chapter.
export function DeeperSection({ locale = "en" }: { locale?: Locale }) {
  const content = getContent(locale);
  const { ui } = content;
  const lines = deeperRowLines(content);
  return (
    <section className="li-chapter li-chapter--appendix deeper" aria-labelledby="deeper-title">
      <div className="page-shell">
        <header className="deeper__head">
          <h2 id="deeper-title">{ui.deeper.title}</h2>
          <p>{ui.deeper.subtitle}</p>
        </header>
        <div className="deeper__rows">
          <DeeperRow id="timeline" index={1} title={ui.timeline.title} line={lines.timeline}>
            <JourneyTimeline locale={locale} />
          </DeeperRow>
          <DeeperRow id="organizations" index={2} title={ui.organizations.title} line={lines.organizations}>
            <OrganizationRail locale={locale} />
          </DeeperRow>
          <DeeperRow id="skills" index={3} title={ui.skills.title} line={lines.skills}>
            <SkillsSection locale={locale} />
          </DeeperRow>
          <DeeperRow id="journey" index={4} title={ui.programs.title} line={lines.journey}>
            <ProgramsSection locale={locale} />
          </DeeperRow>
          <DeeperRow id="community" index={5} title={ui.community.title} line={lines.community}>
            <CommunitySection locale={locale} />
          </DeeperRow>
          <DeeperRow id="ideas" index={6} title={ui.ideas.title} line={lines.ideas}>
            <IdeasSection locale={locale} />
          </DeeperRow>
        </div>
      </div>
    </section>
  );
}
