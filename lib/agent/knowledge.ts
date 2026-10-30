// Turns the site's own data into the agent's knowledge: one block per page anchor, in English and Arabic,
// plus the evidence index the fit check matches requirements against. Runs at build time only.
import type { PortfolioContent } from "../../data/i18n";
import { buildAnchors, collectUrls } from "./anchors";
import type { AnchorInfo, EvidenceLevel, EvidenceTerm, KnowledgeBundle, KnowledgeProject } from "./types";

type Block = { anchor: string; title: string; lines: (string | null | undefined | false)[] };

const join = (items: (string | null | undefined)[], separator = "; ") => items.filter(Boolean).join(separator);
const field = (label: string, value: string | null | undefined, indent = "") => (value ? `${indent}- ${label}: ${value}` : null);

function render(blocks: Block[]) {
  return blocks
    .map((block) => [`## [#${block.anchor}] ${block.title}`, ...block.lines.filter((line): line is string => Boolean(line))].join("\n"))
    .join("\n\n");
}

const LABELS = {
  en: {
    heading: "SITE KNOWLEDGE (English)",
    preface: "Written by Sultan in the first person. Each block starts with its page anchor in brackets; cite that anchor for any fact you use from the block.",
    identity: "Who Sultan is",
    name: "Name", arabicName: "Name in Arabic", role: "Role", headline: "Headline", summary: "Summary", currently: "Currently", openTo: "Open to", location: "Based in", education: "Education", languages: "Languages", email: "Email", about: "About, in his words",
    work: "Projects on the page", featured: "Featured (try these first)", smaller: "Smaller builds",
    status: "Status", projectRole: "His role", what: "What it is", problem: "The problem", decision: "The call he made", check: "What you can check yourself", highlights: "Highlights", tech: "Technologies", techNone: "not published on the site", figures: "Figures", asOf: "as of", outcome: "Outcome",
    checkpoint: "Where it stops for a person", step: (step: number, total: number) => `step ${step} of ${total}`, kinds: { asks: "it asks you first", verifies: "it verifies before a result counts", holds: "it holds on its own when a check fails" }, caveat: "Not yet", boundary: "The line it keeps", comma: ", ", repo: "Source code", repoNone: "no public repository", demo: "Live demo", main: "Main link", arabicTitle: "Arabic name",
    experience: "Work experience", dates: "Dates", place: "Location", does: "What he does", tools: "Technologies in this role", note: "His note",
    skills: "Skills", strongest: "strongest",
    achievements: "Recognition and numbers", issuer: "Issuer", date: "Date", dateNone: "no documented date", number: "Number", source: "Source",
    timeline: "Dated timeline",
    programs: "Courses and programs he finished", focus: "Topics", recognition: "Result", verify: "Verify", certificates: "Other certificates",
    community: "Teaching and volunteering", volunteer: "Volunteering",
    ideas: "What he writes about", topics: "Topics", posts: "Posts",
    recommendations: "Recommendations (in their words)", quote: "Quote", themes: "Themes", publicAt: "Public at",
    help: "How he can help", who: "For", need: "Need", offer: "Offer", proof: "Proof", cta: "Contact link",
    principles: "How he builds agents (principles)",
    organizations: "Organizations he has worked or learned with", relationship: "Relationship",
    contact: "Contact", social: "Social", contactNote: "Send two or three lines: what you need, who it's for, and by when. Arabic or English.",
    cv: "CV on this site", cvNote: "A one-page English CV built from this site's data. The general CV downloads instantly; a tailored one picks and orders approved bullets for a field or a job description. No AI writes CV bullets."
  },
  ar: {
    heading: "معرفة الموقع (بالعربية)",
    preface: "كتبها سلطان بصيغة المتكلم. يبدأ كل قسم بمرساه في الصفحة بين قوسين؛ استشهد بالمرسى لأي معلومة تأخذها منه. الروابط وأسماء التقنيات موجودة في القسم الإنجليزي بالمرسى نفسه.",
    identity: "من هو سلطان",
    name: "الاسم", arabicName: "الاسم بالعربية", role: "التخصص", headline: "العنوان", summary: "نبذة", currently: "حاليًا", openTo: "متاح لـ", location: "مقيم في", education: "التعليم", languages: "اللغات", email: "البريد", about: "عنه بكلماته",
    work: "المشاريع في الصفحة", featured: "المشاريع البارزة", smaller: "مشاريع أصغر",
    status: "الحالة", projectRole: "دوره", what: "ما هو", problem: "المشكلة", decision: "القرار الذي اتخذه", check: "ما تقدر تتحقق منه", highlights: "أبرز النقاط", tech: "التقنيات", techNone: "غير منشورة في الموقع", figures: "أرقام", asOf: "حتى", outcome: "النتيجة",
    checkpoint: "أين يتوقف لينتظر إنسانًا", step: (step: number, total: number) => `الخطوة ${step} من ${total}`, kinds: { asks: "يستأذنك أولًا", verifies: "يتحقق قبل أن تُحسب النتيجة", holds: "يتوقف من نفسه إذا فشل أي فحص" }, caveat: "ما لم يكتمل بعد", boundary: "الحد الذي يلتزم به", comma: "، ", repo: "الكود", repoNone: "لا يوجد مستودع عام", demo: "عرض حي", main: "الرابط الرئيسي", arabicTitle: "الاسم العربي",
    experience: "الخبرة العملية", dates: "الفترة", place: "المكان", does: "ماذا يعمل", tools: "التقنيات في هذا الدور", note: "ملاحظته",
    skills: "المهارات", strongest: "الأقوى",
    achievements: "الإنجازات والأرقام", issuer: "الجهة", date: "التاريخ", dateNone: "بلا تاريخ موثّق", number: "رقم", source: "المصدر",
    timeline: "المحطات بتواريخها",
    programs: "الدورات والبرامج التي أكملها", focus: "المواضيع", recognition: "النتيجة", verify: "التحقق", certificates: "شهادات أخرى",
    community: "التدريب والتطوع", volunteer: "التطوع",
    ideas: "ما يكتب عنه", topics: "المواضيع", posts: "المنشورات",
    recommendations: "التوصيات (بكلماتهم)", quote: "الاقتباس", themes: "المحاور", publicAt: "منشورة في",
    help: "كيف يقدر يخدمك", who: "لمن", need: "الحاجة", offer: "ما يقدمه", proof: "الدليل", cta: "رابط التواصل",
    principles: "كيف يبني الوكلاء (مبادئه)",
    organizations: "الجهات التي عمل أو تعلّم معها", relationship: "العلاقة",
    contact: "التواصل", social: "حساباته", contactNote: "اكتب له سطرين أو ثلاثة: ماذا تحتاج، ولمن، ومتى. بالعربي أو بالإنجليزي.",
    cv: "السيرة الذاتية في الموقع", cvNote: "سيرة ذاتية بالإنجليزية في صفحة واحدة مبنية من بيانات هذا الموقع. العامة تنزل فورًا، والمفصّلة تختار وترتّب نقاطًا معتمدة حسب المجال أو وصف الوظيفة. لا يكتب الذكاء الاصطناعي نقاط السيرة."
  }
} as const;

// "step 3 of 3 (Ranked picks, with reasons), it asks you first: nothing installs until you say yes"
function checkpointLine(project: PortfolioContent["projects"][number], t: (typeof LABELS)[keyof typeof LABELS]) {
  const { step, kind, text } = project.checkpoint!;
  const name = project.flow?.[step - 1];
  return `${t.step(step, project.flow?.length ?? step)}${name ? ` (${name})` : ""}${t.comma}${t.kinds[kind]}: ${text}`;
}

function blocks(content: PortfolioContent, english: PortfolioContent, anchors: AnchorInfo[]): Block[] {
  const t = LABELS[content.locale];
  const isArabic = content.locale === "ar";
  // In Arabic, skip anything still identical to the English record: it is already in the English block.
  const fresh = (value: string | null | undefined, englishValue: string | null | undefined) =>
    isArabic && value === englishValue ? null : value;
  const sectionTitle = (id: string) => anchors.find((anchor) => anchor.id === id)?.label[content.locale] ?? id;
  const { identity, about } = content;
  const enabledProjects = content.projects.filter((project) => project.enabled);

  const out: Block[] = [];
  out.push({
    anchor: "about",
    title: `${t.identity} · ${sectionTitle("about")}`,
    lines: [
      field(t.name, identity.name),
      !isArabic && field(t.arabicName, identity.arabicName),
      field(t.role, identity.role),
      field(t.headline, identity.headline),
      field(t.summary, identity.summary),
      field(t.currently, identity.currently),
      field(t.openTo, identity.openTo),
      field(t.location, identity.location),
      field(t.education, identity.education),
      field(t.languages, identity.languages),
      !isArabic && field(t.email, identity.email),
      `- ${t.about}:`,
      ...about.paragraphs.map((paragraph) => `  - ${paragraph}`)
    ]
  });

  const featured = enabledProjects.filter((project) => project.featured);
  const smaller = enabledProjects.filter((project) => !project.featured);
  const indexLine = (project: (typeof enabledProjects)[number]) => `  - [#project-${project.slug}] ${project.title} — ${project.category}${project.status ? ` (${project.status})` : ""}`;
  out.push({
    anchor: "work",
    title: `${t.work} · ${sectionTitle("work")}`,
    lines: [`- ${t.featured}:`, ...featured.map(indexLine), `- ${t.smaller}:`, ...smaller.map(indexLine)]
  });

  for (const project of enabledProjects) {
    const base = english.projects.find((item) => item.slug === project.slug) ?? project;
    const arabicTitle = anchors.find((anchor) => anchor.id === `project-${project.slug}`)?.label.ar;
    out.push({
      anchor: `project-${project.slug}`,
      title: `${project.title} — ${project.category}`,
      lines: [
        !isArabic && arabicTitle !== project.title && field(t.arabicTitle, arabicTitle),
        field(t.status, project.status),
        field(t.projectRole, fresh(project.role, base.role)),
        field(t.what, project.description),
        field(t.problem, fresh(project.challenge, base.challenge)),
        field(t.decision, fresh(project.decision, base.decision)),
        field(t.check, fresh(project.evidence, base.evidence)),
        project.highlights.length ? field(t.highlights, join(project.highlights, " ")) : null,
        !isArabic && field(t.tech, project.technologies.length ? project.technologies.join(", ") : t.techNone),
        project.metrics?.length ? field(t.figures, join(project.metrics.map((metric) => `${metric.value} ${metric.label}${metric.asOf ? ` (${t.asOf} ${metric.asOf})` : ""}`))) : null,
        project.checkpoint ? field(t.checkpoint, checkpointLine(project, t)) : null,
        field(t.caveat, project.caveat),
        field(t.boundary, project.boundary),
        field(t.outcome, fresh(project.outcome, base.outcome)),
        !isArabic && field(t.repo, project.repository ?? t.repoNone),
        !isArabic && field(t.demo, project.liveDemo),
        !isArabic && project.primaryAction ? field(t.main, `${project.primaryAction.label} → ${project.primaryAction.href}`) : null
      ]
    });
  }

  out.push({
    anchor: "experience",
    title: `${t.experience} · ${sectionTitle("experience")}`,
    lines: content.experience.flatMap((job) => [
      `- ${job.role}, ${job.organization}`,
      field(t.dates, job.dates, "  "),
      field(t.place, job.location, "  "),
      field(t.what, job.description, "  "),
      field(t.does, join(job.responsibilities, " "), "  "),
      !isArabic && field(t.tools, job.technologies.join(", "), "  "),
      field(t.note, job.note, "  ")
    ])
  });

  out.push({
    anchor: "skills",
    title: `${t.skills} · ${sectionTitle("skills")}`,
    lines: [
      `- ${content.ui.skills.description}`,
      ...content.skillGroups.map((group) => `- ${group.title}: ${group.skills.join(", ")}${group.strongest?.length ? ` (${t.strongest}: ${group.strongest.join(", ")})` : ""}`)
    ]
  });

  out.push({
    anchor: "achievements",
    title: `${t.achievements} · ${sectionTitle("achievements")}`,
    lines: [
      ...content.achievements.filter((item) => item.enabled).map((item) => `- ${item.title} (${item.signal}) — ${item.description} ${t.issuer}: ${item.issuer}. ${t.date}: ${item.date ?? t.dateNone}.`),
      ...content.proofMetrics.map((metric) => `- ${t.number}: ${metric.prefix ?? ""}${metric.value.toLocaleString("en-US")}${metric.suffix ?? ""} ${metric.label} (${t.source}: ${metric.source})`)
    ]
  });

  out.push({
    anchor: "timeline",
    title: `${t.timeline} · ${sectionTitle("timeline")}`,
    lines: [`- ${content.ui.timeline.description}`, ...content.journey.map((stop) => `- ${stop.date} · ${content.ui.timeline.kinds[stop.kind] ?? stop.kind}: ${stop.title} — ${stop.detail}`)]
  });

  out.push({
    anchor: "runtime",
    title: `${t.principles} · ${sectionTitle("runtime")}`,
    lines: content.principles.map((principle) => `- ${principle}`)
  });

  out.push({
    anchor: "organizations",
    title: `${t.organizations} · ${sectionTitle("organizations")}`,
    lines: content.organizations.filter((organization) => organization.visible).map((organization) => `- ${organization.name} (${organization.relationship}): ${organization.journeyNote}`)
  });

  out.push({
    anchor: "journey",
    title: `${t.programs} · ${sectionTitle("journey")}`,
    lines: [
      ...content.programs.filter((program) => program.enabled).map((program) => `- ${program.name} — ${program.issuer}: ${program.summary} ${t.focus}: ${program.focus.join(", ")}.${program.recognition ? ` ${t.recognition}: ${program.recognition}.` : ""}${program.year ? ` ${program.year}.` : ""}${!isArabic && program.credentialUrl ? ` ${t.verify}: ${program.credentialUrl}` : ""}`),
      `- ${t.certificates}:`,
      ...content.certifications.map((certification) => `  - ${certification.name} — ${certification.issuer}, ${certification.date}${!isArabic && certification.credentialUrl ? ` (${t.verify}: ${certification.credentialUrl})` : ""}`)
    ]
  });

  out.push({
    anchor: "community",
    title: `${t.community} · ${sectionTitle("community")}`,
    lines: [
      `- ${content.ui.community.description}`,
      ...content.community.workshops.map((workshop) => `- ${workshop.title} (${workshop.meta}): ${workshop.description}`),
      `- ${t.volunteer}: ${content.ui.community.volunteerText}`,
      field(t.figures, join(content.community.metrics.map((metric) => `${metric.value} ${metric.label}`)))
    ]
  });

  out.push({
    anchor: "ideas",
    title: `${t.ideas} · ${sectionTitle("ideas")}`,
    lines: [
      `- ${content.ui.ideas.description}`,
      `- ${content.ui.ideas.intro}`,
      ...content.content.pillars.map((pillar) => `- ${pillar.title}: ${pillar.description}`),
      field(t.topics, content.content.categories.join(", ")),
      field(t.figures, join(content.content.metrics.map((metric) => `${metric.value} ${metric.label}`)))
    ]
  });

  out.push({
    anchor: "recommendations",
    title: `${t.recommendations} · ${sectionTitle("recommendations")}`,
    lines: content.recommendations.map((recommendation) => `- ${recommendation.name} (${recommendation.roles.join(", ")}): “${recommendation.quote}” ${t.themes}: ${recommendation.tags.join(", ")}.${recommendation.note ? ` ${recommendation.note}` : ""}${!isArabic && recommendation.publicUrl ? ` ${t.publicAt}: ${recommendation.publicUrl}` : ""}`)
  });

  out.push({
    anchor: "help",
    title: `${t.help} · ${sectionTitle("help")}`,
    lines: content.helpPaths.map((path) => `- ${t.who}: ${path.audience}. ${t.need}: ${path.need} ${t.offer}: ${path.offer} ${t.proof}: ${path.proof}.`)
  });

  out.push({
    anchor: "cv",
    title: `${t.cv} · ${sectionTitle("cv")}`,
    lines: [`- ${t.cvNote}`]
  });

  out.push({
    anchor: "contact",
    title: `${t.contact} · ${sectionTitle("contact")}`,
    lines: [
      field(t.email, identity.email),
      `- ${t.contactNote}`,
      `- ${t.social}: ${content.socialLinks.filter((link) => link.platform !== "Email").map((link) => `${link.label}${link.audience ? ` (${link.audience})` : ""}${isArabic ? "" : ` ${link.href}`}`).join(" · ")}`
    ]
  });

  return out;
}

// Common ways a job description names the same skill. Keys are lowercased site terms.
const ALIASES: Record<string, string[]> = {
  "rest apis": ["rest", "restful", "rest api", "apis", "api development", "web services", "backend apis"],
  "ai agents": ["ai agent", "agents", "agentic", "agentic ai", "tool use", "function calling", "tool calling"],
  "llm applications": ["llm", "llms", "large language models", "genai", "generative ai", "gen ai", "prompt engineering"],
  "llm integration": ["llm api", "openai api", "model apis"],
  "multi-agent workflows": ["multi-agent", "multi agent", "agent orchestration"],
  "structured outputs": ["json schema", "structured output"],
  mysql: ["sql", "relational database", "relational databases", "rdbms"],
  javascript: ["js", "ecmascript"],
  "testing & debugging": ["testing", "unit testing", "unit tests", "automated tests", "debugging", "tdd", "test coverage"],
  git: ["github", "version control"],
  "system design": ["software architecture", "architecture"],
  "database design": ["data modeling", "schema design"],
  "api integration": ["integrations", "third-party apis", "system integration"],
  react: ["react.js", "reactjs"],
  docker: ["containers", "containerization", "containerisation"],
  "deep learning": ["neural networks"],
  "machine learning": ["ml"],
  "computer vision": ["image classification", "image segmentation", "segmentation"],
  pytorch: ["torch"],
  "node.js": ["node", "nodejs"],
  "aws lambda": ["aws", "serverless", "lambda"],
  evaluation: ["evals", "llm evaluation", "model evaluation"],
  "three.js": ["threejs", "webgl"],
  "anomaly detection": ["anomaly", "outlier detection"],
  "openai apis": ["openai"],
  "nvidia nemotron": ["nemotron"],
  "arabic typography": ["arabic", "rtl", "right-to-left"],
  "agent skills": ["claude code", "codex"],
  "html5": ["html"],
  "css3": ["css"],
  webrtc: [],
  "prompt engineering": ["prompting"]
};

function evidenceIndex(content: PortfolioContent): EvidenceTerm[] {
  const terms = new Map<string, EvidenceTerm>();
  const rank: Record<EvidenceLevel, number> = { working: 0, strong: 1, learning: 2 };
  const add = (raw: string, level: EvidenceLevel, anchor: string, note: string) => {
    const term = raw.toLowerCase();
    const existing = terms.get(term) ?? { term, aliases: ALIASES[term] ?? [], level, evidence: [] };
    if (rank[level] > rank[existing.level]) existing.level = level;
    if (!existing.evidence.some((item) => item.anchor === anchor)) existing.evidence.push({ anchor, note });
    terms.set(term, existing);
  };

  // "Learning now" is the last skill group on the site; React and Docker are flagged as newer to him there.
  const learningGroup = content.skillGroups.find((group) => /learning now/i.test(group.title));
  for (const group of content.skillGroups) {
    for (const skill of group.skills) {
      const level: EvidenceLevel = group === learningGroup ? "learning" : group.strongest?.includes(skill) ? "strong" : "working";
      add(skill, level, "skills", `${group.title}${level === "strong" ? " (one of his strongest)" : ""}`);
    }
  }
  for (const job of content.experience) {
    for (const tech of job.technologies) add(tech, "working", "experience", `${job.role}, ${job.organization}`);
  }
  for (const project of content.projects.filter((item) => item.enabled)) {
    for (const tech of project.technologies) add(tech, "working", `project-${project.slug}`, project.title);
  }
  for (const program of content.programs.filter((item) => item.enabled)) {
    for (const topic of program.focus) add(topic, "working", "journey", `${program.name} (${program.issuer})`);
  }
  return [...terms.values()].sort((a, b) => a.term.localeCompare(b.term));
}

export function buildKnowledge(en: PortfolioContent, ar: PortfolioContent): KnowledgeBundle {
  const anchors = buildAnchors(en, ar);
  const projects = en.projects.filter((project) => project.enabled).map((project): KnowledgeProject => {
    const arabic = ar.projects.find((item) => item.slug === project.slug);
    return {
      slug: project.slug,
      anchor: `project-${project.slug}`,
      title: { en: project.title, ar: arabic?.title ?? project.title },
      repository: project.repository,
      liveDemo: project.liveDemo,
      primaryAction: project.primaryAction
        ? { label: { en: project.primaryAction.label, ar: arabic?.primaryAction?.label ?? project.primaryAction.label }, href: project.primaryAction.href }
        : null
    };
  });
  const englishText = `# ${LABELS.en.heading}\n${LABELS.en.preface}\n\n${render(blocks(en, en, anchors))}`;
  const arabicText = `# ${LABELS.ar.heading}\n${LABELS.ar.preface}\n\n${render(blocks(ar, en, anchors))}`;
  return {
    owner: { name: en.identity.name, arabicName: en.identity.arabicName, email: en.identity.email, site: en.seo.siteUrl.replace(/\/$/, "") },
    anchors,
    projects,
    urls: collectUrls(en),
    evidence: evidenceIndex(en),
    text: { en: englishText, ar: arabicText }
  };
}
