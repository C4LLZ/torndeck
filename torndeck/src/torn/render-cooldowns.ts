import { formatDuration, svgDataUri } from "../lib/format";
import { boosterIconSvg, drugIconSvg, HOSPITAL_ICON, tornIconSvg } from "./icons";
import type { TornCooldownType } from "./api";

const SIZE = 144;
const CARD_BG = "#1c1e24";
const READY_COLOR = "#4caf50";

const COOLDOWN_DEFS: Record<TornCooldownType, { label: string; color: string; icon: (cx: number, cy: number, size: number, color: string) => string }> = {
  drug: { label: "Drug", color: "#4fc3f7", icon: drugIconSvg },
  booster: { label: "Booster", color: "#e91e63", icon: boosterIconSvg },
  medical: { label: "Medical", color: "#f06292", icon: (cx, cy, size, color) => tornIconSvg(HOSPITAL_ICON, cx, cy, size, color) },
};

export type CombinedRowKey = TornCooldownType | "hospital";

const HOSPITAL_ROW = { label: "Hospital", color: "#ff5252", icon: COOLDOWN_DEFS.medical.icon };

/** One key showing the chosen rows (drug/booster/medical cooldowns, hospital) as colour-coded lines; finished rows turn green. */
export function renderAllCooldownsSvg(rows: { key: CombinedRowKey; remaining: number }[], flash: boolean): string {
  const bg = flash ? "#ffffff" : CARD_BG;
  const n = Math.max(1, rows.length);
  const gap = 4;
  const rowH = (SIZE - 16 - gap * (n - 1)) / n;
  const fontSize = Math.min(19, Math.round(rowH * 0.5));
  const iconSize = Math.min(22, Math.round(rowH * 0.6));
  const body = rows
    .map(({ key, remaining }, i) => {
      const def = key === "hospital" ? HOSPITAL_ROW : COOLDOWN_DEFS[key];
      const ready = remaining <= 0;
      const y = 8 + i * (rowH + gap);
      const color = flash ? CARD_BG : ready ? READY_COLOR : def.color;
      return `
  <rect x="8" y="${y}" width="128" height="${rowH}" rx="10" fill="${flash ? "#00000014" : "#2a2d35"}"/>
  <rect x="8" y="${y + rowH * 0.15}" width="4" height="${rowH * 0.7}" rx="2" fill="${color}"/>
  ${def.icon(30, y + rowH / 2, iconSize, color)}
  <text x="128" y="${y + rowH / 2 + fontSize * 0.36}" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold" fill="${flash ? CARD_BG : ready ? READY_COLOR : "#ffffff"}" text-anchor="end">${ready ? (key === "hospital" ? "Free" : "Ready") : formatDuration(remaining)}</text>`;
    })
    .join("");

  return svgDataUri(
    `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${bg}"/>${body}
</svg>`.trim()
  );
}

/** Counting-down card, or the "Ready!" alert frame once it hits zero. `flash=true` for the bright blink frame. */
export function renderCooldownSvg(type: TornCooldownType, remainingSeconds: number, flash: boolean): string {
  const def = COOLDOWN_DEFS[type];
  const ready = remainingSeconds <= 0;
  const bg = flash ? "#ffffff" : CARD_BG;
  const iconColor = flash ? CARD_BG : ready ? READY_COLOR : def.color;
  const textColor = flash ? CARD_BG : "#ffffff";
  const subColor = flash ? CARD_BG : "#9a9ca5";

  return svgDataUri(
    `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${bg}"/>
  ${def.icon(SIZE / 2, 44, 34, iconColor)}
  <text x="${SIZE / 2}" y="98" font-size="${ready ? 20 : 21}" font-family="Arial, sans-serif" font-weight="bold" fill="${textColor}" text-anchor="middle">${ready ? "Ready!" : formatDuration(remainingSeconds)}</text>
  <text x="${SIZE / 2}" y="120" font-size="11" font-family="Arial, sans-serif" fill="${subColor}" text-anchor="middle">${def.label}</text>
</svg>`.trim()
  );
}
