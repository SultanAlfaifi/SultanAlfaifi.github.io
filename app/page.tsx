import { AboutSection } from "@/components/about-section";
import { AchievementsSection } from "@/components/achievements-section";
import { CommunitySection } from "@/components/community-section";
import { ContactSection } from "@/components/contact-section";
import { ExperienceSection } from "@/components/experience-section";
import { ExpertiseSection } from "@/components/expertise-section";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { IdeasSection } from "@/components/ideas-section";
import { Navbar } from "@/components/navbar";
import { OrganizationRail } from "@/components/organization-rail";
import { ProgramsSection } from "@/components/programs-section";
import { ProjectsSection } from "@/components/projects-section";
import { RecommendationsSection } from "@/components/recommendations-section";
import { SkillsSection } from "@/components/skills-section";

export default function Home() {
  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <AboutSection />
        <OrganizationRail />
        <ExpertiseSection />
        <ProjectsSection />
        <ExperienceSection />
        <SkillsSection />
        <AchievementsSection />
        <ProgramsSection />
        <CommunitySection />
        <RecommendationsSection />
        <IdeasSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
