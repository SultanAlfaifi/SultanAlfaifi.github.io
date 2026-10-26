import { Fragment } from "react";

// Lines like "مفتوح المصدر · v1.2.0 · Codex" join their parts with " · ". In a right-to-left paragraph the
// dot between two English parts fuses them into one left-to-right run and swaps their order, so each
// part is isolated (see .meta-part in app/rtl.css) and reads in the order it was written.
export function MetaParts({ text }: { text?: string }) {
  if (!text) return null;
  const parts = text.split(" · ");
  if (parts.length < 2) return <>{text}</>;
  // One wrapper, so a flex parent (like .work-status) sees a single line of text, not loose parts.
  return (
    <span>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index ? " · " : null}
          <span className="meta-part">{part}</span>
        </Fragment>
      ))}
    </span>
  );
}
