import { motionAllowed } from "@/components/motion-preference";

// Opens every fold around a target, the target itself included when it is a <details> (the "Beyond the
// projects" rows carry their section ids). The page keeps folds one level deep; this opens them all anyway,
// so a nested fold can never hide what the assistant or the palette points at.
export function openFolds(target: Element) {
  for (let d = target.closest("details"); d; d = d.parentElement?.closest("details") ?? null) d.open = true;
}

function inClosedFold(target: Element) {
  for (let d = target.closest("details"); d; d = d.parentElement?.closest("details") ?? null) if (!d.open) return true;
  return false;
}

// Scrolls to a page anchor the agent cited or opened, opening any fold it sits in, and briefly outlines the
// target so the visitor sees where they landed.
export function revealAnchor(id: string, highlight = true) {
  const target = document.getElementById(id);
  if (!target) return false;
  openFolds(target);
  target.scrollIntoView({ behavior: motionAllowed() ? "smooth" : "auto", block: "start" });
  if (highlight) {
    target.classList.remove("agent-highlight");
    void target.offsetWidth;
    target.classList.add("agent-highlight");
    window.setTimeout(() => target.classList.remove("agent-highlight"), 3200);
  }
  return true;
}

const SPOT = "agent-spot";
const flat = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

// The smallest element inside the block that holds the quoted words. A figure and its label often sit
// in separate elements ("1,600" over "active users"), so the words count one by one when the phrase
// itself isn't there; most of them have to be.
function findWords(id: string, quote: string) {
  const root = document.getElementById(id);
  const wanted = flat(quote);
  if (!root || wanted.length < 2) return null;
  const words = wanted.split(" ").filter((word) => word.length > 1);
  let best: HTMLElement | null = null;
  let bestScore = 0;
  let bestLength = Infinity;
  for (const element of root.querySelectorAll<HTMLElement>("h3, h4, p, li, dt, dd, dl > div, blockquote, figcaption, span, strong, a")) {
    const own = flat(element.innerText || element.textContent || "");
    if (!own) continue;
    const score = own.includes(wanted) ? words.length + 1 : words.filter((word) => own.includes(word)).length;
    if (score > bestScore || (score === bestScore && own.length < bestLength)) {
      best = element;
      bestScore = score;
      bestLength = own.length;
    }
  }
  return bestScore >= Math.max(1, Math.ceil(words.length * 0.6)) ? best : null;
}

// Centres the lit words in the part of the screen the visitor can actually see: below the navigation,
// and on a phone above the companion, which takes the bottom half.
function scrollToSee(element: HTMLElement) {
  const top = 88;
  const bottom = window.matchMedia("(max-width: 760px)").matches ? window.innerHeight * 0.5 : window.innerHeight;
  const rect = element.getBoundingClientRect();
  const offset = top + Math.max(0, (bottom - top - rect.height) / 2);
  window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - offset), behavior: motionAllowed() ? "smooth" : "auto" });
}

export function clearSpotlight() {
  document.querySelectorAll(`.${SPOT}`).forEach((element) => element.classList.remove(SPOT));
}

// Takes the visitor to what the agent is pointing at. With a quote, the exact words light up and stay
// lit until the agent points somewhere else; without one, or when the words aren't on the page as
// written, the whole block gets the usual brief outline.
export function showOnPage(id: string, quote?: string | null) {
  clearSpotlight();
  const spot = quote ? findWords(id, quote) : null;
  if (!spot) return revealAnchor(id);
  openFolds(spot);
  spot.classList.add(SPOT);
  scrollToSee(spot);
  return true;
}

// A reload, or a step back or forward, puts the visitor back where they were; the page must not pull them
// to the hash again.
function restoredVisit() {
  try {
    const entry = window.performance?.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
    return entry?.type === "reload" || entry?.type === "back_forward";
  } catch {
    return false;
  }
}

// A shared link to a folded place (/ar/#skills, or #project-danna inside the smaller builds) opens its fold
// and lands on it. Runs after hydration and on every hash change; any other hash is left to the browser.
// On a fresh load (`settled`), a place that is not folded is landed on once more: the browser jumped before
// hydration, and the page may have moved since (a visitor's own order, a card's «كيف بنيته» button). On a
// reload or a history step the browser has already restored the visitor's own place: a folded target only
// opens, where it is, and nothing scrolls.
export function revealFoldedHash(settled = false) {
  let id = "";
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return false;
  }
  const target = id ? document.getElementById(id) : null;
  if (!target) return false;
  if (settled && restoredVisit()) {
    if (!inClosedFold(target)) return false;
    openFolds(target);
    return true;
  }
  if (inClosedFold(target)) return revealAnchor(id, false);
  if (!settled) return false;
  target.scrollIntoView({ behavior: "auto", block: "start" });
  return true;
}
