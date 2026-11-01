import assert from "node:assert/strict";
import test from "node:test";

const { AI_APPS, intentFrom, introPrompt, parseCard, timeGreeting } = await import("../lib/intro.ts");

test("both prompts ask the visitor's AI for the same card, in a code block, from memory only", () => {
  const ar = introPrompt("ar");
  const en = introPrompt("en");
  for (const label of ["الاسم:", "المخاطبة:", "المجال:", "جهة العمل:", "أشتغل على:", "اهتماماتي:", "أدور على:", "لغتي:"]) assert.ok(ar.includes(label), label);
  for (const label of ["Name:", "Address me as:", "Field:", "Works at:", "Working on:", "Interests:", "Looking for:", "Language:"]) assert.ok(en.includes(label), label);
  assert.match(ar, /code block/);
  assert.match(en, /code block/);
  // No guessing, and nothing private.
  assert.match(ar, /لا تخمّن ولا تخترع/);
  assert.match(ar, /لا عمر ولا صحة ولا عائلة ولا دين ولا سياسة ولا مكان سكن/);
  assert.match(en, /Don't guess or invent/);
  assert.match(en, /no age, health, family, religion, politics, home location/);
});

test("ChatGPT and Claude open with the prompt in the link; Gemini opens plain, and the prompt is copied for it", () => {
  const prompt = introPrompt("ar");
  const links = Object.fromEntries(AI_APPS.map((app) => [app.id, app.href(prompt)]));
  assert.ok(links.chatgpt.startsWith("https://chatgpt.com/?q="));
  assert.ok(links.claude.startsWith("https://claude.ai/new?q="));
  assert.equal(decodeURIComponent(links.chatgpt.split("?q=")[1]), prompt);
  assert.equal(links.gemini, "https://gemini.google.com/app");
  // Long Arabic links get refused by some servers; the encoded prompt stays well under 8 KB.
  assert.ok(links.claude.length < 8000, `${links.claude.length} characters`);
});

test("the card is read line by line, through the markdown the apps add around it", () => {
  const arabic = parseCard("```\n**الاسم:** نورة\n- المخاطبة: مؤنث\nالمجال: مهندسة تعلم آلة\nجهة العمل: stc\nأشتغل على: منصة لتوليد الروايات بالعربي\nاهتماماتي: معالجة اللغة، السرد، المنتجات\nأدور على: شريك لمشروع\nلغتي: عربي\n```");
  assert.equal(arabic.name, "نورة");
  assert.equal(arabic.address, "feminine");
  assert.equal(arabic.field, "مهندسة تعلم آلة");
  assert.equal(arabic.organization, "stc");
  assert.equal(arabic.intent, "collaborate");
  assert.equal(arabic.source, "card");

  const english = parseCard("Name: Omar Khalid\nAddress me as: unknown\nField: Talent partner\nWorks at: Salla\nWorking on: unknown\nLooking for: an engineer for my team");
  assert.equal(english.name, "Omar", "first name only");
  assert.equal(english.address, "unknown");
  assert.equal(english.workingOn, "", "unknown lines stay empty");
  assert.equal(english.intent, "hiring");
});

test("students and freelancers have no organization, and anything that isn't the card is refused", () => {
  assert.equal(parseCard("الاسم: سارة\nجهة العمل: طالبة\nأدور على: أفكار وتعلّم").organization, "");
  assert.equal(parseCard("hello there, how are you today?"), null);
  assert.equal(parseCard("Name: Sam"), null, "one line is not a card");
});

test("why they came maps onto the site's three arrangements", () => {
  assert.equal(intentFrom("موظف لفريقي"), "hiring");
  assert.equal(intentFrom("شريك لمشروع"), "collaborate");
  assert.equal(intentFrom("فرصة عمل لي"), "browse");
  assert.equal(intentFrom("just browsing"), "browse");
});

test("the greeting follows the visitor's own clock", () => {
  assert.equal(timeGreeting("ar", 9), "صباح الخير");
  assert.equal(timeGreeting("ar", 21), "مساء الخير");
  assert.equal(timeGreeting("en", 14), "Good afternoon");
  assert.equal(timeGreeting("en", 2), "Good evening");
});
