import type { VisitorProfile } from "./intro";

// Who is visiting, as they told the welcome screen, and which language they chose. Both live in
// localStorage; the boot script in <head> reads them before first paint, so a returning visitor never
// sees the default page flash before their own.
export type Visitor = "hiring" | "collaborate" | "browse" | "skip";
export const VISITORS: Visitor[] = ["hiring", "collaborate", "browse", "skip"];
export const VISITOR_KEY = "portfolio-visitor";
export const LANGUAGE_KEY = "portfolio-lang";
// The card the visitor's AI wrote about them, as the site read it. Only in this browser.
export const PROFILE_KEY = "portfolio-profile";
export const VISITOR_EVENT = "portfolio:visitor";
export const WELCOME_EVENT = "portfolio:welcome";

// A hiring visitor can hand the CV section a company and a role from the welcome screen.
export type VisitorDetail = { visitor: Visitor; company?: string; role?: string; profile?: VisitorProfile };

// Skipping, or choosing again, forgets the previous card.
let profile: VisitorProfile | null = null;

export function saveVisitor(detail: VisitorDetail) {
  profile = detail.profile ?? null;
  try {
    window.localStorage.setItem(VISITOR_KEY, detail.visitor);
    if (profile) window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    else window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    // Without storage the choice still applies to this page view.
  }
  profileRaw = undefined;
  document.documentElement.dataset.visitor = detail.visitor;
  window.dispatchEvent(new CustomEvent<VisitorDetail>(VISITOR_EVENT, { detail }));
}

// A fuller reading of the card that arrived after the visitor came in (the agent was slow). It replaces the
// one kept, and the page fills in around them; the sections stay in the order they entered with, since the
// event carries no company or role and the visitor kind is unchanged.
export function storeProfile(next: VisitorProfile) {
  profile = next;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  } catch {
    // Without storage the fuller card still applies to this page view.
  }
  profileRaw = undefined;
  const visitor = document.documentElement.dataset.visitor as Visitor | undefined;
  window.dispatchEvent(new CustomEvent<VisitorDetail>(VISITOR_EVENT, { detail: { visitor: visitor ?? next.intent, profile: next } }));
}

// The same object for the same stored text, so React's external-store hook doesn't loop.
let profileRaw: string | null | undefined;
export function readProfile(): VisitorProfile | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PROFILE_KEY);
  } catch {
    return profile;
  }
  if (raw === profileRaw) return profile;
  profileRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as VisitorProfile) : null;
    // A card kept before reasons and help existed still reads, with both empty.
    profile = parsed && typeof parsed === "object" && Array.isArray(parsed.projects)
      ? { ...parsed, reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [], help: Array.isArray(parsed.help) ? parsed.help : [] }
      : null;
  } catch {
    profile = null;
  }
  return profile;
}

// Called by every language link, so the device-language redirect never overrides a choice.
export function rememberLanguage(language: string) {
  try {
    window.localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // The link still works; the next visit to / just follows the device language again.
  }
}

// Marks <html> while the welcome screen is up: the page behind it stops scrolling.
export function markWelcome(shown: boolean) {
  if (shown) document.documentElement.dataset.welcome = "show";
  else delete document.documentElement.dataset.welcome;
}

// Marks <html> while the welcome orb flies into the hero: the hero's own orb stays hidden until it lands.
export function markLanding(on: boolean) {
  if (on) document.documentElement.dataset.landing = "";
  else delete document.documentElement.dataset.landing;
}

export function openWelcome() {
  window.dispatchEvent(new Event(WELCOME_EVENT));
}
