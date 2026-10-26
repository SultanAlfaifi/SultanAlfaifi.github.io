import type { Env } from "./env";
import { KNOWLEDGE_VERSION } from "./generated/knowledge";

// What we keep about a question: its text (first 500 characters), the page language, which tools ran,
// and how it ended. No IP, email, session, or answer. Rows are deleted after 30 days.
export async function logQuestion(env: Env, entry: { locale: string; question: string; tools: string[]; outcome: string }) {
  await env.DB.prepare("INSERT INTO questions (id, created_at, locale, question, tools, outcome, knowledge_version, model) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")
    .bind(crypto.randomUUID(), Date.now(), entry.locale, entry.question.slice(0, 500), [...new Set(entry.tools)].join(","), entry.outcome, KNOWLEDGE_VERSION, env.MODEL)
    .run();
}
