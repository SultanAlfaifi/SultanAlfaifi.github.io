import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const library = await import("../data/cv.ts");
const { getContent } = await import("../data/i18n.ts");
const { buildAnchors } = await import("../lib/agent/anchors.ts");
const { buildCvDocument } = await import("../lib/cv/document.ts");
const { fitToOnePage } = await import("../lib/cv/fit.ts");
const { renderCvBuffer } = await import("../lib/cv/node-render.ts");
const { cvLibrary, decodeSelection, encodeSelection, resolveSelection, selectForTarget, selectForText, validateSelection } = await import("../lib/cv/select.ts");

const siteText = ["../data/portfolio.ts", "../data/ui.ts"].map((file) => readFileSync(new URL(file, import.meta.url), "utf8")).join("\n");
const allLines = () => [
  ...Object.values(library.cvSummaries),
  ...library.cvSkills,
  ...library.cvEntries.flatMap((entry) => entry.bullets),
  ...library.cvRecognition,
  library.cvEducation,
  ...library.cvTraining,
  ...library.cvTeaching
];

async function pagesOf(selection) {
  let pages = 0;
  const buffer = await renderCvBuffer(buildCvDocument(resolveSelection(selection), "footer", (count) => { pages = Math.max(pages, count); }));
  return { pages, pdf: Buffer.from(buffer).toString("latin1") };
}

test("every number in a CV line is published on the site", () => {
  for (const line of allLines()) {
    for (const number of line.text.match(/\d[\d,.]*\d|\d/g) ?? []) {
      assert.ok(siteText.includes(number) || siteText.includes(number.replace(/,/g, "")), `${line.id}: "${number}" isn't on the site`);
    }
  }
});

test("every CV line points at a real page anchor", () => {
  const anchors = new Set(buildAnchors(getContent("en"), getContent("ar")).map((anchor) => anchor.id));
  for (const line of [...allLines(), ...library.cvEntries]) assert.ok(anchors.has(line.source), `${line.id}: unknown source #${line.source}`);
});

test("IDs are unique and limited to safe characters", () => {
  const ids = [...allLines(), ...library.cvEntries].map((line) => line.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
});

test("the general CV and every field fit on one page", async () => {
  for (const target of ["general", ...library.CV_FIELDS]) {
    const { selection } = await fitToOnePage(selectForTarget(target), "Tailored for a very long company name on 26 Oct 2026 from verified data at sultalfaifi.com", renderCvBuffer);
    assert.equal((await pagesOf(selection)).pages, 1, target);
  }
});

test("even the largest selection the server accepts is trimmed to one page", async () => {
  const lib = cvLibrary();
  const projects = [...lib.entries.values()].filter((entry) => entry.section === "projects").slice(0, 5);
  const biggest = {
    target: "teaching",
    summaryId: "sum-teaching",
    skillIds: [...lib.skills.keys()],
    experience: [{ entryId: "exp-salla", bulletIds: library.cvEntries[0].bullets.map((bullet) => bullet.id) }],
    projects: projects.map((entry) => ({ entryId: entry.id, bulletIds: entry.bullets.slice(0, 3).map((bullet) => bullet.id) })),
    recognitionIds: [...lib.recognition.keys()].slice(0, 5),
    trainingIds: [...lib.training.keys()].slice(0, 4),
    teachingIds: [...lib.teaching.keys()]
  };
  assert.ok(validateSelection(biggest).ok);
  assert.ok((await pagesOf(biggest)).pages > 1, "the worst case really overflows before trimming");
  const { selection, trimmed } = await fitToOnePage(biggest, "footer", renderCvBuffer);
  assert.ok(trimmed > 0);
  assert.equal((await pagesOf(selection)).pages, 1);
});

test("the PDF is real text with clickable links (ATS can read it)", async () => {
  const { selection } = await fitToOnePage(selectForTarget("general"), "footer", renderCvBuffer);
  const { pdf, pages } = await pagesOf(selection);
  assert.equal(pages, 1);
  assert.match(pdf, /\/ToUnicode/);
  assert.match(pdf, /IBMPlexSansArabic/);
  assert.ok((pdf.match(/\/URI \(/g) ?? []).length >= 8, "header, email, and project links are clickable");
  assert.doesNotMatch(pdf, /\/Subtype \/Image/, "no images");
});

test("selections from outside the library are rejected", () => {
  const good = selectForTarget("backend");
  assert.ok(validateSelection(good).ok);
  const invented = structuredClone(good);
  invented.projects[0].bulletIds.push("prj-invented-claim");
  assert.equal(validateSelection(invented).ok, false);
  const borrowed = structuredClone(good);
  borrowed.projects[0].bulletIds = ["exp-salla-tests"];
  assert.match(validateSelection(borrowed).errors.join(" "), /does not belong/);
  const tooMany = structuredClone(good);
  tooMany.recognitionIds = [...cvLibrary().recognition.keys(), "rec-kaust"];
  assert.equal(validateSelection(tooMany).ok, false);
});

test("pulling a line with approved: false removes it from what the server accepts", () => {
  const bullet = library.cvEntries[1].bullets[0];
  bullet.approved = false;
  try {
    assert.equal(cvLibrary().bullets.has(bullet.id), false);
    const selection = selectForTarget("ai-agents");
    assert.ok(!JSON.stringify(selection).includes(bullet.id));
  } finally {
    bullet.approved = true;
  }
});

test("CV links round-trip and reject anything odd", () => {
  for (const target of ["general", ...library.CV_FIELDS]) {
    const selection = selectForTarget(target);
    const encoded = encodeSelection(selection);
    assert.match(encoded, /^[a-z0-9~._-]+$/);
    assert.deepEqual(decodeSelection(encoded), selection);
  }
  assert.equal(decodeSelection("backend~<script>~~~~~~"), null);
  assert.equal(decodeSelection("backend~sum-backend~skl-backend~exp-salla.exp-salla-fake~~~~"), null);
});

test("a pasted job description picks the closest field without any AI", () => {
  const { selection, matched } = selectForText("Backend engineer to build Laravel REST APIs on MySQL with tests and Docker.");
  assert.equal(selection.target, "backend");
  assert.ok(matched.includes("laravel"));
  assert.equal(selectForText("We sell flowers.").selection.target, "general");
});
