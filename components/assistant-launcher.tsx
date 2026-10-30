"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getContent, type Locale } from "@/data/i18n";
import { openAssistant } from "@/lib/agent/assistant";
import { agentConfigured } from "@/lib/agent/client";

// The hero's way in: says plainly that this is an AI assistant, and opens it without leaving the hero.
// The hero passes its own shorter label ("Ask my agent"), since the run card beside it is about agents.
export function AssistantButton({ locale = "en", label }: { locale?: Locale; label?: string }) {
  const copy = getContent(locale).ui.assistant;
  if (!agentConfigured) return null;
  return (
    <button type="button" className="assistant-cta" onClick={openAssistant} data-magnetic>
      <Sparkles size={18} aria-hidden="true" /> {label ?? copy.open}
    </button>
  );
}

// Floating button for the rest of the page. It stays out of the way while the hero (which has its own
// button) or the console itself is on screen, and CSS hides it while the panel is open.
export function AssistantLauncher({ locale = "en" }: { locale?: Locale }) {
  const copy = getContent(locale).ui.assistant;
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!agentConfigured) return;
    const targets = ["home", "runtime"].map((id) => document.getElementById(id)).filter((target): target is HTMLElement => Boolean(target));
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target)));
      setHidden(visible.size > 0);
    }, { threshold: 0.15 });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  if (!agentConfigured) return null;
  return (
    <button type="button" className="assistant-launcher" data-hidden={hidden || undefined} inert={hidden} onClick={openAssistant}>
      <Sparkles size={18} aria-hidden="true" />
      <span className="assistant-launcher__long">{copy.open}</span>
      <span className="assistant-launcher__short">{copy.launcher}</span>
    </button>
  );
}
