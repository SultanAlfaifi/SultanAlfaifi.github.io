import { getContent, type Locale } from "@/data/i18n";
import { getPortfolioAsset } from "@/data/portfolio";
import { SallaExperienceStory } from "./salla-experience-story";

// The Now card inside About (components/about-section.tsx, FINAL-SPEC 6.4). It keeps the #experience anchor
// that the hero's spec strip, the palette and the assistant point at.
export function ExperienceSection({ locale = "en" }: { locale?: Locale }) {
  const { experience, ui } = getContent(locale);
  const job = experience.find((item) => item.assetId === "salla") ?? experience[0];
  if (!job) return null;
  const asset = getPortfolioAsset(job.assetId);

  return (
    <article id="experience" className="about__now li-glass li-glass--light" aria-labelledby="experience-title">
      <SallaExperienceStory experience={job} asset={asset} title={ui.experience.title} locale={locale} />
    </article>
  );
}
