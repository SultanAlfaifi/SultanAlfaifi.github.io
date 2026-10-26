// The console lives in the runtime section; the hero button, the floating launcher and the command
// palette ask it to open as a panel through this event instead of scrolling the visitor away.
export const OPEN_ASSISTANT = "assistant:open";

export function openAssistant() {
  window.dispatchEvent(new Event(OPEN_ASSISTANT));
}
