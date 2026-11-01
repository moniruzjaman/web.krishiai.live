/**
 * safe-url.ts — URL scheme validation to prevent javascript:/data: injection
 *
 * News items come from third-party RSS/HTML feeds; their `link` fields are
 * rendered as <a href> in the client. A malicious feed could publish a
 * `javascript:` URI that executes when tapped. Validate every external link
 * server-side before returning it from the API, and defensively again on the
 * client.
 */

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/** Returns true only for http(s)/mailto URLs; rejects javascript:, data:, vbscript:, etc. */
export function isSafeExternalUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const url = new URL(raw.trim());
    return SAFE_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

/** Returns the URL if safe, otherwise an empty string (callers should drop/hide the link). */
export function sanitizeLink(raw: string | null | undefined): string {
  return isSafeExternalUrl(raw) ? String(raw).trim() : "";
}
