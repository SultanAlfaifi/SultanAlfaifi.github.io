import type { CSSProperties } from "react";
import { Reveal } from "./reveal";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  inverse?: boolean;
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

export function SectionHeader({
  title,
  description,
  inverse = false
}: SectionHeaderProps) {
  return (
    <Reveal variant="title">
      <header className={`section-header ${inverse ? "section-header--inverse" : ""}`}>
        <div className="section-header__copy">
          <h2 className="split-heading"><SplitWords text={title} /></h2>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
    </Reveal>
  );
}
