import { getContent, type Locale } from "@/data/i18n";

// Inside its "Beyond the projects" row (components/deeper-section.tsx), which carries #skills and the title.
// The row's line is the description's first sentence; the groups follow, the strongest tools in full ink with
// a lit dot. The last group's own title says what I'm learning now.
export function SkillsSection({ locale = "en" }: { locale?: Locale }) {
  const { skillGroups } = getContent(locale);
  return (
    <div className="row-skills">
      {skillGroups.map((group) => (
        <div key={group.title} className="row-skills__group">
          <h4>{group.title}</h4>
          <ul>
            {group.skills.map((skill) => (
              <li key={skill} className={group.strongest?.includes(skill) ? "is-strong" : undefined}>
                <span aria-hidden="true" />
                {skill}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
