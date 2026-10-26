// Builds the tailored CV in the visitor's browser with pdfmake, the same engine Masari uses.
// pdfmake (~1 MB) and the two font files load only when someone asks for a tailored PDF.
import { CV_FONT, CV_FONT_FILES } from "./document";
import { fitToOnePage } from "./fit";
import type { CvSelection } from "./select";

let engine: Promise<PdfMakeInstance> | null = null;

function loadEngine() {
  engine ??= import("pdfmake/build/pdfmake").then((module) => {
    const pdfmake = ((module as { default?: PdfMakeInstance }).default ?? module) as PdfMakeInstance;
    const base = new URL("/fonts/cv/", window.location.origin).href;
    pdfmake.setFonts({ [CV_FONT]: Object.fromEntries(Object.entries(CV_FONT_FILES).map(([style, file]) => [style, base + file])) });
    // Fonts come from this site only; nothing else may be fetched while rendering.
    pdfmake.setUrlAccessPolicy((url) => url.startsWith(base));
    return pdfmake;
  }).catch((error) => {
    engine = null;
    throw error;
  });
  return engine;
}

export async function renderCvPdf(selection: CvSelection, footer: string) {
  const pdfmake = await loadEngine();
  return fitToOnePage(selection, footer, (document) => pdfmake.createPdf(document).getBlob());
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
