import { escapeXml, formatDuration, svgDataUri } from "../lib/format";
import { HOSPITAL_ICON, tornIconSvg } from "./icons";
import { flagFor } from "./render-flight";

const SIZE = 144;
const CARD_BG = "#1c1e24";
const OKAY_COLOR = "#4caf50";
const JAIL_COLOR = "#ffb74d";
const HOSPITAL_COLOR = "#f06292";
const MUTED_COLOR = "#9a9ca5";

export type TimerKind = "hospital" | "jail";

/** Cell-bars glyph for jail (Torn has no sidebar icon for it). */
function jailIcon(cx: number, cy: number, size: number, color: string): string {
  const s = size / 2;
  const bars = [-0.6, -0.2, 0.2, 0.6]
    .map((f) => `<line x1="${cx + f * s}" y1="${cy - s}" x2="${cx + f * s}" y2="${cy + s}"/>`)
    .join("");
  return `<g stroke="${color}" stroke-width="${size * 0.09}" stroke-linecap="round" fill="none"><rect x="${cx - s}" y="${cy - s}" width="${size}" height="${size}" rx="${size * 0.12}"/>${bars}</g>`;
}

/** Hospital/jail countdown. When hospitalised abroad, `country` adds a faded flag behind the time and names it below. */
export function renderTimerSvg(kind: TimerKind, remaining: number, flash: boolean, country?: string): string {
  const bg = flash ? "#ffffff" : CARD_BG;
  const color = flash ? CARD_BG : kind === "hospital" ? HOSPITAL_COLOR : JAIL_COLOR;
  const flag = country ? flagFor(country) : "";
  const label = country ? `${flag ? `${flag} ` : ""}${escapeXml(country)}` : kind === "hospital" ? "until release" : "in jail";
  const icon = kind === "hospital" ? tornIconSvg(HOSPITAL_ICON, SIZE / 2, 44, 36, color) : jailIcon(SIZE / 2, 44, 32, color);

  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${bg}"/>
  ${flag ? `<text x="${SIZE / 2}" y="112" font-size="110" text-anchor="middle" opacity="0.16">${flag}</text>` : ""}
  ${icon}
  <text x="${SIZE / 2}" y="98" font-size="21" font-family="Arial, sans-serif" font-weight="bold" fill="${flash ? CARD_BG : "#ffffff"}" text-anchor="middle">${formatDuration(remaining)}</text>
  <text x="${SIZE / 2}" y="120" font-size="11" font-family="Arial, sans-serif" fill="${flash ? CARD_BG : MUTED_COLOR}" text-anchor="middle">${label}</text>
</svg>`.trim());
}

/** Plain status card (Okay, Fallen, anything else Torn may report). */
export function renderStatusStaticSvg(state: string): string {
  const okay = state === "Okay";
  const color = okay ? OKAY_COLOR : state === "Fallen" ? "#ef5350" : MUTED_COLOR;
  const mid = SIZE / 2;
  const glyph = okay
    ? `<circle cx="${mid}" cy="54" r="22" fill="none" stroke="${color}" stroke-width="4"/><path d="M${mid - 10} 55l7 7 13-15" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<circle cx="${mid}" cy="54" r="22" fill="none" stroke="${color}" stroke-width="4"/><path d="M${mid} 42v15M${mid} 64v.5" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/>`;

  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${CARD_BG}"/>
  ${glyph}
  <text x="${mid}" y="112" font-size="19" font-family="Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">${escapeXml(state)}</text>
</svg>`.trim());
}
