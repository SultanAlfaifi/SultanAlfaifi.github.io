// Emails that read like a note from a person: a white page, one column of plain text, at most one
// button, no boxes, cards or tables of data. Heavy layouts look like marketing, and a new domain
// can't afford to. Every message is a list of blocks rendered twice: as HTML (inline styles, the
// only thing mail apps reliably keep) and as plain text, which Resend sends alongside. Anything that
// came from a visitor or the site's data is escaped here, never upstream. No hidden text (no
// preheader): spam filters weigh hidden content.

export type MailLocale = "en" | "ar";

export type Block =
  | { kind: "text"; text: string }
  | { kind: "code"; code: string }
  | { kind: "button"; label: string; href: string }
  | { kind: "facts"; rows: [string, string][] }
  | { kind: "quote"; text: string }
  | { kind: "small"; text: string };

export type Mail = { locale: MailLocale; heading: string; blocks: Block[]; footer: string; siteUrl: string };

const INK = "#111816";
const MUTED = "#5c6762";
const LINE = "#e3e1d8";
const LINK = "#0b5c55";
const FONT = "'IBM Plex Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif";
const BODY = `font-size:15px;line-height:1.7;color:${INK}`;

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

// Escapes, keeps line breaks, and makes bare links clickable.
function richText(value: string) {
  return escapeHtml(value)
    .replace(/https?:\/\/[^\s<]+/g, (url) => `<a href="${url}" style="color:${LINK};text-decoration:underline">${url}</a>`)
    .replace(/\n/g, "<br>");
}

// Whether text reads right to left, judged by its first letter; `fallback` when it has none.
function writtenRtl(value: string, fallback: boolean) {
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (code >= 0x0590 && code <= 0x08ff) return true;
    if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a) || (code >= 0xc0 && code <= 0x24f)) return false;
  }
  return fallback;
}

// `side` is where lines start: right in Arabic, left in English.
function blockHtml(block: Block, side: "right" | "left") {
  switch (block.kind) {
    case "text":
      return `<p style="margin:0 0 16px;${BODY}">${richText(block.text)}</p>`;
    case "small":
      return `<p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:${MUTED}">${richText(block.text)}</p>`;
    case "code":
      return `<p dir="ltr" style="margin:0 0 16px;font-size:28px;line-height:1.3;font-weight:700;letter-spacing:4px;color:${INK};text-align:${side}">${escapeHtml(block.code)}</p>`;
    case "button":
      return `<p style="margin:4px 0 20px"><a href="${escapeHtml(block.href)}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:${INK};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">${escapeHtml(block.label)}</a></p>`;
    case "facts":
      return `<p style="margin:0 0 16px;${BODY}">${block.rows
        .map(([label, value]) => `<span style="color:${MUTED}">${escapeHtml(label)}:</span> <span dir="auto">${richText(value)}</span>`)
        .join("<br>")}</p>`;
    case "quote": {
      // A visitor's own words keep their own direction, with the rule on the side they start from.
      const start = writtenRtl(block.text, side === "right") ? "right" : "left";
      return `<div dir="${start === "right" ? "rtl" : "ltr"}" style="margin:0 0 16px;padding:0 14px;border-${start}:2px solid ${LINE};text-align:${start};${BODY}">${richText(block.text)}</div>`;
    }
  }
}

function blockText(block: Block) {
  switch (block.kind) {
    case "text":
    case "small":
    case "quote":
      return block.text;
    case "code":
      return block.code;
    case "button":
      return `${block.label}: ${block.href}`;
    case "facts":
      return block.rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  }
}

export function renderMail(mail: Mail): { html: string; text: string } {
  const rtl = mail.locale === "ar";
  const dir = rtl ? "rtl" : "ltr";
  const side = rtl ? "right" : "left";
  // The footer names the site once, as a link: inside its own sentence when it mentions it.
  const host = mail.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const siteLink = `<a href="${escapeHtml(mail.siteUrl)}" style="color:${MUTED};text-decoration:underline">${escapeHtml(host)}</a>`;
  const footer = richText(mail.footer);
  const footerHtml = footer.includes(host) ? footer.replace(host, siteLink) : `${footer} · ${siteLink}`;
  const html = `<!doctype html>
<html lang="${mail.locale}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escapeHtml(mail.heading)}</title></head>
<body style="margin:0;padding:0;background:#ffffff">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="max-width:560px"><tr><td style="padding:32px 24px;font-family:${FONT};text-align:${side};word-break:break-word;overflow-wrap:anywhere">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.4;font-weight:700;color:${INK}">${escapeHtml(mail.heading)}</h1>
${mail.blocks.map((block) => blockHtml(block, side)).join("\n")}
<p style="margin:32px 0 0;padding-top:16px;border-top:1px solid ${LINE};font-size:12px;line-height:1.6;color:${MUTED}">${footerHtml}</p>
</td></tr></table>
</td></tr></table>
</body>
</html>`;
  const text = [mail.heading, "", ...mail.blocks.map(blockText).flatMap((part) => [part, ""]), "—", mail.footer, mail.siteUrl].join("\n");
  return { html, text };
}
