import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { getContent, type Locale } from "@/data/i18n";
import { getPortfolioAsset, type Organization } from "@/data/portfolio";

// The organizations, inside their "Beyond the projects" row (components/deeper-section.tsx), which carries
// #organizations and the title. A still grid: each organization's logo in one off-white ink, what I did there,
// and a link to its site. Nothing moves on its own, nothing is dragged, and there is nothing to pause, so this
// renders on the server with no script at all.
function OrganizationLogo({ organization }: { organization: Organization }) {
  const asset = getPortfolioAsset(organization.logo);
  if (!asset) return null;
  // The supplied monochrome logo where there is one; otherwise the colour file, inked off-white by CSS.
  const source = asset.derived.monochrome ?? asset.derived.color;
  return (
    <span
      className={`row-orgs__logo${asset.derived.monochrome ? "" : " row-orgs__logo--inked"}`}
      style={{ "--visual-scale": asset.visualScale } as CSSProperties}
      aria-hidden="true"
    >
      <Image src={source} alt="" fill sizes="168px" draggable={false} />
    </span>
  );
}

export function OrganizationRail({ locale = "en" }: { locale?: Locale }) {
  const { organizations, ui } = getContent(locale);
  const visible = organizations.filter((organization) => organization.visible);
  return (
    <ul className="row-orgs" aria-label={ui.organizations.rail}>
      {visible.map((organization) => (
        <li key={organization.name} className="row-orgs__item">
          <OrganizationLogo organization={organization} />
          <h4 className="row-orgs__name">
            {organization.url ? (
              <a href={organization.url} target="_blank" rel="noreferrer noopener">
                {organization.name}
                <ArrowUpRight aria-hidden="true" size={15} />
              </a>
            ) : organization.name}
          </h4>
          <p className="row-orgs__kind">{organization.relationship}</p>
          <p className="row-orgs__note">{organization.journeyNote}</p>
        </li>
      ))}
    </ul>
  );
}
