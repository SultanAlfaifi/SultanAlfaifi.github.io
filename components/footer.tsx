import { getContent, type Locale } from "@/data/i18n";

// The close of the page: my name in the page's own language, very quiet, resting under the horizon that ends
// Contact, then one row: how the site was made, the rights, and the way back up. The name is decoration
// (aria-hidden), and it is still: nothing here follows the pointer. The profiles live in Contact and the hero.
export function Footer({ locale = "en" }: { locale?: Locale }) {
  const { identity, ui } = getContent(locale);
  return (
    <footer className="closing">
      <p className="closing__mark" aria-hidden="true">{identity.name}</p>
      <div className="page-shell closing__row">
        <p>{ui.footer.designed}</p>
        <p>{ui.footer.rights}</p>
        <a href="#home" aria-label={ui.footer.topAria}>{ui.footer.top}</a>
      </div>
    </footer>
  );
}
