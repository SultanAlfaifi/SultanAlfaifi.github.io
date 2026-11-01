import { ArrowUpRight } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";

// The three reasons people arrive: hiring, building an AI product, or running a program. A block inside
// Contact (components/contact-section.tsx), so its heading is an h3 and each path's is an h4. Three hairline
// columns, each with who it is for, what I offer, and one link that opens an email with the right subject.
export function HelpSection({ locale = "en" }: { locale?: Locale }) {
  const { helpPaths, ui } = getContent(locale);
  return (
    <section id="help" className="contact__help" aria-labelledby="help-title">
      <h3 id="help-title" className="contact__help-title">{ui.help.title}</h3>
      <ul className="contact__paths">
        {helpPaths.map((path) => (
          <li key={path.id} className="contact__path">
            <h4>{path.audience}</h4>
            <p>{path.offer}</p>
            <a className="contact__path-cta" href={path.cta.href}>
              {path.cta.label} <ArrowUpRight aria-hidden="true" size={16} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
