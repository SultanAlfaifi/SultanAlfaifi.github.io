import { identity, socialLinks } from "@/data/portfolio";

export function Footer() {
  return (
    <footer className="footer">
      <div className="page-shell footer__inner">
        <div>
          <p>Designed &amp; Built by Sultan Alfaifi</p>
          <p>© 2026 Sultan Alfaifi. All rights reserved.</p>
        </div>
        <nav aria-label="Footer links">
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
        <a href="#home" aria-label={`Return to the top of ${identity.name}'s portfolio`}>
          Return to top ↑
        </a>
      </div>
      <p className="footer__wordmark" aria-hidden="true">
        SULTAN <span>/</span> ALFAIFI
      </p>
    </footer>
  );
}
