export async function copyTextToClipboard(text: string) {
  // Modern API (requires secure context + permissions in some browsers)
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { ok: true as const };
    }
  } catch {
    // fall through to legacy method
  }

  // Legacy fallback (works in more environments)
  try {
    if (typeof document === "undefined") return { ok: false as const };
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.top = "-1000px";
    el.style.left = "-1000px";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return { ok: ok as boolean };
  } catch {
    return { ok: false as const };
  }
}

