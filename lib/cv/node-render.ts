// Node-only CV rendering for the build and the tests. The browser uses lib/cv/browser-render.ts.
import path from "node:path";
import pdfmake from "pdfmake";
import { CV_FONT, CV_FONT_FILES, type CvDocument } from "./document";

const FONT_DIR = path.resolve("public/fonts/cv");
let configured = false;

function configure() {
  if (configured) return;
  pdfmake.setFonts({ [CV_FONT]: Object.fromEntries(Object.entries(CV_FONT_FILES).map(([style, file]) => [style, path.join(FONT_DIR, file)])) });
  pdfmake.setUrlAccessPolicy(() => false);
  pdfmake.setLocalAccessPolicy?.((file) => path.resolve(file).startsWith(FONT_DIR));
  configured = true;
}

export async function renderCvBuffer(document: CvDocument): Promise<Uint8Array> {
  configure();
  return pdfmake.createPdf(document).getBuffer();
}
