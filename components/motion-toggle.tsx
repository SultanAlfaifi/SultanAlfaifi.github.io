"use client";

import { useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { motionAllowed, setMotionEnabled, subscribeMotion } from "./motion-preference";

export function MotionToggle({ locale = "en" }: { locale?: Locale }) {
  const copy = getContent(locale).ui.motion;
  const allowed = useSyncExternalStore(subscribeMotion, motionAllowed, () => true);
  return (
    <button
      type="button"
      className="motion-toggle"
      aria-pressed={!allowed}
      aria-label={allowed ? copy.pause : copy.resume}
      title={allowed ? copy.pauseTitle : copy.resumeTitle}
      onClick={() => setMotionEnabled(!allowed)}
    >
      {allowed ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
    </button>
  );
}
