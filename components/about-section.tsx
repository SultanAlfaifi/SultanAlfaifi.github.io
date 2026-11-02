import Image from "next/image";
import { getContent, type Locale } from "@/data/i18n";
import { getPortfolioAsset } from "@/data/portfolio";
import { ExperienceSection } from "./experience-section";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

// Chapter "About" (FINAL-SPEC 6.4): who he is in two short paragraphs and one meta line, his portrait, the
// Now card (#experience: what he does at Salla), and the «التالي» line (what he works on next). The CV is
// downloaded once, in its own chapter, so there is no second CV link here.
export function AboutSection({ locale = "en" }: { locale?: Locale }) {
  const { about, identity, journey, ui } = getContent(locale);
  const portrait = getPortfolioAsset(about.portraitAssetId);
  // The second paragraph (languages and the RAJIH run log) left the page; those facts live in the Skills row,
  // the RAJIH card and the CV. lib/agent/knowledge.ts drops the same paragraph.
  const [lead, ...body] = about.paragraphs.filter((_, index) => index !== 1);
  // The last stop of the journey is the one still ahead ("Next"): its date is the label.
  const next = journey[journey.length - 1];

  return (
    <section id="about" className="section li-chapter about-chapter">
      <div className="page-shell">
        <SectionHeader title={ui.about.title} />

        <div className="about">
          <Reveal className="about__text" variant="right">
            <p className="about__lead">{lead}</p>
            {body.map((paragraph) => (
              <p key={paragraph} className="about__body">{paragraph}</p>
            ))}
            {/* One meta line: where, what he studies, which languages. A list, so a wrap never strands a dot. */}
            <ul className="about__meta">
              {[identity.location, identity.education, identity.languages].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>

          {portrait ? (
            <Reveal className="about__portrait" variant="media">
              <div className="about__portrait-frame">
                <Image
                  src={portrait.derived.color}
                  alt={portrait.alt}
                  lang={locale === "en" ? undefined : "en"}
                  fill
                  sizes="(max-width: 900px) 56vw, 400px"
                  loading="eager"
                  fetchPriority="low"
                  style={{ objectPosition: portrait.objectPosition }}
                />
              </div>
            </Reveal>
          ) : null}

          {/* The Now card (#experience). Hiring visitors see it first (app/chapters.css, G10). */}
          <ExperienceSection locale={locale} />

          {next?.kind === "Now" ? (
            <Reveal className="about__next">
              <p className="about__next-label">{next.date}</p>
              <p className="about__next-title">{next.title}</p>
              <p className="about__next-detail">{next.detail}</p>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
