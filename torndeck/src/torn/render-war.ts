import { escapeXml, formatDuration, svgDataUri } from "../lib/format";
import type { TornWar } from "./api";
import { nowSeconds } from "./clock";

const SIZE = 144;
const CARD_BG = "#1c1e24";
const WIN_BG = "#1f6f3a";
const LOSE_BG = "#8a2b2b";

function compact(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(a / 1_000_000).toFixed(2)}m`;
  if (a >= 10_000) return `${Math.round(a / 1000)}k`;
  if (a >= 1000) return `${(a / 1000).toFixed(1)}k`;
  return String(a);
}

function card(bg: string, body: string): string {
  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${bg}"/>
  ${body}
</svg>`.trim());
}

const text = (y: number, size: number, content: string, fill = "#ffffff", weight = "normal", opacity = 1): string =>
  `<text x="${SIZE / 2}" y="${y}" font-size="${size}" font-family="Arial, sans-serif" font-weight="${weight}" fill="${fill}" opacity="${opacity}" text-anchor="middle">${content}</text>`;

export function renderNoWarSvg(): string {
  return card(CARD_BG, text(70, 20, "No war", "#9a9ca5", "bold") + text(92, 11, "ranked war", "#5b5e68"));
}

/** Ranked-war card: green while we're ahead, red while behind, neutral when level or not started. */
export function renderWarSvg(war: TornWar): string {
  const until = war.start - nowSeconds();
  if (until > 0) {
    return card(CARD_BG, text(40, 12, "War starts in", "#9a9ca5") + text(78, 26, formatDuration(until), "#ffffff", "bold") + text(108, 12, escapeXml(war.enemyName), "#9a9ca5"));
  }

  const bg = war.lead > 0 ? WIN_BG : war.lead < 0 ? LOSE_BG : CARD_BG;
  const sign = war.lead > 0 ? "+" : war.lead < 0 ? "−" : "";
  return card(
    bg,
    text(28, 12, "RANKED WAR", "#ffffff", "bold", 0.7) +
      text(80, war.lead === 0 ? 30 : 32, `${sign}${compact(war.lead)}`, "#ffffff", "bold") +
      text(104, 12, `${compact(war.ours)} vs ${compact(war.theirs)}`, "#ffffff", "normal", 0.85) +
      text(124, 11, war.target ? `Target ${compact(war.target)}` : "", "#ffffff", "normal", 0.6)
  );
}
