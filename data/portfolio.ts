export type Nullable<T> = T | null;

export type Link = {
  label: string;
  href: string;
};

export type SocialLink = Link & {
  platform: "GitHub" | "LinkedIn" | "X" | "Email";
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
  verificationUrl: Nullable<string>;
  enabled: boolean;
  assetId: Nullable<string>;
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
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Experience", href: "#experience" },
  { label: "Journey", href: "#journey" },
  { label: "Community", href: "#community" },
  { label: "Contact", href: "#contact" }
] satisfies Link[];

export const identity = {
  name: "Sultan Alfaifi",
  eyebrow: "Sultan Alfaifi / Full-Stack Software Engineer",
  role: "Full-Stack Software Engineer specializing in AI Agents",
  headline:
    "I build full-stack products powered by intelligent agents.",
  summary:
    "I turn product ideas into complete software, from responsive interfaces and reliable backends to connected data and LLM-powered workflows.",
  introVideo: "/assets/media/sultan-introduction.mp4",
  location: "Makkah, Saudi Arabia",
  education: "Software Engineering, Umm Al-Qura University",
  languages: "Arabic & English",
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
    href: "https://www.linkedin.com/in/alfaifi-sultan/"
  },
  {
    platform: "X",
    label: "X",
    href: "https://x.com/SultAlfaifi/"
  },
  {
    platform: "Email",
    label: "Email",
    href: "mailto:sultalfaifi@gmail.com"
  }
];

export const about = {
  paragraphs: [
    "I’m Sultan Alfaifi, a full-stack software engineer with hands-on experience building end-to-end web applications, from user interfaces and backend logic to API integrations and databases.",
    "Alongside full-stack development, I specialize in designing AI agent systems using Python and large language models, connecting them with tools, data, and real-world workflows to build practical and intelligent products."
  ],
  portraitAssetId: "portrait",
  educationAssetId: "uqu",
  metadata: [
    { label: "Based in", value: identity.location },
    { label: "Education", value: identity.education },
    { label: "Focus", value: "Full-Stack Engineering & Agentic AI" },
    { label: "Languages", value: identity.languages }
  ]
};

export const organizations: Organization[] = [
  {
    name: "Salla",
    category: "Experience",
    relationship: "COOP Experience",
    journeyNote: "Hands-on full-stack engineering training in Salla's development environment.",
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
    journeyNote: "The foundation of my software engineering education and graduation journey.",
    colors: ["#01686f", "#b08b44"],
    foreground: "light",
    logo: "uqu",
    url: "https://uqu.edu.sa/",
    visible: true
  },
  {
    name: "KAUST Academy",
    category: "Programs",
    relationship: "AI Program",
    journeyNote: "Advanced AI training, applied projects, and a Top 5% recognition.",
    colors: ["#efb61d", "#cccd2b", "#f09021", "#07a6aa"],
    foreground: "dark",
    logo: "kaust-academy",
    url: "https://academy.kaust.edu.sa/",
    visible: true
  },
  {
    name: "IBM",
    category: "Programs",
    relationship: "AI Program",
    journeyNote: "Agentic AI learning and practical experiential lab work.",
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
    journeyNote: "Hands-on deep learning labs and competency-based training.",
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
    journeyNote: "Built the mathematical foundations I use in machine learning.",
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
    journeyNote: "Applied Python and Pandas to practical data science work.",
    colors: ["#ffcb0b", "#00274c"],
    foreground: "light",
    logo: "university-michigan",
    url: "https://umich.edu/",
    visible: true
  },
  {
    name: "McKinsey.org",
    category: "Programs",
    relationship: "Professional Program",
    journeyNote: "Strengthened problem-solving, communication, and workplace adaptability.",
    colors: ["#042f87", "#051c2c"],
    foreground: "light",
    logo: "mckinsey",
    url: "https://www.mckinsey.org/our-programs/forward/overview",
    visible: true
  },
  {
    name: "Artificial Intelligence Pioneers",
    category: "Community",
    relationship: "Teaching & Community",
    journeyNote: "Hosted my three-day AI Agents Bootcamp for aspiring builders.",
    colors: ["#7761a9", "#3b2066"],
    foreground: "light",
    logo: "ai-pioneers",
    url: "https://www.aip.sa/",
    visible: true
  },
  {
    name: "Fazzah Voluntary National Association",
    category: "Community",
    relationship: "Community Workshop",
    journeyNote: "Hosted an accessible AI workshop I delivered in Madinah.",
    colors: ["#285572", "#d2a901"],
    foreground: "light",
    logo: "fazzah",
    url: "https://www.fazzah.org/",
    visible: true
  },
  {
    name: "Riadiat",
    category: "Community",
    relationship: "Business AI Workshop",
    journeyNote: "Hosted my workshop on practical AI for business workflows.",
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
      "Building complete web applications, from responsive interfaces and backend logic to databases and deployment-ready integrations.",
    emphasis: true,
    signal: "UI / Server / Data"
  },
  {
    title: "AI Agent Systems",
    description:
      "Designing goal-driven AI agents that can reason, use tools, maintain context, and execute multi-step workflows.",
    emphasis: true,
    signal: "Goals / Tools / Memory"
  },
  {
    title: "LLM Applications",
    description:
      "Building practical applications powered by large language models, including structured outputs, retrieval workflows, and model integrations.",
    emphasis: false,
    signal: "Models / Retrieval / Output"
  },
  {
    title: "APIs & System Integration",
    description:
      "Connecting applications, external services, databases, and AI models through reliable APIs and automated data flows.",
    emphasis: false,
    signal: "Services / Contracts / Flow"
  }
];

export const projects: Project[] = [
  {
    slug: "danna",
    title: "DANNA",
    category: "Arabic AI Voice Assistant",
    role: "Creator · AI & Backend Development",
    description:
      "An Arabic AI voice assistant for Alexa, designed to support contextual, natural, multi-turn conversations for users in Saudi Arabia.",
    highlights: [
      "Connects voice interaction, serverless backend logic, and an LLM conversation layer.",
      "Designed around contextual, multi-turn Arabic conversations."
    ],
    technologies: [
      "Python",
      "Alexa Skills Kit",
      "AWS Lambda",
      "LLM Integration",
      "OpenRouter",
      "Prompt Engineering"
    ],
    outcome: "Approved as an Alexa skill.",
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
    category: "Intelligent Legal Guidance",
    role: "AI & Backend Development",
    description:
      "An intelligent platform that compares visitors’ home-country laws with Saudi regulations, helping international tourists understand important legal differences.",
    highlights: [
      "Translated a real visitor problem into a practical software solution.",
      "Graduation project supervised by Dr. Ahmed D. Alharthi.",
      "Presented at a university career and innovation forum."
    ],
    technologies: [],
    outcome: null,
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
    category: "Full-Stack Product Thinking",
    role: "Web Product Development",
    description:
      "An online resume builder that allows users to create professional CVs using customizable templates and real-time editing.",
    highlights: [
      "Privacy-first editing with data stored locally in the browser.",
      "Responsive editor, real-time preview, and client-side vector PDF export."
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
    outcome: "Public web application with real-time editing and PDF export.",
    repository: "https://github.com/SultanAlfaifi/Masari",
    liveDemo: "https://sultanalfaifi.github.io/Masari/",
    screenshot: "/assets/projects/masari.webp",
    brandAssetId: "masari",
    flagship: true,
    enabled: true,
    todo: null
  },
  {
    slug: "kaust-ai-projects",
    title: "KAUST AI Projects Collection",
    category: "Machine Learning & Deep Learning Collection",
    role: "Machine Learning Development",
    description:
      "A collection of hands-on Machine Learning and Deep Learning projects developed through KAUST Academy, spanning computer vision, neural networks, classification, prediction, model training, and applied AI workflows.",
    highlights: [
      "Completed through KAUST Academy.",
      "Selected work across Machine Learning and Deep Learning."
    ],
    technologies: [
      "Machine Learning",
      "Deep Learning",
      "Computer Vision",
      "Neural Networks",
      "Python"
    ],
    outcome: null,
    repository: "https://github.com/SultanAlfaifi/KAUST-AI-Projects",
    liveDemo: null,
    screenshot: "/assets/projects/kaust-ai-projects.webp",
    brandAssetId: "kaust-academy",
    flagship: false,
    enabled: true,
    todo: null
  }
];

export const experience: Experience[] = [
  {
    organization: "Salla",
    role: "Software Engineer Intern, COOP",
    dates: "June 2026 to Present",
    location: "Makkah, Saudi Arabia",
    description:
      "Developing practical full-stack engineering skills through structured training and hands-on implementation within Salla’s engineering environment.",
    responsibilities: [
      "Learning and applying React, PHP, Laravel, and MySQL through practical development tasks.",
      "Building frontend interfaces and connecting them with backend logic and databases.",
      "Practicing API development, input validation, error handling, and data management.",
      "Gaining exposure to Docker and professional software development workflows."
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
      "Applied professional training. React and Docker are currently expanding skills.",
    assetId: "salla"
  }
];

export const skillGroups: SkillGroup[] = [
  {
    title: "Full-Stack Engineering",
    skills: ["Laravel", "PHP", "JavaScript", "MySQL", "REST APIs"],
    strongest: ["Laravel", "PHP", "MySQL", "REST APIs"]
  },
  {
    title: "AI & Agentic Systems",
    skills: [
      "Python",
      "AI Agents",
      "LLM Applications",
      "RAG",
      "Multi-Agent Workflows"
    ],
    strongest: ["Python", "AI Agents"]
  },
  {
    title: "Engineering Practices",
    skills: [
      "System Design",
      "API Integration",
      "Database Design",
      "Git",
      "Testing & Debugging"
    ]
  },
  {
    title: "Currently Expanding",
    skills: ["React", "Docker"]
  }
];

export const achievements: Achievement[] = [
  {
    title: "Top 5% at KAUST AI Academy",
    description:
      "Ranked among the top 5% of participants in the KAUST Academy AI Specialization.",
    verificationUrl: null,
    enabled: true,
    assetId: "kaust-academy"
  },
  {
    title: "Perfect Evaluation at IBM AI Lab",
    description:
      "Afiyah, a multi-agent healthcare project, received a 5/5 evaluation across all assessment criteria.",
    verificationUrl: null,
    enabled: true,
    assetId: "ibm"
  },
  {
    title: "Amd FinTech Hackathon Finalist",
    description:
      "Advanced to the onsite final stage of the Amd FinTech Hackathon.",
    verificationUrl: null,
    enabled: true,
    assetId: "amad-hackathon"
  },
  {
    title: "Best UI Designer at UQU Computer Club",
    description:
      "Recognized by the Umm Al-Qura University Computer Club for excellence in user-interface design.",
    verificationUrl: null,
    enabled: true,
    assetId: "uqu"
  }
];

export const programs: Program[] = [
  {
    name: "KAUST AI Academy",
    issuer: "KAUST Academy",
    summary:
      "Completed an in-person advanced AI stage after qualifying through multiple assessments, with practical training in machine learning, deep learning, and PyTorch.",
    focus: ["Machine Learning", "Deep Learning", "PyTorch"],
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
      "Completed hands-on deep learning training with practical labs and a competency-based assessment.",
    focus: ["Neural Networks", "Deep Learning", "Practical Labs"],
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
      "Developed the mathematical foundations used in machine learning through matrices, eigenvalues, PCA, Python exercises, and graded assignments.",
    focus: ["Linear Algebra", "PCA", "Mathematical Foundations"],
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
      "Applied Python and Pandas to data preparation, cleaning, manipulation, and introductory statistical analysis.",
    focus: ["Python", "Pandas", "Data Analysis"],
    recognition: null,
    year: null,
    credentialUrl: null,
    flagship: false,
    enabled: true,
    assetId: "university-michigan"
  },
  {
    name: "McKinsey.org Forward Program",
    issuer: "McKinsey & Company",
    summary:
      "Completed a 10-week professional-development program focused on structured problem-solving, effective communication, adaptability, and workplace capabilities.",
    focus: ["Problem Solving", "Communication", "Adaptability"],
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
      "Explored foundational agentic AI concepts and how AI agents can be applied to practical tasks and workflows.",
    focus: ["Agentic AI", "AI Workflows"],
    recognition: null,
    year: null,
    credentialUrl: null,
    flagship: false,
    enabled: true,
    assetId: "ibm"
  }
];

export const community = {
  metrics: [
    { value: "3", label: "Training Experiences" },
    { value: "11", label: "Volunteer Initiatives" },
    { value: "180+", label: "Volunteer Hours" }
  ],
  workshops: [
    {
      title: "AI Agents Bootcamp",
      meta: "Trainer · Artificial Intelligence Pioneers · 3 Days",
      description:
        "Delivered a three-day bootcamp covering AI agent fundamentals, tools, memory, planning, multi-agent workflows, and practical agent building.",
      organizationUrl: "https://www.aip.sa/",
      primary: true
    },
    {
      title: "Artificial Intelligence Workshop",
      meta: "Workshop Facilitator · Fazzah Voluntary National Association · Madinah",
      description:
        "Introduced participants to artificial intelligence concepts, practical tools, and accessible real-world applications.",
      organizationUrl: "https://www.fazzah.org/",
      primary: false
    },
    {
      title: "AI for Business Workshop",
      meta: "Workshop Facilitator · Riadiat",
      description:
        "Presented practical ways to integrate AI into business activities, improve productivity, and support everyday workflows.",
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
      "Graduation Project Supervisor"
    ],
    quote:
      "His talent for turning requirements into practical software solutions and working well with teammates was especially notable.",
    tags: ["Software Engineering", "Tabayun", "Technical Skills", "Teamwork"],
    publicUrl: null,
    note: "Full recommendation letter available upon request.",
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
    tags: ["Agentic AI", "Commitment", "Collaboration", "Positive Attitude"],
    publicUrl: null,
    note: null,
    contextAssetIds: ["ibm"]
  }
];

export const content = {
  metrics: [
    { value: "5,000+", label: "Followers Across Platforms" },
    { value: "Dozens", label: "One-to-One Guidance Sessions" }
  ],
  pillars: [
    {
      title: "Technical Explainers",
      description:
        "Breaking down complex concepts in AI, agentic systems, software engineering, and programming into clear and practical explanations."
    },
    {
      title: "AI News & Insights",
      description:
        "Sharing important AI developments, new tools, model releases, and developer updates with concise analysis and practical context."
    },
    {
      title: "One-to-One Guidance",
      description:
        "Providing personalized technical guidance across artificial intelligence, software development, learning paths, tools, and project planning."
    }
  ] satisfies ContentPillar[],
  categories: [
    "AI Agents",
    "AI Tools",
    "Software Engineering",
    "Systems",
    "Programming",
    "AI News"
  ],
  featuredPosts: [] as {
    title: string;
    url: string;
    platform: string;
  }[]
};

export const seo = {
  title: "Sultan Alfaifi | Full-Stack Software Engineer & AI Agents",
  description:
    "Portfolio of Sultan Alfaifi, a full-stack software engineer specializing in AI agents, LLM applications, web development, APIs, and intelligent systems.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sultalfaifi.com"
};
