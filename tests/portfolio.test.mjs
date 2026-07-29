import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dataSource = readFileSync(
  new URL("../data/portfolio.ts", import.meta.url),
  "utf8"
);
const pageSource = readFileSync(
  new URL("../app/page.tsx", import.meta.url),
  "utf8"
);
const cssSource = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8"
);
const navbarSource = readFileSync(
  new URL("../components/navbar.tsx", import.meta.url),
  "utf8"
);

function luminance(hex) {
  const values = [1, 3, 5]
    .map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) =>
      value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4
    );

  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

test("portfolio positioning stays specific and evidence-conscious", () => {
  assert.match(
    dataSource,
    /Full-Stack Software Engineer specializing in AI Agents/
  );
  assert.doesNotMatch(dataSource, /AI-powered developer/i);
  assert.doesNotMatch(dataSource, /revolutionary|groundbreaking|production-scale/i);
  assert.match(dataSource, /technology stack and add a public repository or demo/);
});

test("required long-form sections remain independent and ordered", () => {
  const communityIndex = pageSource.indexOf("<CommunitySection");
  const recommendationsIndex = pageSource.indexOf("<RecommendationsSection");
  const ideasIndex = pageSource.indexOf("<IdeasSection");

  assert.ok(communityIndex >= 0);
  assert.ok(recommendationsIndex > communityIndex);
  assert.ok(ideasIndex > recommendationsIndex);
});

test("organization records encode explicit relationships and nullable logos", () => {
  assert.match(dataSource, /export type Organization/);
  assert.match(dataSource, /relationship: "COOP Experience"/);
  assert.match(dataSource, /relationship: "Software Engineering Education"/);
  assert.match(dataSource, /logo: null/);
  assert.doesNotMatch(dataSource, /Companies I Worked With|Trusted By|Partners/);
});

test("approved supplied assets keep explicit, editable mapping decisions", () => {
  assert.match(dataSource, /sourceFile: "Personal Photo 1\.png"/);
  assert.match(dataSource, /sourceFile: "KAUST Academy\.png"/);
  assert.match(dataSource, /id: "kaust-university"[\s\S]*?enabled: false/);
  assert.match(dataSource, /id: "portrait"[\s\S]*?trim: "none"/);
  assert.match(dataSource, /id: "masari"[\s\S]*?displayRole: "supporting"/);
  assert.doesNotMatch(
    dataSource,
    /name: "(DANNA|Masari|Tabayun)"[\s\S]*?category:/
  );
});

test("corrected community brands and achievement mappings stay explicit", () => {
  assert.match(dataSource, /name: "Riadiat"[\s\S]*?logo: "riadiat"[\s\S]*?https:\/\/riadiat\.sa\//);
  assert.match(dataSource, /name: "Fazzah Voluntary National Association"/);
  assert.match(dataSource, /logo: "fazzah"[\s\S]*?https:\/\/www\.fazzah\.org\//);
  assert.match(dataSource, /name: "Artificial Intelligence Pioneers"[\s\S]*?logo: "ai-pioneers"/);
  assert.match(dataSource, /slug: "potato-disease-cnn"[\s\S]*?brandAssetId: "kaust-academy"/);
  assert.match(dataSource, /title: "Amd FinTech Hackathon Finalist"[\s\S]*?assetId: "amad-hackathon"/);
  assert.match(dataSource, /title: "Best UI Designer — UQU Computer Club"[\s\S]*?assetId: "uqu"/);
  assert.doesNotMatch(dataSource, /Raedat|Fazaa Volunteer/);
});

test("hero thesis remains concise and direct", () => {
  assert.match(
    dataSource,
    /"I build full-stack products powered by intelligent agents\."/
  );
});

test("the S monogram is shared by the browser and navigation brand", () => {
  assert.match(navbarSource, /\/brand\/sultan-alfaifi-mark\.svg/);
  assert.doesNotMatch(navbarSource, />SA<\/span>/);
});

test("protocol blues meet WCAG AA against their intended backgrounds", () => {
  assert.ok(contrastRatio("#2f55b7", "#f4f3ec") >= 4.5);
  assert.ok(contrastRatio("#2f55b7", "#fbfbf8") >= 4.5);
  assert.ok(contrastRatio("#2f55b7", "#e8ece7") >= 4.5);
  assert.ok(contrastRatio("#9bb0ff", "#111816") >= 4.5);
  assert.ok(contrastRatio("#9bb0ff", "#17201d") >= 4.5);
});

test("responsive and reduced-motion safeguards are present", () => {
  assert.match(cssSource, /overflow-x:\s*hidden/);
  assert.match(cssSource, /@media \(max-width: 600px\)/);
  assert.match(
    cssSource,
    /#recommendations \.section-header h2[\s\S]*?10\.25vw/
  );
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(cssSource, /organization-rail__group\[aria-hidden="true"\]/);
});
