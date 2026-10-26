"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { rememberLanguage } from "@/lib/visitor";
import { PaletteTrigger } from "./command-palette";
import { MotionToggle } from "./motion-toggle";

export function Navbar({ locale = "en" }: { locale?: Locale }) {
  const { navigation, ui } = getContent(locale);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sections = navigation
      .map((item) => document.querySelector(item.href))
      .filter((section): section is Element => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-18% 0px -72% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [navigation]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }

      if (event.key === "Tab") {
        const drawer = document.querySelector<HTMLElement>(".nav__drawer");
        const drawerLinks = drawer?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        );
        const focusable = [
          menuButtonRef.current,
          ...(drawerLinks ? Array.from(drawerLinks) : [])
        ].filter((element): element is HTMLElement => Boolean(element));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 841px)");

    function closeDrawerOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }

    desktopQuery.addEventListener("change", closeDrawerOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeDrawerOnDesktop);
  }, []);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className={`nav ${active === "home" ? "nav--hero" : ""}`}>
      <a className="nav__brand" href="#home" aria-label={ui.nav.home}>
        <Image
          src="/brand/sultan-alfaifi-mark.svg"
          alt=""
          width={36}
          height={36}
          priority
        />
        <small>{ui.nav.brandTag}</small>
      </a>

      <nav className="nav__desktop" aria-label={ui.nav.primary}>
        {navigation.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={active === item.href.slice(1) ? "is-active" : ""}
            aria-current={active === item.href.slice(1) ? "location" : undefined}
          >
            <span data-scramble>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="nav__tools">
        <a className="language-switch" href={ui.nav.language.href} hrefLang={ui.nav.language.hrefLang} lang={ui.nav.language.hrefLang} aria-label={ui.nav.language.label} title={ui.nav.language.label} onClick={() => rememberLanguage(ui.nav.language.hrefLang)}>
          {ui.nav.language.short}
        </a>
        <MotionToggle locale={locale} />
        <PaletteTrigger locale={locale} />
      </div>

      <button
        ref={menuButtonRef}
        className="nav__menu-button"
        type="button"
        aria-label={open ? ui.nav.close : ui.nav.open}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      <div className={`nav__drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <nav id="mobile-navigation" aria-label={ui.nav.mobile}>
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              tabIndex={open ? 0 : -1}
              className={active === item.href.slice(1) ? "is-active" : ""}
              onClick={closeMenu}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
