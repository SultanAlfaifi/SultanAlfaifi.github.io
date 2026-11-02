import type { ReactNode } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { AssistantButton } from "./assistant-launcher";
import { GateMark } from "./gate-mark";
import { HeroOrb } from "./hero-orb";
import { HeroRun } from "./hero-run";
import { LiveClock } from "./live-clock";
import { MeetSultan } from "./meet-sultan";
import { SocialLinks } from "./social-links";
import { SpecStrip } from "./spec-strip";
import { VisitorNote } from "./visitor-note";

// The gate phrase inside its line: the words carry the gate line, which the run card turns solid when
// the visitor approves (data-gate on the hero) and dims when they hold.
function withGate(line: string, highlight: string): ReactNode {
  const at = line.indexOf(highlight);
  if (at < 0) return line;
  return (
    <>
      {line.slice(0, at)}
      <em className="gate-phrase">{highlight}<GateMark /></em>
      {line.slice(at + highlight.length)}
    </>
  );
}

// The headline is real text from first paint, split only into its two lines so each can arrive on its
// own (hero.css). Nothing splits words or letters, so Arabic keeps its joins and the H1 reads as one
// sentence; its text content is exactly the headline in the data.
function Headline({ text, highlight, lineTwo }: { text: string; highlight: string; lineTwo: string }) {
  const split = text.indexOf(lineTwo);
  const lines = split > 0 ? [text.slice(0, split), text.slice(split)] : [text];
  return (
    <h1 id="hero-title" className="hero-title">
      {lines.map((line, index) => (
        <span key={index} className={`hero-line hero-line--${index + 1}`}>{withGate(line, highlight)}</span>
      ))}
    </h1>
  );
}

// "Full-Stack" never breaks at its hyphen, and stays left to right inside an Arabic line.
function Role({ text }: { text: string }) {
  const word = "Full-Stack";
  const at = text.indexOf(word);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <bdi dir="ltr" className="nowrap">{word}</bdi>
      {text.slice(at + word.length)}
    </>
  );
}

// The first screen is one centred stage: who and where, the headline, the living orb under it, the run
// card resting on the orb's lower edge, then the ways in. The source order is the reading order on every
// screen, so focus moves the way the page reads. Below the fold: the summary, the four numbers, the film
// and the links. On first view the elements arrive, then the text (hero.css, "The entrance").
export function Hero({ locale = "en" }: { locale?: Locale }) {
  const { identity, ui } = getContent(locale);

  return (
    <section id="home" className="identity-hero" aria-labelledby="hero-title">
      <div className="page-shell identity-hero__layout">
        <div className="identity-hero__intro">
          <div className="hero-status">
            <span className="hero-status__live"><span className="hero-status__pulse" aria-hidden="true" />{identity.openTo}</span>
            <span className="hero-status__sep" aria-hidden="true" />
            <LiveClock place={`${identity.currently} · ${ui.hero.clockCity}`} zone={ui.hero.zone} zoneTitle={ui.hero.zoneTitle} />
          </div>
          <p className="hero-who">
            <b className="hero-who__name">{identity.name}</b>
            <span className="hero-who__dot" aria-hidden="true">·</span>
            <span className="hero-who__role"><Role text={identity.role} /></span>
          </p>
          <Headline text={identity.headline} highlight={ui.hero.highlight} lineTwo={ui.hero.lineTwo} />
        </div>
        {/* The orb is light, not content: it sits under the headline and the card, and says nothing. */}
        <div className="hero-stage" aria-hidden="true">
          <HeroOrb />
        </div>
        <HeroRun locale={locale} />
        <div className="identity-hero__actions">
          {/* Both versions are in the HTML; the visitor's choice (set before first paint) shows one. */}
          <a className="li-btn li-btn--primary hero-primary" href="#work" data-magnetic data-visitor-hide="hiring">{ui.hero.explore} <ArrowDown size={18} aria-hidden="true" /></a>
          <a className="li-btn li-btn--primary hero-primary" href="#cv" data-magnetic data-visitor-only="hiring">{ui.hero.getCv} <ArrowDown size={18} aria-hidden="true" /></a>
          <AssistantButton locale={locale} label={ui.hero.ask} />
          <a className="identity-hero__contact" href="#contact" data-magnetic data-visitor-hide="collaborate">{ui.hero.talk} <ArrowUpRight size={18} aria-hidden="true" /></a>
          <a className="identity-hero__contact" href="#contact" data-magnetic data-visitor-only="collaborate">{ui.hero.talkIdea} <ArrowUpRight size={18} aria-hidden="true" /></a>
          <VisitorNote locale={locale} />
        </div>
        <div className="identity-hero__more">
          <p className="identity-hero__summary">{identity.summary}</p>
          <SpecStrip locale={locale} />
          <div className="identity-hero__foot">
            <MeetSultan locale={locale} />
            <SocialLinks locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}
