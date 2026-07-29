import { Mail } from "lucide-react";
import { socialLinks } from "@/data/portfolio";
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
};

export function SocialLinks({
  compact = false,
  includeEmail = false
}: SocialLinksProps) {
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
              aria-label={`Visit Sultan Alfaifi on ${link.platform}`}
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
