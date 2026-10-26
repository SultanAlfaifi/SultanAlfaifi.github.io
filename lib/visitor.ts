// Who is visiting, as they told the welcome screen, and which language they chose. Both live in
// localStorage; the boot script in <head> reads them before first paint, so a returning visitor never
// sees the default page flash before their own.
export type Visitor = "hiring" | "collaborate" | "browse" | "skip";
export const VISITORS: Visitor[] = ["hiring", "collaborate", "browse", "skip"];
export const VISITOR_KEY = "portfolio-visitor";
export const LANGUAGE_KEY = "portfolio-lang";
export const VISITOR_EVENT = "portfolio:visitor";
export const WELCOME_EVENT = "portfolio:welcome";

// A hiring visitor can hand the CV section a company and a role from the welcome screen.
export type VisitorDetail = { visitor: Visitor; company?: string; role?: string };

export function saveVisitor(detail: VisitorDetail) {
  try {
    window.localStorage.setItem(VISITOR_KEY, detail.visitor);
  } catch {
    // Without storage the choice still applies to this page view.
  }
  document.documentElement.dataset.visitor = detail.visitor;
  window.dispatchEvent(new CustomEvent<VisitorDetail>(VISITOR_EVENT, { detail }));
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

export function openWelcome() {
  window.dispatchEvent(new Event(WELCOME_EVENT));
}
