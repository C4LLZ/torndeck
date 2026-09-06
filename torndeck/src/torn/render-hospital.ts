import { formatDuration, svgDataUri } from "../lib/format";
import { HOSPITAL_ICON, tornIconSvg } from "./icons";

const SIZE = 144;
const CARD_BG = "#1c1e24";
const HOSPITAL_COLOR = "#f06292";
const MUTED_COLOR = "#5b5e68";

/** Idle card shown when not currently in hospital. */
export function renderHospitalIdleSvg(): string {
  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${CARD_BG}"/>
  ${tornIconSvg(HOSPITAL_ICON, SIZE / 2, SIZE / 2 - 10, 40, MUTED_COLOR)}
  <text x="${SIZE / 2}" y="${SIZE - 20}" font-size="13" font-family="Arial, sans-serif" fill="#9a9ca5" text-anchor="middle">Not in hospital</text>
</svg>`.trim());
}

/** In-hospital card: live countdown until release. `flash=true` for the bright alert frame. */
export function renderHospitalActiveSvg(remainingSeconds: number, flash: boolean): string {
  const bg = flash ? "#ffffff" : CARD_BG;
  const iconColor = flash ? CARD_BG : HOSPITAL_COLOR;
  const textColor = flash ? CARD_BG : "#ffffff";

  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${bg}"/>
  ${tornIconSvg(HOSPITAL_ICON, SIZE / 2, 44, 36, iconColor)}
  <text x="${SIZE / 2}" y="98" font-size="21" font-family="Arial, sans-serif" font-weight="bold" fill="${textColor}" text-anchor="middle">${formatDuration(remainingSeconds)}</text>
  <text x="${SIZE / 2}" y="120" font-size="11" font-family="Arial, sans-serif" fill="${flash ? CARD_BG : "#9a9ca5"}" text-anchor="middle">until release</text>
</svg>`.trim());
}
