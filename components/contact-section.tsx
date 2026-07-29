"use client";

import { useState } from "react";
import { Check, Clipboard, Mail, MapPin } from "lucide-react";
import { identity } from "@/data/portfolio";
import { SocialLinks } from "./social-links";

export function ContactSection() {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
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
      document.execCommand("copy");
      textArea.remove();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    }
  }

  return (
    <section id="contact" className="contact-section" aria-labelledby="contact-title">
      <div className="page-shell contact-section__inner">
        <div className="contact-section__copy">
          <p>Open channel / Contact</p>
          <h2 id="contact-title">Let&apos;s build something meaningful.</h2>
          <p>
            Have a software opportunity, AI project, collaboration, consultation, or
            speaking invitation? I&apos;d be glad to hear from you.
          </p>
        </div>

        <div className="contact-section__actions">
          <a className="button button--signal" href={`mailto:${identity.email}`}>
            <Mail aria-hidden="true" size={18} /> Send Me an Email
          </a>
          <button className="button button--ghost" type="button" onClick={copyEmail}>
            {copied ? (
              <Check aria-hidden="true" size={18} />
            ) : (
              <Clipboard aria-hidden="true" size={18} />
            )}
            {copied ? "Email copied" : "Copy email"}
          </button>
          <p className="contact-section__status" aria-live="polite">
            {copied ? `${identity.email} copied to clipboard.` : ""}
          </p>
        </div>

        <div className="contact-section__meta">
          <p>
            <MapPin aria-hidden="true" size={17} />
            Based in {identity.location}
          </p>
          <SocialLinks includeEmail />
        </div>
      </div>
    </section>
  );
}
