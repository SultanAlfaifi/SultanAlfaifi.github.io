// Regrades the recorded answers in evals/results/latest.json with the current checks, without calling
// the model, and prints any verdict that would change. It never rewrites the published run.
//   npx tsx evals/regrade.ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import { grade, type EvalQuestion } from "./grade";

type Recorded = {
  id: string;
  passed: boolean;
  answer: string;
  tools: string[];
  sources: string[];
  removedLinks: string[];
  error: string | null;
  fitReport: { summary?: string; strong?: { point: string }[]; partial?: { point: string }[]; gaps?: { point: string; plan: string }[] } | null;
};

async function main() {
  const report = JSON.parse(await readFile(path.resolve("evals/results/latest.json"), "utf8")) as { results: Recorded[] };
  const { questions } = JSON.parse(await readFile(path.resolve("evals/questions.json"), "utf8")) as { questions: EvalQuestion[] };
  let changed = 0;
  for (const result of report.results) {
    const question = questions.find((item) => item.id === result.id);
    if (!question) continue;
    const fit = result.fitReport;
    const fitText = fit ? [fit.summary, ...(fit.strong ?? []).map((item) => item.point), ...(fit.partial ?? []).map((item) => item.point), ...(fit.gaps ?? []).map((gap) => `${gap.point} ${gap.plan}`)].join("\n") : "";
    const verdict = grade(question, { answer: result.answer, tools: result.tools, sources: result.sources, removedLinks: result.removedLinks, fitText, error: result.error });
    if (verdict.passed !== result.passed) {
      changed += 1;
      console.log(`${result.id}: ${result.passed ? "PASS" : "FAIL"} → ${verdict.passed ? "PASS" : "FAIL"} ${verdict.failures.join("; ")}`);
    }
  }
  console.log(`${changed} verdict(s) would change under the current checks.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
