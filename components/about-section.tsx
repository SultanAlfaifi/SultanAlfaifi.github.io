import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { about, getPortfolioAsset, identity } from "@/data/portfolio";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function AboutSection() {
  const portrait = getPortfolioAsset(about.portraitAssetId);
  const educationLogo = getPortfolioAsset(about.educationAssetId);

  return (
    <section id="about" className="section section--paper">
      <div className="page-shell">
        <SectionHeader
          eyebrow="Profile / 01"
          title="About"
          description="Engineering complete products, then extending them with intelligent behavior."
        />

        <div className="about-layout">
          {portrait ? (
            <Reveal className="about-portrait">
              <div className="about-portrait__frame">
                <Image
                  src={portrait.derived.color}
                  alt={portrait.alt}
                  fill
                  sizes="(max-width: 840px) 100vw, 42vw"
                  priority={false}
                  style={{ objectPosition: portrait.objectPosition }}
                />
                <span aria-hidden="true">HUMAN / ENGINEER / BUILDER</span>
              </div>
              <p>Portrait supplied and approved by Sultan Alfaifi.</p>
            </Reveal>
          ) : null}

          <div className="about-layout__content">
            <Reveal className="about-layout__copy">
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
                  Download Resume <ArrowUpRight aria-hidden="true" size={16} />
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
                    <dt>Education mark</dt>
                    <dd>
                      <Image
                        src={educationLogo.derived.color}
                        alt={educationLogo.alt}
                        width={220}
                        height={86}
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
