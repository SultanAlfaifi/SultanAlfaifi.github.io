import { ArrowUpRight } from "lucide-react";
import { community } from "@/data/portfolio";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function CommunitySection() {
  const mainWorkshop = community.workshops.find((workshop) => workshop.primary);
  const supportingWorkshops = community.workshops.filter(
    (workshop) => !workshop.primary
  );

  return (
    <section id="community" className="section section--community">
      <div className="page-shell">
        <SectionHeader
          eyebrow="Knowledge in motion / 08"
          title="Community & Teaching"
          description="Sharing practical knowledge through bootcamps, workshops, and volunteer initiatives focused on artificial intelligence and technology."
          inverse
        />

        <div className="community-metrics" aria-label="Community impact">
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
                  Visit organization <ArrowUpRight aria-hidden="true" size={15} />
                </a>
              ) : null}
              <div className="workshop__diagram" aria-hidden="true">
                <span>Fundamentals</span>
                <span>Tools</span>
                <span>Memory</span>
                <span>Planning</span>
                <span>Build</span>
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
              <span>Volunteer record</span>
              <p>
                Participated in 11 volunteer initiatives, contributing more than 180
                hours across community, educational, and technology-focused activities.
              </p>
              {community.volunteerRecordUrl ? (
                <a
                  href={community.volunteerRecordUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  View Volunteer Record
                </a>
              ) : null}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
