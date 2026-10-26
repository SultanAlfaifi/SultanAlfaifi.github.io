// The CV bullet library. Every line here restates a fact already published on this site, and each one
// names the page anchor it comes from. The AI may only pick and order these IDs; the Worker rejects any
// ID that isn't in this file or that has `approved: false`. To pull a line, flip it to false.
// Kept free of path aliases: the Cloudflare Worker bundles this file too.

export type CvField = "backend" | "ai-agents" | "full-stack" | "ml" | "teaching";
export type CvTarget = CvField | "general";

export const CV_FIELDS: CvField[] = ["backend", "ai-agents", "full-stack", "ml", "teaching"];

// How relevant a line is to each target, 0 (omit) to 3 (lead with it).
export type Relevance = Partial<Record<CvTarget, 0 | 1 | 2 | 3>>;

export type CvLine = {
  id: string;
  text: string;
  relevance: Relevance;
  source: string;
  approved: boolean;
  link?: { label: string; href: string };
};

export type CvEntry = {
  id: string;
  section: "experience" | "projects";
  title: string;
  meta: string;
  dates?: string;
  location?: string;
  links: { label: string; href: string }[];
  relevance: Relevance;
  source: string;
  approved: boolean;
  bullets: CvLine[];
};

export const cvHeader = {
  name: "Sultan Alfaifi",
  headline: "Full-Stack Software Engineer specializing in AI Agents",
  location: "Makkah, Saudi Arabia",
  email: "sultalfaifi@gmail.com",
  links: [
    { label: "sultalfaifi.com", href: "https://sultalfaifi.com" },
    { label: "linkedin.com/in/alfaifi-sultan", href: "https://www.linkedin.com/in/alfaifi-sultan/" },
    { label: "github.com/SultanAlfaifi", href: "https://github.com/SultanAlfaifi" }
  ]
};

export const cvSummaries: Record<CvTarget, CvLine> = {
  general: {
    id: "sum-general",
    text: "Software engineering student at Umm Al-Qura University (graduating 2027) and COOP software engineer intern at Salla. I build AI agents that check with you before they act, and I have put a new project on GitHub almost every month since launching Masari, a CV builder with about 1,600 active users, in February 2026.",
    relevance: { general: 3 },
    source: "about",
    approved: true
  },
  backend: {
    id: "sum-backend",
    text: "Software engineering student at Umm Al-Qura University (graduating 2027) and COOP software engineer intern at Salla, where I build REST endpoints in Laravel, PHP, and MySQL that validate input, return clear errors, and come with tests.",
    relevance: { backend: 3 },
    source: "experience",
    approved: true
  },
  "ai-agents": {
    id: "sum-ai-agents",
    text: "Software engineering student at Umm Al-Qura University (graduating 2027) and COOP intern at Salla. I build AI agents and the tools they need, mostly in Python and JavaScript: anything with consequences waits for a human yes, agents get only the context they need, and I publish what failed.",
    relevance: { "ai-agents": 3 },
    source: "runtime",
    approved: true
  },
  "full-stack": {
    id: "sum-full-stack",
    text: "Software engineering student at Umm Al-Qura University (graduating 2027) and COOP intern at Salla. I own whole features: the screen, the API behind it, and the database table it writes to. Laravel, PHP, and MySQL at Salla; public web apps in JavaScript.",
    relevance: { "full-stack": 3 },
    source: "about",
    approved: true
  },
  ml: {
    id: "sum-ml",
    text: "Software engineering student at Umm Al-Qura University (graduating 2027) and COOP intern at Salla. Top 5% in the KAUST Academy AI specialization, with four PyTorch computer-vision projects on GitHub, and I build LLM features with structured, validated output.",
    relevance: { ml: 3 },
    source: "achievements",
    approved: true
  },
  teaching: {
    id: "sum-teaching",
    text: "Software engineering student at Umm Al-Qura University (graduating 2027) and COOP intern at Salla. I teach AI agents in Arabic to people who have never built one: a three-day bootcamp for Artificial Intelligence Pioneers, workshops for Fazzah and Riadiat, and explainers for 4.5K+ followers on X.",
    relevance: { teaching: 3 },
    source: "community",
    approved: true
  }
};

export const cvSkills: CvLine[] = [
  { id: "skl-backend", text: "Back end: Laravel, PHP, MySQL, REST APIs", relevance: { general: 3, backend: 3, "ai-agents": 2, "full-stack": 3, ml: 1, teaching: 1 }, source: "skills", approved: true },
  { id: "skl-ai", text: "AI agents and LLMs: Python, AI agents, LLM applications, structured outputs, multi-agent workflows", relevance: { general: 3, backend: 2, "ai-agents": 3, "full-stack": 2, ml: 3, teaching: 3 }, source: "skills", approved: true },
  { id: "skl-web", text: "Web: JavaScript, HTML5, CSS3, browser PDF generation (pdfmake), localStorage", relevance: { general: 1, backend: 1, "ai-agents": 1, "full-stack": 3, ml: 0, teaching: 1 }, source: "project-masari", approved: true },
  { id: "skl-ml", text: "Machine learning: PyTorch, deep learning, computer vision (CNNs, U-Net segmentation, transfer learning)", relevance: { general: 2, backend: 0, "ai-agents": 1, "full-stack": 0, ml: 3, teaching: 1 }, source: "project-kaust-ai-projects", approved: true },
  { id: "skl-practices", text: "Practices: system design, API integration, database design, Git, testing and debugging", relevance: { general: 2, backend: 3, "ai-agents": 2, "full-stack": 3, ml: 1, teaching: 1 }, source: "skills", approved: true },
  { id: "skl-learning", text: "Learning now: React, Docker", relevance: { general: 1, backend: 2, "ai-agents": 1, "full-stack": 3, ml: 1, teaching: 0 }, source: "skills", approved: true },
  { id: "skl-languages", text: "Languages: Arabic (native), English", relevance: { general: 2, backend: 1, "ai-agents": 2, "full-stack": 1, ml: 1, teaching: 3 }, source: "about", approved: true }
];

export const cvEntries: CvEntry[] = [
  {
    id: "exp-salla",
    section: "experience",
    title: "Software Engineer Intern (COOP)",
    meta: "Salla",
    dates: "Jun 2026 – Present",
    location: "Makkah, Saudi Arabia",
    links: [{ label: "salla.com", href: "https://salla.com/" }],
    relevance: { general: 3, backend: 3, "ai-agents": 3, "full-stack": 3, ml: 3, teaching: 3 },
    source: "experience",
    approved: true,
    bullets: [
      { id: "exp-salla-endpoints", text: "Build REST endpoints in Laravel and PHP that read and write MySQL, delivered as structured COOP assignments.", relevance: { general: 3, backend: 3, "ai-agents": 2, "full-stack": 3, ml: 2, teaching: 2 }, source: "experience", approved: true },
      { id: "exp-salla-validation", text: "Validate input and return clear errors on every endpoint.", relevance: { general: 2, backend: 3, "ai-agents": 1, "full-stack": 2, ml: 1, teaching: 1 }, source: "experience", approved: true },
      { id: "exp-salla-tests", text: "Write tests for every endpoint and hand in each assignment with them.", relevance: { general: 2, backend: 3, "ai-agents": 2, "full-stack": 2, ml: 1, teaching: 1 }, source: "experience", approved: true },
      { id: "exp-salla-learning", text: "Learning React and Docker on the job; both are newer to me.", relevance: { general: 1, backend: 1, "ai-agents": 0, "full-stack": 2, ml: 0, teaching: 0 }, source: "experience", approved: true }
    ]
  },
  {
    id: "prj-accessfinish",
    section: "projects",
    title: "AccessFinish",
    meta: "Verified AI code repair · Nebius Global AI Hackathon entry",
    dates: "Oct 2026",
    links: [
      { label: "Evidence", href: "https://sultalfaifi.com/accessfinish/" },
      { label: "GitHub", href: "https://github.com/SultanAlfaifi/accessfinish" }
    ],
    relevance: { general: 3, backend: 2, "ai-agents": 3, "full-stack": 1, ml: 2, teaching: 1 },
    source: "project-accessfinish",
    approved: true,
    bullets: [
      { id: "prj-accessfinish-verify", text: "Built a repair loop that runs each NVIDIA Nemotron fix in a sealed, network-free sandbox and accepts it only when the booking saved in the database is right.", relevance: { general: 3, backend: 2, "ai-agents": 3, "full-stack": 1, ml: 2, teaching: 1 }, source: "project-accessfinish", approved: true },
      { id: "prj-accessfinish-results", text: "Published every run, failures included: 7 of 7 fixes verified on a fault I seeded, and 0 of 7 on a real upstream bug across 43 attempts.", relevance: { general: 2, backend: 1, "ai-agents": 3, "full-stack": 1, ml: 3, teaching: 1 }, source: "project-accessfinish", approved: true },
      { id: "prj-accessfinish-guard", text: "The verifier rejected all 15 attempts that reached a “booked” page with the wrong day saved.", relevance: { general: 1, backend: 2, "ai-agents": 2, "full-stack": 1, ml: 1, teaching: 0 }, source: "project-accessfinish", approved: true }
    ]
  },
  {
    id: "prj-mustakshif",
    section: "projects",
    title: "Mustakshif",
    meta: "Local AI model advisor · Windows app and CLI · v0.4.0",
    dates: "Jul 2026",
    links: [
      { label: "Download", href: "https://github.com/SultanAlfaifi/mustakshif/releases/latest" },
      { label: "GitHub", href: "https://github.com/SultanAlfaifi/mustakshif" }
    ],
    relevance: { general: 3, backend: 2, "ai-agents": 3, "full-stack": 2, ml: 2, teaching: 2 },
    source: "project-mustakshif",
    approved: true,
    bullets: [
      { id: "prj-mustakshif-app", text: "Built a Windows desktop app and CLI in Python that ranks local AI models for a PC's hardware and the user's goals, with the reason for each pick; 160+ release downloads.", relevance: { general: 3, backend: 2, "ai-agents": 3, "full-stack": 2, ml: 2, teaching: 2 }, source: "project-mustakshif", approved: true },
      { id: "prj-mustakshif-engine", text: "Wrote one scoring engine shared by the app and the CLI; it works offline from a cached Ollama catalog and installs nothing until the user says yes.", relevance: { general: 2, backend: 3, "ai-agents": 3, "full-stack": 2, ml: 1, teaching: 1 }, source: "project-mustakshif", approved: true },
      { id: "prj-mustakshif-tests", text: "Shipped documented scoring rules and public tests, and labeled picks as estimates until they are calibrated against benchmarks.", relevance: { general: 1, backend: 2, "ai-agents": 2, "full-stack": 1, ml: 2, teaching: 1 }, source: "project-mustakshif", approved: true }
    ]
  },
  {
    id: "prj-rajih",
    section: "projects",
    title: "RAJIH Engine",
    meta: "Multi-agent decision workflow · Python CLI · v0.4.1",
    dates: "Sep 2026",
    links: [{ label: "GitHub", href: "https://github.com/SultanAlfaifi/rajih-engine" }],
    relevance: { general: 2, backend: 2, "ai-agents": 3, "full-stack": 1, ml: 2, teaching: 1 },
    source: "project-rajih-engine",
    approved: true,
    bullets: [
      { id: "prj-rajih-flow", text: "Designed a multi-agent workflow where isolated agents draft ideas, each idea gets structured critique and an evidence check, and close or weakly supported calls stop for a person.", relevance: { general: 2, backend: 1, "ai-agents": 3, "full-stack": 1, ml: 2, teaching: 1 }, source: "project-rajih-engine", approved: true },
      { id: "prj-rajih-records", text: "Saved every run as JSON and Markdown, with adapters for several model providers and automated tests.", relevance: { general: 2, backend: 3, "ai-agents": 2, "full-stack": 1, ml: 1, teaching: 0 }, source: "project-rajih-engine", approved: true }
    ]
  },
  {
    id: "prj-mashhad",
    section: "projects",
    title: "Mashhad",
    meta: "Open-source Agent Skill for Codex and Claude Code · v1.2.0",
    dates: "Oct 2026",
    links: [{ label: "GitHub", href: "https://github.com/SultanAlfaifi/mashhad-video" }],
    relevance: { general: 2, backend: 0, "ai-agents": 3, "full-stack": 1, ml: 1, teaching: 2 },
    source: "project-mashhad",
    approved: true,
    bullets: [
      { id: "prj-mashhad-skill", text: "Released an open-source Agent Skill that walks Codex or Claude Code from a short brief through scenes, sound, and render, then checks the frames and the rendered file before the final cut.", relevance: { general: 2, backend: 0, "ai-agents": 3, "full-stack": 1, ml: 1, teaching: 2 }, source: "project-mashhad", approved: true },
      { id: "prj-mashhad-arabic", text: "Kept Arabic text connected and in the right direction, with renderer guidance for Remotion, HyperFrames, and Motion Canvas.", relevance: { general: 1, backend: 0, "ai-agents": 2, "full-stack": 2, ml: 0, teaching: 2 }, source: "project-mashhad", approved: true }
    ]
  },
  {
    id: "prj-autoflow",
    section: "projects",
    title: "AutoFlow",
    meta: "Arabic financial automation prototype · Hackathon Amd finalist",
    links: [
      { label: "Demo", href: "https://auto-flow-ecru.vercel.app/" },
      { label: "GitHub", href: "https://github.com/SultanAlfaifi/AutoFlow" }
    ],
    relevance: { general: 2, backend: 2, "ai-agents": 3, "full-stack": 3, ml: 1, teaching: 1 },
    source: "project-autoflow",
    approved: true,
    bullets: [
      { id: "prj-autoflow-schema", text: "Made Arabic text, voice, and the manual editor all write to one server-validated workflow schema; AI drafts are saved inactive until the user approves them.", relevance: { general: 2, backend: 3, "ai-agents": 3, "full-stack": 3, ml: 1, teaching: 1 }, source: "project-autoflow", approved: true },
      { id: "prj-autoflow-final", text: "Took it to the onsite final of Hackathon Amd (Alinma Bank × Tuwaiq Academy), with tests for the schema, the API, and voice; money moves are simulated.", relevance: { general: 2, backend: 2, "ai-agents": 2, "full-stack": 2, ml: 0, teaching: 1 }, source: "project-autoflow", approved: true }
    ]
  },
  {
    id: "prj-masari",
    section: "projects",
    title: "Masari",
    meta: "Private CV builder · live on GitHub Pages",
    dates: "Feb 2026",
    links: [
      { label: "Live", href: "https://sultanalfaifi.github.io/Masari/" },
      { label: "GitHub", href: "https://github.com/SultanAlfaifi/Masari" }
    ],
    relevance: { general: 3, backend: 1, "ai-agents": 1, "full-stack": 3, ml: 0, teaching: 2 },
    source: "project-masari",
    approved: true,
    bullets: [
      { id: "prj-masari-app", text: "Launched a CV builder in Arabic and English with a live preview and on-device vector PDF export; about 1,600 active users and 1,250+ CVs downloaded (my own count).", relevance: { general: 3, backend: 1, "ai-agents": 1, "full-stack": 3, ml: 0, teaching: 2 }, source: "project-masari", approved: true },
      { id: "prj-masari-private", text: "No account and no server: editing and storage stay in the browser's local storage.", relevance: { general: 1, backend: 1, "ai-agents": 0, "full-stack": 2, ml: 0, teaching: 1 }, source: "project-masari", approved: true }
    ]
  },
  {
    id: "prj-wareva",
    section: "projects",
    title: "WAREVA",
    meta: "Ablution water reuse for irrigation · Team lead, software and AI · Miyahathon 3",
    links: [
      { label: "3D demo", href: "https://sultalfaifi.com/mawrid-water-reuse/experience/" },
      { label: "GitHub", href: "https://github.com/SultanAlfaifi/mawrid-water-reuse" }
    ],
    relevance: { general: 2, backend: 2, "ai-agents": 1, "full-stack": 2, ml: 2, teaching: 1 },
    source: "project-mawrid",
    approved: true,
    bullets: [
      { id: "prj-wareva-control", text: "Built a browser model of a water-reuse plant that holds irrigation whenever a quality reading fails and logs every decision with its reason (Three.js, Python, SQLite).", relevance: { general: 2, backend: 2, "ai-agents": 1, "full-stack": 3, ml: 2, teaching: 1 }, source: "project-mawrid", approved: true },
      { id: "prj-wareva-final", text: "Through to the Miyahathon 3 modeling race and final; readings in the demo are simulated, and the anomaly detector has been tested on public datasets only.", relevance: { general: 2, backend: 1, "ai-agents": 1, "full-stack": 1, ml: 2, teaching: 1 }, source: "project-mawrid", approved: true }
    ]
  },
  {
    id: "prj-danna",
    section: "projects",
    title: "DANNA",
    meta: "Arabic AI voice assistant · approved Alexa skill",
    dates: "Mar 2026",
    links: [{ label: "GitHub", href: "https://github.com/SultanAlfaifi/DANNA" }],
    relevance: { general: 1, backend: 2, "ai-agents": 2, "full-stack": 1, ml: 1, teaching: 1 },
    source: "project-danna",
    approved: true,
    bullets: [
      { id: "prj-danna-skill", text: "Built an Arabic Alexa voice assistant for the Saudi dialect in Python on AWS Lambda, with the Alexa Skills Kit and the OpenAI API; approved as an Alexa skill.", relevance: { general: 1, backend: 2, "ai-agents": 2, "full-stack": 1, ml: 1, teaching: 1 }, source: "project-danna", approved: true },
      { id: "prj-danna-context", text: "Kept session history for follow-up questions, cleaned input, and kept answers short enough to listen to.", relevance: { general: 1, backend: 1, "ai-agents": 2, "full-stack": 1, ml: 1, teaching: 0 }, source: "project-danna", approved: true }
    ]
  },
  {
    id: "prj-kaust",
    section: "projects",
    title: "KAUST AI projects",
    meta: "Deep learning coursework · KAUST Academy",
    links: [{ label: "GitHub", href: "https://github.com/SultanAlfaifi/KAUST-AI-Projects" }],
    relevance: { general: 1, backend: 0, "ai-agents": 1, "full-stack": 0, ml: 3, teaching: 1 },
    source: "project-kaust-ai-projects",
    approved: true,
    bullets: [
      { id: "prj-kaust-cnn", text: "Built a 5-layer CNN from scratch in PyTorch for potato leaf disease: 98.61% best validation accuracy on 3 PlantVillage classes in one experiment.", relevance: { general: 1, backend: 0, "ai-agents": 1, "full-stack": 0, ml: 3, teaching: 1 }, source: "project-kaust-ai-projects", approved: true },
      { id: "prj-kaust-segmentation", text: "Segmented underwater scenes and satellite water bodies with U-Net and an EfficientNet-B1 encoder, and applied ResNet-18 transfer learning.", relevance: { general: 1, backend: 0, "ai-agents": 0, "full-stack": 0, ml: 3, teaching: 0 }, source: "project-kaust-ai-projects", approved: true }
    ]
  },
  {
    id: "prj-tabayun",
    section: "projects",
    title: "Tabayun",
    meta: "Graduation project · Umm Al-Qura University · not public yet",
    links: [],
    relevance: { general: 1, backend: 1, "ai-agents": 1, "full-stack": 1, ml: 0, teaching: 0 },
    source: "project-tabayun",
    approved: true,
    bullets: [
      { id: "prj-tabayun-compare", text: "Compares a visitor's home-country laws with Saudi regulations and points out the differences; supervised by Dr. Ahmed D. Alharthi.", relevance: { general: 1, backend: 1, "ai-agents": 1, "full-stack": 1, ml: 0, teaching: 0 }, source: "project-tabayun", approved: true }
    ]
  }
];

export const cvRecognition: CvLine[] = [
  { id: "rec-kaust", text: "Top 5%, KAUST Academy AI specialization (in-person advanced stage in machine learning and deep learning with PyTorch)", relevance: { general: 3, backend: 2, "ai-agents": 3, "full-stack": 2, ml: 3, teaching: 2 }, source: "achievements", approved: true },
  { id: "rec-ibm", text: "Final stage, IBM AI Experiential Learning Lab: one of 600 learners; our multi-agent healthcare project, Afiyah, scored 5/5 on every criterion", relevance: { general: 3, backend: 1, "ai-agents": 3, "full-stack": 1, ml: 2, teaching: 2 }, source: "achievements", approved: true },
  { id: "rec-amad", text: "Finalist, Hackathon Amd (Alinma Bank × Tuwaiq Academy) with AutoFlow", relevance: { general: 2, backend: 2, "ai-agents": 2, "full-stack": 3, ml: 1, teaching: 1 }, source: "achievements", approved: true },
  { id: "rec-miyahathon", text: "Miyahathon 3 (Saudi Water Authority innovation program): team through to the modeling race and final, Oct 2026", relevance: { general: 2, backend: 1, "ai-agents": 1, "full-stack": 2, ml: 2, teaching: 1 }, source: "achievements", approved: true },
  { id: "rec-interface", text: "First place, Program Interface Design Challenge, UQU Computer Club, Oct 2025", relevance: { general: 1, backend: 0, "ai-agents": 0, "full-stack": 2, ml: 0, teaching: 1 }, source: "achievements", approved: true },
  { id: "rec-darah", text: "Selected by the King Abdulaziz Foundation (Darah) to represent UQU at the National History Lab, Feb 2025", relevance: { general: 1, backend: 0, "ai-agents": 0, "full-stack": 0, ml: 0, teaching: 2 }, source: "achievements", approved: true }
];

export const cvEducation: CvLine = {
  id: "edu-uqu",
  text: "Software Engineering, Umm Al-Qura University, Makkah · 2023 – expected 2027",
  relevance: { general: 3, backend: 3, "ai-agents": 3, "full-stack": 3, ml: 3, teaching: 3 },
  source: "about",
  approved: true
};

export const cvTraining: CvLine[] = [
  { id: "trn-nvidia", text: "NVIDIA Deep Learning Institute: Fundamentals of Deep Learning", relevance: { general: 2, backend: 0, "ai-agents": 1, "full-stack": 0, ml: 3, teaching: 1 }, source: "journey", approved: true },
  { id: "trn-umich", text: "University of Michigan: Introduction to Data Science in Python, and a four-course Python series (2025)", relevance: { general: 2, backend: 1, "ai-agents": 1, "full-stack": 1, ml: 3, teaching: 1 }, source: "journey", approved: true, link: { label: "verify", href: "https://www.coursera.org/verify/4NAKX19FC78R" } },
  { id: "trn-ibm-genai", text: "IBM: Using Generative AI for Software Development (Feb 2025)", relevance: { general: 2, backend: 2, "ai-agents": 2, "full-stack": 2, ml: 1, teaching: 1 }, source: "journey", approved: true },
  { id: "trn-dlai", text: "DeepLearning.AI: Linear Algebra for Machine Learning and Data Science", relevance: { general: 1, backend: 0, "ai-agents": 1, "full-stack": 0, ml: 3, teaching: 0 }, source: "journey", approved: true },
  { id: "trn-mckinsey", text: "McKinsey.org Forward Program: ten weeks of structured problem solving and communication", relevance: { general: 1, backend: 1, "ai-agents": 1, "full-stack": 1, ml: 1, teaching: 2 }, source: "journey", approved: true },
  { id: "trn-google-agile", text: "Google Agile Essentials (Jun 2025)", relevance: { general: 1, backend: 1, "ai-agents": 0, "full-stack": 1, ml: 0, teaching: 1 }, source: "journey", approved: true }
];

export const cvTeaching: CvLine[] = [
  { id: "tch-bootcamp", text: "Trainer, AI Agents Bootcamp, Artificial Intelligence Pioneers (3 days): fundamentals, tools, memory, planning, and multi-agent workflows, ending with a live build", relevance: { general: 2, backend: 0, "ai-agents": 2, "full-stack": 0, ml: 1, teaching: 3 }, source: "community", approved: true },
  { id: "tch-workshops", text: "AI workshops for Fazzah Voluntary National Association (Madinah) and Riadiat (AI for business)", relevance: { general: 1, backend: 0, "ai-agents": 1, "full-stack": 0, ml: 0, teaching: 3 }, source: "community", approved: true },
  { id: "tch-audience", text: "Explain AI tools and agents in Arabic to 4.5K+ followers on X; 180+ volunteer hours across 11 initiatives", relevance: { general: 1, backend: 0, "ai-agents": 1, "full-stack": 0, ml: 0, teaching: 3 }, source: "community", approved: true }
];
