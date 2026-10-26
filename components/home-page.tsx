import type { Locale } from "@/data/i18n";
import { getContent } from "@/data/i18n";
import { AboutSection } from "./about-section";
import { AchievementsSection } from "./achievements-section";
import { CommandPalette } from "./command-palette";
import { CommunitySection } from "./community-section";
import { ContactSection } from "./contact-section";
import { CursorRing } from "./cursor-ring";
import { CvSection } from "./cv-section";
import { ExperienceSection } from "./experience-section";
import { Footer } from "./footer";
import { HelpSection } from "./help-section";
import { Hero } from "./hero";
import { IdeasSection } from "./ideas-section";
import { InteractionLayer } from "./interaction-layer";
import { IntroCurtain } from "./intro-curtain";
import { JourneyTimeline } from "./journey-timeline";
import { KineticBand } from "./kinetic-band";
import { Navbar } from "./navbar";
import { OrganizationRail } from "./organization-rail";
import { ProgramsSection } from "./programs-section";
import { ProjectsSection } from "./projects-section";
import { RecommendationsSection } from "./recommendations-section";
import { RuntimeSection } from "./runtime-section";
import { SecretsTracker } from "./secrets-tracker";
import { SkillsSection } from "./skills-section";

export function HomePage({ locale = "en" }: { locale?: Locale }) {
  const { dir, ui } = getContent(locale);
  return (
    <div className="locale-root" lang={locale} dir={dir}>
      <IntroCurtain />
      <div className="scroll-progress" aria-hidden="true" />
      <a className="skip-link" href="#main-content">
        {ui.skip}
      </a>
      <Navbar locale={locale} />
      <main id="main-content">
        <Hero locale={locale} />
        <ProjectsSection locale={locale} />
        <KineticBand locale={locale} />
        <AchievementsSection locale={locale} />
        <AboutSection locale={locale} />
        <JourneyTimeline locale={locale} />
        <RuntimeSection locale={locale} />
        <ExperienceSection locale={locale} />
        <OrganizationRail locale={locale} />
        <div className="page-shell deeper-journey">
          <details>
            <summary><span>{ui.deeper.title}</span><span>{ui.deeper.subtitle} <span className="deeper-journey__plus" aria-hidden="true">+</span></span></summary>
            <div className="deeper-journey__content">
              <SkillsSection locale={locale} />
              <ProgramsSection locale={locale} />
              <CommunitySection locale={locale} />
              <IdeasSection locale={locale} />
            </div>
          </details>
        </div>
        <RecommendationsSection locale={locale} />
        <CvSection locale={locale} />
        <HelpSection locale={locale} />
        <ContactSection locale={locale} />
      </main>
      <Footer locale={locale} />
      <CommandPalette locale={locale} />
      <InteractionLayer />
      <CursorRing />
      <SecretsTracker locale={locale} />
    </div>
  );
}
