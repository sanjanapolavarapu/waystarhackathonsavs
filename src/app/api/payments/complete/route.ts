import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  DEFAULT_EMAIL_SUBJECT,
  DEFAULT_EMAIL_TEMPLATE,
  parseEmailTemplate,
} from "@/lib/email-template";
import { sendEmail } from "@/lib/email";
import { isValidGlCode, validateGlCodes } from "@/lib/gl-code";
import { getPageBySlug } from "@/lib/mock-qpp";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const requestSchema = z.object({
  pageSlug: z.string().min(1),
  amount: z.number().positive(),
  payerName: z.string().min(1),
  payerEmail: z.string().email(),
  paymentMethod: z.enum(["card", "wallet", "ach"]).default("card"),
  customResponses: z.record(z.string(), z.string()).default({}),
});

type PageConfig = {
  id?: string;
  title: string;
  glCodes: string[];
  emailSubject: string;
  emailTemplate: string;
};

async function getPageConfig(pageSlug: string): Promise<PageConfig | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const result = await supabase
      .from("payment_pages")
      .select("id, title, gl_codes, email_subject, email_template, gl_code")
      .eq("slug", pageSlug)
      .maybeSingle();

    if (result.data) {
      const glCodesFromArray = Array.isArray(result.data.gl_codes) ? result.data.gl_codes : [];
      const legacyGlCode = typeof result.data.gl_code === "string" ? result.data.gl_code : "";

      return {
        id: result.data.id ?? undefined,
        title: result.data.title ?? "Payment Page",
        glCodes: glCodesFromArray.length > 0 ? glCodesFromArray : legacyGlCode ? [legacyGlCode] : [],
        emailSubject: result.data.email_subject || DEFAULT_EMAIL_SUBJECT,
        emailTemplate: result.data.email_template || DEFAULT_EMAIL_TEMPLATE,
      };
    }
  }

  const mock = getPageBySlug(pageSlug);
  if (!mock) return null;
  return {
    title: mock.title,
    glCodes: mock.glCodes,
    emailSubject: mock.emailSubjectTemplate || DEFAULT_EMAIL_SUBJECT,
    emailTemplate: mock.emailBodyTemplate || DEFAULT_EMAIL_TEMPLATE,
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const payload = parsed.data;
  const pageConfig = await getPageConfig(payload.pageSlug);
  if (!pageConfig) {
    return NextResponse.json({ ok: false, error: "page_not_found" }, { status: 404 });
  }

  const glValidation = validateGlCodes(pageConfig.glCodes);
  if (!glValidation.valid) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_gl_codes",
        details: `Invalid GL codes: ${glValidation.invalid.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const transactionId = randomUUID();
  const now = new Date();
  const amountText = payload.amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
  const normalizedCustomFields = Object.fromEntries(
    Object.entries(payload.customResponses).map(([k, v]) => [
      k.toLowerCase().trim().replaceAll(/\s+/g, "_"),
      v,
    ]),
  );

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const transactionRecord = {
      id: transactionId,
      page_id: pageConfig.id ?? null,
      amount: payload.amount,
      status: "success",
      payer_name: payload.payerName,
      payer_email: payload.payerEmail,
      payment_method: payload.paymentMethod,
      custom_responses: payload.customResponses,
      gl_codes: pageConfig.glCodes,
      created_at: now.toISOString(),
    };
    const { error } = await supabase.from("transactions").insert(transactionRecord);
    if (error) {
      return NextResponse.json(
        { ok: false, error: "transaction_insert_failed", details: error.message },
        { status: 500 },
      );
    }
  }

  const subject = pageConfig.emailSubject || DEFAULT_EMAIL_SUBJECT;
  const parsedBody = parseEmailTemplate(pageConfig.emailTemplate || DEFAULT_EMAIL_TEMPLATE, {
    payer_name: payload.payerName,
    amount: amountText,
    transaction_id: transactionId,
    date: now.toLocaleDateString(),
    title: pageConfig.title,
    custom_fields: normalizedCustomFields,
  });

  const emailResult = await sendEmail({
    to: payload.payerEmail,
    subject,
    html: parsedBody.replaceAll("\n", "<br />"),
  }).catch((error) => ({ error: error instanceof Error ? error.message : "email_failed" }));

  if ("error" in emailResult) {
    return NextResponse.json(
      {
        ok: false,
        error: "email_send_failed",
        transactionId,
        details: emailResult.error,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    transactionId,
    emailPreviewUrl: emailResult.previewUrl,
    glCodes: pageConfig.glCodes.filter((code) => isValidGlCode(code)),
  });
}
