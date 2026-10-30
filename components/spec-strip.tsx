import { ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { MetaParts } from "./meta-parts";

type Cell = { value: string; label: string; note?: string; href: string };

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Four numbers under the hero, each linked to where it comes from. It replaces the scrolling ticker:
// nothing moves, and every value is read from the data files, never typed here.
export function specCells(locale: Locale = "en"): Cell[] {
  const { experience, identity, projects, ui } = getContent(locale);
  const copy = ui.hero.spec;
  const job = experience[0];
  const masari = projects.find((project) => project.slug === "masari");
  const users = masari?.metrics?.find((metric) => metric.kind === "own-count");
  const mustakshif = projects.find((project) => project.slug === "mustakshif");
  const downloads = mustakshif?.metrics?.find((metric) => metric.kind === "public-count" && metric.href);
  const year = identity.education.match(/\d{4}/)?.[0];
  // "COOP intern at Salla" / "متدرّب تعاوني في سلة" without its organization, which the label names.
  const role = job && identity.currently.replace(new RegExp(`\\s*(?:at|في)\\s+${escapeRegExp(job.organization)}$`), "");
  const cells: (Cell | null)[] = [
    job && role ? { value: role, label: copy.at(job.organization), note: job.dates, href: "#experience" } : null,
    masari && users ? { value: users.value, label: `${masari.title} · ${users.label}`, note: users.note, href: `#project-${masari.slug}` } : null,
    mustakshif && downloads?.href ? { value: downloads.value, label: `${mustakshif.title} · ${downloads.label}`, href: downloads.href } : null,
    year ? { value: year, label: `${copy.graduating} · ${identity.education.replace(/\s*\(.*\)\s*$/, "")}`, href: "#about" } : null
  ];
  return cells.filter((cell): cell is Cell => Boolean(cell));
}

export function SpecStrip({ locale = "en" }: { locale?: Locale }) {
  const { ui } = getContent(locale);
  return (
    <ul className="spec-strip" aria-label={ui.hero.highlights}>
      {specCells(locale).map((cell) => {
        const external = cell.href.startsWith("http");
        return (
          <li key={cell.href}>
            <a className="spec-cell" href={cell.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer noopener" : undefined}>
              {/* No dir="auto": a value like "+160" or "2027" has no letters, so it would turn left to right
                  and sit at the wrong edge on Arabic pages. It follows the page, like the chapters' figures. */}
              <strong className="spec-cell__value">{cell.value}</strong>
              <span className="spec-cell__label"><MetaParts text={cell.label} />{external ? <ArrowUpRight size={14} aria-hidden="true" /> : null}</span>
              {cell.note ? <small className="spec-cell__note">{cell.note}</small> : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
