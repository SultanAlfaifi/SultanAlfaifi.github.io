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
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!video || reducedMotion.matches) return;

    video.muted = true;
    void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.pause();
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

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
        autoPlay
        loop
        muted={muted}
        playsInline
        preload="auto"
        poster={poster}
        aria-label="Introductory video featuring Sultan Alfaifi"
      >
        <source src={mobileSrc} media="(max-width: 840px)" type="video/mp4" />
        <source src={src} type="video/mp4" />
        Your browser does not support the introductory video.
      </video>
      <div className="hero-media__controls" aria-label="Introductory video controls">
        <button type="button" onClick={togglePlayback} aria-label={playing ? "Pause introductory video" : "Play introductory video"}>
          {playing ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
        </button>
        <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute introductory video" : "Mute introductory video"}>
          {muted ? <VolumeX aria-hidden="true" size={16} /> : <Volume2 aria-hidden="true" size={16} />}
        </button>
      </div>
    </div>
  );
}
