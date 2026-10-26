"use client";

import { useSyncExternalStore } from "react";

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Riyadh",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

function subscribe(callback: () => void) {
  const id = window.setInterval(callback, 10_000);
  return () => window.clearInterval(id);
}

const getSnapshot = () => formatter.format(new Date());
const getServerSnapshot = () => null;

export function LiveClock({ place, zone = "AST", zoneTitle = "Arabia Standard Time" }: { place: string; zone?: string; zoneTitle?: string }) {
  const time = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <p className="live-clock">
      <span className="live-clock__dot" aria-hidden="true" />
      <span>
        {place}
        {time ? <> · <time dir="ltr">{time}</time> <abbr title={zoneTitle}>{zone}</abbr></> : null}
      </span>
    </p>
  );
}
