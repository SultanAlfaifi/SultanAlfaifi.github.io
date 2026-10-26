import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { getPortfolioAsset } from "@/data/portfolio";
import { MetaParts } from "./meta-parts";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function ProgramsSection({ locale = "en" }: { locale?: Locale }) {
  const { certifications, programs, ui } = getContent(locale);
  const visible = programs.filter((program) => program.enabled);

  return (
    <section id="journey" className="section section--paper">
      <div className="page-shell">
        <SectionHeader
          title={ui.programs.title}
          description={ui.programs.description}
        />

        <div className="program-grid">
          {visible.map((program, index) => {
            const asset = getPortfolioAsset(program.assetId);
            const logoSource =
              program.flagship && asset?.derived.monochrome
                ? asset.derived.monochrome
                : asset?.derived.color;

            return (
              <Reveal
                key={program.name}
                className={`program-card ${program.flagship ? "program-card--flagship" : ""}`}
                delay={Math.min(index * 55, 220)}
              >
              <div className="program-card__issuer">
                <span>{program.issuer}</span>
                {program.year ? <span>{program.year}</span> : null}
              </div>
              {asset && logoSource ? (
                <div className="program-card__logo">
                  <Image
                    src={logoSource}
                    alt={asset.alt}
                    fill
                    sizes={program.flagship ? "300px" : "190px"}
                  />
                </div>
              ) : null}
              <h3>{program.name}</h3>
              <div className="program-card__story">
                <div>
                  <span>{ui.programs.learned}</span>
                  <p><MetaParts text={program.focus.join(" · ")} /></p>
                </div>
                <div>
                  <span>{ui.programs.applied}</span>
                  <p>{program.summary}</p>
                </div>
                <div>
                  <span>{ui.programs.achieved}</span>
                  <p>{program.recognition ?? ui.programs.completed}</p>
                </div>
              </div>
              {program.credentialUrl ? (
                <a
                  href={program.credentialUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {ui.programs.verifyCredential} <ArrowUpRight aria-hidden="true" size={15} />
                </a>
              ) : null}
              </Reveal>
            );
          })}
        </div>

        <div className="certifications">
          <h3>{ui.programs.alsoCertified}</h3>
          <ul>
            {certifications.map((certification) => (
              <li key={certification.name}>
                <span lang="en" dir="ltr">{certification.name}</span>
                <span>{certification.issuer} · {certification.date}</span>
                {certification.credentialUrl ? (
                  <a href={certification.credentialUrl} target="_blank" rel="noreferrer noopener" aria-label={ui.programs.verifyAria(certification.name)}>
                    {ui.programs.verify} <ArrowUpRight aria-hidden="true" size={14} />
                  </a>
                ) : <span aria-hidden="true" />}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
