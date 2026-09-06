import { escapeXml, formatDuration, svgDataUri } from "../lib/format";
import { PLANE_ICON, tornIconSvg } from "./icons";

const SIZE = 144;
const CARD_BG = "#1c1e24";
const SKY_TOP = "#1c2b4a";
const SKY_BOTTOM = "#3a5a8c";
const PLANE_COLOR = "#ffffff";
const LANDED_COLOR = "#4caf50";
const MUTED_COLOR = "#5b5e68";

/** Torn's travel agency destinations. https://wiki.torn.com/wiki/Travel */
const COUNTRY_FLAGS: Record<string, string> = {
  mexico: "🇲🇽",
  "cayman islands": "🇰🇾",
  canada: "🇨🇦",
  hawaii: "🇺🇸",
  "united kingdom": "🇬🇧",
  argentina: "🇦🇷",
  switzerland: "🇨🇭",
  japan: "🇯🇵",
  china: "🇨🇳",
  uae: "🇦🇪",
  "united arab emirates": "🇦🇪",
  "south africa": "🇿🇦",
};

function flagFor(destination: string): string {
  return COUNTRY_FLAGS[destination.trim().toLowerCase()] ?? "";
}

/** A puffy cloud built from overlapping circles, for the in-flight sky background. */
function cloudPuff(cx: number, cy: number, scale: number, opacity: number): string {
  const r = 9 * scale;
  return `<g opacity="${opacity}" fill="#ffffff">
    <ellipse cx="${cx}" cy="${cy + r * 0.4}" rx="${r * 1.7}" ry="${r * 0.55}"/>
    <circle cx="${(cx - r * 1.1).toFixed(1)}" cy="${(cy + r * 0.25).toFixed(1)}" r="${(r * 0.65).toFixed(1)}"/>
    <circle cx="${(cx - r * 0.35).toFixed(1)}" cy="${(cy - r * 0.25).toFixed(1)}" r="${r.toFixed(1)}"/>
    <circle cx="${(cx + r * 0.55).toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.8).toFixed(1)}"/>
    <circle cx="${(cx + r * 1.25).toFixed(1)}" cy="${(cy + r * 0.2).toFixed(1)}" r="${(r * 0.55).toFixed(1)}"/>
  </g>`;
}

/** A fixed scatter of clouds at various depths - static per render, but varied enough to read as sky. */
function cloudScatter(): string {
  const clouds = [
    { cx: 26, cy: 38, scale: 0.85, opacity: 0.28 },
    { cx: 112, cy: 30, scale: 0.7, opacity: 0.22 },
    { cx: 66, cy: 108, scale: 1.05, opacity: 0.3 },
    { cx: 20, cy: 96, scale: 0.6, opacity: 0.2 },
    { cx: 122, cy: 100, scale: 0.75, opacity: 0.24 },
  ];
  return clouds.map((c) => cloudPuff(c.cx, c.cy, c.scale, c.opacity)).join("");
}

/** True once Torn's `destination` field is a real foreign country rather than "Torn" (home). */
export function isAbroad(destination: string): boolean {
  return destination.trim().toLowerCase() !== "torn";
}

/** Idle card shown when the player is grounded at home in Torn City. */
export function renderFlightIdleSvg(): string {
  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${CARD_BG}"/>
  ${tornIconSvg(PLANE_ICON, SIZE / 2, SIZE / 2 - 6, 40, MUTED_COLOR)}
  <text x="${SIZE / 2}" y="${SIZE - 20}" font-size="13" font-family="Arial, sans-serif" fill="#9a9ca5" text-anchor="middle">On the ground</text>
</svg>`.trim());
}

/** Shown when grounded but currently AT a foreign destination (not travelling, not home). */
export function renderFlightAbroadSvg(destination: string): string {
  const flag = flagFor(destination);

  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${CARD_BG}"/>
  ${
    flag
      ? `<text x="${SIZE / 2}" y="80" font-size="48" text-anchor="middle" fill="#ffffff">${flag}</text>`
      : tornIconSvg(PLANE_ICON, SIZE / 2, SIZE / 2 - 6, 40, MUTED_COLOR)
  }
  <text x="${SIZE / 2}" y="${SIZE - 30}" font-size="15" font-family="Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">${escapeXml(destination)}</text>
  <text x="${SIZE / 2}" y="${SIZE - 14}" font-size="11" font-family="Arial, sans-serif" fill="#9a9ca5" text-anchor="middle">Abroad</text>
</svg>`.trim());
}

export interface FlightProgress {
  destination: string;
  departed: number;
  arrival: number;
}

/** In-flight card: the Travel Agency plane moving along a dashed path, with a live countdown. */
export function renderFlightProgressSvg(travel: FlightProgress): string {
  const now = Date.now() / 1000;
  const total = Math.max(1, travel.arrival - travel.departed);
  const progress = Math.min(1, Math.max(0, (now - travel.departed) / total));
  const remaining = Math.max(0, travel.arrival - now);
  const flag = flagFor(travel.destination);

  const pathY = 70;
  const pathX0 = 24;
  const pathX1 = SIZE - 24;
  const planeX = pathX0 + (pathX1 - pathX0) * progress;

  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${SKY_TOP}"/>
      <stop offset="1" stop-color="${SKY_BOTTOM}"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="url(#sky)"/>
  ${cloudScatter()}
  <circle cx="${pathX0}" cy="${pathY}" r="3" fill="#ffffff88"/>
  <circle cx="${pathX1}" cy="${pathY}" r="3" fill="#ffffff88"/>
  ${tornIconSvg(PLANE_ICON, planeX, pathY, 38, PLANE_COLOR)}
  <text x="${SIZE / 2}" y="${SIZE - 34}" font-size="20" font-family="Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">${formatDuration(remaining)}</text>
  <text x="${SIZE / 2}" y="${SIZE - 14}" font-size="12" font-family="Arial, sans-serif" fill="#dbe4f5" text-anchor="middle">${flag ? `${flag} ` : ""}${escapeXml(travel.destination)}</text>
</svg>`.trim());
}

/** Landed card; pass `flash=true` for the bright alternate frame used while blinking. */
export function renderFlightLandedSvg(destination: string, flash: boolean): string {
  const bg = flash ? "#ffffff" : CARD_BG;
  const fg = flash ? CARD_BG : LANDED_COLOR;
  const text = flash ? CARD_BG : "#ffffff";
  const flag = flagFor(destination);

  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${bg}"/>
  ${tornIconSvg(PLANE_ICON, SIZE / 2, 54, 36, fg)}
  <text x="${SIZE / 2}" y="98" font-size="17" font-family="Arial, sans-serif" font-weight="bold" fill="${text}" text-anchor="middle">Landed!</text>
  <text x="${SIZE / 2}" y="118" font-size="12" font-family="Arial, sans-serif" fill="${text}" text-anchor="middle" opacity="0.85">${flag ? `${flag} ` : ""}${escapeXml(destination)}</text>
</svg>`.trim());
}
