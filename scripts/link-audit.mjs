import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../data/portfolio.ts", import.meta.url),
  "utf8"
);
const urls = [
  ...new Set(source.match(/https:\/\/[^"'\s]+/g) ?? [])
].sort();

const checkUrl = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SultanAlfaifiPortfolioLinkAudit/1.0)"
      },
      redirect: "follow",
      signal: controller.signal
    });

    return {
      url,
      status: response.status,
      ok: response.status >= 200 && response.status < 400
    };
  } catch (error) {
    return {
      url,
      status: error.name === "AbortError" ? "timeout" : "network-error",
      ok: false
    };
  } finally {
    clearTimeout(timeout);
  }
};

const results = await Promise.all(
  urls
    .filter((url) => !url.includes("example.com"))
    .map((url) => checkUrl(url))
);

for (const result of results) {
  console.log(`${result.ok ? "PASS" : "REVIEW"} ${result.status} ${result.url}`);
}

const failed = results.filter((result) => !result.ok);
console.log(
  `External link audit: ${results.length - failed.length}/${results.length} reachable.`
);

if (failed.length > 0) {
  console.log(
    "Some official sites block automated requests or require manual verification."
  );
  process.exitCode = 2;
}
