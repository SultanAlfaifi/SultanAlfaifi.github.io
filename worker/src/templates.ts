// Branded emails. Every message is a list of blocks rendered twice: as HTML (table layout and inline
// styles, the only things mail apps reliably keep) and as plain text, which Resend sends alongside.
// Anything that came from a visitor or the site's data is escaped here, never upstream. No hidden
// text (no preheader): spam filters weigh hidden content, and a new domain can't afford the doubt.

export type MailLocale = "en" | "ar";

export type Block =
  | { kind: "text"; text: string }
  | { kind: "code"; code: string }
  | { kind: "button"; label: string; href: string }
  | { kind: "facts"; rows: [string, string][] }
  | { kind: "quote"; text: string }
  | { kind: "pre"; title: string; text: string }
  | { kind: "small"; text: string };

export type Mail = { locale: MailLocale; heading: string; blocks: Block[]; footer: string; siteUrl: string };

const INK = "#111816";
const MUTED = "#5c6762";
const PAPER = "#f4f3ec";
const ACCENT = "#0b5c55";
const LINE = "#e3e1d8";
const FONT = "'IBM Plex Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif";

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

// Escapes, keeps line breaks, and makes bare links clickable.
function richText(value: string) {
  return escapeHtml(value)
    .replace(/https?:\/\/[^\s<]+/g, (url) => `<a href="${url}" style="color:${ACCENT};text-decoration:underline">${url}</a>`)
    .replace(/\n/g, "<br>");
}

function blockHtml(block: Block, align: string) {
  switch (block.kind) {
    case "text":
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${INK}">${richText(block.text)}</p>`;
    case "small":
      return `<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:${MUTED}">${richText(block.text)}</p>`;
    case "code":
      return `<p style="margin:8px 0 24px;text-align:center"><span dir="ltr" style="display:inline-block;padding:14px 26px;border-radius:12px;background:${PAPER};border:1px solid ${LINE};font-family:Consolas,'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:${INK}">${escapeHtml(block.code)}</span></p>`;
    case "button":
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:${ACCENT}"><a href="${escapeHtml(block.href)}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">${escapeHtml(block.label)}</a></td></tr></table>`;
    case "facts":
      return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;border-collapse:collapse">${block.rows
        .map(([label, value]) => `<tr><td style="padding:8px 0;border-bottom:1px solid ${LINE};width:34%;font-size:13px;color:${MUTED};vertical-align:top;text-align:${align}">${escapeHtml(label)}</td><td dir="auto" style="padding:8px 0;border-bottom:1px solid ${LINE};font-size:15px;color:${INK};vertical-align:top;text-align:${align}">${richText(value)}</td></tr>`)
        .join("")}</table>`;
    case "quote":
      return `<div dir="auto" style="margin:0 0 20px;padding:14px 18px;border-${align === "right" ? "right" : "left"}:3px solid ${ACCENT};background:${PAPER};border-radius:8px;font-size:15px;line-height:1.7;color:${INK}">${richText(block.text)}</div>`;
    case "pre":
      return `<p style="margin:24px 0 8px;font-size:13px;font-weight:700;color:${MUTED}">${escapeHtml(block.title)}</p><div dir="ltr" style="margin:0 0 8px;padding:16px;border:1px solid ${LINE};border-radius:8px;font-family:Consolas,'Courier New',monospace;font-size:12px;line-height:1.6;color:${INK};text-align:left;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere">${escapeHtml(block.text)}</div>`;
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
    case "pre":
      return `${block.title}\n${block.text}`;
  }
}

export function renderMail(mail: Mail): { html: string; text: string } {
  const rtl = mail.locale === "ar";
  const dir = rtl ? "rtl" : "ltr";
  const align = rtl ? "right" : "left";
  const site = mail.siteUrl.replace(/^https?:\/\//, "");
  const html = `<!doctype html>
<html lang="${mail.locale}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escapeHtml(mail.heading)}</title></head>
<body style="margin:0;padding:0;background:${PAPER}">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${PAPER}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="max-width:600px;font-family:${FONT};text-align:${align}">
<tr><td style="padding:0 4px 16px;font-size:15px;font-weight:700;color:${INK}"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#7de2d1;margin-${rtl ? "left" : "right"}:8px"></span>${rtl ? "سلطان الفيفي" : "Sultan Alfaifi"}</td></tr>
<tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:18px;padding:32px 28px;word-break:break-word;overflow-wrap:anywhere">
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.35;color:${INK}">${escapeHtml(mail.heading)}</h1>
${mail.blocks.map((block) => blockHtml(block, align)).join("\n")}
</td></tr>
<tr><td style="padding:18px 4px 0;font-size:12px;line-height:1.6;color:${MUTED}">${richText(mail.footer)}<br><a href="${escapeHtml(mail.siteUrl)}" style="color:${MUTED};text-decoration:underline">${escapeHtml(site)}</a></td></tr>
</table>
</td></tr></table>
</body>
</html>`;
  const text = [mail.heading, "", ...mail.blocks.map(blockText).flatMap((part) => [part, ""]), "—", mail.footer, mail.siteUrl].join("\n");
  return { html, text };
}
