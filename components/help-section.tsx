import { ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

// Speaks to the three reasons people arrive: hiring, building an AI product, or running a program.
export function HelpSection({ locale = "en" }: { locale?: Locale }) {
  const { helpPaths, ui } = getContent(locale);
  return (
    <section id="help" className="section help-section">
      <div className="page-shell">
        <SectionHeader title={ui.help.title} description={ui.help.description} />
        <div className="help-grid">
          {helpPaths.map((path, index) => (
            <Reveal key={path.cta.href} className="help-card-shell" delay={index * 70}>
              <article className="help-card glow-card">
                <p className="help-card__audience"><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{path.audience}</p>
                <h3>{path.need}</h3>
                <p className="help-card__offer">{path.offer}</p>
                <p className="help-card__proof">{path.proof}</p>
                <a className="help-card__cta" href={path.cta.href} data-magnetic>
                  {path.cta.label} <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
