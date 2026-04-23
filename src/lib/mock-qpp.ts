import type { PaymentPage, Transaction } from "@/lib/qpp-types";

function isoNowMinusDays(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const MOCK_PAGES: PaymentPage[] = [
  {
    id: "page_telehealth",
    slug: "telehealth-consult",
    isActive: true,
    title: "Telehealth Consultation Fee",
    subtitle: "Secure payment for your virtual healthcare visit",
    brandColor: "#0EA5E9",
    headerMessage: "Thank you for choosing our clinic.",
    footerMessage: "Questions? Call (555) 123-4567",
    amountMode: "FIXED",
    fixedAmountCents: 8900,
    glCodes: ["GL-1001"],
    emailSubjectTemplate: "Payment receipt for {{title}}",
    emailBodyTemplate:
      "Hi {{payer_name}},\n\nThanks for your payment of {{amount}}.\nTransaction: {{transaction_id}}\nDate: {{date}}\n\n— ClearCare Pay",
    fields: [
      {
        id: "f_patient",
        label: "Patient Name",
        type: "TEXT",
        required: true,
        placeholder: "John Doe",
        order: 0,
      },
      {
        id: "f_dob",
        label: "Date of Birth",
        type: "DATE",
        required: true,
        placeholder: "mm/dd/yyyy",
        order: 1,
      },
      {
        id: "f_ins",
        label: "Insurance Provider (Optional)",
        type: "TEXT",
        required: false,
        placeholder: "Blue Cross, Aetna, etc.",
        order: 2,
      },
    ],
    createdAt: isoNowMinusDays(14),
    updatedAt: isoNowMinusDays(1),
  },
  {
    id: "page_donation",
    slug: "donation",
    isActive: true,
    title: "Community Donation",
    subtitle: "Support our outreach programs",
    brandColor: "#10B981",
    headerMessage: "Every contribution helps.",
    footerMessage: "Receipt emailed after payment.",
    amountMode: "USER_ENTERED",
    glCodes: ["GL-2002", "GL-2003"],
    fields: [
      {
        id: "f_name",
        label: "Full Name",
        type: "TEXT",
        required: true,
        placeholder: "Your name",
        order: 0,
      },
      {
        id: "f_email",
        label: "Email",
        type: "TEXT",
        required: true,
        placeholder: "you@example.com",
        helperText: "We’ll email a receipt to this address.",
        order: 1,
      },
      {
        id: "f_updates",
        label: "Subscribe to updates",
        type: "CHECKBOX",
        required: false,
        order: 2,
      },
      {
        id: "f_type",
        label: "Donation Type",
        type: "DROPDOWN",
        required: true,
        options: ["General Fund", "Community Care", "Research"],
        order: 3,
      },
    ],
    createdAt: isoNowMinusDays(30),
    updatedAt: isoNowMinusDays(3),
  },
  {
    id: "page_disabled",
    slug: "parking-fee",
    isActive: false,
    title: "Parking Fee Payment",
    subtitle: "Conveniently pay for parking online",
    brandColor: "#3B82F6",
    amountMode: "RANGE",
    minAmountCents: 500,
    maxAmountCents: 25000,
    glCodes: ["GL-9009"],
    fields: [
      {
        id: "f_plate",
        label: "License Plate",
        type: "TEXT",
        required: true,
        placeholder: "ABC-1234",
        order: 0,
      },
      {
        id: "f_date",
        label: "Date",
        type: "DATE",
        required: true,
        order: 1,
      },
    ],
    createdAt: isoNowMinusDays(45),
    updatedAt: isoNowMinusDays(10),
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_10001",
    pageSlug: "telehealth-consult",
    createdAt: isoNowMinusDays(0),
    status: "success",
    paymentMethod: "card",
    amountCents: 8900,
    payerEmail: "john@example.com",
    glCode: "GL-1001",
  },
  {
    id: "tx_10002",
    pageSlug: "telehealth-consult",
    createdAt: isoNowMinusDays(2),
    status: "failed",
    paymentMethod: "card",
    amountCents: 8900,
    payerEmail: "jane@example.com",
    glCode: "GL-1001",
  },
  {
    id: "tx_20001",
    pageSlug: "donation",
    createdAt: isoNowMinusDays(1),
    status: "success",
    paymentMethod: "wallet",
    amountCents: 2500,
    payerEmail: "alex@example.com",
    glCode: "GL-2002",
  },
  {
    id: "tx_20002",
    pageSlug: "donation",
    createdAt: isoNowMinusDays(8),
    status: "pending",
    paymentMethod: "ach",
    amountCents: 5000,
    payerEmail: "sam@example.com",
    glCode: "GL-2003",
  },
];

export function getPageBySlug(slug: string) {
  return MOCK_PAGES.find((p) => p.slug === slug) ?? null;
}

export function listPages() {
  return [...MOCK_PAGES].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function listTransactions() {
  return [...MOCK_TRANSACTIONS].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

