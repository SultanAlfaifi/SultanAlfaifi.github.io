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
  const component = (file) => readFileSync(new URL(`../components/${file}`, import.meta.url), "utf8");
  // Eight blocks after the hero, in the browse order; work first, contact last.
  const order = ["<ProjectsSection", "<KineticBand", "<RuntimeSection", "<AboutSection", "<AchievementsSection", "<CvSection", "<DeeperSection", "<ContactSection"];
  const at = order.map((tag) => pageSource.indexOf(tag));
  assert.ok(at.every((index) => index > 0), "every block is on the page");
  assert.deepEqual([...at].sort((a, b) => a - b), at, "in the browse order");
  // The blocks that moved still render, inside the chapter they now belong to.
  assert.match(component("about-section.tsx"), /<ExperienceSection locale=\{locale\} \/>/);
  assert.match(component("achievements-section.tsx"), /<RecommendationsSection locale=\{locale\} \/>/);
  assert.match(component("contact-section.tsx"), /<HelpSection locale=\{locale\} \/>/);
  // The full journey: six rows in "Beyond the projects", each with its section id, timeline first.
  const deeper = component("deeper-section.tsx");
  const rows = ["timeline", "organizations", "skills", "journey", "community", "ideas"].map((id) => deeper.indexOf(`<DeeperRow id="${id}"`));
  assert.ok(rows.every((index) => index > 0), "all six rows");
  assert.deepEqual([...rows].sort((a, b) => a - b), rows);
  for (const tag of ["<JourneyTimeline", "<OrganizationRail", "<SkillsSection", "<ProgramsSection", "<CommunitySection", "<IdeasSection"]) assert.ok(deeper.includes(tag), tag);
  assert.match(deeper, /ui\.deeper\.title/);
  assert.match(readFileSync(new URL("../data/ui.ts", import.meta.url), "utf8"), /title: "Beyond the projects"/);
});

test("organization records encode explicit relationships and nullable logos", () => {
  assert.match(dataSource, /export type Organization/);
  assert.match(dataSource, /relationship: "COOP Experience"/);
  assert.match(dataSource, /relationship: "Software Engineering Education"/);
  assert.doesNotMatch(dataSource, /Companies I Worked With|Trusted By|Partners/);
});

test("organizations keep their brand palettes, and the grid shows each one still, with its note and link", () => {
  assert.match(dataSource, /name: "Salla"[\s\S]*?colors: \["#004856", "#a5ffe0"\]/);
  assert.match(dataSource, /name: "KAUST Academy"[\s\S]*?"#efb61d"[\s\S]*?"#07a6aa"/);
  assert.match(dataSource, /url: "https:\/\/academy\.kaust\.edu\.sa\/"/);
  assert.doesNotMatch(dataSource, /FDM Group/);
  // A still grid (FINAL-SPEC 6.7): no marquee, no drag, no pause control, no script.
  assert.doesNotMatch(organizationRailSource, /"use client"|AUTO_SCROLL_SPEED|requestAnimationFrame|onPointerDown|journey-motion-toggle|\[true, false, true\]/);
  assert.match(organizationRailSource, /organizations\.filter\(\(organization\) => organization\.visible\)/, "every visible organization");
  assert.match(organizationRailSource, /asset\.derived\.monochrome \?\? asset\.derived\.color/, "the supplied monochrome logo first");
  assert.match(organizationRailSource, /\{organization\.relationship\}[\s\S]*?\{organization\.journeyNote\}/, "what I did there, in words");
  assert.match(organizationRailSource, /href=\{organization\.url\} target="_blank" rel="noreferrer noopener"/);
  assert.match(organizationRailSource, /draggable=\{false\}/);
  const chapters = readFileSync(new URL("../app/chapters.css", import.meta.url), "utf8");
  const grid = chapters.slice(chapters.indexOf("/* ===== Outside the projects ===== */"), chapters.indexOf("/* ===== Contact + Help ===== */"));
  assert.match(grid, /\.row-orgs \{ display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
  assert.match(grid, /\.row-orgs__logo--inked img \{ filter: brightness\(0\) invert\(1\); \}/, "a colour-only logo is inked off-white too");
  assert.match(grid, /-webkit-user-drag: none/);
  assert.doesNotMatch(grid, /overflow-x: auto|cursor: grab|mask-image|@keyframes [\w-]*marquee/, "nothing scrolls sideways or slides");
});

test("the timeline is a still list of every stop, read top to bottom, with no pin or sideways scroll", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { JourneyTimeline } = await import("../components/journey-timeline.tsx");
  const { getContent } = await import("../data/i18n.ts");
  for (const locale of ["en", "ar"]) {
    const html = renderToStaticMarkup(createElement(JourneyTimeline, { locale }));
    const { journey } = getContent(locale);
    assert.equal(html.match(/<li class="row-timeline__stop/g).length, journey.length, `${locale}: every stop`);
    assert.ok(html.includes(journey.at(-1).title), `${locale}: the "Next" stop too`);
    assert.doesNotMatch(html, /timeline__viewport|timeline__sticky|data-cursor|tabindex/, `${locale}: nothing to scroll sideways`);
  }
  const chapters = readFileSync(new URL("../app/chapters.css", import.meta.url), "utf8");
  assert.doesNotMatch(chapters, /row-timeline[^{]*\{[^}]*(position: sticky|overflow-x|animation-timeline)/, "no pin");
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
  // The programs row: the logo sits on the hairline with no tile behind it; a colour-only logo is inked off-white.
  const chapters = readFileSync(new URL("../app/chapters.css", import.meta.url), "utf8");
  const logo = chapters.match(/\.portfolio-v3 \.row-program__logo \{[^}]*\}/)[0];
  assert.doesNotMatch(logo, /background|box-shadow|border:/, "no backing tile");
  assert.match(chapters, /\.row-program__logo--inked img \{ filter: brightness\(0\) invert\(1\); \}/);
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
    /"I build AI agents that ask before they act\."/
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
  // The Salla film is a still poster until the visitor presses play: it never starts on its own and never
  // loops, plays with its own controls once started, and pauses when it leaves the screen.
  assert.doesNotMatch(sallaStorySource, /\bloop\b|autoPlay/);
  assert.match(sallaStorySource, /controls=\{started\}/);
  assert.match(sallaStorySource, /onClick=\{\(\) => void play\(\)\}/);
  assert.match(sallaStorySource, /IntersectionObserver\(\(\[entry\]\) => \{\s*if \(!entry\.isIntersecting\) pause\(\);/);
});

test("About and Recognition keep their facts with less on screen (FINAL-SPEC 6.4, 6.5)", async () => {
  const { JSDOM } = await import("jsdom");
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { AboutSection } = await import("../components/about-section.tsx");
  const { AchievementsSection } = await import("../components/achievements-section.tsx");
  const { getContent } = await import("../data/i18n.ts");
  for (const locale of ["en", "ar"]) {
    const { about, achievements, experience, journey, recommendations, ui } = getContent(locale);
    const render = (component) => new JSDOM(renderToStaticMarkup(createElement(component, { locale }))).window.document;

    // About: paragraphs 1 and 3, one meta line, no second CV link.
    const page = render(AboutSection);
    const text = page.querySelector(".about__text").textContent;
    assert.ok(text.includes(about.paragraphs[0]) && text.includes(about.paragraphs[2]), `${locale}: p1 and p3`);
    assert.ok(!text.includes(about.paragraphs[1]), `${locale}: paragraph 2 left the page`);
    assert.equal(page.querySelectorAll(".about__meta li").length, 3, `${locale}: location · education · languages`);
    assert.equal(page.querySelector('#about a[href$=".pdf"]'), null, `${locale}: the CV chapter is the one download`);
    // The Now card: #experience inside About, no chips, no intro, the film still until pressed.
    const now = page.querySelector("#about #experience.about__now");
    assert.ok(now, `${locale}: the Now card`);
    assert.equal(now.querySelector("h3").textContent, ui.experience.title);
    assert.equal(now.querySelectorAll(".tag-list").length, 0, `${locale}: no tech chips`);
    for (const gone of [experience[0].description, ui.experience.description]) assert.ok(!now.textContent.includes(gone), `${locale}: ${gone}`);
    assert.equal(now.querySelectorAll(".about__now-duties li").length, experience[0].responsibilities.length);
    assert.ok(now.querySelector(".about__now-note").textContent.includes(experience[0].note), `${locale}: the learning note stays`);
    const video = now.querySelector("video");
    assert.equal(video.getAttribute("preload"), "none");
    assert.ok(!video.hasAttribute("loop") && !video.hasAttribute("autoplay"), `${locale}: nothing loops or starts on its own`);
    assert.equal(now.querySelector("button.about__now-play").textContent.trim(), ui.media.salla.play);
    // «التالي»: the last journey stop, verbatim, under the card.
    const next = journey[journey.length - 1];
    assert.equal(page.querySelector(".about__next-label").textContent, next.date);
    assert.equal(page.querySelector(".about__next-title").textContent, next.title);
    assert.equal(page.querySelector(".about__next-detail").textContent, next.detail);

    // Recognition: one moment, the rest as rows with their full descriptions, no number row.
    const recognition = render(AchievementsSection);
    const [lead, ...rest] = achievements.filter((item) => item.enabled);
    assert.equal(recognition.querySelectorAll(".proof-metrics, [data-count]").length, 0, `${locale}: no number row`);
    assert.equal(recognition.querySelector(".recognition__moment .li-aurora-text bdi[dir=\"ltr\"]").textContent, "5%", `${locale}: 5%, never %5`);
    assert.equal(recognition.querySelector(".recognition__lead-title").textContent, lead.title);
    const rows = [...recognition.querySelectorAll("ol.recognition__rows > li.recognition__row")];
    assert.equal(rows.length, rest.length, `${locale}: ${rest.length} rows`);
    rows.forEach((row, index) => {
      assert.ok(row.querySelector(".recognition__signal > bdi"), `${locale}: the signal is isolated`);
      assert.equal(row.querySelector("h3").textContent, rest[index].title);
      assert.equal(row.querySelector(".recognition__text p").textContent, rest[index].description, `${locale}: the full description`);
      assert.equal(row.querySelectorAll("img").length, 0, `${locale}: no logos on the rows`);
    });
    // The quotes: an h3, two figures, roles on one line, each note once, the LinkedIn link; no avatars or chips.
    const quotes = recognition.querySelector("#achievements #recommendations");
    assert.equal(quotes.querySelector("h3").textContent, ui.recommendations.title);
    assert.equal(quotes.querySelectorAll("h2").length, 0);
    const figures = [...quotes.querySelectorAll("figure")];
    assert.equal(figures.length, recommendations.length);
    assert.equal(quotes.querySelectorAll("img, .tag-list").length, 0, `${locale}: no logos, avatars or chips`);
    assert.ok(!quotes.textContent.includes(ui.recommendations.description), `${locale}: no intro`);
    if (ui.recommendations.translated) assert.ok(!quotes.textContent.includes(ui.recommendations.translated), `${locale}: no duplicate translation note`);
    figures.forEach((figure, index) => {
      const { note, publicUrl, quote, roles } = recommendations[index];
      assert.equal(figure.querySelector("blockquote").textContent, quote);
      assert.equal(figure.querySelector(".recognition__quote-role").textContent, roles.join(" · "));
      if (note) assert.equal(figure.textContent.split(note).length - 1, 1, `${locale}: ${note} once`);
      assert.equal(Boolean(figure.querySelector(`a[href="${publicUrl}"]`)), Boolean(publicUrl));
    });
  }
});

test("featured work reflects current products and preserves supplied usage evidence", () => {
  assert.match(
    dataSource,
    /slug: "masari"[\s\S]*?value: "About 1,600"[\s\S]*?label: "Active users"[\s\S]*?value: "1,250\+"[\s\S]*?label: "CVs downloaded"/
  );
  assert.match(dataSource, /slug: "danna"[\s\S]*?flagship: false/);
  // The featured six are chosen in one place (showcaseOrder), which the showcase and its section share.
  assert.match(
    readFileSync(new URL("../components/showcase-parts.tsx", import.meta.url), "utf8"),
    /filter\(\(project\) => project\.featured\)/
  );
  assert.match(projectsSource, /project\.enabled && !project\.featured/, "the smaller builds are the rest");
  for (const slug of ["mustakshif", "rajih-engine", "autoflow"]) assert.ok(dataSource.includes(`slug: "${slug}"`));
});

test("the living orb is the navigation brand, with the static orb mark as its stand-in", () => {
  assert.match(navbarSource, /import \{ BrandOrb \} from "\.\/living-orb";/);
  assert.match(navbarSource, /<BrandOrb \/>/);
  assert.match(readFileSync(new URL("../components/living-orb.tsx", import.meta.url), "utf8"), /poster="\/brand\/sultan-alfaifi-mark\.svg"/);
  assert.doesNotMatch(navbarSource, />SA<\/span>/);
});

test("social metadata uses a static image with a reliable PNG extension", () => {
  assert.match(layoutSource, /url: "\/opengraph-image\.png"/);
});

test("the living palette meets its intended contrast roles on the black ground", () => {
  const ground = "#030304";
  assert.ok(contrastRatio("#f4f2ee", ground) >= 4.5, "primary ink");
  assert.ok(contrastRatio("#b1afab", ground) >= 4.5, "secondary ink");
  assert.ok(contrastRatio("#8c8a87", "#131318") >= 4.5, "quiet captions, even on raised glass");
  assert.ok(contrastRatio("#050507", "#f4f2ee") >= 4.5, "dark text on the off-white primary button");
  assert.ok(contrastRatio("#9fe3ff", ground) >= 4.5, "glacier tint labels");
  assert.ok(contrastRatio("#050507", "#ffd3a8") >= 4.5, "dark text on the apricot Approve");
  assert.ok(contrastRatio("#9cc9ff", ground) >= 3, "focus ring");
  for (const lamp of ["#ffb46a", "#47c8f5", "#ff5c8d"]) assert.ok(contrastRatio(lamp, ground) >= 3, `checkpoint lamp ${lamp}`);
  assert.ok(contrastRatio("#f4f2ee", "#47c8f5") < 3, "off-white never sits on a glacier fill");
});

test("responsive and reduced-motion safeguards are present", () => {
  assert.match(cssSource, /overflow-x:\s*hidden/);
  assert.match(cssSource, /@media \(max-width: 600px\)/);
  // On a phone the two quotes stack into one column (Recognition, app/chapters.css).
  assert.match(
    readFileSync(new URL("../app/chapters.css", import.meta.url), "utf8"),
    /@media \(max-width: 900px\) \{[^@]*?\.recognition__quote-grid \{ grid-template-columns: minmax\(0, 1fr\); \}/
  );
  assert.match(
    cssSource,
    /\.nav__drawer\s*\{[\s\S]*?position:\s*absolute[\s\S]*?100dvh[\s\S]*?background:\s*var\(--li-bg\)/
  );
  assert.match(navbarSource, /matchMedia\("\(min-width: 841px\)"\)/);
  assert.match(dataSource, /id: "fazzah"[\s\S]*?visualScale: 1\.06/);
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(organizationRailSource, /motionAllowed\(\)/, "the organization grid has no motion to switch off");
});

const readComponent = (name) => readFileSync(new URL(`../components/${name}`, import.meta.url), "utf8");

test("signature interactions stay decorative and respect motion preferences", () => {
  const stage = readComponent("assistant-stage.tsx");
  const layer = readComponent("interaction-layer.tsx");
  const terminal = readComponent("agent-terminal.tsx");
  const palette = readComponent("command-palette.tsx");
  const signatureCss = readFileSync(new URL("../app/signature.css", import.meta.url), "utf8");

  // The AI section's orb is the shared living orb (it pauses off screen and in hidden tabs itself); the
  // stage's word is decoration, and its entrance and hello only run while motion is allowed.
  assert.match(stage, /<LivingOrb ref=\{orbRef\} className="ai-orb"/);
  assert.match(stage, /<p className="ai-state" aria-hidden="true">/);
  assert.match(stage, /if \(motionAllowed\(\) && below && "IntersectionObserver" in window\) section\.dataset\.arrive = "wait";/);
  assert.match(stage, /if \(greeted \|\| !motionAllowed\(\)\) return;/);
  assert.match(layer, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(layer, /nodeValue/);
  assert.match(terminal, /role="log"/);
  assert.match(terminal, /copy\.blocked/);
  assert.match(readFileSync(new URL("../data/ui.ts", import.meta.url), "utf8"), /blocked by policy/);
  assert.match(palette, /role="combobox"/);
  assert.match(palette, /aria-activedescendant/);
  assert.match(signatureCss, /html\[data-motion="off"\] \.portfolio-v3 \*/);
});

test("the hero sheds its loops: no network canvas, scramble, shine, or ticker, and its motion ends", () => {
  const hero = readComponent("hero.tsx");
  const signatureCss = readFileSync(new URL("../app/signature.css", import.meta.url), "utf8");
  const experienceCss = readFileSync(new URL("../app/experience.css", import.meta.url), "utf8");
  const heroCss = readFileSync(new URL("../app/hero.css", import.meta.url), "utf8");
  assert.throws(() => readComponent("decode-text.tsx"), /ENOENT/, "the per-letter scramble is gone; it broke Arabic letter joins");
  assert.doesNotMatch(hero, /AgentField|DecodeText|aurora|hero-ticker|PaletteTrigger|<video/);
  for (const rule of [/\.hero-ticker/, /\.decode/, /text-shine/, /ticker-run/]) assert.doesNotMatch(signatureCss, rule);
  assert.doesNotMatch(experienceCss, /\.signature-hero|\.intro-film|\.intro-curtain/, "the intro curtain is gone; the hero's own entrance replaced it");
  assert.throws(() => readComponent("intro-curtain.tsx"), /ENOENT/);
  assert.doesNotMatch(signatureCss, /\.identity-hero__layout|\.hero-run \{|\.gate-phrase/, "the hero's rules live in hero.css");
  // Everything that moves in the hero sits in one motion block, and none of it repeats forever.
  const motion = heroCss.indexOf("@media (prefers-reduced-motion: no-preference)");
  assert.ok(motion > 0);
  assert.doesNotMatch(heroCss, /infinite/);
  for (const rule of heroCss.slice(motion).split("\n").filter((line) => /^\s+html[^{]*\{ animation:/.test(line))) {
    assert.match(rule, /:not\(\[data-motion="off"\]\)/, `every moving rule follows the Motion switch: ${rule.trim().slice(0, 80)}`);
  }
  assert.match(heroCss, /animation: hero-ping 1\.5s ease-out 3;/, "the status dot pings three times, then stops");
  assert.doesNotMatch(heroCss, /@keyframes status-pulse/, "the console's live dot keeps its own keyframes");
  // WCAG 2.2.2: every movement ends within 5 s, so nothing needs a pause control.
  const seconds = (time) => (time.endsWith("ms") ? Number.parseFloat(time) / 1000 : Number.parseFloat(time));
  for (const [, name, duration, count] of heroCss.slice(motion).matchAll(/animation: ([\w-]+) ([\d.]+m?s)\b[^;]*?(?: (\d+))?;/g)) {
    assert.ok(seconds(duration) * Number(count ?? 1) <= 5, `${name} runs ${duration} × ${count ?? 1}, longer than 5 s`);
  }
  // Mostly transform and opacity. The entrance alone also eases a blur to sharp (filter) and passes one
  // sweep of light along the headline (background-position); the asking card turns its edge (--li-angle).
  for (const [, body] of heroCss.matchAll(/@keyframes [\w-]+ \{([\s\S]*?\})\s*\}/g)) {
    for (const [, property] of body.matchAll(/([\w-]+):/g)) assert.ok(["transform", "opacity", "filter", "background-position", "--li-angle"].includes(property), `a hero keyframe animates ${property}`);
  }
  assert.doesNotMatch(heroCss.slice(0, motion), /animation:(?! none)|transition:/, "the rest state is the default style");
});

test("the starfield is gone and the gravity secret lives on the AI section's living orb", async () => {
  const runtime = readComponent("runtime-section.tsx");
  const stage = readComponent("assistant-stage.tsx");
  const { SECRET_IDS } = await import("../components/secrets.ts");
  const { getContent } = await import("../data/i18n.ts");
  assert.throws(() => readComponent("agent-field.tsx"), /ENOENT/, "the AgentField starfield was replaced by the living orb");
  assert.ok(SECRET_IDS.includes("gravity"));
  assert.ok(runtime.indexOf("<AssistantStage") < runtime.indexOf("<AgentTerminal"), "on a phone the orb comes before the console");
  assert.match(stage, /data-cursor=\{copy\.cursor\}/, "the cursor ring says press and hold over the orb");
  // Only a press that lasted, then a release, finds it; a scroll that starts on the orb cancels the press.
  assert.match(stage, /if \(gravityRef\.current !== "held"\) return;[\s\S]*?unlockSecret\("gravity"\)/);
  assert.match(stage, /window\.addEventListener\("pointercancel", cancel\)/);
  assert.doesNotMatch(stage.slice(stage.indexOf("const cancel"), stage.indexOf('window.addEventListener("pointerup"')), /unlockSecret/);
  assert.match(readFileSync(new URL("../app/ai.css", import.meta.url), "utf8"), /\.ai-stage\[data-gravity\] \{ cursor: grabbing; \}/);
  for (const locale of ["en", "ar"]) {
    const { ui } = getContent(locale);
    assert.equal("concepts" in ui.runtime, false, `${locale}: no labels left for the removed network`);
    assert.equal("concepts" in ui.hero || "ticker" in ui.hero || "cursor" in ui.hero, false, `${locale}: the hero keeps no copy for the moved parts`);
  }
  assert.match(getContent("en").ui.secrets.items.gravity.hint, /living light beside the AI assistant/);
  assert.match(getContent("ar").ui.secrets.items.gravity.hint, /الضوء الحيّ بجانب المساعد الذكي/);
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
