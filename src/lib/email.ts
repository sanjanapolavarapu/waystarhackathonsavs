import nodemailer from "nodemailer";

type Email = {
  to: string;
  subject: string;
  html: string;
};

let cachedTransport: nodemailer.Transporter | null = null;

async function getTransport() {
  if (cachedTransport) return cachedTransport;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    cachedTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return cachedTransport;
  }

  // Dev fallback: Ethereal test inbox
  const acct = await nodemailer.createTestAccount();
  cachedTransport = nodemailer.createTransport({
    host: acct.smtp.host,
    port: acct.smtp.port,
    secure: acct.smtp.secure,
    auth: { user: acct.user, pass: acct.pass },
  });
  return cachedTransport;
}

export async function sendEmail(msg: Email) {
  const transport = await getTransport();
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

