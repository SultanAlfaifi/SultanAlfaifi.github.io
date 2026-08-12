import { ArrowDown, ArrowRight } from "lucide-react";
import { identity } from "@/data/portfolio";
import { HeroMedia } from "./hero-media";
import { HeroScrollCue } from "./hero-scroll-cue";
import { SocialLinks } from "./social-links";
import { SystemMap } from "./system-map";

export function Hero() {
  return (
    <>
      <section id="home" className="hero" aria-labelledby="hero-title">
        <div className="hero__viewport">
          <HeroMedia
            src={identity.introVideo}
            mobileSrc="/assets/media/sultan-introduction-mobile.mp4"
            poster="/assets/media/sultan-introduction-poster.webp"
          />
          <div className="hero__veil" aria-hidden="true" />
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
            </div>

            <p className="hero__wordmark" aria-hidden="true">
              <span>SULTAN</span>
              <i>/</i>
              <span>ALFAIFI</span>
            </p>
            <HeroScrollCue />
          </div>
        </div>
      </section>

      <div className="hero-stack-band">
        <div className="page-shell hero-stack-band__inner">
          <div className="hero-stack-band__meta">
            <SocialLinks />
            <div className="hero__stack">
              <p>Core Stack &amp; Focus</p>
              <ul aria-label="Core stack and focus">
                {identity.coreStack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <SystemMap />
        </div>
      </div>
    </>
  );
}
