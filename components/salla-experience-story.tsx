"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getContent, type Locale } from "@/data/i18n";
import type { Experience, PortfolioAsset } from "@/data/portfolio";
import { Reveal } from "./reveal";

type SallaExperienceStoryProps = {
  experience: Experience;
  asset: PortfolioAsset;
  locale?: Locale;
};

export function SallaExperienceStory({ experience, asset, locale = "en" }: SallaExperienceStoryProps) {
  const copy = getContent(locale).ui.media;
  const videoRef = useRef<HTMLVideoElement>(null);
  const togglePlaybackRef = useRef<() => void>(() => undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    let userPaused = false;
    let userRequested = false;
    let pending = false;
    let failed = false;
    let disposed = false;
    let requestId = 0;

    video.muted = true;

    const shouldPlay = () =>
      inView && !document.hidden && !userPaused && (!reducedMotion.matches || userRequested);

    function pause() {
      requestId += 1;
      pending = false;
      video!.pause();
      setIsPlaying(false);
      setLoading(false);
    }

    async function play() {
      if (!shouldPlay() || pending || !video!.paused) return;
      const currentRequest = ++requestId;
      pending = true;
      setLoading(true);
      setMessage("");
      try {
        await video!.play();
        if (disposed || currentRequest !== requestId) return;
        pending = false;
        if (!shouldPlay()) pause();
      } catch {
        if (disposed || currentRequest !== requestId) return;
        pending = false;
        userPaused = true;
        setIsPlaying(false);
        setLoading(false);
        setMessage(copy.failedStart);
      }
    }

    function syncPlayback() {
      if (shouldPlay()) void play();
      else pause();
    }

    const handlePlay = () => {
      if (!shouldPlay()) {
        pause();
        return;
      }
      failed = false;
      setIsPlaying(true);
      setLoading(false);
      setMessage("");
    };
    const handlePause = () => {
      setIsPlaying(false);
      setLoading(false);
    };
    const handleWaiting = () => {
      if (shouldPlay()) setLoading(true);
    };
    const handleError = () => {
      failed = true;
      userPaused = true;
      pause();
      setMessage(copy.failedLoad);
    };
    const handleMotionChange = () => {
      userRequested = false;
      syncPlayback();
    };

    togglePlaybackRef.current = () => {
      if (!video.paused || pending) {
        userPaused = true;
        pause();
      } else {
        userPaused = false;
        userRequested = true;
        if (failed || video.error) {
          failed = false;
          video.load();
        }
        void play();
      }
    };

    video.addEventListener("playing", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("error", handleError, true);
    document.addEventListener("visibilitychange", syncPlayback);
    reducedMotion.addEventListener("change", handleMotionChange);

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0 });
    observer.observe(video);

    return () => {
      disposed = true;
      requestId += 1;
      togglePlaybackRef.current = () => undefined;
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      reducedMotion.removeEventListener("change", handleMotionChange);
      video.removeEventListener("playing", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("error", handleError, true);
      video.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- copy is static per locale
  }, []);

  return (
    <div className="salla-story">
      <div className="salla-story__media-runway" aria-label={copy.salla.runway}>
        <div className="salla-story__stage">
          <div className="salla-story__frame">
            <video
              ref={videoRef}
              className="salla-story__video"
              muted
              loop
              playsInline
              preload="none"
              poster="/assets/media/salla-experience-poster.webp"
              aria-label={copy.salla.film}
            >
              <source
                src="/assets/media/salla-experience-mobile.mp4"
                media="(max-width: 840px)"
                type="video/mp4"
              />
              <source src="/assets/media/salla-experience.mp4" type="video/mp4" />
            </video>
            <div className="salla-story__scrim" aria-hidden="true" />
            <button
              type="button"
              className="salla-story__playback"
              onClick={() => togglePlaybackRef.current()}
              aria-label={isPlaying || loading ? copy.salla.pause : copy.salla.play}
            >
              {isPlaying || loading ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              <span>{isPlaying || loading ? copy.salla.pauseShort : copy.salla.playShort}</span>
            </button>
            <p className="salla-story__status" role="status" aria-live="polite">
              {message || (loading ? copy.loading : "")}
            </p>
          </div>
        </div>
      </div>

      <div className="page-shell salla-story__details">
        <Reveal className="salla-story__identity" variant="media">
          <div className="salla-story__logo">
            <Image src={asset.derived.color} alt={asset.alt} width={260} height={104} loading="eager" fetchPriority="low" />
          </div>
          <p className="salla-story__organization">{experience.organization}</p>
        </Reveal>

        <div className="salla-story__experience-grid">
          <Reveal className="salla-story__meta" variant="left">
            <p>{experience.dates}</p>
            <p>{experience.location}</p>
          </Reveal>

          <Reveal className="salla-story__content" variant="title" delay={80}>
            <h3>{experience.role}</h3>
            <p className="salla-story__description">{experience.description}</p>

            <ul className="salla-story__responsibilities">
              {experience.responsibilities.map((responsibility) => (
                <li key={responsibility}>{responsibility}</li>
              ))}
            </ul>

            <ul className="tag-list tag-list--dark" aria-label={copy.salla.tech}>
              {experience.technologies.map((technology) => (
                <li key={technology}>{technology}</li>
              ))}
            </ul>

            <p className="salla-story__note">{experience.note}</p>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
