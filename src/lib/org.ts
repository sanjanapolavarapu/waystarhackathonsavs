export type Organization = {
  id: string;
  name: string;
};

const STORAGE_KEY = "qpp_selected_org_id";
const DISPLAY_NAME_KEY = "qpp_selected_org_name";

/** Fired on the active tab when the selected org changes (same-tab listeners). */
export const SELECTED_ORG_CHANGED_EVENT = "qpp:selected-org-changed";

export function getSelectedOrgId() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Cached label for the selected org (used when the org list query/embed is slow or RLS-limited). */
export function getSelectedOrgDisplayName() {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(DISPLAY_NAME_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function setSelectedOrgId(orgId: string, displayName?: string) {
  if (typeof window === "undefined") return;
  try {
    if (!orgId) {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(DISPLAY_NAME_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, orgId);
      if (displayName !== undefined) {
        const trimmed = String(displayName).trim();
        if (trimmed) window.localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
        else window.localStorage.removeItem(DISPLAY_NAME_KEY);
      }
    }
    window.dispatchEvent(new Event(SELECTED_ORG_CHANGED_EVENT));
  } catch {
    // ignore
  }
}

