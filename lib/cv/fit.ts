import type { CvTarget } from "../../data/cv";
import { resolveSelection, trimSelection, type CvSelection } from "./select";
import { buildCvDocument, type CvDocument } from "./document";

// Renders, counts pages, and drops the least relevant line until the CV fits on one page.
// `render` is the only environment-specific part: pdfmake in Node at build time, or in the browser.
export async function fitToOnePage<T>(
  selection: CvSelection,
  footerText: string,
  render: (document: CvDocument) => Promise<T>,
  maxSteps = 24
): Promise<{ selection: CvSelection; output: T; trimmed: number }> {
  let current = selection;
  for (let step = 0; step <= maxSteps; step += 1) {
    let pages = 0;
    const document = buildCvDocument(resolveSelection(current), footerText, (count) => { pages = Math.max(pages, count); });
    const output = await render(document);
    if (pages <= 1) return { selection: current, output, trimmed: step };
    const next = trimSelection(current);
    if (!next) break;
    current = next;
  }
  throw new Error("The CV doesn't fit on one page even at its minimum; shorten lines in data/cv.ts.");
}

export function cvDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Riyadh" }).format(date);
}

export function generalFooter(date: string) {
  return `Generated on ${date} from verified data at sultalfaifi.com`;
}

// The footer names the field in plain English when the visitor gave a role.
export const CV_FIELD_FOOTERS: Record<Exclude<CvTarget, "general">, string> = {
  backend: "back-end roles",
  "ai-agents": "AI agent and LLM roles",
  "full-stack": "full-stack roles",
  ml: "machine learning roles",
  teaching: "teaching and community roles"
};

// "Prepared for Salla" when the visitor named the company. The PDF font has no Arabic shaping, so a name
// written in Arabic is left off the page rather than printed broken; the field stands in for it.
export function preparedFooter(date: string, company: string, target: CvTarget) {
  const name = company.trim().slice(0, 60);
  const printable = name && !/\p{Script=Arabic}/u.test(name) ? name : "";
  const label = printable || (target === "general" ? "" : CV_FIELD_FOOTERS[target]);
  return label ? `Prepared for ${label} on ${date} from verified data at sultalfaifi.com` : generalFooter(date);
}
