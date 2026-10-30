// The gate tick: a lime ring that closes around a check. It sits beside the headline's gate phrase and
// only shows once the visitor approves (data-gate="approved" on the hero). It keeps its space while
// hidden, so the headline never shifts when it lands. Decorative: the run card's status line says it.
export function GateMark() {
  return (
    <svg className="gate-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle className="gate-mark__ring" cx="12" cy="12" r="10" pathLength="1" />
      <path className="gate-mark__check" d="M7.5 12.4l3 3 6-6.6" pathLength="1" />
    </svg>
  );
}
