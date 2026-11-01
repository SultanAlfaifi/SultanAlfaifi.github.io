import Image from "next/image";
import { ArrowUpRight, Quote } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { getPortfolioAsset } from "@/data/portfolio";
import { Reveal } from "./reveal";

const recommendationLogoDimensions: Record<string, { width: number; height: number }> = {
  ibm: { width: 1259, height: 480 },
  uqu: { width: 1189, height: 480 }
};

export function RecommendationsSection({ locale = "en" }: { locale?: Locale }) {
  const { recommendations, ui } = getContent(locale);
  return (
    // A block inside Recognition (components/achievements-section.tsx), so its heading is an h3.
    <section id="recommendations" className="recognition__quotes section--recommendations" aria-labelledby="recommendations-title">
      <div>
        <header className="recognition__quotes-head">
          <h3 id="recommendations-title">{ui.recommendations.title}</h3>
          <p>{ui.recommendations.description}</p>
        </header>

        <div className="recommendations-grid">
          {recommendations.map((recommendation, index) => (
            <Reveal
              key={recommendation.initials}
              className="recommendation-card"
              delay={index * 100}
            >
              <Quote className="recommendation-card__quote-icon" aria-hidden="true" />
              <blockquote>
                <p>“{recommendation.quote}”</p>
              </blockquote>
              {ui.recommendations.translated ? <p className="recommendation-card__translated">{ui.recommendations.translated}</p> : null}
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
                <div className="recommendation-card__context" aria-label={ui.recommendations.context}>
                  {recommendation.contextAssetIds.map((assetId) => {
                    const asset = getPortfolioAsset(assetId);
                    if (!asset) return null;
                    return (
                      <Image
                        key={assetId}
                        src={asset.derived.color}
                        alt={asset.alt}
                        width={recommendationLogoDimensions[assetId]?.width ?? 132}
                        height={recommendationLogoDimensions[assetId]?.height ?? 54}
                        style={{ height: "auto" }}
                      />
                    );
                  })}
                </div>
              ) : null}
              <ul className="tag-list" aria-label={ui.recommendations.themes}>
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
                  {ui.recommendations.linkedin} <ArrowUpRight aria-hidden="true" size={15} />
                </a>
              ) : null}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
