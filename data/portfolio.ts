export type Nullable<T> = T | null;

export type Link = {
  label: string;
  href: string;
};

export type SocialLink = Link & {
  platform: "GitHub" | "LinkedIn" | "X" | "Email";
  audience?: string;
};

export type Expertise = {
  title: string;
  description: string;
  emphasis: boolean;
  signal: string;
};

export type Project = {
  slug: string;
  title: string;
  category: string;
  role: string;
  description: string;
  highlights: string[];
  technologies: string[];
  featured?: boolean;
  status?: string;
  challenge?: string;
  decision?: string;
  evidence?: string;
  imagePresentation?: "contain" | "cover" | "icon";
  primaryAction?: Link;
  flow?: string[];
  metrics?: {
    value: string;
    label: string;
  }[];
  outcome: Nullable<string>;
  repository: Nullable<string>;
  liveDemo: Nullable<string>;
  screenshot: Nullable<string>;
  brandAssetId: Nullable<string>;
  flagship: boolean;
  enabled: boolean;
  todo: Nullable<string>;
};

export type Experience = {
  organization: string;
  role: string;
  dates: string;
  location: string;
  description: string;
  responsibilities: string[];
  technologies: string[];
  note: string;
  assetId: Nullable<string>;
};

export type SkillGroup = {
  title: string;
  skills: string[];
  strongest?: string[];
};

export type Achievement = {
  title: string;
  description: string;
  signal: string;
  issuer: string;
  date: Nullable<string>;
  verificationUrl: Nullable<string>;
  enabled: boolean;
  assetId: Nullable<string>;
  // Short line for the hero ticker when the title already says what the signal says.
  ticker?: string;
};

export type Certification = {
  name: string;
  issuer: string;
  date: string;
  credentialUrl: Nullable<string>;
};

export type ProofMetric = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  source: string;
};

export type Program = {
  name: string;
  issuer: string;
  summary: string;
  focus: string[];
  recognition: Nullable<string>;
  year: Nullable<string>;
  credentialUrl: Nullable<string>;
  flagship: boolean;
  enabled: boolean;
  assetId: Nullable<string>;
};

export type Workshop = {
  title: string;
  meta: string;
  description: string;
  organizationUrl: Nullable<string>;
  primary: boolean;
};

export type Recommendation = {
  name: string;
  initials: string;
  roles: string[];
  quote: string;
  tags: string[];
  publicUrl: Nullable<string>;
  note: Nullable<string>;
  contextAssetIds: string[];
};

export type ContentPillar = {
  title: string;
  description: string;
};

export type Organization = {
  name: string;
  category: string;
  relationship: string;
  journeyNote: string;
  colors: [string, string, ...string[]];
  foreground: "light" | "dark";
  logo: Nullable<string>;
  url: Nullable<string>;
  visible: boolean;
};

export type PortfolioAsset = {
  id: string;
  sourceFile: string;
  kind: "logo" | "portrait";
  alt: string;
  assignments: string[];
  displayRole: "primary" | "supporting" | "organization" | "context";
  publicApproved: boolean;
  enabled: boolean;
  derived: {
    color: string;
    monochrome: Nullable<string>;
  };
  visualScale: number;
  objectPosition: string;
  trim: "auto" | "none";
  safePadding: number;
  background: "auto" | "transparent" | "neutral-tile";
  logoVariant: Nullable<"color" | "monochrome" | "neutral-tile">;
  monochromeEnabled: boolean;
  provenance: "supplied-official" | "supplied-unverified";
  notes: Nullable<string>;
};

export const portfolioAssets: PortfolioAsset[] = [
  {
    id: "danna",
    sourceFile: "DANA copy 2.png",
    kind: "logo",
    alt: "DANNA Arabic AI voice assistant brand mark",
    assignments: ["DANNA project"],
    displayRole: "primary",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/danna-color.webp",
      monochrome: null
    },
    visualScale: 0.92,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 32,
    background: "auto",
    logoVariant: "color",
    monochromeEnabled: false,
    provenance: "supplied-unverified",
    notes: "Project branding; intentionally excluded from the organization rail."
  },
  {
    id: "deeplearning-ai",
    sourceFile: "dlai-logo.png",
    kind: "logo",
    alt: "DeepLearning.AI logo",
    assignments: ["Certification card", "Organization logo rail"],
    displayRole: "organization",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/deeplearning-ai-color.webp",
      monochrome: "/assets/logos/deeplearning-ai-mono.webp"
    },
    visualScale: 1.04,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 24,
    background: "auto",
    logoVariant: "monochrome",
    monochromeEnabled: true,
    provenance: "supplied-unverified",
    notes: null
  },
  {
    id: "ibm",
    sourceFile: "IBM_logo.svg",
    kind: "logo",
    alt: "IBM logo",
    assignments: [
      "IBM program",
      "Recommendation context",
      "Organization logo rail"
    ],
    displayRole: "organization",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/ibm-color.webp",
      monochrome: "/assets/logos/ibm-mono.webp"
    },
    visualScale: 0.88,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 28,
    background: "auto",
    logoVariant: "monochrome",
    monochromeEnabled: true,
    provenance: "supplied-unverified",
    notes: "Original SVG remains unchanged."
  },
  {
    id: "kaust-academy",
    sourceFile: "KAUST Academy.png",
    kind: "logo",
    alt: "KAUST Academy bilingual logo",
    assignments: [
      "KAUST program",
      "Top 5% achievement",
      "Organization logo rail"
    ],
    displayRole: "organization",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/kaust-academy-color.webp",
      monochrome: "/assets/logos/kaust-academy-mono.webp"
    },
    visualScale: 1.02,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 24,
    background: "auto",
    logoVariant: "monochrome",
    monochromeEnabled: true,
    provenance: "supplied-official",
    notes: "Used in place of the separate KAUST University logo."
  },
  {
    id: "kaust-university",
    sourceFile: "KAUST_Logo.svg",
    kind: "logo",
    alt: "King Abdullah University of Science and Technology logo",
    assignments: ["Disabled future asset"],
    displayRole: "context",
    publicApproved: true,
    enabled: false,
    derived: {
      color: "/assets/logos/kaust-university-color.webp",
      monochrome: "/assets/logos/kaust-university-mono.webp"
    },
    visualScale: 0.94,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 24,
    background: "auto",
    logoVariant: "color",
    monochromeEnabled: true,
    provenance: "supplied-unverified",
    notes: "Disabled because the relationship represented is KAUST Academy."
  },
  {
    id: "salla",
    sourceFile: "logo-wide.svg",
    kind: "logo",
    alt: "Salla bilingual logo",
    assignments: ["Salla experience", "Organization logo rail"],
    displayRole: "organization",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/salla-color.webp",
      monochrome: "/assets/logos/salla-mono.webp"
    },
    visualScale: 0.9,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 28,
    background: "auto",
    logoVariant: "monochrome",
    monochromeEnabled: true,
    provenance: "supplied-official",
    notes: "Original SVG remains unchanged."
  },
  {
    id: "mckinsey",
    sourceFile: "McKinsey_Script_Mark_2019.svg.webp",
    kind: "logo",
    alt: "McKinsey and Company logo",
    assignments: ["McKinsey Forward card", "Organization logo rail"],
    displayRole: "organization",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/mckinsey-color.webp",
      monochrome: "/assets/logos/mckinsey-mono.webp"
    },
    visualScale: 0.92,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 24,
    background: "auto",
    logoVariant: "monochrome",
    monochromeEnabled: true,
    provenance: "supplied-unverified",
    notes: null
  },
  {
    id: "nvidia",
    sourceFile: "NVIDIA_logo.svg.webp",
    kind: "logo",
    alt: "NVIDIA logo",
    assignments: ["NVIDIA certification", "Organization logo rail"],
    displayRole: "organization",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/nvidia-color.webp",
      monochrome: "/assets/logos/nvidia-mono.webp"
    },
    visualScale: 1,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 24,
    background: "auto",
    logoVariant: "monochrome",
    monochromeEnabled: true,
    provenance: "supplied-unverified",
    notes: null
  },
  {
    id: "portrait",
    sourceFile: "Personal Photo 1.png",
    kind: "portrait",
    alt: "Portrait of Sultan Alfaifi wearing traditional Saudi attire",
    assignments: ["About primary portrait"],
    displayRole: "primary",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/portrait/sultan-alfaifi.webp",
      monochrome: null
    },
    visualScale: 1,
    objectPosition: "50% 100%",
    trim: "none",
    safePadding: 0,
    background: "transparent",
    logoVariant: null,
    monochromeEnabled: false,
    provenance: "supplied-official",
    notes: "Never run through logo trimming or monochrome processing."
  },
  {
    id: "masari",
    sourceFile: "Screenshot 2026-07-29 162102.png",
    kind: "logo",
    alt: "Masari Arabic resume builder logo",
    assignments: ["Masari project"],
    displayRole: "supporting",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/masari-color.webp",
      monochrome: null
    },
    visualScale: 1,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 12,
    background: "auto",
    logoVariant: "color",
    monochromeEnabled: false,
    provenance: "supplied-official",
    notes: "Limited resolution; never upscale beyond its source artwork size."
  },
  {
    id: "tabayun",
    sourceFile: "tabayun-logo.png",
    kind: "logo",
    alt: "Tabayun Arabic wordmark",
    assignments: ["Tabayun project"],
    displayRole: "primary",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/tabayun-color.webp",
      monochrome: null
    },
    visualScale: 0.96,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 24,
    background: "auto",
    logoVariant: "color",
    monochromeEnabled: false,
    provenance: "supplied-official",
    notes: "Project branding; intentionally excluded from the organization rail."
  },
  {
    id: "university-michigan",
    sourceFile: "University-of-Michigan-Logo.png",
    kind: "logo",
    alt: "University of Michigan logo",
    assignments: ["Certification card", "Organization logo rail"],
    displayRole: "organization",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/university-michigan-color.webp",
      monochrome: "/assets/logos/university-michigan-mono.webp"
    },
    visualScale: 0.94,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 24,
    background: "auto",
    logoVariant: "monochrome",
    monochromeEnabled: true,
    provenance: "supplied-unverified",
    notes: "Large source canvas requires whitespace-aware trimming."
  },
  {
    id: "uqu",
    sourceFile: "UQU.png",
    kind: "logo",
    alt: "Umm Al-Qura University bilingual logo",
    assignments: [
      "About education context",
      "Dr. Ahmed recommendation context",
      "Organization logo rail"
    ],
    displayRole: "organization",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/uqu-color.webp",
      monochrome: "/assets/logos/uqu-mono.webp"
    },
    visualScale: 0.96,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 24,
    background: "auto",
    logoVariant: "monochrome",
    monochromeEnabled: true,
    provenance: "supplied-unverified",
    notes: null
  },
  {
    id: "riadiat",
    sourceFile: "logo-header.f52d9df.svg",
    kind: "logo",
    alt: "Riadiat entrepreneurship platform logo",
    assignments: ["Riadiat workshop", "Organization logo rail"],
    displayRole: "organization",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/riadiat-color.webp",
      monochrome: "/assets/logos/riadiat-mono.webp"
    },
    visualScale: 1.04,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 18,
    background: "auto",
    logoVariant: "monochrome",
    monochromeEnabled: true,
    provenance: "supplied-official",
    notes: "Supplied SVG contains an embedded official raster mark; original remains unchanged."
  },
  {
    id: "fazzah",
    sourceFile: "69f11a3d9b9537.54539445 1.png",
    kind: "logo",
    alt: "Fazzah Voluntary National Association bilingual logo",
    assignments: ["Fazzah workshop", "Organization logo rail"],
    displayRole: "organization",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/fazzah-color.webp",
      monochrome: "/assets/logos/fazzah-mono.webp"
    },
    visualScale: 1.06,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 20,
    background: "transparent",
    logoVariant: "monochrome",
    monochromeEnabled: true,
    provenance: "supplied-official",
    notes: null
  },
  {
    id: "ai-pioneers",
    sourceFile: "AIP.png",
    kind: "logo",
    alt: "Artificial Intelligence Pioneers logo",
    assignments: ["AI Agents Bootcamp", "Organization logo rail"],
    displayRole: "organization",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/ai-pioneers-color.webp",
      monochrome: "/assets/logos/ai-pioneers-mono.webp"
    },
    visualScale: 0.88,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 20,
    background: "transparent",
    logoVariant: "monochrome",
    monochromeEnabled: true,
    provenance: "supplied-official",
    notes: "Symbol-only supplied mark; the organization name remains available to assistive technology."
  },
  {
    id: "amad-hackathon",
    sourceFile: "amad-logo.png",
    kind: "logo",
    alt: "Amad Hackathon Arabic logo",
    assignments: ["Amad FinTech Hackathon finalist achievement"],
    displayRole: "context",
    publicApproved: true,
    enabled: true,
    derived: {
      color: "/assets/logos/amad-hackathon-color.webp",
      monochrome: null
    },
    visualScale: 0.96,
    objectPosition: "50% 50%",
    trim: "auto",
    safePadding: 18,
    background: "transparent",
    logoVariant: "color",
    monochromeEnabled: false,
    provenance: "supplied-official",
    notes: "Used in detailed achievement context only."
  }
];

export function getPortfolioAsset(id: Nullable<string>) {
  if (!id) return null;
  return portfolioAssets.find((asset) => asset.id === id && asset.enabled) ?? null;
}

export const sectionOrder = [
  "home",
  "about",
  "expertise",
  "work",
  "experience",
  "skills",
  "achievements",
  "journey",
  "community",
  "recommendations",
  "ideas",
  "contact"
] as const;

export const navigation = [
  { label: "Work", href: "#work" },
  { label: "Recognition", href: "#achievements" },
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" }
] satisfies Link[];

export const identity = {
  name: "Sultan Alfaifi",
  arabicName: "سلطان الفيفي",
  arabicRole: "مهندس برمجيات Full-Stack متخصص في وكلاء الذكاء الاصطناعي",
  eyebrow: "Sultan Alfaifi / Full-Stack Software Engineer",
  role: "Full-Stack Software Engineer specializing in AI Agents",
  headline:
    "I build AI agents that check with you before they act.",
  summary:
    "I study software engineering at Umm Al-Qura in Makkah, graduating in 2027, and I’m a COOP intern at Salla. Masari, my CV builder, has about 1,600 active users. You can try most of what’s below today.",
  currently: "COOP intern at Salla",
  openTo: "Open to roles, agent builds, and workshops",
  introVideo: "/assets/media/sultan-introduction.mp4",
  location: "Makkah, Saudi Arabia",
  education: "Software Engineering, Umm Al-Qura University (graduating 2027)",
  languages: "Arabic and English",
  email: "sultalfaifi@gmail.com",
  resumeUrl: null as Nullable<string>,
  coreStack: [
    "Laravel",
    "Python",
    "Agentic AI",
    "LLM Applications",
    "REST APIs",
    "MySQL"
  ]
};

export const socialLinks: SocialLink[] = [
  {
    platform: "GitHub",
    label: "GitHub",
    href: "https://github.com/SultanAlfaifi"
  },
  {
    platform: "LinkedIn",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/alfaifi-sultan/",
    audience: "2K+ followers"
  },
  {
    platform: "X",
    label: "X",
    href: "https://x.com/SultAlfaifi/",
    audience: "4.5K+ followers"
  },
  {
    platform: "Email",
    label: "Email",
    href: "mailto:sultalfaifi@gmail.com"
  }
];

export const about = {
  paragraphs: [
    "I’m Sultan, a software engineering student at Umm Al-Qura University in Makkah. Since I launched Masari in February 2026, I’ve put a new project on GitHub almost every month. Most of them are public, so you can read the code yourself.",
    "I build AI agents and the tools they need, mostly in Python and JavaScript, and I make them show their work. RAJIH keeps a record of every run, so you can see why one idea beat the others.",
    "Arabic is my first language, and I build with Arabic speakers in mind. DANNA is an Alexa voice assistant built for the Saudi dialect, and AutoFlow works fully in Arabic, right to left, voice assistant included."
  ],
  portraitAssetId: "portrait",
  educationAssetId: "uqu",
  metadata: [
    { label: "Based in", value: identity.location },
    { label: "Education", value: identity.education },
    { label: "Focus", value: "Full-stack engineering and AI agents" },
    { label: "Languages", value: identity.languages }
  ]
};

export type HelpPath = {
  audience: string;
  need: string;
  offer: string;
  proof: string;
  cta: Link;
};

// Who lands here and what they need from Sultan. Rendered just before Contact.
export const helpPaths: HelpPath[] = [
  {
    audience: "Hiring an engineer",
    need: "You want someone who takes a ticket and finishes it, tests included.",
    offer: "I build REST endpoints in Laravel that validate input, handle errors, and come with tests. Mustakshif, RAJIH, and AutoFlow ship with tests you can run.",
    proof: "COOP at Salla since June 2026 · Graduating 2027",
    cta: { label: "Email me about a role", href: "mailto:sultalfaifi@gmail.com?subject=A%20role%20for%20you" }
  },
  {
    audience: "Building an AI product",
    need: "You want an agent that serves your customers in Arabic and asks before it does anything that matters.",
    offer: "Send me the one task it should handle and what it must never do on its own. I’ll design the tools, memory, and approval step around that, and tell you plainly what the model can’t do yet.",
    proof: "AutoFlow, Hackathon Amd finalist · Masari, about 1,600 active users",
    cta: { label: "Tell me about your product", href: "mailto:sultalfaifi@gmail.com?subject=An%20AI%20product" }
  },
  {
    audience: "Running a program or community",
    need: "You need someone who can teach AI agents in Arabic to people who have never built one.",
    offer: "I ran a three-day agents bootcamp for Artificial Intelligence Pioneers: tools, memory, planning, then a hands-on build. I’ve also given AI workshops for Fazzah in Madinah and for Riadiat.",
    proof: "Artificial Intelligence Pioneers · Fazzah · Riadiat · 4.5K+ followers on X",
    cta: { label: "Invite me to run a workshop", href: "mailto:sultalfaifi@gmail.com?subject=Workshop%20invitation" }
  }
];

export type JourneyStop = {
  date: string;
  kind: "Education" | "Recognition" | "Learning" | "Product" | "Career" | "Open source" | "Hackathon" | "Now";
  title: string;
  detail: string;
};

// Dated from LinkedIn, the CV, and public GitHub release/creation dates. Undated recognitions stay in Recognition only.
export const journey: JourneyStop[] = [
  { date: "2023", kind: "Education", title: "Started software engineering at UQU", detail: "Umm Al-Qura University, Makkah." },
  { date: "Feb 2025", kind: "Recognition", title: "Selected for the National History Lab", detail: "The King Abdulaziz Foundation (Darah) picked me to represent UQU nationally." },
  { date: "Feb 2025", kind: "Learning", title: "Generative AI for software development", detail: "IBM certificate on using generative AI while writing code." },
  { date: "Oct 2025", kind: "Recognition", title: "First place in interface design", detail: "UQU Computer Club challenge, during Skills Week." },
  { date: "Dec 2025", kind: "Learning", title: "Data science in Python", detail: "University of Michigan, after its four-course Python series in November." },
  { date: "Feb 2026", kind: "Product", title: "Launched Masari", detail: "A CV builder that keeps your data on your device." },
  { date: "Mar 2026", kind: "Product", title: "Published DANNA’s source", detail: "My Arabic voice assistant on Alexa, approved as a skill. It remembers earlier turns in the conversation." },
  { date: "Jun 2026", kind: "Career", title: "Joined Salla", detail: "COOP training, mostly on the back end." },
  { date: "Jul 2026", kind: "Product", title: "Released Mustakshif v0.4", detail: "Tells you which local AI models should run on your Windows PC, and why." },
  { date: "Sep 2026", kind: "Product", title: "Released RAJIH Engine v0.4.1", detail: "AI agents draft and critique ideas, and close calls stop for a person. Source-available." },
  { date: "Oct 2026", kind: "Open source", title: "Released Mashhad v1.2", detail: "An Agent Skill that walks Codex or Claude Code through making a motion video, Arabic included." },
  { date: "Oct 2026", kind: "Hackathon", title: "Entered the Nebius AI hackathon", detail: "AccessFinish checks whether an AI fix lets a keyboard-only user finish a booking. Built on NVIDIA Nemotron." },
  { date: "Oct 2026", kind: "Hackathon", title: "Qualified for the Miyahathon final", detail: "After the in-person camp in Rabigh, my team WAREVA moved on to the modeling race." },
  { date: "Next", kind: "Now", title: "Reliable Arabic AI agents", detail: "I’m testing how agents use tools and memory, when they stop to ask, and how they fail. If this is your research area, email me." }
];

export const principles = [
  "I check what actually got saved. AccessFinish counts a fix only when the booking in the database is right.",
  "Anything with consequences waits for your yes. Mustakshif asks before it downloads a model, and AutoFlow drafts stay off until you approve them.",
  "Agents get the context they need and no more. AutoFlow’s assistant never sees credentials or card details.",
  "I write down what isn’t proven yet. I haven’t checked whether RAJIH beats other approaches, and its page says so. Mustakshif calls its own picks estimates.",
  "Arabic gets the same care as English. Mashhad keeps Arabic letters connected and in the right direction."
];

export const organizations: Organization[] = [
  {
    name: "Salla",
    category: "Experience",
    relationship: "COOP Experience",
    journeyNote: "COOP intern since June 2026, mostly on the back end.",
    colors: ["#004856", "#a5ffe0"],
    foreground: "light",
    logo: "salla",
    url: "https://salla.com/",
    visible: true
  },
  {
    name: "Umm Al-Qura University",
    category: "Education",
    relationship: "Software Engineering Education",
    journeyNote: "Where I study software engineering. Dr. Ahmed Alharthi supervises my graduation project, Tabayun.",
    colors: ["#01686f", "#b08b44"],
    foreground: "light",
    logo: "uqu",
    url: "https://uqu.edu.sa/",
    visible: true
  },
  {
    name: "KAUST Academy",
    category: "Programs",
    relationship: "AI program",
    journeyNote: "Four computer-vision projects in PyTorch came out of it, all on GitHub.",
    colors: ["#efb61d", "#cccd2b", "#f09021", "#07a6aa"],
    foreground: "dark",
    logo: "kaust-academy",
    url: "https://academy.kaust.edu.sa/",
    visible: true
  },
  {
    name: "IBM",
    category: "Programs",
    relationship: "AI program",
    journeyNote: "One of 600 learners in the final stage of the AI Experiential Learning Lab. Our team’s project, Afiyah, scored 5/5.",
    colors: ["#1f70c1", "#5177fe"],
    foreground: "light",
    logo: "ibm",
    url: "https://skillsbuild.org/",
    visible: true
  },
  {
    name: "NVIDIA Deep Learning Institute",
    category: "Certifications",
    relationship: "Certification",
    journeyNote: "I trained neural networks in the course’s hands-on labs and passed its competency-based assessment.",
    colors: ["#74b200", "#37ca00"],
    foreground: "dark",
    logo: "nvidia",
    url: "https://www.nvidia.com/en-us/training/",
    visible: true
  },
  {
    name: "DeepLearning.AI",
    category: "Certifications",
    relationship: "Certification",
    journeyNote: "I took their course Linear Algebra for Machine Learning and Data Science.",
    colors: ["#ff4a61", "#ac3f46"],
    foreground: "light",
    logo: "deeplearning-ai",
    url: "https://www.deeplearning.ai/",
    visible: true
  },
  {
    name: "University of Michigan",
    category: "Certifications",
    relationship: "Certification",
    journeyNote: "Five verified Coursera courses, from Python basics to data analysis with Pandas.",
    colors: ["#ffcb0b", "#00274c"],
    foreground: "light",
    logo: "university-michigan",
    url: "https://umich.edu/",
    visible: true
  },
  {
    name: "McKinsey.org",
    category: "Programs",
    relationship: "Forward program",
    journeyNote: "Ten weeks of practice in structured problem solving and in explaining the answer clearly.",
    colors: ["#042f87", "#051c2c"],
    foreground: "light",
    logo: "mckinsey",
    url: "https://www.mckinsey.org/our-programs/forward/overview",
    visible: true
  },
  {
    name: "Artificial Intelligence Pioneers",
    category: "Community",
    relationship: "Bootcamp trainer",
    journeyNote: "I taught their three-day AI Agents Bootcamp, from agent basics to building one.",
    colors: ["#7761a9", "#3b2066"],
    foreground: "light",
    logo: "ai-pioneers",
    url: "https://www.aip.sa/",
    visible: true
  },
  {
    name: "Fazzah Voluntary National Association",
    category: "Community",
    relationship: "AI workshop",
    journeyNote: "I gave an introductory AI workshop for them in Madinah.",
    colors: ["#285572", "#d2a901"],
    foreground: "light",
    logo: "fazzah",
    url: "https://www.fazzah.org/",
    visible: true
  },
  {
    name: "Riadiat",
    category: "Community",
    relationship: "AI for Business workshop",
    journeyNote: "I gave their AI for Business workshop, on where AI fits into day-to-day business work.",
    colors: ["#1fb9b3", "#0a716d"],
    foreground: "light",
    logo: "riadiat",
    url: "https://riadiat.sa/",
    visible: true
  }
];

export const expertise: Expertise[] = [
  {
    title: "Full-Stack Development",
    description:
      "Web apps where I own the whole feature: the screen, the API behind it, and the database table it writes to.",
    emphasis: true,
    signal: "UI / Server / Data"
  },
  {
    title: "AI Agent Systems",
    description:
      "Agents that use tools and memory across several steps, and stop to ask before anything with consequences.",
    emphasis: true,
    signal: "Goals / Tools / Memory"
  },
  {
    title: "LLM Applications",
    description:
      "LLM features with structured JSON output and validation, so the rest of the app can trust what comes back.",
    emphasis: false,
    signal: "Models / Schemas / Validation"
  },
  {
    title: "APIs & System Integration",
    description:
      "REST APIs with input validation and clear errors, connecting apps, services, and models.",
    emphasis: false,
    signal: "Services / Contracts / Flow"
  }
];

export const projects: Project[] = [
  {
    slug: "mustakshif",
    title: "Mustakshif",
    category: "Local AI model advisor",
    role: "Creator · Product & Python engineering",
    description:
      "Tells you which local AI models should run well on your Windows PC, ranked for your language and what you need, with the reason behind each pick. A desktop app in Arabic and English, plus a CLI.",
    featured: true,
    status: "Windows release · v0.4.0",
    challenge:
      "Model size alone won’t tell you whether a model fits your machine or your task.",
    decision:
      "I wrote one scoring engine for both the app and the CLI, so they give the same answer. Models come from the official Ollama library, it works offline from a cached catalog, and nothing installs until you say yes.",
    evidence:
      "A published Windows installer, documented scoring rules, and public tests. The installer isn’t signed yet, so SmartScreen may warn you. The picks are estimates, and I haven’t calibrated them against benchmarks yet.",
    highlights: [
      "Reads your CPU, RAM, GPU, VRAM, and storage, then asks about your goal, language, speed, and privacy needs.",
      "No telemetry and no hardware uploads. The catalog downloads separately from any model weights."
    ],
    technologies: ["Python", "Windows", "Ollama", "CLI"],
    outcome: "A Windows app and CLI you can download today, with a reason for every pick.",
    repository: "https://github.com/SultanAlfaifi/mustakshif",
    liveDemo: null,
    primaryAction: {
      label: "Download for Windows",
      href: "https://github.com/SultanAlfaifi/mustakshif/releases/latest"
    },
    screenshot: "/assets/projects/mustakshif-icon.png",
    imagePresentation: "icon",
    flow: ["Device scan", "Your preferences", "Ranked picks, with reasons"],
    metrics: [
      { value: "160+", label: "Release downloads" },
      { value: "11", label: "GitHub stars" }
    ],
    brandAssetId: null,
    flagship: true,
    enabled: true,
    todo: null
  },
  {
    slug: "accessfinish",
    title: "AccessFinish",
    category: "Verified AI code repair",
    role: "Creator · Agent engineering & evaluation",
    description:
      "An AI patch can pass the build while a keyboard-only user still can’t book. AccessFinish runs each NVIDIA Nemotron fix in a sealed sandbox, then checks the saved booking in the database and a fresh browser before calling it fixed.",
    featured: true,
    status: "Nebius Global AI Hackathon entry · v0.2.0 in progress",
    challenge:
      "A green build or a confirmation page won’t tell you whether a keyboard-only user finished the task. In this app, the page could say “booked” while the database held the wrong day.",
    decision:
      "I let the task outcome decide. In v0.1, I hashed the prompt, source, test data, and evaluator before any run and approved each proposal by its hash. The current loop retries on its own, up to 8 times, but every attempt is built and tested in sealed containers with no network, against a test copy of the app. A fix counts only when the saved booking is right.",
    evidence:
      "Earlier evaluation: five frozen single-shot trials on one keyboard case. 2 of 5 passed the full procedure, and every failure is published with raw evidence. You can replay those recorded runs in the browser without any model calls. Live runs on 24 Oct, on a pinned copy of Easy!Appointments with synthetic data: 7 of 7 verified on a fault I seeded on purpose, and 0 of 7 on a real upstream bug across 43 attempts.",
    highlights: [
      "Nemotron 3 Super proposes literal edits. An edit has to match the source exactly once, or it’s rejected.",
      "On the real upstream bug, the agent never got it right in 43 attempts. Fifteen times it reached a “booked” page with the wrong day saved, and the verifier rejected every one."
    ],
    technologies: ["NVIDIA Nemotron", "Nebius Token Factory", "Docker", "Node.js", "Evaluation"],
    metrics: [
      { value: "7 / 7", label: "Fixes verified on a fault I seeded" },
      { value: "2 / 5", label: "Early trials that passed in full" }
    ],
    outcome: "A repair loop that accepts a fix only once the booking is saved correctly.",
    repository: "https://github.com/SultanAlfaifi/accessfinish",
    liveDemo: "https://sultalfaifi.com/accessfinish/",
    primaryAction: {
      label: "Read the evidence",
      href: "https://sultalfaifi.com/accessfinish/"
    },
    screenshot: null,
    flow: ["Nemotron patch", "Sealed sandbox build", "Keyboard-only booking", "Database & fresh browser"],
    brandAssetId: null,
    flagship: false,
    enabled: true,
    todo: null
  },
  {
    slug: "mashhad",
    title: "Mashhad",
    category: "Open-source Agent Skill for motion design",
    role: "Creator · Agent Skill design & motion direction",
    description:
      "Write a short brief, and Mashhad walks Codex or Claude Code through scenes, sound, and render, then a check of the frames and the rendered file before the final cut. Arabic text keeps its direction and its connected letters. An open-source Agent Skill.",
    featured: true,
    status: "Open source · v1.2.0 · Codex & Claude Code",
    challenge:
      "Coding agents can render video, but left alone they skip the brief, break Arabic letters apart, and add music nobody asked for.",
    decision:
      "I kept it to one portable skill: a focused brief first, one main renderer picked per job, no music unless you ask for it, and a check of the frames and the rendered file before the final render.",
    evidence:
      "Public source and an Arabic demo with sound effects only that you can rebuild from its source. Claude Code support follows the documented Agent Skills format. I haven’t tested it in an interactive Claude Code session yet.",
    highlights: [
      "Renderer guidance for Remotion, HyperFrames, and Motion Canvas.",
      "Optional ElevenLabs narration, with scenes timed to the actual recording."
    ],
    technologies: ["Agent Skills", "Remotion", "Python", "Arabic Typography", "ElevenLabs"],
    outcome: "A reusable workflow for making motion videos with coding agents.",
    repository: "https://github.com/SultanAlfaifi/mashhad-video",
    liveDemo: null,
    primaryAction: {
      label: "Watch the demo",
      href: "https://github.com/SultanAlfaifi/mashhad-video/blob/main/docs/media/mashhad-ad-sfx-1080p.mp4"
    },
    screenshot: null,
    flow: ["Brief", "Scenes", "Sound", "Render", "Review"],
    brandAssetId: null,
    flagship: false,
    enabled: true,
    todo: null
  },
  {
    slug: "rajih-engine",
    title: "RAJIH Engine",
    category: "Multi-agent decision workflow",
    role: "Creator · Agent architecture & Python engineering",
    description:
      "Give it a hackathon challenge brief. Several AI agents draft ideas on their own, then each idea goes through a structured critique and an evidence check. Close or weakly supported calls stop for a person, and every run is saved, so you can see why an idea won.",
    featured: false,
    status: "Engineering alpha · v0.4.1 · Source-available",
    challenge:
      "Teams compare ideas and then lose track of why they picked one: the reasoning, the evidence, and what they weren’t sure about.",
    decision:
      "I kept the idea agents isolated from each other, let only the orchestrator write shared state, and sent close or under-evidenced results to a human gate.",
    evidence:
      "A public CLI, adapters for several model providers, saved run records, and automated tests. I haven’t yet checked whether it picks better ideas than other approaches. The license is source-available: you can read the code, but redistribution and commercial service use are restricted.",
    highlights: [
      "Saves idea revisions, the evidence for each candidate, and the reasons for the decision as JSON and Markdown.",
      "Runs through the Codex CLI or direct model APIs, and each role can use a different provider."
    ],
    technologies: ["Python", "Multi-Agent Workflows", "Structured Outputs", "CLI"],
    outcome: "A saved record of how each idea was argued over and why one won.",
    repository: "https://github.com/SultanAlfaifi/rajih-engine",
    liveDemo: null,
    primaryAction: {
      label: "Read the architecture",
      href: "https://github.com/SultanAlfaifi/rajih-engine/blob/main/docs/architecture.md"
    },
    screenshot: null,
    flow: ["Independent ideas", "Structured critique", "Evidence checks", "Human decision"],
    brandAssetId: null,
    flagship: false,
    enabled: true,
    todo: null
  },
  {
    slug: "mawrid",
    title: "WAREVA",
    category: "Ablution water reuse for irrigation",
    role: "Team lead · Software & AI",
    description:
      "WAREVA reuses ablution and sink water from mosques and large complexes to irrigate green areas, and shuts the valve whenever a quality reading fails. I lead a team of six and build the software. The hardware comes next.",
    featured: true,
    status: "Miyahathon 3 · Through to the modeling race and final",
    challenge:
      "Reused water only helps if it’s safe. The maintenance technician running the plant needs to see the water’s quality, and irrigation has to stop on its own when a reading goes wrong.",
    decision:
      "Irrigation is held whenever a reading fails, and every allow or hold decision is logged with its reason. The 3D plant runs in the browser, backed by a local Python and SQLite service with logs and exports.",
    evidence:
      "A live 3D demo, a demo video, and public source at v0.3.0. The anomaly detector has only been tested on public datasets so far. The project started as MAWRID (مورد), and the team took the name WAREVA after a merger in October 2026.",
    highlights: [
      "Every irrigation decision comes with its reason, whether it was allowed or held.",
      "The physical plant isn’t built yet, and every reading in the demo is simulated."
    ],
    technologies: ["Three.js", "Python", "SQLite", "Anomaly Detection"],
    metrics: [
      { value: "6", label: "People on the team I lead" },
      { value: "1,000 L/h", label: "Design capacity of the plant" }
    ],
    outcome: "A browser model of a water-reuse plant that holds irrigation whenever a reading fails.",
    repository: "https://github.com/SultanAlfaifi/mawrid-water-reuse",
    liveDemo: "https://sultalfaifi.com/mawrid-water-reuse/experience/",
    primaryAction: {
      label: "Try the 3D plant",
      href: "https://sultalfaifi.com/mawrid-water-reuse/experience/"
    },
    screenshot: null,
    flow: ["Collect", "Treat", "Check readings", "Irrigate"],
    brandAssetId: null,
    flagship: false,
    enabled: true,
    todo: null
  },
  {
    slug: "autoflow",
    title: "AutoFlow",
    category: "Arabic financial automation prototype",
    role: "Creator · Product, interface & AI integration",
    description:
      "Tell AutoFlow in Arabic, by text or voice, what should happen with your money, like a payday routine. It reads the rule back as one plain sentence, and nothing it drafts turns on until you approve it. Money moves are simulated.",
    featured: true,
    status: "Hackathon Amd finalist · Money moves simulated",
    challenge:
      "A money instruction has to become a rule you can read, check, and approve yourself before anything runs.",
    decision:
      "I made text, voice, and the manual editor all write to one validated workflow schema. Anything the AI drafts is saved inactive and marked “needs review”.",
    evidence:
      "A live demo, public source, and tests for the schema, the API, and voice. Money moves are simulated. There’s no login, no database, and no real bank connection.",
    highlights: [
      "Arabic, right to left, with a plain-language summary of each trigger, safety condition, action, and approval rule.",
      "Drafts are validated on the server, and the assistant only sees the context a request needs, never credentials or card details."
    ],
    technologies: ["React", "JavaScript", "OpenAI APIs", "WebRTC"],
    outcome: "A working prototype for drafting and approving money rules.",
    repository: "https://github.com/SultanAlfaifi/AutoFlow",
    liveDemo: "https://auto-flow-ecru.vercel.app/",
    screenshot: null,
    flow: ["Your request", "Validated draft", "Your review", "Simulated action"],
    brandAssetId: null,
    flagship: false,
    enabled: true,
    todo: null
  },
  {
    slug: "danna",
    title: "DANNA",
    category: "Arabic AI voice assistant",
    role: "Creator · AI & back end",
    description:
      "An Arabic voice assistant on Alexa, built for the Saudi dialect. It keeps track of what you said earlier and answers in context.",
    highlights: [
      "Python on AWS Lambda, with the Alexa Skills Kit and the OpenAI API.",
      "Keeps session history for follow-up questions, cleans input, and keeps answers short enough to listen to."
    ],
    technologies: [
      "Python",
      "Alexa Skills Kit",
      "AWS Lambda",
      "LLM Integration",
      "OpenAI API",
      "Prompt Engineering"
    ],
    outcome: "Approved as an Alexa skill.",
    status: "Approved Alexa skill · Public source",
    repository: "https://github.com/SultanAlfaifi/DANNA",
    liveDemo: null,
    screenshot: "/assets/projects/danna.webp",
    brandAssetId: "danna",
    flagship: false,
    enabled: true,
    todo: null
  },
  {
    slug: "tabayun",
    title: "Tabayun",
    category: "Legal differences for visitors",
    role: "AI & back end",
    description:
      "Visiting Saudi Arabia? Tabayun compares your home country’s laws with Saudi regulations and points out the differences you should know. It’s my graduation project, supervised by Dr. Ahmed Alharthi. It isn’t public yet, and it doesn’t replace legal advice.",
    highlights: [
      "Started from a problem visitors have: not knowing which rules differ from home.",
      "Graduation project supervised by Dr. Ahmed D. Alharthi.",
      "Presented at a university career and innovation forum."
    ],
    technologies: [],
    outcome: null,
    status: "Graduation project · UQU",
    repository: null,
    liveDemo: null,
    screenshot: "/assets/projects/tabayun.webp",
    brandAssetId: "tabayun",
    flagship: false,
    enabled: true,
    todo: "Confirm the technology stack and add a public repository or demo if available."
  },
  {
    slug: "masari",
    title: "Masari",
    category: "Private CV builder",
    role: "Creator · Product & front end",
    description:
      "Write your CV in the browser, in Arabic or English, and download a clean PDF. No account, and your details stay on your device.",
    featured: true,
    status: "Live on GitHub Pages since Feb 2026",
    challenge:
      "You want to see your CV take shape as you type and leave with a usable PDF, without making an account or uploading your details.",
    decision:
      "I kept editing and storage in the browser, wired the form to a live preview, and generate vector PDFs on your device with pdfmake.",
    evidence:
      "The app and its source are public, so you can try the editor, the live preview, and PDF export right now. The usage numbers are my own count and aren’t audited.",
    highlights: [
      "No account and no server. Your data stays in your browser’s local storage.",
      "Arabic and English fonts, a phone-friendly editor, a live preview, and vector PDF export."
    ],
    technologies: [
      "HTML5",
      "CSS3",
      "JavaScript",
      "pdfmake",
      "localStorage"
    ],
    metrics: [
      { value: "About 1,600", label: "Active users" },
      { value: "1,250+", label: "CVs downloaded" }
    ],
    outcome: "A live CV builder with real-time editing and PDF export.",
    repository: "https://github.com/SultanAlfaifi/Masari",
    liveDemo: "https://sultanalfaifi.github.io/Masari/",
    screenshot: "/assets/projects/masari.webp",
    brandAssetId: "masari",
    flagship: false,
    enabled: true,
    todo: null
  },
  {
    slug: "kaust-ai-projects",
    title: "KAUST AI projects",
    category: "Deep learning coursework",
    role: "Student · Machine learning",
    description:
      "Four PyTorch computer-vision projects from the KAUST Academy AI specialization. One is a CNN I built from scratch for potato leaf disease, with 98.61% best validation accuracy in a single run.",
    highlights: [
      "Potato leaf disease: a 5-layer CNN from scratch, 98.61% best validation accuracy on 3 PlantVillage classes in one experiment.",
      "Segmentation with U-Net and an EfficientNet-B1 encoder on underwater scenes and satellite water bodies, plus ResNet-18 transfer learning."
    ],
    technologies: [
      "Machine Learning",
      "Deep Learning",
      "Computer Vision",
      "Neural Networks",
      "Python"
    ],
    outcome: null,
    status: "Coursework · KAUST Academy",
    repository: "https://github.com/SultanAlfaifi/KAUST-AI-Projects",
    liveDemo: null,
    screenshot: "/assets/projects/kaust-ai-projects.webp",
    brandAssetId: "kaust-academy",
    flagship: false,
    enabled: true,
    todo: null
  },
  {
    slug: "ai-skills",
    title: "Sultan AI Skills",
    category: "Open-source Agent Skills",
    role: "Creator · Agent tooling",
    description:
      "A small MIT-licensed repo of Agent Skills for Codex and Claude. One skill so far: a multiple-choice question generator, with scripts that check option lengths and place the correct answer at random.",
    status: "Open source · One skill so far",
    highlights: [
      "Every question gets exactly four choices, and a script checks that their lengths are comparable.",
      "OS-backed randomness puts the correct answer at A, B, C, or D independently."
    ],
    technologies: ["Agent Skills", "Python", "Validation"],
    outcome: null,
    repository: "https://github.com/SultanAlfaifi/ai-skills",
    liveDemo: null,
    screenshot: null,
    brandAssetId: null,
    flagship: false,
    enabled: true,
    todo: null
  }
];

export const experience: Experience[] = [
  {
    organization: "Salla",
    role: "Software Engineer Intern, COOP",
    dates: "June 2026 to present",
    location: "Makkah, Saudi Arabia",
    description:
      "Structured COOP training. Each assignment is a REST API that I build and hand in with its tests.",
    responsibilities: [
      "Build REST endpoints in Laravel and PHP that read and write MySQL.",
      "Validate input and return clear errors.",
      "Write tests for every endpoint I build."
    ],
    technologies: [
      "React",
      "JavaScript",
      "PHP",
      "Laravel",
      "MySQL",
      "REST APIs",
      "Docker"
    ],
    note:
      "React and Docker are newer to me, and I’m learning them here.",
    assetId: "salla"
  }
];

export const skillGroups: SkillGroup[] = [
  {
    title: "Full-stack engineering",
    skills: ["Laravel", "PHP", "JavaScript", "MySQL", "REST APIs"],
    strongest: ["Laravel", "PHP", "MySQL", "REST APIs"]
  },
  {
    title: "AI agents and LLMs",
    skills: [
      "Python",
      "AI agents",
      "LLM applications",
      "Structured outputs",
      "Multi-agent workflows"
    ],
    strongest: ["Python", "AI agents"]
  },
  {
    title: "Engineering practices",
    skills: [
      "System design",
      "API integration",
      "Database design",
      "Git",
      "Testing & debugging"
    ]
  },
  {
    title: "Learning now",
    skills: ["React", "Docker"]
  }
];

export const achievements: Achievement[] = [
  {
    title: "KAUST Academy AI specialization",
    description:
      "I got in through several assessments, then did the in-person advanced stage on machine learning and deep learning in PyTorch.",
    signal: "Top 5%",
    issuer: "KAUST Academy",
    date: null,
    verificationUrl: null,
    enabled: true,
    assetId: "kaust-academy"
  },
  {
    title: "Final stage of the IBM AI Lab",
    description:
      "One of 600 learners selected for the final stage of the IBM AI Experiential Learning Lab. Our team’s multi-agent healthcare project, Afiyah, scored 5/5 on every criterion.",
    signal: "Team 5/5",
    issuer: "IBM AI Experiential Learning Lab",
    date: null,
    verificationUrl: null,
    enabled: true,
    assetId: "ibm"
  },
  {
    title: "Amd FinTech Hackathon Finalist",
    description:
      "I took AutoFlow to the onsite final of Hackathon Amd, run by Alinma Bank and Tuwaiq Academy.",
    signal: "AutoFlow",
    issuer: "Alinma Bank × Tuwaiq Academy",
    date: null,
    verificationUrl: null,
    enabled: true,
    assetId: "amad-hackathon"
  },
  {
    title: "Through to the modeling race and final hackathon",
    description:
      "My team, WAREVA, made it through the digital camp and the in-person camp in Rabigh. Miyahathon is part of the innovation program led by the Saudi Water Authority, and its final runs in Jeddah in December 2026.",
    signal: "WAREVA",
    ticker: "Miyahathon 3 modeling race and final",
    issuer: "Miyahathon 3",
    date: "Oct 2026",
    verificationUrl: null,
    enabled: true,
    assetId: null
  },
  {
    title: "First Place, Program Interface Design Challenge",
    description:
      "My interface design came first in the club’s challenge, which ran during Skills Week.",
    signal: "1st",
    ticker: "Interface design challenge",
    issuer: "UQU Computer Club",
    date: "Oct 2025",
    verificationUrl: null,
    enabled: true,
    assetId: "uqu"
  },
  {
    title: "Selected for the National History Lab",
    description:
      "The King Abdulaziz Foundation for Research and Archives (Darah) selected me to represent Umm Al-Qura University at the national lab.",
    signal: "UQU rep",
    issuer: "King Abdulaziz Foundation (Darah)",
    date: "Feb 2025",
    verificationUrl: null,
    enabled: true,
    assetId: null
  }
];

export const proofMetrics: ProofMetric[] = [
  { value: 6500, suffix: "+", label: "Followers across X and LinkedIn", source: "4.5K+ on X · 2K+ on LinkedIn" },
  { value: 1600, prefix: "~", label: "Masari active users", source: "My own count, not audited" },
  { value: 160, suffix: "+", label: "Mustakshif release downloads", source: "GitHub release download count" },
  { value: 180, suffix: "+", label: "Volunteer hours", source: "Across 11 initiatives · my own record" }
];

export const programs: Program[] = [
  {
    name: "KAUST AI Academy",
    issuer: "KAUST Academy",
    summary:
      "I qualified through several assessments, then trained in person on machine learning and deep learning in PyTorch. My four projects from it are on GitHub.",
    focus: ["Machine learning", "Deep learning", "PyTorch"],
    recognition: "Top 5%",
    year: null,
    credentialUrl: null,
    flagship: true,
    enabled: true,
    assetId: "kaust-academy"
  },
  {
    name: "Fundamentals of Deep Learning",
    issuer: "NVIDIA Deep Learning Institute",
    summary:
      "I trained neural networks in the course’s hands-on labs and passed its competency-based assessment.",
    focus: ["Neural networks", "Deep learning", "Lab exercises"],
    recognition: null,
    year: null,
    credentialUrl: null,
    flagship: false,
    enabled: true,
    assetId: "nvidia"
  },
  {
    name: "Linear Algebra for Machine Learning and Data Science",
    issuer: "DeepLearning.AI",
    summary:
      "I studied the linear algebra that machine learning is built on.",
    focus: ["Linear algebra", "Math for ML"],
    recognition: null,
    year: null,
    credentialUrl: null,
    flagship: false,
    enabled: true,
    assetId: "deeplearning-ai"
  },
  {
    name: "Introduction to Data Science in Python",
    issuer: "University of Michigan",
    summary:
      "I used Python and Pandas to clean and reshape data and run basic statistics on it.",
    focus: ["Python", "Pandas", "Data analysis"],
    recognition: null,
    year: "2025",
    credentialUrl: "https://www.coursera.org/verify/4NAKX19FC78R",
    flagship: false,
    enabled: true,
    assetId: "university-michigan"
  },
  {
    name: "McKinsey.org Forward Program",
    issuer: "McKinsey & Company",
    summary:
      "I spent ten weeks learning to break problems down and present the answer clearly.",
    focus: ["Problem solving", "Communication", "Adaptability"],
    recognition: null,
    year: null,
    credentialUrl: null,
    flagship: false,
    enabled: true,
    assetId: "mckinsey"
  },
  {
    name: "Make Agentic AI Work for You",
    issuer: "IBM SkillsBuild",
    summary:
      "I covered the basics of AI agents and where they fit into everyday tasks.",
    focus: ["AI agents", "Everyday tasks"],
    recognition: null,
    year: null,
    credentialUrl: null,
    flagship: false,
    enabled: true,
    assetId: "ibm"
  }
];

export const certifications: Certification[] = [
  {
    name: "Data Collection and Processing with Python",
    issuer: "University of Michigan",
    date: "Nov 2025",
    credentialUrl: "https://www.coursera.org/verify/JBMM086LHLLG"
  },
  {
    name: "Python Classes and Inheritance",
    issuer: "University of Michigan",
    date: "Nov 2025",
    credentialUrl: "https://www.coursera.org/verify/I534E22US8AH"
  },
  {
    name: "Python Functions, Files, and Dictionaries",
    issuer: "University of Michigan",
    date: "Nov 2025",
    credentialUrl: "https://www.coursera.org/verify/EC7W7X5JW9OG"
  },
  {
    name: "Python Basics",
    issuer: "University of Michigan",
    date: "Nov 2025",
    credentialUrl: "https://www.coursera.org/verify/X0XFB8BTYITK"
  },
  {
    name: "Prerequisite Courses of Artificial Intelligence: Python Basics",
    issuer: "KAUST Academy",
    date: "Dec 2025",
    credentialUrl: null
  },
  {
    name: "Introduction to SAP Basics and Navigation",
    issuer: "King Fahd University of Petroleum and Minerals",
    date: "Oct 2025",
    credentialUrl: null
  },
  {
    name: "Google Agile Essentials",
    issuer: "Google",
    date: "Jun 2025",
    credentialUrl: "https://www.coursera.org/verify/WAJQ7LVRCWEH"
  },
  {
    name: "Introduction to Project Management",
    issuer: "IBM",
    date: "Jun 2025",
    credentialUrl: null
  },
  {
    name: "Using Generative AI for Software Development",
    issuer: "IBM",
    date: "Feb 2025",
    credentialUrl: null
  }
];

export const community = {
  metrics: [
    { value: "3", label: "Trainings I’ve led" },
    { value: "11", label: "Volunteer initiatives" },
    { value: "180+", label: "Volunteer hours" }
  ],
  workshops: [
    {
      title: "AI Agents Bootcamp",
      meta: "Trainer · Artificial Intelligence Pioneers · 3 days",
      description:
        "I covered how agents work: the fundamentals, tools, memory, planning, and multi-agent workflows. We finished by building an agent together, step by step.",
      organizationUrl: "https://www.aip.sa/",
      primary: true
    },
    {
      title: "AI workshop",
      meta: "Facilitator · Fazzah Voluntary National Association · Madinah",
      description:
        "I explained the core ideas of AI in plain language and showed a few tools people can start with.",
      organizationUrl: "https://www.fazzah.org/",
      primary: false
    },
    {
      title: "AI for business workshop",
      meta: "Facilitator · Riadiat",
      description:
        "I showed entrepreneurs where AI can fit into the day-to-day work of running a business, and how to start.",
      organizationUrl: "https://riadiat.sa/",
      primary: false
    }
  ] satisfies Workshop[],
  volunteerRecordUrl: null as Nullable<string>
};

export const recommendations: Recommendation[] = [
  {
    name: "Dr. Ahmed D. Alharthi",
    initials: "AA",
    roles: [
      "Assistant Professor of Software Engineering",
      "Umm Al-Qura University",
      "Graduation project supervisor"
    ],
    quote:
      "His talent for turning requirements into practical software solutions and working well with teammates was especially notable.",
    tags: ["Software engineering", "Tabayun", "Technical skills", "Teamwork"],
    publicUrl: null,
    note: "His full signed letter is available on request.",
    contextAssetIds: ["uqu"]
  },
  {
    name: "Heyam AbuNaseer",
    initials: "HA",
    roles: [
      "Trainer, IBM AI Experiential Learning Lab"
    ],
    quote:
      "I was very impressed by his performance and would be happy to recommend him for future opportunities.",
    tags: ["AI agents", "Commitment", "Collaboration", "Positive attitude"],
    publicUrl: "https://www.linkedin.com/in/alfaifi-sultan/",
    note: null,
    contextAssetIds: ["ibm"]
  }
];

export const content = {
  metrics: [
    { value: "6,500+", label: "Followers across X and LinkedIn" },
    { value: "Dozens", label: "One-to-one guidance sessions" }
  ],
  pillars: [
    {
      title: "Explainers in plain Arabic",
      description:
        "AI agents, tools, and coding concepts, explained in Arabic without the jargon."
    },
    {
      title: "New models and tools",
      description:
        "New releases like DeepSeek, head-to-heads like Claude versus Codex, and what each one changes in a developer’s daily work."
    },
    {
      title: "One-to-one help",
      description:
        "Stuck on what to learn next or how to plan a project? I’ve done dozens of one-to-one sessions on exactly that."
    }
  ] satisfies ContentPillar[],
  categories: [
    "AI agents",
    "Claude and Codex",
    "Open models like DeepSeek",
    "AI tools",
    "Software engineering",
    "AI news"
  ],
  featuredPosts: [] as {
    title: string;
    url: string;
    platform: string;
  }[]
};

export const seo = {
  title: "Sultan Alfaifi | Full-stack engineer building AI agents",
  description:
    "Sultan Alfaifi, software engineering student in Makkah and COOP intern at Salla. I build AI agents that check with you before they act, and web apps like Masari.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sultalfaifi.com"
};
