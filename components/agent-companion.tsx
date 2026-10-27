"use client";

import { ArrowLeft, ArrowRight, ArrowUp, Undo2, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type RefObject } from "react";
import { getContent, type Locale } from "@/data/i18n";
import type { TourStop } from "@/lib/agent/client";
import type { AnchorInfo } from "@/lib/agent/types";
import { AgentText } from "./agent-cards";
import { motionAllowed } from "./motion-preference";

// `card` is a report or a draft that arrived while the visitor was out on the page; it lives in the chat.
export type CompanionView = { kind: "answer"; card?: "fit" | "draft" } | { kind: "tour"; stops: TourStop[]; index: number };

type CompanionProps = {
  view: CompanionView;
  locale: Locale;
  answer: { text: string; streaming: boolean };
  status: string | null;
  busy: boolean;
  anchors: AnchorInfo[];
  urls: Set<string>;
  email: string;
  panelRef: RefObject<HTMLDivElement | null>;
  onStep: (index: number) => void;
  onAnchor: (id: string) => void;
  onAsk: (question: string) => void;
  onBack: () => void;
  onClose: () => void;
};

// Writes a tour line out a few letters at a time, like someone explaining as they go. With motion
// off the whole line is there at once.
function useTyped(text: string) {
  const [progress, setProgress] = useState({ text: "", count: 0 });
  useEffect(() => {
    const instant = !motionAllowed();
    const started = performance.now();
    const duration = Math.min(1400, text.length * 22);
    let frame = window.requestAnimationFrame(function tick(now) {
      const count = instant || !duration ? text.length : Math.min(text.length, Math.ceil(((now - started) / duration) * text.length));
      setProgress({ text, count });
      if (count < text.length) frame = window.requestAnimationFrame(tick);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [text]);
  return progress.text === text ? text.slice(0, progress.count) : "";
}

// The conversation, small enough to come along while the agent shows the visitor around the page. It
// narrates the stop they're on, takes the next question, and takes them back to the full chat.
export function Companion({ view, locale, answer, status, busy, anchors, urls, email, panelRef, onStep, onAnchor, onAsk, onBack, onClose }: CompanionProps) {
  const copy = getContent(locale).ui.terminal.agent.companion;
  const [question, setQuestion] = useState("");
  const tour = view.kind === "tour" ? view : null;
  const stop = tour ? tour.stops[tour.index] : null;
  const typed = useTyped(stop?.line ?? "");
  // Arrows point the way the page reads: "back" points right on the Arabic page.
  const Prev = locale === "ar" ? ArrowRight : ArrowLeft;
  const Next = locale === "ar" ? ArrowLeft : ArrowRight;

  function ask(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || busy) return;
    setQuestion("");
    onAsk(text);
  }

  return (
    <div
      ref={panelRef}
      className="companion"
      role="region"
      aria-label={copy.region}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div className="companion__bar">
        <span className="companion__pulse" data-busy={busy || undefined} aria-hidden="true" />
        <p className="companion__name">{copy.name}</p>
        {tour ? <p className="companion__step" dir="auto">{copy.step(tour.index + 1, tour.stops.length)}</p> : null}
        <button type="button" className="companion__icon" onClick={onClose} aria-label={copy.close} title={copy.close}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      {tour ? (
        <div className="companion__progress" aria-hidden="true">
          <span style={{ inlineSize: `${((tour.index + 1) / tour.stops.length) * 100}%` }} />
        </div>
      ) : null}

      <div className="companion__body">
        {stop ? (
          <>
            <p className="companion__where">{stop.label[locale]}</p>
            <p className="companion__text" aria-hidden="true">{typed}</p>
            <p className="sr-only" aria-live="polite">{stop.line}</p>
          </>
        ) : answer.text ? (
          <p className="companion__text" dir="auto" aria-live={answer.streaming ? "off" : "polite"}>
            <AgentText text={answer.text} anchors={anchors} urls={urls} email={email} onAnchor={onAnchor} />
          </p>
        ) : (
          <p className="companion__status">{status}</p>
        )}
      </div>

      {view.kind === "answer" && view.card ? (
        <button type="button" className="companion__primary companion__open" onClick={onBack}>
          {view.card === "fit" ? copy.openFit : copy.openDraft}
        </button>
      ) : null}

      {tour ? (
        <div className="companion__nav">
          <button type="button" className="companion__ghost" onClick={() => onStep(tour.index - 1)} disabled={tour.index === 0}>
            <Prev size={16} aria-hidden="true" /> {copy.prev}
          </button>
          {tour.index < tour.stops.length - 1 ? (
            <button type="button" className="companion__primary" onClick={() => onStep(tour.index + 1)}>
              {copy.next} <Next size={16} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="companion__primary" onClick={onBack}>{copy.done}</button>
          )}
        </div>
      ) : null}

      <form className="companion__ask" onSubmit={ask}>
        <label className="sr-only" htmlFor="companion-input">{copy.ask}</label>
        <input
          id="companion-input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={copy.ask}
          dir="auto"
          autoComplete="off"
          enterKeyHint="send"
          maxLength={2000}
        />
        <button type="submit" aria-label={copy.send} title={copy.send} disabled={!question.trim() || busy}>
          <ArrowUp size={16} aria-hidden="true" />
        </button>
      </form>
      <button type="button" className="companion__back" onClick={onBack}>
        <Undo2 size={15} aria-hidden="true" /> {copy.back}
      </button>
    </div>
  );
}
