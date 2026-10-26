import { getContent, type Locale } from "@/data/i18n";

// Purely typographic interlude; the words repeat ideas stated elsewhere, so it is hidden from assistive tech.
// The rows keep an LTR track so the scroll-linked motion is identical in both languages.
export function KineticBand({ locale = "en" }: { locale?: Locale }) {
  const { band } = getContent(locale).ui;
  const solidRow = [...band.solid, ...band.solid, ...band.solid];
  const outlineRow = [...band.outline, ...band.outline, ...band.outline];
  const second = locale === "en" ? "ar" : "en";
  return (
    <section className="kinetic-band" aria-hidden="true" data-cursor={band.cursor} dir="ltr">
      <div className="kinetic-band__row kinetic-band__row--solid">
        {solidRow.map(([primary, secondary], index) => (
          <span key={`${primary}-${index}`}>
            <span lang={locale} dir="auto">{primary}</span>
            <i>✦</i>
            <span lang={second} dir="auto" className="kinetic-band__accent">{secondary}</span>
            <i>✦</i>
          </span>
        ))}
      </div>
      <div className="kinetic-band__row kinetic-band__row--outline">
        {outlineRow.map((phrase, index) => (
          <span key={`${phrase}-${index}`}><span dir="auto">{phrase}</span><i>✦</i></span>
        ))}
      </div>
    </section>
  );
}
