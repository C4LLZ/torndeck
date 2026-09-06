import { escapeXml, svgDataUri } from "../lib/format";
import type { TornNotifications } from "./api";

const SIZE = 144;
const CARD_BG = "#1c1e24";
const ALERT_COLOR = "#ff3b30";
const MUTED_COLOR = "#5b5e68";

function bellPath(cx: number, cy: number, size: number): string {
  const w = size * 0.62;
  const topY = cy - size * 0.42;
  const bodyBottom = cy + size * 0.18;
  return `M ${cx - w / 2} ${bodyBottom}
          C ${cx - w / 2} ${topY + size * 0.1}, ${cx - w * 0.32} ${topY}, ${cx} ${topY}
          C ${cx + w * 0.32} ${topY}, ${cx + w / 2} ${topY + size * 0.1}, ${cx + w / 2} ${bodyBottom}
          L ${cx + w / 2 + size * 0.06} ${bodyBottom + size * 0.08}
          L ${cx - w / 2 - size * 0.06} ${bodyBottom + size * 0.08} Z`;
}

function bellIcon(cx: number, cy: number, size: number, color: string): string {
  return `
    <path d="${bellPath(cx, cy, size)}" fill="${color}"/>
    <circle cx="${cx}" cy="${cy + size * 0.32}" r="${size * 0.07}" fill="${color}"/>
  `;
}

/**
 * Renders the notification card: a bell plus the total unread count (events + messages + awards +
 * competition) and a short breakdown. `flash=true` gives the bright alternate frame used while
 * blinking whenever there's anything unread.
 */
export function renderNotificationsSvg(n: TornNotifications, flash = false): string {
  const total = n.events + n.messages + n.awards + n.competition;
  const hasAlerts = total > 0;
  const bg = flash ? "#ffffff" : CARD_BG;
  const iconColor = flash ? CARD_BG : hasAlerts ? ALERT_COLOR : MUTED_COLOR;
  const textColor = flash ? CARD_BG : "#ffffff";
  const subColor = flash ? CARD_BG : "#9a9ca5";

  const breakdown = [
    n.events ? `${n.events} event${n.events === 1 ? "" : "s"}` : "",
    n.messages ? `${n.messages} msg${n.messages === 1 ? "" : "s"}` : "",
    n.awards ? `${n.awards} award${n.awards === 1 ? "" : "s"}` : "",
    n.competition ? `${n.competition} comp` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const title = hasAlerts ? `${total}` : "0";
  const subtitle = hasAlerts ? breakdown : "No notifications";

  return svgDataUri(
    `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${bg}"/>
  ${bellIcon(SIZE / 2, 52, 48, iconColor)}
  <text x="${SIZE / 2}" y="98" font-size="26" font-family="Arial, sans-serif" font-weight="bold" fill="${textColor}" text-anchor="middle">${title}</text>
  <text x="${SIZE / 2}" y="122" font-size="10.5" font-family="Arial, sans-serif" fill="${subColor}" text-anchor="middle">${escapeXml(subtitle)}</text>
</svg>`.trim()
  );
}
