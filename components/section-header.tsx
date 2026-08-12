type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  inverse?: boolean;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  inverse = false
}: SectionHeaderProps) {
  return (
    <Reveal variant="title">
      <header className={`section-header ${inverse ? "section-header--inverse" : ""}`}>
        {eyebrow ? <p className="section-header__eyebrow">{eyebrow}</p> : null}
        <div className="section-header__copy">
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
    </Reveal>
  );
}
import { Reveal } from "./reveal";
