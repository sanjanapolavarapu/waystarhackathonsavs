export type EmailTemplateData = {
  payer_name: string;
  amount: string;
  transaction_id: string;
  date: string;
  title: string;
  custom_fields?: Record<string, string>;
};

export const DEFAULT_EMAIL_SUBJECT = "Payment Confirmation";
export const DEFAULT_EMAIL_TEMPLATE =
  "Thank you {{payer_name}} for your payment of {{amount}}. Transaction ID: {{transaction_id}} on {{date}}.";

function normalizeToken(input: string) {
  return input.toLowerCase().trim().replaceAll(/\s+/g, "_");
}

export function parseEmailTemplate(template: string, data: EmailTemplateData) {
  const source = template.trim() || DEFAULT_EMAIL_TEMPLATE;
  return source.replaceAll(/\{\{\s*([^}]+?)\s*\}\}/g, (_, token: string) => {
    const normalized = normalizeToken(token);

    if (normalized in data) {
      return String(data[normalized as keyof EmailTemplateData] ?? "");
    }
    if (data.custom_fields && normalized in data.custom_fields) {
      return data.custom_fields[normalized] ?? "";
    }

    return "";
  });
}
