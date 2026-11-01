import { ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { MetaParts } from "./meta-parts";
import { Reveal } from "./reveal";

// The opening quote mark, drawn in the living light (the aurora). Each mark has its own gradient id.
function QuoteMark({ id }: { id: string }) {
  return (
    <svg className="recognition__mark" viewBox="0 0 34 26" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" style={{ stopColor: "var(--li-apricot)" }} />
          <stop offset="0.35" style={{ stopColor: "var(--li-rose)" }} />
          <stop offset="0.7" style={{ stopColor: "var(--li-iris)" }} />
          <stop offset="1" style={{ stopColor: "var(--li-glacier)" }} />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M0 26V15C0 6.7 4.6 1.6 13 0l1.6 3.4C9.8 5 7.6 8 7.4 12H14v14H0Zm20 0V15c0-8.3 4.6-13.4 13-15l1.6 3.4C29.8 5 27.6 8 27.4 12H34v14H20Z"
      />
    </svg>
  );
}

// «قالوا عنّي», inline inside Recognition (components/achievements-section.tsx, FINAL-SPEC 6.5), so its
// heading is an h3. Two quotes, each with the person's name, their roles on one line and their own note once
// (the translation note, and the signed letter where there is one), and the LinkedIn link where it is public.
export function RecommendationsSection({ locale = "en" }: { locale?: Locale }) {
  const { recommendations, ui } = getContent(locale);
  return (
    <section id="recommendations" className="recognition__quotes" aria-labelledby="recommendations-title">
      <h3 id="recommendations-title" className="recognition__quotes-title">{ui.recommendations.title}</h3>

      <div className="recognition__quote-grid">
        {recommendations.map((recommendation, index) => (
          <Reveal key={recommendation.name} className="recognition__quote" delay={index * 100}>
            <figure>
              <QuoteMark id={`recognition-mark-${index}`} />
              <blockquote>
                <p>{recommendation.quote}</p>
              </blockquote>
              <figcaption>
                <span className="recognition__quote-name">{recommendation.name}</span>
                <span className="recognition__quote-role"><MetaParts text={recommendation.roles.join(" · ")} /></span>
              </figcaption>
              {recommendation.note || recommendation.publicUrl ? (
                <p className="recognition__quote-note">
                  {recommendation.note ? <span>{recommendation.note}</span> : null}
                  {recommendation.publicUrl ? (
                    <a href={recommendation.publicUrl} target="_blank" rel="noreferrer noopener">
                      {ui.recommendations.linkedin} <ArrowUpRight aria-hidden="true" size={15} />
                    </a>
                  ) : null}
                </p>
              ) : null}
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
