import * as base from "./portfolio";
import * as ar from "./portfolio-ar";
import { ui } from "./ui";

export type Locale = "en" | "ar";
export const locales: Locale[] = ["en", "ar"];

function mergeByIndex<T>(items: T[], overrides: Partial<T>[]): T[] {
  return items.map((item, index) => ({ ...item, ...overrides[index] }));
}

const english = {
  locale: "en" as Locale,
  dir: "ltr" as "ltr" | "rtl",
  path: "/",
  identity: base.identity,
  about: base.about,
  navigation: base.navigation,
  socialLinks: base.socialLinks,
  projects: base.projects,
  experience: base.experience,
  skillGroups: base.skillGroups,
  achievements: base.achievements,
  proofMetrics: base.proofMetrics,
  programs: base.programs,
  certifications: base.certifications,
  community: base.community,
  recommendations: base.recommendations,
  content: base.content,
  journey: base.journey,
  helpPaths: base.helpPaths,
  principles: base.principles,
  organizations: base.organizations,
  seo: base.seo,
  ui: ui.en
};

export type PortfolioContent = typeof english;

const arabic: PortfolioContent = {
  locale: "ar",
  dir: "rtl",
  path: "/ar/",
  identity: { ...base.identity, ...ar.identity },
  about: { ...base.about, ...ar.about },
  navigation: ar.navigation,
  socialLinks: mergeByIndex(base.socialLinks, ar.socialLinks),
  projects: base.projects.map((project) => ({ ...project, ...ar.projects[project.slug] })),
  experience: mergeByIndex(base.experience, ar.experience),
  skillGroups: ar.skillGroups,
  achievements: mergeByIndex(base.achievements, ar.achievements),
  proofMetrics: mergeByIndex(base.proofMetrics, ar.proofMetrics),
  programs: mergeByIndex(base.programs, ar.programs),
  certifications: mergeByIndex(base.certifications, ar.certifications),
  community: {
    ...base.community,
    metrics: ar.community.metrics,
    workshops: mergeByIndex(base.community.workshops, ar.community.workshops)
  },
  recommendations: mergeByIndex(base.recommendations, ar.recommendations),
  content: { ...base.content, ...ar.content },
  journey: ar.journey,
  helpPaths: mergeByIndex(base.helpPaths, ar.helpPaths),
  principles: ar.principles,
  organizations: mergeByIndex(base.organizations, ar.organizations),
  seo: { ...base.seo, ...ar.seo },
  ui: ui.ar
};

export function getContent(locale: Locale = "en"): PortfolioContent {
  return locale === "ar" ? arabic : english;
}

// For event-time strings (toasts) outside React props: the boot script sets <html lang> per route.
export function currentLocale(): Locale {
  return typeof document !== "undefined" && document.documentElement.lang === "ar" ? "ar" : "en";
}
