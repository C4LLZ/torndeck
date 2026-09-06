import { svgDataUri } from "../lib/format";
import { CRIMES_ICON, GYM_ICON, tornIconSvg, TornIcon } from "./icons";
import type { TornRefillType } from "./api";

const SIZE = 144;
const CARD_BG = "#1c1e24";
const MUTED_COLOR = "#5b5e68";

const REFILL_DEFS: Record<TornRefillType, { label: string; color: string; icon: TornIcon }> = {
  energy: { label: "Energy Refill", color: "#8bc34a", icon: GYM_ICON },
  nerve: { label: "Nerve Refill", color: "#ff9800", icon: CRIMES_ICON },
};

/** Daily refill status card. `flash=true` for the bright alert frame used while blinking (shown only when not yet used). */
export function renderRefillSvg(type: TornRefillType, used: boolean, flash: boolean): string {
  const def = REFILL_DEFS[type];
  const bg = flash ? "#ffffff" : CARD_BG;
  const iconColor = flash ? CARD_BG : used ? MUTED_COLOR : def.color;
  const textColor = flash ? CARD_BG : "#ffffff";
  const subColor = flash ? CARD_BG : "#9a9ca5";

  return svgDataUri(
    `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${bg}"/>
  ${tornIconSvg(def.icon, SIZE / 2, 44, 36, iconColor)}
  <text x="${SIZE / 2}" y="96" font-size="19" font-family="Arial, sans-serif" font-weight="bold" fill="${textColor}" text-anchor="middle">${used ? "Used today" : "Available!"}</text>
  <text x="${SIZE / 2}" y="118" font-size="11" font-family="Arial, sans-serif" fill="${subColor}" text-anchor="middle">${def.label}</text>
</svg>`.trim()
  );
}
