import { expertise } from "@/data/portfolio";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function ExpertiseSection() {
  return (
    <section id="expertise" className="section section--white">
      <div className="page-shell">
        <SectionHeader
          title="Areas of Expertise"
          description="From full-stack engineering to intelligent agentic systems, I build complete solutions across the product lifecycle."
        />

        <div className="expertise-grid">
          {expertise.map((item, index) => (
            <Reveal
              key={item.title}
              className={`expertise-card ${item.emphasis ? "expertise-card--primary" : ""}`}
              delay={index * 70}
            >
              <div className="expertise-card__route" aria-hidden="true">
                <span />
                <span />
              </div>
              <p className="expertise-card__signal">{item.signal}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
