import { identity } from "@/data/portfolio";

// Shown only when the boot script marks a first visit with motion allowed. Pure CSS: it always ends on its own.
export function IntroCurtain() {
  return (
    <div className="intro-curtain" aria-hidden="true">
      <div className="intro-curtain__panel intro-curtain__panel--top" />
      <div className="intro-curtain__panel intro-curtain__panel--bottom" />
      <div className="intro-curtain__content">
        <svg className="intro-curtain__name" viewBox="0 0 800 210" role="presentation">
          <text x="400" y="150" textAnchor="middle" direction="rtl">{identity.arabicName}</text>
        </svg>
        <span className="intro-curtain__line" />
        <p className="intro-curtain__meta">
          <span>SULTAN ALFAIFI · AGENT RUNTIME</span>
          <span className="intro-curtain__count" />
        </p>
      </div>
    </div>
  );
}
