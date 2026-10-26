import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { getPortfolioAsset } from "@/data/portfolio";
import { MetaParts } from "./meta-parts";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

const achievementLogoDimensions: Record<string, { width: number; height: number }> = {
  "kaust-academy": { width: 874, height: 480 },
  "amad-hackathon": { width: 762, height: 480 },
  ibm: { width: 1259, height: 480 },
  uqu: { width: 1189, height: 480 }
};

export function AchievementsSection({ locale = "en" }: { locale?: Locale }) {
  const { achievements, proofMetrics, ui } = getContent(locale);
  const visible = achievements.filter((achievement) => achievement.enabled);

  return (
    <section id="achievements" className="section proof-section">
      <div className="page-shell">
        <SectionHeader
          title={ui.proof.title}
          description={ui.proof.description}
        />

        <dl className="proof-metrics">
          {proofMetrics.map((metric, index) => {
            const formatted = metric.value.toLocaleString("en-US");
            return (
              <Reveal key={metric.label} className="proof-metric glow-card" delay={index * 60}>
                <dt>{metric.label}</dt>
                <dd>
                  <strong data-count={metric.value}>
                    <span className="sr-only">{`${metric.prefix ?? ""}${formatted}${metric.suffix ?? ""}`}</span>
                    <span aria-hidden="true" dir="ltr">{metric.prefix}<span data-count-value>{formatted}</span>{metric.suffix}</span>
                  </strong>
                  <small><MetaParts text={metric.source} /></small>
                </dd>
              </Reveal>
            );
          })}
        </dl>

        <ol className="proof-grid" aria-label={ui.proof.recognition}>
          {visible.map((achievement, index) => {
            const asset = getPortfolioAsset(achievement.assetId);
            return (
              <li key={achievement.title} className={`proof-card glow-card ${index === 0 ? "proof-card--lead" : ""}`}>
                <div className="proof-card__top">
                  <p className="proof-card__signal">{achievement.signal}</p>
                  {asset ? (
                    <Image
                      src={asset.derived.color}
                      alt={asset.alt}
                      width={achievementLogoDimensions[asset.id]?.width ?? 132}
                      height={achievementLogoDimensions[asset.id]?.height ?? 54}
                      style={{ height: "auto" }}
                      loading="eager"
                      fetchPriority="low"
                    />
                  ) : null}
                </div>
                <h3>{achievement.title}</h3>
                <p className="proof-card__issuer"><MetaParts text={[achievement.issuer, achievement.date].filter(Boolean).join(" · ")} /></p>
                <p>{achievement.description}</p>
                {achievement.verificationUrl ? (
                  <a href={achievement.verificationUrl} target="_blank" rel="noreferrer noopener">
                    {ui.proof.evidence} <ArrowUpRight aria-hidden="true" size={15} />
                  </a>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
