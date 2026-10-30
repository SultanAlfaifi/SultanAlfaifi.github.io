import { LANGUAGE_KEY, VISITOR_KEY, VISITORS } from "@/lib/visitor";

// One switch for every scripted effect: the OS preference or the on-page Motion toggle.
export const MOTION_EVENT = "portfolio:motion";
export const PALETTE_EVENT = "portfolio:palette";
export const TOAST_EVENT = "portfolio:toast";
const STORAGE_KEY = "portfolio-motion";

const reducedQuery = () => window.matchMedia("(prefers-reduced-motion: reduce)");

export function motionAllowed() {
  if (typeof window === "undefined") return false;
  return !reducedQuery().matches && document.documentElement.dataset.motion !== "off";
}

export function setMotionEnabled(enabled: boolean) {
  if (enabled) delete document.documentElement.dataset.motion;
  else document.documentElement.dataset.motion = "off";
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Storage can be unavailable in private windows; the toggle still works for this visit.
  }
  window.dispatchEvent(new Event(MOTION_EVENT));
}

export function subscribeMotion(callback: () => void) {
  const query = reducedQuery();
  query.addEventListener("change", callback);
  window.addEventListener(MOTION_EVENT, callback);
  return () => {
    query.removeEventListener("change", callback);
    window.removeEventListener(MOTION_EVENT, callback);
  };
}

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }));
}

export function openPalette() {
  window.dispatchEvent(new Event(PALETTE_EVENT));
}

// Runs before first paint, in this order:
// 1. A first visit to / from a device set to Arabic goes to /ar/, unless the visitor ever picked a
//    language with a language link. Crawlers never redirect.
// 2. A returning visitor's choice from the welcome screen marks <html>, so their page shows at once.
// 3. A first visit to either home page shows the welcome screen, except for crawlers and for links to
//    a specific place (#section or a CV link). `?welcome` always shows it, for previewing.
// 4. A saved "off" never flashes motion, and the intro plays once per visit when the welcome doesn't.
export const motionBootScript = `try{var d=document.documentElement,p=location.pathname,s=localStorage,n=navigator,q=new URLSearchParams(location.search),bot=n.webdriver||/bot|crawl|spider|slurp|lighthouse|headless/i.test(n.userAgent),home=p==="/"||p==="/index.html",away=false;if(p.indexOf("/ar")===0){d.lang="ar";d.dir="rtl"}if(home&&!bot&&!s.getItem("${LANGUAGE_KEY}")&&/^ar/i.test((n.languages&&n.languages[0])||n.language||"")){away=true;location.replace("/ar/"+location.search+location.hash)}var v=s.getItem("${VISITOR_KEY}");if(${JSON.stringify(VISITORS)}.indexOf(v)>=0)d.dataset.visitor=v;var w=!away&&(home||p==="/ar/"||p==="/ar")&&(q.has("welcome")||(!v&&!bot&&!location.hash&&!q.has("cv")));if(w)d.dataset.welcome="show";if(s.getItem("${STORAGE_KEY}")==="off")d.dataset.motion="off";else if(!w&&!away&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!sessionStorage.getItem("portfolio-intro")){sessionStorage.setItem("portfolio-intro","1");d.dataset.intro="play"}}catch(e){}`;
