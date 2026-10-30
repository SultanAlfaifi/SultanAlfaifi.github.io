import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";

const dataSource = readFileSync(
  new URL("../data/portfolio.ts", import.meta.url),
  "utf8"
);
const pageSource = readFileSync(
  new URL("../components/home-page.tsx", import.meta.url),
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

test("work leads the page and the full journey remains available", () => {
  const communityIndex = pageSource.indexOf("<CommunitySection");
  const recommendationsIndex = pageSource.indexOf("<RecommendationsSection");
  const ideasIndex = pageSource.indexOf("<IdeasSection");

  assert.ok(communityIndex >= 0);
  assert.ok(recommendationsIndex > communityIndex);
  assert.ok(ideasIndex > communityIndex);
  assert.ok(pageSource.indexOf("<ProjectsSection") < pageSource.indexOf("<AboutSection"));
  assert.match(pageSource, /ui\.deeper\.title/);
  assert.match(readFileSync(new URL("../data/ui.ts", import.meta.url), "utf8"), /title: "Beyond the projects"/);
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
  assert.match(organizationRailSource, /copy\.hintTouch/);
  assert.match(readFileSync(new URL("../data/ui.ts", import.meta.url), "utf8"), /Swipe the moving logos, then tap one/);
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
  assert.match(dataSource, /title: "First Place, Program Interface Design Challenge"[\s\S]*?issuer: "UQU Computer Club"[\s\S]*?assetId: "uqu"/);
  assert.doesNotMatch(dataSource, /Raedat|Fazaa Volunteer/);
});

test("hero thesis remains concise and direct", () => {
  assert.match(
    dataSource,
    /"I build AI agents that check with you before they act\."/
  );
});

test("intro keeps a direct route to work and contact without scroll-gated copy", () => {
  const hero = readFileSync(new URL("../components/hero.tsx", import.meta.url), "utf8");
  assert.match(hero, /href="#work"/);
  assert.match(hero, /href="#contact"/);
  assert.doesNotMatch(hero, /hero__viewport|HeroScrollCue/);
  assert.match(heroMediaSource, /motionAllowed\(\) \|\| userRequested/, "the film follows the page's Motion toggle, not only the OS setting");
  assert.match(heroMediaSource, /subscribeMotion\(handleMotionChange\)/);
  assert.doesNotMatch(heroMediaSource, /prefers-reduced-motion/);
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
  assert.match(heroMediaSource, /preload="none"[\s\S]*?poster=\{poster\}/);
  assert.match(heroMediaSource, /media="\(max-width: 840px\)"/);
  assert.match(sallaStorySource, /preload="none"[\s\S]*?salla-experience-poster\.webp/);
  assert.match(sallaStorySource, /IntersectionObserver/);
});

test("featured work reflects current products and preserves supplied usage evidence", () => {
  assert.match(
    dataSource,
    /slug: "masari"[\s\S]*?value: "About 1,600"[\s\S]*?label: "Active users"[\s\S]*?value: "1,250\+"[\s\S]*?label: "CVs downloaded"/
  );
  assert.match(dataSource, /slug: "danna"[\s\S]*?flagship: false/);
  assert.match(
    projectsSource,
    /filter\(\(project\) => project\.featured\)/
  );
  for (const slug of ["mustakshif", "rajih-engine", "autoflow"]) assert.ok(dataSource.includes(`slug: "${slug}"`));
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

const readComponent = (name) => readFileSync(new URL(`../components/${name}`, import.meta.url), "utf8");

test("signature interactions stay decorative and respect motion preferences", () => {
  const field = readComponent("agent-field.tsx");
  const layer = readComponent("interaction-layer.tsx");
  const terminal = readComponent("agent-terminal.tsx");
  const palette = readComponent("command-palette.tsx");
  const signatureCss = readFileSync(new URL("../app/signature.css", import.meta.url), "utf8");

  assert.match(field, /className="agent-field" aria-hidden="true"/);
  assert.match(field, /IntersectionObserver/);
  assert.match(field, /visibilitychange/);
  assert.match(field, /motionAllowed\(\)/);
  assert.match(layer, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(layer, /nodeValue/);
  assert.match(terminal, /role="log"/);
  assert.match(terminal, /copy\.blocked/);
  assert.match(readFileSync(new URL("../data/ui.ts", import.meta.url), "utf8"), /blocked by policy/);
  assert.match(palette, /role="combobox"/);
  assert.match(palette, /aria-activedescendant/);
  assert.match(signatureCss, /html\[data-motion="off"\] \.portfolio-v3 \*/);
});

test("the hero sheds its loops: no network canvas, scramble, aurora, shine, or ticker", () => {
  const hero = readComponent("hero.tsx");
  const signatureCss = readFileSync(new URL("../app/signature.css", import.meta.url), "utf8");
  const experienceCss = readFileSync(new URL("../app/experience.css", import.meta.url), "utf8");
  assert.throws(() => readComponent("decode-text.tsx"), /ENOENT/, "the per-letter scramble is gone; it broke Arabic letter joins");
  assert.doesNotMatch(hero, /AgentField|DecodeText|aurora|hero-ticker|PaletteTrigger|<video/);
  for (const rule of [/\.hero-ticker/, /\.decode/, /text-shine/, /ticker-run/]) assert.doesNotMatch(signatureCss, rule);
  assert.doesNotMatch(experienceCss, /\.signature-hero|\.intro-film/);
  // Everything that still moves in the hero sits in one motion block, and none of it repeats forever.
  const heroCss = signatureCss.slice(signatureCss.indexOf("/* ---------- Hero:"), signatureCss.indexOf("/* ---------- Work ---------- */"));
  const motion = heroCss.indexOf("@media (prefers-reduced-motion: no-preference)");
  assert.ok(motion > 0);
  assert.doesNotMatch(heroCss, /infinite/);
  assert.match(heroCss.slice(motion), /^@media \(prefers-reduced-motion: no-preference\) \{\s*html:not\(\[data-motion="off"\]\)/);
  assert.match(heroCss, /animation: hero-pulse 1\.5s ease-out 3;/, "the status dot pulses three times, then stops");
  assert.doesNotMatch(heroCss, /@keyframes status-pulse/, "the console's live dot keeps its own keyframes");
  // WCAG 2.2.2: every movement ends within 5 s, so nothing needs a pause control.
  const seconds = (time) => (time.endsWith("ms") ? Number.parseFloat(time) / 1000 : Number.parseFloat(time));
  for (const [, name, duration, count] of heroCss.slice(motion).matchAll(/animation: ([\w-]+) ([\d.]+m?s)\b[^;]*?(?: (\d+))?;/g)) {
    assert.ok(seconds(duration) * Number(count ?? 1) <= 5, `${name} runs ${duration} × ${count ?? 1}, longer than 5 s`);
  }
  // Only transform, opacity, and clip-path move.
  for (const [, body] of heroCss.matchAll(/@keyframes [\w-]+ \{([\s\S]*?\})\s*\}/g)) {
    for (const [, property] of body.matchAll(/([\w-]+):/g)) assert.ok(["transform", "opacity", "clip-path", "stroke-dashoffset"].includes(property), `a hero keyframe animates ${property}`);
  }
  assert.doesNotMatch(heroCss.slice(0, motion), /animation:(?! none)|transition:/, "the rest state is the default style");
});

test("the agent network moved behind the console, so the gravity secret keeps a trigger", async () => {
  const runtime = readComponent("runtime-section.tsx");
  const field = readComponent("agent-field.tsx");
  const { SECRET_IDS } = await import("../components/secrets.ts");
  const { getContent } = await import("../data/i18n.ts");
  assert.ok(SECRET_IDS.includes("gravity"));
  assert.match(runtime, /<AgentField labels=\{fieldLabels\} \/>/);
  assert.ok(runtime.indexOf("<AgentField") < runtime.indexOf("<AgentTerminal"), "the canvas is painted behind the console");
  assert.match(runtime, /\.\.\.ui\.runtime\.concepts/);
  assert.match(runtime, /data-cursor=\{ui\.runtime\.cursor\}/);
  assert.match(field, /unlockSecret\("gravity"\)/);
  assert.match(field, /closest\("a, button, input, textarea, video, \.terminal-slot"\)/, "typing in the console never starts a well");
  assert.match(readFileSync(new URL("../app/experience.css", import.meta.url), "utf8"), /\.runtime-section\[data-gravity\] \{ cursor: grabbing;/);
  for (const locale of ["en", "ar"]) {
    const { ui } = getContent(locale);
    assert.equal(ui.runtime.concepts.length, 4);
    assert.equal("concepts" in ui.hero || "ticker" in ui.hero || "cursor" in ui.hero, false, `${locale}: the hero keeps no copy for the moved parts`);
  }
  assert.match(getContent("en").ui.secrets.items.gravity.hint, /behind the AI console/);
  assert.match(getContent("ar").ui.secrets.items.gravity.hint, /خلف طرفية المساعد/);
});

test("profile updates from X, LinkedIn, and GitHub keep their sources", () => {
  assert.match(dataSource, /platform: "X"[\s\S]*?audience: "4\.5K\+ followers"/);
  assert.match(dataSource, /platform: "LinkedIn"[\s\S]*?audience: "2K\+ followers"/);
  assert.match(dataSource, /title: "Selected for the National History Lab"[\s\S]*?date: "Feb 2025"/);
  assert.match(dataSource, /One of 600 learners selected for the final stage/);
  assert.match(dataSource, /slug: "accessfinish"[\s\S]*?2 of 5 passed the full procedure/);
  assert.match(dataSource, /slug: "mawrid"[\s\S]*?every reading in the demo is simulated/);
  assert.match(dataSource, /coursera\.org\/verify\/4NAKX19FC78R/);
});

test("the Arabic edition mirrors every record and keeps links single-sourced", async () => {
  const { getContent } = await import("../data/i18n.ts");
  const en = getContent("en");
  const ar = getContent("ar");
  const arabicText = /[؀-ۿ]/;

  assert.equal(ar.dir, "rtl");
  assert.equal(ar.projects.length, en.projects.length);
  for (const [index, project] of ar.projects.entries()) {
    assert.equal(project.slug, en.projects[index].slug);
    assert.equal(project.repository, en.projects[index].repository);
    assert.match(project.description, arabicText, `${project.slug} description is translated`);
  }
  for (const key of ["achievements", "programs", "organizations", "recommendations", "proofMetrics"]) {
    assert.equal(ar[key].length, en[key].length, `${key} keeps one Arabic record per English record`);
  }
  assert.equal(ar.journey.length, en.journey.length);
  assert.match(ar.identity.headline, arabicText);
  assert.ok(ar.identity.headline.includes(ar.ui.hero.highlight), "Arabic headline contains its highlight");
  assert.ok(en.identity.headline.includes(en.ui.hero.highlight), "English headline contains its highlight");

  const arabicPage = readFileSync(new URL("../app/ar/page.tsx", import.meta.url), "utf8");
  assert.match(arabicPage, /<HomePage locale="ar" \/>/);
  assert.match(arabicPage, /canonical: "\/ar\/"/);
  assert.match(readFileSync(new URL("../components/motion-preference.ts", import.meta.url), "utf8"), /d\.lang="ar";d\.dir="rtl"/);
});

test("one typeface: IBM Plex Sans Arabic carries every role in both languages", () => {
  const rtlCss = readFileSync(new URL("../app/rtl.css", import.meta.url), "utf8");
  assert.match(layoutSource, /IBM_Plex_Sans_Arabic/);
  assert.doesNotMatch(layoutSource, /Manrope|Space_Grotesk|IBM_Plex_Mono/);
  assert.match(layoutSource, /subsets: \["arabic", "latin"\]/);
  for (const role of ["sans", "display", "mono"]) {
    assert.ok(rtlCss.includes(`--font-${role}: var(--font-arabic)`), `--font-${role} resolves to IBM Plex Sans Arabic`);
  }
  assert.match(rtlCss, /letter-spacing: 0 !important/);
});
