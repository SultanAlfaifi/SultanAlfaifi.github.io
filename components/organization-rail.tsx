"use client";

import Image from "next/image";
import { ArrowUpRight, X } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent
} from "react";
import {
  getPortfolioAsset,
  organizations,
  type Organization
} from "@/data/portfolio";

type OrganizationStyle = CSSProperties & {
  "--brand-a": string;
  "--brand-b": string;
  "--brand-c": string;
  "--brand-d": string;
  "--visual-scale"?: number;
  "--object-position"?: string;
};

type DetailStageStyle = CSSProperties & {
  "--panel-height"?: string;
};

const HOVER_INTENT_DELAY = 80;
const PANEL_CLOSE_DURATION = 230;
const PANEL_EXIT_DELAY = 280;
const AUTO_SCROLL_SPEED = 24;
const RAIL_RESUME_DELAY = 650;

function getOrganizationStyle(organization: Organization): OrganizationStyle {
  const [brandA, brandB, brandC = brandA, brandD = brandB] = organization.colors;
  const asset = getPortfolioAsset(organization.logo);

  return {
    "--brand-a": brandA,
    "--brand-b": brandB,
    "--brand-c": brandC,
    "--brand-d": brandD,
    "--visual-scale": asset?.visualScale,
    "--object-position": asset?.objectPosition
  };
}

function OrganizationLogo({
  organization,
  color = false
}: {
  organization: Organization;
  color?: boolean;
}) {
  const asset = getPortfolioAsset(organization.logo);

  if (!asset) {
    return <span className="journey-logo__wordmark">{organization.name}</span>;
  }

  const source = color
    ? asset.derived.color
    : asset.derived.monochrome ?? asset.derived.color;

  return (
    <span className={`journey-logo${color ? " journey-logo--color" : ""}`}>
      <Image
        className="journey-logo__image"
        src={source}
        alt=""
        fill
        draggable={false}
        sizes={color ? "(max-width: 840px) 72vw, 300px" : "180px"}
      />
    </span>
  );
}

function OrganizationTile({
  organization,
  index,
  active,
  clone,
  onIntent,
  onCancelIntent,
  onActivate
}: {
  organization: Organization;
  index: number;
  active: boolean;
  clone: boolean;
  onIntent: (index: number) => void;
  onCancelIntent: () => void;
  onActivate: (index: number) => void;
}) {
  const content = (
    <>
      <OrganizationLogo organization={organization} />
      <span className="sr-only">{organization.name}</span>
    </>
  );

  return (
    <article
      className={`journey-tile${active ? " is-active" : ""}`}
      style={getOrganizationStyle(organization)}
      onMouseEnter={() => onIntent(index)}
      onMouseLeave={onCancelIntent}
    >
      {clone ? (
        <button
          type="button"
          className="journey-tile__trigger journey-tile__trigger--clone"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => onActivate(index)}
        >
          {content}
        </button>
      ) : (
        <button
          type="button"
          className="journey-tile__trigger"
          aria-controls="organization-detail-panel"
          aria-expanded={active}
          aria-label={`Explore ${organization.name}`}
          onFocus={() => onActivate(index)}
          onClick={() => onActivate(index)}
        >
          {content}
        </button>
      )}
    </article>
  );
}

export function OrganizationRail() {
  const visibleOrganizations = organizations.filter(
    (organization) => organization.visible
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [displayedIndex, setDisplayedIndex] = useState<number | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const hoverTimer = useRef<number | null>(null);
  const swapTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const openFrame = useRef<number | null>(null);
  const railResumeTimer = useRef<number | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const panelOpenRef = useRef(false);
  const railInteractingRef = useRef(false);
  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: -1,
    pointerType: "",
    startScrollLeft: 0,
    startX: 0
  });

  const displayedOrganization =
    displayedIndex === null ? null : visibleOrganizations[displayedIndex];

  function clearTimer(timer: { current: number | null }) {
    if (timer.current === null) return;
    window.clearTimeout(timer.current);
    timer.current = null;
  }

  function cancelIntent() {
    clearTimer(hoverTimer);
  }

  function pauseRailInteraction() {
    cancelIntent();
    clearTimer(railResumeTimer);
    railInteractingRef.current = true;
  }

  function scheduleRailResume() {
    clearTimer(railResumeTimer);
    railResumeTimer.current = window.setTimeout(() => {
      railInteractingRef.current = false;
      railResumeTimer.current = null;
    }, RAIL_RESUME_DELAY);
  }

  function handleRailPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    pauseRailInteraction();
    dragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startScrollLeft: event.currentTarget.scrollLeft,
      startX: event.clientX
    };

    if (event.pointerType === "mouse") {
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add("is-dragging");
    }
  }

  function handleRailPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 5 && !drag.moved) {
      drag.moved = true;
      closePanel();
    }

    if (drag.pointerType === "mouse") {
      event.preventDefault();
      event.currentTarget.scrollLeft = drag.startScrollLeft - distance;
    }
  }

  function finishRailPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    drag.active = false;
    event.currentTarget.classList.remove("is-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    scheduleRailResume();
  }

  function handleRailClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    if (!dragRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function handleRailWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaX) < 1 && !event.shiftKey) return;
    pauseRailInteraction();
    scheduleRailResume();
  }

  function cancelOpeningFrame() {
    if (openFrame.current === null) return;
    window.cancelAnimationFrame(openFrame.current);
    openFrame.current = null;
  }

  function mountAndOpen(index: number) {
    cancelOpeningFrame();
    setDisplayedIndex(index);
    setIsPanelOpen(false);

    openFrame.current = window.requestAnimationFrame(() => {
      openFrame.current = window.requestAnimationFrame(() => {
        setIsPanelOpen(true);
        openFrame.current = null;
      });
    });
  }

  function activateOrganization(index: number) {
    cancelIntent();
    clearTimer(closeTimer);
    clearTimer(swapTimer);
    cancelOpeningFrame();

    if (activeIndex === index && isPanelOpen) return;

    setActiveIndex(index);

    if (displayedIndex === null) {
      mountAndOpen(index);
      return;
    }

    if (displayedIndex === index) {
      mountAndOpen(index);
      return;
    }

    setIsPanelOpen(false);
    swapTimer.current = window.setTimeout(() => {
      mountAndOpen(index);
      swapTimer.current = null;
    }, PANEL_CLOSE_DURATION);
  }

  function scheduleOrganization(index: number) {
    if (activeIndex === index || railInteractingRef.current) return;
    cancelIntent();
    hoverTimer.current = window.setTimeout(() => {
      activateOrganization(index);
      hoverTimer.current = null;
    }, HOVER_INTENT_DELAY);
  }

  function closePanel() {
    cancelIntent();
    clearTimer(swapTimer);
    clearTimer(closeTimer);
    cancelOpeningFrame();

    setIsPanelOpen(false);
    setActiveIndex(null);
    closeTimer.current = window.setTimeout(() => {
      setDisplayedIndex(null);
      closeTimer.current = null;
    }, PANEL_EXIT_DELAY);
  }

  function handleSectionBlur(event: FocusEvent<HTMLElement>) {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    closePanel();
  }

  useEffect(
    () => () => {
      clearTimer(hoverTimer);
      clearTimer(swapTimer);
      clearTimer(closeTimer);
      clearTimer(railResumeTimer);
      cancelOpeningFrame();
    },
    []
  );

  useEffect(() => {
    panelOpenRef.current = isPanelOpen;
  }, [isPanelOpen]);

  useEffect(() => {
    const rail = railRef.current;
    const track = marqueeRef.current;
    const firstGroup = track?.querySelector<HTMLElement>(".journey-marquee__group");
    if (!rail || !track || !firstGroup) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isVisible = true;
    let frame = 0;
    let velocity = reducedMotion.matches ? 0 : AUTO_SCROLL_SPEED;
    let previousTime = performance.now();
    let scrollPosition = rail.scrollLeft;

    const getGroupWidth = () => firstGroup.getBoundingClientRect().width;
    const normalizeScrollPosition = () => {
      const groupWidth = getGroupWidth();
      if (!groupWidth) return;
      if (scrollPosition < groupWidth * 0.5) scrollPosition += groupWidth;
      if (scrollPosition >= groupWidth * 1.5) scrollPosition -= groupWidth;
    };

    const centerRail = () => {
      const groupWidth = getGroupWidth();
      if (!groupWidth) return;
      if (rail.scrollLeft === 0) rail.scrollLeft = groupWidth;
      scrollPosition = rail.scrollLeft;
    };

    const tick = (now: number) => {
      const elapsed = Math.min(48, now - previousTime);
      previousTime = now;
      const shouldMove =
        isVisible &&
        !document.hidden &&
        !reducedMotion.matches &&
        !railInteractingRef.current &&
        !panelOpenRef.current;
      const targetVelocity = shouldMove ? AUTO_SCROLL_SPEED : 0;
      const response = 1 - Math.exp(-elapsed / 180);
      velocity += (targetVelocity - velocity) * response;

      if (railInteractingRef.current) scrollPosition = rail.scrollLeft;
      normalizeScrollPosition();
      if (Math.abs(velocity) > 0.01) {
        scrollPosition += (velocity * elapsed) / 1000;
      }
      rail.scrollLeft = scrollPosition;
      frame = window.requestAnimationFrame(tick);
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    const resizeObserver = new ResizeObserver(centerRail);

    centerRail();
    visibilityObserver.observe(rail);
    resizeObserver.observe(firstGroup);
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || displayedIndex === null) return;

    const measurePanel = () => {
      setPanelHeight(Math.ceil(Math.max(panel.offsetHeight, panel.scrollHeight)));
    };

    measurePanel();
    const observer = new ResizeObserver(measurePanel);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [displayedIndex]);

  const detailStageStyle = panelHeight
    ? ({ "--panel-height": `${panelHeight}px` } as DetailStageStyle)
    : undefined;

  return (
    <section
      className="organization-showcase"
      aria-labelledby="organizations-title"
      onMouseLeave={closePanel}
      onBlur={handleSectionBlur}
      onKeyDown={(event) => {
        if (event.key === "Escape") closePanel();
      }}
    >
      <div className="page-shell organization-showcase__header">
        <p>Experience · Education · Programs · Certifications · Community</p>
        <h2 id="organizations-title">Organizations Along My Journey</h2>
        <p className="organization-showcase__intro">
          Explore the institutions that shaped my learning, work, and community journey.
        </p>
      </div>

      <div
        className="organization-showcase__rail"
        ref={railRef}
        aria-label="Organizations"
        onPointerDown={handleRailPointerDown}
        onPointerMove={handleRailPointerMove}
        onPointerUp={finishRailPointer}
        onPointerCancel={finishRailPointer}
        onClickCapture={handleRailClickCapture}
        onDragStart={(event) => event.preventDefault()}
        onWheel={handleRailWheel}
      >
        <div className="journey-marquee" ref={marqueeRef}>
          {[true, false, true].map((clone, groupIndex) => (
            <div
              className="journey-marquee__group"
              aria-hidden={clone ? "true" : undefined}
              key={clone ? `clone-${groupIndex}` : "primary"}
            >
              {visibleOrganizations.map((organization, index) => (
                <OrganizationTile
                  organization={organization}
                  index={index}
                  active={activeIndex === index}
                  clone={clone}
                  key={`${clone ? "clone-" : ""}${organization.name}`}
                  onIntent={scheduleOrganization}
                  onCancelIntent={cancelIntent}
                  onActivate={activateOrganization}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`page-shell organization-detail-stage${displayedOrganization ? " has-panel" : ""}`}
        style={detailStageStyle}
      >
        <p className={`organization-detail-stage__hint${displayedOrganization ? " is-hidden" : ""}`}>
          <span className="organization-detail-stage__hint-pointer">
            Drag the logos, or hover one to explore the relationship.
          </span>
          <span className="organization-detail-stage__hint-touch">
            Swipe the moving logos, then tap one to explore the relationship.
          </span>
        </p>

        {displayedOrganization ? (
          <article
            ref={panelRef}
            id="organization-detail-panel"
            className={`organization-detail-panel${isPanelOpen ? " is-open" : ""}`}
            style={getOrganizationStyle(displayedOrganization)}
            data-foreground={displayedOrganization.foreground}
            aria-live="polite"
            aria-hidden={!isPanelOpen}
          >
            <div className="organization-detail-panel__logo">
              <OrganizationLogo organization={displayedOrganization} color />
            </div>

            <div className="organization-detail-panel__copy">
              <span>{displayedOrganization.category}</span>
              <h3>{displayedOrganization.name}</h3>
              <strong>{displayedOrganization.relationship}</strong>
              <p>{displayedOrganization.journeyNote}</p>
              {displayedOrganization.url ? (
                <a
                  href={displayedOrganization.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  tabIndex={isPanelOpen ? 0 : -1}
                >
                  Visit organization <ArrowUpRight aria-hidden="true" size={16} />
                </a>
              ) : null}
            </div>

            <button
              type="button"
              className="organization-detail-panel__close"
              aria-label="Close organization details"
              tabIndex={isPanelOpen ? 0 : -1}
              onClick={closePanel}
            >
              <X aria-hidden="true" size={18} />
            </button>
          </article>
        ) : null}
      </div>
    </section>
  );
}
