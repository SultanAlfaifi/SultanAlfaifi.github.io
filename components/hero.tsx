import { ArrowDown, ArrowUpRight } from "lucide-react";
import { identity } from "@/data/portfolio";
import { HeroMedia } from "./hero-media";
import { SocialLinks } from "./social-links";

export function Hero() {
  return (
    <section id="home" className="identity-hero" aria-labelledby="hero-title">
      <div className="page-shell identity-hero__layout">
        <div className="identity-hero__copy">
          <p className="identity-hero__name">Sultan Alfaifi <span>— Software Engineer</span></p>
          <h1 id="hero-title">{identity.headline}</h1>
          <p className="identity-hero__summary">{identity.summary}</p>
          <div className="identity-hero__actions">
            <a className="button button--signal" href="#work">Explore my work <ArrowDown size={18} aria-hidden="true" /></a>
            <a className="identity-hero__contact" href="#contact">Let’s talk <ArrowUpRight size={18} aria-hidden="true" /></a>
          </div>
        </div>
        <div className="intro-film">
          <HeroMedia src={identity.introVideo} mobileSrc="/assets/media/sultan-introduction-mobile.mp4" poster="/assets/media/sultan-introduction-poster.webp" />
          <div className="intro-film__caption"><span>A little of my world.</span><span>Makkah, Saudi Arabia</span></div>
        </div>
        <div className="identity-hero__foot">
          <p>From the first idea to the working system.</p>
          <SocialLinks />
        </div>
      </div>
    </section>
  );
}
