"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

type HeroMediaProps = {
  src: string;
};

export function HeroMedia({ src }: HeroMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!video || reducedMotion.matches) return;

    video.muted = true;
    void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));

    return () => video.pause();
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
        loop
        muted={muted}
        playsInline
        preload="metadata"
        aria-label="Introductory video featuring Sultan Alfaifi"
      >
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
