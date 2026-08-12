import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { achievements, getPortfolioAsset } from "@/data/portfolio";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

const achievementLogoDimensions: Record<string, { width: number; height: number }> = {
  "kaust-academy": { width: 874, height: 480 },
  "amad-hackathon": { width: 762, height: 480 },
  ibm: { width: 1259, height: 480 },
  uqu: { width: 1189, height: 480 }
};

export function AchievementsSection() {
  const visible = achievements.filter((achievement) => achievement.enabled);

  return (
    <section id="achievements" className="section section--graph">
      <div className="page-shell">
        <SectionHeader
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
                    width={achievementLogoDimensions[achievement.assetId ?? ""]?.width ?? 132}
                    height={achievementLogoDimensions[achievement.assetId ?? ""]?.height ?? 54}
                    style={{ height: "auto" }}
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
