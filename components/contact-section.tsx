"use client";

import { useState } from "react";
import { Check, Clipboard, Mail } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { HelpSection } from "./help-section";
import { ChapterEyebrow, ClauseLines } from "./section-header";
import { SocialLinks } from "./social-links";

// The closing chapter, last in every visitor's order. One email action and a way to copy the address, the
// address itself in plain text, the three ways I can help (#help), the three profiles, and then the page
// comes to rest under a soft white lamp. The quiet wordmark it lights is the footer's
// (components/footer.tsx).
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
    <section id="contact" className="li-chapter finale" aria-labelledby="contact-title">
      <div className="page-shell finale__inner">
        <header className="finale__head">
          <ChapterEyebrow className="finale__eyebrow" />
          <h2 id="contact-title" className="split-heading finale__title"><ClauseLines text={ui.contact.title} /></h2>
          <p className="finale__lead">{ui.contact.body}</p>
        </header>

        <div className="finale__acts">
          <a className="li-btn li-btn--primary finale__btn" href={`mailto:${identity.email}`}>
            <Mail aria-hidden="true" />
            {ui.palette.sendEmail}
          </a>
          <button className="li-btn li-btn--ghost finale__btn" type="button" onClick={copyEmail}>
            {copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
            {copied ? ui.contact.copiedButton : ui.contact.copy}
          </button>
        </div>
        <p className="finale__meta">
          <span aria-live="polite">
            {copied ? ui.contact.copied(identity.email) : copyError ? ui.contact.manual(identity.email) : <bdi dir="ltr">{identity.email}</bdi>}
          </span>
          <span aria-hidden="true"> · </span>
          <span>{ui.contact.based(identity.location)}</span>
        </p>

        {/* «كيف أقدر أخدمك؟»: the three ways to start, inside Contact (#help), so Contact closes every order. */}
        <HelpSection locale={locale} />

        <div className="finale__socials">
          <SocialLinks locale={locale} />
        </div>
      </div>

      <div className="finale__horizon" aria-hidden="true" />
    </section>
  );
}
