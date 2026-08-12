import { skillGroups } from "@/data/portfolio";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function SkillsSection() {
  return (
    <section id="skills" className="section section--white section--compact">
      <div className="page-shell">
        <SectionHeader
          title="Skills & Technology"
          description="A focused engineering toolkit without percentages or decorative proficiency scores."
        />
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
    </section>
  );
}
