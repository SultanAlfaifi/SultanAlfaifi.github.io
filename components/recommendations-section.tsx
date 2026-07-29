import Image from "next/image";
import { ArrowUpRight, Quote } from "lucide-react";
import { getPortfolioAsset, recommendations } from "@/data/portfolio";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function RecommendationsSection() {
  return (
    <section id="recommendations" className="section section--recommendations">
      <div className="page-shell">
        <SectionHeader
          eyebrow="Trusted perspectives / 09"
          title="Recommendations"
          description="Perspectives from educators and mentors who have seen me learn, build, and collaborate."
        />

        <div className="recommendations-grid">
          {recommendations.map((recommendation, index) => (
            <Reveal
              key={recommendation.name}
              className="recommendation-card"
              delay={index * 100}
            >
              <Quote className="recommendation-card__quote-icon" aria-hidden="true" />
              <blockquote>
                <p>“{recommendation.quote}”</p>
              </blockquote>
              <div className="recommendation-card__person">
                <span aria-hidden="true">{recommendation.initials}</span>
                <div>
                  <h3>{recommendation.name}</h3>
                  {recommendation.roles.map((role) => (
                    <p key={role}>{role}</p>
                  ))}
                </div>
              </div>
              {recommendation.contextAssetIds.length ? (
                <div className="recommendation-card__context" aria-label="Recommendation context">
                  {recommendation.contextAssetIds.map((assetId) => {
                    const asset = getPortfolioAsset(assetId);
                    if (!asset) return null;
                    return (
                      <Image
                        key={assetId}
                        src={asset.derived.color}
                        alt={asset.alt}
                        width={132}
                        height={54}
                      />
                    );
                  })}
                </div>
              ) : null}
              <ul className="tag-list tag-list--dark" aria-label="Recommendation themes">
                {recommendation.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              {recommendation.note ? (
                <p className="recommendation-card__note">{recommendation.note}</p>
              ) : null}
              {recommendation.publicUrl ? (
                <a
                  href={recommendation.publicUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  View on LinkedIn <ArrowUpRight aria-hidden="true" size={15} />
                </a>
              ) : null}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
