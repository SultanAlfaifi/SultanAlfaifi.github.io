// Every place on the page the agent may cite or open. Both the knowledge build and the console
// read this list, so a citation the console renders is always one the page can scroll to.
import type { PortfolioContent } from "../../data/i18n";
import type { AnchorInfo } from "./types";

type SectionKey = "work" | "achievements" | "about" | "timeline" | "runtime" | "experience" | "organizations" | "skills" | "journey" | "community" | "ideas" | "recommendations" | "help" | "cv" | "contact";

const SECTION_ORDER: SectionKey[] = ["work", "achievements", "about", "timeline", "runtime", "experience", "organizations", "skills", "journey", "community", "ideas", "recommendations", "help", "cv", "contact"];
const COLLAPSED = new Set<SectionKey>(["skills", "journey", "community", "ideas"]);

function sectionLabel(key: SectionKey, { ui }: PortfolioContent) {
  const fromPalette = new Map(ui.palette.sections.map(([label, href]) => [href.slice(1), label]));
  const own: Record<SectionKey, string | undefined> = {
    work: fromPalette.get("work"),
    achievements: fromPalette.get("achievements"),
    about: fromPalette.get("about"),
    timeline: fromPalette.get("timeline"),
    runtime: ui.runtime.principles,
    experience: fromPalette.get("experience"),
    organizations: ui.organizations.title,
    skills: ui.skills.title,
    journey: ui.programs.title,
    community: ui.community.title,
    ideas: ui.ideas.title,
    recommendations: fromPalette.get("recommendations"),
    help: fromPalette.get("help"),
    cv: ui.cv.title,
    contact: fromPalette.get("contact")
  };
  const label = own[key];
  if (!label) throw new Error(`No label for section #${key}`);
  return label;
}

export function buildAnchors(en: PortfolioContent, ar: PortfolioContent): AnchorInfo[] {
  const sections = SECTION_ORDER.map((key): AnchorInfo => ({
    id: key,
    kind: "section",
    label: { en: sectionLabel(key, en), ar: sectionLabel(key, ar) },
    collapsed: COLLAPSED.has(key) || undefined
  }));
  const projects = en.projects.filter((project) => project.enabled).map((project): AnchorInfo => {
    const arabic = ar.projects.find((item) => item.slug === project.slug);
    return { id: `project-${project.slug}`, kind: "project", label: { en: project.title, ar: arabic?.title ?? project.title } };
  });
  return [...sections, ...projects];
}

// External links the agent may repeat. Anything else in an answer is shown as plain text.
export function collectUrls(content: PortfolioContent): string[] {
  const urls = new Set<string>([content.seo.siteUrl.replace(/\/$/, "") + "/", `${content.seo.siteUrl.replace(/\/$/, "")}/ar/`]);
  const add = (value: string | null | undefined) => {
    if (value && /^https:\/\//.test(value)) urls.add(value);
  };
  content.socialLinks.forEach((link) => add(link.href));
  content.projects.filter((project) => project.enabled).forEach((project) => {
    add(project.repository);
    add(project.liveDemo);
    add(project.primaryAction?.href);
  });
  content.organizations.filter((organization) => organization.visible).forEach((organization) => add(organization.url));
  content.programs.forEach((program) => add(program.credentialUrl));
  content.certifications.forEach((certification) => add(certification.credentialUrl));
  content.community.workshops.forEach((workshop) => add(workshop.organizationUrl));
  content.recommendations.forEach((recommendation) => add(recommendation.publicUrl));
  return [...urls].sort();
}
