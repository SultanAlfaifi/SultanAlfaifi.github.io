import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getPortfolioAsset, programs } from "@/data/portfolio";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function ProgramsSection() {
  const visible = programs.filter((program) => program.enabled);

  return (
    <section id="journey" className="section section--paper">
      <div className="page-shell">
        <SectionHeader
          title="Learning, Applied."
          description="A curated collection of programs that strengthened my technical foundations, AI capabilities, and professional mindset."
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
                  <span>Learned</span>
                  <p>{program.focus.join(" · ")}</p>
                </div>
                <div>
                  <span>Applied</span>
                  <p>{program.summary}</p>
                </div>
                <div>
                  <span>Achieved</span>
                  <p>{program.recognition ?? "Program completed"}</p>
                </div>
              </div>
              {program.credentialUrl ? (
                <a
                  href={program.credentialUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Verify Credential <ArrowUpRight aria-hidden="true" size={15} />
                </a>
              ) : null}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
