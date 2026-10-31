// The gate line under the headline's يستأذنونك / "ask": dashes while the agent waits for the visitor, a
// solid line of living light when they approve, dimmed when they say "not now" (data-gate on the hero).
// Two layers, so each change is a transform: the dashes march on their own strip, and the light draws
// over them from the inline start. Decorative: the run card's status line says what happened.
export function GateMark() {
  return (
    <span className="gate-line" aria-hidden="true">
      <span className="gate-line__dashes" />
      <span className="gate-line__light" />
    </span>
  );
}
