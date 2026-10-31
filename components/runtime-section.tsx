import type { CSSProperties } from "react";
import { getContent, type Locale } from "@/data/i18n";
import { AgentTerminal } from "./agent-terminal";
import { AssistantStage } from "./assistant-stage";

// A principle opens with its rule; the rest is the evidence from a project. The rule is set bold.
function splitPrinciple(text: string) {
  const match = /^(.+?[.!?؟])\s+([\s\S]+)$/.exec(text);
  return match ? { rule: match[1], evidence: match[2] } : { rule: text, evidence: "" };
}

// The AI section: a huge headline, the real assistant console in a glass panel, and the big living orb
// beside it that shows what the assistant is doing. On phones the orb sits between the intro and the
// console. The headline's words are separate boxes so they can arrive one by one (app/ai.css).
export function RuntimeSection({ locale = "en" }: { locale?: Locale }) {
  const { principles, ui } = getContent(locale);
  const copy = ui.runtime;
  return (
    <section id="runtime" className="section runtime-section ai-section" aria-labelledby="runtime-title">
      <div className="page-shell ai-grid">
        <header className="ai-head">
          <p className="li-eyebrow li-eyebrow--live ai-eyebrow">{copy.eyebrow}</p>
          <h2 id="runtime-title" className="ai-title">
            {copy.title.split(" ").map((word, index) => (
              <span key={`${word}-${index}`}>
                {index > 0 ? " " : null}
                <span className="ai-title__word" style={{ "--i": index } as CSSProperties}>{word}</span>
              </span>
            ))}
          </h2>
          <p className="ai-lede">{copy.description}</p>
        </header>
        <AssistantStage locale={locale} />
        <div className="ai-chat">
          <AgentTerminal locale={locale} />
        </div>
      </div>
      <div className="page-shell ai-principles">
        <h3 className="ai-principles__title">{copy.principles}</h3>
        <ol className="ai-principles__list">
          {principles.map((principle, index) => {
            const { rule, evidence } = splitPrinciple(principle);
            return (
              <li key={principle}>
                <span className="ai-principles__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <p>
                  <strong>{rule}</strong>
                  {evidence ? <> {evidence}</> : null}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
