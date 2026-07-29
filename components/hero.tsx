import { ArrowDown, ArrowRight } from "lucide-react";
import { identity } from "@/data/portfolio";
import { SocialLinks } from "./social-links";
import { SystemMap } from "./system-map";

export function Hero() {
  return (
    <section id="home" className="hero" aria-labelledby="hero-title">
      <div className="hero__ambient" aria-hidden="true" />
      <div className="page-shell hero__inner">
        <div className="hero__copy">
          <p className="hero__eyebrow">{identity.eyebrow}</p>
          <h1 id="hero-title">{identity.headline}</h1>
          <p className="hero__summary">{identity.summary}</p>

          <div className="hero__actions">
            <a className="button button--signal" href="#work">
              Explore My Work <ArrowDown aria-hidden="true" size={17} />
            </a>
            <a className="button button--ghost" href="#contact">
              Let&apos;s Connect <ArrowRight aria-hidden="true" size={17} />
            </a>
          </div>

          <SocialLinks />
        </div>

        <SystemMap />

        <div className="hero__stack">
          <p>Core Stack &amp; Focus</p>
          <ul aria-label="Core stack and focus">
            {identity.coreStack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <a className="hero__scroll" href="#about">
          <span aria-hidden="true" />
          Continue through the system
        </a>
      </div>
    </section>
  );
}
