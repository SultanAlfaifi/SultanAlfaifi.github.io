import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { achievements, getPortfolioAsset } from "@/data/portfolio";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function AchievementsSection() {
  const visible = achievements.filter((achievement) => achievement.enabled);

  return (
    <section id="achievements" className="section section--graph">
      <div className="page-shell">
        <SectionHeader
          eyebrow="Signals / 06"
          title="Achievements & Recognition"
          description="Selected markers of learning, execution, and contribution."
        />

        <div className="achievement-grid">
          {visible.map((achievement, index) => (
            <Reveal key={achievement.title} className="achievement-card" delay={index * 60}>
              <div className="achievement-card__top">
                <span className="achievement-card__index">A{index + 1}</span>
                {getPortfolioAsset(achievement.assetId) ? (
                  <Image
                    src={getPortfolioAsset(achievement.assetId)!.derived.color}
                    alt={getPortfolioAsset(achievement.assetId)!.alt}
                    width={132}
                    height={54}
                  />
                ) : null}
              </div>
              <h3>{achievement.title}</h3>
              <p>{achievement.description}</p>
              {achievement.verificationUrl ? (
                <a
                  href={achievement.verificationUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  View evidence <ArrowUpRight aria-hidden="true" size={15} />
                </a>
              ) : null}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
