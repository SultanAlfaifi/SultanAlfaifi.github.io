import { writeFileSync } from "node:fs";
import process from "node:process";
import axe from "axe-core";
import { JSDOM } from "jsdom";

const url = process.argv[2] ?? "http://localhost:3000";
const response = await fetch(url);

if (!response.ok) {
  throw new Error(`Unable to audit ${url}: HTTP ${response.status}`);
}

const html = await response.text();
const dom = new JSDOM(html, {
  pretendToBeVisual: true,
  runScripts: "outside-only",
  url
});

dom.window.eval(axe.source);

const result = await dom.window.axe.run(dom.window.document, {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
  },
  rules: {
    "color-contrast": { enabled: false }
  }
});

const violations = result.violations.map((violation) => ({
  id: violation.id,
  impact: violation.impact,
  help: violation.help,
  nodes: violation.nodes.map((node) => node.target.join(" "))
}));

const report = [
  "# Automated Accessibility Audit",
  "",
  `- URL: \`${url}\``,
  `- Standard tags: WCAG 2.0/2.1/2.2 A and AA`,
  `- Violations: **${violations.length}**`,
  "- Color contrast: audited separately in `contrast-audit.md` because JSDOM does not perform layout.",
  "",
  ...(violations.length === 0
    ? ["No automated semantic accessibility violations were found.", ""]
    : violations.flatMap((violation) => [
        `## ${violation.id}`,
        "",
        `- Impact: ${violation.impact ?? "unknown"}`,
        `- Rule: ${violation.help}`,
        `- Targets: ${violation.nodes.join(", ")}`,
        ""
      ]))
].join("\n");

writeFileSync(new URL("../accessibility-audit.md", import.meta.url), report);
console.log(`Accessibility audit: ${violations.length} violation(s).`);

if (violations.length > 0) {
  console.error(JSON.stringify(violations, null, 2));
  process.exitCode = 1;
}
