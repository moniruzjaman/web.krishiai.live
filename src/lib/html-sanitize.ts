/**
 * html-sanitize.ts — HTML escaping helpers for raw-HTML sinks
 *
 * Leaflet's `bindPopup`, `divIcon` and control `innerHTML` all accept raw
 * HTML strings. Any value interpolated into those templates (institution
 * names, coordinates, NDVI values) is an XSS sink if it ever comes from
 * user-controllable data. Escape every dynamic value before interpolation.
 */

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

/** Escape a value for safe interpolation into an HTML text node or attribute. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"'`]/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

/** Escape a value for safe interpolation inside a JS template used as HTML. */
export function escapeHtmlNumber(value: number): string {
  return Number.isFinite(value) ? String(value) : "0";
}
