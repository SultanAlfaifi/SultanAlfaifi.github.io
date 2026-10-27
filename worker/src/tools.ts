import { KNOWLEDGE } from "./generated/knowledge";
import type { EvidenceLevel } from "../../lib/agent/types";

type Locale = "en" | "ar";
type Bilingual = { en: string; ar: string };

export type FitItem = { point: string; evidence: string[] };
export type FitGap = { point: string; plan: string };
export type FitReport = { role: string; strong: FitItem[]; partial: FitItem[]; gaps: FitGap[]; summary: string };

export type ClientAction =
  | { type: "open"; anchor: string; kind: "section" | "project"; label: Bilingual; collapsed: boolean; external: { href: string; label: Bilingual } | null }
  | { type: "fit_report"; report: FitReport }
  | { type: "draft_email"; draft: { subject: string; body: string; topic: string } };

// What a successful call leaves in the conversation: short arguments and a one-line memo of what the
// visitor saw. Later turns replay it as a real tool call, so the model knows the action happened.
export type ToolRecord = { name: string; args: Record<string, unknown>; memo: string };

export type ToolOutcome = {
  content: string;
  trace: { call: string; result: string };
  action?: ClientAction;
  record?: Omit<ToolRecord, "name">;
  error?: boolean;
};

const ANCHOR_IDS = KNOWLEDGE.anchors.map((anchor) => anchor.id);
const anchorSchema = { type: "string", enum: ANCHOR_IDS, description: "A page anchor from the knowledge, without the leading #." };
const itemSchema = {
  type: "object",
  properties: {
    point: { type: "string", description: "One short line in the visitor's language." },
    evidence: { type: "array", items: anchorSchema, minItems: 1, maxItems: 4 }
  },
  required: ["point", "evidence"],
  additionalProperties: false
};

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "open_on_page",
      description: "Scroll the visitor's page to a project or section and highlight it. For projects with an external demo, the console also shows a button the visitor can click.",
      parameters: { type: "object", properties: { anchor: anchorSchema }, required: ["anchor"], additionalProperties: false }
    }
  },
  {
    type: "function",
    function: {
      name: "match_requirements",
      description: "Check concrete job requirements against the evidence index built from the site. Returns, per requirement, whether the site shows evidence, at what level, and where.",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", description: "The role or field, as the visitor named it." },
          requirements: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 20, description: "Short English phrases, e.g. \"Laravel\", \"3+ years back end\", \"Docker\"." }
        },
        required: ["role", "requirements"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "show_fit_report",
      description: "Show the fit report card in the console: strong matches and partial matches (each with evidence anchors), then honest gaps with what he is doing about them only when the site says so.",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string" },
          strong: { type: "array", items: itemSchema, maxItems: 8 },
          partial: { type: "array", items: itemSchema, maxItems: 8 },
          gaps: {
            type: "array",
            maxItems: 8,
            items: {
              type: "object",
              properties: {
                point: { type: "string" },
                plan: { type: "string", description: "What he is doing about it, only if the knowledge says so; otherwise say the site doesn't cover it." }
              },
              required: ["point", "plan"],
              additionalProperties: false
            }
          },
          summary: { type: "string", description: "Two or three plain sentences in the visitor's language." }
        },
        required: ["role", "strong", "partial", "gaps", "summary"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "draft_email",
      description: "Show an email draft addressed to Sultan for the visitor to review, edit, and send with their own click. It is never sent automatically.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", description: "Under 100 characters." },
          body: { type: "string", description: "A short message from the visitor's point of view, in their language." },
          topic: { type: "string", enum: ["role", "project", "workshop", "question", "fit", "other"] }
        },
        required: ["subject", "body", "topic"],
        additionalProperties: false
      }
    }
  }
];

const T = {
  en: {
    opened: (label: string, demo: boolean) => `highlighted ${label}${demo ? " · demo button shown" : ""}`,
    matched: (strong: number, partial: number, gaps: number) => `${strong} strong · ${partial} partial · ${gaps} not on the site`,
    report: "fit report shown",
    drafted: "draft shown, waiting for your click",
    rejected: (reason: string) => `rejected: ${reason}`
  },
  ar: {
    opened: (label: string, demo: boolean) => `ميّزت ${label}${demo ? " · وظهر زر العرض" : ""}`,
    matched: (strong: number, partial: number, gaps: number) => `${strong} قوي · ${partial} جزئي · ${gaps} غير موجود في الموقع`,
    report: "ظهر تقرير المطابقة",
    drafted: "ظهرت المسودة، وتنتظر ضغطتك",
    rejected: (reason: string) => `مرفوض: ${reason}`
  }
};

const text = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");
const normalize = (value: string) => ` ${value.toLowerCase().replace(/[^a-z0-9+#.\u0600-\u06ff\s-]+/g, " ").replace(/\s+/g, " ").trim()} `;

export function matchRequirements(requirements: string[]) {
  const rows = requirements.slice(0, 20).map((raw) => {
    const requirement = text(raw, 120);
    const haystack = normalize(requirement);
    const hits = KNOWLEDGE.evidence.filter((term) => [term.term, ...term.aliases].some((alias) => haystack.includes(normalize(alias))));
    const years = /(\d+)\s*\+?\s*(years?|yrs?|سنوات|سنة|سنين)/i.exec(requirement);
    const degree = /\b(bachelor'?s?|degree|b\.?sc|bs|master'?s?|graduate)\b|بكالوريوس|شهادة جامعية/i.test(requirement);
    const rank: Record<EvidenceLevel, number> = { learning: 0, working: 1, strong: 2 };
    const best = hits.sort((a, b) => rank[b.level] - rank[a.level] || b.evidence.length - a.evidence.length)[0];
    const evidence = [...new Map(hits.flatMap((term) => term.evidence).map((item) => [item.anchor, item])).values()].slice(0, 3);
    let status: "strong" | "partial" | "gap" = "gap";
    if (best) status = best.level === "strong" || (best.level === "working" && evidence.length >= 2) ? "strong" : "partial";
    const notes: string[] = [];
    if (best?.level === "learning") notes.push("newer to him: he lists it under 'Learning now' and is learning it at Salla");
    if (years) {
      notes.push("he is a student graduating in 2027, in a COOP at Salla since June 2026, so he doesn't have years of professional experience");
      if (status === "strong") status = "partial";
    }
    if (degree) {
      notes.push("degree in progress: Software Engineering at Umm Al-Qura University, graduating 2027");
      if (status === "gap") status = "partial";
      if (!evidence.some((item) => item.anchor === "about")) evidence.push({ anchor: "about", note: "Education" });
    }
    return { requirement, status, matched_terms: hits.map((term) => term.term), level: best?.level ?? null, evidence, note: notes.join("; ") || null };
  });
  const count = (status: string) => rows.filter((row) => row.status === status).length;
  return { requirements: rows, totals: { strong: count("strong"), partial: count("partial"), gap: count("gap") } };
}

function cleanItems(value: unknown, errors: string[]): FitItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map((item) => {
    const evidence = Array.isArray(item?.evidence) ? item.evidence.map((anchor: unknown) => String(anchor).replace(/^#/, "")).slice(0, 4) : [];
    evidence.filter((anchor: string) => !ANCHOR_IDS.includes(anchor)).forEach((anchor: string) => errors.push(`unknown anchor #${anchor}`));
    if (!evidence.length) errors.push("every match needs at least one evidence anchor");
    return { point: text(item?.point, 240), evidence };
  }).filter((item) => item.point);
}

export function runTool(name: string, rawArguments: string, locale: Locale): ToolOutcome {
  const t = T[locale];
  let args: Record<string, unknown>;
  try {
    args = rawArguments ? JSON.parse(rawArguments) : {};
  } catch {
    return { content: JSON.stringify({ error: "Arguments were not valid JSON." }), trace: { call: `${name}(…)`, result: t.rejected("invalid JSON") }, error: true };
  }

  if (name === "open_on_page") {
    const id = String(args.anchor ?? "").replace(/^#/, "");
    const anchor = KNOWLEDGE.anchors.find((item) => item.id === id);
    if (!anchor) return { content: JSON.stringify({ error: `Unknown anchor #${id}. Use one from the knowledge.` }), trace: { call: `open_on_page(#${id})`, result: t.rejected("unknown anchor") }, error: true };
    const project = KNOWLEDGE.projects.find((item) => item.anchor === id);
    const external = project?.liveDemo
      ? { href: project.liveDemo, label: project.title }
      : project?.primaryAction
        ? { href: project.primaryAction.href, label: project.primaryAction.label }
        : null;
    return {
      content: JSON.stringify({ ok: true, highlighted: anchor.label.en, external_button_shown: Boolean(external), note: "The visitor's page scrolled there. External links open only if the visitor clicks the button." }),
      trace: { call: `open_on_page(#${id})`, result: t.opened(anchor.label[locale], Boolean(external)) },
      action: { type: "open", anchor: id, kind: anchor.kind, label: anchor.label, collapsed: Boolean(anchor.collapsed), external },
      record: { args: { anchor: id }, memo: `The visitor's page scrolled to ${anchor.label.en} and highlighted it${external ? ", with a button to open it" : ""}.` }
    };
  }

  if (name === "match_requirements") {
    const requirements = Array.isArray(args.requirements) ? args.requirements.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
    if (!requirements.length) return { content: JSON.stringify({ error: "Give at least one requirement." }), trace: { call: "match_requirements()", result: t.rejected("no requirements") }, error: true };
    const result = matchRequirements(requirements);
    return {
      content: JSON.stringify(result),
      trace: { call: `match_requirements(${requirements.length} requirements${args.role ? ` · ${text(args.role, 60)}` : ""})`, result: t.matched(result.totals.strong, result.totals.partial, result.totals.gap) },
      record: { args: { role: text(args.role, 60), requirements: requirements.slice(0, 20).map((item) => text(item, 60)) }, memo: `${result.totals.strong} strong, ${result.totals.partial} partial, ${result.totals.gap} not on the site.` }
    };
  }

  if (name === "show_fit_report") {
    const errors: string[] = [];
    const report: FitReport = {
      role: text(args.role, 120) || "—",
      strong: cleanItems(args.strong, errors),
      partial: cleanItems(args.partial, errors),
      gaps: Array.isArray(args.gaps) ? args.gaps.slice(0, 8).map((gap: { point?: unknown; plan?: unknown }) => ({ point: text(gap?.point, 240), plan: text(gap?.plan, 240) })).filter((gap: FitGap) => gap.point) : [],
      summary: text(args.summary, 600)
    };
    if (!report.strong.length && !report.partial.length && !report.gaps.length) errors.push("the report is empty");
    if (errors.length) {
      return { content: JSON.stringify({ error: `Fix and call again: ${[...new Set(errors)].join("; ")}. Use only anchors from the knowledge.` }), trace: { call: "show_fit_report(…)", result: t.rejected([...new Set(errors)][0]) }, error: true };
    }
    return {
      content: JSON.stringify({ ok: true, shown: true, note: "The card is on screen. Now give a short summary and offer to email it to Sultan." }),
      trace: { call: `show_fit_report(${report.strong.length} strong · ${report.partial.length} partial · ${report.gaps.length} gaps)`, result: t.report },
      action: { type: "fit_report", report },
      record: { args: { role: report.role }, memo: `The fit report card for ${report.role} is on screen: ${report.strong.length} strong, ${report.partial.length} partial, ${report.gaps.length} gaps.` }
    };
  }

  if (name === "draft_email") {
    const draft = { subject: text(args.subject, 140), body: typeof args.body === "string" ? args.body.trim().slice(0, 3000) : "", topic: ["role", "project", "workshop", "question", "fit", "other"].includes(String(args.topic)) ? String(args.topic) : "other" };
    if (!draft.subject || !draft.body) return { content: JSON.stringify({ error: "A draft needs a subject and a body." }), trace: { call: "draft_email(…)", result: t.rejected("empty draft") }, error: true };
    return {
      content: JSON.stringify({ shown_to_visitor: true, sent: false, recipient: "Sultan (fixed)", note: "Only the visitor's click on Send sends it. Do not say it was sent." }),
      trace: { call: `draft_email(${draft.topic})`, result: t.drafted },
      action: { type: "draft_email", draft },
      record: { args: { subject: draft.subject, topic: draft.topic }, memo: "The draft is on screen for the visitor to edit and send. Nothing has been sent." }
    };
  }

  return { content: JSON.stringify({ error: `Unknown tool ${name}.` }), trace: { call: `${name}(…)`, result: t.rejected("unknown tool") }, error: true };
}

const LINK = /\[([^\]\n]{1,120})\]\(([^)\s]{1,400})\)/g;

// Which citations in an answer point somewhere real. The console drops the rest to plain text.
export function checkLinks(answer: string) {
  const sources = new Set<string>();
  const removed: string[] = [];
  const urls = new Set(KNOWLEDGE.urls.map((url) => url.replace(/\/$/, "")));
  for (const [, , href] of answer.matchAll(LINK)) {
    if (href.startsWith("#")) {
      if (ANCHOR_IDS.includes(href.slice(1))) sources.add(href.slice(1));
      else removed.push(href);
    } else if (href === `mailto:${KNOWLEDGE.owner.email}` || urls.has(href.replace(/\/$/, ""))) {
      continue;
    } else {
      removed.push(href);
    }
  }
  return { sources: [...sources], removed };
}
