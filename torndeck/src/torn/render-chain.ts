import { formatDuration, svgDataUri } from "../lib/format";
import { chainIconSvg } from "./icons";

const SIZE = 144;
const CARD_BG = "#1c1e24";
const CHAIN_COLOR = "#ff9800";
const MUTED_COLOR = "#5b5e68";

/** Idle card shown when there's no active chain. */
export function renderChainIdleSvg(): string {
  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${CARD_BG}"/>
  ${chainIconSvg(SIZE / 2, SIZE / 2 - 10, 50, MUTED_COLOR)}
  <text x="${SIZE / 2}" y="${SIZE - 20}" font-size="13" font-family="Arial, sans-serif" fill="#9a9ca5" text-anchor="middle">No active chain</text>
</svg>`.trim());
}

/** Active chain card: current hit count + live countdown until it drops. `flash=true` for the bright alert frame. */
export function renderChainActiveSvg(current: number, remainingSeconds: number, flash: boolean): string {
  const bg = flash ? "#ffffff" : CARD_BG;
  const iconColor = flash ? CARD_BG : CHAIN_COLOR;
  const textColor = flash ? CARD_BG : "#ffffff";

  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${bg}"/>
  ${chainIconSvg(SIZE / 2, 40, 36, iconColor)}
  <text x="${SIZE / 2}" y="88" font-size="30" font-family="Arial, sans-serif" font-weight="bold" fill="${textColor}" text-anchor="middle">${current}</text>
  <text x="${SIZE / 2}" y="112" font-size="16" font-family="Arial, sans-serif" font-weight="bold" fill="${textColor}" text-anchor="middle" opacity="0.9">${formatDuration(remainingSeconds)}</text>
  <text x="${SIZE / 2}" y="130" font-size="10" font-family="Arial, sans-serif" fill="${flash ? CARD_BG : "#9a9ca5"}" text-anchor="middle">until drop</text>
</svg>`.trim());
}
