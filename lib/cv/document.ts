// The one-page CV as a pdfmake document. ATS-safe on purpose: one column, real text (no images),
// standard section names, dates inline instead of in side columns, and every link clickable.
import type { CvLine } from "../../data/cv";
import type { ResolvedCv } from "./select";

export const CV_FONT = "Plex";

export const CV_FONT_FILES = {
  normal: "IBMPlexSansArabic-Regular.ttf",
  bold: "IBMPlexSansArabic-Bold.ttf",
  italics: "IBMPlexSansArabic-Regular.ttf",
  bolditalics: "IBMPlexSansArabic-Bold.ttf"
} as const;

// pdfmake's document shape is plain JSON; a loose type keeps this file free of its typings.
type Node = Record<string, unknown> | string | Node[];
export type CvDocument = Record<string, unknown> & { content: Node[] };

const INK = "#111111";
const MUTED = "#4a4a4a";
const RULE = "#9a9a9a";

export function cvFileName(company?: string) {
  const slug = (company ?? "").normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 40);
  return slug ? `Sultan-Alfaifi-CV-${slug}.pdf` : "Sultan-Alfaifi-CV.pdf";
}

function heading(text: string): Node[] {
  return [
    { text: text.toUpperCase(), style: "heading" },
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.6, lineColor: RULE }], margin: [0, 1, 0, 3] }
  ];
}

function bullets(lines: CvLine[]): Node {
  return { ul: lines.map((line) => line.link ? { text: [line.text, " (", { text: line.link.label, link: line.link.href, style: "link" }, ")"] } : line.text), style: "bullets" };
}

function labelled(line: CvLine): Node {
  const [label, ...rest] = line.text.split(": ");
  return rest.length ? { text: [{ text: `${label}: `, bold: true }, rest.join(": ")], style: "skill" } : { text: line.text, style: "skill" };
}

function entryLine(title: string, meta: string, extras: (string | undefined)[], links: { label: string; href: string }[]): Node {
  const parts: Node[] = [{ text: title, bold: true }, { text: `, ${meta}` }];
  extras.filter(Boolean).forEach((extra) => parts.push({ text: ` | ${extra}`, color: MUTED }));
  links.forEach((link, index) => parts.push({ text: index === 0 ? " | " : " · ", color: MUTED }, { text: link.label, link: link.href, style: "link" }));
  return { text: parts, style: "entry" };
}

export function buildCvDocument(cv: ResolvedCv, footerText: string, onPageCount?: (pages: number) => void): CvDocument {
  const { header } = cv;
  const contact: Node[] = [{ text: header.location }, { text: " | " }, { text: header.email, link: `mailto:${header.email}`, style: "link" }];
  header.links.forEach((link) => contact.push({ text: " | " }, { text: link.label, link: link.href, style: "link" }));

  const teaching: Node[] = cv.teaching.length ? [...heading("Teaching and community"), bullets(cv.teaching)] : [];
  const leadWithTeaching = cv.target === "teaching";

  const content: Node[] = [
    { text: header.name, style: "name" },
    { text: header.headline, style: "headline" },
    { text: contact, style: "contact" },
    ...heading("Summary"),
    { text: cv.summary.text, style: "summary" },
    ...heading("Skills"),
    ...cv.skills.map(labelled),
    ...heading("Experience"),
    ...cv.experience.flatMap(({ entry, bullets: lines }) => [entryLine(entry.title, entry.meta, [entry.dates, entry.location], entry.links), bullets(lines)]),
    ...(leadWithTeaching ? teaching : []),
    ...heading("Projects"),
    ...cv.projects.flatMap(({ entry, bullets: lines }) => [entryLine(entry.title, entry.meta, [entry.dates], entry.links), bullets(lines)]),
    ...(leadWithTeaching ? [] : teaching),
    ...heading("Recognition"),
    bullets(cv.recognition),
    ...heading("Education"),
    { text: cv.education.text, style: "summary" },
    ...(cv.training.length ? [...heading("Training"), bullets(cv.training)] : [])
  ];

  return {
    pageSize: "A4",
    pageMargins: [40, 30, 40, 32],
    info: {
      title: "Sultan Alfaifi CV",
      author: "Sultan Alfaifi",
      subject: header.headline,
      keywords: "Sultan Alfaifi, software engineer, AI agents, full-stack, Laravel, Python"
    },
    defaultStyle: { font: CV_FONT, fontSize: 9, lineHeight: 1.02, color: INK },
    styles: {
      name: { fontSize: 19, bold: true, characterSpacing: 0.4 },
      headline: { fontSize: 10.5, margin: [0, 1, 0, 2] },
      contact: { fontSize: 8.4, color: MUTED, margin: [0, 0, 0, 4] },
      heading: { fontSize: 9.6, bold: true, characterSpacing: 0.8, margin: [0, 5, 0, 0] },
      summary: { margin: [0, 0, 0, 1] },
      skill: { margin: [0, 0, 0, 0.5] },
      entry: { margin: [0, 2, 0, 0.5] },
      bullets: { margin: [0, 0, 0, 1.5] },
      link: { color: "#0b4f8a", decoration: "underline" }
    },
    content,
    footer: (currentPage: number, pageCount: number) => {
      onPageCount?.(pageCount);
      return { text: footerText, alignment: "center", fontSize: 7.4, color: MUTED, margin: [40, 12, 40, 0] };
    }
  };
}
