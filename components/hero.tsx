import { ArrowDown, ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { AgentField } from "./agent-field";
import { AssistantButton } from "./assistant-launcher";
import { PaletteTrigger } from "./command-palette";
import { DecodeText } from "./decode-text";
import { HeroMedia } from "./hero-media";
import { LiveClock } from "./live-clock";
import { SocialLinks } from "./social-links";

export function Hero({ locale = "en" }: { locale?: Locale }) {
  const { achievements, identity, projects, ui } = getContent(locale);
  const fieldLabels = [
    ...projects.filter((project) => project.enabled).slice(0, 8).map((project) => (locale === "en" ? project.title.toLowerCase() : project.title)),
    ...ui.hero.concepts
  ];
  const tickerItems = [
    ...achievements.filter((item) => item.enabled).map((item) => `${item.signal} · ${item.ticker ?? item.title}`),
    ...ui.hero.ticker
  ];

  return (
    <section id="home" className="identity-hero signature-hero" aria-labelledby="hero-title" data-cursor={ui.hero.cursor}>
      <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
      <AgentField labels={fieldLabels} />
      <div className="page-shell identity-hero__layout">
        <div className="identity-hero__copy">
          <p className="hero-status"><span className="hero-status__pulse" aria-hidden="true" />{identity.openTo}</p>
          {locale === "en" ? (
            <p className="identity-hero__name">
              Sultan Alfaifi <span className="identity-hero__arabic" lang="ar" dir="rtl">{identity.arabicName}</span>
            </p>
          ) : (
            <p className="identity-hero__name">
              {identity.name} <span className="identity-hero__arabic" lang="en" dir="ltr">Sultan Alfaifi</span>
            </p>
          )}
          <h1 id="hero-title"><DecodeText text={identity.headline} highlight={ui.hero.highlight} /></h1>
          <p className="identity-hero__summary">{identity.summary}</p>
          <div className="identity-hero__actions">
            <a className="button button--signal" href="#work" data-magnetic>{ui.hero.explore} <ArrowDown size={18} aria-hidden="true" /></a>
            <AssistantButton locale={locale} />
            <a className="identity-hero__contact" href="#contact" data-magnetic>{ui.hero.talk} <ArrowUpRight size={18} aria-hidden="true" /></a>
            <p className="identity-hero__palette-hint">
              <PaletteTrigger locale={locale} /> <span>{ui.hero.paletteHint}</span>
            </p>
          </div>
        </div>
        <div className="intro-film" data-tilt>
          <HeroMedia src={identity.introVideo} mobileSrc="/assets/media/sultan-introduction-mobile.mp4" poster="/assets/media/sultan-introduction-poster.webp" locale={locale} />
          <div className="intro-film__caption"><span>{ui.hero.filmCaption}</span><span>{identity.location}</span></div>
        </div>
        <div className="identity-hero__foot">
          <LiveClock place={`${identity.currently} · ${ui.hero.clockCity}`} zone={ui.hero.zone} zoneTitle={ui.hero.zoneTitle} />
          <SocialLinks locale={locale} />
        </div>
      </div>
      <div className="hero-ticker" aria-label={ui.hero.highlights} dir="ltr">
        <div className="hero-ticker__track">
          <ul className="hero-ticker__group">
            {tickerItems.map((item) => <li key={item} dir="auto">{item}</li>)}
          </ul>
          <ul className="hero-ticker__group" aria-hidden="true">
            {tickerItems.map((item) => <li key={item} dir="auto">{item}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
