export type Organization = {
  id: string;
  name: string;
};

const STORAGE_KEY = "qpp_selected_org_id";

export function getSelectedOrgId() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSelectedOrgId(orgId: string) {
  if (typeof window === "undefined") return;
  try {
    if (!orgId) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, orgId);
  } catch {
    // ignore
  }
}

