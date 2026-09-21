import { formatDuration, svgDataUri } from "../lib/format";

const SIZE = 144;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n: number): string => String(n).padStart(2, "0");

/** Torn City Time (UTC) clock with the date and a countdown to the daily reset at midnight TCT. */
export function renderTctSvg(epochSeconds: number): string {
  const d = new Date(epochSeconds * 1000);
  const secondsToReset = 86400 - (Math.floor(epochSeconds) % 86400);

  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="#1c1e24"/>
  <text x="${SIZE / 2}" y="32" font-size="13" font-family="Arial, sans-serif" font-weight="bold" fill="#4fc3f7" text-anchor="middle" letter-spacing="2">TCT</text>
  <text x="${SIZE / 2}" y="76" font-size="30" font-family="Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}<tspan font-size="17" fill="#9a9ca5">:${pad(d.getUTCSeconds())}</tspan></text>
  <text x="${SIZE / 2}" y="98" font-size="12" font-family="Arial, sans-serif" fill="#9a9ca5" text-anchor="middle">${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}</text>
  <line x1="24" y1="108" x2="${SIZE - 24}" y2="108" stroke="#33353d" stroke-width="1"/>
  <text x="${SIZE / 2}" y="127" font-size="11" font-family="Arial, sans-serif" fill="#9a9ca5" text-anchor="middle">reset in ${formatDuration(secondsToReset)}</text>
</svg>`.trim());
}

/** Adds a small "TCT hh:mm" line along the top edge of an already-rendered key image (an SVG data URI). */
export function withTct(dataUri: string, epochSeconds: number, flash = false): string {
  const svg = Buffer.from(dataUri.split(",")[1], "base64").toString();
  const d = new Date(epochSeconds * 1000);
  const label = `<text x="${SIZE / 2}" y="16" font-size="11" font-family="Arial, sans-serif" font-weight="bold" fill="${flash ? "#1c1e24" : "#c4c7d0"}" text-anchor="middle">TCT ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}</text>`;
  return svgDataUri(svg.replace(/<\/svg>\s*$/, `${label}</svg>`));
}
