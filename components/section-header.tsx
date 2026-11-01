import type { CSSProperties } from "react";
import { Reveal } from "./reveal";

type SectionHeaderProps = {
  eyebrow?: string;
  /** A numbered chapter (.li-chapter): the eyebrow shows the chapter's number before any eyebrow words. */
  numbered?: boolean;
  title: string;
  description?: string;
};

// Words sit in clipping wrappers so CSS can raise them one by one as the heading scrolls in.
export function SplitWords({ text }: { text: string }) {
  return text.split(" ").map((word, index) => (
    <span key={`${word}-${index}`}>
      {index > 0 ? " " : null}
      <span className="split-word"><span style={{ "--i": index } as CSSProperties}>{word}</span></span>
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

export function SectionHeader({
  eyebrow,
  numbered = false,
  title,
  description
}: SectionHeaderProps) {
  return (
    <Reveal variant="title">
      <header className="section-header">
        {numbered ? <ChapterEyebrow text={eyebrow} /> : null}
        <div className="section-header__copy">
          <h2 className="split-heading"><SplitWords text={title} /></h2>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
    </Reveal>
  );
}
