"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { BriefcaseBusiness, Compass, Handshake, type LucideIcon } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { markWelcome, rememberLanguage, saveVisitor, WELCOME_EVENT, type Visitor, type VisitorDetail } from "@/lib/visitor";
import { motionAllowed } from "./motion-preference";

const OPTIONS: { visitor: Exclude<Visitor, "skip">; Icon: LucideIcon }[] = [
  { visitor: "hiring", Icon: BriefcaseBusiness },
  { visitor: "collaborate", Icon: Handshake },
  { visitor: "browse", Icon: Compass }
];

// Asks first-time visitors why they came, before the site. The boot script decides whether it shows
// (and paints it before React loads); this component makes it a real modal dialog once hydrated.
// Skip, Escape, and every option close it, and the answer is never asked again on this browser.
export function WelcomeScreen({ locale = "en" }: { locale?: Locale }) {
  const { ui } = getContent(locale);
  const copy = ui.welcome;
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<"choose" | "company">("choose");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const open = () => {
      markWelcome(true);
      if (!dialog.open) dialog.showModal();
    };
    if (document.documentElement.dataset.welcome === "show") open();
    const reopen = () => {
      setStep("choose");
      open();
    };
    window.addEventListener(WELCOME_EVENT, reopen);
    return () => window.removeEventListener(WELCOME_EVENT, reopen);
  }, []);

  // The page is arranged and the hero starts arriving at once; the screen fades out over it.
  function finish(detail: VisitorDetail) {
    const dialog = dialogRef.current;
    saveVisitor(detail);
    markWelcome(false);
    if (!dialog?.open) return;
    const close = () => dialog.close();
    if (!motionAllowed() || typeof dialog.animate !== "function") return close();
    dialog.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(1.03)" }], { duration: 420, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }).finished.then(close, close);
    // A tab in the background may not run the animation; the screen still goes.
    window.setTimeout(close, 700);
  }

  function choose(visitor: Exclude<Visitor, "skip">) {
    if (visitor === "hiring") setStep("company");
    else finish({ visitor });
  }

  function enter(event: FormEvent) {
    event.preventDefault();
    finish({ visitor: "hiring", company: company.trim(), role: role.trim() });
  }

  return (
    <dialog
      ref={dialogRef}
      className="welcome"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-lead`}
      onCancel={(event) => {
        event.preventDefault();
        finish({ visitor: step === "company" ? "hiring" : "skip" });
      }}
    >
      <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
      <div className="welcome__top">
        <p className="welcome__brand">
          <Image src="/brand/sultan-alfaifi-mark.svg" alt="" width={32} height={32} />
          {copy.brand}
        </p>
        <div className="welcome__tools">
          <a className="welcome__language" href={ui.nav.language.href} hrefLang={ui.nav.language.hrefLang} lang={ui.nav.language.hrefLang} onClick={() => rememberLanguage(ui.nav.language.hrefLang)}>
            {ui.nav.language.short}
          </a>
          <button type="button" className="welcome__skip" onClick={() => finish({ visitor: step === "company" ? "hiring" : "skip" })}>{copy.skip}</button>
        </div>
      </div>

      {step === "choose" ? (
        <div className="welcome__body" key="choose">
          <p className="welcome__hello">{copy.hello}</p>
          <h2 id={`${id}-title`}>{copy.title}</h2>
          <p id={`${id}-lead`} className="welcome__lead">{copy.lead}</p>
          <div className="welcome__options">
            {OPTIONS.map(({ visitor, Icon }, index) => (
              <button key={visitor} type="button" className="welcome__option" onClick={() => choose(visitor)} autoFocus={index === 0}>
                <span className="welcome__icon" aria-hidden="true"><Icon size={26} /></span>
                <strong>{copy.options[visitor].title}</strong>
                <span className="welcome__detail">{copy.options[visitor].detail}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form className="welcome__body welcome__body--form" key="company" onSubmit={enter}>
          <h2 id={`${id}-title`}>{copy.companyTitle}</h2>
          <p id={`${id}-lead`} className="welcome__lead">{copy.companyLead}</p>
          <div className="welcome__fields">
            <div className="welcome__field">
              <label htmlFor={`${id}-company`}>{ui.cv.company}</label>
              <input id={`${id}-company`} value={company} onChange={(event) => setCompany(event.target.value)} placeholder={ui.cv.companyPlaceholder} maxLength={60} autoComplete="organization" dir="auto" autoFocus />
            </div>
            <div className="welcome__field">
              <label htmlFor={`${id}-role`}>{ui.cv.role}</label>
              <input id={`${id}-role`} value={role} onChange={(event) => setRole(event.target.value)} placeholder={ui.cv.rolePlaceholder} maxLength={80} autoComplete="organization-title" dir="auto" />
            </div>
          </div>
          <div className="welcome__actions">
            <button type="submit" className="button welcome__enter">{copy.enter}</button>
            <button type="button" className="welcome__back" onClick={() => setStep("choose")}>{copy.back}</button>
          </div>
        </form>
      )}
    </dialog>
  );
}
