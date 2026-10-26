// Shapes shared by the knowledge build, the Worker, and the console. No imports, so the Worker can use it.

export type AnchorKind = "section" | "project";

export type AnchorInfo = {
  id: string;
  kind: AnchorKind;
  label: { en: string; ar: string };
  // Sections inside the "Beyond the projects" <details>; opening them means expanding it first.
  collapsed?: boolean;
};

export type EvidenceLevel = "strong" | "working" | "learning";

export type EvidenceTerm = {
  term: string;
  aliases: string[];
  level: EvidenceLevel;
  evidence: { anchor: string; note: string }[];
};

export type KnowledgeProject = {
  slug: string;
  anchor: string;
  title: { en: string; ar: string };
  repository: string | null;
  liveDemo: string | null;
  primaryAction: { label: { en: string; ar: string }; href: string } | null;
};

export type KnowledgeBundle = {
  owner: { name: string; arabicName: string; email: string; site: string };
  anchors: AnchorInfo[];
  projects: KnowledgeProject[];
  urls: string[];
  evidence: EvidenceTerm[];
  text: { en: string; ar: string };
};
