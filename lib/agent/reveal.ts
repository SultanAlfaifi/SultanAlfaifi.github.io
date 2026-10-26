import { motionAllowed } from "@/components/motion-preference";

// Scrolls to a page anchor the agent cited or opened, expanding the "Beyond the projects" panel if the
// anchor sits inside it, and briefly outlines the target so the visitor sees where they landed.
export function revealAnchor(id: string, highlight = true) {
  const target = document.getElementById(id);
  if (!target) return false;
  const details = target.closest("details");
  if (details && !details.open) details.open = true;
  target.scrollIntoView({ behavior: motionAllowed() ? "smooth" : "auto", block: "start" });
  if (highlight) {
    target.classList.remove("agent-highlight");
    void target.offsetWidth;
    target.classList.add("agent-highlight");
    window.setTimeout(() => target.classList.remove("agent-highlight"), 3200);
  }
  return true;
}
