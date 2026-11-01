import { ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";

// Inside its "Beyond the projects" row (components/deeper-section.tsx), which carries #community and the title.
// Every number sits with what it counts, not in a row of its own: the trainings head the list of trainings, and
// the volunteer hours sit in the volunteering note with the initiatives and the source beside them, as the
// page's number row said before (data: proofMetrics[3].source).
// A label written as a title ("Trainings I’ve led") reads in lower case after its number. Arabic is unchanged.
const inline = (label: string) => label.charAt(0).toLocaleLowerCase("en") + label.slice(1);

export function CommunitySection({ locale = "en" }: { locale?: Locale }) {
  const { community, proofMetrics, ui } = getContent(locale);
  const [trainings, , hours] = community.metrics;

  return (
    <div className="row-community">
      <p className="deeper-body__lead">{ui.community.description}</p>
      <div className="row-split">
        <div>
          <p className="row-label"><span className="li-num">{trainings.value}</span> {inline(trainings.label)}</p>
          <ul className="row-workshops">
            {community.workshops.map((workshop) => (
              <li key={workshop.title} className={`row-workshop${workshop.primary ? " row-workshop--primary" : ""}`}>
                <p className="row-workshop__meta">{workshop.meta}</p>
                <h4>{workshop.title}</h4>
                <p>{workshop.description}</p>
                {workshop.primary ? (
                  <ol className="row-workshop__steps" aria-hidden="true">
                    {ui.community.diagram.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                ) : null}
                {workshop.primary && workshop.organizationUrl ? (
                  <a className="row-link" href={workshop.organizationUrl} target="_blank" rel="noreferrer noopener">
                    {ui.community.visit} <ArrowUpRight aria-hidden="true" size={15} />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="row-facts">
          <div className="row-facts__item">
            <p className="row-label">{ui.community.volunteerTitle}</p>
            <p className="row-figure"><span className="row-figure__value li-num">{hours.value}</span> <span>{hours.label}</span></p>
            <p className="row-figure__note">{proofMetrics[3].source}</p>
          </div>
          <p className="row-facts__text">{ui.community.volunteerText}</p>
          {community.volunteerRecordUrl ? (
            <a className="row-link" href={community.volunteerRecordUrl} target="_blank" rel="noreferrer noopener">
              {ui.community.volunteerLink} <ArrowUpRight aria-hidden="true" size={15} />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
