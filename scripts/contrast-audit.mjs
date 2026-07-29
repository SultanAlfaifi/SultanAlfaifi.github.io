import { writeFileSync } from "node:fs";
import path from "node:path";

const pairs = [
  {
    usage: "Primary text on paper",
    foreground: "#252C29",
    background: "#F4F3EC",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Muted metadata on paper",
    foreground: "#5C6762",
    background: "#F4F3EC",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Protocol links and labels on paper",
    foreground: "#2F55B7",
    background: "#F4F3EC",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Protocol links and labels on white",
    foreground: "#2F55B7",
    background: "#FBFBF8",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Protocol labels on graph background",
    foreground: "#2F55B7",
    background: "#E8ECE7",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Bright protocol links on ink",
    foreground: "#9BB0FF",
    background: "#111816",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Bright protocol links on community ink",
    foreground: "#9BB0FF",
    background: "#17201D",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Warm-white navigation text on ink",
    foreground: "#C5CDC9",
    background: "#111816",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Project body text on project ink",
    foreground: "#C0C9C4",
    background: "#151E1B",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Project secondary text on project ink",
    foreground: "#AEB9B3",
    background: "#151E1B",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Community metadata on community ink",
    foreground: "#9CA8A2",
    background: "#17201D",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Footer metadata on footer ink",
    foreground: "#AAB4AF",
    background: "#0B100F",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Chartreuse active state on ink",
    foreground: "#C8FF3D",
    background: "#111816",
    minimum: 3,
    category: "Icons and large active states"
  },
  {
    usage: "Ink text on chartreuse buttons and contact section",
    foreground: "#111816",
    background: "#C8FF3D",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Recommendation quote on white",
    foreground: "#252C29",
    background: "#FBFBF8",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Light structural border on paper",
    foreground: "#7D8882",
    background: "#F4F3EC",
    minimum: 3,
    category: "Borders and controls"
  },
  {
    usage: "Dark structural border on ink",
    foreground: "#676B67",
    background: "#111816",
    minimum: 3,
    category: "Borders and controls"
  },
  {
    usage: "Light-surface keyboard focus",
    foreground: "#754500",
    background: "#F4F3EC",
    minimum: 3,
    category: "Focus indicator"
  },
  {
    usage: "Dark-surface keyboard focus",
    foreground: "#FFBF3F",
    background: "#111816",
    minimum: 3,
    category: "Focus indicator"
  },
  {
    usage: "Monochrome rail logos on ink",
    foreground: "#F4F3EC",
    background: "#18211E",
    minimum: 3,
    category: "Non-text logo treatment"
  }
];

const excludedPairs = [
  {
    usage: "Chartreuse as text or control on paper",
    foreground: "#C8FF3D",
    background: "#F4F3EC",
    reason:
      "Insufficient contrast. Chartreuse is prohibited here and reserved for ink backgrounds or as a background with ink text."
  }
];

function channels(hex) {
  const normalized = hex.replace("#", "");
  return [0, 2, 4].map(
    (index) => Number.parseInt(normalized.slice(index, index + 2), 16) / 255
  );
}

function luminance(hex) {
  const [red, green, blue] = channels(hex).map((value) =>
    value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function ratio(foreground, background) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

const audited = pairs.map((pair) => ({
  ...pair,
  ratio: ratio(pair.foreground, pair.background)
}));
const failures = audited.filter((pair) => pair.ratio < pair.minimum);

const lines = [
  "# Color Contrast Audit",
  "",
  "Generated programmatically with the WCAG relative-luminance formula.",
  "",
  "Thresholds:",
  "",
  "- Normal text: 4.5:1",
  "- Large text: 3:1",
  "- Icons, controls, borders, and focus indicators: 3:1",
  "",
  "| Usage | Foreground | Background | Ratio | Minimum | Result |",
  "|---|---:|---:|---:|---:|---|",
  ...audited.map(
    (pair) =>
      `| ${pair.usage} | \`${pair.foreground}\` | \`${pair.background}\` | ${pair.ratio.toFixed(2)}:1 | ${pair.minimum.toFixed(1)}:1 | ${pair.ratio >= pair.minimum ? "Pass" : "Fail"} |`
  ),
  "",
  "## Deliberately excluded combinations",
  "",
  ...excludedPairs.map((pair) => {
    const pairRatio = ratio(pair.foreground, pair.background);
    return `- **${pair.usage}:** \`${pair.foreground}\` on \`${pair.background}\` is ${pairRatio.toFixed(2)}:1. ${pair.reason}`;
  }),
  "",
  "## State and link treatment",
  "",
  "- Links use text plus an icon, movement, or underline/current-state marker; color is not the only signal.",
  "- Keyboard focus uses a three-pixel outline with separate light-surface and dark-surface tokens.",
  "- Hover and active states preserve the same text colors and add structural changes.",
  "- There are no disabled interactive controls in the initial portfolio.",
  "- Organization logos use warm-white monochrome artwork on Ink by default and reveal color on hover or keyboard focus.",
  "",
  `Audit result: **${failures.length === 0 ? "PASS" : "FAIL"}** (${audited.length - failures.length}/${audited.length} approved pairs pass).`,
  ""
];

const outputPath = path.resolve("contrast-audit.md");
writeFileSync(outputPath, lines.join("\n"), "utf8");

if (failures.length) {
  for (const failure of failures) {
    console.error(
      `${failure.usage}: ${failure.ratio.toFixed(2)}:1, expected ${failure.minimum}:1`
    );
  }
  process.exitCode = 1;
} else {
  console.log(`Contrast audit passed: ${audited.length} approved pairs.`);
}
