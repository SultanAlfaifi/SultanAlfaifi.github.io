import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const { getContent } = await import("../data/i18n.ts");
const { buildKnowledge } = await import("../lib/agent/knowledge.ts");
const { runScript } = await import("../components/hero-run.tsx");
const { ProjectCard } = await import("../components/agent-cards.tsx");

const en = getContent("en");
const ar = getContent("ar");
const locales = { en, ar };
const featured = (content) => content.projects.filter((project) => project.enabled && project.featured);

// Everything a project says about itself on the page. A checkpoint, caveat, or boundary has to be quoted
// from here word for word, so the hero and the chapters can never claim more than the project does.
function ownText(project) {
  return [project.description, project.status, project.challenge, project.decision, project.evidence, project.outcome, ...project.highlights]
    .filter(Boolean)
    .join("\n");
}

test("every checkpoint, caveat, and boundary is quoted word for word from its own project, in both languages", () => {
  for (const [locale, content] of Object.entries(locales)) {
    for (const project of content.projects) {
      const text = ownText(project);
      for (const [field, quote] of [["checkpoint", project.checkpoint?.text], ["caveat", project.caveat], ["boundary", project.boundary]]) {
        if (!quote) continue;
        assert.ok(text.includes(quote), `${locale} ${project.slug} ${field} is not in its own copy: "${quote}"`);
      }
    }
  }
});

test("a checkpoint points at a real step of its project's flow", () => {
  for (const [locale, content] of Object.entries(locales)) {
    for (const project of content.projects.filter((item) => item.checkpoint)) {
      const { step, kind } = project.checkpoint;
      assert.ok(Number.isInteger(step) && step >= 1 && step <= (project.flow?.length ?? 0), `${locale} ${project.slug}: step ${step} is outside its flow`);
      assert.ok(["asks", "verifies", "holds"].includes(kind), `${locale} ${project.slug}: unknown kind ${kind}`);
    }
  }
});

test("the Arabic edition keeps every checkpoint's step and kind, and every metric's kind, link, and date", () => {
  for (const [index, project] of en.projects.entries()) {
    const arabic = ar.projects[index];
    assert.equal(arabic.slug, project.slug);
    assert.equal(Boolean(arabic.checkpoint), Boolean(project.checkpoint), `${project.slug}: checkpoint in one language only`);
    if (project.checkpoint) {
      assert.equal(arabic.checkpoint.step, project.checkpoint.step);
      assert.equal(arabic.checkpoint.kind, project.checkpoint.kind);
      assert.notEqual(arabic.checkpoint.text, project.checkpoint.text, `${project.slug}: checkpoint text is translated`);
    }
    assert.equal(Boolean(arabic.caveat), Boolean(project.caveat), `${project.slug}: caveat in one language only`);
    assert.equal(Boolean(arabic.boundary), Boolean(project.boundary), `${project.slug}: boundary in one language only`);
    assert.equal(arabic.showcase, project.showcase);
    assert.equal(arabic.flow?.length, project.flow?.length, `${project.slug}: flow has the same steps in Arabic`);
    assert.equal(arabic.metrics?.length, project.metrics?.length, `${project.slug}: one Arabic figure per English figure`);
    for (const [position, metric] of (project.metrics ?? []).entries()) {
      const translated = arabic.metrics[position];
      assert.equal(translated.kind, metric.kind, `${project.slug} metric ${position}: kind survives the merge`);
      assert.equal(translated.href, metric.href, `${project.slug} metric ${position}: link survives the merge`);
      assert.equal(Boolean(translated.asOf), Boolean(metric.asOf), `${project.slug} metric ${position}: as-of date in both languages`);
      assert.equal(Boolean(translated.note), Boolean(metric.note), `${project.slug} metric ${position}: note in both languages`);
    }
  }
  for (const project of featured(en)) {
    for (const metric of project.metrics ?? []) assert.ok(metric.kind, `${project.slug} "${metric.label}" says what kind of number it is`);
  }
});

test("the count is honest: 5 of the 6 featured projects stop to check, and Masari draws a line instead", () => {
  for (const content of [en, ar]) {
    const shown = featured(content);
    assert.equal(shown.length, 6);
    assert.equal(shown.filter((project) => project.checkpoint).length, 5);
    const masari = shown.find((project) => project.slug === "masari");
    assert.equal(masari.checkpoint, undefined, "Masari has no checkpoint to show, so none is made up");
    assert.ok(masari.boundary);
    const script = runScript(content);
    assert.equal(script.featured, 6);
    assert.equal(script.checks, 5);
  }
  assert.equal(runScript(en).variants[0].read, "6 featured · 5 stop to check");
});

test("the showcase runs 01 AccessFinish to 06 WAREVA, and Approve opens number one", () => {
  const order = featured(en).sort((a, b) => a.showcase - b.showcase).map((project) => project.title);
  assert.deepEqual(order, ["AccessFinish", "Mustakshif", "Masari", "Mashhad", "AutoFlow", "WAREVA"]);
  assert.equal(runScript(en).flagship.slug, "accessfinish");
});

test("AccessFinish's numbers keep their denominators and their date", () => {
  const accessfinish = en.projects.find((project) => project.slug === "accessfinish");
  const byValue = Object.fromEntries(accessfinish.metrics.map((metric) => [metric.value, metric]));
  assert.equal(byValue["15 of 15"].kind, "real-bug");
  assert.equal(byValue["0 of 7"].kind, "real-bug");
  assert.match(byValue["0 of 7"].label, /across 43 attempts/);
  assert.equal(byValue["7 of 7"].kind, "seeded-fault", "a seeded fault never reads like a real bug");
  for (const value of ["15 of 15", "0 of 7", "7 of 7"]) assert.equal(byValue[value].asOf, "24 Oct 2026");
  assert.equal(byValue["2 of 5"].asOf, undefined);
  assert.doesNotMatch(JSON.stringify(en.projects), /0\/43|0 \/ 43/);
  // The caveat keeps both denominators in each language: 0 of 7 runs, across 43 attempts.
  for (const content of [en, ar]) {
    const { caveat } = content.projects.find((project) => project.slug === "accessfinish");
    assert.match(caveat, /(?<!\d)7(?!\d)/, `${content.locale}: the caveat names the 7 runs`);
    assert.match(caveat, /(?<!\d)43(?!\d)/, `${content.locale}: the caveat names the 43 attempts`);
  }
  assert.doesNotMatch(JSON.stringify(en.projects.find((project) => project.slug === "mawrid")), /finalist|winner/i);
});

test("dates and links are only the ones already in the data", () => {
  for (const project of en.projects) {
    for (const metric of project.metrics ?? []) {
      if (metric.asOf) assert.equal(project.slug, "accessfinish", `${project.slug} "${metric.label}" got an as-of date the data doesn't give`);
      if (metric.href) assert.ok([project.repository, project.liveDemo, project.primaryAction?.href].includes(metric.href), `${project.slug} "${metric.label}" links somewhere new`);
    }
  }
  for (const content of [en, ar]) {
    const mashhad = content.projects.find((project) => project.slug === "mashhad");
    assert.equal(mashhad.metrics, undefined, "the 14 stars wait for Sultan's confirmation before they become a figure the agent repeats");
  }
  for (const achievement of en.achievements) assert.equal(achievement.verificationUrl, null, "achievement chips stay unlinked");
});

test("the agent's knowledge carries each checkpoint and caveat", () => {
  const knowledge = buildKnowledge(en, ar);
  assert.match(knowledge.text.en, /Where it stops for a person: step 3 of 3 \(Ranked picks, with reasons\), it asks you first: nothing installs until you say yes/);
  assert.match(knowledge.text.en, /Not yet: 0 of 7 on a real upstream bug across 43 attempts/);
  assert.match(knowledge.text.en, /The line it keeps: No account and no server\./);
  assert.match(knowledge.text.en, /15 of 15 “Booked” pages with the wrong day saved, rejected by the verifier \(as of 24 Oct 2026\)/);
  assert.match(knowledge.text.ar, /أين يتوقف لينتظر إنسانًا: الخطوة 3 من 4 \(مراجعتك\)، يستأذنك أولًا: لا تُفعَّل أي مسودة يكتبها قبل موافقتك/);
  assert.match(knowledge.text.ar, /ما لم يكتمل بعد: المحطة الفعلية لم تُبنَ بعد/);
  assert.match(knowledge.text.ar, /ما لم يكتمل بعد: على خلل حقيقي في المشروع الأصلي، فلم ينجح أيٌّ من 7 تشغيلات، بعد 43 محاولة إجمالًا/);
});

test("the agent's project card never drops a real-bug result to make room", () => {
  for (const content of [en, ar]) {
    for (const project of featured(content)) {
      const card = renderToStaticMarkup(createElement(ProjectCard, { slug: project.slug, locale: content.locale, onShow: () => undefined }));
      for (const metric of (project.metrics ?? []).filter((item) => item.kind === "real-bug")) {
        assert.ok(card.includes(metric.value), `${content.locale} ${project.slug}: "${metric.value}" is missing from the agent's card`);
      }
    }
  }
});
