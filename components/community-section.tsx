import { ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function CommunitySection({ locale = "en" }: { locale?: Locale }) {
  const { community, ui } = getContent(locale);
  const mainWorkshop = community.workshops.find((workshop) => workshop.primary);
  const supportingWorkshops = community.workshops.filter(
    (workshop) => !workshop.primary
  );

  return (
    <section id="community" className="section section--community">
      <div className="page-shell">
        <SectionHeader
          title={ui.community.title}
          description={ui.community.description}
          inverse
        />

        <div className="community-metrics" aria-label={ui.community.impact}>
          {community.metrics.map((metric, index) => (
            <Reveal key={metric.label} className="community-metric" delay={index * 80}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </Reveal>
          ))}
        </div>

        <div className="community-editorial">
          {mainWorkshop ? (
            <Reveal className="workshop workshop--primary">
              <p className="workshop__meta">{mainWorkshop.meta}</p>
              <h3>{mainWorkshop.title}</h3>
              <p>{mainWorkshop.description}</p>
              {mainWorkshop.organizationUrl ? (
                <a
                  href={mainWorkshop.organizationUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {ui.community.visit} <ArrowUpRight aria-hidden="true" size={15} />
                </a>
              ) : null}
              <div className="workshop__diagram" aria-hidden="true">
                {ui.community.diagram.map((step) => <span key={step}>{step}</span>)}
              </div>
            </Reveal>
          ) : null}

          <div className="community-editorial__supporting">
            {supportingWorkshops.map((workshop, index) => (
              <Reveal key={workshop.title} className="workshop" delay={index * 90}>
                <p className="workshop__meta">{workshop.meta}</p>
                <h3>{workshop.title}</h3>
                <p>{workshop.description}</p>
              </Reveal>
            ))}
            <Reveal className="volunteer-note">
              <span>{ui.community.volunteerTitle}</span>
              <p>{ui.community.volunteerText}</p>
              {community.volunteerRecordUrl ? (
                <a
                  href={community.volunteerRecordUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {ui.community.volunteerLink}
                </a>
              ) : null}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
