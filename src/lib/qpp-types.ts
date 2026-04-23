export type AmountMode = "FIXED" | "RANGE" | "USER_ENTERED";

export type CustomFieldType = "TEXT" | "NUMBER" | "DROPDOWN" | "DATE" | "CHECKBOX";

export type CustomField = {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  placeholder?: string;
  helperText?: string;
  options?: string[]; // dropdown only
  order: number;
};

export type PaymentPage = {
  id: string;
  slug: string;
  isActive: boolean;
  /** Present when the row is loaded from Supabase (used for analytics / org scoping). */
  organizationId?: string | null;

  title: string;
  subtitle?: string;
  brandColor: string;
  logoUrl?: string;
  headerMessage?: string;
  footerMessage?: string;

  amountMode: AmountMode;
  fixedAmountCents?: number;
  minAmountCents?: number;
  maxAmountCents?: number;

  glCodes: string[];

  emailSubjectTemplate?: string;
  emailBodyTemplate?: string;

  fields: CustomField[];
  updatedAt: string;
  createdAt: string;
};

export type TransactionStatus = "success" | "failed" | "pending";
export type PaymentMethod = "card" | "wallet" | "ach";

export type Transaction = {
  id: string;
  pageSlug: string;
  createdAt: string;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  amountCents: number;
  payerEmail?: string;
  glCode?: string;
};

