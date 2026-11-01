import { ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";

// Inside its "Beyond the projects" row (components/deeper-section.tsx), which carries #ideas and the title.
// What I write, for whom, and where; the followers figure sits beside it with its split by platform (data:
// proofMetrics[0].source), as the page's number row said before. Then the three kinds of post, the topics, and
// where to follow.
export function IdeasSection({ locale = "en" }: { locale?: Locale }) {
  const { content, proofMetrics, socialLinks, ui } = getContent(locale);
  const follow = socialLinks.filter((link) => link.platform === "X" || link.platform === "LinkedIn");

  return (
    <div className="row-ideas">
      <div className="row-split">
        <div>
          <p className="deeper-body__lead">{ui.ideas.description}</p>
          <p className="row-ideas__intro">{ui.ideas.intro}</p>
        </div>
        <div className="row-facts">
          {content.metrics.map((metric, index) => (
            <div key={metric.label} className="row-facts__item">
              <p className="row-figure"><span className="row-figure__value li-num">{metric.value}</span> <span>{metric.label}</span></p>
              {index === 0 ? <p className="row-figure__note">{proofMetrics[0].source}</p> : null}
            </div>
          ))}
        </div>
      </div>

      <ol className="row-ideas__pillars">
        {content.pillars.map((pillar, index) => (
          <li key={pillar.title}>
            <span className="row-ideas__index li-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <h4>{pillar.title}</h4>
            <p>{pillar.description}</p>
          </li>
        ))}
      </ol>

      <div className="row-ideas__foot">
        <p className="row-ideas__topics">
          <span className="row-label">{ui.ideas.categories}</span>
          <span>{content.categories.join(" · ")}</span>
        </p>
        <div className="row-ideas__follow">
          {follow.map((link) => (
            <a key={link.platform} className="li-btn li-btn--ghost li-btn--sm" href={link.href} target="_blank" rel="noreferrer noopener">
              {ui.ideas.follow(link.label)} <ArrowUpRight aria-hidden="true" size={15} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
