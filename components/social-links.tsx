import { Mail } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { GitHubIcon, LinkedInIcon } from "./brand-icons";

const iconMap = {
  GitHub: GitHubIcon,
  LinkedIn: LinkedInIcon,
  X: null,
  Email: Mail
};

type SocialLinksProps = {
  compact?: boolean;
  includeEmail?: boolean;
  locale?: Locale;
};

export function SocialLinks({
  compact = false,
  includeEmail = false,
  locale = "en"
}: SocialLinksProps) {
  const { socialLinks, ui } = getContent(locale);
  return (
    <div className={`social-links ${compact ? "social-links--compact" : ""}`}>
      {socialLinks
        .filter((link) => includeEmail || link.platform !== "Email")
        .map((link) => {
          const Icon = iconMap[link.platform];
          const external = link.href.startsWith("http");

          return (
            <a
              key={link.platform}
              href={link.href}
              aria-label={ui.social.visit(link.label)}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer noopener" : undefined}
            >
              {Icon ? <Icon aria-hidden="true" size={18} /> : <span aria-hidden="true">𝕏</span>}
              {!compact ? <span>{link.label}</span> : null}
            </a>
          );
        })}
    </div>
  );
}
