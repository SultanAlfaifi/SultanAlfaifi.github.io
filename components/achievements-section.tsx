import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Fragment } from "react";
import { getContent, type Locale } from "@/data/i18n";
import { getPortfolioAsset } from "@/data/portfolio";
import { MetaParts } from "./meta-parts";
import { RecommendationsSection } from "./recommendations-section";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

// A signal reads in the page's direction, and any figure inside it ("5%", "5/5") keeps its own left-to-right
// order, so «أفضل 5%» never turns into «%5» and «5/5 للفريق» stays whole.
export function Signal({ text }: { text: string }) {
  const parts = text.split(/(\d[\d.,/]*%?\+?)/);
  return (
    <bdi>
      {parts.map((part, index) =>
        index % 2 ? <bdi key={index} dir="ltr" className="li-num">{part}</bdi> : <Fragment key={index}>{part}</Fragment>
      )}
    </bdi>
  );
}

// Chapter "Recognition" (FINAL-SPEC 6.5): one lead moment («أفضل 5%» in the living light), then the other
// recognitions as quiet hairline rows with their full descriptions, then the two recommendations. The page's
// one row of numbers is the hero's spec strip, so there is none here.
export function AchievementsSection({ locale = "en" }: { locale?: Locale }) {
  const { achievements, ui } = getContent(locale);
  const [lead, ...rows] = achievements.filter((achievement) => achievement.enabled);
  const leadMark = lead ? getPortfolioAsset(lead.assetId) : null;

  return (
    <section id="achievements" className="section li-chapter recognition">
      <div className="page-shell">
        <SectionHeader title={ui.proof.title} description={ui.proof.description} />

        {lead ? (
          <Reveal className="recognition__lead">
            <p className="recognition__moment">
              <span className="li-aurora-text"><Signal text={lead.signal} /></span>
            </p>
            <h3 className="recognition__lead-title">{lead.title}</h3>
            <p className="recognition__lead-text">{lead.description}</p>
            <p className="recognition__by">
              {leadMark?.derived.monochrome ? (
                <Image src={leadMark.derived.monochrome} alt="" width={874} height={480} />
              ) : null}
              <MetaParts text={[lead.issuer, lead.date].filter(Boolean).join(" · ")} />
            </p>
          </Reveal>
        ) : null}

        <ol className="recognition__rows">
          {rows.map((achievement) => (
            <li key={achievement.title} className="recognition__row">
              <p className="recognition__signal"><Signal text={achievement.signal} /></p>
              <div className="recognition__text">
                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>
                {achievement.verificationUrl ? (
                  <a href={achievement.verificationUrl} target="_blank" rel="noreferrer noopener">
                    {ui.proof.evidence} <ArrowUpRight aria-hidden="true" size={15} />
                  </a>
                ) : null}
              </div>
              <p className="recognition__issuer">
                <MetaParts text={[achievement.issuer, achievement.date].filter(Boolean).join(" · ")} />
              </p>
            </li>
          ))}
        </ol>

        {/* «قالوا عنّي»: the two recommendations, inside Recognition (#recommendations). */}
        <RecommendationsSection locale={locale} />
      </div>
    </section>
  );
}
