import { ArrowUpRight } from "lucide-react";
import { content, socialLinks } from "@/data/portfolio";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function IdeasSection() {
  const contentSocials = socialLinks.filter(
    (link) => link.platform === "X" || link.platform === "LinkedIn"
  );

  return (
    <section id="ideas" className="section section--ideas">
      <div className="page-shell">
        <SectionHeader
          title="Ideas, Explained."
          description="From complex systems to clear, practical knowledge."
          inverse
        />

        <div className="ideas-intro">
          <Reveal>
            <p>
              Creating practical Arabic content that makes artificial intelligence,
              AI agents, software systems, and programming easier to understand and
              apply.
            </p>
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
          <ul aria-label="Content categories">
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
                Follow on {link.platform} <ArrowUpRight aria-hidden="true" size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
