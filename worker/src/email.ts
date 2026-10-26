import type { Env } from "./env";
import { KNOWLEDGE } from "./generated/knowledge";
import { HttpError, cleanLine, cleanText, clientIp, isEmail, readJson } from "./http";
import { enforceLimits } from "./limits";
import { verifyTurnstile } from "./security";
import { renderMail, type Mail, type MailLocale } from "./templates";

// Every message leaves from the site's own domain. Mail to visitors uses EMAIL_FROM; Sultan's own
// notifications use EMAIL_NOTIFY_FROM, so he can filter them. `sender` is the display name, and
// `tag` labels the message in Resend's dashboard.
export type Outgoing = { to: string; subject: string; mail: Mail; channel: "visitor" | "owner"; sender: string; tag: string; replyTo?: string };
export type SendResult = { sent: boolean; dryRun?: boolean };

export const mailLocale = (value: unknown): MailLocale => (value === "ar" ? "ar" : "en");

const TOPICS: Record<string, string> = { role: "وظيفة", project: "مشروع", workshop: "ورشة", question: "سؤال", fit: "مطابقة وظيفة", other: "أخرى" };

const bareAddress = (value: string) => /<([^>]+)>/.exec(value)?.[1] ?? value.trim();

function fromAddress(env: Env, message: Pick<Outgoing, "channel" | "sender">) {
  const address = bareAddress(message.channel === "owner" && env.EMAIL_NOTIFY_FROM ? env.EMAIL_NOTIFY_FROM : env.EMAIL_FROM);
  return `${message.sender} <${address}>`;
}

// Where a visitor's reply goes: EMAIL_REPLY_TO once Sultan's domain forwarding is confirmed, his
// own inbox until then.
export const replyAddress = (env: Env) => (env.EMAIL_REPLY_TO ? bareAddress(env.EMAIL_REPLY_TO) : KNOWLEDGE.owner.email);

export async function sendEmail(env: Env, message: Outgoing): Promise<SendResult> {
  const { html, text } = renderMail(message.mail);
  if (!env.RESEND_API_KEY) {
    console.log(`[email dry run] from=${fromAddress(env, message)} to=${message.to} reply_to=${message.replyTo ?? "-"} subject=${message.subject}\n${text}`);
    return { sent: false, dryRun: true };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromAddress(env, message),
      to: [message.to],
      subject: message.subject,
      html,
      text,
      tags: [{ name: "category", value: message.tag }],
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
  // Sultan reads these in Arabic; the visitor's own words stay exactly as they wrote them.
  return sendEmail(env, {
    to: KNOWLEDGE.owner.email,
    channel: "owner",
    replyTo: email,
    sender: "sultalfaifi.com",
    tag: "contact",
    subject: `رسالة من الموقع · ${subject}`,
    mail: {
      locale: "ar",
      siteUrl: env.SITE_URL,
      preheader: `${name || email}: ${message.slice(0, 90)}`,
      heading: "رسالة جديدة من زائر",
      blocks: [
        { kind: "facts", rows: [["من", name || "زائر"], ["البريد", email], ["الموضوع", subject], ["النوع", TOPICS[topic] ?? TOPICS.other]] },
        { kind: "quote", text: message },
        { kind: "small", text: "راجع الزائر هذه المسودة في المساعد الذكي وضغط «أرسلها لسلطان». اضغط «رد» ويوصله ردّك مباشرة." }
      ],
      footer: "إشعار تلقائي من موقعك."
    }
  });
}
