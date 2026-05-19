import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isValidGlCode, validateGlCodes } from "@/lib/gl-code";
import { getPageBySlug } from "@/lib/mock-qpp";
import { sendPaymentReceipt } from "@/lib/send-payment-receipt";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const requestSchema = z.object({
  pageSlug: z.string().min(1),
  amount: z.number().positive(),
  payerName: z.string().min(1),
  payerEmail: z.string().email(),
  paymentMethod: z.enum(["card", "wallet", "ach"]).default("card"),
  customResponses: z.record(z.string(), z.string()).default({}),
  paymentIntentId: z.string().optional(),
});

type PageConfig = {
  id?: string;
  glCodes: string[];
};

async function getPageGlConfig(pageSlug: string): Promise<PageConfig | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const result = await supabase
      .from("payment_pages")
      .select("id, gl_codes, gl_code")
      .eq("slug", pageSlug)
      .maybeSingle();

    if (result.data) {
      const glCodesFromArray = Array.isArray(result.data.gl_codes) ? result.data.gl_codes : [];
      const legacyGlCode = typeof result.data.gl_code === "string" ? result.data.gl_code : "";

      return {
        id: result.data.id ?? undefined,
        glCodes: glCodesFromArray.length > 0 ? glCodesFromArray : legacyGlCode ? [legacyGlCode] : [],
      };
    }
  }

  const mock = getPageBySlug(pageSlug);
  if (!mock) return null;
  return { glCodes: mock.glCodes };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const payload = parsed.data;
  const pageConfig = await getPageGlConfig(payload.pageSlug);
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
      ...(payload.paymentIntentId
        ? { stripe_payment_intent_id: payload.paymentIntentId }
        : {}),
    };
    const { error } = await supabase.from("transactions").insert(transactionRecord);
    if (error) {
      return NextResponse.json(
        { ok: false, error: "transaction_insert_failed", details: error.message },
        { status: 500 },
      );
    }
  }

  const emailResult = await sendPaymentReceipt({
    pageSlug: payload.pageSlug,
    amountDollars: payload.amount,
    payerName: payload.payerName,
    payerEmail: payload.payerEmail,
    paymentMethod: payload.paymentMethod,
    customResponses: payload.customResponses,
    transactionId,
    paymentIntentId: payload.paymentIntentId,
  });

  if (!emailResult.ok) {
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
    transactionId: emailResult.transactionId,
    emailPreviewUrl: emailResult.emailPreviewUrl,
    receiptAlreadySent: emailResult.alreadySent ?? false,
    glCodes: pageConfig.glCodes.filter((code) => isValidGlCode(code)),
  });
}
