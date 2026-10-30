import { ArrowDown, ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { AssistantButton } from "./assistant-launcher";
import { GateMark } from "./gate-mark";
import { HeroRun } from "./hero-run";
import { LiveClock } from "./live-clock";
import { MeetSultan } from "./meet-sultan";
import { SocialLinks } from "./social-links";
import { SpecStrip } from "./spec-strip";
import { VisitorNote } from "./visitor-note";

// The headline waits for your yes: the words "check with you" carry a dashed gate underline that the run
// card beside it turns solid when the visitor approves. The H1 is real text from first paint and the
// largest thing on screen, so it stays the LCP element; nothing in the hero loops or scrambles letters.
function Headline({ text, highlight }: { text: string; highlight: string }) {
  const at = text.indexOf(highlight);
  if (at < 0) return <h1 id="hero-title">{text}</h1>;
  return (
    <h1 id="hero-title">
      {text.slice(0, at)}
      <em className="gate-phrase">{highlight}<GateMark /></em>
      {text.slice(at + highlight.length)}
    </h1>
  );
}

export function Hero({ locale = "en" }: { locale?: Locale }) {
  const { identity, ui } = getContent(locale);

  return (
    <section id="home" className="identity-hero" aria-labelledby="hero-title">
      <div className="page-shell identity-hero__layout">
        <div className="identity-hero__intro">
          <div className="hero-eyebrow">
            {locale === "en" ? (
              <p className="identity-hero__name">
                Sultan Alfaifi · <span className="identity-hero__arabic" lang="ar" dir="rtl">{identity.arabicName}</span>
              </p>
            ) : (
              <p className="identity-hero__name">
                {identity.name} · <span className="identity-hero__arabic" lang="en" dir="ltr">Sultan Alfaifi</span>
              </p>
            )}
            <span className="hero-eyebrow__rule" aria-hidden="true" />
            <p className="hero-status"><span className="hero-status__pulse" aria-hidden="true" />{identity.openTo}</p>
          </div>
          <Headline text={identity.headline} highlight={ui.hero.highlight} />
        </div>
        {/* The source order is the phone's order, so focus moves the way the screen reads: the run card
            straight after the headline, then the actions, then the portrait. Wide screens put the portrait
            and the card in the right-hand column on explicit grid lines (signature.css). */}
        <HeroRun locale={locale} />
        <div className="identity-hero__body">
          <p className="identity-hero__summary">{identity.summary}</p>
          <div className="identity-hero__actions">
            {/* Both versions are in the HTML; the visitor's choice (set before first paint) shows one. */}
            <a className="button hero-primary" href="#work" data-magnetic data-visitor-hide="hiring">{ui.hero.explore} <ArrowDown size={18} aria-hidden="true" /></a>
            <a className="button hero-primary" href="#cv" data-magnetic data-visitor-only="hiring">{ui.hero.getCv} <ArrowDown size={18} aria-hidden="true" /></a>
            <AssistantButton locale={locale} label={ui.hero.ask} />
            <a className="identity-hero__contact" href="#contact" data-magnetic data-visitor-hide="collaborate">{ui.hero.talk} <ArrowUpRight size={18} aria-hidden="true" /></a>
            <a className="identity-hero__contact" href="#contact" data-magnetic data-visitor-only="collaborate">{ui.hero.talkIdea} <ArrowUpRight size={18} aria-hidden="true" /></a>
            <VisitorNote locale={locale} />
          </div>
        </div>
        <MeetSultan locale={locale} />
        <SpecStrip locale={locale} />
        <div className="identity-hero__foot">
          <LiveClock place={`${identity.currently} · ${ui.hero.clockCity}`} zone={ui.hero.zone} zoneTitle={ui.hero.zoneTitle} />
          <SocialLinks locale={locale} />
        </div>
      </div>
    </section>
  );
}
