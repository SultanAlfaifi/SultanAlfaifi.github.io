// Builds the general one-page CV into public/cv/ so it downloads instantly, with no form and no JavaScript.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cvDate, fitToOnePage, generalFooter } from "../lib/cv/fit";
import { renderCvBuffer } from "../lib/cv/node-render";
import { selectForTarget } from "../lib/cv/select";

const OUTPUT = path.resolve("public/cv/Sultan-Alfaifi-CV.pdf");

async function main() {
  const date = cvDate();
  const { output, trimmed } = await fitToOnePage(selectForTarget("general"), generalFooter(date), renderCvBuffer);
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, output);
  console.log(`General CV → ${path.relative(process.cwd(), OUTPUT)} (1 page${trimmed ? `, ${trimmed} lines trimmed to fit` : ""}, ${Math.round(output.byteLength / 1024)} KB)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
