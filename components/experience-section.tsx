import Image from "next/image";
import { experience, getPortfolioAsset } from "@/data/portfolio";
import { Reveal } from "./reveal";
import { SallaExperienceStory } from "./salla-experience-story";
import { SectionHeader } from "./section-header";

export function ExperienceSection() {
  const sallaExperience = experience.find((item) => item.organization === "Salla");
  const sallaAsset = sallaExperience ? getPortfolioAsset(sallaExperience.assetId) : null;
  const remainingExperience = experience.filter((item) => item !== sallaExperience);

  return (
    <section id="experience" className="section section--paper experience-section">
      <div className="page-shell">
        <SectionHeader
          title="Experience"
          description="Professional learning grounded in implementation, feedback, and engineering workflows."
        />
      </div>

      {sallaExperience && sallaAsset ? (
        <SallaExperienceStory experience={sallaExperience} asset={sallaAsset} />
      ) : null}

      {remainingExperience.length > 0 ? (
        <div className="page-shell">
          <div className="experience-timeline">
          {remainingExperience.map((item) => (
            <Reveal key={`${item.organization}-${item.role}`} className="experience-entry">
              <div className="experience-entry__marker" aria-hidden="true">
                <span />
              </div>
              <div className="experience-entry__meta">
                <p>{item.dates}</p>
                <p>{item.location}</p>
              </div>
              <div className="experience-entry__content">
                {getPortfolioAsset(item.assetId) ? (
                  <div className="experience-entry__brand">
                    <Image
                      src={getPortfolioAsset(item.assetId)!.derived.color}
                      alt={getPortfolioAsset(item.assetId)!.alt}
                      width={180}
                      height={76}
                    />
                  </div>
                ) : null}
                <p className="experience-entry__organization">{item.organization}</p>
                <h3>{item.role}</h3>
                <p>{item.description}</p>
                <ul className="experience-entry__responsibilities">
                  {item.responsibilities.map((responsibility) => (
                    <li key={responsibility}>{responsibility}</li>
                  ))}
                </ul>
                <ul className="tag-list tag-list--dark" aria-label="Experience technologies">
                  {item.technologies.map((technology) => (
                    <li key={technology}>{technology}</li>
                  ))}
                </ul>
                <p className="experience-entry__note">{item.note}</p>
              </div>
            </Reveal>
          ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
