import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function getOrCreateAdminUserId(supabase: SupabaseClient) {
  const explicitId = process.env.SUPABASE_DEFAULT_ADMIN_ID;
  if (explicitId) return explicitId;

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Missing SUPABASE_DEFAULT_ADMIN_ID. Either set SUPABASE_DEFAULT_ADMIN_ID, or provide SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD so the seed can create an admin user.",
    );
  }

  // Try to find an existing user by email.
  const listed = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listed.error) throw new Error(`listUsers failed: ${listed.error.message}`);
  const existing = listed.data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
  if (existing?.id) return existing.id;

  // Create one if missing.
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user?.id) {
    throw new Error(created.error?.message || "createUser failed");
  }
  return created.data.user.id;
}

async function main() {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const adminId = await getOrCreateAdminUserId(supabase);

  // Create a minimal demo page so the admin UI and /pay flow are not empty.
  const slug = process.env.SEED_PAGE_SLUG || "demo";
  const pageInsert = await supabase
    .from("payment_pages")
    .upsert(
      {
        admin_id: adminId,
        slug,
        is_active: true,
        title: "Demo Payment Page",
        subtitle: "Seeded data — safe to delete",
        branding_color: "#0EA5E9",
        amount_mode: "fixed",
        fixed_amount: 25,
        gl_codes: ["1000-200-300", "2000-100-900"],
        email_subject: "Payment Confirmation",
        email_template: "Thanks {{payer_name}} — we received {{amount}}. Transaction: {{transaction_id}}",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    )
    .select("id, slug")
    .single();

  if (pageInsert.error || !pageInsert.data?.id) {
    throw new Error(pageInsert.error?.message || "Failed to upsert payment page");
  }

  const pageId = pageInsert.data.id as string;

  // Seed a couple custom fields to make the form look realistic.
  const fieldsInsert = await supabase.from("custom_fields").upsert(
    [
      {
        page_id: pageId,
        field_name: "Invoice #",
        field_type: "text",
        is_required: true,
        placeholder: "INV-12345",
        helper_text: null,
        display_order: 0,
        options: null,
      },
      {
        page_id: pageId,
        field_name: "Service Date",
        field_type: "date",
        is_required: false,
        placeholder: null,
        helper_text: null,
        display_order: 1,
        options: null,
      },
    ],
    // If your table doesn't have a unique constraint, this will behave like insert.
    // If it does, it keeps the seed idempotent.
    { onConflict: "page_id,field_name" as never },
  );
  if (fieldsInsert.error) {
    // Some schemas won't have the composite unique. Fallback to a best-effort insert.
    const fallback = await supabase.from("custom_fields").insert([
      {
        page_id: pageId,
        field_name: "Invoice #",
        field_type: "text",
        is_required: true,
        placeholder: "INV-12345",
        helper_text: null,
        display_order: 0,
        options: null,
      },
      {
        page_id: pageId,
        field_name: "Service Date",
        field_type: "date",
        is_required: false,
        placeholder: null,
        helper_text: null,
        display_order: 1,
        options: null,
      },
    ]);
    if (fallback.error) throw new Error(fallback.error.message);
  }

  // Optional: seed one transaction row so reports aren’t empty (ignore if schema differs).
  await supabase.from("transactions").insert({
    page_id: pageId,
    amount: 25,
    status: "success",
    payer_name: "Demo Payer",
    payer_email: "demo.payer@example.com",
    payment_method: "card",
    custom_responses: { invoice: "INV-12345" },
    gl_codes: ["1000-200-300"],
    created_at: new Date().toISOString(),
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        seeded: { pageSlug: slug, pageId },
        admin: { id: adminId, fromEnv: Boolean(process.env.SUPABASE_DEFAULT_ADMIN_ID) },
        note: "If you created a new admin user, set SUPABASE_DEFAULT_ADMIN_ID to the printed admin.id for admin page creation APIs.",
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

