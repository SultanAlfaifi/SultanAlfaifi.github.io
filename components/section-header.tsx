import type { CSSProperties } from "react";
import { Reveal } from "./reveal";

type SectionHeaderProps = {
  title: string;
  description?: string;
};

// Words sit in clipping wrappers so CSS can raise them one by one as the heading scrolls in. `start` carries
// the count on when one heading is split into lines.
export function SplitWords({ text, start = 0 }: { text: string; start?: number }) {
  return text.split(" ").map((word, index) => (
    <span key={`${word}-${index}`}>
      {index > 0 ? " " : null}
      <span className="split-word"><span style={{ "--i": start + index } as CSSProperties}>{word}</span></span>
    </span>
  ));
}

// A headline that asks and then invites («عندك فكرة أو فرصة؟ حدّثني عنها») breaks after its question, never
// inside it: each clause is its own line, balanced on its own. A headline with no question stays one block.
export function ClauseLines({ text }: { text: string }) {
  // Split after each question mark (no lookbehind, which older Safari cannot parse).
  const clauses = text.replace(/([?؟])\s+/g, "$1\n").split("\n");
  if (clauses.length < 2) return <SplitWords text={text} />;
  // Each clause's words count on from the words before it, so the rise stays one sequence.
  const starts = clauses.map((_, index) => clauses.slice(0, index).reduce((sum, clause) => sum + clause.split(" ").length, 0));
  return clauses.map((clause, index) => (
    <span key={clause} className="clause-line">
      {index > 0 ? " " : null}
      <SplitWords text={clause} start={starts[index]} />
    </span>
  ));
}

// A chapter's eyebrow: the aurora rule, the chapter's two-digit number, and the section's own eyebrow words
// where it has them ("01 · Featured projects"). The number is a CSS counter in DOM order (app/living.css,
// "Calm"), so when a visitor's order moves the chapters, the numbers follow with no code. It is decoration:
// screen readers hear the words only, and an eyebrow with no words is hidden from them.
export function ChapterEyebrow({ text, className = "" }: { text?: string; className?: string }) {
  return (
    <p className={`li-eyebrow li-eyebrow--live li-chapter__eyebrow ${className}`.trim()} aria-hidden={text ? undefined : true}>
      <span className="li-chapter__num" aria-hidden="true" />
      {text ? <><span className="li-chapter__dot" aria-hidden="true">·</span><span>{text}</span></> : null}
    </p>
  );
}

// A numbered chapter's opener (.li-chapter): the eyebrow with the chapter's number, the headline, the lead.
export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <Reveal variant="title">
      <header className="section-header">
        <ChapterEyebrow />
        <div className="section-header__copy">
          <h2 className="split-heading"><SplitWords text={title} /></h2>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
    </Reveal>
  );
}
