"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getContent, type Locale } from "@/data/i18n";
import type { Experience, PortfolioAsset } from "@/data/portfolio";
import { MetaParts } from "./meta-parts";

type SallaExperienceStoryProps = {
  experience: Experience;
  asset: PortfolioAsset | null;
  title: string;
  locale?: Locale;
};

// The inside of the Now card (FINAL-SPEC 6.4): the role in one line, the three duties, the learning note,
// and the Salla film as a still poster. The film never starts on its own and never loops: the visitor
// presses play, it plays inline with its controls, and it pauses when it leaves the screen or the tab.
export function SallaExperienceStory({ experience, asset, title, locale = "en" }: SallaExperienceStoryProps) {
  const copy = getContent(locale).ui.media;
  const videoRef = useRef<HTMLVideoElement>(null);
  // A source that failed to load needs a fresh load() before the next try; play() alone would reject again.
  const failedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const mark = asset ? asset.derived.monochrome ?? asset.derived.color : null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const pause = () => {
      if (!video.paused) video.pause();
    };
    const onPlaying = () => {
      setLoading(false);
      setMessage("");
    };
    const onWaiting = () => setLoading(true);
    const onPause = () => setLoading(false);
    // A <source> that fails fires on the source, not the video, so listen in the capture phase.
    const onError = () => {
      failedRef.current = true;
      setLoading(false);
      setStarted(false);
      setMessage(copy.failedLoad);
    };
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) pause();
    }, { threshold: 0 });
    observer.observe(video);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onError, true);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onError, true);
      document.removeEventListener("visibilitychange", onVisibility);
      video.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- copy is static per locale
  }, []);

  async function play() {
    const video = videoRef.current;
    if (!video) return;
    setStarted(true);
    setLoading(true);
    setMessage("");
    if (failedRef.current || video.error) {
      failedRef.current = false;
      video.load();
    }
    // The play button goes away; focus moves to the film's own controls instead of falling to the page.
    video.focus({ preventScroll: true });
    try {
      await video.play();
    } catch {
      setStarted(false);
      setLoading(false);
      setMessage(copy.failedStart);
    }
  }

  return (
    <>
      <div className="about__now-copy">
        <header className="about__now-head">
          <h3 id="experience-title">{title}</h3>
          {mark ? <Image className="about__now-mark" src={mark} alt="" width={1101} height={480} /> : null}
        </header>
        <p className="about__now-meta">
          <MetaParts text={[experience.role, experience.dates, experience.location].join(" · ")} />
        </p>
        <ul className="about__now-duties">
          {experience.responsibilities.map((responsibility) => (
            <li key={responsibility}>{responsibility}</li>
          ))}
        </ul>
        <p className="about__now-note">
          <span className="li-lamp li-k-asks" aria-hidden="true" />
          <span>{experience.note}</span>
        </p>
      </div>

      <div className={`about__now-film${started ? " is-started" : ""}`}>
        <video
          ref={videoRef}
          className="about__now-video"
          muted
          playsInline
          preload="none"
          poster="/assets/media/salla-experience-poster.webp"
          controls={started}
          tabIndex={started ? 0 : -1}
          aria-label={copy.salla.film}
        >
          <source src="/assets/media/salla-experience-mobile.mp4" media="(max-width: 840px)" type="video/mp4" />
          <source src="/assets/media/salla-experience.mp4" type="video/mp4" />
        </video>
        {!started ? (
          <button type="button" className="about__now-play" onClick={() => void play()}>
            <Play aria-hidden="true" />
            <span>{copy.salla.play}</span>
          </button>
        ) : null}
        <p className="about__now-status" role="status" aria-live="polite">
          {message || (loading ? copy.loading : "")}
        </p>
      </div>
    </>
  );
}
