import { getContent, type Locale } from "@/data/i18n";
import { AgentTerminal } from "./agent-terminal";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function RuntimeSection({ locale = "en" }: { locale?: Locale }) {
  const { principles, ui } = getContent(locale);
  return (
    <section id="runtime" className="section runtime-section" aria-label={ui.runtime.aria}>
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
