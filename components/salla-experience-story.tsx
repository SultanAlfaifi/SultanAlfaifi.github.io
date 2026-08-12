"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Experience, PortfolioAsset } from "@/data/portfolio";
import { Reveal } from "./reveal";

type SallaExperienceStoryProps = {
  experience: Experience;
  asset: PortfolioAsset;
};

export function SallaExperienceStory({ experience, asset }: SallaExperienceStoryProps) {
  const storyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const story = storyRef.current;
    const video = videoRef.current;
    if (!story || !video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      video.pause();
      return () => {
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !userPausedRef.current) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(story);
    return () => {
      observer.disconnect();
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      userPausedRef.current = false;
      void video.play().catch(() => undefined);
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  };

  return (
    <div ref={storyRef} className="salla-story">
      <div className="salla-story__media-runway" aria-label="Salla experience video">
        <div className="salla-story__stage">
          <div className="salla-story__frame">
            <video
              ref={videoRef}
              className="salla-story__video"
              src="/assets/media/salla-experience.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Salla brand film"
            />
            <div className="salla-story__scrim" aria-hidden="true" />
            <button
              type="button"
              className="salla-story__playback"
              onClick={togglePlayback}
              aria-label={isPlaying ? "Pause Salla video" : "Play Salla video"}
              aria-pressed={!isPlaying}
            >
              {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="page-shell salla-story__details">
        <Reveal className="salla-story__identity" variant="media">
          <div className="salla-story__logo">
            <Image src={asset.derived.color} alt={asset.alt} width={260} height={104} />
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

            <ul className="tag-list tag-list--dark" aria-label="Experience technologies">
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
