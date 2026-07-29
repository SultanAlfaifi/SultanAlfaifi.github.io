import Image from "next/image";
import type { CSSProperties } from "react";
import {
  getPortfolioAsset,
  organizations,
  type Organization
} from "@/data/portfolio";

function OrganizationItem({
  organization,
  duplicate = false
}: {
  organization: Organization;
  duplicate?: boolean;
}) {
  const asset = getPortfolioAsset(organization.logo);
  const imageStyle = asset
    ? ({
        "--visual-scale": asset.visualScale,
        "--object-position": asset.objectPosition
      } as CSSProperties)
    : undefined;
  const content = (
    <>
      <span className="organization-item__mark" style={imageStyle}>
        {asset ? (
          <span className="organization-item__images">
            {asset.derived.monochrome ? (
              <Image
                className="organization-item__image organization-item__image--mono"
                src={asset.derived.monochrome}
                alt=""
                fill
                sizes="180px"
              />
            ) : null}
            <Image
              className="organization-item__image organization-item__image--color"
              src={asset.derived.color}
              alt=""
              fill
              sizes="180px"
            />
          </span>
        ) : (
          <span className="organization-item__wordmark">{organization.name}</span>
        )}
      </span>
      <span className="organization-item__relationship">
        {organization.relationship}
      </span>
    </>
  );

  if (duplicate) {
    return <div className="organization-item">{content}</div>;
  }

  if (organization.url) {
    return (
      <a
        className="organization-item"
        href={organization.url}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`${organization.name} — ${organization.relationship}`}
      >
        {content}
      </a>
    );
  }

  return <div className="organization-item">{content}</div>;
}

export function OrganizationRail() {
  const visibleOrganizations = organizations.filter(
    (organization) => organization.visible
  );

  return (
    <section className="organization-rail" aria-labelledby="organizations-title">
      <div className="page-shell organization-rail__header">
        <div>
          <p>Experience · Education · Programs · Certifications · Community</p>
          <h2 id="organizations-title">Organizations Along My Journey</h2>
        </div>
        <span>Relationship labels are explicit</span>
      </div>

      <div className="organization-rail__viewport">
        <div className="organization-rail__track">
          <div className="organization-rail__group">
            {visibleOrganizations.map((organization) => (
              <OrganizationItem
                key={`${organization.category}-${organization.name}`}
                organization={organization}
              />
            ))}
          </div>
          <div className="organization-rail__group" aria-hidden="true">
            {visibleOrganizations.map((organization) => (
              <OrganizationItem
                key={`duplicate-${organization.category}-${organization.name}`}
                organization={organization}
                duplicate
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
