import { writeFileSync } from "node:fs";
import path from "node:path";

const pairs = [
  {
    usage: "Primary text on blush paper",
    foreground: "#131515",
    background: "#FFFAFB",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Secondary text on blush paper",
    foreground: "#2B2C28",
    background: "#FFFAFB",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Blush text on ink",
    foreground: "#FFFAFB",
    background: "#131515",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Blush text on charcoal",
    foreground: "#FFFAFB",
    background: "#2B2C28",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Ink text on mint controls",
    foreground: "#131515",
    background: "#7DE2D1",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Mint labels on ink",
    foreground: "#7DE2D1",
    background: "#131515",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Ink text on teal surfaces",
    foreground: "#131515",
    background: "#339989",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Teal focus ring on blush paper",
    foreground: "#339989",
    background: "#FFFAFB",
    minimum: 3,
    category: "Focus indicator"
  },
  {
    usage: "Mint focus ring on ink",
    foreground: "#7DE2D1",
    background: "#131515",
    minimum: 3,
    category: "Focus indicator"
  },
  {
    usage: "Charcoal structural controls on mint",
    foreground: "#2B2C28",
    background: "#7DE2D1",
    minimum: 3,
    category: "Borders and controls"
  }
];

const excludedPairs = [
  {
    usage: "Mint as small text on blush paper",
    foreground: "#7DE2D1",
    background: "#FFFAFB",
    reason:
      "Insufficient contrast. Mint is reserved for dark surfaces, large decorative type, or backgrounds with ink text."
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
