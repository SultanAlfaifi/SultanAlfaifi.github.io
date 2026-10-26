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

// Runs before first paint: a saved "off" never flashes motion, and the intro plays once per visit.
export const motionBootScript = `try{var d=document.documentElement;if(location.pathname.indexOf("/ar")===0){d.lang="ar";d.dir="rtl"}if(localStorage.getItem("${STORAGE_KEY}")==="off")d.dataset.motion="off";else if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&!sessionStorage.getItem("portfolio-intro")){sessionStorage.setItem("portfolio-intro","1");d.dataset.intro="play"}}catch(e){}`;

export function introPlaying() {
  return typeof document !== "undefined" && document.documentElement.dataset.intro === "play";
}
