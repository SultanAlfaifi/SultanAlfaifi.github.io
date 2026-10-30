import { getContent, type Locale } from "@/data/i18n";
import { AgentField } from "./agent-field";
import { AgentTerminal } from "./agent-terminal";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function RuntimeSection({ locale = "en" }: { locale?: Locale }) {
  const { principles, projects, ui } = getContent(locale);
  // The agent network moved here from the hero: it sits behind the console, and pressing and holding on
  // it still finds the "gravity" secret. Its nodes are named after the featured projects.
  const fieldLabels = [
    ...projects.filter((project) => project.enabled).slice(0, 8).map((project) => (locale === "en" ? project.title.toLowerCase() : project.title)),
    ...ui.runtime.concepts
  ];
  return (
    <section id="runtime" className="section runtime-section" aria-label={ui.runtime.aria} data-cursor={ui.runtime.cursor}>
      <AgentField labels={fieldLabels} />
      <div className="page-shell">
        <SectionHeader
          title={ui.runtime.title}
          description={ui.runtime.description}
          inverse
        />
        <div className="runtime-layout">
          <AgentTerminal locale={locale} />
          <Reveal className="runtime-principles" variant="right">
            <h3>{ui.runtime.principles}</h3>
            <ol>
              {principles.map((principle, index) => (
                <li key={principle}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{principle}</li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
