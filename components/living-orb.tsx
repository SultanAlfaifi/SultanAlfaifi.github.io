"use client";

import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from "react";
import Image from "next/image";
import {
  mountLivingOrb,
  type LivingOrbHandle,
  type LivingOrbPalette,
  type LivingOrbRenderer,
  type LivingOrbState
} from "@/lib/living-orb";
import { motionAllowed, subscribeMotion } from "./motion-preference";

export type { LivingOrbPalette, LivingOrbState } from "@/lib/living-orb";

/** What a ref to <LivingOrb> gets. Every call is a no-op until the orb has mounted (it mounts near the viewport). */
export type LivingOrbControls = {
  /** Same as changing the state prop, for one-off moments (the prop wins on its next change). */
  setState(state: LivingOrbState): void;
  /** A single ring of light leaves the orb, without changing its state. */
  bloom(): void;
  /** Feed "speaking" directly: 0..1, or null to go back to the built-in voice. */
  setAmplitude(value: number | null): void;
  readonly renderer: LivingOrbRenderer | null;
};

export type LivingOrbProps = {
  /** idle · listening · thinking · speaking · approved (blooms once) · paused (dimmed). */
  state?: LivingOrbState;
  /** CSS size of the square: a number is px, a string is any CSS length ("min(520px, 80vw)"). */
  size?: number | string;
  palette?: LivingOrbPalette;
  /** The pointer tilts the light; hovering makes it lean in. */
  interactive?: boolean;
  /** 0..1: room left for the glow inside the square. Default 1 (a mark below 72px: 0.2). */
  halo?: number;
  /** "speaking" amplitude: a 0..1 number, a function polled each frame, or null for the built-in voice. */
  amplitude?: number | null | (() => number);
  /** Frame cap. The big orbs default to 60, so a 120 Hz phone does not draw them twice as often; marks use about 30. */
  fps?: number;
  /** An image shown until the first frame, and when JavaScript or canvas is unavailable. */
  poster?: string;
  /** With a label the orb is an image with that name; without one it is decoration (aria-hidden). */
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** Internal: the navigation mark, which never counts as a stage orb. */
  brand?: boolean;
  /** Keeps moving while the welcome screen is up (the orb on the welcome screen itself). Every other orb
   *  holds still behind it: the screen covers the page, so their frames would be drawn for nobody. */
  overWelcome?: boolean;
  ref?: Ref<LivingOrbControls>;
};

/* ---------- Stage orbs on screen: the brand mark slows down while one is visible ---------- */
const visibleStages = new Set<symbol>();
const stageListeners = new Set<(anyVisible: boolean) => void>();
function reportStage(key: symbol, visible: boolean) {
  const before = visibleStages.size > 0;
  if (visible) visibleStages.add(key);
  else visibleStages.delete(key);
  const after = visibleStages.size > 0;
  if (before !== after) stageListeners.forEach((listener) => listener(after));
}
/** Called with true while any big orb (hero, AI section) is on screen. Returns an unsubscribe. */
export function subscribeStageOrbs(listener: (anyVisible: boolean) => void) {
  stageListeners.add(listener);
  listener(visibleStages.size > 0);
  return () => {
    stageListeners.delete(listener);
  };
}

/* ---------- The brand mark blooms when the visitor approves in the hero ---------- */
export const BRAND_BLOOM_EVENT = "portfolio:brand-bloom";
/** Makes the navigation mark bloom once (a ring of light), e.g. on the hero's موافق / Approve. */
export function bloomBrandOrb() {
  window.dispatchEvent(new Event(BRAND_BLOOM_EVENT));
}

const cssSize = (size: number | string | undefined) => (typeof size === "number" ? `${size}px` : size);
// The big orbs’ frame cap: smooth on a 60 Hz screen, and no more than that on a 120 Hz one.
const STAGE_FPS = 60;

// The living orb as a component. It mounts its engine when it first comes near the viewport, pauses
// off screen and in hidden tabs, paints one still frame while motion is off (the OS setting or the
// site's Motion switch), and destroys its WebGL context on unmount. A soft CSS glow (or the poster)
// stands in until the first frame, so the page is complete without JavaScript.
export function LivingOrb({
  state = "idle",
  size,
  palette,
  interactive = false,
  halo,
  amplitude,
  fps,
  poster,
  label,
  className,
  style,
  brand = false,
  overWelcome = false,
  ref
}: LivingOrbProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const handleRef = useRef<LivingOrbHandle | null>(null);
  const stateRef = useRef(state);
  const paletteRef = useRef(palette);
  const fpsRef = useRef(fps);
  const amplitudeRef = useRef(amplitude);

  useImperativeHandle(ref, () => ({
    setState: (next) => handleRef.current?.setState(next),
    bloom: () => handleRef.current?.bloom(),
    setAmplitude: (value) => handleRef.current?.setAmplitude(value),
    get renderer() {
      return handleRef.current?.renderer ?? null;
    }
  }), []);

  // Live props: kept in refs for the (later) mount, and pushed into a mounted engine.
  useEffect(() => {
    stateRef.current = state;
    handleRef.current?.setState(state);
  }, [state]);

  const paletteKey = Array.isArray(palette) ? palette.join(",") : String(palette ?? "");
  useEffect(() => {
    paletteRef.current = palette;
    if (palette) handleRef.current?.setPalette(palette);
    // paletteKey stands for palette, so a new array with the same colours does not repaint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteKey]);

  useEffect(() => {
    fpsRef.current = fps;
    handleRef.current?.setFps(fps ?? STAGE_FPS);
  }, [fps]);

  useEffect(() => {
    amplitudeRef.current = amplitude;
  }, [amplitude]);

  // Mount once, near the viewport. A fresh canvas per mount: a canvas whose context was released cannot
  // give a working one back (React's development double-mount would otherwise leave it blank).
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const key = Symbol("living-orb");
    let handle: LivingOrbHandle | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let unsubscribeMotion = () => {};
    let welcomeWatch: MutationObserver | null = null;
    const root = document.documentElement;
    // Still with motion off, and behind the welcome screen (it covers the whole page).
    const still = () => !motionAllowed() || (!overWelcome && root.dataset.welcome === "show");

    const mount = () => {
      if (handle) return;
      canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      wrap.appendChild(canvas);
      handle = mountLivingOrb(canvas, {
        state: stateRef.current,
        palette: paletteRef.current,
        interactive,
        halo,
        fps: fpsRef.current ?? STAGE_FPS,
        still: still(),
        // A number or a function from the prop; null lets the engine's own voice drive "speaking".
        amplitude: () => {
          const current = amplitudeRef.current;
          return typeof current === "function" ? current() : typeof current === "number" ? current : null;
        },
        onVisibilityChange: brand ? undefined : (visible) => reportStage(key, visible)
      });
      handleRef.current = handle;
      wrap.dataset.ready = "";
      wrap.dataset.renderer = handle.renderer;
      unsubscribeMotion = subscribeMotion(() => handle?.setStill(still()));
      if (!overWelcome && typeof MutationObserver !== "undefined") {
        welcomeWatch = new MutationObserver(() => handle?.setStill(still()));
        welcomeWatch.observe(root, { attributes: true, attributeFilter: ["data-welcome"] });
      }
    };

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === "undefined") mount();
    else {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer?.disconnect();
          observer = null;
          mount();
        }
      }, { rootMargin: "240px" });
      observer.observe(wrap);
    }

    return () => {
      observer?.disconnect();
      welcomeWatch?.disconnect();
      unsubscribeMotion();
      reportStage(key, false);
      handle?.destroy();
      canvas?.remove();
      handleRef.current = null;
      delete wrap.dataset.ready;
      delete wrap.dataset.renderer;
    };
    // The engine is built once per mount; live props (state, palette, fps, amplitude) reach it through
    // the refs and effects above, so only the options it cannot change in place rebuild it.
  }, [interactive, halo, brand, overWelcome]);

  const classes = ["li-orb", poster ? "li-orb--poster" : "", interactive ? "li-orb--interactive" : "", className ?? ""].filter(Boolean).join(" ");
  const sizeStyle = size !== undefined ? ({ "--li-orb-size": cssSize(size) } as CSSProperties) : undefined;

  return (
    <span
      ref={wrapRef}
      className={classes}
      style={{ ...sizeStyle, ...style }}
      data-state={state}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {poster ? <Image className="li-orb__poster" src={poster} alt="" width={64} height={64} priority={brand} /> : null}
    </span>
  );
}

// The navigation mark: the small living orb at about 30 fps. It slows to a few frames a second while a
// big orb is on screen, and blooms once when bloomBrandOrb() is called (the visitor approved).
export function BrandOrb({ size = 34, className }: { size?: number; className?: string }) {
  const orbRef = useRef<LivingOrbControls>(null);
  const [stageVisible, setStageVisible] = useState(false);
  const [blooming, setBlooming] = useState(false);

  useEffect(() => subscribeStageOrbs(setStageVisible), []);

  useEffect(() => {
    let settle = 0;
    const bloom = () => {
      setBlooming(true);
      orbRef.current?.setState("approved");
      window.clearTimeout(settle);
      settle = window.setTimeout(() => setBlooming(false), 2200);
    };
    window.addEventListener(BRAND_BLOOM_EVENT, bloom);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener(BRAND_BLOOM_EVENT, bloom);
    };
  }, []);

  return (
    <LivingOrb
      ref={orbRef}
      brand
      size={size}
      state={blooming ? "approved" : "idle"}
      fps={blooming || !stageVisible ? 30 : 8}
      poster="/brand/sultan-alfaifi-mark.svg"
      className={["li-brand-orb", className ?? ""].filter(Boolean).join(" ")}
    />
  );
}
