/** Formats a duration in seconds as `m:ss`, or `h:mm:ss` once it reaches an hour. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const ss = String(sec).padStart(2, "0");

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  }
  return `${m}:${ss}`;
}

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/** Escapes text before interpolating it into an SVG string. */
export function escapeXml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => XML_ESCAPES[c] ?? c);
}

/**
 * Wraps an SVG string as a base64 data URI for KeyAction.setImage(). A bare `<svg>...</svg>`
 * string is technically documented as accepted too, but in practice Stream Deck's renderer never
 * displayed it (no error either - the key just silently kept its previous/default image). A
 * properly-declared data URI is unambiguous and known to work.
 */
export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
