import type { Metadata } from "next";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";

// Published eval results for the console agent, failures included. Built at deploy time from
// evals/results/latest.json, which `npm run evals` writes after a live run.

export const metadata: Metadata = {
  title: "How the console agent is tested | Sultan Alfaifi",
  description: "Every question the portfolio's AI assistant is tested on, what a good answer must contain, and every failure from the latest run.",
  alternates: { canonical: "/agent-evals/" }
};

type Result = {
  id: string;
  lang: "en" | "ar";
  category: string;
  question: string;
  passed: boolean;
  failures: string[];
  answer: string;
  trace: string[];
  sources: string[];
  ms: number;
};

type Report = {
  runAt: string;
  mode: "live" | "mock";
  model: string;
  knowledge: string;
  totals: { passed: number; failed: number; total: number };
  byCategory: Record<string, { passed: number; total: number }>;
  costUsd: number;
  results: Result[];
};

type Question = { id: string; lang: "en" | "ar"; category: string; question: string };

function load<T>(file: string): T | null {
  const full = path.resolve(file);
  return existsSync(full) ? (JSON.parse(readFileSync(full, "utf8")) as T) : null;
}

export default function AgentEvalsPage() {
  // Only a run against the real model is published; mock runs check the harness and stay local.
  const saved = load<Report>("evals/results/latest.json");
  const report = saved?.mode === "live" ? saved : null;
  const questions = load<{ questions: Question[] }>("evals/questions.json")?.questions ?? [];
  const failed = report?.results.filter((result) => !result.passed) ?? [];
  const passed = report?.results.filter((result) => result.passed) ?? [];

  return (
    <main id="main-content" className="evals-page">
      <div className="page-shell">
        <p className="evals-page__back"><Link href="/#runtime">← Back to the console</Link> · <Link href="/ar/#runtime">العودة للطرفية</Link></p>
        <h1>How the console agent is tested</h1>
        <p className="evals-page__lede">
          The AI assistant in the console answers only from this site, cites where each fact lives, says “I don’t know, ask Sultan” when the site doesn’t say,
          and refuses prompt injection and off-topic requests. These {questions.length} English and Arabic questions check that. Grading is deterministic:
          required facts, forbidden claims, cited anchors, the tool that should run, and the answer’s language. Failures stay on this page.
        </p>
        <p className="evals-page__lede" lang="ar" dir="rtl">
          هذه الأسئلة تختبر المساعد الذكي في الطرفية: هل يجيب من الموقع فقط، ويستشهد بمكان المعلومة، ويقول «ما أعرف، اسأل سلطان» إذا ما كانت موجودة، ويرفض محاولات التلاعب والأسئلة الخارجة عن الموضوع. والنتائج منشورة كما هي، والإخفاقات معها.
        </p>

        {report ? (
          <section className="evals-summary" aria-label="Latest run">
            <p className="evals-summary__score"><strong>{report.totals.passed}</strong> of {report.totals.total} passed</p>
            <dl>
              <div><dt>Run</dt><dd>{new Date(report.runAt).toUTCString()}</dd></div>
              <div><dt>Model</dt><dd>{report.model}</dd></div>
              <div><dt>Knowledge version</dt><dd>{report.knowledge}</dd></div>
              <div><dt>Cost of the run</dt><dd>${report.costUsd.toFixed(4)}</dd></div>
            </dl>
            <table>
              <caption>By category</caption>
              <thead><tr><th scope="col">Category</th><th scope="col">Passed</th></tr></thead>
              <tbody>{Object.entries(report.byCategory).map(([category, score]) => <tr key={category}><th scope="row">{category}</th><td>{score.passed} / {score.total}</td></tr>)}</tbody>
            </table>
          </section>
        ) : (
          <section className="evals-summary" aria-label="Latest run">
            <p className="evals-summary__score">No live run is published yet.</p>
            <p>The questions are below. Results appear here after the first run against the live model.</p>
          </section>
        )}

        {report ? (
          <>
            <h2>Failures ({failed.length})</h2>
            {failed.length ? failed.map((result) => <ResultCard key={result.id} result={result} />) : <p>None in this run.</p>}
            <h2>Passes ({passed.length})</h2>
            {passed.map((result) => <ResultCard key={result.id} result={result} />)}
          </>
        ) : (
          <>
            <h2>Questions</h2>
            <ol className="evals-questions">
              {questions.map((question) => (
                <li key={question.id}><span className="evals-tag">{question.category}</span> <span lang={question.lang} dir="auto">{question.question}</span></li>
              ))}
            </ol>
          </>
        )}
      </div>
    </main>
  );
}

function ResultCard({ result }: { result: Result }) {
  return (
    <article className={`evals-result${result.passed ? "" : " evals-result--failed"}`} aria-labelledby={`eval-${result.id}`}>
      <h3 id={`eval-${result.id}`}>
        <span className="evals-badge">{result.passed ? "PASS" : "FAIL"}</span> {result.id} <span className="evals-tag">{result.category}</span>
      </h3>
      <p className="evals-result__question" lang={result.lang} dir="auto">{result.question}</p>
      {result.failures.length ? <ul className="evals-result__failures">{result.failures.map((failure) => <li key={failure}>{failure}</li>)}</ul> : null}
      <details>
        <summary>Answer and trace</summary>
        <p className="evals-result__answer" lang={result.lang} dir="auto">{result.answer || "(no text answer)"}</p>
        <ul className="evals-result__trace" dir="auto">{result.trace.map((line, index) => <li key={index}>{line}</li>)}</ul>
        <p className="evals-result__meta">Sources: {result.sources.map((anchor) => `#${anchor}`).join(", ") || "none"} · {(result.ms / 1000).toFixed(1)} s</p>
      </details>
    </article>
  );
}
