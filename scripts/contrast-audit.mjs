import { writeFileSync } from "node:fs";
import path from "node:path";

// The Living Intelligence ground (app/living.css). Every text pair a token can form is listed here.
const pairs = [
  {
    usage: "Primary text (--li-ink) on the ground",
    foreground: "#F4F2EE",
    background: "#030304",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Body text (the older --text) on the ground",
    foreground: "#D6D3CE",
    background: "#030304",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Secondary text (--li-ink-2) on the ground",
    foreground: "#B1AFAB",
    background: "#030304",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Secondary text (--li-ink-2) on raised glass (--li-bg-3)",
    foreground: "#B1AFAB",
    background: "#131318",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Quiet captions (--li-ink-3) on the ground",
    foreground: "#8C8A87",
    background: "#030304",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Quiet captions (--li-ink-3) on raised glass (--li-bg-3)",
    foreground: "#8C8A87",
    background: "#131318",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Primary text on raised glass (--li-bg-3)",
    foreground: "#F4F2EE",
    background: "#131318",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Body text on a raised card (--li-bg-2)",
    foreground: "#D6D3CE",
    background: "#0C0C11",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Dark text (--li-on-light) on the off-white primary button",
    foreground: "#050507",
    background: "#F4F2EE",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Dark text (--li-on-light) on the hovered primary button",
    foreground: "#050507",
    background: "#FFFFFF",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Glacier tint labels and links on the ground",
    foreground: "#9FE3FF",
    background: "#030304",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Glacier tint labels on raised glass",
    foreground: "#9FE3FF",
    background: "#131318",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Dark text on glacier tint controls",
    foreground: "#050507",
    background: "#9FE3FF",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Apricot tint gate phrase and asks text on the ground",
    foreground: "#FFD3A8",
    background: "#030304",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Dark text on the apricot tint Approve button",
    foreground: "#050507",
    background: "#FFD3A8",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Iris tint data labels on the ground",
    foreground: "#C9BEFF",
    background: "#030304",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Iris tint data labels on raised glass",
    foreground: "#C9BEFF",
    background: "#131318",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Rose tint labels on the ground",
    foreground: "#FFB3C8",
    background: "#030304",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Apricot warnings on the ground",
    foreground: "#FFB46A",
    background: "#030304",
    minimum: 4.5,
    category: "Normal text"
  },
  {
    usage: "Focus ring (--li-focus) on the ground",
    foreground: "#9CC9FF",
    background: "#030304",
    minimum: 3,
    category: "Focus indicator"
  },
  {
    usage: "Focus ring (--li-focus) on raised glass",
    foreground: "#9CC9FF",
    background: "#131318",
    minimum: 3,
    category: "Focus indicator"
  },
  {
    usage: "Checkpoint lamp: asks (apricot) on the ground",
    foreground: "#FFB46A",
    background: "#030304",
    minimum: 3,
    category: "Borders and controls"
  },
  {
    usage: "Checkpoint lamp: verifies (glacier) on the ground",
    foreground: "#47C8F5",
    background: "#030304",
    minimum: 3,
    category: "Borders and controls"
  },
  {
    usage: "Checkpoint lamp: holds (rose) on the ground",
    foreground: "#FF5C8D",
    background: "#030304",
    minimum: 3,
    category: "Borders and controls"
  },
  {
    usage: "Checkpoint line: bound (ink 85%) on the ground",
    foreground: "#D0CECA",
    background: "#030304",
    minimum: 3,
    category: "Borders and controls"
  },
  {
    usage: "Iris accents on the ground",
    foreground: "#8F6BFF",
    background: "#030304",
    minimum: 3,
    category: "Borders and controls"
  }
];

const excludedPairs = [
  {
    usage: "Off-white text on a glacier fill",
    foreground: "#F4F2EE",
    background: "#47C8F5",
    reason: "Insufficient contrast. Fills in the living light carry dark text (--li-on-light), never off-white."
  },
  {
    usage: "Off-white text on an apricot fill",
    foreground: "#F4F2EE",
    background: "#FFB46A",
    reason: "Insufficient contrast. The asks colour is a lamp or a fill behind dark text."
  },
  {
    usage: "Decorative ink (--li-ink-4) as text",
    foreground: "#4C4B49",
    background: "#030304",
    reason: "Insufficient contrast. --li-ink-4 is for hairlines and inactive dots only, never text."
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
  "- Colour lives in light: accents are lamps, glows and tinted labels; fills in the living light carry dark text.",
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
