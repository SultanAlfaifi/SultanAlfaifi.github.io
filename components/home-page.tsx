import type { Locale } from "@/data/i18n";
import { getContent } from "@/data/i18n";
import { AboutSection } from "./about-section";
import { AchievementsSection } from "./achievements-section";
import { AssistantLauncher } from "./assistant-launcher";
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
import { JourneyTimeline } from "./journey-timeline";
import { KineticBand } from "./kinetic-band";
import { Navbar } from "./navbar";
import { OrganizationRail } from "./organization-rail";
import { PersonalOrder } from "./personal-order";
import { ProgramsSection } from "./programs-section";
import { ProjectsSection } from "./projects-section";
import { RecommendationsSection } from "./recommendations-section";
import { RuntimeSection } from "./runtime-section";
import { SecretsTracker } from "./secrets-tracker";
import { SkillsSection } from "./skills-section";
import { WelcomeScreen } from "./welcome-screen";

export function HomePage({ locale = "en" }: { locale?: Locale }) {
  const { dir, ui } = getContent(locale);
  return (
    <div className="locale-root" lang={locale} dir={dir}>
      <div className="scroll-progress" aria-hidden="true" />
      <a className="skip-link" href="#main-content">
        {ui.skip}
      </a>
      <Navbar locale={locale} />
      <main id="main-content">
        <Hero locale={locale} />
        {/* The usual order; PersonalOrder rearranges it for visitors who said why they came. */}
        <PersonalOrder
          sections={[
            { id: "work", node: <ProjectsSection locale={locale} /> },
            { id: "band", node: <KineticBand locale={locale} /> },
            { id: "achievements", node: <AchievementsSection locale={locale} /> },
            { id: "about", node: <AboutSection locale={locale} /> },
            { id: "journey", node: <JourneyTimeline locale={locale} /> },
            { id: "runtime", node: <RuntimeSection locale={locale} /> },
            { id: "experience", node: <ExperienceSection locale={locale} /> },
            { id: "organizations", node: <OrganizationRail locale={locale} /> },
            {
              id: "deeper",
              node: (
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
              )
            },
            { id: "recommendations", node: <RecommendationsSection locale={locale} /> },
            { id: "cv", node: <CvSection locale={locale} /> },
            { id: "help", node: <HelpSection locale={locale} /> },
            { id: "contact", node: <ContactSection locale={locale} /> }
          ]}
        />
      </main>
      <Footer locale={locale} />
      <CommandPalette locale={locale} />
      <AssistantLauncher locale={locale} />
      <InteractionLayer />
      <CursorRing />
      <SecretsTracker locale={locale} />
      <WelcomeScreen locale={locale} />
    </div>
  );
}
