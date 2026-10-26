import type { Env } from "./env";
import { KNOWLEDGE } from "./generated/knowledge";
import { HttpError, cleanLine, cleanText, clientIp, isEmail, readJson } from "./http";
import { enforceLimits } from "./limits";
import { verifyTurnstile } from "./security";

export type Outgoing = { to: string; subject: string; text: string; replyTo?: string };
export type SendResult = { sent: boolean; dryRun?: boolean };

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

// Plain text first; the HTML part is the same text, escaped, with links made clickable.
function toHtml(text: string) {
  const linked = escapeHtml(text).replace(/https?:\/\/[^\s<]+/g, (url) => `<a href="${url}">${url}</a>`);
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.55;color:#111;white-space:pre-wrap">${linked}</div>`;
}

export async function sendEmail(env: Env, message: Outgoing): Promise<SendResult> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email dry run] to=${message.to} reply_to=${message.replyTo ?? "-"} subject=${message.subject}\n${message.text}`);
    return { sent: false, dryRun: true };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: toHtml(message.text),
      ...(message.replyTo ? { reply_to: message.replyTo } : {})
    })
  });
  if (!response.ok) {
    console.error(`Resend ${response.status}: ${(await response.text().catch(() => "")).slice(0, 300)}`);
    throw new HttpError(502, "email_failed");
  }
  return { sent: true };
}

// The console's "Send to Sultan". The recipient is fixed to Sultan's address from the site data;
// the visitor's address only ever becomes the reply-to.
export async function handleEmailSend(request: Request, env: Env) {
  const body = await readJson<Record<string, unknown>>(request);
  const ip = clientIp(request);
  if (!(await verifyTurnstile(env, body.turnstileToken, ip))) throw new HttpError(403, "turnstile_failed");
  const name = cleanLine(body.name, 80);
  const email = cleanLine(body.email, 254);
  const subject = cleanLine(body.subject, 140);
  const message = cleanText(body.message, 4000);
  const topic = cleanLine(body.topic, 20) || "other";
  if (!isEmail(email)) throw new HttpError(400, "invalid_email");
  if (!subject || !message) throw new HttpError(400, "empty_message");
  await enforceLimits(env, "email", ip);
  return sendEmail(env, {
    to: KNOWLEDGE.owner.email,
    replyTo: email,
    subject: `[sultalfaifi.com] ${subject}`,
    text: `${message}\n\n— ${name || "A visitor"} <${email}>\n\nSent from the console on ${env.SITE_URL} (topic: ${topic}). The visitor reviewed this draft and pressed Send. Reply to answer them directly.`
  });
}
