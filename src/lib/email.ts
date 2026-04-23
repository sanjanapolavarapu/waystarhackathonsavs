import { Resend } from "resend";
import nodemailer from "nodemailer";

type Email = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(msg: Email) {
  // Use Resend if API key is configured
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
    const { data, error } = await resend.emails.send({
      from,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
    });
    if (error) throw new Error(error.message);
    return { messageId: data?.id ?? "", previewUrl: null };
  }

  // Fall back to SMTP if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const from = process.env.EMAIL_FROM ?? "qpp-demo@example.com";
    const info = await transport.sendMail({
      from,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
    });
    const url = nodemailer.getTestMessageUrl(info);
    return { messageId: info.messageId, previewUrl: url ?? null };
  }

  // Dev fallback: Ethereal fake inbox
  const acct = await nodemailer.createTestAccount();
  const transport = nodemailer.createTransport({
    host: acct.smtp.host,
    port: acct.smtp.port,
    secure: acct.smtp.secure,
    auth: { user: acct.user, pass: acct.pass },
  });
  const info = await transport.sendMail({
    from: "qpp-demo@example.com",
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
  });
  const url = nodemailer.getTestMessageUrl(info);
  return { messageId: info.messageId, previewUrl: url ?? null };
}
