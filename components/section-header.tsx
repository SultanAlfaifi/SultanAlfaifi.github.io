type SectionHeaderProps = {
  eyebrow: string;
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
    <header className={`section-header ${inverse ? "section-header--inverse" : ""}`}>
      <p className="section-header__eyebrow">{eyebrow}</p>
      <div className="section-header__copy">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </header>
  );
}
