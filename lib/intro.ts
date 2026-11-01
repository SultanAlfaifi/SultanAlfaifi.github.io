// The welcome screen's one question, asked through the visitor's own AI: a prompt they send to ChatGPT,
// Claude or Gemini, which answers with a short card about them from what it already knows. They read the
// card, paste it back, and the site arranges itself around it. Nothing is looked up about anyone: the
// visitor runs the prompt, sees the answer, and decides to share it.
import type { Locale } from "@/data/i18n";

export type Intent = "hiring" | "collaborate" | "browse";
export type Address = "masculine" | "feminine" | "unknown";

// What the site keeps about the visitor, in their own browser only. The pasted text itself is never kept.
export type VisitorProfile = {
  name: string;
  address: Address;
  field: string;
  organization: string;
  workingOn: string;
  intent: Intent;
  // The role a hiring visitor hires for, so the CV comes ready for it.
  hiringRole: string;
  // Sultan's projects closest to the visitor, by slug, closest first.
  projects: string[];
  // One or two sentences tying the visitor's work to the first project. Empty without the agent.
  bridge: string;
  source: "ai" | "card";
};

// Both prompts ask for the same eight lines, so parseCard can read either one without the agent.
const PROMPTS: Record<Locale, string> = {
  ar: `أبي أدخل موقع سلطان الفيفي، مهندس برمجيات متخصص في وكلاء الذكاء الاصطناعي. الموقع يطلب بطاقة قصيرة عني عشان يرتّب نفسه لي.

اعتمد فقط على اللي تعرفه عني فعلًا من محادثاتنا وذاكرتك، واكتب البطاقة بهذا الشكل بالضبط داخل مربع نص (code block) عشان أنسخها بضغطة:

الاسم: اسمي الأول فقط
المخاطبة: مذكر أو مؤنث
المجال: تخصصي أو مسماي الوظيفي في سطر
جهة العمل: الشركة أو الجهة، أو طالب، أو مستقل
أشتغل على: أبرز مشروع أو مشروعين أبنيهم الحين، في سطر
اهتماماتي: ثلاث اهتمامات مهنية قصيرة
أدور على: واحد من (موظف لفريقي، شريك لمشروع، فرصة عمل لي، أفكار وتعلّم، مجرد تصفح)
لغتي: عربي أو إنجليزي

القواعد:
- اكتبها بصيغة المتكلم وبالعربي.
- لا تخمّن ولا تخترع. أي سطر ما تعرفه اكتب فيه: غير معروف
- معلومات مهنية فقط: لا عمر ولا صحة ولا عائلة ولا دين ولا سياسة ولا مكان سكن ولا أرقام أو حسابات.
- لا تكتب أي شي قبل البطاقة أو بعدها.`,
  en: `I'm about to open the portfolio of Sultan Alfaifi, a software engineer who builds AI agents. The site asks for a short card about me so it can arrange itself for me.

Use only what you actually know about me from our chats and your memory, and write the card in exactly this format, inside a code block so I can copy it in one tap:

Name: my first name only
Address me as: masculine or feminine (for the Arabic page)
Field: my specialty or job title, in one line
Works at: company or organization, or student, or freelance
Working on: one or two things I'm building now, in one line
Interests: three short professional interests
Looking for: one of (an engineer for my team, a partner for a project, a job for myself, ideas and learning, just browsing)
Language: English or Arabic

Rules:
- First person, in English.
- Don't guess or invent. For any line you don't know, write: unknown
- Professional details only: no age, health, family, religion, politics, home location, phone numbers or accounts.
- Nothing before or after the card.`
};

export const introPrompt = (locale: Locale) => PROMPTS[locale];

export type AiAppId = "chatgpt" | "claude" | "gemini";

// ChatGPT and Claude read ?q= into their input; Gemini has no such parameter, so it opens empty. Every
// tile also copies the prompt first, so pasting it always works, whatever the app does with the link.
export const AI_APPS: { id: AiAppId; name: string; prefills: boolean; href: (prompt: string) => string }[] = [
  { id: "chatgpt", name: "ChatGPT", prefills: true, href: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}` },
  { id: "claude", name: "Claude", prefills: true, href: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}` },
  { id: "gemini", name: "Gemini", prefills: false, href: () => "https://gemini.google.com/app" }
];

// Writes the prompt to the clipboard inside the click, so browsers that need a user gesture allow it.
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and insecure origins: a hidden textarea and the legacy copy command.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    area.remove();
    return copied;
  }
}

// The labels of each line, in both languages, because the visitor's AI sometimes answers in the other one.
const LINES: Record<"name" | "address" | "field" | "organization" | "workingOn" | "lookingFor", RegExp> = {
  name: /^(?:الاسم|اسمي|name)$/i,
  address: /^(?:المخاطبة|خاطبني|address me as|address)$/i,
  field: /^(?:المجال|التخصص|field|role)$/i,
  organization: /^(?:جهة العمل|أعمل في|اعمل في|works at|company|organization)$/i,
  workingOn: /^(?:أشتغل على|اشتغل على|أعمل على|working on|building)$/i,
  lookingFor: /^(?:أدور على|ادور على|أبحث عن|ابحث عن|looking for)$/i
};

const UNKNOWN = /^(?:غير معروف|غير معروفة|لا أعرف|unknown|n\/a|none|-+)$/i;

// Markdown the apps add around the card: fences, bullets, bold, and quotes.
const plain = (line: string) => line.replace(/^\s*(?:[-*•>]|\d+[.)])\s*/, "").replace(/[*_`#]+/g, "").trim();

export function intentFrom(text: string): Intent {
  if (/موظف|مهندس لفريق|لفريقي|أوظ|اوظ|توظيف|recruit|hiring|hire|an engineer for my team|talent/i.test(text)) return "hiring";
  if (/شريك|تعاون|partner|collaborat|work together/i.test(text)) return "collaborate";
  return "browse";
}

// Reads the card without the agent. Used when the agent is offline, and to greet the visitor by name
// while the agent is still reading. Returns null when the text doesn't look like the card at all.
export function parseCard(text: string): VisitorProfile | null {
  const values: Partial<Record<keyof typeof LINES, string>> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = plain(raw);
    const split = line.search(/[:：]/);
    if (split < 1) continue;
    const label = line.slice(0, split).trim();
    const value = line.slice(split + 1).trim();
    const key = (Object.keys(LINES) as (keyof typeof LINES)[]).find((item) => LINES[item].test(label));
    if (key && value && !UNKNOWN.test(value) && !values[key]) values[key] = value.slice(0, 160);
  }
  const found = Object.keys(values).length;
  if (found < 2) return null;
  const name = (values.name ?? "").split(/[\s,،]+/)[0].replace(/[^\p{L}'-]/gu, "").slice(0, 30);
  const address: Address = /مؤنث|feminine|female|she/i.test(values.address ?? "") ? "feminine" : /مذكر|masculine|male|he\b/i.test(values.address ?? "") ? "masculine" : "unknown";
  const lookingFor = values.lookingFor ?? "";
  return {
    name,
    address,
    field: (values.field ?? "").slice(0, 60),
    organization: /^(?:طالب|طالبة|مستقل|مستقلة|student|freelance|freelancer)$/i.test(values.organization ?? "") ? "" : (values.organization ?? "").slice(0, 60),
    workingOn: (values.workingOn ?? "").slice(0, 120),
    intent: intentFrom(lookingFor),
    hiringRole: "",
    projects: [],
    bridge: "",
    source: "card"
  };
}

// "Good evening" by the visitor's own clock.
export function timeGreeting(locale: Locale, hour = new Date().getHours()) {
  if (locale === "ar") return hour >= 4 && hour < 12 ? "صباح الخير" : "مساء الخير";
  return hour >= 4 && hour < 12 ? "Good morning" : hour >= 12 && hour < 18 ? "Good afternoon" : "Good evening";
}
