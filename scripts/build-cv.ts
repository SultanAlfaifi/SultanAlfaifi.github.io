// Builds the general one-page CV into public/cv/ so it downloads instantly, with no form and no JavaScript.
// It also records which lines each field's CV keeps once it fits on one page, so the preview on the site
// shows exactly what the PDF holds before any PDF code loads in the browser.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CV_FIELDS, type CvTarget } from "../data/cv";
import { cvDate, fitToOnePage, generalFooter } from "../lib/cv/fit";
import { renderCvBuffer } from "../lib/cv/node-render";
import { encodeSelection, selectForTarget } from "../lib/cv/select";

const OUTPUT = path.resolve("public/cv/Sultan-Alfaifi-CV.pdf");
const FITTED = path.resolve("public/cv/fitted.json");

async function main() {
  const date = cvDate();
  const { output, trimmed } = await fitToOnePage(selectForTarget("general"), generalFooter(date), renderCvBuffer);
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, output);
  console.log(`General CV → ${path.relative(process.cwd(), OUTPUT)} (1 page${trimmed ? `, ${trimmed} lines trimmed to fit` : ""}, ${Math.round(output.byteLength / 1024)} KB)`);

  // The footer sits in the page margin, so the visitor's company name never changes what fits.
  const fitted: Partial<Record<CvTarget, string>> = {};
  for (const target of ["general", ...CV_FIELDS] as CvTarget[]) {
    fitted[target] = encodeSelection((await fitToOnePage(selectForTarget(target), generalFooter(date), renderCvBuffer)).selection);
  }
  await writeFile(FITTED, `${JSON.stringify(fitted, null, 2)}\n`);
  console.log(`Fitted selections → ${path.relative(process.cwd(), FITTED)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
