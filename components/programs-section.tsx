import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { getPortfolioAsset } from "@/data/portfolio";
import { LtrNumbers } from "./ltr-numbers";
import { MetaParts } from "./meta-parts";

// Inside its "Beyond the projects" row (components/deeper-section.tsx), which carries #journey and the title;
// the row's line already names the issuers, and its title already says they are finished. Each program is a
// hairline block: the issuer's logo in off-white, who ran it, the name, what I did in it, what it covered, and
// its result where it has one («أفضل 5%»). Then the other certificates as quiet rows, each with its verify
// link where there is one.
export function ProgramsSection({ locale = "en" }: { locale?: Locale }) {
  const { certifications, programs, ui } = getContent(locale);
  const visible = programs.filter((program) => program.enabled);

  return (
    <div className="row-programs">
      <ul className="row-programs__list">
        {visible.map((program) => {
          const asset = getPortfolioAsset(program.assetId);
          const logoSource =
            program.flagship && asset?.derived.monochrome
              ? asset.derived.monochrome
              : asset?.derived.color;

          return (
            <li key={program.name} className={`row-program${program.flagship ? " row-program--flagship" : ""}`}>
              <div className="row-program__top">
                {asset && logoSource ? (
                  <span className={`row-program__logo${logoSource === asset.derived.monochrome ? "" : " row-program__logo--inked"}`}>
                    <Image src={logoSource} alt={asset.alt} lang={locale === "en" ? undefined : "en"} fill sizes="160px" />
                  </span>
                ) : <span />}
                {program.recognition ? <span className="row-program__result li-aurora-text"><LtrNumbers text={program.recognition} /></span> : null}
              </div>
              <p className="row-program__issuer">{program.issuer}{program.year ? <> · <span className="li-num">{program.year}</span></> : null}</p>
              <h4><bdi>{program.name}</bdi></h4>
              <p className="row-program__summary">{program.summary}</p>
              <p className="row-program__focus"><MetaParts text={program.focus.join(" · ")} /></p>
              {program.credentialUrl ? (
                <a className="row-link" href={program.credentialUrl} target="_blank" rel="noreferrer noopener">
                  {ui.programs.verifyCredential} <ArrowUpRight aria-hidden="true" size={15} />
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="row-certs">
        <h4>{ui.programs.alsoCertified}</h4>
        <ul>
          {certifications.map((certification) => (
            <li key={certification.name}>
              <span className="row-certs__name"><bdi lang="en" dir="ltr">{certification.name}</bdi></span>
              <span className="row-certs__by">{certification.issuer} · {certification.date}</span>
              {certification.credentialUrl ? (
                <a className="row-link" href={certification.credentialUrl} target="_blank" rel="noreferrer noopener" aria-label={ui.programs.verifyAria(certification.name)}>
                  {ui.programs.verify} <ArrowUpRight aria-hidden="true" size={14} />
                </a>
              ) : <span aria-hidden="true" />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
