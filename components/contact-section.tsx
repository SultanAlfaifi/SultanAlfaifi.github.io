"use client";

import { useState } from "react";
import { Check, Clipboard, Mail, MapPin } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { SplitWords } from "./section-header";
import { SocialLinks } from "./social-links";

export function ContactSection({ locale = "en" }: { locale?: Locale }) {
  const { identity, ui } = getContent(locale);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copyEmail() {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(identity.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = identity.email;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      const succeeded = document.execCommand("copy");
      textArea.remove();
      setCopied(succeeded);
      setCopyError(!succeeded);
      if (succeeded) window.setTimeout(() => setCopied(false), 2400);
    }
  }

  return (
    <section id="contact" className="contact-section" aria-labelledby="contact-title">
      <div className="page-shell contact-section__inner">
        <div className="contact-section__copy">
          <h2 id="contact-title" className="split-heading"><SplitWords text={ui.contact.title} /></h2>
          <p>{ui.contact.body}</p>
        </div>

        <div className="contact-section__actions">
          <a className="contact-orb" href={`mailto:${identity.email}`} data-magnetic aria-label={ui.contact.orbAria}>
            <svg className="contact-orb__ring" viewBox="0 0 200 200" aria-hidden="true" direction="ltr">
              <defs><path id="contact-orb-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
              <text><textPath href="#contact-orb-path">{ui.contact.orbRing}</textPath></text>
            </svg>
            <span className="contact-orb__core" aria-hidden="true">
              <Mail size={22} />
              <span lang="ar">{ui.contact.orbWord}</span>
              <small>{ui.contact.orbSmall}</small>
            </span>
          </a>
          <button className="button button--ghost" type="button" onClick={copyEmail}>
            {copied ? (
              <Check aria-hidden="true" size={18} />
            ) : (
              <Clipboard aria-hidden="true" size={18} />
            )}
            {copied ? ui.contact.copiedButton : ui.contact.copy}
          </button>
          <p className="contact-section__status" aria-live="polite">
            {copied ? ui.contact.copied(identity.email) : copyError ? ui.contact.manual(identity.email) : identity.email}
          </p>
        </div>

        <div className="contact-section__meta">
          <p>
            <MapPin aria-hidden="true" size={17} />
            {ui.contact.based(identity.location)}
          </p>
          <SocialLinks includeEmail locale={locale} />
        </div>
      </div>
    </section>
  );
}
