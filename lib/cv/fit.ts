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
