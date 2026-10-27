// Picks, validates, and trims CV lines. Shared by the browser, the build script, and the Worker,
// so it uses relative imports only. Nothing here writes text: it only chooses library IDs.
import {
  CV_FIELDS,
  cvEducation,
  cvEntries,
  cvHeader,
  cvRecognition,
  cvSkills,
  cvSummaries,
  cvTeaching,
  cvTraining,
  type CvEntry,
  type CvLine,
  type CvTarget
} from "../../data/cv";

export const CV_LIMITS = { skills: 7, experienceBullets: 4, projects: 5, bulletsPerProject: 3, recognition: 5, training: 4, teaching: 3 } as const;

export type CvSelection = {
  target: CvTarget;
  summaryId: string;
  skillIds: string[];
  experience: { entryId: string; bulletIds: string[] }[];
  projects: { entryId: string; bulletIds: string[] }[];
  recognitionIds: string[];
  trainingIds: string[];
  teachingIds: string[];
};

export type ResolvedCv = {
  header: typeof cvHeader;
  target: CvTarget;
  summary: CvLine;
  skills: CvLine[];
  experience: { entry: CvEntry; bullets: CvLine[] }[];
  projects: { entry: CvEntry; bullets: CvLine[] }[];
  recognition: CvLine[];
  education: CvLine;
  training: CvLine[];
  teaching: CvLine[];
};

const approved = <T extends { approved: boolean }>(items: T[]) => items.filter((item) => item.approved);
const score = (line: { relevance: Partial<Record<CvTarget, number>> }, target: CvTarget) => line.relevance[target] ?? 0;
const byRelevance = <T extends { relevance: Partial<Record<CvTarget, number>> }>(items: T[], target: CvTarget) =>
  items.map((item, index) => ({ item, index })).sort((a, b) => score(b.item, target) - score(a.item, target) || a.index - b.index).map(({ item }) => item);

export function isCvTarget(value: unknown): value is CvTarget {
  return value === "general" || CV_FIELDS.includes(value as never);
}

// Every ID the server will accept, by kind.
export function cvLibrary() {
  const entries = approved(cvEntries);
  return {
    summaries: new Map(Object.values(cvSummaries).filter((line) => line.approved).map((line) => [line.id, line])),
    skills: new Map(approved(cvSkills).map((line) => [line.id, line])),
    entries: new Map(entries.map((entry) => [entry.id, entry])),
    bullets: new Map(entries.flatMap((entry) => approved(entry.bullets).map((bullet) => [bullet.id, { bullet, entryId: entry.id }] as const))),
    recognition: new Map(approved(cvRecognition).map((line) => [line.id, line])),
    training: new Map(approved(cvTraining).map((line) => [line.id, line])),
    teaching: new Map(approved(cvTeaching).map((line) => [line.id, line]))
  };
}

export function selectForTarget(target: CvTarget): CvSelection {
  const pickBullets = (entry: CvEntry, count: number) =>
    byRelevance(approved(entry.bullets), target).filter((bullet) => score(bullet, target) > 0).slice(0, count).map((bullet) => bullet.id);
  const experience = approved(cvEntries).filter((entry) => entry.section === "experience");
  const projects = byRelevance(approved(cvEntries).filter((entry) => entry.section === "projects"), target).filter((entry) => score(entry, target) > 0).slice(0, 4);
  const teachingCount = target === "teaching" ? 3 : target === "general" ? 1 : 0;
  return {
    target,
    summaryId: (cvSummaries[target].approved ? cvSummaries[target] : cvSummaries.general).id,
    skillIds: byRelevance(approved(cvSkills), target).filter((line) => score(line, target) > 0).slice(0, 5).map((line) => line.id),
    experience: experience.map((entry) => ({ entryId: entry.id, bulletIds: pickBullets(entry, 3) })),
    projects: projects.map((entry, index) => ({ entryId: entry.id, bulletIds: pickBullets(entry, index < 2 ? 2 : 1) })),
    recognitionIds: byRelevance(approved(cvRecognition), target).filter((line) => score(line, target) > 0).slice(0, 4).map((line) => line.id),
    trainingIds: byRelevance(approved(cvTraining), target).filter((line) => score(line, target) > 0).slice(0, 2).map((line) => line.id),
    teachingIds: byRelevance(approved(cvTeaching), target).filter((line) => score(line, target) >= 1).slice(0, teachingCount).map((line) => line.id)
  };
}

const TARGET_KEYWORDS: Record<Exclude<CvTarget, "general">, string[]> = {
  backend: ["laravel", "php", "mysql", "sql", "rest", "api", "apis", "backend", "back-end", "back end", "server", "database", "endpoint", "endpoints", "microservice", "microservices"],
  "ai-agents": ["agent", "agents", "agentic", "llm", "llms", "genai", "generative", "prompt", "openai", "claude", "rag", "orchestration", "nlp", "chatbot", "assistant", "tool use", "function calling"],
  "full-stack": ["full-stack", "fullstack", "full stack", "frontend", "front-end", "front end", "react", "javascript", "typescript", "ui", "web", "html", "css", "node"],
  ml: ["machine learning", "ml", "deep learning", "pytorch", "tensorflow", "computer vision", "model training", "data science", "pandas", "neural", "cnn"],
  teaching: ["teach", "teaching", "trainer", "workshop", "workshops", "mentor", "mentoring", "community", "devrel", "advocate", "instructor", "curriculum", "content"]
};

function keywordHits(text: string, keywords: string[]) {
  const haystack = ` ${text.toLowerCase().replace(/[^a-z0-9+#.\- ]+/g, " ")} `;
  return keywords.filter((keyword) => haystack.includes(` ${keyword} `) || haystack.includes(` ${keyword}s `));
}

// Arabic words a visitor might type for a role. Matched after stripping diacritics, so "تعلّم" and
// "تعلم" both count. English goes through TARGET_KEYWORDS.
const ARABIC_ROLE_WORDS: Record<Exclude<CvTarget, "general">, string[]> = {
  backend: ["باك", "خلفي", "خلفية", "خوادم", "قواعد البيانات"],
  "ai-agents": ["وكلاء", "وكيل", "ذكاء", "نماذج اللغة"],
  "full-stack": ["فل ستاك", "فول ستاك", "متكامل", "فرونت", "واجهات", "الويب"],
  ml: ["تعلم الآلة", "التعلم العميق", "رؤية حاسوبية", "علم البيانات"],
  teaching: ["تدريب", "مدرب", "تعليم", "مجتمع", "ورش"]
};

// The field a typed role points to, in English or Arabic; "general" when nothing matches.
export function roleTarget(role: string): CvTarget {
  const plain = role.normalize("NFC").replace(/\p{Mn}/gu, "");
  const hits = (Object.keys(TARGET_KEYWORDS) as Exclude<CvTarget, "general">[]).map((target) => ({
    target,
    count: keywordHits(plain, TARGET_KEYWORDS[target]).length + ARABIC_ROLE_WORDS[target].filter((word) => plain.includes(word)).length
  }));
  const best = hits.sort((a, b) => b.count - a.count)[0];
  return best.count ? best.target : "general";
}

// The no-AI path for a pasted job description: infer the closest field (unless the visitor named the
// role), then lift the projects and bullets whose wording overlaps the description.
export function selectForText(description: string, preferred?: CvTarget): { selection: CvSelection; matched: string[] } {
  const hits = Object.entries(TARGET_KEYWORDS).map(([target, keywords]) => ({ target: target as CvTarget, found: keywordHits(description, keywords) }));
  const best = [...hits].sort((a, b) => b.found.length - a.found.length)[0];
  const target: CvTarget = preferred && preferred !== "general" ? preferred : best && best.found.length ? best.target : "general";
  const matched = [...new Set(hits.flatMap((hit) => hit.found))];
  const base = selectForTarget(target);
  if (!matched.length) return { selection: base, matched };

  const overlap = (text: string) => keywordHits(text, matched).length;
  const library = cvLibrary();
  // The field's own ranking leads; wording that overlaps the description breaks ties.
  const projectScore = (entry: CvEntry) => score(entry, target) * 3 + score(entry, "general") + overlap(`${entry.title} ${entry.meta} ${entry.bullets.map((bullet) => bullet.text).join(" ")}`) * 0.75;
  const projects = [...library.entries.values()].filter((entry) => entry.section === "projects").sort((a, b) => projectScore(b) - projectScore(a)).slice(0, 4);
  return {
    matched,
    selection: {
      ...base,
      projects: projects.map((entry) => ({
        entryId: entry.id,
        bulletIds: approved(entry.bullets).sort((a, b) => score(b, target) * 2 + overlap(b.text) - (score(a, target) * 2 + overlap(a.text))).slice(0, 2).map((bullet) => bullet.id)
      }))
    }
  };
}

const unique = (ids: string[]) => new Set(ids).size === ids.length;

export function validateSelection(input: unknown): { ok: true; selection: CvSelection } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const library = cvLibrary();
  const value = (input ?? {}) as Partial<CvSelection>;
  const ids = (list: unknown, kind: string, known: Map<string, unknown>, max: number) => {
    if (!Array.isArray(list) || list.some((id) => typeof id !== "string")) {
      errors.push(`${kind} must be a list of IDs`);
      return [] as string[];
    }
    const typed = list as string[];
    typed.filter((id) => !known.has(id)).forEach((id) => errors.push(`unknown ${kind} ID: ${id}`));
    if (!unique(typed)) errors.push(`${kind} has duplicate IDs`);
    if (typed.length > max) errors.push(`${kind} allows at most ${max}`);
    return typed;
  };
  const groups = (list: unknown, section: CvEntry["section"], maxEntries: number, maxBullets: number) => {
    if (!Array.isArray(list)) {
      errors.push(`${section} must be a list`);
      return [];
    }
    if (list.length > maxEntries) errors.push(`${section} allows at most ${maxEntries} entries`);
    const seen = new Set<string>();
    return list.map((group: { entryId?: unknown; bulletIds?: unknown }) => {
      const entryId = typeof group?.entryId === "string" ? group.entryId : "";
      const entry = library.entries.get(entryId);
      if (!entry || entry.section !== section) errors.push(`unknown ${section} entry ID: ${entryId || "(missing)"}`);
      if (seen.has(entryId)) errors.push(`${section} entry repeated: ${entryId}`);
      seen.add(entryId);
      const bulletIds = ids(group?.bulletIds, `${entryId} bullet`, library.bullets, maxBullets);
      bulletIds.filter((id) => library.bullets.get(id)?.entryId !== entryId && library.bullets.has(id)).forEach((id) => errors.push(`bullet ${id} does not belong to ${entryId}`));
      return { entryId, bulletIds };
    });
  };

  if (!isCvTarget(value.target)) errors.push("unknown target");
  if (typeof value.summaryId !== "string" || !library.summaries.has(value.summaryId)) errors.push(`unknown summary ID: ${String(value.summaryId)}`);
  const selection: CvSelection = {
    target: isCvTarget(value.target) ? value.target : "general",
    summaryId: String(value.summaryId),
    skillIds: ids(value.skillIds, "skill", library.skills, CV_LIMITS.skills),
    experience: groups(value.experience, "experience", 1, CV_LIMITS.experienceBullets),
    projects: groups(value.projects, "projects", CV_LIMITS.projects, CV_LIMITS.bulletsPerProject),
    recognitionIds: ids(value.recognitionIds, "recognition", library.recognition, CV_LIMITS.recognition),
    trainingIds: ids(value.trainingIds, "training", library.training, CV_LIMITS.training),
    teachingIds: ids(value.teachingIds, "teaching", library.teaching, CV_LIMITS.teaching)
  };
  if (!selection.experience.length) errors.push("the experience entry is required");
  if (selection.projects.length < 2) errors.push("pick at least 2 projects");
  return errors.length ? { ok: false, errors } : { ok: true, selection };
}

export function resolveSelection(selection: CvSelection): ResolvedCv {
  const library = cvLibrary();
  const must = <T>(value: T | undefined, id: string): T => {
    if (value === undefined) throw new Error(`CV ID not in the approved library: ${id}`);
    return value;
  };
  const group = (items: CvSelection["projects"]) =>
    items.map(({ entryId, bulletIds }) => ({ entry: must(library.entries.get(entryId), entryId), bullets: bulletIds.map((id) => must(library.bullets.get(id), id).bullet) }));
  return {
    header: cvHeader,
    target: selection.target,
    summary: must(library.summaries.get(selection.summaryId), selection.summaryId),
    skills: selection.skillIds.map((id) => must(library.skills.get(id), id)),
    experience: group(selection.experience),
    projects: group(selection.projects),
    recognition: selection.recognitionIds.map((id) => must(library.recognition.get(id), id)),
    education: cvEducation,
    training: selection.trainingIds.map((id) => must(library.training.get(id), id)),
    teaching: selection.teachingIds.map((id) => must(library.teaching.get(id), id))
  };
}

// One step toward fitting a page: drop the least relevant optional line. Returns null when only the
// minimum CV is left (summary, education, the experience entry with 2 bullets, 2 projects with 1 bullet).
export function trimSelection(selection: CvSelection): CvSelection | null {
  const library = cvLibrary();
  const target = selection.target;
  type Candidate = { cost: number; apply: (next: CvSelection) => void };
  const candidates: Candidate[] = [];
  const line = (id: string, map: Map<string, CvLine>) => score(map.get(id) ?? { relevance: {} }, target);

  selection.teachingIds.forEach((id, index) => candidates.push({ cost: line(id, library.teaching) + (target === "teaching" ? 3 : 0) - index * 0.01, apply: (next) => { next.teachingIds = next.teachingIds.filter((item) => item !== id); } }));
  if (selection.trainingIds.length > 1) selection.trainingIds.forEach((id, index) => candidates.push({ cost: line(id, library.training) - 0.5 - index * 0.01, apply: (next) => { next.trainingIds = next.trainingIds.filter((item) => item !== id); } }));
  if (selection.recognitionIds.length > 2) selection.recognitionIds.forEach((id, index) => candidates.push({ cost: line(id, library.recognition) - index * 0.01, apply: (next) => { next.recognitionIds = next.recognitionIds.filter((item) => item !== id); } }));
  if (selection.skillIds.length > 3) selection.skillIds.forEach((id, index) => candidates.push({ cost: line(id, library.skills) + 0.5 - index * 0.01, apply: (next) => { next.skillIds = next.skillIds.filter((item) => item !== id); } }));
  selection.experience.forEach((group) => {
    if (group.bulletIds.length > 2) group.bulletIds.forEach((id) => candidates.push({ cost: score(library.bullets.get(id)?.bullet ?? { relevance: {} }, target) + 1, apply: (next) => { next.experience = next.experience.map((item) => item.entryId === group.entryId ? { ...item, bulletIds: item.bulletIds.filter((bullet) => bullet !== id) } : item); } }));
  });
  selection.projects.forEach((group, position) => {
    if (group.bulletIds.length > 1) group.bulletIds.forEach((id) => candidates.push({ cost: score(library.bullets.get(id)?.bullet ?? { relevance: {} }, target) - position * 0.2, apply: (next) => { next.projects = next.projects.map((item) => item.entryId === group.entryId ? { ...item, bulletIds: item.bulletIds.filter((bullet) => bullet !== id) } : item); } }));
  });
  if (selection.projects.length > 2) {
    const last = selection.projects[selection.projects.length - 1];
    candidates.push({ cost: score(library.entries.get(last.entryId) ?? { relevance: {} }, target) + 0.25, apply: (next) => { next.projects = next.projects.slice(0, -1); } });
  }
  if (!candidates.length) return null;
  const cheapest = candidates.sort((a, b) => a.cost - b.cost)[0];
  const next: CvSelection = structuredClone(selection);
  cheapest.apply(next);
  return next;
}

// Compact form so an email can link back to the exact same CV. IDs use only [a-z0-9-], and the
// separators (~ . _) are unreserved URL characters, so the string needs no escaping.
export function encodeSelection(selection: CvSelection) {
  const groups = (items: CvSelection["projects"]) => items.map((item) => [item.entryId, ...item.bulletIds].join(".")).join("_");
  return [selection.target, selection.summaryId, selection.skillIds.join("."), groups(selection.experience), groups(selection.projects), selection.recognitionIds.join("."), selection.trainingIds.join("."), selection.teachingIds.join(".")].join("~");
}

export function decodeSelection(value: string): CvSelection | null {
  if (value.length > 1200 || !/^[a-z0-9~._-]+$/.test(value)) return null;
  const parts = value.split("~");
  if (parts.length !== 8) return null;
  const list = (part: string) => (part ? part.split(".") : []);
  const groups = (part: string) => (part ? part.split("_").map((group) => { const [entryId, ...bulletIds] = group.split("."); return { entryId, bulletIds }; }) : []);
  const result = validateSelection({ target: parts[0], summaryId: parts[1], skillIds: list(parts[2]), experience: groups(parts[3]), projects: groups(parts[4]), recognitionIds: list(parts[5]), trainingIds: list(parts[6]), teachingIds: list(parts[7]) });
  return result.ok ? result.selection : null;
}
