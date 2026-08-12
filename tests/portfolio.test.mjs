import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
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
const projectsSource = readFileSync(
  new URL("../components/projects-section.tsx", import.meta.url),
  "utf8"
);
const programsSource = readFileSync(
  new URL("../components/programs-section.tsx", import.meta.url),
  "utf8"
);
const organizationRailSource = readFileSync(
  new URL("../components/organization-rail.tsx", import.meta.url),
  "utf8"
);
const layoutSource = readFileSync(
  new URL("../app/layout.tsx", import.meta.url),
  "utf8"
);
const heroMediaSource = readFileSync(
  new URL("../components/hero-media.tsx", import.meta.url),
  "utf8"
);
const sallaStorySource = readFileSync(
  new URL("../components/salla-experience-story.tsx", import.meta.url),
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
  assert.doesNotMatch(dataSource, /Companies I Worked With|Trusted By|Partners/);
});

test("organization journey uses supplied brand palettes and interactive context", () => {
  assert.match(dataSource, /name: "Salla"[\s\S]*?colors: \["#004856", "#a5ffe0"\]/);
  assert.match(dataSource, /name: "KAUST Academy"[\s\S]*?"#efb61d"[\s\S]*?"#07a6aa"/);
  assert.match(dataSource, /url: "https:\/\/academy\.kaust\.edu\.sa\/"/);
  assert.doesNotMatch(dataSource, /FDM Group/);
  assert.match(organizationRailSource, /HOVER_INTENT_DELAY = 80/);
  assert.match(organizationRailSource, /PANEL_CLOSE_DURATION = 230/);
  assert.match(organizationRailSource, /aria-expanded=\{active\}/);
  assert.match(organizationRailSource, /aria-controls="organization-detail-panel"/);
  assert.match(organizationRailSource, /displayedIndex/);
  assert.match(organizationRailSource, /mountAndOpen/);
  assert.match(organizationRailSource, /ResizeObserver/);
  assert.match(organizationRailSource, /--panel-height/);
  assert.match(organizationRailSource, /requestAnimationFrame/);
  assert.match(organizationRailSource, /AUTO_SCROLL_SPEED = 24/);
  assert.match(organizationRailSource, /RAIL_RESUME_DELAY = 650/);
  assert.match(organizationRailSource, /scrollPosition \+= \(velocity \* elapsed\) \/ 1000/);
  assert.match(organizationRailSource, /\[true, false, true\]/);
  assert.match(organizationRailSource, /onPointerDown=\{handleRailPointerDown\}/);
  assert.match(organizationRailSource, /onPointerMove=\{handleRailPointerMove\}/);
  assert.match(organizationRailSource, /onPointerUp=\{finishRailPointer\}/);
  assert.match(organizationRailSource, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(organizationRailSource, /onMouseMove/);
  assert.match(cssSource, /\.organization-showcase__rail\s*\{[\s\S]*?height: 108px/);
  assert.match(cssSource, /\.journey-tile\s*\{[\s\S]*?width: clamp\(168px, 13vw, 216px\)/);
  assert.match(cssSource, /\.organization-detail-panel\.is-open/);
  assert.match(cssSource, /\.organization-detail-stage\.has-panel[\s\S]*?var\(--panel-height/);
  assert.match(cssSource, /\.organization-showcase[\s\S]*?background: var\(--paper\)/);
  assert.match(cssSource, /clip-path: inset\(0 0 100% 0\)/);
  assert.match(cssSource, /@media \(max-width: 840px\), \(pointer: coarse\)/);
  assert.match(cssSource, /\.organization-showcase__rail[\s\S]*?overflow-x: auto[\s\S]*?touch-action: pan-x pan-y pinch-zoom/);
  assert.match(cssSource, /\.organization-showcase__rail\.is-dragging\s*\{[\s\S]*?cursor: grabbing/);
  assert.match(cssSource, /\.organization-showcase__rail[\s\S]*?clip-path: polygon/);
  assert.match(cssSource, /\.journey-logo__image[\s\S]*?-webkit-user-drag: none/);
  assert.match(organizationRailSource, /draggable=\{false\}/);
  assert.match(organizationRailSource, /onDragStart=\{\(event\) => event\.preventDefault\(\)\}/);
  assert.doesNotMatch(cssSource, /\.journey-marquee__group\[aria-hidden="true"\][\s\S]*?display: none/);
  assert.match(organizationRailSource, /Swipe the moving logos, then tap one/);
  assert.doesNotMatch(organizationRailSource, /organization-focus-card|organization-stage-clip/);
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

test("flagship program uses the supplied monochrome logo without a backing tile", () => {
  assert.match(programsSource, /program\.flagship && asset\?\.derived\.monochrome/);
  assert.match(cssSource, /\.program-card--flagship \.program-card__logo\s*\{[\s\S]*?background: transparent/);
  assert.match(cssSource, /\.program-card--flagship \.program-card__logo img[\s\S]*?brightness\(0\) invert\(1\)/);
  assert.match(cssSource, /\.program-card--flagship\s*\{[\s\S]*?box-shadow: none/);
});

test("corrected community brands and achievement mappings stay explicit", () => {
  assert.match(dataSource, /name: "Riadiat"[\s\S]*?logo: "riadiat"[\s\S]*?https:\/\/riadiat\.sa\//);
  assert.match(dataSource, /name: "Fazzah Voluntary National Association"/);
  assert.match(dataSource, /logo: "fazzah"[\s\S]*?https:\/\/www\.fazzah\.org\//);
  assert.match(dataSource, /name: "Artificial Intelligence Pioneers"[\s\S]*?logo: "ai-pioneers"/);
  assert.match(dataSource, /slug: "kaust-ai-projects"[\s\S]*?brandAssetId: "kaust-academy"/);
  assert.match(dataSource, /slug: "kaust-ai-projects"[\s\S]*?screenshot: "\/assets\/projects\/kaust-ai-projects\.webp"/);
  assert.match(dataSource, /title: "Amd FinTech Hackathon Finalist"[\s\S]*?assetId: "amad-hackathon"/);
  assert.match(dataSource, /title: "Best UI Designer at UQU Computer Club"[\s\S]*?assetId: "uqu"/);
  assert.doesNotMatch(dataSource, /Raedat|Fazaa Volunteer/);
});

test("hero thesis remains concise and direct", () => {
  assert.match(
    dataSource,
    /"I build full-stack products powered by intelligent agents\."/
  );
});

test("hero content remains pinned and visible through the end of its runway", () => {
  assert.doesNotMatch(
    cssSource,
    /hero-content-drift/
  );
  assert.match(cssSource, /\.hero__viewport\s*\{[\s\S]*?position:\s*sticky[\s\S]*?overflow:\s*hidden/);
});

test("videos use lightweight responsive sources and immediate posters", () => {
  const mediaFiles = {
    heroDesktop: statSync(new URL("../public/assets/media/sultan-introduction.mp4", import.meta.url)).size,
    heroMobile: statSync(new URL("../public/assets/media/sultan-introduction-mobile.mp4", import.meta.url)).size,
    sallaDesktop: statSync(new URL("../public/assets/media/salla-experience.mp4", import.meta.url)).size,
    sallaMobile: statSync(new URL("../public/assets/media/salla-experience-mobile.mp4", import.meta.url)).size
  };

  assert.ok(mediaFiles.heroDesktop < 4 * 1024 * 1024);
  assert.ok(mediaFiles.heroMobile < 2 * 1024 * 1024);
  assert.ok(mediaFiles.sallaDesktop < 3 * 1024 * 1024);
  assert.ok(mediaFiles.sallaMobile < 1.5 * 1024 * 1024);
  assert.match(heroMediaSource, /preload="auto"[\s\S]*?poster=\{poster\}/);
  assert.match(heroMediaSource, /media="\(max-width: 840px\)"/);
  assert.match(sallaStorySource, /preload="none"[\s\S]*?salla-experience-poster\.webp/);
  assert.match(sallaStorySource, /rootMargin: "500px 0px"/);
});

test("Masari leads selected work with user-provided usage evidence", () => {
  assert.match(
    dataSource,
    /slug: "masari"[\s\S]*?value: "About 1,600"[\s\S]*?label: "Active users"[\s\S]*?value: "1,250\+"[\s\S]*?label: "CVs downloaded"[\s\S]*?flagship: true/
  );
  assert.match(dataSource, /slug: "danna"[\s\S]*?flagship: false/);
  assert.match(
    projectsSource,
    /\["masari", "tabayun", "danna", "kaust-ai-projects"\]/
  );
});

test("the S monogram is shared by the browser and navigation brand", () => {
  assert.match(navbarSource, /\/brand\/sultan-alfaifi-mark\.svg/);
  assert.doesNotMatch(navbarSource, />SA<\/span>/);
});

test("social metadata uses a static image with a reliable PNG extension", () => {
  assert.match(layoutSource, /url: "\/opengraph-image\.png"/);
});

test("the supplied mint palette meets its intended contrast roles", () => {
  assert.ok(contrastRatio("#131515", "#fffafb") >= 4.5);
  assert.ok(contrastRatio("#2b2c28", "#fffafb") >= 4.5);
  assert.ok(contrastRatio("#131515", "#7de2d1") >= 4.5);
  assert.ok(contrastRatio("#7de2d1", "#131515") >= 4.5);
  assert.ok(contrastRatio("#fffafb", "#131515") >= 4.5);
  assert.ok(contrastRatio("#339989", "#fffafb") >= 3);
});

test("responsive and reduced-motion safeguards are present", () => {
  assert.match(cssSource, /overflow-x:\s*hidden/);
  assert.match(cssSource, /@media \(max-width: 600px\)/);
  assert.match(
    cssSource,
    /#recommendations \.section-header h2[\s\S]*?10\.25vw/
  );
  assert.match(
    cssSource,
    /\.nav__drawer\s*\{[\s\S]*?position:\s*absolute[\s\S]*?100dvh[\s\S]*?background:\s*#111816/
  );
  assert.match(navbarSource, /matchMedia\("\(min-width: 841px\)"\)/);
  assert.match(dataSource, /id: "fazzah"[\s\S]*?visualScale: 1\.06/);
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(organizationRailSource, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
});
