/**
 * share.ts — Social share URL helpers
 *
 * Ported from an earlier prototype (KrishiAI-3.0). Builds share URLs for
 * common platforms so a farmer can send a diagnosis or soil analysis result
 * to family/neighbors via WhatsApp, Messenger, etc. — no SDK, no app-specific
 * setup, just URL construction (works everywhere, including low-end phones).
 */

export interface ShareOptions {
  title: string;
  text: string;
  url?: string;
}

export const getWhatsAppUrl = (text: string): string => {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

export const getEmailUrl = (subject: string, body: string): string => {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export const getTelegramUrl = (text: string, url?: string): string => {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  return `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
};

export const getXUrl = (text: string, url?: string): string => {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
};

export const getFacebookUrl = (url?: string): string => {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
};

export const getMessengerUrl = (url?: string): string => {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  // FB Send dialog — works for Messenger on desktop and mobile web without
  // requiring a registered Facebook App ID for the basic share flow.
  return `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&redirect_uri=${encodeURIComponent(shareUrl)}`;
};

/**
 * Uses the native Web Share API when available (most mobile browsers,
 * including in-app WebViews) — gives the OS-level share sheet instead of a
 * single-platform URL. Falls back to the caller providing a manual menu
 * built from the URL helpers above when unsupported (older desktop browsers).
 */
export async function shareNative(options: ShareOptions): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    await navigator.share(options);
    return true;
  } catch {
    // AbortError when the user cancels the native share sheet — not a failure.
    return false;
  }
}

export function isNativeShareSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}
