"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

type HeroMediaProps = {
  src: string;
  mobileSrc: string;
  poster: string;
};

export function HeroMedia({ src, mobileSrc, poster }: HeroMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const togglePlaybackRef = useRef<() => void>(() => undefined);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
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
        setMessage("Video couldn’t start. Select Play to try again.");
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
      setMessage("Video couldn’t load. Select Play to retry.");
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
        aria-label="Introductory video featuring Sultan Alfaifi"
      >
        <source src={mobileSrc} media="(max-width: 840px)" type="video/mp4" />
        <source src={src} type="video/mp4" />
        Your browser does not support the introductory video.
      </video>
      <div className="hero-media__controls" aria-label="Introductory video controls">
        <button type="button" onClick={() => togglePlaybackRef.current()} aria-label={playing || loading ? "Pause introductory video" : "Play introductory video"}>
          {playing || loading ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
        </button>
        <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute introductory video" : "Mute introductory video"}>
          {muted ? <VolumeX aria-hidden="true" size={16} /> : <Volume2 aria-hidden="true" size={16} />}
        </button>
      </div>
      <p className="hero-media__status" role="status" aria-live="polite">
        {message || (loading ? "Loading video…" : "")}
      </p>
    </div>
  );
}
