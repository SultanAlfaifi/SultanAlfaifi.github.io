import { ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function IdeasSection({ locale = "en" }: { locale?: Locale }) {
  const { content, socialLinks, ui } = getContent(locale);
  const contentSocials = socialLinks.filter(
    (link) => link.platform === "X" || link.platform === "LinkedIn"
  );

  return (
    <section id="ideas" className="section section--ideas">
      <div className="page-shell">
        <SectionHeader
          title={ui.ideas.title}
          description={ui.ideas.description}
          inverse
        />

        <div className="ideas-intro">
          <Reveal>
            <p>{ui.ideas.intro}</p>
          </Reveal>
          <div className="ideas-metrics">
            {content.metrics.map((metric, index) => (
              <Reveal key={metric.label} className="ideas-metric" delay={index * 90}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="ideas-pillars">
          {content.pillars.map((pillar, index) => (
            <Reveal key={pillar.title} className="ideas-pillar" delay={index * 70}>
              <span>0{index + 1}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </Reveal>
          ))}
        </div>

        <div className="ideas-footer">
          <ul aria-label={ui.ideas.categories}>
            {content.categories.map((category) => (
              <li key={category}>{category}</li>
            ))}
          </ul>
          <div>
            {contentSocials.map((link) => (
              <a
                key={link.platform}
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
              >
                {ui.ideas.follow(link.label)} <ArrowUpRight aria-hidden="true" size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
