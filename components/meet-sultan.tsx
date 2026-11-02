"use client";

import Image from "next/image";
import { useRef, useState, type MouseEvent } from "react";
import { Play, X } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { HeroMedia } from "./hero-media";

const POSTER = "/assets/media/sultan-introduction-poster.webp";
const MOBILE_FILM = "/assets/media/sultan-introduction-mobile.mp4";

// A real face in the hero without an autoplaying film: a round portrait in a glass pill, "Hi, I'm Sultan."
// It opens a native <dialog>. The film mounts only while the dialog is open, so the MP4 is fetched only
// when the visitor asks for it, and opening it counts as their request to play.
export function MeetSultan({ locale = "en" }: { locale?: Locale }) {
  const { identity, ui } = getContent(locale);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  function openFilm(event: MouseEvent<HTMLButtonElement>) {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    triggerRef.current = event.currentTarget;
    setOpen(true);
    dialog.showModal();
  }

  // Escape, the close button, and a click on the backdrop all end here.
  function handleClose() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  const play = <span className="sr-only"> {ui.media.play}</span>;

  return (
    <div className="meet-sultan">
      <button type="button" className="meet-row" onClick={openFilm}>
        <span className="meet-row__face">
          <Image src={POSTER} alt="" width={56} height={56} sizes="56px" fetchPriority="low" className="meet-row__image" />
          <span className="meet-row__play"><Play size={14} aria-hidden="true" /></span>
        </span>
        <span className="meet-row__text">
          <span className="meet-row__title">{ui.hero.filmCaption}</span>
          <span className="meet-row__place">{identity.location}</span>
        </span>
        {play}
      </button>
      <dialog
        ref={dialogRef}
        className="film-dialog"
        aria-labelledby="film-dialog-title"
        onClose={handleClose}
        onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}
      >
        <div className="film-dialog__panel">
          <div className="film-dialog__head">
            <h2 id="film-dialog-title">{ui.hero.filmCaption} <span>{identity.location}</span></h2>
            <button type="button" className="film-dialog__close" onClick={() => dialogRef.current?.close()} aria-label={ui.hero.filmClose}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="film-dialog__stage">
            {open ? <HeroMedia src={identity.introVideo} mobileSrc={MOBILE_FILM} poster={POSTER} locale={locale} requested /> : null}
          </div>
        </div>
      </dialog>
    </div>
  );
}
