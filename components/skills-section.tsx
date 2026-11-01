import { getContent, type Locale } from "@/data/i18n";
import { Reveal } from "./reveal";

// Inside its "Beyond the projects" row (components/deeper-section.tsx), which carries #skills and the title.
export function SkillsSection({ locale = "en" }: { locale?: Locale }) {
  const { skillGroups, ui } = getContent(locale);
  return (
    <div className="deeper-body section--white">
      <div>
        <p className="deeper-body__lead">{ui.skills.description}</p>
        <div className="skill-groups">
          {skillGroups.map((group, index) => (
            <Reveal key={group.title} className="skill-group" delay={index * 60}>
              <h3>{group.title}</h3>
              <ul>
                {group.skills.map((skill) => (
                  <li
                    key={skill}
                    className={group.strongest?.includes(skill) ? "is-strong" : ""}
                  >
                    <span aria-hidden="true" />
                    {skill}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
