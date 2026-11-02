import { readFileSync } from "node:fs";
import path from "node:path";

// Build time only (components/home-page.tsx, a server component): the lines each field's CV keeps once it
// fits on one page, as scripts/build-cv.ts wrote them to public/cv/fitted.json. Handing them to the CV
// chapter's first render means the paper in the server HTML already fits, with or without JavaScript.
// Before the first `npm run cv` the file is missing, and the chapter falls back to its own fetch.
export function readFittedCv(): Record<string, string> {
  try {
    const data = JSON.parse(readFileSync(path.join(process.cwd(), "public", "cv", "fitted.json"), "utf8")) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(data).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  } catch {
    return {};
  }
}
