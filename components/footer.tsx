import { getContent, type Locale } from "@/data/i18n";

const wordmark = ["SULTAN", "/", "ALFAIFI"];

export function Footer({ locale = "en" }: { locale?: Locale }) {
  const { identity, socialLinks, ui } = getContent(locale);
  return (
    <footer className="footer">
      <div className="page-shell footer__inner">
        <div>
          <p>{ui.footer.designed}</p>
          <p>{ui.footer.rights}</p>
        </div>
        <nav aria-label={ui.footer.links}>
          {socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noreferrer noopener" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a href="#home" aria-label={ui.footer.topAria}>
          {ui.footer.top}
        </a>
      </div>
      <p className="footer__wordmark" aria-hidden="true" data-proximity data-cursor={ui.footer.cursor} dir="ltr">
        {wordmark.map((word, wordIndex) => (
          <span key={word} className={word === "/" ? "footer__slash" : undefined}>
            {Array.from(word).map((character, index) => (
              <span key={`${wordIndex}-${index}`} className="px-char">{character}</span>
            ))}
          </span>
        ))}
      </p>
      <p className="footer__arabic" lang="ar" dir="rtl">{identity.arabicName} · {identity.arabicRole}</p>
    </footer>
  );
}
