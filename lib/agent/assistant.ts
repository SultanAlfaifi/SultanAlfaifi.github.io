// The console lives in the runtime section; the hero button, the floating launcher and the command
// palette ask it to open as a panel through this event instead of scrolling the visitor away.
export const OPEN_ASSISTANT = "assistant:open";

export function openAssistant() {
  window.dispatchEvent(new Event(OPEN_ASSISTANT));
}

// The agent asks the CV section for a CV fitted to a role. The section fills in its own form and runs
// its AI match, so the visitor sees the CV built where they can download it.
export const TAILOR_CV = "assistant:tailor-cv";
export type TailorRequest = { role: string; company: string; description: string };

export function requestTailoredCv(detail: TailorRequest) {
  window.dispatchEvent(new CustomEvent<TailorRequest>(TAILOR_CV, { detail }));
}
