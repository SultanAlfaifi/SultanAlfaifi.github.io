import { currentLocale, getContent } from "@/data/i18n";
import { toast } from "./motion-preference";

// A small exploration game: hidden interactions unlock "secrets", remembered per visitor.
export const SECRET_IDS = ["palette", "gravity", "sudo", "policy", "arabic", "konami"] as const;
export type SecretId = (typeof SECRET_IDS)[number];

export function secretCopy(id: string, locale = currentLocale()) {
  return getContent(locale).ui.secrets.items[id];
}

export const SECRET_EVENT = "portfolio:secret";
const STORAGE_KEY = "portfolio-secrets";
let memory: string[] = [];
let snapshot = "";

export function foundSecrets(): string[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (Array.isArray(stored)) memory = stored.filter((id) => (SECRET_IDS as readonly string[]).includes(id));
  } catch {
    // Private windows may block storage; the in-memory list keeps the game playable.
  }
  return memory;
}

// useSyncExternalStore needs a stable value between changes.
export function secretsSnapshot() {
  const next = foundSecrets().join(",");
  if (next !== snapshot) snapshot = next;
  return snapshot;
}

export function subscribeSecrets(callback: () => void) {
  window.addEventListener(SECRET_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SECRET_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function unlockSecret(id: SecretId) {
  const found = foundSecrets();
  if (found.includes(id)) return;
  memory = [...found, id];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Keep the in-memory progress.
  }
  const copy = getContent(currentLocale()).ui.secrets;
  const complete = memory.length === SECRET_IDS.length;
  toast(complete ? copy.complete : copy.found(secretCopy(id).title, memory.length, SECRET_IDS.length));
  window.dispatchEvent(new CustomEvent(SECRET_EVENT, { detail: { id, complete } }));
}
