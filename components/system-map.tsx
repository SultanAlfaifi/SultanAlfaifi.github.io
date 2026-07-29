"use client";

import { useRef } from "react";

const nodes = [
  { label: "Interface", detail: "Human intent" },
  { label: "Backend", detail: "Business logic" },
  { label: "APIs", detail: "Tool contracts" },
  { label: "Data", detail: "Context + state" },
  { label: "AI Agents", detail: "Reason + act" }
];

export function SystemMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const element = mapRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    element.style.setProperty("--pointer-x", x.toFixed(3));
    element.style.setProperty("--pointer-y", y.toFixed(3));
  }

  function resetPointer() {
    const element = mapRef.current;
    if (!element) return;
    element.style.setProperty("--pointer-x", "0");
    element.style.setProperty("--pointer-y", "0");
  }

  return (
    <div
      ref={mapRef}
      className="system-map"
      aria-label="Architecture flow from interface to AI agents"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div className="system-map__meta" aria-hidden="true">
        <span>SYS.MAP / 01</span>
        <span>END-TO-END PRODUCT FLOW</span>
      </div>
      <div className="system-map__grid" aria-hidden="true" />
      <ol className="system-map__nodes">
        {nodes.map((node, index) => (
          <li
            key={node.label}
            className="system-map__node"
            style={{ "--node-index": index } as React.CSSProperties}
          >
            <span className="system-map__index">0{index + 1}</span>
            <span className="system-map__dot" />
            <span className="system-map__label">{node.label}</span>
            <span className="system-map__detail">{node.detail}</span>
            {index < nodes.length - 1 ? (
              <span className="system-map__route" aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
      <p className="system-map__status">
        <span aria-hidden="true" />
        System ready
      </p>
    </div>
  );
}
