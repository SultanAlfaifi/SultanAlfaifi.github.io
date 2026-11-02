// «خارج المشاريع» / "Beyond the projects": six rows, each a <details> that carries its section id.
// A row's one line shows while it is closed, so the facts that left the page's number row (6,500+ and
// 180+, each with its note) are still seen without opening anything. Every line is existing copy or is
// composed from the data, so a changed number flows through. The assistant's knowledge reads the same
// lines (lib/agent/knowledge.ts), so a quote it cites is always on the page as written.
import type { PortfolioContent } from "../data/i18n";

export const DEEPER_ROWS = ["timeline", "organizations", "skills", "journey", "community", "ideas"] as const;
export type DeeperRow = (typeof DEEPER_ROWS)[number];

const firstSentence = (text: string) => /^[\s\S]+?[.!?؟](?=\s|$)/.exec(text)?.[0] ?? text;
// Labels are written as titles ("Volunteer hours"); inside a line they read in lower case. Arabic is unchanged.
const inline = (label: string) => label.charAt(0).toLocaleLowerCase("en") + label.slice(1);
const metric = ({ value, label }: { value: string; label: string }) => `${value} ${inline(label)}`;

export function deeperRowLines(content: PortfolioContent): Record<DeeperRow, string> {
  const { community, journey, proofMetrics, ui } = content;
  const [trainings, , hours] = community.metrics; // the initiatives count is in the hours' note
  const followers = content.content.metrics[0];
  return {
    timeline: ui.deeper.rows.timeline(journey.length),
    organizations: ui.organizations.intro,
    skills: firstSentence(ui.skills.description),
    journey: ui.programs.description,
    // "3 trainings I've led · 180+ volunteer hours · Across 11 initiatives · my own record"
    community: [metric(trainings), metric(hours), proofMetrics[3].source].join(" · "),
    // "6,500+ followers across X and LinkedIn · 4.5K+ on X · 2K+ on LinkedIn"
    ideas: [metric(followers), proofMetrics[0].source].join(" · ")
  };
}
