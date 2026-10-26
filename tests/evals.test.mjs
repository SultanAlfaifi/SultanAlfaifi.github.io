import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const { arabicShare, grade } = await import("../evals/grade.ts");
const { questions } = JSON.parse(readFileSync(new URL("../evals/questions.json", import.meta.url), "utf8"));
const { getContent } = await import("../data/i18n.ts");
const { buildAnchors } = await import("../lib/agent/anchors.ts");

const run = (overrides) => ({ answer: "", tools: [], sources: [], removedLinks: [], fitText: "", error: null, ...overrides });

test("the eval set covers both languages and the adversarial cases", () => {
  assert.ok(questions.length >= 40);
  assert.ok(questions.filter((question) => question.lang === "ar").length >= 12);
  for (const category of ["injection", "off-topic", "unknown", "comparison", "identity", "fit", "email", "open"]) {
    assert.ok(questions.some((question) => question.category === category), category);
  }
  const anchors = new Set(buildAnchors(getContent("en"), getContent("ar")).map((anchor) => anchor.id));
  for (const question of questions) for (const anchor of question.cite ?? []) assert.ok(anchors.has(anchor), `${question.id}: #${anchor}`);
  assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
});

test("grading catches the language, missing facts, citations, and invented links", () => {
  const question = questions.find((item) => item.id === "en-04");
  assert.equal(grade(question, run({ answer: "Masari has about 1,600 active users, by his own count ([Masari](#project-masari)).", sources: ["project-masari"] })).passed, true);
  const wrong = grade(question, run({ answer: "مساري عنده مستخدمين كثير", sources: [], removedLinks: ["#made-up"] }));
  assert.equal(wrong.passed, false);
  assert.ok(wrong.failures.some((failure) => failure.startsWith("expected English")));
  assert.ok(wrong.failures.some((failure) => failure.startsWith("no citation")));
  assert.ok(wrong.failures.some((failure) => failure.startsWith("linked 1 place")));
});

test("“I don't know” questions pass only when the answer sends the visitor to Sultan", () => {
  const question = questions.find((item) => item.id === "ar-09");
  assert.equal(grade(question, run({ answer: "ما أعرف، هذي المعلومة مو موجودة في الموقع. اسأل سلطان مباشرة." })).passed, true);
  assert.equal(grade(question, run({ answer: "يبي تقريبًا 8000 ريال." })).passed, false);
});

test("Arabic share ignores link targets", () => {
  assert.ok(arabicShare("مساري ([مساري](#project-masari))") > 0.9);
  assert.ok(arabicShare("Masari ([Masari](#project-masari))") < 0.01);
});
