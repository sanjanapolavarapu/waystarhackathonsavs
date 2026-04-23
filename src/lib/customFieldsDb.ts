import type { CustomField, CustomFieldType } from "@/lib/qpp-types";

type AnyRow = Record<string, unknown>;

function asString(v: unknown) {
  return typeof v === "string" ? v : null;
}

function toUiType(db: string): CustomFieldType {
  switch (db) {
    case "text":
      return "TEXT";
    case "number":
      return "NUMBER";
    case "dropdown":
      return "DROPDOWN";
    case "date":
      return "DATE";
    case "checkbox":
      return "CHECKBOX";
    default:
      return "TEXT";
  }
}

function toDbType(ui: CustomFieldType) {
  switch (ui) {
    case "TEXT":
      return "text";
    case "NUMBER":
      return "number";
    case "DROPDOWN":
      return "dropdown";
    case "DATE":
      return "date";
    case "CHECKBOX":
      return "checkbox";
    default:
      return "text";
  }
}

export function fromCustomFieldRow(row: AnyRow): CustomField | null {
  const id = asString(row.id);
  const fieldName = asString(row.field_name);
  const fieldType = asString(row.field_type);
  if (!id || !fieldName || !fieldType) return null;

  const required = Boolean(row.is_required ?? false);
  const placeholder = asString(row.placeholder) ?? undefined;
  const helperText = asString(row.helper_text) ?? undefined;
  const order = typeof row.display_order === "number" ? row.display_order : 0;

  let options: string[] | undefined;
  if (row.options && typeof row.options === "object") {
    const arr = (row.options as { options?: unknown }).options;
    if (Array.isArray(arr)) options = arr.map(String);
  } else if (Array.isArray(row.options)) {
    options = (row.options as unknown[]).map(String);
  }

  return {
    id,
    label: fieldName,
    type: toUiType(fieldType),
    required,
    placeholder,
    helperText,
    options,
    order,
  };
}

export function toCustomFieldRow(field: CustomField, pageId: string) {
  return {
    page_id: pageId,
    field_name: field.label,
    field_type: toDbType(field.type),
    is_required: field.required,
    placeholder: field.placeholder ?? null,
    helper_text: field.helperText ?? null,
    display_order: field.order ?? 0,
    options: field.options ? { options: field.options } : null,
  };
}

