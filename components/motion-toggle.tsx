"use client";

import { useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { motionAllowed, setMotionEnabled, subscribeMotion } from "./motion-preference";

// The bar shows the icon alone; the phone menu shows it with its words (labelled), which then name it.
export function MotionToggle({ locale = "en", labelled = false }: { locale?: Locale; labelled?: boolean }) {
  const copy = getContent(locale).ui.motion;
  const allowed = useSyncExternalStore(subscribeMotion, motionAllowed, () => true);
  const label = allowed ? copy.pause : copy.resume;
  return (
    <button
      type="button"
      className={`motion-toggle${labelled ? " motion-toggle--labelled" : ""}`}
      aria-pressed={!allowed}
      aria-label={labelled ? undefined : label}
      title={labelled ? undefined : allowed ? copy.pauseTitle : copy.resumeTitle}
      onClick={() => setMotionEnabled(!allowed)}
    >
      {allowed ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
      {labelled ? <span>{label}</span> : null}
    </button>
  );
}
