"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Lock, Sparkles, Unlock } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { motionAllowed } from "./motion-preference";
import { SECRET_EVENT, SECRET_IDS, secretCopy, secretsSnapshot, subscribeSecrets } from "./secrets";

// The living palette (app/living.css): apricot, rose, iris, glacier and the off-white ink.
const CONFETTI_COLORS = ["#ffb46a", "#ff5c8d", "#8f6bff", "#47c8f5", "#f4f2ee"];

function celebrate() {
  if (!motionAllowed()) return;
  const layer = document.createElement("div");
  layer.className = "confetti";
  layer.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 64; index += 1) {
    const piece = document.createElement("i");
    piece.style.setProperty("--x", `${(Math.random() - 0.5) * 120}vw`);
    piece.style.setProperty("--y", `${-40 - Math.random() * 60}vh`);
    piece.style.setProperty("--r", `${(Math.random() - 0.5) * 1440}deg`);
    piece.style.setProperty("--d", `${900 + Math.random() * 900}ms`);
    piece.style.background = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  window.setTimeout(() => layer.remove(), 2200);
}

export function SecretsTracker({ locale = "en" }: { locale?: Locale }) {
  const copy = getContent(locale).ui.secrets;
  const found = useSyncExternalStore(subscribeSecrets, secretsSnapshot, () => "");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const foundIds = found ? found.split(",") : [];

  useEffect(() => {
    function handleSecret(event: Event) {
      if ((event as CustomEvent<{ complete: boolean }>).detail?.complete) celebrate();
    }
    function handleOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener(SECRET_EVENT, handleSecret);
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener(SECRET_EVENT, handleSecret);
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  if (!foundIds.length) return null;

  return (
    <div ref={rootRef} className={`secrets ${foundIds.length === SECRET_IDS.length ? "is-complete" : ""}`}>
      {open ? (
        <div className="secrets__panel" id="secrets-panel">
          <p className="secrets__title">{copy.title} <span dir="ltr">{foundIds.length}/{SECRET_IDS.length}</span></p>
          <ul>
            {SECRET_IDS.map((id) => {
              const unlocked = foundIds.includes(id);
              const secret = secretCopy(id, locale);
              return (
                <li key={id} className={unlocked ? "is-found" : undefined}>
                  {unlocked ? <Unlock size={14} aria-hidden="true" /> : <Lock size={14} aria-hidden="true" />}
                  <span>
                    <strong>{unlocked ? secret.title : copy.locked}</strong>
                    {unlocked ? null : <small>{secret.hint}</small>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <button type="button" className="secrets__pill" aria-expanded={open} aria-controls="secrets-panel" onClick={() => setOpen((value) => !value)}>
        <Sparkles size={14} aria-hidden="true" />
        <span dir="ltr">{foundIds.length}/{SECRET_IDS.length}</span> {copy.pill}
      </button>
    </div>
  );
}
