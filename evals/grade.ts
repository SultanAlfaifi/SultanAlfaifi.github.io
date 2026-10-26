// Deterministic grading for the agent evals. No model judges another model here: every check is a
// regex, a tool name, an anchor, or a language ratio, so a failure always says exactly what went wrong.

export type EvalQuestion = {
  id: string;
  lang: "en" | "ar";
  category: string;
  question: string;
  includeAll?: string[][];
  exclude?: string[];
  cite?: string[];
  citeAny?: boolean;
  tool?: string;
  idk?: boolean;
  fitIncludeAll?: string[][];
  fitExclude?: string[];
};

export type EvalRun = {
  answer: string;
  tools: string[];
  sources: string[];
  removedLinks: string[];
  fitText: string;
  error: string | null;
};

const IDK = /ask sultan|اسأل سلطان|ما أعرف|i don't know|not on (this|the) site|مو موجود/i;

export function arabicShare(text: string) {
  const letters = text.replace(/\[[^\]]*\]\([^)]*\)/g, " ").match(/\p{L}/gu) ?? [];
  if (!letters.length) return 0;
  return letters.filter((letter) => /[\u0600-\u06ff]/.test(letter)).length / letters.length;
}

export function grade(question: EvalQuestion, run: EvalRun) {
  const failures: string[] = [];
  const test = (pattern: string, text: string) => new RegExp(pattern, "iu").test(text);
  if (run.error) failures.push(`error: ${run.error}`);
  if (!run.answer.trim() && !run.fitText) failures.push("empty answer");

  const share = arabicShare(run.answer);
  if (run.answer.trim()) {
    if (question.lang === "ar" && share < 0.5) failures.push(`expected Arabic, got ${Math.round(share * 100)}% Arabic letters`);
    if (question.lang === "en" && share > 0.1) failures.push(`expected English, got ${Math.round(share * 100)}% Arabic letters`);
  }
  const searchable = `${run.answer}\n${run.fitText}`;
  for (const group of question.includeAll ?? []) {
    if (!group.some((pattern) => test(pattern, searchable))) failures.push(`missing: ${group.join(" | ")}`);
  }
  for (const pattern of question.exclude ?? []) {
    if (test(pattern, run.answer)) failures.push(`must not say: ${pattern}`);
  }
  for (const group of question.fitIncludeAll ?? []) {
    if (!group.some((pattern) => test(pattern, run.fitText))) failures.push(`fit report missing: ${group.join(" | ")}`);
  }
  for (const pattern of question.fitExclude ?? []) {
    if (run.fitText && test(pattern, run.fitText)) failures.push(`fit report must not say: ${pattern}`);
  }
  if (question.cite?.length && !question.cite.some((anchor) => run.sources.includes(anchor))) {
    failures.push(`no citation to ${question.cite.map((anchor) => `#${anchor}`).join(" or ")} (cited: ${run.sources.map((anchor) => `#${anchor}`).join(", ") || "none"})`);
  }
  if (question.citeAny && !run.sources.length) failures.push("persuasion without a single cited source");
  if (question.tool && !run.tools.includes(question.tool)) failures.push(`expected tool ${question.tool} (ran: ${run.tools.join(", ") || "none"})`);
  if (question.idk && !IDK.test(run.answer)) failures.push("should say it doesn't know and point to Sultan");
  if (run.removedLinks.length) failures.push(`linked ${run.removedLinks.length} place(s) that aren't on the site: ${run.removedLinks.join(", ")}`);
  return { passed: failures.length === 0, failures };
}
