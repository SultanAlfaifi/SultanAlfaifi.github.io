import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { getPortfolioAsset } from "@/data/portfolio";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function AboutSection({ locale = "en" }: { locale?: Locale }) {
  const { about, identity, ui } = getContent(locale);
  const portrait = getPortfolioAsset(about.portraitAssetId);
  const educationLogo = getPortfolioAsset(about.educationAssetId);

  return (
    <section id="about" className="section section--paper">
      <div className="page-shell">
        <SectionHeader
          title={ui.about.title}
        />

        <div className="about-layout">
          {portrait ? (
            <Reveal className="about-portrait" variant="media">
              <div className="about-portrait__frame">
                <div className="about-portrait__stage">
                  <Image
                    src={portrait.derived.color}
                    alt={portrait.alt}
                    fill
                    sizes="(max-width: 840px) 76vw, 360px"
                    loading="eager"
                    fetchPriority="low"
                    style={{ objectPosition: portrait.objectPosition }}
                  />
                </div>
              </div>
            </Reveal>
          ) : null}

          <div className="about-layout__content">
            <Reveal className="about-layout__copy" variant="right">
              {about.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {identity.resumeUrl ? (
                <a
                  className="text-link"
                  href={identity.resumeUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {ui.about.resume} <ArrowUpRight aria-hidden="true" size={16} />
                </a>
              ) : null}
            </Reveal>

            <Reveal delay={120}>
              <dl className="about-metadata">
                {about.metadata.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
                {educationLogo ? (
                  <div className="about-metadata__education-mark">
                    <dt>{ui.about.educationMark}</dt>
                    <dd>
                      <Image
                        src={educationLogo.derived.color}
                        alt={educationLogo.alt}
                        width={1189}
                        height={480}
                        style={{ height: "auto" }}
                      />
                    </dd>
                  </div>
                ) : null}
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
