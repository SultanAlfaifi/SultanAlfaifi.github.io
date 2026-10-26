import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const { motionBootScript } = await import("../components/motion-preference.ts");
const { SECTION_ORDERS } = await import("../components/personal-order.tsx");

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const home = read("../components/home-page.tsx");
const hero = read("../components/hero.tsx");
const welcome = read("../components/welcome-screen.tsx");
const navbar = read("../components/navbar.tsx");
const palette = read("../components/command-palette.tsx");
const styles = read("../app/welcome.css");

// Runs the real <head> boot script against a pretend browser and reports what it decided.
function boot({ path = "/", search = "", hash = "", languages = ["en-US"], userAgent = "Mozilla/5.0 Chrome/150", webdriver = false, stored = {}, reduced = false } = {}) {
  const root = { dataset: {}, lang: "en", dir: "ltr" };
  let redirect = null;
  const storage = (data) => ({ getItem: (key) => (key in data ? data[key] : null), setItem: (key, value) => { data[key] = String(value); } });
  vm.runInNewContext(motionBootScript, {
    document: { documentElement: root },
    location: { pathname: path, search, hash, replace: (url) => { redirect = url; } },
    navigator: { languages, language: languages[0], userAgent, webdriver },
    localStorage: storage({ ...stored }),
    sessionStorage: storage({}),
    matchMedia: () => ({ matches: reduced }),
    URLSearchParams
  });
  return { ...root.dataset, lang: root.lang, dir: root.dir, redirect };
}

test("a first visit to / from an Arabic device opens the Arabic site, keeping the query and hash", () => {
  const result = boot({ languages: ["ar-SA", "en-US"], search: "?utm=x", hash: "" });
  assert.equal(result.redirect, "/ar/?utm=x");
  assert.equal(result.welcome, undefined, "the welcome waits for the Arabic page");
  assert.equal(result.intro, undefined);
});

test("a language the visitor picked always wins over the device language", () => {
  const result = boot({ languages: ["ar-SA"], stored: { "portfolio-lang": "en" } });
  assert.equal(result.redirect, null);
  assert.equal(result.welcome, "show");
});

test("English devices and crawlers stay on /, and crawlers never see the welcome screen", () => {
  assert.equal(boot({ languages: ["en-GB", "ar"] }).redirect, null, "only the first language counts");
  const crawler = boot({ languages: ["ar-SA"], userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)" });
  assert.equal(crawler.redirect, null);
  assert.equal(crawler.welcome, undefined);
  assert.equal(boot({ webdriver: true }).welcome, undefined);
});

test("the welcome screen shows once, on either home page, and replaces the intro curtain", () => {
  const first = boot();
  assert.equal(first.welcome, "show");
  assert.equal(first.intro, undefined);
  const arabic = boot({ path: "/ar/" });
  assert.equal(arabic.welcome, "show");
  assert.deepEqual([arabic.lang, arabic.dir], ["ar", "rtl"]);
  const returning = boot({ stored: { "portfolio-visitor": "hiring" } });
  assert.equal(returning.welcome, undefined);
  assert.equal(returning.visitor, "hiring", "the page is arranged before first paint");
  assert.equal(returning.intro, "play");
});

test("links to a specific place skip the welcome screen; ?welcome always shows it", () => {
  assert.equal(boot({ hash: "#cv" }).welcome, undefined);
  assert.equal(boot({ search: "?cv=general~x" }).welcome, undefined);
  assert.equal(boot({ path: "/agent-evals/" }).welcome, undefined);
  assert.equal(boot({ search: "?welcome", stored: { "portfolio-visitor": "browse" } }).welcome, "show");
});

test("an unknown stored value is ignored", () => {
  assert.equal(boot({ stored: { "portfolio-visitor": "<script>" } }).visitor, undefined);
});

test("each visitor's section order covers every section exactly once", () => {
  const all = [...home.matchAll(/id: "([a-z]+)"/g)].map((match) => match[1]).sort();
  assert.equal(all.length, 13);
  for (const [visitor, order] of Object.entries(SECTION_ORDERS)) assert.deepEqual([...order].sort(), all, visitor);
  assert.equal(SECTION_ORDERS.hiring.indexOf("cv") < SECTION_ORDERS.hiring.indexOf("about"), true, "hiring visitors reach the CV early");
});

test("the welcome screen is a real dialog: three choices, a skip, Escape, and a language link that remembers", () => {
  assert.match(welcome, /<dialog/);
  assert.match(welcome, /dialog\.showModal\(\)/);
  assert.match(welcome, /onCancel=\{\(event\) => \{\s*event\.preventDefault\(\);\s*finish\(/);
  assert.match(welcome, /\{ visitor: "hiring", Icon: BriefcaseBusiness \},\s*\{ visitor: "collaborate", Icon: Handshake \},\s*\{ visitor: "browse", Icon: Compass \}/);
  assert.match(welcome, /className="welcome__skip" onClick=/);
  assert.match(welcome, /onClick=\{\(\) => rememberLanguage\(ui\.nav\.language\.hrefLang\)\}/);
  assert.match(welcome, /aria-labelledby=/);
  assert.match(styles, /html\[data-welcome="show"\] \{ overflow: hidden; \}/);
});

test("every language link remembers the choice", () => {
  assert.match(navbar, /onClick=\{\(\) => rememberLanguage\(ui\.nav\.language\.hrefLang\)\}/);
  assert.match(palette, /rememberLanguage\(ui\.nav\.language\.hrefLang\);\s*window\.location\.href = ui\.nav\.language\.href;/);
});

test("the hero's calls to action follow the visitor's choice without a flash", () => {
  assert.match(hero, /href="#cv" data-magnetic data-visitor-only="hiring"/);
  assert.match(hero, /href="#work" data-magnetic data-visitor-hide="hiring"/);
  assert.match(styles, /html\[data-visitor="hiring"\] \.identity-hero__actions \[data-visitor-only="hiring"\]/);
});
