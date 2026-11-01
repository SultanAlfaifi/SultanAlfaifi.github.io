import type { Locale } from "@/data/i18n";
import { getContent } from "@/data/i18n";
import { AboutSection } from "./about-section";
import { AchievementsSection } from "./achievements-section";
import { AssistantLauncher } from "./assistant-launcher";
import { CommandPalette } from "./command-palette";
import { ContactSection } from "./contact-section";
import { CursorRing } from "./cursor-ring";
import { CvSection } from "./cv-section";
import { DeeperSection } from "./deeper-section";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { InteractionLayer } from "./interaction-layer";
import { KineticBand } from "./kinetic-band";
import { Navbar } from "./navbar";
import { PersonalOrder } from "./personal-order";
import { ProjectsSection } from "./projects-section";
import { RuntimeSection } from "./runtime-section";
import { SecretsTracker } from "./secrets-tracker";
import { WelcomeScreen } from "./welcome-screen";

// After the hero, eight blocks: six numbered chapters (.li-chapter, counted by CSS in DOM order), the band
// between Work and the AI chapter, and the "Beyond the projects" appendix. Each chapter holds what belongs
// with it: About holds the Now card (#experience), Recognition holds the recommendations
// (#recommendations), Contact holds the help paths (#help), and the appendix is six sibling folds.
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
            { id: "runtime", node: <RuntimeSection locale={locale} /> },
            { id: "about", node: <AboutSection locale={locale} /> },
            { id: "achievements", node: <AchievementsSection locale={locale} /> },
            { id: "cv", node: <CvSection locale={locale} /> },
            { id: "deeper", node: <DeeperSection locale={locale} /> },
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
