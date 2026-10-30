"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { motionAllowed, subscribeMotion } from "./motion-preference";

type HeroMediaProps = {
  src: string;
  mobileSrc: string;
  poster: string;
  locale?: Locale;
  // Set when the visitor opened the film themselves (the hero's dialog): that counts as asking for
  // playback, so it starts even with motion off, and pause and mute still work as usual.
  requested?: boolean;
};

export function HeroMedia({ src, mobileSrc, poster, locale = "en", requested = false }: HeroMediaProps) {
  const copy = getContent(locale).ui.media;
  const videoRef = useRef<HTMLVideoElement>(null);
  const togglePlaybackRef = useRef<() => void>(() => undefined);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let inView = false;
    let userPaused = false;
    let userRequested = requested;
    let pending = false;
    let failed = false;
    let disposed = false;
    let requestId = 0;

    video.muted = true;

    // The OS setting and the page's own Motion toggle both count (motionAllowed), not the OS alone.
    const shouldPlay = () =>
      inView && !document.hidden && !userPaused && (motionAllowed() || userRequested);

    function pause() {
      requestId += 1;
      pending = false;
      video!.pause();
      setPlaying(false);
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
        setPlaying(false);
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
      setPlaying(true);
      setLoading(false);
      setMessage("");
    };
    const handlePause = () => {
      setPlaying(false);
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
    const unsubscribeMotion = subscribeMotion(handleMotionChange);

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
      unsubscribeMotion();
      video.removeEventListener("playing", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("error", handleError, true);
      video.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- copy is static per locale, and requested is fixed for a mount
  }, []);

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  return (
    <div className="hero-media">
      <video
        ref={videoRef}
        className="hero-media__video"
        loop
        muted={muted}
        playsInline
        preload="none"
        poster={poster}
        aria-label={copy.video}
      >
        <source src={mobileSrc} media="(max-width: 840px)" type="video/mp4" />
        <source src={src} type="video/mp4" />
        Your browser does not support the introductory video.
      </video>
      <div className="hero-media__controls" aria-label={copy.controls}>
        <button type="button" onClick={() => togglePlaybackRef.current()} aria-label={playing || loading ? copy.pause : copy.play}>
          {playing || loading ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
        </button>
        <button type="button" onClick={toggleMute} aria-label={muted ? copy.unmute : copy.mute}>
          {muted ? <VolumeX aria-hidden="true" size={16} /> : <Volume2 aria-hidden="true" size={16} />}
        </button>
      </div>
      <p className="hero-media__status" role="status" aria-live="polite">
        {message || (loading ? copy.loading : "")}
      </p>
    </div>
  );
}
